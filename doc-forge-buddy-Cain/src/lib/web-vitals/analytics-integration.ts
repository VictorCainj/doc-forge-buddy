/**
 * Integrações com ferramentas de analytics
 * Google Analytics, Sentry, Lighthouse CI
 */

import { WebVitalMetric, CustomMetric } from './web-vitals-monitor';

// Configuração do Google Analytics 4
export class GoogleAnalyticsIntegration {
  private measurementId: string;
  private isInitialized = false;

  constructor(measurementId: string) {
    this.measurementId = measurementId;
  }

  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Carregar gtag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Configurar gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.measurementId, {
      custom_map: {
        'custom_parameter_1': 'web_vitals_version'
      }
    });

    this.isInitialized = true;
  }

  // Enviar métrica para GA4
  sendWebVital(metric: WebVitalMetric): void {
    if (!this.isInitialized) return;

    const eventName = this.getEventName(metric.name);
    
    (window as any).gtag('event', eventName, {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.value * 100) / 100, // Arredondar para 2 casas decimais
      custom_parameter_1: '1.0', // Versão do web vitals
      custom_parameter_2: metric.rating,
      custom_parameter_3: metric.url,
      
      // Métricas específicas
      metric_id: metric.id,
      metric_rating: metric.rating,
      metric_value: Math.round(metric.value * 100) / 100,
      
      // Contexto adicional
      page_location: metric.url,
      page_referrer: document.referrer,
      user_agent: metric.userAgent,
      
      // Timing
      timestamp: metric.timestamp,
      
      // Performance context
      connection_type: metric.connectionType,
      device_memory: metric.deviceMemory,
      navigation_type: metric.navigationType,
    });
  }

  // Enviar métrica customizada
  sendCustomMetric(metric: CustomMetric): void {
    if (!this.isInitialized) return;

    (window as any).gtag('event', 'custom_performance_metric', {
      event_category: 'Custom Metrics',
      event_label: metric.name,
      value: Math.round(metric.value * 100) / 100,
      custom_parameter_1: metric.name,
      custom_parameter_2: metric.rating,
      custom_parameter_3: JSON.stringify(metric.metadata || {}),
      
      // Contexto
      page_location: metric.url,
      timestamp: metric.timestamp,
    });
  }

  // Enviar evento de performance budget
  sendBudgetViolation(budget: string, actual: number, budgetLimit: number): void {
    if (!this.isInitialized) return;

    (window as any).gtag('event', 'performance_budget_violation', {
      event_category: 'Performance Budgets',
      event_label: budget,
      value: actual,
      custom_parameter_1: budget,
      custom_parameter_2: budgetLimit.toString(),
      custom_parameter_3: (actual > budgetLimit).toString(),
    });
  }

  // Mapear nomes de métricas para eventos do GA
  private getEventName(metricName: string): string {
    const eventMap: Record<string, string> = {
      'FCP': 'first_contentful_paint',
      'LCP': 'largest_contentful_paint',
      'FID': 'first_input_delay',
      'CLS': 'cumulative_layout_shift',
      'TTFB': 'time_to_first_byte',
      'TTI': 'time_to_interactive',
      'TBT': 'total_blocking_time'
    };
    return eventMap[metricName] || 'web_vital_metric';
  }
}

// Integração com Sentry para monitoramento de erros de performance
export class SentryPerformanceIntegration {
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined' || !(window as any).Sentry) return;

    const Sentry = (window as any).Sentry;
    
    // Configurar performance monitoring
    Sentry.init({
      tracesSampleRate: 1.0, // Sample rate para tracing
      beforeSendTransaction: (transaction: any) => {
        // Filtrar transactions relevantes para performance
        if (transaction.transaction === 'routeChange' || 
            transaction.transaction === 'pageLoad') {
          return transaction;
        }
        return null;
      }
    });

