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
import { VariableSizeList as List } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface DynamicListItem {
  id: string | number;
  height?: number;
  [key: string]: any;
}

export interface DynamicVirtualizedListProps<T extends DynamicListItem> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemKey?: (item: T, index: number) => string;
  estimatedItemSize?: number;
  height?: number;
  overscan?: number;
  loading?: boolean;
  emptyMessage?: string;
  onItemMount?: (item: T, index: number, element: HTMLElement) => void;
  onItemUnmount?: (item: T, index: number) => void;
  className?: string;
  virtualizationEnabled?: boolean;
  threshold?: number;
  cacheSize?: number;
}

// Hook para gerenciar alturas dinâmicas
const useDynamicHeights = (data: DynamicListItem[], estimatedSize: number) => {
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [measuredItems, setMeasuredItems] = useState<Set<number>>(new Set());

  // Estimar altura baseada no conteúdo
  const estimateHeight = useCallback((index: number): number => {
    const item = data[index];
    if (item?.height) return item.height;
    
    // Estimativa baseada em tipo de conteúdo
    if (typeof item?.content === 'string') {
      const length = item.content.length;
      if (length < 50) return 80; // Texto curto
      if (length < 200) return 120; // Texto médio
      if (length < 500) return 200; // Texto longo
      return 300; // Texto muito longo
    }

    if (Array.isArray(item?.items)) {
      return Math.max(100, item.items.length * 30 + 50);
    }

    return estimatedSize; // Tamanho estimado padrão
  }, [data, estimatedSize]);

  // Obter altura de um item (medida ou estimada)
  const getItemHeight = useCallback((index: number): number => {
    if (measuredItems.has(index)) {
      return heights[index] || estimateHeight(index);
    }
    return estimateHeight(index);
  }, [heights, measuredItems, estimateHeight]);

  // Marcar item como medido
  const markItemMeasured = useCallback((index: number, height: number) => {
    setHeights(prev => ({ ...prev, [index]: height }));
    setMeasuredItems(prev => new Set([...prev, index]));
  }, []);

  // Resetar medições
  const resetMeasurements = useCallback(() => {
    setHeights({});
    setMeasuredItems(new Set());
  }, []);

  return {
    getItemHeight,
    markItemMeasured,
    resetMeasurements,
    isItemMeasured: useCallback((index: number) => measuredItems.has(index), [measuredItems]),
  };
};

// Hook para cache de itens
const useItemCache = (size: number) => {
  const cacheRef = useRef<Map<string, any>>(new Map());
  const orderRef = useRef<string[]>([]);

  const get = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const set = useCallback((key: string, value: any) => {
    // Remove oldest item if cache is full
    if (orderRef.current.length >= size) {
      const oldestKey = orderRef.current.shift();
      if (oldestKey) {
        cacheRef.current.delete(oldestKey);
      }
    }

    cacheRef.current.set(key, value);
    orderRef.current.push(key);
  }, [size]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    orderRef.current = [];
  }, []);

  const has = useCallback((key: string) => cacheRef.current.has(key), []);

  return { get, set, clear, has };
};

// Componente de item com medição automática
const MeasuredListItem = memo<{
  item: DynamicListItem;
  index: number;
  style: React.CSSProperties;
  renderItem: (item: DynamicListItem, index: number) => React.ReactNode;
  onItemMount?: (item: DynamicListItem, index: number, element: HTMLElement) => void;
  onItemUnmount?: (item: DynamicListItem, index: number) => void;
  markMeasured: (index: number, height: number) => void;
}>(({ item, index, style, renderItem, onItemMount, onItemUnmount, markMeasured }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      // Medir altura após renderização
      const measureHeight = () => {
        const height = element.offsetHeight;
        markMeasured(index, height);
      };

      // Usar ResizeObserver para detectar mudanças de tamanho
      const resizeObserver = new ResizeObserver(measureHeight);
      resizeObserver.observe(element);

      // Medir após um pequeno delay para garantir que o conteúdo foi renderizado
      const timeoutId = setTimeout(measureHeight, 100);

      if (onItemMount) {
        onItemMount(item, index, element);
      }

      return () => {
        resizeObserver.disconnect();
        clearTimeout(timeoutId);
        if (onItemUnmount) {
          onItemUnmount(item, index);
        }
      };
    }
  }, [item, index, markMeasured, onItemMount, onItemUnmount]);

  return (
    <div ref={elementRef} style={style}>
      {renderItem(item, index)}
    </div>
  );
});

MeasuredListItem.displayName = 'MeasuredListItem';

