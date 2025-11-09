/**
 * Sistema de logging para operations de Repository
 * Monitore performance e debug queries
 */

import type { BaseEntity } from '@/types/shared/base';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  entity: string;
  operation: string;
  duration: number;
  query: string;
  parameters?: any;
  result?: any;
  error?: string;
  userId?: string | null;
}

export interface PerformanceMetrics {
  operation: string;
  entity: string;
  duration: number;
  timestamp: string;
  userId?: string | null;
}

class RepositoryLogger {
  private static instance: RepositoryLogger;
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetrics[] = [];
  private maxLogEntries = 1000;
  private maxMetricsEntries = 5000;
  private isEnabled = true;

  private constructor() {}

  static getInstance(): RepositoryLogger {
    if (!RepositoryLogger.instance) {
      RepositoryLogger.instance = new RepositoryLogger();
    }
    return RepositoryLogger.instance;
  }

  /**
   * Habilita/desabilita logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Registra uma operação de query
   */
  logQuery(
    level: LogLevel,
    entity: string,
    operation: string,
    query: string,
    startTime: number,
    parameters?: any,
    result?: any,
    error?: string,
    userId?: string | null
  ): void {
    if (!this.isEnabled) return;

    const duration = Date.now() - startTime;
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      entity,
      operation,
      duration,
      query,
      parameters,
      result,
      error,
      userId: userId || null
    };

    this.logs.push(logEntry);

    // Mantém apenas o número máximo de logs
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Registra métricas de performance
    if (level !== LogLevel.ERROR) {
      this.recordMetric(entity, operation, duration, userId);
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(logEntry);
    }
  }

  /**
   * Registra métrica de performance
   */
  private recordMetric(
    entity: string,
    operation: string,
    duration: number,
    userId?: string | null
  ): void {
    const metric: PerformanceMetrics = {
      entity,
      operation,
      duration,
      timestamp: new Date().toISOString(),
      userId: userId || null
    };

    this.metrics.push(metric);

    // Mantém apenas o número máximo de métricas
    if (this.metrics.length > this.maxMetricsEntries) {
      this.metrics = this.metrics.slice(-this.maxMetricsEntries);
    }
  }

  /**
   * Log no console (development only)
   */
  private consoleLog(entry: LogEntry): void {
    const emoji = this.getLevelEmoji(entry.level);
    const duration = `${entry.duration}ms`;
    
    console.log(
      `${emoji} [${entry.timestamp}] ${entry.entity}.${entry.operation} (${duration})`,
      {
        query: entry.query,
        parameters: entry.parameters,
        result: entry.result,
        error: entry.error
      }
    );
  }

  /**
   * Retorna emoji baseado no nível de log
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  /**
   * Retorna todos os logs
   */
  getLogs(filters?: {
    entity?: string;
    operation?: string;
    level?: LogLevel;
    fromDate?: string;
    toDate?: string;
    userId?: string;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.entity) {
        filteredLogs = filteredLogs.filter(log => log.entity === filters.entity);
      }
      if (filters.operation) {
        filteredLogs = filteredLogs.filter(log => log.operation === filters.operation);
      }
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.fromDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.fromDate!);
      }
      if (filters.toDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.toDate!);
      }
    }

    return filteredLogs;
  }

  /**
   * Retorna métricas de performance
   */
  getMetrics(filters?: {
    entity?: string;
    operation?: string;
    fromDate?: string;
    toDate?: string;
    userId?: string;
  }): PerformanceMetrics[] {
    let filteredMetrics = [...this.metrics];

    if (filters) {
      if (filters.entity) {
        filteredMetrics = filteredMetrics.filter(metric => metric.entity === filters.entity);
      }
      if (filters.operation) {
        filteredMetrics = filteredMetrics.filter(metric => metric.operation === filters.operation);
      }
      if (filters.userId) {
        filteredMetrics = filteredMetrics.filter(metric => metric.userId === filters.userId);
      }
      if (filters.fromDate) {
        filteredMetrics = filteredMetrics.filter(metric => metric.timestamp >= filters.fromDate!);
      }
      if (filters.toDate) {
        filteredMetrics = filteredMetrics.filter(metric => metric.timestamp <= filters.toDate!);
      }
    }

    return filteredMetrics;
  }

  /**
   * Calcula estatísticas de performance
   */
  getPerformanceStats(entity?: string, operation?: string): {
    total: number;
    average: number;
    min: number;
    max: number;
    slowQueries: number;
    totalDuration: number;
  } {
    let metrics = [...this.metrics];

    if (entity) {
      metrics = metrics.filter(m => m.entity === entity);
    }
    if (operation) {
      metrics = metrics.filter(m => m.operation === operation);
    }

    if (metrics.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        slowQueries: 0,
        totalDuration: 0
      };
    }

    const durations = metrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const average = totalDuration / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const slowQueries = durations.filter(d => d > 1000).length; // Queries > 1s

    return {
      total: metrics.length,
      average: Math.round(average),
      min,
      max,
      slowQueries,
      totalDuration
    };
  }

  /**
   * Limpa logs antigos
   */
  cleanOldLogs(maxAge = 24 * 60 * 60 * 1000): void { // 24 horas
    const cutoff = Date.now() - maxAge;
    const cutoffDate = new Date(cutoff).toISOString();
    
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoffDate);
  }

  /**
   * Exibe relatório de performance
   */
  generatePerformanceReport(): void {
    console.log('\n=== RELATÓRIO DE PERFORMANCE - REPOSITORY ===\n');
    
    const entities = new Set(this.metrics.map(m => m.entity));
    
    entities.forEach(entity => {
      const entityMetrics = this.metrics.filter(m => m.entity === entity);
      const operations = new Set(entityMetrics.map(m => m.operation));
      
      console.log(`📊 Entity: ${entity}`);
      
      operations.forEach(operation => {
        const stats = this.getPerformanceStats(entity, operation);
        console.log(`  🔧 ${operation}: ${stats.total} queries, avg ${stats.average}ms, max ${stats.max}ms`);
      });
      
      console.log('');
    });
  }

  /**
   * Exporta logs como JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      metrics: this.metrics,
      generatedAt: new Date().toISOString()
    }, null, 2);
  }
}

// Export singleton instance
export const repositoryLogger = RepositoryLogger.getInstance();

// Helper para criar logger de timing
export const createQueryTimer = (
  entity: string,
  operation: string,
  query: string,
  userId?: string | null
) => {
  const startTime = Date.now();
  
  return {
    success: (result?: any, parameters?: any) => {
      repositoryLogger.logQuery(
        LogLevel.INFO,
        entity,
        operation,
        query,
        startTime,
        parameters,
        result,
        undefined,
        userId
      );
    },
    error: (error: unknown, parameters?: any) => {
      repositoryLogger.logQuery(
        LogLevel.ERROR,
        entity,
        operation,
        query,
        startTime,
        parameters,
        undefined,
        error instanceof Error ? error.message : String(error),
        userId
      );
    }
  };
};