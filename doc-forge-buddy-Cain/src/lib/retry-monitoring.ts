/**
 * Sistema de Monitoramento e Alerting para Retry Logic e Error Handling
 */

import { queryMonitor } from './queryMonitor';
import { CircuitBreaker, ApplicationError, ErrorType } from './retry-system';

// ===========================================
// 1. MÉTRICAS DE MONITORAMENTO
// ===========================================

export interface RetryMetrics {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  avgRetryDelay: number;
  maxRetryAttempts: number;
  errorTypeDistribution: Record<ErrorType, number>;
  circuitBreakerState: Record<string, {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    lastFailureTime?: Date;
  }>;
}

export interface PerformanceMetrics {
  retryOverhead: number; // Tempo adicional causado por retries
  circuitBreakerImpact: number; // Tempo economizado pelo circuit breaker
  errorRecoveryRate: number; // % de erros recuperados com sucesso
  fallbacksActivated: number; // Número de fallbacks acionados
}

// ===========================================
// 2. MONITOR DE RETRY
// ===========================================

class RetryMonitor {
  private metrics: RetryMetrics = {
    totalAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    avgRetryDelay: 0,
    maxRetryAttempts: 0,
    errorTypeDistribution: {} as Record<ErrorType, number>,
    circuitBreakerState: {}
  };

  private performanceMetrics: PerformanceMetrics = {
    retryOverhead: 0,
    circuitBreakerImpact: 0,
    errorRecoveryRate: 0,
    fallbacksActivated: 0
  };

  private alerts: Array<{
    type: 'error_rate' | 'circuit_breaker' | 'performance' | 'recovery';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    data?: any;
  }> = [];

  private alertThresholds = {
    errorRate: 0.1, // 10% de erro
    circuitBreakerOpenTime: 300000, // 5 minutos
    retryOverhead: 0.3, // 30% de overhead
    recoveryRate: 0.7 // 70% de taxa de recuperação
  };

  // Registrar tentativa de retry
  recordRetryAttempt(error: ApplicationError, attempt: number, delay: number) {
    this.metrics.totalAttempts++;
    this.metrics.errorTypeDistribution[error.errorType] = 
      (this.metrics.errorTypeDistribution[error.errorType] || 0) + 1;

    // Atualizar média de delay
    this.metrics.avgRetryDelay = 
      (this.metrics.avgRetryDelay + delay) / 2;

    // Atualizar máximo de tentativas
    if (attempt > this.metrics.maxRetryAttempts) {
      this.metrics.maxRetryAttempts = attempt;
    }

    this.logRetryEvent('retry_attempt_recorded', {
      errorType: error.errorType,
      attempt,
      delay,
      timestamp: new Date()
    });

    this.checkAlerts();
  }

  // Registrar sucesso de retry
  recordRetrySuccess(attempt: number, totalDelay: number) {
    this.metrics.successfulRetries++;
    
    this.performanceMetrics.retryOverhead = 
      (this.performanceMetrics.retryOverhead + totalDelay) / 2;

    this.logRetryEvent('retry_success_recorded', {
      attempt,
      totalDelay,
      timestamp: new Date()
    });
  }

  // Registrar falha de retry
  recordRetryFailure(error: ApplicationError, attempts: number) {
    this.metrics.failedRetries++;
    
    this.logRetryEvent('retry_failure_recorded', {
      errorType: error.errorType,
      attempts,
      timestamp: new Date()
    });

    this.checkAlerts();
  }

  // Atualizar estado do circuit breaker
  updateCircuitBreakerState(name: string, state: any) {
    this.metrics.circuitBreakerState[name] = state;

    // Verificar se o circuit breaker está aberto por muito tempo
    if (state.state === 'OPEN' && state.lastFailureTime) {
      const openTime = Date.now() - state.lastFailureTime.getTime();
      if (openTime > this.alertThresholds.circuitBreakerOpenTime) {
        this.addAlert({
          type: 'circuit_breaker',
          message: `Circuit breaker ${name} has been OPEN for ${Math.round(openTime / 1000)}s`,
          severity: 'high',
          timestamp: new Date(),
          data: { name, openTime, state }
        });
      }
    }

    this.logRetryEvent('circuit_breaker_state_updated', {
      name,
      state,
      timestamp: new Date()
    });
  }

