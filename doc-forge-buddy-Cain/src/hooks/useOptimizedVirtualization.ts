import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { useVirtualScrolling, VirtualScrollingOptions, VirtualScrollingReturn } from 'advanced-utility-hooks';

// ========================================
// HOOKS DE VIRTUALIZAÇÃO OTIMIZADOS
// ========================================

export interface OptimizedVirtualizationConfig {
  // Performance
  enableMemoization: boolean;
  enableDebouncing: boolean;
  enableCaching: boolean;
  enablePreloading: boolean;
  
  // Scroll
  debounceMs: number;
  overscan: number;
  preloadBuffer: number;
  
  // Cache
  cacheSize: number;
  cacheTTL: number; // ms
  
  // Memory
  maxMemoryUsage: number; // MB
  garbageCollectThreshold: number; // MB
}

export interface VirtualizedListState {
  isVirtualized: boolean;
  renderTime: number;
  memoryUsage: number;
  visibleItemsCount: number;
  cachedItemsCount: number;
  cacheHitRate: number;
}

export interface OptimizedVirtualizationReturn<T> extends VirtualScrollingReturn<T> {
  state: VirtualizedListState;
  cache: Map<string, any>;
  performance: {
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
  };
}

// Configurações padrão otimizadas
const DEFAULT_CONFIG: OptimizedVirtualizationConfig = {
  enableMemoization: true,
  enableDebouncing: true,
  enableCaching: true,
  enablePreloading: true,
  debounceMs: 16, // ~60fps
  overscan: 5,
  preloadBuffer: 10,
  cacheSize: 1000,
  cacheTTL: 30000, // 30 segundos
  maxMemoryUsage: 100, // MB
  garbageCollectThreshold: 80, // MB
};

// ========================================
// CACHE LRU COM TTL
// ========================================

class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; accessCount: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Verificar TTL
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Atualizar access count
    item.accessCount++;
    return item.value;
  }

  set(key: K, value: V): void {
    // Remover item mais antigo se cache está cheio
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const totalAccess = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.accessCount, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? (this.cache.size / totalAccess) : 0,
    };
  }

  private getOldestKey(): K | undefined {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }
}

// ========================================
// HOOK PRINCIPAL DE VIRTUALIZAÇÃO OTIMIZADA
// ========================================

