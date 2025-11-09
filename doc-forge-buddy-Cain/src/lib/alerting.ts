/**
 * Sistema de Alerting e Notifications
 * Implementa alertas em tempo real via Slack, email, dashboard e outros canais
 */

import { captureMessage } from './sentry';
import { getErrorStats, type ErrorStats } from './errorTracking';
import { log } from '@/utils/logger';

// Configurações de alertas
export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: AlertThresholds;
  cooldown: number; // minutes
}

export interface AlertChannel {
  type: 'slack' | 'email' | 'dashboard' | 'webhook' | 'teams';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertThresholds {
  critical: number;  // errors per hour
  high: number;      // errors per hour
  medium: number;    // errors per hour
  low: number;       // errors per hour
  error_rate: number; // percentage
  response_time: number; // ms
  memory_usage: number; // percentage
}

export interface AlertEvent {
  id: string;
  type: AlertType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  data: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  channels: string[];
}

export type AlertType = 
  | 'error_spike' 
  | 'performance_degradation' 
  | 'memory_leak' 
  | 'api_failure' 
  | 'user_impact' 
  | 'security_breach' 
  | 'system_overload';

// Store de alertas ativos
const activeAlerts = new Map<string, AlertEvent>();
const alertHistory: AlertEvent[] = [];
const lastAlertTimes = new Map<string, Date>();

// Configuração padrão
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: import.meta.env.PROD, // Only enable in production
  channels: [
    {
      type: 'dashboard',
      config: {
        realtime: true,
        showResolved: false,
      },
      enabled: true,
    },
    {
      type: 'slack',
      config: {
        webhookUrl: import.meta.env.VITE_SLACK_WEBHOOK_URL,
        channel: '#alerts',
        mentionOnCall: true,
      },
      enabled: !!import.meta.env.VITE_SLACK_WEBHOOK_URL,
    },
    {
      type: 'webhook',
      config: {
        url: import.meta.env.VITE_ALERT_WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      enabled: !!import.meta.env.VITE_ALERT_WEBHOOK_URL,
    },
  ],
  thresholds: {
    critical: 1,    // 1 critical error
    high: 10,       // 10 high severity errors
    medium: 50,     // 50 medium severity errors
    low: 200,       // 200 low severity errors
    error_rate: 5,  // 5% error rate
    response_time: 5000, // 5 seconds
    memory_usage: 85,    // 85% memory usage
  },
  cooldown: 15, // 15 minutes
};

// Estado global de alertas (para dashboard)
class AlertState {
  private listeners: Set<(alerts: AlertEvent[]) => void> = new Set();
  
  getAlerts(): AlertEvent[] {
    return Array.from(activeAlerts.values());
  }
  
  getAlertHistory(limit = 100): AlertEvent[] {
    return alertHistory.slice(-limit);
  }
  
