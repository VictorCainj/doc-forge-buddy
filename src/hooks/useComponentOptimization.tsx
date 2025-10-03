import { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Hook para otimização de componentes React
 * Fornece utilitários para memoização e performance
 */
export const useComponentOptimization = () => {
  // Cache para valores computados
  const cacheRef = useRef<Map<string, unknown>>(new Map());

  /**
   * Memoização com cache personalizado
   */
  const memoizeWithCache = useCallback(<T,>(
    key: string,
    computeFn: () => T,
    dependencies: unknown[] = []
  ): T => {
    const cacheKey = `${key}-${JSON.stringify(dependencies)}`;
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey) as T;
    }

    const result = computeFn();
    cacheRef.current.set(cacheKey, result);
    
    // Limitar tamanho do cache
    if (cacheRef.current.size > 100) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey) {
        cacheRef.current.delete(firstKey);
      }
    }

    return result;
  }, []);

  /**
   * Debounce para funções
   */
  const createDebounce = useCallback(<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
  ): T => {
    let timeoutId: NodeJS.Timeout;

    return ((...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T;
  }, []);

  /**
   * Throttle para funções
   */
  const createThrottle = useCallback(<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
  ): T => {
    let lastCall = 0;

    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall >= delay) {
        lastCall = now;
        callback(...args);
      }
    }) as T;
  }, []);

  /**
   * Limpar cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  /**
   * Limpar cache automaticamente após um tempo
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (cacheRef.current.size > 50) {
        clearCache();
      }
    }, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [clearCache]);

  return {
    memoizeWithCache,
    createDebounce,
    createThrottle,
    clearCache,
  };
};

/**
 * Hook para otimização de listas grandes
 */
export const useListOptimization = <T,>(
  items: T[],
  options: {
    pageSize?: number;
    maxItems?: number;
    enableVirtualization?: boolean;
  } = {}
) => {
  const {
    pageSize = 20,
    maxItems = 1000,
    enableVirtualization = true,
  } = options;

  // Paginação
  const paginatedItems = useMemo(() => {
    if (!enableVirtualization || items.length <= pageSize) {
      return items.slice(0, maxItems);
    }
    return items.slice(0, maxItems);
  }, [items, pageSize, maxItems, enableVirtualization]);

  // Métricas de performance
  const performanceMetrics = useMemo(() => ({
    totalItems: items.length,
    displayedItems: paginatedItems.length,
    isVirtualized: enableVirtualization && items.length > pageSize,
    memoryUsage: items.length * 0.1, // Estimativa aproximada em KB
  }), [items.length, paginatedItems.length, enableVirtualization, pageSize]);

  return {
    items: paginatedItems,
    performanceMetrics,
  };
};

/**
 * Hook para otimização de re-renders
 */
export const useRenderOptimization = () => {
  const renderCountRef = useRef(0);
  const lastPropsRef = useRef<unknown>(null);

  // Contar renders
  useEffect(() => {
    renderCountRef.current += 1;
  });

  // Detectar mudanças de props
  const hasPropsChanged = useCallback((newProps: unknown) => {
    const hasChanged = JSON.stringify(newProps) !== JSON.stringify(lastPropsRef.current);
    lastPropsRef.current = newProps;
    return hasChanged;
  }, []);

  // Verificar se deve re-renderizar
  const shouldRender = useCallback((newProps: unknown, dependencies: unknown[] = []) => {
    return hasPropsChanged(newProps) || dependencies.some(dep => dep !== null);
  }, [hasPropsChanged]);

  return {
    renderCount: renderCountRef.current,
    hasPropsChanged,
    shouldRender,
  };
};

export default useComponentOptimization;