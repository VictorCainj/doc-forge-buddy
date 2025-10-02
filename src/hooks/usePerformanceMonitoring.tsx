// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PERFORMANCE_METRICS, MONITORING_CONFIG } from '@/utils/performanceConfig';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  component?: string;
}

interface PerformanceStats {
  renderTime: number[];
  searchTime: number[];
  loadTime: number[];
  memoryUsage: number[];
  cacheHitRate: number[];
}

/**
 * Hook para monitoramento de performance
 */
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    renderTime: [],
    searchTime: [],
    loadTime: [],
    memoryUsage: [],
    cacheHitRate: [],
  });
  
  const renderStartTime = useRef<number>(0);
  const searchStartTime = useRef<number>(0);
  const loadStartTime = useRef<number>(0);

  /**
   * Iniciar medição de renderização
   */
  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  /**
   * Finalizar medição de renderização
   */
  const endRenderMeasurement = useCallback((componentName?: string) => {
    const renderTime = performance.now() - renderStartTime.current;
    addMetric('renderTime', renderTime, componentName);
    
    // Verificar se está dentro dos limites
    if (renderTime > PERFORMANCE_METRICS.limits.maxRenderTime) {
      console.warn(`Render lento detectado: ${renderTime}ms em ${componentName || 'componente desconhecido'}`);
    }
  }, []);

  /**
   * Iniciar medição de busca
   */
  const startSearchMeasurement = useCallback(() => {
    searchStartTime.current = performance.now();
  }, []);

  /**
   * Finalizar medição de busca
   */
  const endSearchMeasurement = useCallback((componentName?: string) => {
    const searchTime = performance.now() - searchStartTime.current;
    addMetric('searchTime', searchTime, componentName);
    
    // Verificar se está dentro dos limites
    if (searchTime > PERFORMANCE_METRICS.limits.maxSearchTime) {
      console.warn(`Busca lenta detectada: ${searchTime}ms em ${componentName || 'componente desconhecido'}`);
    }
  }, []);

  /**
   * Iniciar medição de carregamento
   */
  const startLoadMeasurement = useCallback(() => {
    loadStartTime.current = performance.now();
  }, []);

  /**
   * Finalizar medição de carregamento
   */
  const endLoadMeasurement = useCallback((componentName?: string) => {
    const loadTime = performance.now() - loadStartTime.current;
    addMetric('loadTime', loadTime, componentName);
    
    // Verificar se está dentro dos limites
    if (loadTime > PERFORMANCE_METRICS.limits.maxLoadTime) {
      console.warn(`Carregamento lento detectado: ${loadTime}ms em ${componentName || 'componente desconhecido'}`);
    }
  }, []);

  /**
   * Adicionar métrica
   */
  const addMetric = useCallback((
    name: string,
    value: number,
    component?: string
  ) => {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      component,
    };

    setMetrics(prev => {
      const newMetrics = [...prev, metric];
      // Manter apenas as últimas 1000 métricas
      return newMetrics.slice(-MONITORING_CONFIG.maxMetrics);
    });

    // Atualizar estatísticas
    setStats(prev => ({
      ...prev,
      [name]: [...(prev[name as keyof PerformanceStats] || []), value].slice(-100),
    }));
  }, []);

  /**
   * Obter estatísticas de performance
   */
  const getPerformanceStats = useCallback(() => {
    const now = Date.now();
    const recentMetrics = metrics.filter(
      metric => now - metric.timestamp < 60000 // Últimos 60 segundos
    );

    const stats = {
      totalMetrics: metrics.length,
      recentMetrics: recentMetrics.length,
      averageRenderTime: calculateAverage(stats.renderTime),
      averageSearchTime: calculateAverage(stats.searchTime),
      averageLoadTime: calculateAverage(stats.loadTime),
      maxRenderTime: Math.max(...stats.renderTime, 0),
      maxSearchTime: Math.max(...stats.searchTime, 0),
      maxLoadTime: Math.max(...stats.loadTime, 0),
      memoryUsage: getMemoryUsage(),
    };

    return stats;
  }, [metrics, stats]);

  /**
   * Verificar alertas de performance
   */
  const checkPerformanceAlerts = useCallback(() => {
    const currentStats = getPerformanceStats();
    const alerts: string[] = [];

    if (currentStats.averageRenderTime > PERFORMANCE_METRICS.alerts.slowRender) {
      alerts.push(`Render lento: ${currentStats.averageRenderTime.toFixed(2)}ms`);
    }

    if (currentStats.averageSearchTime > PERFORMANCE_METRICS.alerts.slowSearch) {
      alerts.push(`Busca lenta: ${currentStats.averageSearchTime.toFixed(2)}ms`);
    }

    if (currentStats.averageLoadTime > PERFORMANCE_METRICS.alerts.slowLoad) {
      alerts.push(`Carregamento lento: ${currentStats.averageLoadTime.toFixed(2)}ms`);
    }

    if (currentStats.memoryUsage > PERFORMANCE_METRICS.alerts.highMemoryUsage) {
      alerts.push(`Uso alto de memória: ${(currentStats.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    return alerts;
  }, [getPerformanceStats]);

  /**
   * Limpar métricas antigas
   */
  const cleanupOldMetrics = useCallback(() => {
    const cutoffTime = Date.now() - 300000; // 5 minutos
    setMetrics(prev => prev.filter(metric => metric.timestamp > cutoffTime));
  }, []);

  /**
   * Exportar métricas para análise
   */
  const exportMetrics = useCallback(() => {
    const data = {
      metrics,
      stats: getPerformanceStats(),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, getPerformanceStats]);

  // Limpeza automática de métricas antigas
  useEffect(() => {
    const interval = setInterval(cleanupOldMetrics, 60000); // A cada minuto
    return () => clearInterval(interval);
  }, [cleanupOldMetrics]);

  return {
    metrics,
    stats,
    startRenderMeasurement,
    endRenderMeasurement,
    startSearchMeasurement,
    endSearchMeasurement,
    startLoadMeasurement,
    endLoadMeasurement,
    addMetric,
    getPerformanceStats,
    checkPerformanceAlerts,
    exportMetrics,
  };
};

/**
 * Funções auxiliares
 */
const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

export default usePerformanceMonitoring;