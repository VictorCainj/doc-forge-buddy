import React, {
  memo,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { VirtualizedList } from './virtualized-list';
import { VirtualizedTable } from './virtualized-table';
import { VirtualizedGrid } from './virtualized-grid';
import { DynamicVirtualizedList } from './dynamic-virtualized-list';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Configurações de otimização
export interface VirtualizationConfig {
  // Thresholds para diferentes tipos de lista
  listThreshold: number; // Itens para ativar virtualização em listas
  tableThreshold: number; // Itens para ativar virtualização em tabelas
  gridThreshold: number; // Itens para ativar virtualização em grids
  
  // Configurações de performance
  enableMemoization: boolean;
  enableCache: boolean;
  enablePreloading: boolean;
  enableIntersectionObserver: boolean;
  
  // Configurações de scroll
  scrollDebounceMs: number;
  overscanDefault: number;
  
  // Configurações de memória
  maxCacheSize: number;
  memoryThreshold: number; // MB
  
  // Auto-detecção
  autoDetectPerformance: boolean;
  performanceCheckInterval: number; // ms
}

// Configurações padrão
const defaultConfig: VirtualizationConfig = {
  listThreshold: 50,
  tableThreshold: 100,
  gridThreshold: 100,
  enableMemoization: true,
  enableCache: true,
  enablePreloading: true,
  enableIntersectionObserver: true,
  scrollDebounceMs: 16, // ~60fps
  overscanDefault: 5,
  maxCacheSize: 1000,
  memoryThreshold: 100, // 100MB
  autoDetectPerformance: true,
  performanceCheckInterval: 5000, // 5s
};

// Tipos de lista suportados
export type ListType = 'list' | 'table' | 'grid' | 'dynamic';

// Props base para todos os tipos de lista
export interface SmartListProps<T = any> {
  data: T[];
  type: ListType;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  config?: Partial<VirtualizationConfig>;
  
  // Props específicas por tipo
  renderItem?: (item: T, index: number) => React.ReactNode; // Para list/grid
  columns?: any[]; // Para table
  itemWidth?: number; // Para grid
  itemHeight?: number; // Para grid/dynamic
  estimatedItemSize?: number; // Para dynamic
  
  // Callbacks
  onItemClick?: (item: T, index: number) => void;
  onItemHover?: (item: T, index: number) => void;
  onLoad?: () => void;
  onUnload?: () => void;
  
  // Configurações de container
  height?: number;
  containerClassName?: string;
  virtualizationEnabled?: boolean;
}

// Hook para monitorar performance do sistema
const usePerformanceMonitor = (config: VirtualizationConfig) => {
  const [performance, setPerformance] = useState({
    memory: { used: 0, total: 0 },
    fps: 60,
    renderTime: 0,
    scrollPerformance: 100,
  });

  useEffect(() => {
    if (!config.autoDetectPerformance) return;

    const interval = setInterval(() => {
      // Monitorar memória
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setPerformance(prev => ({
          ...prev,
          memory: {
            used: memory.usedJSHeapSize / 1024 / 1024, // MB
            total: memory.totalJSHeapSize / 1024 / 1024, // MB
          }
        }));
      }

      // Monitorar FPS usando requestAnimationFrame
      let lastTime = performance.now();
      let frameCount = 0;
      
      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) { // A cada segundo
          setPerformance(prev => ({
            ...prev,
            fps: Math.round((frameCount * 1000) / (currentTime - lastTime))
          }));
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      requestAnimationFrame(measureFPS);
    }, config.performanceCheckInterval);

    return () => clearInterval(interval);
  }, [config.autoDetectPerformance, config.performanceCheckInterval]);

  return performance;
};

// Hook para gerenciar cache de componentes
const useComponentCache = (config: VirtualizationConfig) => {
  const cacheRef = useRef<Map<string, any>>(new Map());
  const hitCountRef = useRef(0);
  const missCountRef = useRef(0);

  const get = useCallback((key: string) => {
    const item = cacheRef.current.get(key);
    if (item) {
      hitCountRef.current++;
      return item;
    }
    missCountRef.current++;
    return null;
  }, []);

  const set = useCallback((key: string, value: any) => {
    // LRU cache com limite de tamanho
    if (cacheRef.current.size >= config.maxCacheSize) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    
    cacheRef.current.set(key, value);
  }, [config.maxCacheSize]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    hitCountRef.current = 0;
    missCountRef.current = 0;
  }, []);

  const stats = useMemo(() => ({
    size: cacheRef.current.size,
    hits: hitCountRef.current,
    misses: missCountRef.current,
    hitRate: hitCountRef.current / Math.max(1, hitCountRef.current + missCountRef.current)
  }), []);

  return { get, set, clear, stats };
};

// Hook para detecção inteligente de tipo de lista
const useListTypeDetection = <T,>(
  data: T[],
  props: SmartListProps<T>
): ListType => {
  return useMemo(() => {
    // Se tipo foi explicitamente definido, usar ele
    if (props.type) return props.type;
    
    // Detectar automaticamente baseado nas props
    if (props.columns) return 'table';
    if (props.itemWidth) return 'grid';
    if (props.estimatedItemSize) return 'dynamic';
    return 'list';
  }, [props.type, props.columns, props.itemWidth, props.estimatedItemSize]);
};

