/**
 * Performance Integration com Sentry
 * Implementa trace propagation, performance metrics e session replay com contexto enriquecido
 */

import { captureException, captureMessage, addBreadcrumb } from './sentry';
import { errorAnalytics } from './errorAnalytics';
import { log } from '@/utils/logger';

// Tipos para métricas de performance
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: Date;
  tags?: Record<string, string | number>;
  metadata?: Record<string, any>;
}

export interface UserSessionData {
  sessionId: string;
  userId?: string;
  startTime: Date;
  duration: number;
  pageViews: number;
  interactions: number;
  errors: number;
  performance: {
    avgLoadTime: number;
    avgTTFB: number;
    avgCLS: number;
    memoryUsage: number;
  };
  paths: string[];
  devices: {
    userAgent: string;
    screen: { width: number; height: number };
    connection?: any;
  };
}

// Store de métricas de performance
class PerformanceStore {
  private metrics: PerformanceMetric[] = [];
  private userSessions = new Map<string, UserSessionData>();
  private currentSession: UserSessionData | null = null;
  private observers: Set<PerformanceObserver> = new Set();

  constructor() {
    this.initializeObservers();
    this.startSessionTracking();
  }

  private initializeObservers() {
    // Web Vitals Observer
    this.observeWebVitals();
    
    // Resource Timing Observer
    this.observeResourceTiming();
    
    // Navigation Timing Observer
    this.observeNavigationTiming();
    
    // Memory Monitoring
    this.startMemoryMonitoring();
  }

  private observeWebVitals() {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        const metric: PerformanceMetric = {
          name: 'LCP',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: new Date(),
          tags: {
            element: lastEntry.element?.tagName || 'unknown',
            url: lastEntry.url || window.location.pathname,
          },
        };
        
        this.addMetric(metric);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.add(lcpObserver);
      } catch (e) {
        // LCP not supported
      }

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach((entry) => {
          const metric: PerformanceMetric = {
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            unit: 'ms',
            timestamp: new Date(),
            tags: {
              eventType: entry.name,
              target: (entry.target as Element)?.tagName || 'unknown',
            },
          };
          
          this.addMetric(metric);
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.add(fidObserver);
      } catch (e) {
        // FID not supported
      }

      // CLS - Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        const metric: PerformanceMetric = {
          name: 'CLS',
          value: clsValue,
          unit: 'count',
          timestamp: new Date(),
          tags: {
            sources: entries.filter(e => !e.hadRecentInput).length,
            url: window.location.pathname,
          },
        };
        
