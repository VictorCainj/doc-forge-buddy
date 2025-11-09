/**
 * Sistema de Custom Error Tracking - Categorização e análise de erros
 * Implementa tracking avançado com categorização, análise de frequência e impacto
 */

// Import types
import type { SentryEvent } from '@sentry/react';
import { captureException, captureMessage, addBreadcrumb } from './sentry';
import { log } from '@/utils/logger';

// Tipos para categorização de erros
export interface ErrorContext {
  category: ErrorCategory;
  severity: ErrorSeverity;
  source: ErrorSource;
  userAction?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export type ErrorCategory = 
  | 'javascript' 
  | 'api' 
  | 'network' 
  | 'validation' 
  | 'performance' 
  | 'user_input' 
  | 'authentication' 
  | 'authorization' 
  | 'database' 
  | 'external_service' 
  | 'memory' 
  | 'browser_compatibility';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ErrorSource = 
  | 'component' 
  | 'hook' 
  | 'service' 
  | 'api_call' 
  | 'user_interaction' 
  | 'initialization' 
  | 'rendering' 
  | 'data_processing' 
  | 'external_dependency';

// Interface para estatísticas de erro
export interface ErrorStats {
  category: ErrorCategory;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedUsers: Set<string>;
  affectedSessions: Set<string>;
  averageRecoveryTime: number;
  resolved: boolean;
  trend: 'increasing' | 'stable' | 'decreasing';
}

// Mapa global de estatísticas de erro
const errorStatsMap = new Map<string, ErrorStats>();

// Configurações de thresholds para alertas
const ALERT_THRESHOLDS = {
  critical: 1,      // 1 erro crítico
  high: 5,          // 5 erros altos
  medium: 20,       // 20 erros médios
  low: 100,         // 100 erros baixos
};

// Configurações de categorização automática
const ERROR_PATTERNS = {
  javascript: [
    /TypeError/i,
    /ReferenceError/i,
    /SyntaxError/i,
    /RangeError/i,
    /EvalError/i,
    /URIError/i,
  ],
  network: [
    /NetworkError/i,
    /Failed to fetch/i,
    /Request timeout/i,
    /CORS/i,
  ],
  api: [
    /4\d\d/i,  // 400-499
    /5\d\d/i,  // 500-599
    /API.*error/i,
  ],
  validation: [
    /ValidationError/i,
    /Invalid.*input/i,
    /Required.*field/i,
  ],
  performance: [
    /Performance/i,
    /Slow operation/i,
    /Memory leak/i,
  ],
  authentication: [
    /Unauthorized/i,
    /Authentication failed/i,
    /Token.*expired/i,
  ],
  authorization: [
    /Forbidden/i,
    /Access denied/i,
    /Permission denied/i,
  ],
  memory: [
    /Out of memory/i,
    /Memory allocation failed/i,
    /Heap out of memory/i,
  ],
};

// Função para categorizar erros automaticamente
export function categorizeError(error: Error | string): ErrorCategory {
  const errorMessage = error instanceof Error ? error.message : error.toLowerCase();
  
  for (const [category, patterns] of Object.entries(ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(errorMessage)) {
        return category as ErrorCategory;
      }
    }
  }
  
  // Categorização por contexto
  if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
    return 'network';
  }
  
  if (errorMessage.includes('render') || errorMessage.includes('component')) {
    return 'javascript';
  }
  
  return 'javascript'; // default
}

// Função para determinar severidade baseada no contexto
export function determineSeverity(category: ErrorCategory, context?: Partial<ErrorContext>): ErrorSeverity {
  // Erros críticos sempre são high ou critical
  if (category === 'authentication' || category === 'authorization') {
    return 'critical';
  }
  
  if (category === 'memory' || category === 'performance') {
    return 'high';
  }
  
  if (category === 'user_input' || category === 'validation') {
    return 'medium';
  }
  
  // Determinar por contexto adicional
  if (context?.userAction === 'critical_operation') {
    return 'high';
  }
  
  if (context?.source === 'initialization') {
    return 'high';
  }
  
  return 'medium'; // default
}