    this.isInitialized = true;
  }

  // Iniciar transaction para medir performance
  startTransaction(name: string, op: string = 'navigation'): any {
    if (!this.isInitialized || !(window as any).Sentry) return null;

    return (window as any).Sentry.startTransaction({
      name,
      op,
      description: `Performance monitoring for ${name}`
    });
  }

  // Iniciar span dentro de uma transaction
  startSpan(transaction: any, name: string, op: string): any {
    if (!transaction) return null;
    return transaction.startChild({
      op,
      description: name
    });
  }

  // Enviar erro de performance para Sentry
  sendPerformanceError(error: Error, context: {
    metric: string;
    value: number;
    rating: string;
    url: string;
  }): void {
    if (!this.isInitialized || !(window as any).Sentry) return;

    (window as any).Sentry.captureException(error, {
      level: 'warning',
      tags: {
        'performance.metric': context.metric,
        'performance.rating': context.rating,
        'performance.url': context.url
      },
      extra: {
        metric_value: context.value,
        performance_context: context
      }
    });
  }

  // Adicionar dados de performance como breadcrumb
  addPerformanceBreadcrumb(metric: WebVitalMetric): void {
    if (!this.isInitialized || !(window as any).Sentry) return;

    (window as any).Sentry.addBreadcrumb({
      message: `Web Vital: ${metric.name} = ${metric.value} (${metric.rating})`,
      category: 'performance',
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        url: metric.url,
        timestamp: metric.timestamp
      }
    });
  }
}

// Integração com Lighthouse CI
export class LighthouseIntegration {
  private isActive = false;

  // Detectar se está rodando no Lighthouse CI
  detectLighthouseCI(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Verificar variáveis de ambiente ou user agent
    const isLHCI = window.location.search.includes('lhci') || 
                   window.location.search.includes('lighthouse') ||
                   (navigator.userAgent && navigator.userAgent.includes('Lighthouse'));
    
    this.isActive = isLHCI;
    return isLHCI;
  }

  // Inicializar monitor para Lighthouse
  initializeLighthouseMonitoring(): void {
    if (!this.detectLighthouseCI()) return;

    // Sobrescrever console.log para evitar interferir com Lighthouse
    const originalLog = console.log;
    console.log = (...args) => {
      // Filtrar logs de performance para não poluir resultados do Lighthouse
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('Web Vital') || args[0].includes('Performance'))) {
        return;
      }
      originalLog.apply(console, args);
    };

    // Aguardar Lighthouse reportar resultados
    if ((window as any).lhci) {
      this.captureLighthouseResults();
    }
  }

  // Capturar resultados do Lighthouse
  private captureLighthouseResults(): void {
    const interval = setInterval(() => {
      if ((window as any).lhci && (window as any).lhci.results) {
        const results = (window as any).lhci.results;
        this.analyzeLighthouseResults(results);
        clearInterval(interval);
      }
    }, 1000);

    // Timeout após 30 segundos
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
  }

  // Analisar resultados do Lighthouse
  private analyzeLighthouseResults(results: any): void {
    const audits = results.audits;
    
    if (audits) {
      // Extrair Core Web Vitals
      const coreWebVitals = {
        FCP: audits['first-contentful-paint']?.numericValue,
        LCP: audits['largest-contentful-paint']?.numericValue,
        CLS: audits['cumulative-layout-shift']?.numericValue,
        FID: audits['max-potential-fid']?.numericValue
      };

      // Log dos resultados
      console.log('Lighthouse Performance Results:', {
        performance: results.categories?.performance?.score,
        coreWebVitals,
        opportunities: Object.values(audits)
          .filter((audit: any) => audit.details?.overallSavingsBytes > 0)
          .map((audit: any) => ({
            id: audit.id,
            title: audit.title,
            savings: audit.details.overallSavingsBytes
          }))
      });

      // Enviar para analytics se disponível
      this.sendLighthouseResultsToAnalytics(coreWebVitals, results);
    }
  }

  // Enviar resultados do Lighthouse para analytics
  private sendLighthouseResultsToAnalytics(coreWebVitals: any, results: any): void {
    // Implementar integração com Google Analytics ou outro sistema
    if ((window as any).gtag) {
      (window as any).gtag('event', 'lighthouse_performance', {
        event_category: 'Lighthouse CI',
        value: Math.round((results.categories?.performance?.score || 0) * 100),
        custom_parameter_1: 'fcp',
        custom_parameter_2: coreWebVitals.FCP?.toString(),
        custom_parameter_3: 'lcp',
        custom_parameter_4: coreWebVitals.LCP?.toString()
      });
    }
  }
}

