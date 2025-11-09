/**
 * Sistema completo de Audit Logging
 * Implementa logging automático e manual de ações do sistema
 */

import { supabase } from '@/integrations/supabase/client';
import { v4 as uuid } from 'uuid';

// Audit log types
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT'
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  oldData?: any;
  newData?: any;
  metadata?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  sessionId: string;
  success: boolean;
  error?: string;
}

export interface CreateAuditEntry {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldData?: any;
  newData?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success?: boolean;
  error?: string;
}

// Event bus para comunicação entre componentes
type EventCallback = (data: any) => void;
class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Audit logger service
class AuditLogger {
  private static instance: AuditLogger;
  private eventBus = new EventBus();
  private queue: AuditLog[] = [];
  private isProcessing = false;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Registrar evento de audit
   */
  async log(entry: CreateAuditEntry): Promise<void> {
    try {
      // Obter informações do usuário se não fornecidas
      const { data: { user } } = await supabase.auth.getUser();
      
      const auditEntry: AuditLog = {
        id: uuid(),
        userId: entry.userId || user?.id || null,
        userEmail: entry.userEmail || user?.email || null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId || null,
        oldData: entry.oldData,
        newData: entry.newData,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress || 'unknown',
        userAgent: entry.userAgent || navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: entry.sessionId || this.getSessionId(),
        success: entry.success !== false,
        error: entry.error
      };

      // Adicionar à fila para processamento
      this.queue.push(auditEntry);
      this.processQueue();

      // Emitir evento para subscribers
      this.eventBus.emit('audit-log-created', auditEntry);
      
    } catch (error) {
      console.error('Erro ao criar audit log:', error);
      // Tentar salvar em fallback
      this.saveToFallbackStorage(entry);
    }
  }

  /**
   * Registrar ação de usuário específica
   */
  async logUserAction(
    userId: string,
    action: AuditAction,
    resource: string,
    resourceId?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      metadata
    });
  }

  /**
   * Registrar mudança de dados
   */
  async logDataChange(
    userId: string,
    action: AuditAction,
    resource: string,
    resourceId: string,
    oldData: any,
    newData: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      oldData: this.sanitizeData(oldData),
      newData: this.sanitizeData(newData)
    });
  }

  /**
   * Registrar evento de login/logout
   */
  async logAuthEvent(
    action: AuditAction.LOGIN | AuditAction.LOGOUT,
    userId: string,
    userEmail: string,
    success: boolean = true,
    error?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      resource: 'auth',
      success,
      error,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });
  }

  /**
   * Registrar exportação
   */
  async logExport(
    userId: string,
    resource: string,
    format: 'csv' | 'pdf' | 'excel',
    recordCount: number
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.EXPORT,
      resource,
      metadata: {
        format,
        recordCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Registrar impressão
   */
  async logPrint(
    userId: string,
    resource: string,
    resourceId: string
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PRINT,
      resource,
      resourceId,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Processar fila de logs
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const entry = this.queue.shift()!;
      try {
        await this.saveToDatabase(entry);
      } catch (error) {
        console.error('Erro ao salvar audit log no banco:', error);
        // Tentar novamente em 5 segundos
        setTimeout(() => {
          this.queue.push(entry);
        }, 5000);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Salvar no banco de dados
   */
  private async saveToDatabase(entry: AuditLog): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: entry.userId,
        user_email: entry.userEmail,
        action: entry.action,
        entity_type: entry.resource,
        entity_id: entry.resourceId,
        old_data: entry.oldData,
        new_data: entry.newData,
        metadata: {
          ...entry.metadata,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          session_id: entry.sessionId,
          success: entry.success,
          error: entry.error
        },
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        created_at: entry.timestamp
      }]);

    if (error) {
      throw error;
    }
  }

  /**
   * Enviar para serviço externo de logging
   */
  private async sendToExternalService(entry: AuditLog): Promise<void> {
    // Implementar integração com serviço externo (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD && import.meta.env.VITE_EXTERNAL_LOGGING_URL) {
      try {
        await fetch(import.meta.env.VITE_EXTERNAL_LOGGING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service: 'audit-log',
            timestamp: entry.timestamp,
            data: entry
          })
        });
      } catch (error) {
        console.error('Erro ao enviar para serviço externo:', error);
      }
    }
  }

  /**
   * Salvar em storage de fallback
   */
  private saveToFallbackStorage(entry: CreateAuditEntry): void {
    try {
      const fallbackLogs = JSON.parse(
        localStorage.getItem('audit_fallback_logs') || '[]'
      );
      fallbackLogs.push({
        ...entry,
        fallback_timestamp: new Date().toISOString(),
        id: uuid()
      });

      // Manter apenas os últimos 100 logs
      const trimmedLogs = fallbackLogs.slice(-100);
      localStorage.setItem('audit_fallback_logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Erro ao salvar em fallback storage:', error);
    }
  }

  /**
   * Sanitizar dados sensíveis
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'credential',
      'auth'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Obter ID da sessão
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = uuid();
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Obter logs do banco
   */
  async getLogs(filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
    resource?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLog[]; total: number; hasMore: boolean }> {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .gte('created_at', filters.startDate || '1970-01-01')
      .lte('created_at', filters.endDate || new Date().toISOString())
      .eq('user_id', filters.userId || null)
      .eq('action', filters.action || null)
      .eq('entity_type', filters.resource || null)
      .order('created_at', { ascending: false })
      .range(
        filters.offset || 0,
        (filters.offset || 0) + (filters.limit || 100) - 1
      );

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
      hasMore: (data?.length || 0) >= (filters.limit || 100)
    };
  }

  /**
   * Obter todos os logs (para exportação)
   */
  async getAllLogs(filters: any = {}): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', filters.startDate || '1970-01-01')
      .lte('created_at', filters.endDate || new Date().toISOString())
      .eq('user_id', filters.userId || null)
      .eq('action', filters.action || null)
      .eq('entity_type', filters.resource || null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Registrar listener para eventos de audit
   */
  onAuditLogCreated(callback: EventCallback): void {
    this.eventBus.on('audit-log-created', callback);
  }

  /**
   * Remover listener
   */
  removeAuditLogListener(callback: EventCallback): void {
    // Implementar remoção do callback
  }
}

export const auditLogger = AuditLogger.getInstance();
export default auditLogger;