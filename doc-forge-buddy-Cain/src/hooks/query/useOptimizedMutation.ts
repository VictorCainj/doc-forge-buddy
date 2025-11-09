import { useMutation, useQueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryMonitor } from '@/lib/queryMonitor';
import { errorHandler } from '@/lib/errorHandler';

// Configurações de mutation
export interface MutationConfig {
  retry?: number;
  onError?: (error: any, variables: any, context: any) => void;
  onSuccess?: (data: any, variables: any, context: any) => void;
  onSettled?: (data: any | undefined, error: any, variables: any, context: any) => void;
  meta?: Record<string, any>;
}

// Hook base otimizado para mutations
export function useOptimizedMutation<TData, TError = Error, TVariables = void, TContext = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config?: Partial<MutationConfig>
): UseMutationResult<TData, TError, TVariables, TContext> & {
  mutate: (variables: TVariables, options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>) => void;
  mutateAsync: (variables: TVariables, options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>) => Promise<TData>;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    // Configurações otimizadas
    retry: config?.retry ?? 1,
    
    // Error handling centralizado
    onError: (error, variables, context) => {
      errorHandler.handleMutationError(error, variables, context);
      config?.onError?.(error, variables, context);
    },

    onSuccess: (data, variables, context) => {
      // Log para monitoramento
      queryMonitor.logEvent('mutation_success', {
        dataSize: JSON.stringify(data).length,
        timestamp: new Date()
      });
      
      config?.onSuccess?.(data, variables, context);
    },

    onSettled: (data, error, variables, context) => {
      // Always invalidate related queries
      if (data) {
        invalidateRelatedQueries(queryClient, variables);
      }
      
      config?.onSettled?.(data, error, variables, context);
    },

    // Meta informações para tracking
    meta: {
      ...config?.meta,
      timestamp: new Date().toISOString(),
    }
  });

  return {
    ...mutation,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
  };
}

// Hook para mutations com optimistic updates
export function useOptimisticMutation<TData, TError = Error, TVariables = void, TContext = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  optimisticFn: (variables: TVariables, currentData: any) => any,
  queryKeyToUpdate: string | readonly unknown[],
  config?: Partial<MutationConfig>
): UseMutationResult<TData, TError, TVariables, TContext> & {
  mutate: (variables: TVariables, options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>) => void;
  mutateAsync: (variables: TVariables, options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>) => Promise<TData>;
  updateOptimistically: (variables: TVariables) => void;
} {
  const queryClient = useQueryClient();

  const mutation = useOptimizedMutation(mutationFn, {
    ...config,
    meta: { ...config?.meta, type: 'optimistic' }
  });

  const updateOptimistically = useCallback((variables: TVariables) => {
    const currentData = queryClient.getQueryData(Array.isArray(queryKeyToUpdate) ? queryKeyToUpdate : [queryKeyToUpdate]);
    
    if (currentData) {
      const optimisticData = optimisticFn(variables, currentData);
      
      queryClient.setQueryData(
        Array.isArray(queryKeyToUpdate) ? queryKeyToUpdate : [queryKeyToUpdate],
        optimisticData
      );
      
      queryMonitor.logEvent('optimistic_update_applied', {
        queryKey: queryKeyToUpdate,
        variables
      });
    }
  }, [queryClient, queryKeyToUpdate, optimisticFn]);

  // Override mutate para incluir optimistic update
  const mutateWithOptimistic = useCallback((variables: TVariables, options?: any) => {
    // Aplicar update otimista antes da mutation
    updateOptimistically(variables);
    
    // Executar mutation
    mutation.mutate(variables, {
      ...options,
      onError: (error, context) => {
        // Reverter optimistic update em caso de erro
        queryClient.invalidateQueries({
          queryKey: Array.isArray(queryKeyToUpdate) ? queryKeyToUpdate : [queryKeyToUpdate]
        });
        
        options?.onError?.(error, context);
      }
    });
  }, [mutation, updateOptimistically, queryClient, queryKeyToUpdate, options]);

  return {
    ...mutation,
    mutate: mutateWithOptimistic,
    mutateAsync: mutation.mutateAsync,
    updateOptimistically,
  };
}

// Hook para mutations em lote
export function useBatchMutation() {
  const queryClient = useQueryClient();

  const executeBatch = useCallback(async <TData>(
    mutations: Array<{
      key: string | readonly unknown[];
      mutationFn: () => Promise<TData>;
      optimisticUpdate?: (currentData: any) => any;
    }>
  ) => {
    const results = [];
    const errors = [];

    // Aplicar optimistic updates primeiro
    mutations.forEach(({ key, optimisticUpdate }) => {
      if (optimisticUpdate) {
        const currentData = queryClient.getQueryData(Array.isArray(key) ? key : [key]);
        if (currentData) {
          queryClient.setQueryData(
            Array.isArray(key) ? key : [key],
            optimisticUpdate(currentData)
          );
        }
      }
    });

    // Executar todas as mutations
    for (const { key, mutationFn } of mutations) {
      try {
        const result = await mutationFn();
        results.push({ key, result });
        
        // Invalidar queries relacionadas
        await queryClient.invalidateQueries({
          queryKey: Array.isArray(key) ? key : [key]
        });
      } catch (error) {
        errors.push({ key, error });
        
        // Em caso de erro, invalidar cache para forçar re-sync
        await queryClient.invalidateQueries({
          queryKey: Array.isArray(key) ? key : [key]
        });
      }
    }

    queryMonitor.logEvent('batch_mutation_completed', {
      total: mutations.length,
      success: results.length,
      errors: errors.length
    });

    return { results, errors };
  }, [queryClient]);

  return { executeBatch };
}

// Utilitários para invalidation
function invalidateRelatedQueries(queryClient: any, variables: any) {
  // Lógica para determinar quais queries invalidar baseado no tipo de variáveis
  const patterns = determineInvalidationPatterns(variables);
  
  patterns.forEach(pattern => {
    queryClient.invalidateQueries({
      queryKey: [pattern],
      exact: false,
    });
  });
}

function determineInvalidationPatterns(variables: any): string[] {
  const patterns: string[] = [];
  
  if (variables.contractId) {
    patterns.push('contracts', 'contract-bills', 'vistorias');
  }
  
  if (variables.userId) {
    patterns.push('users', 'user-contracts');
  }
  
  if (variables.vistoriaId) {
    patterns.push('vistorias', 'vistoria-analytics');
  }
  
  // Sempre invalidar dados que dependem do user atual
  patterns.push('user', 'dashboard', 'analytics');
  
  return patterns;
}

// Hook para mutations com retry customizado
export function useRetryableMutation<TData, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config?: {
    maxRetries?: number;
    retryDelay?: (attempt: number) => number;
    shouldRetry?: (error: TError, attempt: number) => boolean;
  }
) {
  const { maxRetries = 3, retryDelay, shouldRetry } = config || {};

  return useOptimizedMutation(mutationFn, {
    retry: (failureCount, error) => {
      if (failureCount >= maxRetries) return false;
      
      if (shouldRetry) {
        return shouldRetry(error, failureCount);
      }
      
      return true;
    },
    
    retryDelay: (attemptIndex) => {
      if (retryDelay) {
        return retryDelay(attemptIndex);
      }
      
      // Backoff exponencial padrão
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
    
    meta: {
      type: 'retryable',
      maxRetries,
    }
  });
}