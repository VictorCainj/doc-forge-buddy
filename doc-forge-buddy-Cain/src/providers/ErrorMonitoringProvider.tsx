/**
 * Error Monitoring Provider
 * Provider principal que inicializa e gerencia todo o sistema de error tracking
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { initSentry } from '@/lib/sentry.config';
import { initErrorTracking } from '@/lib/errorTracking';
import { initAlerting } from '@/lib/alerting';
import { initErrorAnalytics } from '@/lib/errorAnalytics';
import { initPerformanceMonitoring } from '@/lib/performanceIntegration';
import { log } from '@/utils/logger';

interface ErrorMonitoringContextType {
  isInitialized: boolean;
  healthStatus: 'healthy' | 'warning' | 'error';
  stats: {
    errorsTracked: number;
    alertsSent: number;
    performanceMetrics: number;
  };
}

const ErrorMonitoringContext = createContext<ErrorMonitoringContextType | null>(null);

interface ErrorMonitoringProviderProps {
  children: ReactNode;
  enableSentry?: boolean;
  enableAlerting?: boolean;
  enableAnalytics?: boolean;
  enablePerformance?: boolean;
}

export function ErrorMonitoringProvider({
  children,
  enableSentry = true,
  enableAlerting = true,
  enableAnalytics = true,
  enablePerformance = true,
}: ErrorMonitoringProviderProps) {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [healthStatus, setHealthStatus] = React.useState<'healthy' | 'warning' | 'error'>('healthy');
  const [stats, setStats] = React.useState({
    errorsTracked: 0,
    alertsSent: 0,
    performanceMetrics: 0,
  });

  useEffect(() => {
    const initializeErrorMonitoring = async () => {
      try {
        log.info('🚀 Initializing Error Monitoring System...');

        // 1. Initialize Sentry (if enabled)
        if (enableSentry) {
          log.info('📊 Initializing Sentry...');
          initSentry();
        }

        // 2. Initialize error tracking
        if (enableSentry || enableAnalytics) {
          log.info('🔍 Initializing Error Tracking...');
          initErrorTracking();
        }

        // 3. Initialize alerting (only in production or if explicitly enabled)
        if (enableAlerting && (import.meta.env.PROD || import.meta.env.DEV)) {
          log.info('🚨 Initializing Alerting System...');
          initAlerting();
        }

        // 4. Initialize error analytics
        if (enableAnalytics) {
          log.info('📈 Initializing Error Analytics...');
          initErrorAnalytics();
        }

        // 5. Initialize performance monitoring
        if (enablePerformance) {
          log.info('⚡ Initializing Performance Monitoring...');
          initPerformanceMonitoring();
        }

        // Set initialization status
        setIsInitialized(true);
        setHealthStatus('healthy');

        log.info('✅ Error Monitoring System initialized successfully');

        // Setup health check interval
        const healthCheckInterval = setInterval(() => {
          performHealthCheck();
        }, 60000); // every minute

        return () => {
          clearInterval(healthCheckInterval);
        };

      } catch (error) {
        log.error('❌ Failed to initialize Error Monitoring System:', error);
        setHealthStatus('error');
        setIsInitialized(false);
      }
    };

    initializeErrorMonitoring();
  }, [enableSentry, enableAlerting, enableAnalytics, enablePerformance]);

  const performHealthCheck = () => {
    try {
      // Check if Sentry is working
      if (enableSentry && typeof (window as any).Sentry === 'undefined') {
        setHealthStatus('warning');
        return;
      }

      // Check if performance monitoring is working
      if (enablePerformance && typeof performance === 'undefined') {
        setHealthStatus('warning');
        return;
      }

      // Update stats
      setStats({
        errorsTracked: getErrorCount(),
        alertsSent: getAlertCount(),
        performanceMetrics: getPerformanceMetricCount(),
      });

      setHealthStatus('healthy');
    } catch (error) {
      log.warn('Health check failed:', error);
      setHealthStatus('warning');
    }
  };

  // Helper functions (these would be implemented to get real stats)
  const getErrorCount = () => {
    try {
      return parseInt(localStorage.getItem('error_count') || '0');
    } catch {
      return 0;
    }
  };

  const getAlertCount = () => {
    try {
      return parseInt(localStorage.getItem('alert_count') || '0');
    } catch {
      return 0;
    }
  };

  const getPerformanceMetricCount = () => {
    try {
      return parseInt(localStorage.getItem('performance_metric_count') || '0');
    } catch {
      return 0;
    }
  };

  const value: ErrorMonitoringContextType = {
    isInitialized,
    healthStatus,
    stats,
  };

  return (
    <ErrorMonitoringContext.Provider value={value}>
      {children}
    </ErrorMonitoringContext.Provider>
  );
}

// Hook para usar o context
export function useErrorMonitoring() {
  const context = useContext(ErrorMonitoringContext);
  if (!context) {
    throw new Error('useErrorMonitoring must be used within ErrorMonitoringProvider');
  }
  return context;
}

// Status indicator component
export function ErrorMonitoringStatus() {
  const { isInitialized, healthStatus, stats } = useErrorMonitoring();

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (healthStatus) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusText = () => {
    if (!isInitialized) return 'Initializing...';
    
    switch (healthStatus) {
      case 'healthy': return 'System Healthy';
      case 'warning': return 'System Warning';
      case 'error': return 'System Error';
      default: return 'Unknown Status';
    }
  };

  if (import.meta.env.PROD) {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <div className="text-sm">
          <p className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Errors: {stats.errorsTracked} | Alerts: {stats.alertsSent} | Metrics: {stats.performanceMetrics}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Monitoring Hook para componentes
export function useErrorMonitoringInComponent(componentName: string) {
  const { healthStatus } = useErrorMonitoring();

  useEffect(() => {
    // Add breadcrumb when component mounts
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        message: `Component ${componentName} mounted`,
        category: 'component',
        level: 'info',
        data: { componentName },
      });
    }
  }, [componentName]);

  return {
    isHealthy: healthStatus === 'healthy',
    healthStatus,
    trackError: (error: Error | string, context?: any) => {
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          ...context,
          componentName,
        });
      }
    },
    trackPerformance: (metric: string, value: number, tags?: any) => {
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.addBreadcrumb({
          message: `Performance metric: ${metric}`,
          category: 'performance',
          level: 'info',
          data: { value, ...tags, componentName },
        });
      }
    },
  };
}

export default ErrorMonitoringProvider;