        this.addMetric(metric);
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.add(clsObserver);
      } catch (e) {
        // CLS not supported
      }

      // FCP - First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            const metric: PerformanceMetric = {
              name: 'FCP',
              value: entry.startTime,
              unit: 'ms',
              timestamp: new Date(),
              tags: {
                url: window.location.pathname,
              },
            };
            
            this.addMetric(metric);
          }
        });
      });
      
      try {
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.add(fcpObserver);
      } catch (e) {
        // FCP not supported
      }
    }
  }

  private observeResourceTiming() {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Only track slow resources (> 1s)
        if (resourceEntry.responseEnd - resourceEntry.startTime > 1000) {
          const metric: PerformanceMetric = {
            name: 'SLOW_RESOURCE',
            value: resourceEntry.responseEnd - resourceEntry.startTime,
            unit: 'ms',
            timestamp: new Date(),
            tags: {
              resourceType: resourceEntry.initiatorType,
              resourceSize: resourceEntry.transferSize,
              cached: resourceEntry.transferSize === 0,
              url: resourceEntry.name,
            },
            metadata: {
              startTime: resourceEntry.startTime,
              responseEnd: resourceEntry.responseEnd,
              domainLookupTime: resourceEntry.domainLookupEnd - resourceEntry.domainLookupStart,
              connectTime: resourceEntry.connectEnd - resourceEntry.connectStart,
              requestTime: resourceEntry.responseStart - resourceEntry.requestStart,
              responseTime: resourceEntry.responseEnd - resourceEntry.responseStart,
            },
          };
          
          this.addMetric(metric);
          
          // Alert for very slow resources (> 5s)
          if (metric.value > 5000) {
            captureMessage(
              `Very slow resource: ${resourceEntry.name} took ${Math.round(metric.value)}ms`,
              'warning'
            );
          }
        }
      });
    });
    
    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.add(resourceObserver);
    } catch (e) {
      // Resource timing not supported
    }
  }

  private observeNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const metrics: Array<{ name: string; value: number; metadata?: any }> = [
        { name: 'TTFB', value: navigation.responseStart - navigation.requestStart },
        { name: 'DOM_CONTENT_LOADED', value: navigation.domContentLoadedEventEnd - navigation.navigationStart },
        { name: 'LOAD', value: navigation.loadEventEnd - navigation.navigationStart },
        { name: 'DNS_LOOKUP', value: navigation.domainLookupEnd - navigation.domainLookupStart },
        { name: 'TCP_CONNECT', value: navigation.connectEnd - navigation.connectStart },
        { name: 'REQUEST', value: navigation.responseStart - navigation.requestStart },
        { name: 'RESPONSE', value: navigation.responseEnd - navigation.responseStart },
        { name: 'DOM_PROCESSING', value: navigation.domComplete - navigation.responseEnd },
      ];
      
      metrics.forEach(({ name, value, metadata }) => {
        this.addMetric({
          name,
          value,
          unit: 'ms',
          timestamp: new Date(),
          tags: {
            url: window.location.pathname,
          },
          metadata,
        });
      });
      
      // Alert for slow page loads (> 5s)
      if (metrics.find(m => m.name === 'LOAD')!.value > 5000) {
        captureMessage(
          `Slow page load: ${Math.round(metrics.find(m => m.name === 'LOAD')!.value)}ms`,
          'warning'
        );
      }
    }
  }

  private startMemoryMonitoring() {
    const checkMemory = () => {
      if (!(performance as any).memory) return;
      
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      const usagePercent = (usedMB / limitMB) * 100;
      
      this.addMetric({
        name: 'MEMORY_USAGE',
        value: usagePercent,
        unit: 'percent',
        timestamp: new Date(),
        tags: {
          usedMB: Math.round(usedMB),
          totalMB: Math.round(totalMB),
          limitMB: Math.round(limitMB),
        },
        metadata: {
          usedBytes: memory.usedJSHeapSize,
          totalBytes: memory.totalJSHeapSize,
          limitBytes: memory.jsHeapSizeLimit,
        },
      });
    };
    
    // Check immediately and then every 30 seconds
    checkMemory();
    setInterval(checkMemory, 30000);
  }

  private startSessionTracking() {
    this.startNewSession();
    
    // Start new session every 30 minutes
    setInterval(() => {
      this.endCurrentSession();
      this.startNewSession();
    }, 30 * 60 * 1000);
    
    // Track page changes
    this.trackPageView();
  }

  private startNewSession() {
    this.currentSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      duration: 0,
      pageViews: 0,
      interactions: 0,
      errors: 0,
      performance: {
        avgLoadTime: 0,
        avgTTFB: 0,
        avgCLS: 0,
        memoryUsage: 0,
      },
      paths: [window.location.pathname],
      devices: {
        userAgent: navigator.userAgent,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
        connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
      },
    };
    
    this.userSessions.set(this.currentSession.sessionId, this.currentSession);
    
    addBreadcrumb({
      message: 'Session started',
      category: 'session',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        userAgent: this.currentSession.devices.userAgent,
        screen: this.currentSession.devices.screen,
      },
    });
  }

  private endCurrentSession() {
    if (!this.currentSession) return;
    
    this.currentSession.duration = Date.now() - this.currentSession.startTime.getTime();
    
    addBreadcrumb({
      message: 'Session ended',
      category: 'session',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        duration: this.currentSession.duration,
        pageViews: this.currentSession.pageViews,
        interactions: this.currentSession.interactions,
        errors: this.currentSession.errors,
      },
    });
    
    this.currentSession = null;
  }

  private trackPageView() {
    if (!this.currentSession) return;
    
    this.currentSession.pageViews++;
    const currentPath = window.location.pathname;
    if (!this.currentSession.paths.includes(currentPath)) {
      this.currentSession.paths.push(currentPath);
    }
    
    addBreadcrumb({
      message: 'Page view',
      category: 'navigation',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        path: currentPath,
        pageViews: this.currentSession.pageViews,
      },
    });
    
    // Re-track on popstate
    window.addEventListener('popstate', () => this.trackPageView());
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Manter apenas as últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
    
    // Adicionar ao analytics
    errorAnalytics.addDataPoint({
      timestamp: metric.timestamp,
      value: metric.value,
      category: metric.name.toLowerCase(),
      metadata: {
        ...metric.tags,
        ...metric.metadata,
        unit: metric.unit,
      },
    });
    
    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      log.debug(`Performance metric: ${metric.name} = ${metric.value}${metric.unit}`, metric.tags);
    }
  }

  // Métodos públicos
  getMetrics(filter?: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    unit?: string;
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];
    
    if (filter?.name) {
      filtered = filtered.filter(m => m.name === filter.name);
    }
    
    if (filter?.startDate) {
      filtered = filtered.filter(m => m.timestamp >= filter.startDate!);
    }
    
    if (filter?.endDate) {
      filtered = filtered.filter(m => m.timestamp <= filter.endDate!);
    }
    
    if (filter?.unit) {
      filtered = filtered.filter(m => m.unit === filter.unit);
    }
    
    return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  getUserSessions(): UserSessionData[] {
    return Array.from(this.userSessions.values());
  }

  getCurrentSession(): UserSessionData | null {
    return this.currentSession;
  }

  trackUserInteraction(type: string, target?: string) {
    if (!this.currentSession) return;
    
    this.currentSession.interactions++;
    
    addBreadcrumb({
      message: 'User interaction',
      category: 'ui',
      level: 'info',
      data: {
        sessionId: this.currentSession.sessionId,
        type,
        target,
        totalInteractions: this.currentSession.interactions,
      },
    });
  }

  trackErrorInSession() {
    if (!this.currentSession) return;
    
    this.currentSession.errors++;
  }

  getPerformanceSummary() {
    const recentMetrics = this.getMetrics({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
    });
    
    const summary: Record<string, {
      avg: number;
      min: number;
      max: number;
      count: number;
    }> = {};
    
    recentMetrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { avg: 0, min: metric.value, max: metric.value, count: 0 };
      }
      
      const s = summary[metric.name];
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
      s.avg = ((s.avg * s.count) + metric.value) / (s.count + 1);
      s.count++;
    });
    
    return summary;
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.endCurrentSession();
  }
}

