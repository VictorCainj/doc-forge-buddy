import { QueryClient } from '@tanstack/react-query';
import { queryCache } from './queryCache';
import { errorHandler } from './errorHandler';
import { getQueryConfig } from './queryConfig';

const queryConfig = getQueryConfig();

// QueryClient otimizado com configurações por ambiente
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuração de cache otimizada para produção
      staleTime: queryConfig.staleTime,
      gcTime: queryConfig.gcTime, // Renomeado de cacheTime na v5
      
      // Estratégia de retry inteligente
      retry: queryConfig.retry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch strategies otimizadas
      refetchOnWindowFocus: queryConfig.refetchOnWindowFocus,
      refetchOnReconnect: queryConfig.refetchOnReconnect,
      refetchInterval: queryConfig.refetchInterval,
      refetchIntervalInBackground: queryConfig.refetchIntervalInBackground,
      
      // Performance optimizations
      networkMode: queryConfig.networkMode,
      meta: {
        // Adicionar metadados para debugging
        createdAt: new Date().toISOString(),
        cacheKey: 'default'
      }
    },
    mutations: {
      // Configurações de mutação otimizadas
      retry: queryConfig.mutationRetry,
      
      // Error handling centralizado
      onError: errorHandler.handleMutationError,
      
      // Meta informações para mutações
      meta: {
        createdAt: new Date().toISOString(),
        mutationType: 'default'
      }
    }
  }
});

// Configurar interceptors globais
queryClient.setDefaultOptions({
  queries: {
    ...queryConfig,
    onError: errorHandler.handleQueryError
  }
});

// QueryCache otimizado
queryClient.setQueryCache(queryCache);

// Expor métodos utilitários
export const queryUtils = {
  // Invalidar queries por padrão
  invalidateQueries: queryClient.invalidateQueries.bind(queryClient),
  
  // Refetch queries
  refetchQueries: queryClient.refetchQueries.bind(queryClient),
  
  // Remover queries
  removeQueries: queryClient.removeQueries.bind(queryClient),
  
  // Prefetch queries
  prefetchQuery: queryClient.prefetchQuery.bind(queryClient),
  
  // Get query data
  getQueryData: queryClient.getQueryData.bind(queryClient),
  
  // Set query data
  setQueryData: queryClient.setQueryData.bind(queryClient),
  
  // Get queries
  getQueriesData: queryClient.getQueriesData.bind(queryClient),
  
  // Limpar cache
  clear: queryClient.clear.bind(queryClient)
};