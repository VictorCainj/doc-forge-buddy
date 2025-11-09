/**
 * Web Vitals Monitoring System
 * Sistema completo de monitoramento de Core Web Vitals
 */

import {
  getCLS,
  getFID,
  getFCP,
  getLCP,
  getTTFB,
  Metric,
  ReportHandler
} from 'web-vitals';

// Tipos para as métricas
export interface WebVitalMetric extends Metric {
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  timestamp: number;
  navigationType?: string;
}

export interface CustomMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  metric: string;
  good: number;
  poor: number;
  unit: 'ms' | 'score';
}

export interface AlertConfig {
  threshold: number;
  enabled: boolean;
  callback: (metric: WebVitalMetric) => void;
}

export interface PerformanceBudget {
  metric: string;
  budget: number;
  unit: string;
  type: 'good' | 'poor';
}

// Configuração dos thresholds do Core Web Vitals
export const PERFORMANCE_THRESHOLDS: Record<string, PerformanceThreshold> = {
  FCP: { metric: 'FCP', good: 1800, poor: 3000, unit: 'ms' },
  LCP: { metric: 'LCP', good: 2500, poor: 4000, unit: 'ms' },
  FID: { metric: 'FID', good: 100, poor: 300, unit: 'ms' },
  CLS: { metric: 'CLS', good: 0.1, poor: 0.25, unit: 'score' },
  TTFB: { metric: 'TTFB', good: 800, poor: 1800, unit: 'ms' },
};

// Performance budgets
export const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { metric: 'FCP', budget: 1800, unit: 'ms', type: 'good' },
  { metric: 'LCP', budget: 2500, unit: 'ms', type: 'good' },
  { metric: 'FID', budget: 100, unit: 'ms', type: 'good' },
  { metric: 'CLS', budget: 0.1, unit: 'score', type: 'good' },
  { metric: 'TTFB', budget: 800, unit: 'ms', type: 'good' },
];

// Classificador de ratings
export const getRating = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = PERFORMANCE_THRESHOLDS[metric];
  if (!threshold) return 'good';
  
  if (threshold.unit === 'ms') {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  } else {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }
};

// Gerador de ID único para métricas
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Coletor de contexto adicional
const collectContext = (): Partial<WebVitalMetric> => {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    connectionType: (navigator as any).connection?.effectiveType,
    deviceMemory: (navigator as any).deviceMemory,
    timestamp: Date.now(),
    navigationType: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type,
  };
};

// Armazenamento local de métricas
class MetricsStorage {
  private storageKey = 'web-vitals-metrics';
  private maxEntries = 1000;

  save(metric: WebVitalMetric): void {
    try {
      const existing = this.getAll();
      existing.push(metric);
      
      if (existing.length > this.maxEntries) {
        existing.splice(0, existing.length - this.maxEntries);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  }

  getAll(): WebVitalMetric[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load metrics:', error);
      return [];
    }
  }

  getByMetricName(metricName: string): WebVitalMetric[] {
    return this.getAll().filter(metric => metric.name === metricName);
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}

const storage = new MetricsStorage();

// Analisador de tendências
class TrendAnalyzer {
  analyze(metrics: WebVitalMetric[], metricName: string): {
    trend: 'improving' | 'degrading' | 'stable';
    change: number;
    average: number;
    percentile95: number;
  } {
    const sorted = metrics
      .filter(m => m.name === metricName)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (sorted.length < 3) {
      return { trend: 'stable', change: 0, average: 0, percentile95: 0 };
    }

    const values = sorted.map(m => m.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const percentile95 = this.calculatePercentile(values, 95);
    
    // Analisar tendência comparando últimas 3 com primeiras 3
    const recent = values.slice(-3);
    const older = values.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (Math.abs(change) > 5) {
      trend = change > 0 ? 'degrading' : 'improving';
    }

    return { trend, change, average, percentile95 };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }
}

const trendAnalyzer = new TrendAnalyzer();

// Sistema de alertas
class AlertSystem {
  private alerts: Map<string, AlertConfig> = new Map();

  addAlert(metric: string, config: AlertConfig): void {
    this.alerts.set(metric, config);
  }

  check(metric: WebVitalMetric): void {
    const alert = this.alerts.get(metric.name);
    if (!alert || !alert.enabled) return;

    if (metric.value >= alert.threshold) {
      alert.callback(metric);
    }
  }

  clear(): void {
    this.alerts.clear();
  }
}

const alertSystem = new AlertSystem();

// Enviador de analytics
class AnalyticsDispatcher {
  private endpoints: string[] = [];
  private queue: WebVitalMetric[] = [];
  private isProcessing = false;

  addEndpoint(url: string): void {
    this.endpoints.push(url);
  }

  async send(metric: WebVitalMetric): Promise<void> {
    this.queue.push(metric);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const metric = this.queue.shift()!;
      
      try {
        await Promise.all(
          this.endpoints.map(endpoint =>
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metric),
            }).catch(err => console.error('Analytics send failed:', err))
          )
        );
      } catch (error) {
        console.error('Failed to process metrics queue:', error);
      }
    }
    
