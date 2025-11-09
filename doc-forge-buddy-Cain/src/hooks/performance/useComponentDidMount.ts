import { useEffect, useRef, useState } from 'react';

export interface MountPerformanceData {
  mountTime: number;
  componentName: string;
  renderCount: number;
  updateCount: number;
  unmountCount: number;
  isMounted: boolean;
  lastUpdateTime: number;
  averageMountTime: number;
  timestamp: number;
  lifecyclePhases: {
    constructor: number;
    render: number;
    componentDidMount: number;
    useEffect: number;
  };
}

export interface MountOptions {
  trackLifecycle?: boolean;
  trackUpdates?: boolean;
  warningThreshold?: number; // ms
  onSlowMount?: (data: MountPerformanceData) => void;
  onSlowUpdate?: (data: MountPerformanceData) => void;
}

const DEFAULT_OPTIONS: Required<MountOptions> = {
  trackLifecycle: true,
  trackUpdates: true,
  warningThreshold: 100, // 100ms é um tempo razoável para mount
  onSlowMount: () => {},
  onSlowUpdate: () => {}
};

/**
 * Hook para monitorar performance de mount e lifecycle de componentes
 * @param componentName Nome do componente
 * @param options Opções de configuração
 * @returns Dados de performance de mount
 */
export const useComponentDidMount = (
  componentName: string,
  options: MountOptions = {}
): MountPerformanceData & { reset: () => void; forceUpdate: () => void } => {
  const {
    trackLifecycle = DEFAULT_OPTIONS.trackLifecycle,
    trackUpdates = DEFAULT_OPTIONS.trackUpdates,
    warningThreshold = DEFAULT_OPTIONS.warningThreshold,
    onSlowMount,
    onSlowUpdate
  } = { ...DEFAULT_OPTIONS, ...options };

  const mountStartTimeRef = useRef<number>(0);
  const lifecycleStartTimeRef = useRef<{
    constructor: number;
    render: number;
    componentDidMount: number;
    useEffect: number;
  }>({
    constructor: 0,
    render: 0,
    componentDidMount: 0,
    useEffect: 0
  });

  const [mountData, setMountData] = useState<MountPerformanceData>({
    mountTime: 0,
    componentName,
    renderCount: 0,
    updateCount: 0,
    unmountCount: 0,
    isMounted: false,
    lastUpdateTime: 0,
    averageMountTime: 0,
    timestamp: 0,
    lifecyclePhases: {
      constructor: 0,
      render: 0,
      componentDidMount: 0,
      useEffect: 0
    }
  });

  const mountHistoryRef = useRef<number[]>([]);

  // Track mount start
  useEffect(() => {
    if (trackLifecycle) {
      mountStartTimeRef.current = performance.now();
      lifecycleStartTimeRef.current.constructor = performance.now();
    }
  }, [trackLifecycle]);

  // Track render completion
  useEffect(() => {
    if (trackLifecycle) {
      const now = performance.now();
      lifecycleStartTimeRef.current.render = now;
    }
  });

  // Track componentDidMount equivalent (primeiro useEffect)
  useEffect(() => {
    if (trackLifecycle) {
      const now = performance.now();
      const mountTime = now - mountStartTimeRef.current;
      lifecycleStartTimeRef.current.componentDidMount = now;
      lifecycleStartTimeRef.current.useEffect = now;

      // Adicionar ao histórico
      mountHistoryRef.current.push(mountTime);
      if (mountHistoryRef.current.length > 10) {
        mountHistoryRef.current.shift();
      }

      const averageMountTime = mountHistoryRef.current.reduce((sum, time) => sum + time, 0) / mountHistoryRef.current.length;

      const newData: MountPerformanceData = {
        mountTime,
        componentName,
        renderCount: 1,
        updateCount: 0,
        unmountCount: 0,
        isMounted: true,
        lastUpdateTime: 0,
        averageMountTime,
        timestamp: Date.now(),
        lifecyclePhases: {
          ...lifecycleStartTimeRef.current,
          useEffect: mountTime // UseEffect time é o tempo total de mount
        }
      };

      setMountData(newData);

      // Verificar mount lento
      if (mountTime > warningThreshold) {
        console.warn(
          `🐌 Slow mount detected in ${componentName}: ${mountTime.toFixed(2)}ms (threshold: ${warningThreshold}ms)`
        );
        onSlowMount(newData);
      }
    }

    return () => {
      // Cleanup
      if (trackLifecycle) {
        setMountData(prev => ({
          ...prev,
          isMounted: false,
          unmountCount: prev.unmountCount + 1
        }));
      }
    };
  }, [trackLifecycle, componentName, warningThreshold, onSlowMount]);

  // Track updates (re-renders)
  const forceUpdate = () => {
    if (trackUpdates) {
      const now = performance.now();
      const updateTime = now - mountStartTimeRef.current;

      setMountData(prev => {
        const newUpdateCount = prev.updateCount + 1;
        const newData = {
          ...prev,
          updateCount: newUpdateCount,
          lastUpdateTime: updateTime,
          renderCount: prev.renderCount + 1,
          timestamp: now
        };

        // Verificar update lento
        if (updateTime > warningThreshold) {
          console.warn(
            `🔄 Slow update detected in ${componentName}: ${updateTime.toFixed(2)}ms (threshold: ${warningThreshold}ms)`
          );
          onSlowUpdate(newData);
        }

        return newData;
      });
    }
  };

  const reset = () => {
    mountHistoryRef.current = [];
    setMountData({
      mountTime: 0,
      componentName,
      renderCount: 0,
      updateCount: 0,
      unmountCount: 0,
      isMounted: false,
      lastUpdateTime: 0,
      averageMountTime: 0,
      timestamp: 0,
      lifecyclePhases: {
        constructor: 0,
        render: 0,
        componentDidMount: 0,
        useEffect: 0
      }
    });
  };

  return {
    ...mountData,
    reset,
    forceUpdate
  };
};

/**
 * HOC para componentes com monitoração de mount
 * @param Component Componente a ser wrapped
 * @param componentName Nome do componente
 * @param options Opções de configuração
 * @returns Componente com monitoring de mount
 */
export function withMountMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  options?: MountOptions
) {
  const WrappedComponent = (props: P) => {
    const mountData = useComponentDidMount(componentName, options);
    
    return <Component {...props} __mountData={mountData} />;
  };

  WrappedComponent.displayName = `withMountMonitoring(${componentName})`;
  
  return WrappedComponent;
}

/**
 * Hook para medir tempo de operações específicas
 * @param operationName Nome da operação
 * @returns Função para marcar início e fim da operação
 */
export const useOperationTimer = (operationName: string) => {
  const startTimeRef = useRef<number>(0);
  const [lastOperationTime, setLastOperationTime] = useState<number>(0);

  const start = () => {
    startTimeRef.current = performance.now();
  };

  const end = (): number => {
    if (startTimeRef.current === 0) {
      console.warn(`Operation '${operationName}' was started before being ended`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    setLastOperationTime(duration);
    
    // Log se for uma operação lenta
    if (duration > 50) { // 50ms threshold
      console.warn(
        `⏱️ Slow operation '${operationName}': ${duration.toFixed(2)}ms`
      );
    }

    startTimeRef.current = 0;
    return duration;
  };

  return { start, end, lastOperationTime };
};