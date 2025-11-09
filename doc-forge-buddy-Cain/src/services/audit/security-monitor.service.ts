/**
 * Sistema de monitoring de segurança
 * Detecta atividades suspeitas e gera alertas
 */

import { auditLogger, AuditAction } from './audit-logger.service';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'unauthorized_access' | 'bulk_operation' | 'suspicious_pattern' | 'data_exfiltration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  userId?: string;
  ipAddress: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface SuspiciousActivity {
  userId: string;
  ipAddress: string;
  activity: string;
  count: number;
  timeWindow: number; // em minutos
  lastOccurrence: string;
}

class SecurityMonitor {
  private alerts: SecurityAlert[] = [];
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Iniciar monitoramento
   */
  start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('Security monitor já está rodando');
      return;
    }

    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.checkForSuspiciousActivity();
    }, intervalMinutes * 60 * 1000);

    console.log(`Security monitor iniciado - verificação a cada ${intervalMinutes} minutos`);
  }

  /**
   * Parar monitoramento
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Security monitor parado');
  }

  /**
   * Verificar atividades suspeitas
   */
  async checkForSuspiciousActivity(): Promise<void> {
    try {
      await Promise.all([
        this.checkFailedLogins(),
        this.checkUnauthorizedAccess(),
        this.checkBulkOperations(),
        this.checkSuspiciousPatterns(),
        this.checkDataExfiltration()
      ]);
    } catch (error) {
      console.error('Erro ao verificar atividades suspeitas:', error);
    }
  }

  /**
   * Verificar tentativas de login falhadas
   */
  private async checkFailedLogins(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: failedLogins, error } = await supabase
      .from('audit_logs')
      .select('user_id, ip_address, user_agent')
      .eq('action', 'LOGIN')
      .eq('success', false)
      .gte('created_at', oneHourAgo);

    if (error) {
      console.error('Erro ao buscar logins falhados:', error);
      return;
    }

    if (!failedLogins || failedLogins.length === 0) {
      return;
    }

    // Agrupar por IP
    const ipGroups = this.groupBy(failedLogins, 'ip_address');
    
    for (const [ipAddress, attempts] of Object.entries(ipGroups)) {
      if (attempts.length > 10) {
        await this.createAlert({
          type: 'failed_login',
          severity: 'high',
          message: `Múltiplas tentativas de login falhadas detectadas do IP ${ipAddress}`,
          details: {
            ipAddress,
            attempts: attempts.length,
            userAgents: [...new Set(attempts.map((a: any) => a.user_agent))],
            timeWindow: '1 hora'
          },
          ipAddress
        });
      }
    }
  }

  /**
   * Verificar acessos não autorizados
   */
  private async checkUnauthorizedAccess(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Assumindo que há uma tabela de tentativas de acesso
    // ou we pode usar logs de audit com erro
    const { data: unauthorizedAttempts, error } = await supabase
      .from('audit_logs')
      .select('user_id, ip_address, user_agent, resource, error')
      .eq('action', 'READ')
      .not('user_id', 'is', null)
      .gte('created_at', oneHourAgo)
      .like('error', '%403%');

    if (error) {
      console.error('Erro ao buscar acessos não autorizados:', error);
      return;
    }

    if (!unauthorizedAttempts || unauthorizedAttempts.length === 0) {
      return;
    }

    // Agrupar por usuário
    const userGroups = this.groupBy(unauthorizedAttempts, 'user_id');
    
    for (const [userId, attempts] of Object.entries(userGroups)) {
      if (attempts.length > 5) {
        const uniqueIPs = new Set(attempts.map((a: any) => a.ip_address));
        
        await this.createAlert({
          type: 'unauthorized_access',
          severity: 'medium',
          message: `Usuário ${userId} tentou acessar recursos sem permissão ${attempts.length} vezes`,
          details: {
            userId,
            attempts: attempts.length,
            uniqueIPs: Array.from(uniqueIPs),
            resources: [...new Set(attempts.map((a: any) => a.resource))]
          },
          userId,
          ipAddress: attempts[0].ip_address
        });
      }
    }
  }

  /**
   * Verificar operações em massa suspeitas
   */
  private async checkBulkOperations(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: bulkOps, error } = await supabase
      .from('audit_logs')
      .select('user_id, metadata, ip_address')
      .eq('action', 'UPDATE')
      .gte('created_at', oneHourAgo)
      .contains('metadata', { operation: 'bulk' });

    if (error) {
      console.error('Erro ao buscar operações em massa:', error);
      return;
    }

    if (!bulkOps || bulkOps.length === 0) {
      return;
    }

    // Agrupar por usuário
    const userGroups = this.groupBy(bulkOps, 'user_id');
    
    for (const [userId, operations] of Object.entries(userGroups)) {
      const totalRecords = operations.reduce((sum: number, op: any) => {
        return sum + (op.metadata?.recordCount || 0);
      }, 0);

      if (totalRecords > 1000) {
        await this.createAlert({
          type: 'bulk_operation',
          severity: 'medium',
          message: `Operação em massa suspeita detectada: ${totalRecords} registros modificados`,
          details: {
            userId,
            totalRecords,
            operationCount: operations.length,
            operations: operations.map((op: any) => ({
              timestamp: op.created_at,
              recordCount: op.metadata?.recordCount
            }))
          },
          userId,
          ipAddress: operations[0].ip_address
        });
      }
    }
  }

  /**
   * Verificar padrões suspeitos
   */
  private async checkSuspiciousPatterns(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Verificar se o mesmo IP está tentando muitos endpoints diferentes
    const { data: activities, error } = await supabase
      .from('audit_logs')
      .select('ip_address, resource, user_agent')
      .gte('created_at', oneHourAgo);

    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return;
    }

    if (!activities || activities.length === 0) {
      return;
    }

    // Agrupar por IP
    const ipGroups = this.groupBy(activities, 'ip_address');
    
    for (const [ipAddress, activities] of Object.entries(ipGroups)) {
      const uniqueResources = new Set(activities.map((a: any) => a.resource));
      const uniqueUserAgents = new Set(activities.map((a: any) => a.user_agent));
      
      // Se um IP tentou acessar mais de 20 recursos diferentes em 1 hora
      if (uniqueResources.size > 20 && uniqueUserAgents.size === 1) {
        await this.createAlert({
          type: 'suspicious_pattern',
          severity: 'high',
          message: `Padrão de scanning detectado no IP ${ipAddress}`,
          details: {
            ipAddress,
            resourcesAttempted: uniqueResources.size,
            uniqueResources: Array.from(uniqueResources),
            userAgent: Array.from(uniqueUserAgents)[0],
            totalRequests: activities.length
          },
          ipAddress
        });
      }
    }
  }

  /**
   * Verificar exfiltração de dados
   */
  private async checkDataExfiltration(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Verificar exportações grandes
    const { data: exports, error } = await supabase
      .from('audit_logs')
      .select('user_id, metadata, ip_address')
      .eq('action', 'EXPORT')
      .gte('created_at', oneHourAgo);

    if (error) {
      console.error('Erro ao buscar exportações:', error);
      return;
    }

    if (!exports || exports.length === 0) {
      return;
    }

    for (const exportOp of exports) {
      const recordCount = exportOp.metadata?.recordCount || 0;
      
      if (recordCount > 5000) {
        await this.createAlert({
          type: 'data_exfiltration',
          severity: 'critical',
          message: `Exportação可疑 de ${recordCount} registros detectada`,
          details: {
            userId: exportOp.user_id,
            recordCount,
            exportFormat: exportOp.metadata?.format,
            ipAddress: exportOp.ip_address,
            timestamp: exportOp.created_at
          },
          userId: exportOp.user_id,
          ipAddress: exportOp.ip_address
        });
      }
    }
  }

  /**
   * Criar alerta de segurança
   */
  private async createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);
    
    // Log no audit
    await auditLogger.log({
      action: AuditAction.UPDATE,
      resource: 'security_monitor',
      userId: alert.userId,
      metadata: {
        alertType: alert.type,
        severity: alert.severity,
        message: alert.message,
        details: alert.details
      }
    });

    // Enviar notificações
    await this.sendNotifications(alert);
    
    console.warn(`ALERTA DE SEGURANÇA [${alert.severity.toUpperCase()}]: ${alert.message}`);
  }

  /**
   * Enviar notificações de alerta
   */
  private async sendNotifications(alert: SecurityAlert): Promise<void> {
    // Notificação por email para alertas críticos
    if (alert.severity === 'critical') {
      await this.sendEmailAlert(alert);
    }
    
    // Notificação por Slack/Discord (se configurado)
    if (import.meta.env.VITE_SLACK_WEBHOOK_URL) {
      await this.sendSlackAlert(alert);
    }
    
    // Notificação no navegador para alertas highs
    if (alert.severity === 'high') {
      this.showBrowserNotification(alert);
    }
  }

  /**
   * Enviar alerta por email
   */
  private async sendEmailAlert(alert: SecurityAlert): Promise<void> {
    // Implementar integração com serviço de email
    if (import.meta.env.VITE_EMAIL_SERVICE_URL) {
      try {
        await fetch(import.meta.env.VITE_EMAIL_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: import.meta.env.VITE_ADMIN_EMAIL,
            subject: `🚨 Alerta de Segurança - ${alert.severity.toUpperCase()}`,
            html: this.generateEmailTemplate(alert)
          })
        });
      } catch (error) {
        console.error('Erro ao enviar email de alerta:', error);
      }
    }
  }

  /**
   * Enviar alerta para Slack
   */
  private async sendSlackAlert(alert: SecurityAlert): Promise<void> {
    try {
      const color = {
        low: '#36a64f',
        medium: '#ff9f00', 
        high: '#ff6b6b',
        critical: '#dc3545'
      }[alert.severity];

      const emoji = {
        low: '🟢',
        medium: '🟡',
        high: '🟠', 
        critical: '🔴'
      }[alert.severity];

      await fetch(import.meta.env.VITE_SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attachments: [{
            color,
            title: `${emoji} Alerta de Segurança`,
            text: alert.message,
            fields: [
              {
                title: 'Severidade',
                value: alert.severity.toUpperCase(),
                short: true
              },
              {
                title: 'Tipo',
                value: alert.type,
                short: true
              },
              {
                title: 'IP',
                value: alert.ipAddress,
                short: true
              },
              {
                title: 'Usuário',
                value: alert.userId || 'N/A',
                short: true
              }
            ],
            ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
          }]
        })
      });
    } catch (error) {
      console.error('Erro ao enviar Slack alert:', error);
    }
  }

  /**
   * Mostrar notificação no navegador
   */
  private showBrowserNotification(alert: SecurityAlert): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🚨 Alerta de Segurança`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id
      });
    }
  }

  /**
   * Gerar template de email
   */
  private generateEmailTemplate(alert: SecurityAlert): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${alert.severity === 'critical' ? '#dc3545' : '#ffc107'};">
          🚨 Alerta de Segurança - ${alert.severity.toUpperCase()}
        </h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Detalhes do Alerta</h3>
          <p><strong>Mensagem:</strong> ${alert.message}</p>
          <p><strong>Tipo:</strong> ${alert.type}</p>
          <p><strong>Severidade:</strong> ${alert.severity}</p>
          <p><strong>IP:</strong> ${alert.ipAddress}</p>
          <p><strong>Usuário:</strong> ${alert.userId || 'N/A'}</p>
          <p><strong>Timestamp:</strong> ${new Date(alert.timestamp).toLocaleString('pt-BR')}</p>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px;">
          <h4>Detalhes Técnicos:</h4>
          <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto;">
            ${JSON.stringify(alert.details, null, 2)}
          </pre>
        </div>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">
          Este é um alerta automático do sistema de monitoramento de segurança.
        </p>
      </div>
    `;
  }

  /**
   * Configurar event listeners
   */
  private setupEventListeners(): void {
    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  /**
   * Agrupar array por propriedade
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const group = String(item[key]);
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): SecurityAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolver alerta
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date().toISOString();

      // Log da resolução
      await auditLogger.log({
        action: AuditAction.UPDATE,
        resource: 'security_monitor',
        metadata: {
          action: 'alert_resolved',
          alertId,
          resolvedBy
        }
      });
    }
  }

  /**
   * Obter estatísticas de segurança
   */
  getSecurityStats(): {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
  } {
    const activeAlerts = this.getActiveAlerts();
    const resolvedAlerts = this.alerts.filter(a => a.resolved);

    return {
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      alertsByType: this.groupBy(this.alerts, 'type') as Record<string, number>,
      alertsBySeverity: this.groupBy(this.alerts, 'severity') as Record<string, number>
    };
  }
}

export const securityMonitor = new SecurityMonitor();
export default securityMonitor;