// Export principal do sistema de otimização Supabase
export { supabase } from './client';
export type { Database } from './types';

// Query Builder otimizado
export {
  SupabaseQueryBuilder,
  SupabaseQueryError,
  type QueryBuilderConfig,
  type QueryOptimization,
  createQueryBuilder
} from './query-builder';

// Cache Manager
export {
  CacheManager,
  getCacheManager,
  type CacheStrategy,
  type CacheEntry,
  type CacheConfig
} from './cache/cache-manager';

// Cache implementations
export {
  MemoryCache
} from './cache/memory-cache';

export {
  RedisCache
} from './cache/redis-cache';

export {
  LocalStorageCache
} from './cache/local-storage-cache';

// Performance Optimizer
export {
  QueryOptimizer,
  type QueryOptimization as OptimizationConfig
} from './performance/query-optimizer';

// Batch Operations
export {
  BatchOperationsManager,
  getBatchManager,
  useBatchOperations,
  type BatchOperation,
  type BatchOptions,
  type BatchResult,
  type BatchProgress,
  type TransactionOperation
} from './operations/batch-operations';

// Analytics e Monitoring
export {
  QueryAnalytics,
  type QueryMetrics,
  type SlowQuery,
  type QueryPerformanceStats,
  type QueryOptimization as QueryOptSuggestion
} from './monitoring/query-analytics';

export {
  CacheAnalytics,
  type CacheMetrics,
  type CacheStats,
  type CacheAlert,
  type CacheOptimization as CacheOptSuggestion
} from './monitoring/cache-analytics';

// Integração com React Query existente
import { queryClient } from '@/lib/queryClient';
import { supabase } from './client';
import { SupabaseQueryBuilder } from './query-builder';
import { getCacheManager } from './cache/cache-manager';
import { getBatchManager } from './operations/batch-operations';
// import { QueryAnalytics } from './monitoring/query-analytics';

// Hook personalizado para usar o sistema otimizado
export const useOptimizedSupabase = () => {
  return {
    // Query Builder
    createQuery: (table: string, config?: any) => new SupabaseQueryBuilder(table, config),
    
    // Cache Manager
    cache: getCacheManager(),
    
    // Batch Operations
    batch: getBatchManager(),
    
    // Analytics (temporariamente desativado)
    // analytics: new QueryAnalytics(),
    
    // React Query Integration
    queryClient,
    
    // Supabase client
    supabase,
    
    // Utilitários
    utils: {
      // Query helpers
      select: (table: string, columns?: string[]) => new SupabaseQueryBuilder(table).select(columns || '*'),
      
      // Cache helpers
      clearCache: (pattern?: string) => getCacheManager().clear(pattern),
      getCacheStats: (strategy?: string) => getCacheManager().getStats(strategy),
      
      // Batch helpers
      batchInsert: (table: string, data: any[]) => getBatchManager().batchInsert(table, data),
      batchUpdate: (table: string, data: any[], where: any[]) => getBatchManager().batchUpdate(table, data, where),
      batchDelete: (table: string, where: any[]) => getBatchManager().batchDelete(table, where),
      
      // Analytics helpers (temporariamente desativado)
      // getPerformanceStats: (timeRange?: { start: number; end: number }) => {
      //   const analytics = new QueryAnalytics();
      //   return analytics.getPerformanceStats(timeRange || {
      //     start: Date.now() - (24 * 60 * 60 * 1000),
      //     end: Date.now()
        });
      },
      
      getCacheDashboard: () => {
        const cacheAnalytics = new (require('./monitoring/cache-analytics').CacheAnalytics)();
        return cacheAnalytics.getCacheDashboard();
      }
    }
  };
};