    this.isProcessing = false;
  }
}

const analyticsDispatcher = new AnalyticsDispatcher();

// Monitor principal de Web Vitals
export class WebVitalsMonitor {
  private static instance: WebVitalsMonitor;
  private isInitialized = false;
  private metrics: WebVitalMetric[] = [];
  private subscribers: Set<(metrics: WebVitalMetric[]) => void> = new Set();

  private constructor() {}

  static getInstance(): WebVitalsMonitor {
    if (!WebVitalsMonitor.instance) {
      WebVitalsMonitor.instance = new WebVitalsMonitor();
    }
    return WebVitalsMonitor.instance;
  }

  // Inicializar o monitoramento
  initialize(config: {
    analyticsEndpoints?: string[];
    enableAlerts?: boolean;
    enableStorage?: boolean;
    customMetrics?: boolean;
  } = {}): void {
    if (this.isInitialized) return;

    const {
      analyticsEndpoints = [],
      enableAlerts = true,
      enableStorage = true,
      customMetrics = true
    } = config;

    // Adicionar endpoints de analytics
    analyticsEndpoints.forEach(endpoint => {
      analyticsDispatcher.addEndpoint(endpoint);
    });

    // Configurar alertas
    if (enableAlerts) {
      this.setupAlerts();
    }

    // Iniciar monitoramento dos Core Web Vitals
    this.trackCoreWebVitals();

    // Monitorar métricas customizadas se habilitado
    if (customMetrics) {
      this.trackCustomMetrics();
    }

    // Configurar event listeners para navigation timing
    this.setupNavigationTiming();

    this.isInitialized = true;
    console.log('Web Vitals Monitor initialized');
  }

  // Configurar alertas
  private setupAlerts(): void {
    Object.entries(PERFORMANCE_THRESHOLDS).forEach(([metric, threshold]) => {
      alertSystem.addAlert(metric, {
        threshold: threshold.poor,
        enabled: true,
        callback: (metric) => {
          console.warn(`Performance Alert: ${metric.name} is ${metric.rating} (${metric.value}${threshold.unit})`);
          
          // Enviar para analytics
          analyticsDispatcher.send({
            ...metric,
            ...collectContext(),
            id: generateId(),
          });

          // Dispara evento customizado
          window.dispatchEvent(new CustomEvent('web-vitals-alert', {
            detail: metric
          }));
        }
      });
    });
  }

  // Monitorar Core Web Vitals
  private trackCoreWebVitals(): void {
    const trackMetric = (metric: Metric) => {
      const webVitalMetric: WebVitalMetric = {
        ...metric,
        ...collectContext(),
        rating: getRating(metric.name, metric.value),
      };

      // Salvar se storage habilitado
      if (typeof localStorage !== 'undefined') {
        storage.save(webVitalMetric);
      }

      // Verificar alertas
      alertSystem.check(webVitalMetric);

      // Adicionar à lista local
      this.metrics.push(webVitalMetric);
      
      // Notificar subscribers
      this.notifySubscribers();

      // Enviar para analytics
      analyticsDispatcher.send(webVitalMetric);
    };

    // Track todos os Core Web Vitals
    getCLS(trackMetric);
    getFID(trackMetric);
    getFCP(trackMetric);
    getLCP(trackMetric);
    getTTFB(trackMetric);
  }

  // Monitorar métricas customizadas
  private trackCustomMetrics(): void {
    // Time to Interactive (TTI)
    this.trackTTI();
    
    // Total Blocking Time (TBT)
    this.trackTBT();
    
    // Custom performance marks
    this.trackCustomMarks();
  }

  // Track TTI
  private trackTTI(): void {
    // Implementação simplificada do TTI
    const trackTTIMetric = (tti: number) => {
      const metric: CustomMetric = {
        name: 'TTI',
        value: tti,
        rating: getRating('TTI', tti),
        timestamp: Date.now(),
        url: window.location.href,
        metadata: { type: 'custom' }
      };

      this.notifyCustomMetric(metric);
    };

    // Usar performance observer para detectar TTI
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navigation = entry as PerformanceNavigationTiming;
          // TTI é aproximadamente quando a página fica interativa
          // Isso é uma simplificação - implementação real seria mais complexa
          const tti = navigation.domInteractive || navigation.loadEventEnd;
          if (tti > 0) {
            trackTTIMetric(tti);
          }
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
  }