// Componente principal da lista dinâmica
export const DynamicVirtualizedList = <T extends DynamicListItem>(
  {
    data,
    renderItem,
    itemKey,
    estimatedItemSize = 120,
    height = 600,
    overscan = 5,
    loading = false,
    emptyMessage = 'Nenhum item encontrado',
    onItemMount,
    onItemUnmount,
    className = '',
    virtualizationEnabled,
    threshold = 100,
    cacheSize = 100,
  }: DynamicVirtualizedListProps<T>,
  ref?: React.Ref<any>
) => {
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Hooks de otimização
  const { getItemHeight, markItemMeasured, resetMeasurements } = useDynamicHeights(
    data,
    estimatedItemSize
  );
  const itemCache = useItemCache(cacheSize);

  // Detectar se deve virtualizar
  const shouldVirtualize = useMemo(() => {
    if (typeof virtualizationEnabled === 'boolean') return virtualizationEnabled;
    if (threshold === 0) return true;
    if (threshold === Infinity) return false;
    return data.length > threshold;
  }, [data.length, threshold, virtualizationEnabled]);

  // Reset medições quando dados mudam
  useEffect(() => {
    resetMeasurements();
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [data, resetMeasurements]);

  // Atualizar largura do container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Expor métodos via ref
  useImperativeHandle(ref, () => ({
    scrollToItem: (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (listRef.current) {
        listRef.current.scrollToItem(index, align);
      }
    },
    scrollToTop: () => {
      if (listRef.current) {
        listRef.current.scrollTo(0);
      }
    },
    scrollToBottom: () => {
      if (listRef.current) {
        const totalHeight = data.reduce((sum, _, index) => sum + getItemHeight(index), 0);
        listRef.current.scrollTo(totalHeight);
      }
    },
    reset: () => {
      resetMeasurements();
      itemCache.clear();
      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
    },
  }));

  // Cell renderer
  const Cell = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = data[index];
      const cacheKey = itemKey ? itemKey(item, index) : `item-${index}`;

      // Verificar cache
      let cachedElement = itemCache.get(cacheKey);
      
      if (!cachedElement && !loading) {
        cachedElement = (
          <MeasuredListItem
            item={item}
            index={index}
            style={style}
            renderItem={renderItem}
            onItemMount={onItemMount}
            onItemUnmount={onItemUnmount}
            markMeasured={markItemMeasured}
          />
        );
        itemCache.set(cacheKey, cachedElement);
      }

      if (!item && loading) {
        return (
          <div style={style} className="px-3 py-3">
            <Card className="bg-white border-neutral-200 shadow-md">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (!item) return null;

      return cachedElement || (
        <MeasuredListItem
          item={item}
          index={index}
          style={style}
          renderItem={renderItem}
          onItemMount={onItemMount}
          onItemUnmount={onItemUnmount}
          markMeasured={markItemMeasured}
        />
      );
    },
    [data, loading, renderItem, itemKey, onItemMount, onItemUnmount, markItemMeasured, itemCache]
  );

  // Item size getter para react-window
  const getItemSize = useCallback((index: number) => {
    return getItemHeight(index);
  }, [getItemHeight]);

  // Loading state
  if (loading && data.length === 0) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="bg-white border-neutral-200 shadow-md">
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
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Se não deve virtualizar, renderizar lista normal
  if (!shouldVirtualize) {
    return (
      <div ref={containerRef} className={`w-full space-y-3 ${className}`}>
        {data.map((item, index) => (
          <div key={itemKey ? itemKey(item, index) : index} className="px-3 py-3">
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Lista virtualizada
  return (
    <div 
      ref={containerRef} 
      className={`w-full ${className}`}
      style={{ height }}
    >
      {containerWidth > 0 && (
        <List
          ref={listRef}
          height={height}
          itemCount={data.length}
          itemSize={getItemSize}
          width={containerWidth}
          overscanCount={overscan}
        >
          {Cell}
        </List>
      )}
    </div>
  );
};

DynamicVirtualizedList.displayName = 'DynamicVirtualizedList';

// HOC para adicionar funcionalidades de scroll e cache
export const withVirtualization = <T extends DynamicListItem>(
  Component: React.ComponentType<T>
) => {
  return memo(forwardRef<any, T>((props, ref) => {
    return (
      <DynamicVirtualizedList {...props} ref={ref}>
        {(item: DynamicListItem) => <Component {...item} />}
      </DynamicVirtualizedList>
    );
  }));
};

export default DynamicVirtualizedList;