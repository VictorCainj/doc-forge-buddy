/**
 * React Hook para Web Vitals Monitoring
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { webVitalsMonitor, WebVitalMetric, CustomMetric } from './web-vitals-monitor';

export interface WebVitalsData {
  metrics: WebVitalMetric[];
  currentScore: {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
    overall: number;
  };
  trends: Record<string, {
    trend: 'improving' | 'degrading' | 'stable';
    change: number;
    average: number;
    percentile95: number;
  }>;
  isLoading: boolean;
  error: string | null;
}

export interface UseWebVitalsOptions {
  autoStart?: boolean;
  enableAlerts?: boolean;
  analyticsEndpoints?: string[];
  onMetric?: (metric: WebVitalMetric) => void;
  onAlert?: (metric: WebVitalMetric) => void;
}

export interface PerformanceMarkOptions {
  name: string;
  detail?: any;
}

export interface PerformanceMeasureOptions {
  name: string;
  startMark: string;
  endMark?: string;
  detail?: any;
}

// Hook principal para Web Vitals
export const useWebVitals = (options: UseWebVitalsOptions = {}) => {
  const {
    autoStart = true,
    enableAlerts = true,
    analyticsEndpoints = [],
    onMetric,
    onAlert
  } = options;

  const [data, setData] = useState<WebVitalsData>({
    metrics: [],
    currentScore: { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0, overall: 0 },
    trends: {},
    isLoading: true,
    error: null
  });

  const isInitialized = useRef(false);

  // Inicializar monitor
  useEffect(() => {
    if (autoStart && !isInitialized.current) {
      webVitalsMonitor.initialize({
        analyticsEndpoints,
        enableAlerts,
        enableStorage: true,
        customMetrics: true
      });
      isInitialized.current = true;
    }
  }, [autoStart, enableAlerts, analyticsEndpoints]);

  // Subscrever para atualizações
  useEffect(() => {
    const unsubscribe = webVitalsMonitor.subscribe((metrics) => {
      setData(prev => ({
        ...prev,
        metrics,
        currentScore: webVitalsMonitor.getCurrentScore(),
        trends: webVitalsMonitor.getTrends(),
        isLoading: false,
        error: null
      }));

      // Callback para nova métrica
      if (onMetric && metrics.length > 0) {
        const latestMetric = metrics[metrics.length - 1];
        onMetric(latestMetric);
      }
    });

    return unsubscribe;
  }, [onMetric]);

  // Setup alertas
  useEffect(() => {
    if (onAlert) {
      const handleAlert = (event: CustomEvent) => {
        onAlert(event.detail);
      };

      window.addEventListener('web-vitals-alert', handleAlert as EventListener);
      return () => {
        window.removeEventListener('web-vitals-alert', handleAlert as EventListener);
      };
    }
  }, [onAlert]);

  // API para marcar performance
  const mark = useCallback((name: string, detail?: any) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      if (detail) {
        performance.mark(name, { detail });
      } else {
        performance.mark(name);
      }
    }
    webVitalsMonitor.mark(name);
  }, []);

  // API para medir performance
  const measure = useCallback((name: string, startMark: string, endMark?: string, detail?: any) => {
    let duration = 0;
    
    if (typeof performance !== 'undefined' && performance.measure) {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0];
      duration = measure ? measure.duration : 0;
    }

    const customDuration = webVitalsMonitor.measure(name, startMark, endMark);
    return duration || customDuration;
  }, []);

  // Obter métricas específicas
  const getMetric = useCallback((name: string) => {
    return data.metrics.filter(metric => metric.name === name);
  }, [data.metrics]);

  // Obter último valor de uma métrica
  const getLatestMetric = useCallback((name: string) => {
    const metrics = getMetric(name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }, [getMetric]);

  // Verificar se métrica está dentro do threshold
  const isMetricGood = useCallback((name: string) => {
    const latest = getLatestMetric(name);
    return latest ? latest.rating === 'good' : true;
  }, [getLatestMetric]);

  // Obter score geral
  const getOverallScore = useCallback(() => {
    return data.currentScore.overall;
  }, [data.currentScore.overall]);

  // Limpar dados
  const clear = useCallback(() => {
    webVitalsMonitor.clear();
    setData(prev => ({
      ...prev,
      metrics: [],
      isLoading: true,
      error: null
    }));
  }, []);

  return {
    // Dados
    metrics: data.metrics,
    currentScore: data.currentScore,
    trends: data.trends,
    isLoading: data.isLoading,
    error: data.error,
    
    // APIs
    mark,
    measure,
    getMetric,
    getLatestMetric,
    isMetricGood,
    getOverallScore,
    clear,
    
    // Utilitários
    getStatus: () => ({
      isGood: getOverallScore() >= 90,
      isNeedsImprovement: getOverallScore() >= 50 && getOverallScore() < 90,
      isPoor: getOverallScore() < 50,
      score: getOverallScore()
    })
  };
};

// Hook para performance de componentes específicos
export const useComponentPerformance = (componentName: string, options: UseWebVitalsOptions = {}) => {
  const webVitals = useWebVitals(options);
  const mountTime = useRef<number>(0);

  // Marcar tempo de montagem
  useEffect(() => {
    mountTime.current = performance.now();
    webVitals.mark(`${componentName}-mount`);
  }, [componentName]);

  // Marcar tempo de desmontagem
  useEffect(() => {
    return () => {
      const unmountTime = performance.now();
      const renderTime = unmountTime - mountTime.current;
      webVitals.mark(`${componentName}-unmount`, { renderTime });
    };
  }, [componentName]);

  // Medir performance de função específica
  const measureFunction = useCallback((functionName: string, fn: () => any) => {
    const startMark = `${componentName}-${functionName}-start`;
    const endMark = `${componentName}-${functionName}-end`;
    
    webVitals.mark(startMark);
    
    try {
      const result = fn();
      
      // Se for Promise, medir após resolução
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          webVitals.mark(endMark);
          const duration = webVitals.measure(`${componentName}-${functionName}`, startMark, endMark);
          return duration;
        });
      } else {
        webVitals.mark(endMark);
        const duration = webVitals.measure(`${componentName}-${functionName}`, startMark, endMark);
        return { result, duration };
      }
    } catch (error) {
      webVitals.mark(endMark);
      webVitals.measure(`${componentName}-${functionName}`, startMark, endMark);
      throw error;
    }
  }, [componentName, webVitals]);

  return {
    ...webVitals,
    measureFunction
  };
};

// Hook para monitorar performance de API calls
export const useAPIPerformance = (options: UseWebVitalsOptions = {}) => {
  const webVitals = useWebVitals(options);
  const activeRequests = useRef<Map<string, number>>(new Map());

  const trackRequest = useCallback((requestId: string) => {
    const startMark = `api-request-${requestId}-start`;
    webVitals.mark(startMark);
    activeRequests.current.set(requestId, performance.now());
  }, [webVitals]);

  const trackResponse = useCallback((requestId: string, success: boolean = true) => {
    const startTime = activeRequests.current.get(requestId);
    const endMark = `api-request-${requestId}-end`;
    
    if (startTime) {
      webVitals.mark(endMark);
      const duration = webVitals.measure(`api-request-${requestId}`, `api-request-${requestId}-start`, endMark);
      
      // Marcar se foi bem-sucedido ou falhou
      webVitals.mark(`api-${success ? 'success' : 'error'}-${requestId}`, { 
        duration,
        requestId 
      });
      
      activeRequests.current.delete(requestId);
      return duration;
    }
    
    return 0;
  }, [webVitals]);

  const getActiveRequests = useCallback(() => {
    return activeRequests.current.size;
  }, []);

  const getAverageResponseTime = useCallback((requestId?: string) => {
    // Implementar cálculo de tempo médio de resposta
    return 0; // Placeholder
  }, []);

  return {
    ...webVitals,
    trackRequest,
    trackResponse,
    getActiveRequests,
    getAverageResponseTime
  };
};

// Hook para performance de renderização
export const useRenderPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const totalRenderTime = useRef(0);

  useEffect(() => {
    const now = performance.now();
    const renderTime = renderCount.current > 0 ? now - lastRenderTime.current : 0;
    
    lastRenderTime.current = now;
    totalRenderTime.current += renderTime;
    renderCount.current += 1;

    // Marcar renderização
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${componentName}-render-${renderCount.current}`);
    }
  });

  const getStats = useCallback(() => ({
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    totalRenderTime: totalRenderTime.current,
    averageRenderTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0
  }), [componentName]);

  return {
    getStats,
    renderCount: renderCount.current
  };
};

export default useWebVitals;