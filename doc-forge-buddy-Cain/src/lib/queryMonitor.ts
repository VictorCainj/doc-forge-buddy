import { QueryKey, QueryFunction } from '@tanstack/react-query';
import { queryClient } from './queryClient';

export interface QueryMetrics {
  queryKey: string;
  duration: number;
  timestamp: Date;
  status: 'success' | 'error' | 'stale' | 'pending';
  dataSize?: number;
  retryCount: number;
  page: string;
}

export interface CacheMetrics {
  hitRate: number;
  totalQueries: number;
  activeQueries: number;
  staleQueries: number;
  errorQueries: number;
  cacheSize: number;
}

export interface PerformanceMetrics {
  averageQueryTime: number;
  slowQueries: Array<{
    queryKey: string;
    duration: number;
    timestamp: Date;
  }>;
  errorRate: number;
  cacheUtilization: number;
}

class QueryPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private maxMetricsSize = 1000;
  private slowQueryThreshold = 2000; // 2 segundos
  private observers: Array<(metrics: CacheMetrics) => void> = [];

  constructor() {
    this.setupPerformanceTracking();
    this.startPeriodicReporting();
  }

  private setupPerformanceTracking() {
    // Track query performance
    const originalPrefetchQuery = queryClient.prefetchQuery.bind(queryClient);
    
    queryClient.prefetchQuery = async (queryKey, queryFn, options) => {
      const startTime = performance.now();
      
      try {
        const result = await originalPrefetchQuery(queryKey, queryFn, options);
        this.recordQueryMetrics(queryKey, startTime, 'success');
        return result;
      } catch (error) {
        this.recordQueryMetrics(queryKey, startTime, 'error');
        throw error;
      }
    };
  }

  private recordQueryMetrics(queryKey: QueryKey, startTime: number, status: QueryMetrics['status']) {
    const duration = performance.now() - startTime;
    const queryHash = this.getQueryHash(queryKey);
    const page = window.location.pathname;
    const retryCount = 0; // Implementar tracking de retry se necessário
    
    const metric: QueryMetrics = {
      queryKey: JSON.stringify(queryKey),
      duration,
      timestamp: new Date(),
      status,
      retryCount,
      page
    };

    this.addMetric(metric);

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      this.logSlowQuery(metric);
    }
  }

  private addMetric(metric: QueryMetrics) {
    this.metrics.push(metric);
    
    // Manter tamanho limite
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift();
    }

    // Notificar observers
    this.notifyObservers();
  }

  private getQueryHash(queryKey: QueryKey): string {
    return queryClient.getQueryState(queryKey)?.queryKey?.join('|') || 'unknown';
  }

  private logSlowQuery(metric: QueryMetrics) {
    if (import.meta.env.DEV) {
      console.warn(`Slow Query Detected:`, {
        queryKey: metric.queryKey,
        duration: `${metric.duration.toFixed(2)}ms`,
        page: metric.page,
        timestamp: metric.timestamp
      });
    }
  }

  // Métodos públicos para logging
  logError(error: any, query: any) {
    if (import.meta.env.DEV) {
      console.error('Query Error:', {
        error: error.message,
        queryKey: query?.queryKey,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }

    // Send to analytics
    this.sendToAnalytics('query_error', {
      error: error.message,
      queryKey: query?.queryKey,
      page: window.location.pathname
    });
  }

  logSuccess(data: any, query: any) {
    const dataSize = this.calculateDataSize(data);
    
    if (import.meta.env.DEV) {
      console.log('Query Success:', {
        queryKey: query?.queryKey,
        dataSize: this.formatBytes(dataSize),
        duration: query?.statusTimestamp ? 
          performance.now() - (query as any).startTime : 'unknown'
      });
    }
  }

  logEvent(event: string, data?: any) {
    if (import.meta.env.DEV) {
      console.log(`Query Event: ${event}`, data);
    }

    this.sendToAnalytics(`query_${event}`, data);
  }

  // Analytics
  private sendToAnalytics(event: string, data?: any) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, {
        event_category: 'query_performance',
        event_label: event,
        value: JSON.stringify(data),
        custom_map: {
          query_event: event
        }
      });
    }
  }

  // Cálculo de métricas
  getPerformanceMetrics(): PerformanceMetrics {
    const recent = this.getRecentMetrics(24 * 60 * 60 * 1000); // 24 horas
    
    const successMetrics = recent.filter(m => m.status === 'success');
    const errorMetrics = recent.filter(m => m.status === 'error');
    const slowQueries = recent.filter(m => m.duration > this.slowQueryThreshold);

    return {
      averageQueryTime: successMetrics.length > 0 
        ? successMetrics.reduce((sum, m) => sum + m.duration, 0) / successMetrics.length
        : 0,
      slowQueries: slowQueries
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      errorRate: recent.length > 0 ? (errorMetrics.length / recent.length) * 100 : 0,
      cacheUtilization: this.getCacheUtilization()
    };
  }

  getCacheMetrics(): CacheMetrics {
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();
    const queryStates = allQueries.map(q => queryClient.getQueryState(q.queryKey));
    
    return {
      hitRate: this.calculateHitRate(),
      totalQueries: allQueries.length,
      activeQueries: queryStates.filter(s => s?.status === 'success' && s.data).length,
      staleQueries: queryStates.filter(s => s?.isStale).length,
      errorQueries: queryStates.filter(s => s?.error).length,
      cacheSize: this.calculateCacheSize()
    };
  }

  private calculateHitRate(): number {
    // Implementar cálculo de hit rate baseado em access patterns
    const recent = this.getRecentMetrics(60 * 60 * 1000); // 1 hora
    const cacheHits = recent.filter(m => m.status === 'success').length;
    const totalRequests = recent.length;
    
    return totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
  }

  private calculateCacheSize(): number {
    // Calcular tamanho aproximado do cache
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();
    
    return allQueries.reduce((total, query) => {
      const data = query.getData();
      return total + this.calculateDataSize(data);
    }, 0);
  }

  private calculateDataSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getCacheUtilization(): number {
    const cacheMetrics = this.getCacheMetrics();
    const maxQueries = 100; // Configurável
    
    return Math.min(100, (cacheMetrics.totalQueries / maxQueries) * 100);
  }

  private getRecentMetrics(timeWindow: number): QueryMetrics[] {
    const now = Date.now();
    return this.metrics.filter(m => now - m.timestamp.getTime() < timeWindow);
  }

  // Observers para métricas em tempo real
  subscribe(callback: (metrics: CacheMetrics) => void) {
    this.observers.push(callback);
    
    // Retornar unsubscribe function
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  private notifyObservers() {
    const metrics = this.getCacheMetrics();
    this.observers.forEach(callback => callback(metrics));
  }

  // Relatório periódico
  private startPeriodicReporting() {
    if (import.meta.env.PROD) {
      setInterval(() => {
        this.generatePeriodicReport();
      }, 15 * 60 * 1000); // A cada 15 minutos
    }
  }

  private generatePeriodicReport() {
    const performanceMetrics = this.getPerformanceMetrics();
    const cacheMetrics = this.getCacheMetrics();
    
    if (performanceMetrics.errorRate > 10 || cacheMetrics.staleQueries > 50) {
      console.warn('Query Performance Alert:', {
        errorRate: `${performanceMetrics.errorRate.toFixed(1)}%`,
        staleQueries: cacheMetrics.staleQueries,
        averageQueryTime: `${performanceMetrics.averageQueryTime.toFixed(2)}ms`
      });
    }
  }

  // Métricas detalhadas para debugging
  getDetailedMetrics() {
    return {
      performance: this.getPerformanceMetrics(),
      cache: this.getCacheMetrics(),
      recentQueries: this.getRecentMetrics(60 * 60 * 1000).slice(0, 20),
      errorStats: this.getErrorStats()
    };
  }

  private getErrorStats() {
    const recent = this.getRecentMetrics(24 * 60 * 60 * 1000);
    const errors = recent.filter(m => m.status === 'error');
    
    return {
      total: errors.length,
      byPage: errors.reduce((acc, m) => {
        acc[m.page] = (acc[m.page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageRetryCount: errors.length > 0 
        ? errors.reduce((sum, e) => sum + e.retryCount, 0) / errors.length
        : 0
    };
  }
}

export const queryMonitor = new QueryPerformanceMonitor();