// Factory para criar todas as integrações
export class AnalyticsIntegrationFactory {
  private googleAnalytics?: GoogleAnalyticsIntegration;
  private sentryPerformance?: SentryPerformanceIntegration;
  private lighthouse?: LighthouseIntegration;

  constructor(config: {
    googleAnalyticsId?: string;
    enableSentry?: boolean;
    enableLighthouse?: boolean;
  }) {
    const { googleAnalyticsId, enableSentry = true, enableLighthouse = true } = config;

    if (googleAnalyticsId) {
      this.googleAnalytics = new GoogleAnalyticsIntegration(googleAnalyticsId);
    }

    if (enableSentry) {
      this.sentryPerformance = new SentryPerformanceIntegration();
    }

    if (enableLighthouse) {
      this.lighthouse = new LighthouseIntegration();
    }
  }

  // Inicializar todas as integrações
  initialize(): void {
    if (this.googleAnalytics) {
      this.googleAnalytics.initialize();
    }

    if (this.sentryPerformance) {
      this.sentryPerformance.initialize();
    }

    if (this.lighthouse) {
      this.lighthouse.initializeLighthouseMonitoring();
    }
  }

  // Enviar métrica para todas as integrações
  sendMetric(metric: WebVitalMetric | CustomMetric): void {
    if (this.googleAnalytics) {
      if ('url' in metric && metric.url) {
        this.googleAnalytics.sendWebVital(metric as WebVitalMetric);
      } else {
        this.googleAnalytics.sendCustomMetric(metric as CustomMetric);
      }
    }

    if (this.sentryPerformance) {
      if ('url' in metric) {
        this.sentryPerformance.addPerformanceBreadcrumb(metric as WebVitalMetric);
      }
    }
  }

  // Enviar violação de budget
  sendBudgetViolation(budget: string, actual: number, budgetLimit: number): void {
    if (this.googleAnalytics) {
      this.googleAnalytics.sendBudgetViolation(budget, actual, budgetLimit);
    }
  }

  // Obter instâncias
  getGoogleAnalytics(): GoogleAnalyticsIntegration | undefined {
    return this.googleAnalytics;
  }

  getSentryPerformance(): SentryPerformanceIntegration | undefined {
    return this.sentryPerformance;
  }

  getLighthouse(): LighthouseIntegration | undefined {
    return this.lighthouse;
  }
}

// Instância global de integração
let analyticsFactory: AnalyticsIntegrationFactory | null = null;

// Inicializar integrações
export const initializeAnalytics = (config: {
  googleAnalyticsId?: string;
  enableSentry?: boolean;
  enableLighthouse?: boolean;
}): AnalyticsIntegrationFactory => {
  analyticsFactory = new AnalyticsIntegrationFactory(config);
  analyticsFactory.initialize();
  return analyticsFactory;
};

// Obter instância atual
export const getAnalyticsFactory = (): AnalyticsIntegrationFactory | null => {
  return analyticsFactory;
};

// Enviar métrica para todas as integrações ativas
export const sendToAllAnalytics = (metric: WebVitalMetric | CustomMetric): void => {
  if (analyticsFactory) {
    analyticsFactory.sendMetric(metric);
  }
};

// Enviar violação de budget
export const sendBudgetViolation = (budget: string, actual: number, budgetLimit: number): void => {
  if (analyticsFactory) {
    analyticsFactory.sendBudgetViolation(budget, actual, budgetLimit);
  }
};

export default {
  GoogleAnalyticsIntegration,
  SentryPerformanceIntegration,
  LighthouseIntegration,
  AnalyticsIntegrationFactory,
  initializeAnalytics,
  getAnalyticsFactory,
  sendToAllAnalytics,
  sendBudgetViolation
};