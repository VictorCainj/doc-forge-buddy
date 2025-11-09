// Type definitions for web-vitals to avoid import issues
declare module 'web-vitals' {
  export interface Metric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    id: string;
    delta: number;
    entries?: PerformanceEntry[];
  }

  export interface ReportCallback {
    (metric: Metric): void;
  }

  export function getCLS(onReport: ReportCallback): void;
  export function getFID(onReport: ReportCallback): void;
  export function getFCP(onReport: ReportCallback): void;
  export function getLCP(onReport: ReportCallback): void;
  export function getTTFB(onReport: ReportCallback): void;
  export function getINP(onReport: ReportCallback): void;

  // Additional utilities
  export function onPerfEntry(entry: PerformanceEntry): void;
  export interface Navigator {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
  }
}