  // Track TBT
  private trackTBT(): void {
    let totalBlockingTime = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          totalBlockingTime += entry.duration;
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    // Enviar TBT após um tempo
    setTimeout(() => {
      if (totalBlockingTime > 0) {
        const metric: CustomMetric = {
          name: 'TBT',
          value: totalBlockingTime,
          rating: getRating('TBT', totalBlockingTime),
          timestamp: Date.now(),
          url: window.location.href,
          metadata: { type: 'custom' }
        };

        this.notifyCustomMetric(metric);
      }
    }, 5000);
  }

  // Track custom performance marks
  private trackCustomMarks(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'mark') {
          const metric: CustomMetric = {
            name: `mark_${entry.name}`,
            value: entry.startTime,
            rating: 'good', // Marks são geralmente positivos
            timestamp: Date.now(),
            url: window.location.href,
            metadata: { 
              type: 'custom',
              markName: entry.name,
              startTime: entry.startTime
            }
          };

          this.notifyCustomMetric(metric);
        }
      }
    });

    observer.observe({ entryTypes: ['mark'] });
  }

  // Configurar navigation timing
  private setupNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const timingMetrics: Record<string, number> = {
            'DNS': navigation.domainLookupEnd - navigation.domainLookupStart,
            'TCP': navigation.connectEnd - navigation.connectStart,
            'Request': navigation.responseStart - navigation.requestStart,
            'Response': navigation.responseEnd - navigation.responseStart,
            'DOM Processing': navigation.domComplete - navigation.domLoading,
            'Load': navigation.loadEventEnd - navigation.loadEventStart,
          };

          Object.entries(timingMetrics).forEach(([name, value]) => {
            if (value > 0) {
              const metric: CustomMetric = {
                name: `timing_${name.toLowerCase().replace(' ', '_')}`,
                value,
                rating: 'good',
                timestamp: Date.now(),
                url: window.location.href,
                metadata: { 
                  type: 'navigation-timing',
                  phase: name
                }
              };

              this.notifyCustomMetric(metric);
            }
          });
        }
      }, 0);
    });
  }

  // Notificar subscribers com novas métricas
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback([...this.metrics]);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Notificar métrica customizada
  private notifyCustomMetric(metric: CustomMetric): void {
    // Converter para WebVitalMetric para compatibilidade
    const webVitalMetric: WebVitalMetric = {
      ...metric,
      id: generateId(),
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType,
    };

    this.metrics.push(webVitalMetric);
    this.notifySubscribers();
  }

  // API pública
  subscribe(callback: (metrics: WebVitalMetric[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getMetrics(): WebVitalMetric[] {
    return [...this.metrics];
  }

  getMetricsByName(name: string): WebVitalMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  getCurrentScore(): {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
    overall: number;
  } {
    const getLatestValue = (name: string): number => {
      const metrics = this.getMetricsByName(name);
      return metrics.length > 0 ? metrics[metrics.length - 1].value : 0;
    };

    const fcp = getLatestValue('FCP');
    const lcp = getLatestValue('LCP');
    const fid = getLatestValue('FID');
    const cls = getLatestValue('CLS');
    const ttfb = getLatestValue('TTFB');

    // Calcular score baseado nos thresholds
    const calculateScore = (name: string, value: number): number => {
      const threshold = PERFORMANCE_THRESHOLDS[name];
      if (!threshold) return 100;
      
      if (value <= threshold.good) return 100;
      if (value <= threshold.poor) return 50;
      return 0;
    };

    const scores = [
      calculateScore('FCP', fcp),
      calculateScore('LCP', lcp),
      calculateScore('FID', fid),
      calculateScore('CLS', cls),
      calculateScore('TTFB', ttfb),
    ];

    const overall = scores.reduce((a, b) => a + b, 0) / scores.length;

    return { fcp, lcp, fid, cls, ttfb, overall };
  }

  getTrends(): Record<string, ReturnType<TrendAnalyzer['analyze']>> {
    const trends: Record<string, ReturnType<TrendAnalyzer['analyze']>> = {};
    
    ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].forEach(metric => {
      trends[metric] = trendAnalyzer.analyze(this.metrics, metric);
    });

    return trends;
  }

  // Método para marcar performance customizada
  mark(name: string): void {
    performance.mark(name);
  }

  // Método para medir performance customizada
  measure(name: string, startMark: string, endMark?: string): number {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    return measure ? measure.duration : 0;
  }

  // Limpar dados
  clear(): void {
    this.metrics = [];
    storage.clear();
    alertSystem.clear();
  }
}

// Instância singleton
export const webVitalsMonitor = WebVitalsMonitor.getInstance();

// Inicialização automática se em ambiente de browser
if (typeof window !== 'undefined') {
  // Aguardar DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      webVitalsMonitor.initialize();
    });
  } else {
    webVitalsMonitor.initialize();
  }
}

export default webVitalsMonitor;