// Função principal para tracking de erros
export function trackError(
  error: Error | string,
  context: Partial<ErrorContext> = {}
) {
  const category = context.category || categorizeError(error);
  const severity = context.severity || determineSeverity(category, context);
  const source = context.source || 'component';
  
  // Atualizar estatísticas
  updateErrorStats(error, category, severity, context);
  
  // Adicionar breadcrumb
  addBreadcrumb({
    message: `Tracked error: ${category}`,
    category: 'error',
    level: mapSeverityToLevel(severity),
    data: {
      category,
      severity,
      source,
      errorMessage: error instanceof Error ? error.message : error,
      ...context.additionalData,
    },
  });
  
  // Enviar para Sentry com contexto enriquecido
  if (error instanceof Error) {
    captureException(error, {
      category,
      severity,
      source,
      userAction: context.userAction,
      url: context.url || window.location.href,
      userAgent: context.userAgent || navigator.userAgent,
      userId: context.userId,
      sessionId: context.sessionId,
      ...context.additionalData,
    });
  } else {
    captureMessage(error, mapSeverityToLevel(severity));
  }
  
  // Verificar thresholds para alertas
  checkAlertThresholds(category, severity, context);
  
  // Log para desenvolvimento
  if (import.meta.env.DEV) {
    log.warn('Error tracked:', { 
      category, 
      severity, 
      source, 
      message: error instanceof Error ? error.message : error 
    });
  }
}

// Função para tracking de ações do usuário que podem causar erros
export function trackUserAction(
  action: string,
  success: boolean = true,
  additionalData?: Record<string, any>
) {
  addBreadcrumb({
    message: `User action: ${action}`,
    category: 'user',
    level: success ? 'info' : 'warning',
    data: {
      action,
      success,
      ...additionalData,
    },
  });
  
  if (!success) {
    captureMessage(`Failed user action: ${action}`, 'warning');
  }
}

// Função para tracking de performance e degradations
export function trackPerformanceIssue(
  metric: string,
  value: number,
  threshold: number,
  context?: Record<string, any>
) {
  const isDegraded = value > threshold;
  
  addBreadcrumb({
    message: `Performance metric: ${metric}`,
    category: 'performance',
    level: isDegraded ? 'warning' : 'info',
    data: {
      metric,
      value,
      threshold,
      degraded: isDegraded,
      ...context,
    },
  });
  
  if (isDegraded) {
    captureMessage(`Performance degradation: ${metric} = ${value} (threshold: ${threshold})`, 'warning');
  }
}

// Função para detectar memory leaks
export function trackMemoryUsage() {
  if (!(performance as any).memory) return;
  
  const memory = (performance as any).memory;
  const usedMB = memory.usedJSHeapSize / 1024 / 1024;
  const totalMB = memory.totalJSHeapSize / 1024 / 1024;
  const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
  
  // Alertas baseados em thresholds
  if (usedMB > limitMB * 0.9) {
    trackError('Critical memory usage', {
      category: 'memory',
      severity: 'critical',
      source: 'system',
      additionalData: {
        usedMB: Math.round(usedMB),
        totalMB: Math.round(totalMB),
        limitMB: Math.round(limitMB),
        usagePercent: Math.round((usedMB / limitMB) * 100),
      },
    });
  } else if (usedMB > limitMB * 0.7) {
    trackError('High memory usage', {
      category: 'memory',
      severity: 'high',
      source: 'system',
      additionalData: {
        usedMB: Math.round(usedMB),
        totalMB: Math.round(totalMB),
        limitMB: Math.round(limitMB),
        usagePercent: Math.round((usedMB / limitMB) * 100),
      },
    });
  }
}

