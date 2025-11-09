/**
 * Web Vitals Monitoring System - Main Export
 * Sistema completo de monitoramento de Core Web Vitals
 */

// Core monitoring
export { 
  WebVitalsMonitor, 
  webVitalsMonitor 
} from './web-vitals-monitor';

export type {
  WebVitalMetric,
  CustomMetric,
  PerformanceThreshold,
  AlertConfig,
  PerformanceBudget
} from './web-vitals-monitor';

export { 
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_BUDGETS,
  getRating 
} from './web-vitals-monitor';

// React hooks
export { 
  useWebVitals,
  useComponentPerformance,
  useAPIPerformance,
  useRenderPerformance
} from './useWebVitals';

export type {
  WebVitalsData,
  UseWebVitalsOptions,
  PerformanceMarkOptions,
  PerformanceMeasureOptions
} from './useWebVitals';

// Analytics integrations
export {
  GoogleAnalyticsIntegration,
  SentryPerformanceIntegration,
  LighthouseIntegration,
  AnalyticsIntegrationFactory,
  initializeAnalytics,
  getAnalyticsFactory,
  sendToAllAnalytics,
  sendBudgetViolation
} from './analytics-integration';

// Performance testing
export {
  CoreWebVitalsValidator,
  PerformanceTestRunner,
  LighthouseConfigGenerator,
  DEFAULT_PERFORMANCE_BUDGETS
} from './performance-testing';

export type {
  LighthouseConfig
} from './performance-testing';

// Dashboard component
export { PerformanceDashboard } from '../components/performance/PerformanceDashboard';

