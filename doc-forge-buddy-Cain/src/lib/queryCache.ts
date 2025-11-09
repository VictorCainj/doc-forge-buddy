import { QueryCache } from '@tanstack/react-query';
import { queryMonitor } from './queryMonitor';

// QueryCache com monitoramento e estratégias de cache inteligentes
export const queryCache = new QueryCache({
  onError: (error, query) => {
    // Log de erros para monitoramento
    queryMonitor.logError(error, query);
  },
  onSuccess: (data, query) => {
    // Log de sucesso para análise de performance
    queryMonitor.logSuccess(data, query);
  }
});

// Configurar tamanhos de cache por tipo de query
export const cacheStrategies = {
  // Cache de curta duração para dados em tempo real
  realtime: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  },
  
  // Cache de média duração para dados que mudam ocasionalmente
  medium: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  },
  
  // Cache de longa duração para dados estáticos
  long: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
  },
  
  // Cache persistente para dados importantes
  persistent: {
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
  }
};

// Configurações por entidade
export const entityCacheConfig = {
  contracts: {
    ...cacheStrategies.medium,
    priority: 'high' as const,
    refetchOnMount: 'always',
  },
  
  users: {
    ...cacheStrategies.medium,
    priority: 'high' as const,
    refetchOnMount: false,
  },
  
  vistorias: {
    ...cacheStrategies.medium,
    priority: 'medium' as const,
    refetchOnMount: 'always',
  },
  
  prestadores: {
    ...cacheStrategies.long,
    priority: 'medium' as const,
    refetchOnMount: false,
  },
  
  analytics: {
    ...cacheStrategies.realtime,
    priority: 'low' as const,
    refetchOnMount: false,
  }
};

// Utilitários para cache management
export const cacheManager = {
  // Limpar cache por entidade
  clearEntityCache: (entity: keyof typeof entityCacheConfig) => {
    queryCache.clear();
    queryMonitor.logEvent('cache_cleared', { entity });
  },
  
  // Manter apenas queries críticas
  keepOnlyCritical: () => {
    const queryKeys = queryCache.getAll().map(query => query.queryKey);
    const criticalKeys = queryKeys.filter(key => 
      key.some(k => typeof k === 'string' && (k.includes('user') || k.includes('auth')))
    );
    
    criticalKeys.forEach(key => {
      const query = queryCache.build(key, {});
      if (query) {
        query.setState({ data: query.getObserversCount() > 0 ? query.getData() : undefined });
      }
    });
  },
  
  // Obter estatísticas de cache
  getStats: () => {
    const allQueries = queryCache.getAll();
    return {
      totalQueries: allQueries.length,
      activeQueries: allQueries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: allQueries.filter(q => q.isStale()).length,
      errorQueries: allQueries.filter(q => q.getError()).length,
    };
  }
};