// Hook para decidir se deve virtualizar
const useVirtualizationDecision = <T,>(
  data: T[],
  listType: ListType,
  config: VirtualizationConfig,
  userOverride?: boolean
) => {
  return useMemo(() => {
    // Respeitar override do usuário
    if (typeof userOverride === 'boolean') return userOverride;
    
    // Verificar limiares por tipo
    const thresholds = {
      list: config.listThreshold,
      table: config.tableThreshold,
      grid: config.gridThreshold,
      dynamic: config.listThreshold, // Usa threshold de lista
    };
    
    const threshold = thresholds[listType];
    return data.length > threshold;
  }, [data.length, listType, config, userOverride]);
};

// Componente de loading inteligente
const SmartLoadingSkeleton = memo<{
  type: ListType;
  count: number;
  itemProps: any;
}>(({ type, count, itemProps }) => {
  switch (type) {
    case 'table':
      return (
        <table className="w-full">
          <thead>
            <tr>
              {itemProps.columns?.map((col: any, index: number) => (
                <th key={index} className="p-4 text-left">
                  <Skeleton className="h-4 w-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i}>
                {itemProps.columns?.map((col: any, j: number) => (
                  <td key={j} className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    
    case 'grid':
      return (
        <div 
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${itemProps.itemWidth}px, 1fr))`,
          }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    
    default:
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
  }
});

SmartLoadingSkeleton.displayName = 'SmartLoadingSkeleton';

// Componente principal de container inteligente
export const SmartVirtualizedContainer = memo(
  forwardRef<any, SmartListProps>(
    <T extends Record<string, any>>(
      {
        data,
        type,
        loading = false,
        emptyMessage = 'Nenhum item encontrado',
        className = '',
        config: userConfig = {},
        renderItem,
        columns,
        itemWidth,
        itemHeight = 120,
        estimatedItemSize = 120,
        onItemClick,
        onItemHover,
        onLoad,
        onUnload,
        height = 600,
        containerClassName = '',
        virtualizationEnabled,
      }: SmartListProps<T>,
      ref
    ) => {
      // Merge configurações
      const config = useMemo(
        () => ({ ...defaultConfig, ...userConfig }),
        [userConfig]
      );

      // Hooks de otimização
      const performance = usePerformanceMonitor(config);
      const componentCache = useComponentCache(config);
      
      // Detecções
      const detectedType = useListTypeDetection(data, { type, columns, itemWidth, estimatedItemSize });
      const shouldVirtualize = useVirtualizationDecision(data, detectedType, config, virtualizationEnabled);

      // Callback de load/unload para analytics
      useEffect(() => {
        if (onLoad) onLoad();
        return () => {
          if (onUnload) onUnload();
        };
      }, [onLoad, onUnload]);

      // Memoize performance-based config adjustments
      const adjustedConfig = useMemo(() => {
        const adjusted = { ...config };
        
        // Ajustar overscan baseado na performance
        if (performance.fps < 30) {
          adjusted.overscanDefault = Math.max(1, Math.floor(config.overscanDefault / 2));
        } else if (performance.fps > 55) {
          adjusted.overscanDefault = config.overscanDefault + 2;
        }
        
        // Desabilitar cache se memória está alta
        if (performance.memory.used > config.memoryThreshold * 0.8) {
          adjusted.enableCache = false;
        }
        
        return adjusted;
      }, [config, performance]);

      // Loading state
      if (loading) {
        return (
          <div className={containerClassName}>
            <SmartLoadingSkeleton 
              type={detectedType} 
              count={5} 
              itemProps={{ columns, itemWidth, itemHeight }} 
            />
          </div>
        );
      }

      // Empty state
      if (data.length === 0) {
        return (
          <Card className={containerClassName}>
            <CardContent className="p-12">
              <div className="text-center">
                <p className="text-muted-foreground text-lg">{emptyMessage}</p>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Memoized render functions
      const memoizedProps = useMemo(() => ({
        data,
        loading,
        emptyMessage,
        virtualizationEnabled: shouldVirtualize,
        overscan: adjustedConfig.overscanDefault,
        ...(detectedType === 'table' && { columns }),
        ...(detectedType === 'grid' && { itemWidth, itemHeight }),
        ...(detectedType === 'dynamic' && { estimatedItemSize }),
      }), [data, loading, emptyMessage, shouldVirtualize, adjustedConfig.overscanDefault, detectedType, columns, itemWidth, itemHeight, estimatedItemSize]);

      // Renderizar componente apropriado
      const renderList = () => {
        const cacheKey = `list-${detectedType}-${data.length}-${shouldVirtualize}`;
        let component = componentCache.get(cacheKey);

        if (!component) {
          const commonProps = {
            ...memoizedProps,
            className: `${className} ${containerClassName}`,
            ...(onItemClick && { onItemClick }),
            ...(onItemHover && { onItemHover }),
          };

          switch (detectedType) {
            case 'table':
              component = <VirtualizedTable {...commonProps} />;
              break;
            case 'grid':
              component = <VirtualizedGrid {...commonProps} renderItem={renderItem!} />;
              break;
            case 'dynamic':
              component = <DynamicVirtualizedList {...commonProps} renderItem={renderItem!} />;
              break;
            default:
              component = <VirtualizedList {...commonProps} renderItem={renderItem!} />;
          }

          if (adjustedConfig.enableCache) {
            componentCache.set(cacheKey, component);
          }
        }

        return component;
      };

      return <div className={containerClassName}>{renderList()}</div>;
    }
  )
);

SmartVirtualizedContainer.displayName = 'SmartVirtualizedContainer';

// Hook para performance monitoring
export const useVirtualizationPerformance = () => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    virtualizedLists: 0,
    averageRenderTime: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Coletar métricas de performance
      setMetrics(prev => ({
        ...prev,
        memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

export default SmartVirtualizedContainer;