  subscribe(listener: (alerts: AlertEvent[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify() {
    const alerts = this.getAlerts();
    this.listeners.forEach(listener => listener(alerts));
  }
}

export const alertState = new AlertState();

// Função principal para verificar e enviar alertas
export function checkAndSendAlerts() {
  if (!DEFAULT_ALERT_CONFIG.enabled) return;
  
  const errorStats = getErrorStats();
  const now = new Date();
  
  // Verificar spikes de erro
  checkErrorSpikes(errorStats, now);
  
  // Verificar performance
  checkPerformanceIssues(now);
  
  // Verificar memory leaks
  checkMemoryLeaks(now);
  
  // Verificar user impact
  checkUserImpact(errorStats, now);
  
  alertState.notify();
}

// Verificar spikes de erro
function checkErrorSpikes(errorStats: ErrorStats[], now: Date) {
  const categories = ['javascript', 'api', 'network', 'validation'] as const;
  
  for (const category of categories) {
    const categoryErrors = errorStats.filter(stat => stat.category === category);
    const totalCount = categoryErrors.reduce((sum, stat) => sum + stat.count, 0);
    
    let severity: AlertEvent['severity'] = 'low';
    let threshold = DEFAULT_ALERT_CONFIG.thresholds.low;
    
    if (totalCount >= DEFAULT_ALERT_CONFIG.thresholds.critical) {
      severity = 'critical';
      threshold = DEFAULT_ALERT_CONFIG.thresholds.critical;
    } else if (totalCount >= DEFAULT_ALERT_CONFIG.thresholds.high) {
      severity = 'high';
      threshold = DEFAULT_ALERT_CONFIG.thresholds.high;
    } else if (totalCount >= DEFAULT_ALERT_CONFIG.thresholds.medium) {
      severity = 'medium';
      threshold = DEFAULT_ALERT_CONFIG.thresholds.medium;
    }
    
    if (totalCount >= threshold) {
      const alertKey = `error_spike_${category}`;
      
      if (shouldSendAlert(alertKey)) {
        const alert: AlertEvent = {
          id: `${alertKey}_${now.getTime()}`,
          type: 'error_spike',
          severity,
          title: `Error Spike Detected`,
          message: `${totalCount} ${category} errors detected in the last hour`,
          data: {
            category,
            count: totalCount,
            threshold,
            affectedUsers: getTotalAffectedUsers(categoryErrors),
            errorDetails: categoryErrors.slice(0, 5),
          },
          timestamp: now,
          resolved: false,
          channels: ['slack', 'dashboard'],
        };
        
        sendAlert(alert);
        recordAlert(alert);
        lastAlertTimes.set(alertKey, now);
      }
    }
  }
}

// Verificar problemas de performance
function checkPerformanceIssues(now: Date) {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return;
  
  const loadTime = navigation.loadEventEnd - navigation.navigationStart;
  const responseTime = navigation.responseStart - navigation.requestStart;
  
  if (loadTime > DEFAULT_ALERT_CONFIG.thresholds.response_time) {
    const alertKey = `performance_load_time`;
    
    if (shouldSendAlert(alertKey)) {
      const alert: AlertEvent = {
        id: `${alertKey}_${now.getTime()}`,
        type: 'performance_degradation',
        severity: loadTime > DEFAULT_ALERT_CONFIG.thresholds.response_time * 2 ? 'high' : 'medium',
        title: `Slow Page Load`,
        message: `Page load time: ${Math.round(loadTime)}ms (threshold: ${DEFAULT_ALERT_CONFIG.thresholds.response_time}ms)`,
        data: {
          loadTime,
          responseTime,
          threshold: DEFAULT_ALERT_CONFIG.thresholds.response_time,
        },
        timestamp: now,
        resolved: false,
        channels: ['dashboard', 'webhook'],
      };
      
      sendAlert(alert);
      recordAlert(alert);
      lastAlertTimes.set(alertKey, now);
    }
  }
}

// Verificar memory leaks
function checkMemoryLeaks(now: Date) {
  if (!(performance as any).memory) return;
  
  const memory = (performance as any).memory;
  const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  
  if (usedPercent > DEFAULT_ALERT_CONFIG.thresholds.memory_usage) {
    const alertKey = `memory_leak`;
    
    if (shouldSendAlert(alertKey)) {
      const alert: AlertEvent = {
        id: `${alertKey}_${now.getTime()}`,
        type: 'memory_leak',
        severity: usedPercent > 90 ? 'critical' : 'high',
        title: `High Memory Usage`,
        message: `Memory usage: ${usedPercent.toFixed(1)}% (threshold: ${DEFAULT_ALERT_CONFIG.thresholds.memory_usage}%)`,
        data: {
          usedPercent,
          usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          totalMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        },
        timestamp: now,
        resolved: false,
        channels: ['slack', 'dashboard', 'webhook'],
      };
      
      sendAlert(alert);
      recordAlert(alert);
      lastAlertTimes.set(alertKey, now);
    }
  }
}

// Verificar impacto do usuário
function checkUserImpact(errorStats: ErrorStats[], now: Date) {
  const criticalErrors = errorStats.filter(stat => 
    stat.affectedUsers.size > 10 || stat.affectedSessions.size > 50
  );
  
  if (criticalErrors.length > 0) {
    const alertKey = `user_impact`;
    
    if (shouldSendAlert(alertKey)) {
      const totalAffectedUsers = getTotalAffectedUsers(criticalErrors);
      const totalAffectedSessions = getTotalAffectedSessions(criticalErrors);
      
      const alert: AlertEvent = {
        id: `${alertKey}_${now.getTime()}`,
        type: 'user_impact',
        severity: totalAffectedUsers > 100 ? 'critical' : 'high',
        title: `High User Impact`,
        message: `${totalAffectedUsers} users affected by ${criticalErrors.length} error types`,
        data: {
          affectedUsers: totalAffectedUsers,
          affectedSessions: totalAffectedSessions,
          errorTypes: criticalErrors.length,
          details: criticalErrors.slice(0, 3),
        },
        timestamp: now,
        resolved: false,
        channels: ['slack', 'dashboard', 'webhook'],
      };
      
      sendAlert(alert);
      recordAlert(alert);
      lastAlertTimes.set(alertKey, now);
    }
  }
}

// Função para enviar alertas pelos diferentes canais
async function sendAlert(alert: AlertEvent) {
  log.warn('Sending alert:', { type: alert.type, severity: alert.severity, message: alert.message });
  
  for (const channelConfig of DEFAULT_ALERT_CONFIG.channels) {
    if (!channelConfig.enabled || !alert.channels.includes(channelConfig.type)) {
      continue;
    }
    
    try {
      switch (channelConfig.type) {
        case 'slack':
          await sendSlackAlert(alert, channelConfig.config);
          break;
        case 'dashboard':
          sendDashboardAlert(alert, channelConfig.config);
          break;
        case 'webhook':
          await sendWebhookAlert(alert, channelConfig.config);
          break;
        case 'teams':
          await sendTeamsAlert(alert, channelConfig.config);
          break;
        case 'email':
          await sendEmailAlert(alert, channelConfig.config);
          break;
      }
    } catch (error) {
      log.error(`Failed to send alert via ${channelConfig.type}:`, error);
    }
  }
}

// Implementações específicas por canal
async function sendSlackAlert(alert: AlertEvent, config: any) {
  if (!config.webhookUrl) return;
  
  const color = {
    critical: 'danger',
    high: 'warning',
    medium: '#ffaa00',
    low: 'good',
  }[alert.severity];
  
  const payload = {
    channel: config.channel || '#alerts',
    username: 'ErrorBot',
    icon_emoji: ':warning:',
    attachments: [
      {
        color,
        title: alert.title,
        text: alert.message,
        fields: Object.entries(alert.data).map(([key, value]) => ({
          title: key,
          value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
          short: true,
        })),
        ts: Math.floor(alert.timestamp.getTime() / 1000),
      },
    ],
  };
  
  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Slack API responded with status ${response.status}`);
  }
}

function sendDashboardAlert(alert: AlertEvent, config: any) {
  activeAlerts.set(alert.id, alert);
}

async function sendWebhookAlert(alert: AlertEvent, config: any) {
  if (!config.url) return;
  
  const payload = {
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    data: alert.data,
    timestamp: alert.timestamp.toISOString(),
  };
  
  const response = await fetch(config.url, {
    method: 'POST',
    headers: config.headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Webhook responded with status ${response.status}`);
  }
}

async function sendTeamsAlert(alert: AlertEvent, config: any) {
  if (!config.webhookUrl) return;
  
  const payload = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    themeColor: {
      critical: 'FF0000',
      high: 'FF6600',
      medium: 'FFAA00',
      low: '00FF00',
    }[alert.severity],
    summary: alert.title,
    sections: [
      {
        activityTitle: alert.title,
        activitySubtitle: alert.message,
        facts: Object.entries(alert.data).map(([key, value]) => ({
          name: key,
          value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
        })),
        markdown: true,
      },
    ],
  };
  
  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Teams API responded with status ${response.status}`);
  }
}

async function sendEmailAlert(alert: AlertEvent, config: any) {
  // Implementation would depend on email service (SendGrid, AWS SES, etc.)
  // For now, just log the email content
  log.info('Email alert would be sent:', {
    to: config.to,
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    body: alert.message,
    data: alert.data,
  });
}

// Funções auxiliares
function shouldSendAlert(alertKey: string): boolean {
  const lastTime = lastAlertTimes.get(alertKey);
  const cooldown = DEFAULT_ALERT_CONFIG.cooldown * 60 * 1000; // convert to ms
  
  if (!lastTime) return true;
  
  return Date.now() - lastTime.getTime() > cooldown;
}

function getTotalAffectedUsers(errorStats: ErrorStats[]): number {
  const users = new Set<string>();
  errorStats.forEach(stat => {
    stat.affectedUsers.forEach(user => users.add(user));
  });
  return users.size;
}

function getTotalAffectedSessions(errorStats: ErrorStats[]): number {
  const sessions = new Set<string>();
  errorStats.forEach(stat => {
    stat.affectedSessions.forEach(session => sessions.add(session));
  });
  return sessions.size;
}

function recordAlert(alert: AlertEvent) {
  alertHistory.push(alert);
  
  // Manter apenas os últimos 1000 alertas
  if (alertHistory.length > 1000) {
    alertHistory.shift();
  }
}

// Função para resolver alertas
export function resolveAlert(alertId: string) {
  const alert = activeAlerts.get(alertId);
  if (alert) {
    alert.resolved = true;
    activeAlerts.delete(alertId);
    alertState.notify();
  }
}

// Função para obter configuração de alertas
export function getAlertConfig(): AlertConfig {
  return { ...DEFAULT_ALERT_CONFIG };
}

// Função para atualizar configuração de alertas
export function updateAlertConfig(config: Partial<AlertConfig>) {
  Object.assign(DEFAULT_ALERT_CONFIG, config);
  log.info('Alert config updated');
}

// Inicializar sistema de alertas
export function initAlerting() {
  if (!DEFAULT_ALERT_CONFIG.enabled) {
    log.info('Alerting system disabled');
    return;
  }
  
  // Verificar alertas periodicamente
  setInterval(checkAndSendAlerts, 60000); // every minute
  
  // Verificação inicial
  setTimeout(checkAndSendAlerts, 5000); // after 5 seconds
  
  log.info('Alerting system initialized');
}