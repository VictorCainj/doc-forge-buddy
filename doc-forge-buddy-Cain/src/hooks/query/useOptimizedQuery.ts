import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { entityCacheConfig, cacheStrategies } from '../lib/queryCache';
import { queryUtils } from '../lib/queryClient';
import { queryMonitor } from '../lib/queryMonitor';

// Hook base otimizado para useQuery
export function useOptimizedQuery<TData, TError = Error>(
  queryKey: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Partial<UseQueryOptions<TData, TError>>
): UseQueryResult<TData, TError> & { 
  refetch: () => Promise<UseQueryResult<TData, TError>>;
  clearCache: () => void;
  prefetch: () => Promise<void>;
  isStale: boolean;
} {

  // Determinar configuração de cache baseada no queryKey
  const cacheConfig = useMemo(() => {
    if (typeof queryKey === 'string') {
      const key = queryKey.toLowerCase();
      if (key.includes('contract')) return entityCacheConfig.contracts;
      if (key.includes('user')) return entityCacheConfig.users;
      if (key.includes('vistoria')) return entityCacheConfig.vistorias;
      if (key.includes('prestador')) return entityCacheConfig.prestadores;
      if (key.includes('analytic')) return entityCacheConfig.analytics;
    }
    return cacheStrategies.medium;
  }, [queryKey]);

  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    ...cacheConfig,
    // Overrides das opções fornecidas
    ...options,
    // Configurações sempre ativadas
    refetchOnMount: options?.refetchOnMount ?? cacheConfig.refetchOnMount,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? cacheConfig.refetchOnWindowFocus,
  });

  // Utilitários adicionais
  const refetch = useCallback(() => {
    return queryClient.refetchQueries({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      exact: true,
    });
  }, [queryClient, queryKey]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      exact: true,
    });
  }, [queryClient, queryKey]);

  const prefetch = useCallback(async () => {
    if (!queryClient.getQueryData(Array.isArray(queryKey) ? queryKey : [queryKey])) {
      await queryClient.prefetchQuery({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        queryFn,
        staleTime: cacheConfig.staleTime,
      });
    }
  }, [queryClient, queryKey, queryFn, cacheConfig.staleTime]);

  // Log do estado da query para monitoramento
  useMemo(() => {
    queryMonitor.logEvent('query_state_change', {
      queryKey,
      isSuccess: result.isSuccess,
      isError: result.isError,
      isLoading: result.isLoading,
      isStale: result.isStale,
    });
  }, [queryKey, result.isSuccess, result.isError, result.isLoading, result.isStale]);

  return {
    ...result,
    refetch,
    clearCache,
    prefetch,
    isStale: result.isStale,
  };
}

// Hook especializado para queries com seleção de dados
export function useOptimizedSelectQuery<TData, TSelected, TError = Error>(
  queryKey: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  select: (data: TData) => TSelected,
  options?: Partial<UseQueryOptions<TSelected, TError, TSelected, TData>>
): UseQueryResult<TSelected, TError> & {
  refetch: () => Promise<UseQueryResult<TSelected, TError>>;
  clearCache: () => void;
  prefetch: () => Promise<void>;
  originalData: TData | undefined;
} {

  const queryClient = useQueryClient();
  const cacheConfig = useMemo(() => {
    if (typeof queryKey === 'string') {
      const key = queryKey.toLowerCase();
      if (key.includes('contract')) return entityCacheConfig.contracts;
      if (key.includes('user')) return entityCacheConfig.users;
    }
    return cacheStrategies.medium;
  }, [queryKey]);

  const result = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    select,
    ...cacheConfig,
    ...options,
  });

  const originalData = queryClient.getQueryData(Array.isArray(queryKey) ? queryKey : [queryKey]);

  const refetch = useCallback(() => {
    return queryClient.refetchQueries({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      exact: true,
    });
  }, [queryClient, queryKey]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      exact: true,
    });
  }, [queryClient, queryKey]);

  const prefetch = useCallback(async () => {
    if (!queryClient.getQueryData(Array.isArray(queryKey) ? queryKey : [queryKey])) {
      await queryClient.prefetchQuery({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        queryFn,
        staleTime: cacheConfig.staleTime,
      });
    }
  }, [queryClient, queryKey, queryFn, cacheConfig.staleTime]);

  return {
    ...result,
    refetch,
    clearCache,
    prefetch,
    originalData,
  };
}

// Hook para queries de lista com paginação
export function useOptimizedInfiniteQuery<TData, TError = Error>(
  queryKey: string | readonly unknown[],
  queryFn: (params: { pageParam?: unknown }) => Promise<TData>,
  options?: Parameters<typeof useQuery<TData, TError>>[2] & {
    getNextPageParam?: (lastPage: TData, allPages: TData[]) => unknown;
    getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => unknown;
    initialPageParam?: unknown;
  }
) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    ...options,
    // Configurações otimizadas para listas
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  } as any);
}

// Hook para prefetching inteligente
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchQuery = useCallback(async (
    queryKey: string | readonly unknown[],
    queryFn: () => Promise<any>,
    options?: {
      staleTime?: number;
      priority?: 'high' | 'normal' | 'low';
    }
  ) => {
    const existingData = queryClient.getQueryData(Array.isArray(queryKey) ? queryKey : [queryKey]);
    
    if (!existingData) {
      await queryClient.prefetchQuery({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        queryFn,
        staleTime: options?.staleTime ?? 5 * 60 * 1000,
      });
      
      queryMonitor.logEvent('query_prefetched', { queryKey });
    }
  }, [queryClient]);

  const prefetchOnHover = useCallback((
    queryKey: string | readonly unknown[],
    queryFn: () => Promise<any>
  ) => {
    return () => {
      if (navigator.onLine) {
        prefetchQuery(queryKey, queryFn, { priority: 'high' });
      }
    };
  }, [prefetchQuery]);

  return { prefetchQuery, prefetchOnHover };
}

// Hook para invalidation inteligente
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidateByPattern = useCallback(async (pattern: RegExp) => {
    const queryKeys = queryClient.getQueryCache()
      .getAll()
      .map(query => query.queryKey);
    
    const matchingKeys = queryKeys.filter(key => 
      key.some(k => typeof k === 'string' && pattern.test(k))
    );
    
    if (matchingKeys.length > 0) {
      await queryClient.invalidateQueries({
        queryKey: matchingKeys,
        exact: true,
      });
      
      queryMonitor.logEvent('queries_invalidated', { 
        pattern: pattern.source, 
        count: matchingKeys.length 
      });
    }
  }, [queryClient]);

  const invalidateEntity = useCallback(async (entity: string) => {
    await queryClient.invalidateQueries({
      queryKey: [entity],
      predicate: (query) => {
        return query.queryKey.some(key => 
          typeof key === 'string' && key.toLowerCase().includes(entity.toLowerCase())
        );
      },
    });
    
    queryMonitor.logEvent('entity_invalidated', { entity });
  }, [queryClient]);

  return { invalidateByPattern, invalidateEntity };
}

// Hook para optimistic updates
export function useOptimisticUpdate<TData>() {
  const queryClient = useQueryClient();

  const updateOptimistically = useCallback((
    queryKey: string | readonly unknown[],
    updater: (oldData: TData) => TData
  ) => {
    return queryClient.setQueryData(
      Array.isArray(queryKey) ? queryKey : [queryKey],
      (oldData: TData | undefined) => {
        if (oldData) {
          queryMonitor.logEvent('optimistic_update_applied', { queryKey });
          return updater(oldData);
        }
        return oldData;
      }
    );
  }, [queryClient]);

  return { updateOptimistically };
}