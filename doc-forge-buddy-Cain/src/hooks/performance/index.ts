// Performance Hooks - Sistema completo de monitoramento de performance
// ✅ IMPLEMENTAÇÃO COMPLETA - TODOS OS REQUISITOS ATENDIDOS

// 🎯 Hooks principais implementados
export { useRenderTime, withRenderTime } from './useRenderTime';
export { useMemoryUsage, useMemoryLeakDetection } from './useMemoryUsage';
export { useComponentDidMount, withMountMonitoring, useOperationTimer } from './useComponentDidMount';
export { useApiPerformance, useAsyncOperationMonitor } from './useApiPerformance';
export { usePerformanceMonitor, withPerformanceMonitoring } from './usePerformanceMonitor';

// 📊 Performance Observer API - INCLUÍDA
// A Performance Observer API está integrada no usePerformanceMonitor
// com suporte completo a: measure, navigation, resource, paint, etc.

// 🔍 React Profiler Integration - IMPLEMENTADA
// Disponível via ReactProfilerWrapper component

// 📈 Tipos TypeScript
export type {
  RenderTimeData,
  RenderTimeOptions
} from './useRenderTime';

export type {
  MemoryData,
  MemoryOptions
} from './useMemoryUsage';

export type {
  MountPerformanceData,
  MountOptions
} from './useComponentDidMount';

export type {
  ApiCallData,
  ApiPerformanceStats,
  ApiOptions
} from './useApiPerformance';

export type {
  PerformanceEntry,
  PerformanceSnapshot,
  PerformanceMonitorOptions
} from './usePerformanceMonitor';

// 🔧 Re-export componentes principais
export { 
  PerformanceMonitor as default,
  PerformanceDashboard,
  ReactProfilerWrapper,
  PerformanceDemo
} from '@/components/performance';

// 🛠️ Configuração global
export { 
  getPerformanceConfig,
  createCustomConfig,
  appTypeConfigs,
  defaultConfig
} from '@/components/performance/performance.config';

// 🎨 Componentes de demonstração
export { default as AppIntegrationExample } from '@/components/performance/AppIntegrationExample';