// Performance monitoring utilities
export class WebVitalsUtils {
  // Utility para detectar se o browser suporta Web Vitals
  static isWebVitalsSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    return !!(
      'PerformanceObserver' in window &&
      'getEntriesByType' in performance &&
      'mark' in performance &&
      'measure' in performance
    );
  }

  // Utility para detectar Core Web Vitals support
  static getSupportedMetrics(): string[] {
    const supported: string[] = [];
    
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Verificar suporte a navegação
      try {
        new PerformanceObserver(() => {}).observe({ entryTypes: ['navigation'] });
        supported.push('TTFB', 'FCP');
      } catch {}
      
      // Verificar suporte a paint
      try {
        new PerformanceObserver(() => {}).observe({ entryTypes: ['paint'] });
        supported.push('FCP');
      } catch {}
      
      // Verificar suporte a layout shift
      try {
        new PerformanceObserver(() => {}).observe({ entryTypes: ['layout-shift'] });
        supported.push('CLS');
      } catch {}
      
      // Verificar suporte a long tasks
      try {
        new PerformanceObserver(() => {}).observe({ entryTypes: ['longtask'] });
        supported.push('TBT');
      } catch {}
    }
    
    return supported;
  }

  // Utility para formatar valores de métricas
  static formatMetricValue(value: number, metric: string): string {
    switch (metric) {
      case 'CLS':
        return value.toFixed(3);
      case 'FCP':
      case 'LCP':
      case 'FID':
      case 'TTFB':
      case 'TBT':
      case 'TTI':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  }

  // Utility para calcular score baseado em thresholds
  static calculateScore(value: number, metric: string, thresholds: Record<string, { good: number; poor: number }>): number {
    const threshold = thresholds[metric];
    if (!threshold) return 100;
    
    if (value <= threshold.good) return 100;
    if (value <= threshold.poor) return 50;
    return 0;
  }

  // Utility para detectar se está rodando em ambiente de teste
  static isTestEnvironment(): boolean {
    if (typeof window === 'undefined') return true;
    
    return !!(
      window.location.search.includes('test') ||
      window.location.search.includes('vitest') ||
      window.location.search.includes('playwright') ||
      (navigator.userAgent && navigator.userAgent.includes('Headless'))
    );
  }

  // Utility para debounce de métricas
  static debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    }) as T;
  }

  // Utility para throttle de métricas
  static throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  // Utility para detectar Connection API
  static getConnectionInfo(): {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null {
    if (typeof window === 'undefined' || !(navigator as any).connection) {
      return null;
    }
    
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }

  // Utility para detectar Device Memory API
  static getDeviceMemory(): number | null {
    if (typeof window === 'undefined' || !(navigator as any).deviceMemory) {
      return null;
    }
    
    return (navigator as any).deviceMemory;
  }

  // Utility para detectar Hardware Concurrency
  static getHardwareConcurrency(): number | null {
    if (typeof window === 'undefined' || !navigator.hardwareConcurrency) {
      return null;
    }
    
    return navigator.hardwareConcurrency;
  }

  // Utility para medir performance de função
  static measureFunction<T extends (...args: any[]) => any>(
    fn: T, 
    name: string = 'function'
  ): T & { getLastMeasurement: () => number } {
    let lastMeasurement = 0;
    
    const measuredFunction = ((...args: any[]) => {
      const start = performance.now();
      const result = fn.apply(null, args);
      const end = performance.now();
      
      lastMeasurement = end - start;
      
      // Marcar no Performance API
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${name}-end`);
        performance.measure(`${name}`, `${name}-start`, `${name}-end`);
      }
      
      return result;
    }) as T & { getLastMeasurement: () => number };
    
    measuredFunction.getLastMeasurement = () => lastMeasurement;
    
    return measuredFunction;
  }

  // Utility para aguardar DOM ready
  static waitForDOM(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        resolve();
      }
    });
  }

  // Utility para aguardar window load
  static waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve());
      }
    });
  }

  // Utility para criar URL de teste personalizada
  static createTestUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }

  // Utility para detectar se performance está reduzida
  static isPerformanceReduced(): boolean {
    const connection = this.getConnectionInfo();
    const deviceMemory = this.getDeviceMemory();
    
    // Considera performance reduzida se:
    // - Connection é 2g ou slower
    // - Device memory <= 2GB
    // - Save data está ativado
    
    if (connection) {
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        return true;
      }
      if (connection.saveData) {
        return true;
      }
    }
    
    if (deviceMemory && deviceMemory <= 2) {
      return true;
    }
    
    return false;
  }

  // Utility para obter user agent info
  static getUserAgentInfo(): {
    browser: string;
    version: string;
    os: string;
    isMobile: boolean;
    isBot: boolean;
  } {
    const userAgent = navigator.userAgent;
    
    // Detectar browser
    let browser = 'Unknown';
    let version = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
      version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Edge')) {
      browser = 'Edge';
      version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }
    
    // Detectar OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return {
      browser,
      version,
      os,
      isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
      isBot: /bot|crawler|spider|crawling/i.test(userAgent)
    };
  }
}

// Configuração padrão do sistema
export const DEFAULT_CONFIG = {
  // Web Vitals thresholds (Google's recommendations)
  thresholds: PERFORMANCE_THRESHOLDS,
  
  // Performance budgets
  budgets: PERFORMANCE_BUDGETS,
  
  // Configurações de coleta
  collection: {
    sampleRate: 1.0, // 100% dos usuários
    bufferSize: 1000,
    flushInterval: 5000, // 5 seconds
    enableAlerts: true,
    enableStorage: true,
    enableCustomMetrics: true
  },
  
  // Configurações de analytics
  analytics: {
    googleAnalyticsId: process.env.REACT_APP_GA_MEASUREMENT_ID,
    enableSentry: true,
    enableLighthouse: true,
    endpoints: []
  },
  
  // Configurações de teste
  testing: {
    urls: ['http://localhost:3000'],
    runs: 3,
    budgets: DEFAULT_PERFORMANCE_BUDGETS
  }
};

// Factory para criar sistema completo
export class WebVitalsSystem {
  private monitor: ReturnType<typeof webVitalsMonitor>;
  private analytics: ReturnType<typeof initializeAnalytics> | null;
  private isInitialized = false;

  constructor(config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG) {
    this.monitor = webVitalsMonitor;
    this.analytics = null;
  }

  // Inicializar sistema completo
  async initialize(config: typeof DEFAULT_CONFIG = DEFAULT_CONFIG): Promise<void> {
    if (this.isInitialized) return;

    // Aguardar DOM estar pronto
    await WebVitalsUtils.waitForDOM();
    
    // Inicializar monitor principal
    this.monitor.initialize({
      analyticsEndpoints: config.analytics.endpoints,
      enableAlerts: config.collection.enableAlerts,
      enableStorage: config.collection.enableStorage,
      customMetrics: config.collection.enableCustomMetrics
    });

    // Inicializar analytics se configurado
    if (config.analytics.googleAnalyticsId || config.analytics.enableSentry) {
      this.analytics = initializeAnalytics({
        googleAnalyticsId: config.analytics.googleAnalyticsId,
        enableSentry: config.analytics.enableSentry,
        enableLighthouse: config.analytics.enableLighthouse
      });
    }

    this.isInitialized = true;
  }

  // Obter instância do monitor
  getMonitor() {
    return this.monitor;
  }

  // Obter instância do analytics
  getAnalytics() {
    return this.analytics;
  }

  // Verificar se está inicializado
  isReady() {
    return this.isInitialized;
  }
}

// Instância global do sistema
let globalSystem: WebVitalsSystem | null = null;

// Inicializar sistema global
export const initializeWebVitalsSystem = async (config?: typeof DEFAULT_CONFIG): Promise<WebVitalsSystem> => {
  globalSystem = new WebVitalsSystem(config);
  await globalSystem.initialize(config);
  return globalSystem;
};

// Obter sistema global
export const getWebVitalsSystem = (): WebVitalsSystem | null => {
  return globalSystem;
};

// Auto-inicialização em ambiente de browser
if (typeof window !== 'undefined') {
  // Não auto-inicializar em ambiente de teste
  if (!WebVitalsUtils.isTestEnvironment()) {
    // Aguardar um pouco para não interferir com inicialização da app
    setTimeout(() => {
      initializeWebVitalsSystem().catch(error => {
        console.warn('Failed to auto-initialize Web Vitals system:', error);
      });
    }, 100);
  }
}

export default {
  WebVitalsMonitor,
  WebVitalsUtils,
  WebVitalsSystem,
  DEFAULT_CONFIG,
  initializeWebVitalsSystem,
  getWebVitalsSystem
};