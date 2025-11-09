import { useEffect, useRef, useState, useCallback } from 'react';
import { useRenderTime } from './useRenderTime';
import { useMemoryUsage } from './useMemoryUsage';
import { useComponentDidMount } from './useComponentDidMount';
import { useApiPerformance } from './useApiPerformance';

export interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  timestamp: number;
  data?: any;
}

export interface PerformanceSnapshot {
  timestamp: number;
  renderTime: number;
  memoryUsage: number;
  activeObservers: number;
  performanceEntries: PerformanceEntry[];
  userTiming: { [key: string]: number };
  navigation: any;
  resourceTimings: any[];
}

export interface PerformanceMonitorOptions {
  componentName?: string;
  enableRenderTracking?: boolean;
  enableMemoryTracking?: boolean;
  enableLifecycleTracking?: boolean;
  enableApiTracking?: boolean;
  enableObserver?: boolean;
  observerTypes?: string[];
  reportInterval?: number;
  onPerformanceIssue?: (issue: {
    type: 'slow_render' | 'memory_leak' | 'slow_api' | 'performance_entry';
    message: string;
    data: any;
    timestamp: number;
  }) => void;
}

const DEFAULT_OPTIONS: Required<PerformanceMonitorOptions> = {
  componentName: 'PerformanceMonitor',
  enableRenderTracking: true,
  enableMemoryTracking: true,
  enableLifecycleTracking: true,
  enableApiTracking: true,
  enableObserver: true,
  observerTypes: ['measure', 'navigation', 'resource', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'],
  reportInterval: 5000,
  onPerformanceIssue: () => {}
};

/**
 * Hook principal de performance monitoring
 * Integra todos os outros hooks de performance e Performance Observer API
 */
export const usePerformanceMonitor = (
  userOptions: PerformanceMonitorOptions = {}
) => {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const {
    componentName,
    enableRenderTracking,
    enableMemoryTracking,
    enableLifecycleTracking,
    enableApiTracking,
    enableObserver,
    observerTypes,
    reportInterval,
    onPerformanceIssue
  } = options;

  // Estado global do monitor
  const [isActive, setIsActive] = useState(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [performanceIssues, setPerformanceIssues] = useState<any[]>([]);

  // Refs para os diferentes monitors
  const observerRef = useRef<PerformanceObserver | null>(null);
  const performanceEntriesRef = useRef<PerformanceEntry[]>([]);
  const userTimingRef = useRef<{ [key: string]: number }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks de monitoring específicos
  const renderTime = useRenderTime(componentName, {
    threshold: 16, // 60fps threshold
    logSlowRenders: process.env.NODE_ENV === 'development',
    onSlowRender: (data) => {
      addPerformanceIssue({
        type: 'slow_render',
        message: `Slow render in ${componentName}: ${data.renderTime.toFixed(2)}ms`,
        data,
        timestamp: Date.now()
      });
    }
  });

  const memoryUsage = useMemoryUsage({
    interval: 5000,
    warningThreshold: 70,
    criticalThreshold: 90,
    onMemoryLeak: (data) => {
      addPerformanceIssue({
        type: 'memory_leak',
        message: `Potential memory leak detected: ${data.growthRate.toFixed(2)} MB/s growth`,
        data,
        timestamp: Date.now()
      });
    }
  });

  const mountData = useComponentDidMount(componentName, {
    trackLifecycle: enableLifecycleTracking,
    trackUpdates: true,
    warningThreshold: 100,
    onSlowMount: (data) => {
      addPerformanceIssue({
        type: 'performance_entry',
        message: `Slow mount in ${componentName}: ${data.mountTime.toFixed(2)}ms`,
        data,
        timestamp: Date.now()
      });
    }
  });

  const apiPerformance = useApiPerformance({
    slowThreshold: 1000,
    errorThreshold: 10,
    onSlowCall: (data) => {
      addPerformanceIssue({
        type: 'slow_api',
        message: `Slow API call: ${data.url} took ${data.duration.toFixed(2)}ms`,
        data,
        timestamp: Date.now()
      });
    }
  });

  // Performance Observer
  useEffect(() => {
    if (!enableObserver || typeof window === 'undefined') {
      return;
    }

    const setupObserver = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry) => {
            const performanceEntry: PerformanceEntry = {
              name: entry.name,
              entryType: entry.entryType,
              startTime: entry.startTime,
              duration: entry.duration,
              timestamp: Date.now(),
              data: entry
            };

            // Filtrar tipos específicos
            if (observerTypes.includes(entry.entryType)) {
              performanceEntriesRef.current.push(performanceEntry);
              
              // Manter apenas os últimos 100 entries
              if (performanceEntriesRef.current.length > 100) {
                performanceEntriesRef.current.shift();
              }
            }

            // Tratar User Timing API
            if (entry.entryType === 'measure') {
              userTimingRef.current[entry.name] = entry.duration;
            }
          });
        });

        // Observar diferentes tipos
        observerTypes.forEach((type) => {
          try {
            observer.observe({ entryTypes: [type] });
          } catch (error) {
            // Tipo não suportado, continuar
            console.debug(`Performance Observer type '${type}' not supported`);
          }
        });

        observerRef.current = observer;
        setIsActive(true);

      } catch (error) {
        console.warn('Performance Observer not supported:', error);
        setIsActive(false);
      }
    };

    if ('PerformanceObserver' in window) {
      setupObserver();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enableObserver, observerTypes]);

  // Snapshot periódico
  useEffect(() => {
    if (!isActive) return;

    const createSnapshot = () => {
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        renderTime: renderTime.renderTime,
        memoryUsage: memoryUsage.memoryData?.usedMB || 0,
        activeObservers: observerRef.current ? 1 : 0,
        performanceEntries: [...performanceEntriesRef.current],
        userTiming: { ...userTimingRef.current },
        navigation: getNavigationTiming(),
        resourceTimings: getResourceTimings()
      };

      setCurrentSnapshot(snapshot);
    };

    // Criar snapshot inicial
    createSnapshot();

    // Snapshot periódico
    intervalRef.current = setInterval(createSnapshot, reportInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, reportInterval, renderTime.renderTime, memoryUsage.memoryData]);

  const addPerformanceIssue = useCallback((issue: any) => {
    setPerformanceIssues(prev => [issue, ...prev.slice(0, 9)]); // Manter apenas 10 issues
    onPerformanceIssue(issue);
  }, [onPerformanceIssue]);

  const getNavigationTiming = () => {
    if (typeof window === 'undefined' || !performance.getEntriesByType) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart
    };
  };

  const getResourceTimings = () => {
    if (typeof window === 'undefined' || !performance.getEntriesByType) {
      return [];
    }

    return performance.getEntriesByType('resource')
      .filter((resource: any) => resource.initiatorType === 'fetch' || resource.initiatorType === 'xmlhttprequest')
      .map((resource: any) => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType
      }));
  };

  const measureUserTiming = useCallback((name: string, fn: () => void | Promise<void>) => {
    const startMark = `mark_${name}_start`;
    const endMark = `mark_${name}_end`;
    const measureName = `measure_${name}`;

    performance.mark(startMark);

    const executeAndMeasure = async () => {
      try {
        const result = fn();
        if (result instanceof Promise) {
          await result;
        }
      } finally {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
      }
    };

    return executeAndMeasure();
  }, []);

  const getPerformanceReport = useCallback(() => {
    return {
      componentName,
      timestamp: Date.now(),
      renderTime: renderTime.renderTimeData,
      memoryUsage: memoryUsage.memoryData,
      mountData,
      apiStats: apiPerformance.stats,
      performanceEntries: performanceEntriesRef.current,
      userTiming: userTimingRef.current,
      navigationTiming: getNavigationTiming(),
      issues: performanceIssues,
      snapshot: currentSnapshot
    };
  }, [
    componentName,
    renderTime.renderTimeData,
    memoryUsage.memoryData,
    mountData,
    apiPerformance.stats,
    performanceIssues,
    currentSnapshot
  ]);

  const clearHistory = useCallback(() => {
    performanceEntriesRef.current = [];
    userTimingRef.current = {};
    setPerformanceIssues([]);
    renderTime.reset();
    memoryUsage.clearHistory();
    apiPerformance.clearHistory();
  }, [renderTime, memoryUsage, apiPerformance]);

  return {
    // Status
    isActive,
    currentSnapshot,
    performanceIssues,
    
    // Dados dos monitors
    renderTime: renderTime.renderTimeData,
    memoryUsage: memoryUsage.memoryData,
    mountData,
    apiStats: apiPerformance.stats,
    
    // Controles
    startMonitoring: () => setIsActive(true),
    stopMonitoring: () => setIsActive(false),
    measureUserTiming,
    getPerformanceReport,
    clearHistory,
    
    // Utils
    isObserverSupported: typeof window !== 'undefined' && 'PerformanceObserver' in window,
    getNavigationTiming,
    getResourceTimings
  };
};

/**
 * HOC para adicionar performance monitoring a qualquer componente
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  options?: PerformanceMonitorOptions
) {
  const WrappedComponent = (props: P) => {
    const performanceData = usePerformanceMonitor({
      componentName: Component.displayName || Component.name || 'Component',
      ...options
    });

    return <Component {...props} __performanceData={performanceData} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}