// Instância global
export const performanceStore = new PerformanceStore();

// Funções de conveniência
export function trackPerformance(metric: PerformanceMetric) {
  performanceStore.addMetric(metric);
}

export function trackUserInteraction(type: string, target?: string) {
  performanceStore.trackUserInteraction(type, target);
}

export function getPerformanceMetrics(filter?: any): PerformanceMetric[] {
  return performanceStore.getMetrics(filter);
}

export function getUserSessions(): UserSessionData[] {
  return performanceStore.getUserSessions();
}

export function getCurrentUserSession(): UserSessionData | null {
  return performanceStore.getCurrentSession();
}

export function getPerformanceSummary() {
  return performanceStore.getPerformanceSummary();
}

// Integração com Sentry para trace propagation
export function initTracePropagation() {
  if (typeof window === 'undefined') return;
  
  // Attach Sentry trace to fetch requests
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    
    // Start Sentry transaction
    const transaction = Sentry.startTransaction({
      op: 'fetch',
      name: `HTTP ${args[1]?.method || 'GET'} ${url}`,
    });
    
    const span = transaction.startChild({
      op: 'http.request',
      description: `${args[1]?.method || 'GET'} ${url}`,
      tags: {
        url,
        method: args[1]?.method || 'GET',
      },
    });
    
    try {
      const response = await originalFetch(...args);
      
      // Set response metadata
      span.setData('status', response.status);
      span.setData('statusText', response.statusText);
      span.setTag('http.status_code', response.status);
      
      span.finish();
      transaction.finish();
      
      return response;
    } catch (error) {
      // Record error
      span.setStatus('internal_error');
      span.finish();
      transaction.finish();
      
      captureException(error as Error, {
        url,
        method: args[1]?.method || 'GET',
        type: 'fetch_error',
      });
      
      throw error;
    }
  };
}

// Inicializar performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  // Initialize trace propagation
  initTracePropagation();
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      performanceStore.endCurrentSession();
    } else {
      performanceStore.startNewSession();
    }
  });
  
  // Track beforeunload
  window.addEventListener('beforeunload', () => {
    performanceStore.endCurrentSession();
  });
  
  // Auto-track user interactions
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    performanceStore.trackUserInteraction('click', target.tagName);
  });
  
  document.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;
    performanceStore.trackUserInteraction('input', target.tagName);
  });
  
  if (import.meta.env.DEV) {
    log.info('Performance monitoring initialized');
  }
}

// Cleanup function
export function cleanupPerformanceMonitoring() {
  performanceStore.destroy();
}