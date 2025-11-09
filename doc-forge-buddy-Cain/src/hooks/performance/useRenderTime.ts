import { useEffect, useRef, useState } from 'react';

export interface RenderTimeData {
  renderTime: number;
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  isSlowRender: boolean;
  timestamp: number;
}

export interface RenderTimeOptions {
  threshold?: number; // ms threshold for slow render detection
  logSlowRenders?: boolean;
  onSlowRender?: (data: RenderTimeData) => void;
}

/**
 * Hook para medir tempo de render de componentes React
 * @param componentName Nome do componente para identificação
 * @param options Opções de configuração
 * @returns Dados de performance de render
 */
export const useRenderTime = (
  componentName: string,
  options: RenderTimeOptions = {}
): RenderTimeData & { reset: () => void } => {
  const {
    threshold = 16, // 16ms para 60fps
    logSlowRenders = process.env.NODE_ENV === 'development',
    onSlowRender
  } = options;

  const renderStartRef = useRef<number>(0);
  const [renderTimeData, setRenderTimeData] = useState<RenderTimeData>({
    renderTime: 0,
    componentName,
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    isSlowRender: false,
    timestamp: 0
  });

  const startTimeRef = useRef<number>(performance.now());
  const previousRendersRef = useRef<number[]>([]);

  useEffect(() => {
    // Marcar início do render
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    // Calcular tempo de render quando o componente terminar de renderizar
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartRef.current;
    const timestamp = Date.now();

    // Manter histórico dos últimos 10 renders para calcular média
    const previousRenders = previousRendersRef.current;
    previousRenders.push(renderTime);
    if (previousRenders.length > 10) {
      previousRenders.shift();
    }

    const averageRenderTime = previousRenders.reduce((sum, time) => sum + time, 0) / previousRenders.length;
    const isSlowRender = renderTime > threshold;

    const newData: RenderTimeData = {
      renderTime,
      componentName,
      renderCount: previousRenders.length,
      lastRenderTime: renderTime,
      averageRenderTime,
      isSlowRender,
      timestamp
    };

    setRenderTimeData(newData);

    // Log slow renders se habilitado
    if (isSlowRender && logSlowRender(componentName, renderTime, threshold)) {
      console.warn(
        `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }

    // Callback para renders lentos
    if (isSlowRender && onSlowRender) {
      onSlowRender(newData);
    }
  });

  const reset = () => {
    previousRendersRef.current = [];
    setRenderTimeData({
      renderTime: 0,
      componentName,
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      isSlowRender: false,
      timestamp: 0
    });
  };

  return {
    ...renderTimeData,
    reset
  };
};

// Helper para controlar frequência de logs
const logRenderCache = new Map<string, number>();

function logRenderCache(
  componentName: string,
  renderTime: number,
  threshold: number
): boolean {
  const now = Date.now();
  const lastLog = logRenderCache.get(componentName) || 0;
  
  // Log no máximo uma vez a cada 5 segundos para evitar spam
  if (now - lastLog < 5000) {
    return false;
  }
  
  logRenderCache.set(componentName, now);
  return true;
}

/**
 * HOC para wrapping de componentes com medição de performance
 * @param Component Componente a ser wrapped
 * @param componentName Nome do componente
 * @param options Opções de configuração
 * @returns Componente com performance monitoring
 */
export function withRenderTime<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  options?: RenderTimeOptions
) {
  const WrappedComponent = (props: P) => {
    const performanceData = useRenderTime(componentName, options);
    
    return <Component {...props} __performanceData={performanceData} />;
  };

  WrappedComponent.displayName = `withRenderTime(${componentName})`;
  
  return WrappedComponent;
}