import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em ms
}

interface UseDataOptimizationOptions {
  cacheKey?: string;
  ttl?: number; // Time to live em ms
  maxCacheSize?: number;
  enableCompression?: boolean;
}

/**
 * Hook para otimização de dados com cache inteligente
 */
export const useDataOptimization = <T>(
  fetchFn: () => Promise<T>,
  options: UseDataOptimizationOptions = {}
) => {
  const {
    cacheKey = 'default',
    ttl = 5 * 60 * 1000, // 5 minutos
    maxCacheSize = 100,
    enableCompression = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache em memória
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Verificar se o cache é válido
   */
  const isCacheValid = useCallback((entry: CacheEntry<T>) => {
    return Date.now() - entry.timestamp < entry.ttl;
  }, []);

  /**
   * Limpar cache expirado
   */
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        cache.delete(key);
      }
    }
  }, []);

  /**
   * Comprimir dados se habilitado
   */
  const compressData = useCallback((data: T): T => {
    if (!enableCompression) return data;
    
    // Implementação simples de compressão (pode ser melhorada)
    try {
      const serialized = JSON.stringify(data);
      const compressed = serialized.length > 1000 ? 
        serialized.substring(0, 1000) + '...' : serialized;
      return JSON.parse(compressed);
    } catch {
      return data;
    }
  }, [enableCompression]);

  /**
   * Buscar dados com cache
   */
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Verificar cache primeiro
    if (!forceRefresh) {
      const cachedEntry = cacheRef.current.get(cacheKey);
      if (cachedEntry && isCacheValid(cachedEntry)) {
        setData(cachedEntry.data);
        setError(null);
        return cachedEntry.data;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Criar novo AbortController
      abortControllerRef.current = new AbortController();
      
      const result = await fetchFn();
      const compressedResult = compressData(result);
      
      // Armazenar no cache
      cacheRef.current.set(cacheKey, {
        data: compressedResult,
        timestamp: Date.now(),
        ttl,
      });

      // Limitar tamanho do cache
      if (cacheRef.current.size > maxCacheSize) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }

      setData(compressedResult);
      setLastFetch(Date.now());
      
      return compressedResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [fetchFn, cacheKey, ttl, maxCacheSize, isCacheValid, compressData]);

  /**
   * Invalidar cache
   */
  const invalidateCache = useCallback(() => {
    cacheRef.current.delete(cacheKey);
    setData(null);
  }, [cacheKey]);

  /**
   * Limpar todo o cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setData(null);
  }, []);

  /**
   * Obter estatísticas do cache
   */
  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const entry of cache.values()) {
      if (now - entry.timestamp < entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / Math.max(1, cache.size),
    };
  }, []);

  // Limpeza automática do cache
  useEffect(() => {
    const interval = setInterval(cleanExpiredCache, 60000); // A cada minuto
    return () => clearInterval(interval);
  }, [cleanExpiredCache]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastFetch,
    fetchData,
    invalidateCache,
    clearCache,
    getCacheStats,
  };
};

/**
 * Hook para otimização de listas grandes
 */
export const useLargeListOptimization = <T>(
  items: T[],
  options: {
    pageSize?: number;
    enableVirtualization?: boolean;
    itemHeight?: number;
    containerHeight?: number;
  } = {}
) => {
  const {
    pageSize = 50,
    enableVirtualization = true,
    itemHeight = 120,
    containerHeight = 600,
  } = options;

  const [currentPage, setCurrentPage] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  /**
   * Calcular itens da página atual
   */
  const paginatedItems = useMemo(() => {
    if (!enableVirtualization) {
      return items.slice(0, (currentPage + 1) * pageSize);
    }
    return items;
  }, [items, currentPage, pageSize, enableVirtualization]);

  /**
   * Calcular itens visíveis para virtualização
   */
  const visibleItems = useMemo(() => {
    if (!enableVirtualization) {
      return paginatedItems;
    }

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    return items.slice(startIndex, endIndex + 1);
  }, [items, scrollTop, itemHeight, containerHeight, enableVirtualization, paginatedItems]);

  /**
   * Carregar próxima página
   */
  const loadNextPage = useCallback(() => {
    if (!enableVirtualization) {
      setCurrentPage(prev => prev + 1);
    }
  }, [enableVirtualization]);

  /**
   * Verificar se há mais itens
   */
  const hasMore = useMemo(() => {
    if (!enableVirtualization) {
      return (currentPage + 1) * pageSize < items.length;
    }
    return true; // Virtualização sempre tem "mais" itens
  }, [items.length, currentPage, pageSize, enableVirtualization]);

  /**
   * Resetar paginação
   */
  const resetPagination = useCallback(() => {
    setCurrentPage(0);
    setScrollTop(0);
  }, []);

  return {
    visibleItems,
    hasMore,
    loadNextPage,
    resetPagination,
    currentPage,
    setScrollTop,
  };
};

export default useDataOptimization;
