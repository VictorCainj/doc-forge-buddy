import { useState, useMemo, useCallback, useEffect } from 'react';

export interface VirtualScrollingOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Itens adicionais para renderizar (padrão: 5)
}

export interface VirtualScrollingReturn<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  containerStyle: React.CSSProperties;
}

/**
 * Hook para virtualização de listas grandes (virtual scrolling)
 * 
 * @param items - Array de itens
 * @param options - Configurações de virtualização
 * @returns Itens visíveis e informações de scroll
 */
export function useVirtualScrolling<T>(
  items: T[],
  options: VirtualScrollingOptions
): VirtualScrollingReturn<T> {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  // Cálculos de virtualização
  const {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  } = useMemo(() => {
    const totalItems = items.length;
    const totalHeight = totalItems * itemHeight;
    
    // Calcular índices visíveis
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(
      startIndex + visibleCount + overscan,
      totalItems
    );
    const adjustedStartIndex = Math.max(startIndex - overscan, 0);

    // Extrair itens visíveis
    const visibleItems = items.slice(adjustedStartIndex, endIndex);
    const offsetY = adjustedStartIndex * itemHeight;

    return {
      visibleItems,
      startIndex: adjustedStartIndex,
      endIndex,
      totalHeight,
      offsetY,
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  // Estilo do container
  const containerStyle: React.CSSProperties = {
    height: containerHeight,
    position: 'relative',
    overflow: 'auto',
  };

  // Estilo do conteúdo
  const contentStyle: React.CSSProperties = {
    height: totalHeight,
    position: 'relative',
  };

  // Handler de scroll otimizado
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    containerStyle: {
      ...containerStyle,
      onScroll: handleScroll,
    },
  };
}