export function useOptimizedVirtualization<T>(
  items: T[],
  options: VirtualScrollingOptions,
  config: Partial<OptimizedVirtualizationConfig> = {}
): OptimizedVirtualizationReturn<T> {
  // Merge configurações
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // Hook base de virtual scrolling
  const baseReturn = useVirtualScrolling(items, options);
  
  // Estado de performance
  const [state, setState] = useState<VirtualizedListState>({
    isVirtualized: false,
    renderTime: 0,
    memoryUsage: 0,
    visibleItemsCount: 0,
    cachedItemsCount: 0,
    cacheHitRate: 0,
  });

  // Cache com LRU + TTL
  const cacheRef = useRef<LRUCache<string, React.ReactNode>>(
    new LRUCache(finalConfig.cacheSize, finalConfig.cacheTTL)
  );

  // Contadores de performance
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: performance.now(),
    totalRenderTime: 0,
  });

  // Detectar se deve virtualizar baseado no tamanho
  const shouldVirtualize = useMemo(() => {
    const totalHeight = items.length * options.itemHeight;
    const containerHeight = options.containerHeight;
    
    // Virtualizar se altura total é significativamente maior que o container
    return totalHeight > containerHeight * 1.5 && items.length > 50;
  }, [items.length, options.itemHeight, options.containerHeight]);

  // Debounced scroll handler
  const debouncedScrollHandler = useCallback(
    finalConfig.enableDebouncing
      ? debounce((e: React.UIEvent<HTMLDivElement>) => {
          baseReturn.containerStyle.onScroll?.(e);
        }, finalConfig.debounceMs)
      : baseReturn.containerStyle.onScroll,
    [baseReturn.containerStyle.onScroll, finalConfig.enableDebouncing, finalConfig.debounceMs]
  );

  // Cache de componentes memoizado
  const memoizedItemRenderer = useMemo(() => {
    if (!finalConfig.enableMemoization) {
      return null;
    }

    const cache = cacheRef.current;
    
    return (item: T, index: number): React.ReactNode => {
      const cacheKey = `item-${index}-${JSON.stringify(item)}`;
      let cached = cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Em uma implementação real, aqui seria o componente renderizado
      cached = React.createElement('div', {
        key: index,
        'data-index': index,
        'data-item-id': (item as any).id || index,
      }, `Item ${index}`);
      
      cache.set(cacheKey, cached);
      return cached;
    };
  }, [finalConfig.enableMemoization]);

  // Preloading de itens
  const preloadedItems = useMemo(() => {
    if (!finalConfig.enablePreloading) {
      return baseReturn.visibleItems;
    }

    const { startIndex, endIndex } = {
      startIndex: baseReturn.startIndex,
      endIndex: Math.min(baseReturn.endIndex + finalConfig.preloadBuffer, items.length - 1),
    };

    return items.slice(startIndex, endIndex + 1);
  }, [
    baseReturn.visibleItems,
    baseReturn.startIndex,
    baseReturn.endIndex,
    items,
    finalConfig.enablePreloading,
    finalConfig.preloadBuffer,
  ]);

  // Atualizar métricas de performance
  useEffect(() => {
    const now = performance.now();
    const renderTime = now - performanceRef.current.lastRenderTime;
    
    performanceRef.current.renderCount++;
    performanceRef.current.totalRenderTime += renderTime;
    performanceRef.current.lastRenderTime = now;

    // Atualizar estado
    setState(prev => ({
      ...prev,
      isVirtualized: shouldVirtualize,
      renderTime,
      visibleItemsCount: preloadedItems.length,
      cachedItemsCount: cacheRef.current.cache.size,
      cacheHitRate: cacheRef.current.getStats().hitRate,
      memoryUsage: getMemoryUsage(),
    }));

    // Limpeza de cache se memória está alta
    if (getMemoryUsage() > finalConfig.garbageCollectThreshold) {
      cacheRef.current.clear();
    }
  }, [baseReturn.visibleItems, preloadedItems.length, shouldVirtualize, finalConfig.garbageCollectThreshold]);

  // Memoized return
  const optimizedReturn = useMemo((): OptimizedVirtualizedReturn<T> => {
    return {
      ...baseReturn,
      visibleItems: preloadedItems,
      state,
      cache: cacheRef.current.cache,
      performance: {
        renderCount: performanceRef.current.renderCount,
        lastRenderTime: performanceRef.current.lastRenderTime - performanceRef.current.totalRenderTime,
        averageRenderTime: performanceRef.current.totalRenderTime / performanceRef.current.renderCount,
      },
      // Container style com debouncing
      containerStyle: {
        ...baseReturn.containerStyle,
        onScroll: debouncedScrollHandler,
      },
    };
  }, [baseReturn, preloadedItems, state, debouncedScrollHandler]);

  return optimizedReturn;
}

// ========================================
// HOOK PARA MEMOIZAÇÃO INTELIGENTE
// ========================================

export function useSmartMemoization<T>(
  component: React.ComponentType<T>,
  dependencies: React.DependencyList
) {
  const [memoizedComponent, setMemoizedComponent] = useState<React.ComponentType<T>>();

  useLayoutEffect(() => {
    // Memoizar apenas se as dependências mudaram
    const Key = `memo-${JSON.stringify(dependencies)}`;
    
    setMemoizedComponent(() => {
      const MemoizedComponent = memo(component, (prevProps, nextProps) => {
        // Comparação profunda customizada para performance
        return JSON.stringify(prevProps) === JSON.stringify(nextProps);
      });
      
      MemoizedComponent.displayName = `SmartMemoized(${component.displayName || component.name})`;
      return MemoizedComponent;
    });
  }, [component, ...dependencies]);

  return memoizedComponent;
}

// ========================================
// HOOK PARA PRELOADING INTELIGENTE
// ========================================

export function useIntelligentPreloading<T>(
  items: T[],
  currentIndex: number,
  bufferSize: number = 5
) {
  const [preloadedItems, setPreloadedItems] = useState<Set<number>>(new Set());
  const preloadRef = useRef<NodeJS.Timeout>();

  const preload = useCallback((targetIndex: number) => {
    // Cancelar preload anterior
    if (preloadRef.current) {
      clearTimeout(preloadRef.current);
    }

    // Preload com debounce
    preloadRef.current = setTimeout(() => {
      const start = Math.max(0, targetIndex - bufferSize);
      const end = Math.min(items.length, targetIndex + bufferSize);
      
      const newPreloaded = new Set<number>();
      for (let i = start; i < end; i++) {
        newPreloaded.add(i);
      }
      
      setPreloadedItems(newPreloaded);
    }, 100);
  }, [items.length, bufferSize]);

  // Preload automático baseado no índice atual
  useEffect(() => {
    preload(currentIndex);
  }, [currentIndex, preload]);

  const isPreloaded = useCallback((index: number) => {
    return preloadedItems.has(index);
  }, [preloadedItems]);

  return { isPreloaded, preloadedItems };
}