  // Calcular taxa de recuperação
  private calculateRecoveryRate(): number {
    if (this.metrics.totalAttempts === 0) return 0;
    return this.metrics.successfulRetries / this.metrics.totalAttempts;
  }

  // Verificar alertas
  private checkAlerts() {
    const recoveryRate = this.calculateRecoveryRate();
    this.performanceMetrics.errorRecoveryRate = recoveryRate;

    // Alerta de taxa de recuperação baixa
    if (recoveryRate < this.alertThresholds.recoveryRate && this.metrics.totalAttempts > 10) {
      this.addAlert({
        type: 'recovery',
        message: `Low error recovery rate: ${(recoveryRate * 100).toFixed(1)}%`,
        severity: 'medium',
        timestamp: new Date(),
        data: { recoveryRate, totalAttempts: this.metrics.totalAttempts }
      });
    }

    // Alerta de overhead alto
    if (this.performanceMetrics.retryOverhead > this.alertThresholds.retryOverhead) {
      this.addAlert({
        type: 'performance',
        message: `High retry overhead: ${(this.performanceMetrics.retryOverhead * 100).toFixed(1)}%`,
        severity: 'medium',
        timestamp: new Date(),
        data: { retryOverhead: this.performanceMetrics.retryOverhead }
      });
    }

    // Alerta de taxa de erro alta
    const errorRate = this.metrics.failedRetries / this.metrics.totalAttempts;
    if (errorRate > this.alertThresholds.errorRate) {
      this.addAlert({
        type: 'error_rate',
        message: `High retry failure rate: ${(errorRate * 100).toFixed(1)}%`,
        severity: 'high',
        timestamp: new Date(),
        data: { errorRate, failedRetries: this.metrics.failedRetries }
      });
    }
  }

  private addAlert(alert: Omit<typeof this.alerts[0], 'timestamp'> & { timestamp?: Date }) {
    this.alerts.push({
      ...alert,
      timestamp: alert.timestamp || new Date()
    });

    // Manter apenas últimos 100 alertas
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log do alerta
    this.logRetryEvent('alert_generated', {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date()
    });

    // Notificar usuário para alertas críticos
    if (alert.severity === 'critical' || alert.severity === 'high') {
      this.notifyUser(alert);
    }
  }

  private notifyUser(alert: typeof this.alerts[0]) {
    // Implementar notificação para o usuário
    // Por enquanto, apenas log
    console.warn(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, alert.data);
  }

  private logRetryEvent(event: string, data?: any) {
    queryMonitor.logEvent(event, {
      system: 'retry_logic',
      ...data
    });
  }

  // Obter métricas atuais
  getMetrics(): RetryMetrics {
    return {
      ...this.metrics,
      errorRecoveryRate: this.calculateRecoveryRate()
    };
  }

  // Obter métricas de performance
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Obter alertas recentes
  getAlerts(limit = 10) {
    return this.alerts
      .slice(-limit)
      .reverse();
  }

  // Resetar métricas
  reset() {
    this.metrics = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      avgRetryDelay: 0,
      maxRetryAttempts: 0,
      errorTypeDistribution: {} as Record<ErrorType, number>,
      circuitBreakerState: {}
    };

    this.performanceMetrics = {
      retryOverhead: 0,
      circuitBreakerImpact: 0,
      errorRecoveryRate: 0,
      fallbacksActivated: 0
    };

    this.alerts = [];
  }
}

export const retryMonitor = new RetryMonitor();

// ===========================================
// 3. DASHBOARD DE MONITORAMENTO
// ===========================================

export class RetryMonitoringDashboard {
  private refreshInterval?: number;
  private subscribers: Array<(metrics: RetryMetrics) => void> = [];

