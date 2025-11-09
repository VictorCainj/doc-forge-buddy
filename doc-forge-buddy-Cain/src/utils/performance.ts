/**
 * Performance monitoring utilities
 * Handles Core Web Vitals tracking and performance analytics
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';

// Performance metric thresholds (Google Core Web Vitals)
export const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay (legacy)
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
} as const;

export type PerformanceMetricName = keyof typeof PERFORMANCE_THRESHOLDS;
export type PerformanceRating = 'good' | 'needs-improvement' | 'poor';

// Store performance data locally
class PerformanceCollector {
  private metrics: Map<PerformanceMetricName, Metric> = new Map();
  private subscribers: Set<(metric: PerformanceMetricName, rating: PerformanceRating) => void> = new Set();

  /**
   * Add a metric to the collection
   */
  setMetric(name: PerformanceMetricName, metric: Metric) {
    this.metrics.set(name, metric);
    const rating = this.getRating(name, metric.value);
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(name, rating);
      } catch (error) {
        console.error('Error in performance subscriber:', error);
      }
    });

    // Report to Sentry
    this.reportToSentry(name, metric, rating);
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): Record<PerformanceMetricName, Metric> {
    const result = {} as Record<PerformanceMetricName, Metric>;
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Get metric by name
   */
  getMetric(name: PerformanceMetricName): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Calculate performance rating based on metric value
   */
  private getRating(name: PerformanceMetricName, value: number): PerformanceRating {
    const threshold = PERFORMANCE_THRESHOLDS[name];
    
    if (value <= threshold.good) {
      return 'good';
    } else if (value <= threshold.poor) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  }

  /**
   * Report metric to Sentry
   */
  private reportToSentry(name: PerformanceMetricName, metric: Metric, rating: PerformanceRating) {
    try {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${name}: ${metric.value.toFixed(2)}ms (${rating})`,
        level: rating === 'poor' ? 'warning' : 'info',
        data: {
          metric: name,
          value: metric.value,
          rating,
          delta: metric.delta,
          id: metric.id,
        },
      });

      // Report performance issues to Sentry if poor
      if (rating === 'poor') {
        Sentry.captureMessage(
          `Performance issue detected: ${name} = ${metric.value.toFixed(2)}ms`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Error reporting to Sentry:', error);
    }
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback: (metric: PerformanceMetricName, rating: PerformanceRating) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const metrics = this.getMetrics();
    const summary = {
      scores: {} as Record<PerformanceMetricName, PerformanceRating>,
      overall: 'good' as PerformanceRating,
      issues: [] as string[],
    };

    Object.entries(metrics).forEach(([name, metric]) => {
      const rating = this.getRating(name as PerformanceMetricName, metric.value);
      summary.scores[name as PerformanceMetricName] = rating;
      
      if (rating === 'poor') {
        summary.issues.push(`${name}: ${metric.value.toFixed(2)}ms (${rating})`);
        summary.overall = 'poor';
      } else if (rating === 'needs-improvement' && summary.overall !== 'poor') {
        summary.overall = 'needs-improvement';
      }
    });

    return summary;
  }
}

// Global performance collector instance
export const performanceCollector = new PerformanceCollector();

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  // Track all Core Web Vitals
  onCLS((metric) => performanceCollector.setMetric('CLS', metric));
  onFID((metric) => performanceCollector.setMetric('FID', metric));
  onFCP((metric) => performanceCollector.setMetric('FCP', metric));
  onLCP((metric) => performanceCollector.setMetric('LCP', metric));
  onTTFB((metric) => performanceCollector.setMetric('TTFB', metric));
  
  // INP is more comprehensive than FID for modern browsers
  onINP((metric) => performanceCollector.setMetric('INP', metric));

  console.log('🚀 Performance monitoring initialized');
};

/**
 * Get performance data for analytics
 */
export const getPerformanceData = () => {
  return {
    metrics: performanceCollector.getMetrics(),
    summary: performanceCollector.getSummary(),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Report performance data to analytics service
 */
export const reportPerformanceData = (destination: 'sentry' | 'console' | 'custom' = 'sentry') => {
  const data = getPerformanceData();
  
  switch (destination) {
    case 'sentry':
      Sentry.addBreadcrumb({
        category: 'performance',
        message: 'Performance summary',
        level: 'info',
        data,
      });
      break;
      
    case 'console':
      console.table(Object.entries(data.metrics).map(([name, metric]) => ({
        Metric: name,
        Value: `${metric.value.toFixed(2)}ms`,
        Rating: performanceCollector.getRating(name as PerformanceMetricName, metric.value),
      })));
      break;
      
    case 'custom':
      // Custom implementation can be added here
      break;
  }
  
  return data;
};

/**
 * Custom performance mark utility
 */
export const markPerformance = (name: string, startMark?: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    if (startMark) {
      window.performance.measure(name, startMark);
    } else {
      window.performance.mark(name);
    }
  }
};

/**
 * Get navigation timing data
 */
export const getNavigationTiming = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) {
    return null;
  }

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ssl: navigation.connectEnd - navigation.secureConnectionStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
    load: navigation.loadEventEnd - navigation.navigationStart,
  };
};

/**
 * Monitor bundle loading performance
 */
export const monitorBundleLoad = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  // Monitor resource loading
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource' && entry.name.includes('.js')) {
        const duration = entry.duration;
        const size = (entry as any).transferSize || 0;
        
        // Report large bundle loading
        if (duration > 2000 || size > 500 * 1024) { // 2s or 500KB
          Sentry.addBreadcrumb({
            category: 'bundle',
            message: `Large bundle loaded: ${entry.name}`,
            level: 'warning',
            data: {
              duration: duration.toFixed(2),
              size: (size / 1024).toFixed(2) + 'KB',
              name: entry.name,
            },
          });
        }
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
  
  return () => observer.disconnect();
};

export default {
  initPerformanceMonitoring,
  getPerformanceData,
  reportPerformanceData,
  markPerformance,
  getNavigationTiming,
  monitorBundleLoad,
  performanceCollector,
  PERFORMANCE_THRESHOLDS,
};