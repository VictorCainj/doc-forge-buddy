/**
 * Sistema de monitoramento e analytics
 * Implementa tracking de erros e métricas de performance (Web Vitals)
 */

// Tipos
interface PerformanceMetrics {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

interface ErrorInfo {
  message: string;
  stack?: string;
  component?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

// Storage de erros local (fallback quando não há sistema externo)
const errors: ErrorInfo[] = [];
const MAX_STORED_ERRORS = 50;

/**
 * Capturar e logar erros
 */
export const logError = (
  error: Error,
  errorInfo?: { componentStack?: string }
) => {
  const errorData: ErrorInfo = {
    message: error.message,
    stack: error.stack,
    component: errorInfo?.componentStack,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Adicionar ao storage local
  errors.push(errorData);
  if (errors.length > MAX_STORED_ERRORS) {
    errors.shift();
  }

  // Log no console em dev
  if (import.meta.env.DEV) {
    console.error('Error captured:', errorData);
  }

  // TODO: Integrar com Sentry ou similar
  // Sentry.captureException(error, { contexts: { react: errorInfo } });
};

/**
 * Monitorar Web Vitals
 */
export const initPerformanceMonitoring = () => {
  const metrics: PerformanceMetrics = {};

  // LCP - Largest Contentful Paint
  const observeLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
      };
      metrics.LCP = lastEntry.renderTime || lastEntry.loadTime || 0;

      if (import.meta.env.DEV) {
        console.log('LCP:', metrics.LCP);
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // LCP não suportado
    }
  };

  // FID - First Input Delay
  const observeFID = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      entries.forEach((entry) => {
        metrics.FID = entry.processingStart - entry.startTime;

        if (import.meta.env.DEV) {
          console.log('FID:', metrics.FID);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch {
      // FID não suportado
    }
  };

  // CLS - Cumulative Layout Shift
  const observeCLS = () => {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEntry[];
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          metrics.CLS = clsValue;

          if (import.meta.env.DEV) {
            console.log('CLS:', metrics.CLS);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch {
      // CLS não suportado
    }
  };

  // FCP - First Contentful Paint
  const observeFCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          metrics.FCP = entry.startTime;

          if (import.meta.env.DEV) {
            console.log('FCP:', metrics.FCP);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch {
      // FCP não suportado
    }
  };

  // TTFB - Time to First Byte
  const measureTTFB = () => {
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.TTFB =
        navigationEntry.responseStart - navigationEntry.requestStart;

      if (import.meta.env.DEV) {
        console.log('TTFB:', metrics.TTFB);
      }
    }
  };

  // Inicializar observers
  observeLCP();
  observeFID();
  observeCLS();
  observeFCP();
  measureTTFB();

  // Retornar métricas
  return metrics;
};

/**
 * Obter erros armazenados
 */
export const getStoredErrors = (): ErrorInfo[] => {
  return [...errors];
};

/**
 * Limpar erros armazenados
 */
export const clearStoredErrors = () => {
  errors.length = 0;
};

/**
 * Inicializar monitoramento global
 */
export const initMonitoring = () => {
  // Capturar erros não tratados
  window.addEventListener('error', (event) => {
    logError(new Error(event.message), {
      componentStack: event.filename + ':' + event.lineno,
    });
  });

  // Capturar rejeições de promessas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    logError(new Error(event.reason), {
      componentStack: 'Unhandled Promise Rejection',
    });
  });

  // Iniciar monitoramento de performance
  initPerformanceMonitoring();

  if (import.meta.env.DEV) {
    console.log('Monitoring initialized');
  }
};
