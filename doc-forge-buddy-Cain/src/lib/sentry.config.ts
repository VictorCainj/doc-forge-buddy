/**
 * Configuração completa do Sentry para error tracking robusto
 * Implementa monitoring avançado, performance tracking e error analytics
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { getEnv } from '@/config/env';
import { addBreadcrumb, captureException, captureMessage, setUser } from './sentry';

// Tipos para configuração avançada
export interface SentryConfig {
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  beforeSend: (event: Sentry.Event, hint: Sentry.EventHint) => Sentry.Event | null;
  beforeBreadcrumb: (breadcrumb: Sentry.Breadcrumb, hint?: Sentry.BreadcrumbHint) => Sentry.Breadcrumb | null;
  integrations: Sentry.Integration[];
}

// Configuração do ambiente
const env = getEnv();

// Configuração de filtering de dados sensíveis
const sanitizeSensitiveData = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'ssn'];
  const sanitized = { ...data };
  
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

// Configuração principal do Sentry
export const sentryConfig: SentryConfig = {
  dsn: env.VITE_SENTRY_DSN,
  environment: env.NODE_ENV || 'development',
  
  // Performance monitoring
  tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  
  // Integrations
  integrations: [
    new BrowserTracing({
      tracingOrigins: [
        'localhost',
        /^https:\/\/.*\.vercel\.app/,
        /^https:\/\/.*\.netlify\.app/,
        env.VITE_API_URL || 'https://api.example.com',
      ],
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React,
        {
          useEffect: React.useEffect,
        },
        {
          routeChangeInstrumentation: 'onRoute',
        }
      ),
    }),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      onlyIfSampled: () => env.NODE_ENV === 'production',
    }),
  ],
  
  // Before send - filter e enrich errors
  beforeSend: (event, hint) => {
    // Filter sensitive data
    if (event.user) {
      delete event.user.email;
      event.user = sanitizeSensitiveData(event.user);
    }
    
    // Remove sensitive data from request/response
    if (event.request) {
      event.request.data = sanitizeSensitiveData(event.request.data);
    }
    
    // Filter out known benign errors
    if (event.exception) {
      const error = hint.originalException;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Navigation and chunk loading errors (common in SPAs)
      if (
        errorMessage.includes('Navigation cancelled') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('ResizeObserver') ||
        errorMessage.includes('Non-Error promise rejection captured')
      ) {
        return null;
      }
    }
    
    // Add custom context
    event.extra = {
      ...event.extra,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      performance: getPerformanceMetrics(),
    };
    
    return event;
  },
  
  // Before breadcrumb - filter verbose logs
  beforeBreadcrumb: (breadcrumb, hint) => {
    // Filter debug console logs in production
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }
    
    // Limit breadcrumb data size
    if (breadcrumb.data && JSON.stringify(breadcrumb.data).length > 2000) {
      breadcrumb.data = { truncated: true };
    }
    
    return breadcrumb;
  },
};

// Função para obter métricas de performance
function getPerformanceMetrics() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  return {
    ttfb: navigation ? navigation.responseStart - navigation.requestStart : null,
    fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || null,
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : null,
    load: navigation ? navigation.loadEventEnd - navigation.navigationStart : null,
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    } : null,
  };
}

// Inicialização do Sentry
export const initSentry = () => {
  if (!env.VITE_SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Sentry DSN não configurado. Error tracking desabilitado.');
    }
    return;
  }

  if (env.NODE_ENV !== 'production' && import.meta.env.DEV) {
    console.log('📊 Sentry configurado (modo desenvolvimento)');
    return;
  }

  Sentry.init({
    ...sentryConfig,
    dsn: env.VITE_SENTRY_DSN,
  });

  // Configure global error handlers
  setupGlobalErrorHandlers();
  
  console.log('✅ Sentry inicializado com sucesso');
};

// Configuração de handlers globais de erro
const setupGlobalErrorHandlers = () => {
  // Window errors
  window.addEventListener('error', (event) => {
    addBreadcrumb({
      message: 'Global error occurred',
      category: 'error',
      level: 'error',
      data: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
      },
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    addBreadcrumb({
      message: 'Unhandled promise rejection',
      category: 'error',
      level: 'error',
      data: {
        reason: event.reason,
        type: 'unhandledrejection',
      },
    });
  });

  // Network errors
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      if (!response.ok) {
        addBreadcrumb({
          message: `Network request failed: ${response.status}`,
          category: 'http',
          level: 'error',
          data: {
            url: args[0],
            method: args[1]?.method || 'GET',
            status: response.status,
            statusText: response.statusText,
          },
        });
      }
      
      return response;
    } catch (error) {
      addBreadcrumb({
        message: 'Network request error',
        category: 'http',
        level: 'error',
        data: {
          url: args[0],
          method: args[1]?.method || 'GET',
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  };
};

// Export das funções principais
export { addBreadcrumb, captureException, captureMessage, setUser };