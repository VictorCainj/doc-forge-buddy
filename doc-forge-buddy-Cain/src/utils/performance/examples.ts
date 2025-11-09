// Exemplo de uso das ferramentas de performance monitoring
// Este arquivo demonstra como usar o sistema implementado

import { useEffect, useState } from 'react';
import { 
  getPerformanceData, 
  reportPerformanceData,
  markPerformance,
  getNavigationTiming,
  performanceCollector 
} from '@/utils/performance';

// Exemplo 1: Hook para performance data
export const usePerformanceData = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const updateData = () => {
      setData(getPerformanceData());
    };

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateData, 5000);
    
    // Subscribe para mudanças
    const unsubscribe = performanceCollector.subscribe((metric, rating) => {
      console.log(`Performance ${metric}: ${rating}`);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return data;
};

// Exemplo 2: Performance wrapper para operações pesadas
export const withPerformanceTracking = async <T>(
  operation: () => Promise<T>,
  name: string
): Promise<T> => {
  const startMark = `${operation}-start`;
  const endMark = `${operation}-end`;
  
  // Marcar início
  markPerformance(startMark);
  
  try {
    const result = await operation();
    
    // Marcar fim e medir
    markPerformance(endMark, startMark);
    
    // Reportar resultado
    if (process.env.NODE_ENV === 'development') {
      console.log(`Operation ${name} completed`);
    }
    
    return result;
  } catch (error) {
    console.error(`Operation ${name} failed:`, error);
    throw error;
  }
};

// Exemplo 3: Componente com performance monitoring
export const HeavyComponent = () => {
  useEffect(() => {
    // Marcar carregamento do componente
    markPerformance('component-load');
    
    // Monitoring custom para renderização
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && entry.name.includes('component')) {
          console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Seu conteúdo */}
    </div>
  );
};

// Exemplo 4: API route performance tracking
export const trackApiCall = async (url: string, options: RequestInit) => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    
    // Marcar duração da API
    markPerformance(`api-${url}`, undefined);
    performance.mark(`api-${url}-end`);
    performance.measure(`api-${url}-duration`, `api-${url}`, `api-${url}-end`);
    
    // Reportar se muito lenta
    const duration = endTime - startTime;
    if (duration > 2000) {
      console.warn(`Slow API call: ${url} took ${duration.toFixed(2)}ms`);
    }
    
    return response;
  } catch (error) {
    console.error(`API call failed: ${url}`, error);
    throw error;
  }
};

// Exemplo 5: Lazy loading com performance tracking
export const LazyComponent = () => {
  useEffect(() => {
    const loadComponent = async () => {
      markPerformance('lazy-load-start');
      
      // Simular carregamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      markPerformance('lazy-load-end', 'lazy-load-start');
    };
    
    loadComponent();
  }, []);

  return <div>Componente carregado lazy</div>;
};

// Exemplo 6: Monitoring de performance crítica
export const CriticalPerformanceTracker = () => {
  useEffect(() => {
    // Monitor FCP e LCP
    const trackCriticalMetrics = () => {
      const data = getPerformanceData();
      const { metrics, summary } = data;
      
      // Alertar se LCP é muito alto
      if (metrics.LCP && metrics.LCP.value > 4000) {
        console.error('Critical LCP issue:', metrics.LCP.value);
      }
      
      // Alertar se CLS é muito alto
      if (metrics.CLS && metrics.CLS.value > 0.25) {
        console.error('Critical CLS issue:', metrics.CLS.value);
      }
    };
    
    // Verificar após carregamento completo
    window.addEventListener('load', trackCriticalMetrics);
    
    return () => {
      window.removeEventListener('load', trackCriticalMetrics);
    };
  }, []);

  return null;
};

// Exemplo 7: Manual performance report
export const generatePerformanceReport = () => {
  const data = getPerformanceData();
  const navigation = getNavigationTiming();
  
  return {
    webVitals: {
      fcp: data.metrics.FCP?.value,
      lcp: data.metrics.LCP?.value,
      cls: data.metrics.CLS?.value,
      inp: data.metrics.INP?.value,
      ttfb: data.metrics.TTFB?.value,
    },
    navigation: {
      dns: navigation?.dns,
      tcp: navigation?.tcp,
      ttfb: navigation?.ttfb,
      dom: navigation?.dom,
      load: navigation?.load,
    },
    summary: data.summary,
    timestamp: new Date().toISOString(),
  };
};

// Exemplo 8: Conditional performance reporting
export const reportIfPoorPerformance = () => {
  const summary = performanceCollector.getSummary();
  
  if (summary.overall === 'poor') {
    // Reportar para analytics em produção
    if (process.env.NODE_ENV === 'production') {
      reportPerformanceData('sentry');
    } else {
      // Em desenvolvimento, mostrar no console
      console.group('🚨 Performance Issues Detected');
      summary.issues.forEach(issue => console.warn(issue));
      console.groupEnd();
    }
  }
};

// Exemplo 9: Performance budget checker
export const checkPerformanceBudget = () => {
  const data = getPerformanceData();
  const budgets = {
    LCP: 2500, // 2.5s
    INP: 200,  // 200ms
    CLS: 0.1,  // 0.1
    TTFB: 800, // 800ms
  };
  
  const violations = Object.entries(budgets).filter(([metric, budget]) => {
    const value = data.metrics[metric]?.value;
    return value && value > budget;
  });
  
  if (violations.length > 0) {
    console.warn('Performance budget violations:', violations);
  }
  
  return violations;
};

// Exemplo 10: Component lifecycle performance
export const useComponentPerformance = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`${componentName} mounted for ${duration.toFixed(2)}ms`);
      
      // Reportar se o componente ficou muito tempo montado
      if (duration > 10000) { // 10 segundos
        console.warn(`Long-lived component: ${componentName}`);
      }
    };
  }, [componentName]);
};

// Export utilities for easy access
export default {
  usePerformanceData,
  withPerformanceTracking,
  trackApiCall,
  generatePerformanceReport,
  reportIfPoorPerformance,
  checkPerformanceBudget,
  useComponentPerformance,
};