// ========================================
// HOOK PARA MONITORAMENTO DE MEMÓRIA
// ========================================

export function useMemoryMonitor(thresholdMB: number = 100) {
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [isHighMemory, setIsHighMemory] = useState(false);

  const checkMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1024 / 1024; // MB
      setMemoryUsage(used);
      setIsHighMemory(used > thresholdMB);
    }
  }, [thresholdMB]);

  useEffect(() => {
    checkMemory();
    const interval = setInterval(checkMemory, 2000);
    return () => clearInterval(interval);
  }, [checkMemory]);

  const cleanup = useCallback(() => {
    // Força garbage collection se disponível
    if ('gc' in window) {
      (window as any).gc();
    }
    checkMemory();
  }, [checkMemory]);

  return { memoryUsage, isHighMemory, cleanup, checkMemory };
}

// ========================================
// HOOK PARA PERFORMANCE TRACKING
// ========================================

export function usePerformanceTracker(componentName: string) {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  const startRef = useRef<number>();
  const frameCountRef = useRef(0);
  const lastFpsTime = useRef<number>();

  const startMeasure = useCallback(() => {
    startRef.current = performance.now();
  }, []);

  const endMeasure = useCallback(() => {
    if (startRef.current) {
      const renderTime = performance.now() - startRef.current;
      setMetrics(prev => {
        const newAverage = (prev.averageRenderTime * prev.renderCount + renderTime) / (prev.renderCount + 1);
        return {
          ...prev,
          renderCount: prev.renderCount + 1,
          lastRenderTime: renderTime,
          averageRenderTime: newAverage,
        };
      });
    }
  }, []);

  // FPS tracking
  useEffect(() => {
    const measureFPS = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      if (!lastFpsTime.current) {
        lastFpsTime.current = now;
      } else if (now - lastFpsTime.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTime.current));
        setMetrics(prev => ({ ...prev, fps }));
        
        frameCountRef.current = 0;
        lastFpsTime.current = now;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }, []);

  // Memory tracking
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    const interval = setInterval(checkMemory, 1000);
    return () => clearInterval(interval);
  }, []);

  const logMetrics = useCallback(() => {
    console.log(`[Performance] ${componentName}:`, {
      ...metrics,
      renderTime: `${metrics.lastRenderTime.toFixed(2)}ms`,
      memory: `${metrics.memoryUsage.toFixed(2)}MB`,
    });
  }, [componentName, metrics]);

  return {
    metrics,
    startMeasure,
    endMeasure,
    logMetrics,
  };
}

// ========================================
// UTILITÁRIOS
// ========================================

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function getMemoryUsage(): number {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / 1024 / 1024; // MB
  }
  return 0;
}

// ========================================
// HOOKS ESPECIALIZADOS POR TIPO DE LISTA
// ========================================

export function useOptimizedListVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  config?: Partial<OptimizedVirtualizationConfig>
) {
  return useOptimizedVirtualization<T>(items, {
    itemHeight,
    containerHeight,
    overscan: config?.overscan || 5,
  }, config);
}

export function useOptimizedTableVirtualization<T>(
  items: T[],
  columns: Array<{ key: keyof T; width: number }>,
  rowHeight: number,
  containerHeight: number,
  config?: Partial<OptimizedVirtualizationConfig>
) {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  
  return useOptimizedVirtualization<T>(items, {
    itemHeight: rowHeight,
    containerHeight: Math.min(containerHeight, 800), // Limit para performance
    overscan: config?.overscan || 3,
  }, {
    ...config,
    enableCaching: true, // Tabelas se beneficiam mais do cache
  });
}

export function useOptimizedGridVirtualization<T>(
  items: T[],
  itemWidth: number,
  itemHeight: number,
  containerWidth: number,
  containerHeight: number,
  gap: number = 8,
  config?: Partial<OptimizedVirtualizationConfig>
) {
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  
  return useOptimizedVirtualization<T>(items, {
    itemHeight: itemHeight + gap,
    containerHeight,
    overscan: config?.overscan || 2,
  }, {
    ...config,
    enablePreloading: true, // Grids se beneficiam do preloading
  });
}

export default useOptimizedVirtualization;