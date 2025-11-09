// Query hooks otimizados
export { 
  useOptimizedQuery, 
  useOptimizedSelectQuery, 
  useOptimizedInfiniteQuery, 
  usePrefetch, 
  useInvalidateQueries, 
  useOptimisticUpdate 
} from './useOptimizedQuery';

export { 
  useOptimizedMutation, 
  useOptimisticMutation, 
  useBatchMutation, 
  useRetryableMutation 
} from './useOptimizedMutation';

// Re-export types
export type { 
  QueryOptions, 
  MutationOptions,
  QueryKey, 
  QueryFunction, 
  MutationFunction 
} from '@tanstack/react-query';