  subscribe(callback: (metrics: RetryMetrics) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  startRealTimeMonitoring(intervalMs = 30000) {
    this.refreshInterval = window.setInterval(() => {
      const metrics = retryMonitor.getMetrics();
      this.notifySubscribers(metrics);
    }, intervalMs);
  }

  stopRealTimeMonitoring() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  private notifySubscribers(metrics: RetryMetrics) {
    this.subscribers.forEach(callback => callback(metrics));
  }

  // Gerar relatório de health check
  generateHealthReport() {
    const metrics = retryMonitor.getMetrics();
    const performance = retryMonitor.getPerformanceMetrics();
    const alerts = retryMonitor.getAlerts(5);

    const healthScore = this.calculateHealthScore(metrics, performance, alerts);

    return {
      healthScore,
      status: this.getStatus(healthScore),
      metrics,
      performance,
      alerts: alerts.slice(0, 3),
      recommendations: this.generateRecommendations(metrics, performance, alerts),
      timestamp: new Date()
    };
  }

  private calculateHealthScore(
    metrics: RetryMetrics,
    performance: PerformanceMetrics,
    alerts: any[]
  ): number {
    let score = 100;

    // Penalizar por taxa de erro
    const errorRate = metrics.failedRetries / Math.max(metrics.totalAttempts, 1);
    score -= errorRate * 50;

    // Penalizar por overhead alto
    score -= performance.retryOverhead * 30;

    // Penalizar por alertas críticos
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    score -= criticalAlerts * 20;

    // Penalizar por circuit breakers abertos
    const openCircuitBreakers = Object.values(metrics.circuitBreakerState)
      .filter(cb => cb.state === 'OPEN').length;
    score -= openCircuitBreakers * 10;

    return Math.max(0, Math.min(100, score));
  }

  private getStatus(score: number): 'healthy' | 'warning' | 'critical' {
    if (score >= 80) return 'healthy';
    if (score >= 50) return 'warning';
    return 'critical';
  }

  private generateRecommendations(
    metrics: RetryMetrics,
    performance: PerformanceMetrics,
    alerts: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas em métricas
    const errorRate = metrics.failedRetries / Math.max(metrics.totalAttempts, 1);
    if (errorRate > 0.1) {
      recommendations.push('Alta taxa de erro detectada. Considere revisar os tipos de erro retryable.');
    }

    if (performance.retryOverhead > 0.3) {
      recommendations.push('Overhead de retry muito alto. Considere reduzir o número de tentativas ou usar circuit breaker.');
    }

    // Recomendações baseadas em alertas
    alerts.forEach(alert => {
      switch (alert.type) {
        case 'circuit_breaker':
          recommendations.push('Circuit breaker está abrindo frequentemente. Considere ajustar thresholds ou investigar a causa raiz.');
          break;
        case 'performance':
          recommendations.push('Performance degradada devido a retries. Considere implementar fallbacks ou cache.');
          break;
        case 'recovery':
          recommendations.push('Taxa de recuperação baixa. Revise as estratégias de retry e error handling.');
          break;
      }
    });

    return recommendations;
  }
}

export const retryDashboard = new RetryMonitoringDashboard();

// ===========================================
// 4. INTEGRAÇÃO COM REACT QUERY
// ===========================================

// Hook para React Query com retry monitoring
export function useMonitoredRetry() {
  const originalWithRetry = require('./retry-system').withRetry;

  const monitoredWithRetry = <T>(
    operation: () => Promise<T>,
    config?: any
  ): Promise<T> => {
    const startTime = Date.now();
    let attempt = 0;

    return originalWithRetry(operation, {
      ...config,
      onRetry: (error: any, attemptNum: number) => {
        attempt = attemptNum;
        const delay = config?.retryDelay?.(attemptNum) || 1000;
        retryMonitor.recordRetryAttempt(error, attemptNum, delay);
        config?.onRetry?.(error, attemptNum);
      }
    }).then(result => {
      const totalTime = Date.now() - startTime;
      retryMonitor.recordRetrySuccess(attempt, totalTime);
      return result;
    }).catch(error => {
      retryMonitor.recordRetryFailure(error, attempt);
      throw error;
    });
  };

  return {
    withRetry: monitoredWithRetry,
    getMetrics: () => retryMonitor.getMetrics(),
    getPerformanceMetrics: () => retryMonitor.getPerformanceMetrics(),
    getAlerts: (limit?: number) => retryMonitor.getAlerts(limit),
    getHealthReport: () => retryDashboard.generateHealthReport()
  };
}

// Cleanup na destruição do componente
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    retryDashboard.stopRealTimeMonitoring();
  });
}