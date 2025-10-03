import React, { useCallback, useMemo } from 'react';

/**
 * Hook para otimização de bundle e imports
 */
export const useBundleOptimization = () => {
  /**
   * Lazy loading de componentes
   */
  const lazyLoadComponent = useCallback(
    (importFn: () => Promise<any>) => {
      return React.lazy(importFn);
    },
    []
  );

  /**
   * Memoização de imports pesados
   */
  const memoizedImports = useMemo(() => {
    return {
      // Imports que são carregados sob demanda
      heavyComponents: {
        Chart: () => import('@/components/ui/advanced-chart'),
        VirtualList: () => import('@/components/ui/virtualized-list'),
        OptimizedSearch: () => import('@/components/ui/optimized-search'),
      },
      // Imports de utilitários
      utils: {
        dateFormatter: () => import('@/utils/dateFormatter'),
        dataValidator: () => import('@/utils/dataValidator'),
        docxGenerator: () => import('@/utils/docxGenerator'),
      },
    };
  }, []);

  /**
   * Preload de componentes críticos
   */
  const preloadCriticalComponents = useCallback(() => {
    // Preload de componentes que são frequentemente usados
    const criticalComponents = [
      () => import('@/components/ui/button'),
      () => import('@/components/ui/card'),
      () => import('@/components/ui/input'),
      () => import('@/components/ui/dialog'),
    ];

    criticalComponents.forEach((importFn) => {
      importFn().catch(() => {
        // Ignorar erros de preload
      });
    });
  }, []);

  /**
   * Otimização de imports condicionais
   */
  const conditionalImport = useCallback(
    async (condition: boolean, importFn: () => Promise<any>) => {
      if (condition) {
        return await importFn();
      }
      return null;
    },
    []
  );

  /**
   * Debounce para imports
   */
  const debouncedImport = useCallback(
    (importFn: () => Promise<any>, delay: number = 300) => {
      let timeoutId: NodeJS.Timeout;
      
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            const module = await importFn();
            resolve(module);
          } catch {
            // Erro ao carregar módulo
            resolve(null);
          }
        }, delay);
      });
    },
    []
  );

  return {
    lazyLoadComponent,
    memoizedImports,
    preloadCriticalComponents,
    conditionalImport,
    debouncedImport,
  };
};

/**
 * Hook para otimização de performance de listas
 */
export const useListPerformance = <T>(
  items: T[],
  options: {
    virtualScrolling?: boolean;
    itemHeight?: number;
    containerHeight?: number;
    batchSize?: number;
  } = {}
) => {
  const {
    virtualScrolling = true,
    itemHeight = 120,
    containerHeight = 600,
    batchSize = 20,
  } = options;

  /**
   * Processar itens em lotes para evitar bloqueio da UI
   */
  const processItemsInBatches = useCallback(
    (items: T[], processor: (item: T) => any) => {
      return new Promise((resolve) => {
        const results: any[] = [];
        let index = 0;

        const processBatch = () => {
          const endIndex = Math.min(index + batchSize, items.length);
          
          for (let i = index; i < endIndex; i++) {
            results.push(processor(items[i]));
          }
          
          index = endIndex;
          
          if (index < items.length) {
            // Usar requestAnimationFrame para não bloquear a UI
            requestAnimationFrame(processBatch);
          } else {
            resolve(results);
          }
        };

        processBatch();
      });
    },
    [batchSize]
  );

  /**
   * Calcular itens visíveis para virtualização
   */
  const getVisibleItems = useCallback(
    (scrollTop: number, containerHeightParam: number) => {
      if (!virtualScrolling) {
        return { startIndex: 0, endIndex: items.length - 1 };
      }

      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeightParam) / itemHeight)
      );

      return { startIndex, endIndex };
    },
    [items.length, itemHeight, virtualScrolling]
  );

  /**
   * Otimizar re-renders com memoização
   */
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      ...item,
      _index: index,
      _id: `item-${index}`,
    }));
  }, [items]);

  return {
    processItemsInBatches,
    getVisibleItems,
    memoizedItems,
    virtualScrolling,
    itemHeight,
    containerHeight,
  };
};

export default useBundleOptimization;
