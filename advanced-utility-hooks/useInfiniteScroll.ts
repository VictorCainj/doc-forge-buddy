import { useState, useCallback, useRef, useEffect } from 'react';

export interface InfiniteScrollState<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  loadCount: number;
}

export interface InfiniteScrollActions<T> {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  setItems: (items: T[]) => void;
  addItems: (newItems: T[]) => void;
}

/**
 * Hook para scroll infinito com carregamento automático
 * 
 * @param fetchMore - Função para carregar mais itens
 * @param options - Configurações do hook
 * @returns Estado e ações do scroll infinito
 */
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  options?: {
    initialItems?: T[];
    threshold?: number; // Distância do final para trigger (padrão: 200px)
    enabled?: boolean; // Se o hook está habilitado
  }
): InfiniteScrollState<T> & InfiniteScrollActions<T> {
  const {
    initialItems = [],
    threshold = 200,
    enabled = true,
  } = options || {};

  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadCount, setLoadCount] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Função para carregar mais itens
  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await fetchMore();
      setLoadCount(prev => prev + 1);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar itens';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMore, enabled, isLoading, hasMore]);

  // Refresh - recarregar do início
  const refresh = useCallback(async () => {
    setItems(initialItems);
    setHasMore(true);
    setError(null);
    setLoadCount(0);
    await loadMore();
  }, [initialItems, loadMore]);

  // Reset completo
  const reset = useCallback(() => {
    setItems(initialItems);
    setIsLoading(false);
    setHasMore(true);
    setError(null);
    setLoadCount(0);
  }, [initialItems]);

  // Definir itens manualmente
  const setItemsDirect = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  // Adicionar novos itens
  const addItems = useCallback((newItems: T[]) => {
    setItems(prev => [...prev, ...newItems]);
  }, []);

  // Configurar Intersection Observer
  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, isLoading, loadMore, threshold]);

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadCount,
    loadMore,
    refresh,
    reset,
    setItems: setItemsDirect,
    addItems,
  };
}