// Exemplo de uso
export const supabaseOptimizationExamples = {
  // Exemplo 1: Query simples otimizada
  exampleSimpleQuery: async () => {
    const { createQuery } = useOptimizedSupabase();
    
    // Usando query builder otimizado com cache
    const contracts = await createQuery('contracts')
      .select(['id', 'status', 'user_id', 'created_at'])
      .eq('status', 'active')
      .order('created_at', false)
      .limit(10)
      .withCache('hybrid')
      .withAnalytics(true)
      .execute();
    
    return contracts;
  },

  // Exemplo 2: Query complexa com JOIN
  exampleComplexQuery: async () => {
    const { createQuery } = useOptimizedSupabase();
    
    const vistorias = await createQuery('vistorias')
      .select(['id', 'status', 'contract_id', 'created_at'])
      .join('contracts', 'vistorias.contract_id = contracts.id', 'inner')
      .eq('contracts.status', 'active')
      .eq('vistorias.status', 'pending')
      .order('vistorias.created_at', false)
      .paginate(1, 20)
      .withCache('memory')
      .execute();
    
    return vistorias;
  },

  // Exemplo 3: Batch operations
  exampleBatchOperations: async () => {
    const { batch } = useOptimizedSupabase();
    
    // Inserir múltiplos contratos
    const insertOperation = await batch.batchInsert('contracts', [
      { user_id: '123', status: 'active', title: 'Contrato 1' },
      { user_id: '456', status: 'active', title: 'Contrato 2' },
      { user_id: '789', status: 'active', title: 'Contrato 3' }
    ], {
      chunkSize: 100,
      useTransaction: true,
      clearCache: true
    });
    
    // Aguardar conclusão
    while (insertOperation.status === 'running') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return insertOperation;
  },

  // Exemplo 4: Transação complexa
  exampleTransaction: async () => {
    const { batch } = useOptimizedSupabase();
    
    const result = await batch.executeTransaction([
      {
        type: 'insert',
        table: 'contracts',
        data: { user_id: '123', status: 'active', title: 'Novo Contrato' }
      },
      {
        type: 'update',
        table: 'users',
        data: { contract_count: 1 },
        where: { id: '123' }
      }
    ], {
      useTransaction: true
    });
    
    return result;
  },

  // Exemplo 5: Cache warming
  exampleCacheWarming: async () => {
    const { cache } = useOptimizedSupabase();
    
    await cache.warmup([
      {
        key: 'user:dashboard:123',
        query: async () => {
          // Simular query do dashboard do usuário
          return {
            totalContracts: 10,
            pendingVistorias: 3,
            recentActivity: []
          };
        }
      },
      {
        key: 'contracts:user:123',
        query: async () => {
          // Simular query de contratos do usuário
          return [];
        }
      }
    ]);
  },

  // Exemplo 6: Analytics e monitoring
  exampleAnalytics: async () => {
    const { utils } = useOptimizedSupabase();
    
    // Obter estatísticas de performance
    const perfStats = utils.getPerformanceStats({
      start: Date.now() - (2 * 60 * 60 * 1000), // 2 horas atrás
      end: Date.now()
    });
    
    // Obter dashboard de cache
    const cacheDashboard = utils.getCacheDashboard();
    
    // Detectar queries lentas
    const slowQueries = perfStats.slowestQueries;
    
    return {
      performance: perfStats,
      cache: cacheDashboard,
      slowQueries
    };
  },

  // Exemplo 7: Integração com React Query
  exampleReactQueryIntegration: () => {
    const { queryClient, createQuery } = useOptimizedSupabase();
    
    // Query otimizada com React Query
    return queryClient.fetchQuery({
      queryKey: ['contracts', 'active', 1, 20],
      queryFn: async () => {
        return await createQuery('contracts')
          .select(['id', 'status', 'title'])
          .eq('status', 'active')
          .paginate(1, 20)
          .execute();
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000 // 10 minutos
    });
  }
};

// Configuração global
export const supabaseOptimizationConfig = {
  // Configurações de cache
  cache: {
    defaultStrategy: 'hybrid' as const,
    ttl: 5 * 60 * 1000, // 5 minutos
    maxSize: {
      memory: 500 * 1024 * 1024, // 500MB
      redis: 1024 * 1024 * 1024, // 1GB
      localStorage: 50 * 1024 * 1024 // 50MB
    }
  },
  
  // Configurações de batch
  batch: {
    defaultChunkSize: 100,
    maxParallelOperations: 5,
    defaultRetryAttempts: 3,
    useTransactions: true
  },
  
  // Configurações de analytics
  analytics: {
    enableSlowQueryDetection: true,
    slowQueryThreshold: 1000, // 1 segundo
    maxMetricsHistory: 10000,
    alertThresholds: {
      hitRate: 0.7,
      errorRate: 0.05,
      responseTime: 500 // ms
    }
  },
  
  // Configurações de performance
  performance: {
    enableQueryOptimization: true,
    forceIndexUsage: true,
    preferKeysetPagination: true,
    optimizeJoins: true
  }
};

// Utilitários de configuração
export const configureSupabaseOptimization = (config: Partial<typeof supabaseOptimizationConfig>) => {
  // Implementar configuração dinâmica
  Object.assign(supabaseOptimizationConfig, config);
  
  console.log('Supabase Optimization configurado:', supabaseOptimizationConfig);
};

// Reset configurações
export const resetSupabaseOptimization = () => {
  // Limpar caches
  getCacheManager().clear();
  
  // Reset analytics
  // Implementar reset dos analytics
  
  console.log('Supabase Optimization resetado');
};

// Export hooks para componentes React
export { useOptimizedSupabase as useSupabaseOptimized };