// Função para tracking de API errors
export function trackApiError(
  endpoint: string,
  method: string,
  status: number,
  responseTime?: number,
  error?: any
) {
  const category: ErrorCategory = status >= 500 ? 'api' : status >= 400 ? 'validation' : 'network';
  const severity: ErrorSeverity = status >= 500 ? 'high' : status >= 400 ? 'medium' : 'low';
  
  const context: Partial<ErrorContext> = {
    category,
    severity,
    source: 'api_call',
    additionalData: {
      endpoint,
      method,
      status,
      responseTime,
    },
  };
  
  if (error) {
    trackError(error, context);
  } else {
    trackError(`API Error: ${method} ${endpoint} - ${status}`, context);
  }
}

// Função para tracking de validation errors
export function trackValidationError(
  field: string,
  value: any,
  rule: string,
  context?: Record<string, any>
) {
  trackError(`Validation error: ${field} - ${rule}`, {
    category: 'validation',
    severity: 'low',
    source: 'user_input',
    userAction: 'form_submission',
    additionalData: {
      field,
      value: String(value).substring(0, 100), // Truncar para privacy
      rule,
      ...context,
    },
  });
}

// Funções auxiliares
function mapSeverityToLevel(severity: ErrorSeverity): 'fatal' | 'error' | 'warning' | 'info' {
  const mapping = {
    critical: 'fatal',
    high: 'error',
    medium: 'warning',
    low: 'warning',
    info: 'info',
  };
  return mapping[severity];
}

function updateErrorStats(
  error: Error | string,
  category: ErrorCategory,
  severity: ErrorSeverity,
  context: Partial<ErrorContext>
) {
  const errorKey = `${category}_${error instanceof Error ? error.message : error}`;
  const existing = errorStatsMap.get(errorKey);
  
  if (existing) {
    existing.count++;
    existing.lastOccurrence = new Date();
    if (context.userId) {
      existing.affectedUsers.add(context.userId);
    }
    if (context.sessionId) {
      existing.affectedSessions.add(context.sessionId);
    }
    existing.trend = existing.count > 10 ? 'increasing' : 'stable';
  } else {
    errorStatsMap.set(errorKey, {
      category,
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      affectedUsers: new Set(context.userId ? [context.userId] : []),
      affectedSessions: new Set(context.sessionId ? [context.sessionId] : []),
      averageRecoveryTime: 0,
      resolved: false,
      trend: 'stable',
    });
  }
}

function checkAlertThresholds(
  category: ErrorCategory,
  severity: ErrorSeverity,
  context: Partial<ErrorContext>
) {
  const stats = Array.from(errorStatsMap.values())
    .filter(s => s.category === category);
  
  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
  const threshold = ALERT_THRESHOLDS[severity];
  
  if (totalCount >= threshold) {
    captureMessage(
      `Alert threshold reached for ${category} errors: ${totalCount} occurrences`,
      severity === 'critical' ? 'fatal' : 'error'
    );
  }
}

// Função para obter estatísticas de erros
export function getErrorStats(): ErrorStats[] {
  return Array.from(errorStatsMap.values());
}

// Função para obter erros por categoria
export function getErrorsByCategory(category: ErrorCategory): ErrorStats[] {
  return getErrorStats().filter(stat => stat.category === category);
}

// Função para obter erros críticos
export function getCriticalErrors(): ErrorStats[] {
  return getErrorStats().filter(stat => stat.trend === 'increasing');
}

// Cleanup function
export function cleanupErrorStats() {
  errorStatsMap.clear();
}

// Inicializar monitoramento automático
export function initErrorTracking() {
  // Monitor memory usage periodically
  setInterval(trackMemoryUsage, 30000); // every 30 seconds
  
  // Monitor performance metrics
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(trackMemoryUsage, 5000); // after page load
    });
  }
  
  if (import.meta.env.DEV) {
    log.info('Error tracking initialized');
  }
}