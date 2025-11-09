import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';

// Tipos para updates otimistas
export interface OptimisticUpdateConfig<T> {
  queryKey: string[];
  entityId?: string;
  rollbackTimeout?: number;
  enableAutoRollback?: boolean;
  enableNotifications?: boolean;
  validateBeforeUpdate?: (oldData: T, newData: T) => boolean;
  onSuccess?: (data: T, context: OptimisticContext<T>) => void;
  onError?: (error: Error, context: OptimisticContext<T>) => void;
  onRollback?: (context: OptimisticContext<T>) => void;
}

export interface OptimisticContext<T> {
  oldData: T | null;
  newData: T;
  timestamp: number;
  queryKey: string[];
  entityId?: string;
  mutationId: string;
}

export interface RollbackInfo {
  id: string;
  queryKey: string[];
  oldData: any;
  timestamp: number;
  timeout?: NodeJS.Timeout;
}

export interface OptimisticState<T> {
  data: T | null;
  isUpdating: boolean;
  hasPendingUpdate: boolean;
  rollbackInfo: RollbackInfo | null;
  lastUpdate: {
    timestamp: number;
    success: boolean;
    error?: Error;
  } | null;
}

export interface UpdateResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  wasRolledBack?: boolean;
}

export function useOptimisticUpdate<T>(
  key: string,
  updater: (old: T) => T,
  config: OptimisticUpdateConfig<T> = {} as OptimisticUpdateConfig<T>
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    queryKey: configQueryKey,
    entityId,
    rollbackTimeout = 10000, // 10 segundos
    enableAutoRollback = true,
    enableNotifications = true,
    validateBeforeUpdate,
    onSuccess,
    onError,
    onRollback
  } = config;

  // Estados locais
  const [state, setState] = useState<OptimisticState<T>>({
    data: null,
    isUpdating: false,
    hasPendingUpdate: false,
    rollbackInfo: null,
    lastUpdate: null
  });

  // Refs para controle
  const mutationIdRef = useRef<string>('');
  const pendingRollbacksRef = useRef<Map<string, RollbackInfo>>(new Map());
  const queryKeyRef = useRef<string[]>(configQueryKey || [key]);

  // Buscar dados iniciais
  const { data: initialData, isLoading } = useQueryClient().getQueryData(configQueryKey || [key]) !== undefined
    ? { data: queryClient.getQueryData(configQueryKey || [key]) as T, isLoading: false }
    : { data: null, isLoading: true };

  // Efeito para atualizar estado inicial
  useEffect(() => {
    if (initialData !== undefined) {
      setState(prev => ({ ...prev, data: initialData }));
    }
  }, [initialData]);

  // Mutação principal
  const mutation = useMutation({
    mutationFn: async (updateData: { oldData: T; newData: T; mutationId: string }) => {
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Simular erro aleatório para demonstração
      if (Math.random() < 0.1) {
        throw new Error('Erro simulado na atualização');
      }

      return updateData.newData;
    },
    onMutate: async (variables) => {
      const { oldData, newData, mutationId } = variables;
      mutationIdRef.current = mutationId;

      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: queryKeyRef.current });

      // Fazer backup dos dados atuais
      const previousData = queryClient.getQueryData(queryKeyRef.current) as T;

      // Aplicar update otimista
      queryClient.setQueryData(queryKeyRef.current, newData);

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        data: newData,
        isUpdating: true,
        hasPendingUpdate: true,
        rollbackInfo: {
          id: mutationId,
          queryKey: [...queryKeyRef.current],
          oldData: previousData,
          timestamp: Date.now()
        }
      }));

      // Configurar rollback automático se habilitado
      if (enableAutoRollback) {
        const timeout = setTimeout(() => {
          performRollback(mutationId, 'timeout');
        }, rollbackTimeout);

        pendingRollbacksRef.current.set(mutationId, {
          id: mutationId,
          queryKey: [...queryKeyRef.current],
          oldData: previousData,
          timestamp: Date.now(),
          timeout
        });
      }

      return { previousData };
    },
    onSuccess: (data, variables) => {
      const { oldData, newData, mutationId } = variables;

      // Limpar rollback pendente
      clearRollback(mutationId);

      // Atualizar estado
      setState(prev => ({
        ...prev,
        isUpdating: false,
        hasPendingUpdate: false,
        rollbackInfo: null,
        lastUpdate: {
          timestamp: Date.now(),
          success: true
        }
      }));

      // Notificação de sucesso
      if (enableNotifications) {
        toast({
          title: 'Atualização bem-sucedida',
          description: 'As alterações foram salvas com sucesso',
        });
      }

      // Callback de sucesso
      if (onSuccess) {
        onSuccess(data, {
          oldData,
          newData,
          timestamp: Date.now(),
          queryKey: [...queryKeyRef.current],
          entityId,
          mutationId
        });
      }
    },
    onError: (error, variables) => {
      const { oldData, newData, mutationId } = variables;

      // Fazer rollback
      performRollback(mutationId, 'error', error);

      // Atualizar estado
      setState(prev => ({
        ...prev,
        isUpdating: false,
        hasPendingUpdate: false,
        rollbackInfo: null,
        lastUpdate: {
          timestamp: Date.now(),
          success: false,
          error: error as Error
        }
      }));

      // Notificação de erro
      if (enableNotifications) {
        toast({
          title: 'Erro na atualização',
          description: 'As alterações foram revertidas',
          variant: 'destructive'
        });
      }

      // Callback de erro
      if (onError) {
        onError(error as Error, {
          oldData,
          newData,
          timestamp: Date.now(),
          queryKey: [...queryKeyRef.current],
          entityId,
          mutationId
        });
      }
    },
    onSettled: () => {
      // Invalidar queries para garantir sincronização
      queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
    }
  });

  // Função para fazer rollback
  const performRollback = useCallback((
    mutationId: string,
    reason: 'timeout' | 'error' | 'manual',
    error?: Error
  ) => {
    const rollbackInfo = pendingRollbacksRef.current.get(mutationId);
    
    if (!rollbackInfo) return;

    // Restaurar dados anteriores
    queryClient.setQueryData(rollbackInfo.queryKey, rollbackInfo.oldData);

    // Atualizar estado local
    setState(prev => {
      // Só atualizar se o rollback info atual corresponde
      if (prev.rollbackInfo?.id === mutationId) {
        return {
          ...prev,
          data: rollbackInfo.oldData,
          isUpdating: false,
          hasPendingUpdate: false,
          rollbackInfo: null,
          lastUpdate: {
            timestamp: Date.now(),
            success: false,
            error
          }
        };
      }
      return prev;
    });

    // Callback de rollback
    if (onRollback) {
      onRollback({
        oldData: rollbackInfo.oldData,
        newData: state.data || rollbackInfo.oldData,
        timestamp: rollbackInfo.timestamp,
        queryKey: rollbackInfo.queryKey,
        entityId,
        mutationId
      });
    }

    // Limpar rollback
    clearRollback(mutationId);
  }, [onRollback, state.data, entityId]);

  // Função para limpar rollback
  const clearRollback = useCallback((mutationId: string) => {
    const rollbackInfo = pendingRollbacksRef.current.get(mutationId);
    
    if (rollbackInfo?.timeout) {
      clearTimeout(rollbackInfo.timeout);
    }
    
    pendingRollbacksRef.current.delete(mutationId);
  }, []);

  // Função principal de update
  const update = useCallback(async (
    updaterFunction?: (current: T) => T,
    options?: {
      force?: boolean;
      validate?: boolean;
      skipNotifications?: boolean;
    }
  ): Promise<UpdateResult<T>> => {
    const currentData = state.data;
    
    if (!currentData) {
      return {
        success: false,
        error: new Error('Nenhum dado disponível para atualização')
      };
    }

    const finalUpdater = updaterFunction || updater;
    const newData = finalUpdater(currentData);

    // Validação antes do update
    if (options?.validate && validateBeforeUpdate) {
      const isValid = validateBeforeUpdate(currentData, newData);
      if (!isValid) {
        return {
          success: false,
          error: new Error('Dados inválidos para atualização')
        };
      }
    }

    // Forçar update (ignorar estado atual)
    if (options?.force) {
      setState(prev => ({ ...prev, data: newData }));
    }

    const mutationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await mutation.mutateAsync({
        oldData: currentData,
        newData,
        mutationId
      });

      return {
        success: true,
        data: newData
      };
    } catch (error) {
      return {
        success: false,
        data: newData, // Dados otimistas
        error: error as Error,
        wasRolledBack: true
      };
    }
  }, [state.data, updater, validateBeforeUpdate, mutation]);

  // Função para forçar rollback manual
  const rollback = useCallback(() => {
    const currentMutationId = mutationIdRef.current;
    if (currentMutationId) {
      performRollback(currentMutationId, 'manual');
    }
  }, [performRollback]);

  // Função para cancelar update pendente
  const cancelUpdate = useCallback(() => {
    mutation.reset();
    setState(prev => ({
      ...prev,
      isUpdating: false,
      hasPendingUpdate: false,
      rollbackInfo: null
    }));
  }, [mutation]);

  // Função para reverter para dados originais
  const reset = useCallback(() => {
    // Cancelar todos os rollbacks pendentes
    pendingRollbacksRef.current.forEach((rollbackInfo) => {
      if (rollbackInfo.timeout) {
        clearTimeout(rollbackInfo.timeout);
      }
    });
    pendingRollbacksRef.current.clear();

    // Limpar estado
    setState({
      data: initialData,
      isUpdating: false,
      hasPendingUpdate: false,
      rollbackInfo: null,
      lastUpdate: null
    });

    // Restaurar dados no cache
    if (initialData) {
      queryClient.setQueryData(queryKeyRef.current, initialData);
    }
  }, [initialData, queryClient]);

  // Função para obter histórico de updates
  const getUpdateHistory = useCallback(() => {
    return Array.from(pendingRollbacksRef.current.values()).map(info => ({
      id: info.id,
      queryKey: info.queryKey,
      timestamp: new Date(info.timestamp),
      status: info.timeout ? 'pending' : 'completed'
    }));
  }, []);

  // Função para verificar se há updates pendentes
  const hasPendingUpdates = useCallback(() => {
    return pendingRollbacksRef.current.size > 0;
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // Limpar timeouts pendentes
      pendingRollbacksRef.current.forEach((rollbackInfo) => {
        if (rollbackInfo.timeout) {
          clearTimeout(rollbackInfo.timeout);
        }
      });
    };
  }, []);

  return {
    // Estado
    data: state.data,
    isUpdating: state.isUpdating,
    hasPendingUpdate: state.hasPendingUpdate,
    rollbackInfo: state.rollbackInfo,
    lastUpdate: state.lastUpdate,
    isLoading,

    // Ações
    update,
    rollback,
    cancelUpdate,
    reset,

    // Utilitários
    hasPendingUpdates: hasPendingUpdates(),
    getUpdateHistory,
    canRollback: state.rollbackInfo !== null,
    isStale: state.lastUpdate ? (Date.now() - state.lastUpdate.timestamp > 300000) : true, // 5 minutos

    // Configuração
    setQueryKey: (newKey: string[]) => {
      queryKeyRef.current = newKey;
    },
    updateConfig: (newConfig: Partial<OptimisticUpdateConfig<T>>) => {
      Object.assign(config, newConfig);
    }
  };
}

// Hook especializado para arrays
export function useOptimisticArrayUpdate<T extends { id: string }>(
  key: string,
  config: OptimisticUpdateConfig<T[]> & { itemId?: string } = {} as OptimisticUpdateConfig<T[]>
) {
  const baseConfig = { ...config };
  const { itemId } = baseConfig;
  delete (baseConfig as any).itemId;

  const optimisticUpdate = useOptimisticUpdate<T[]>(key, (oldArray) => {
    // Implementar lógica específica para arrays
    return oldArray;
  }, baseConfig);

  // Funções específicas para arrays
  const addItem = useCallback(async (item: T) => {
    return await optimisticUpdate.update((currentArray) => {
      return [...(currentArray || []), item];
    });
  }, [optimisticUpdate]);

  const updateItem = useCallback(async (id: string, updater: (item: T) => T) => {
    return await optimisticUpdate.update((currentArray) => {
      return (currentArray || []).map(item => 
        item.id === id ? updater(item) : item
      );
    });
  }, [optimisticUpdate]);

  const removeItem = useCallback(async (id: string) => {
    return await optimisticUpdate.update((currentArray) => {
      return (currentArray || []).filter(item => item.id !== id);
    });
  }, [optimisticUpdate]);

  const replaceItem = useCallback(async (id: string, newItem: T) => {
    return await optimisticUpdate.update((currentArray) => {
      return (currentArray || []).map(item => 
        item.id === id ? newItem : item
      );
    });
  }, [optimisticUpdate]);

  return {
    ...optimisticUpdate,
    // Funções específicas para arrays
    addItem,
    updateItem,
    removeItem,
    replaceItem,
    
    // Utilitários para arrays
    findItem: (id: string) => optimisticUpdate.data?.find(item => item.id === id),
    getItemCount: () => optimisticUpdate.data?.length || 0,
    hasItem: (id: string) => !!optimisticUpdate.data?.find(item => item.id === id)
  };
}

// Hook para updates em lote
export function useBatchOptimisticUpdate<T>(
  keys: string[],
  config: OptimisticUpdateConfig<T> = {} as OptimisticUpdateConfig<T>
) {
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [batchResults, setBatchResults] = useState<Record<string, UpdateResult<T>>>({});
  const { toast } = useToast();

  const updateOperations = keys.map(key => {
    return useOptimisticUpdate(key, (old: T) => old, config);
  });

  const batchUpdate = useCallback(async (
    updater: (key: string, current: T) => T
  ) => {
    setIsBatchUpdating(true);
    const results: Record<string, UpdateResult<T>> = {};

    try {
      const promises = updateOperations.map(async (operation, index) => {
        const key = keys[index];
        try {
          const result = await operation.update((current) => updater(key, current));
          results[key] = result;
          return { key, success: result.success };
        } catch (error) {
          results[key] = {
            success: false,
            error: error as Error
          };
          return { key, success: false };
        }
      });

      const results_array = await Promise.all(promises);
      const successCount = results_array.filter(r => r.success).length;
      const totalCount = results_array.length;

      if (successCount === totalCount) {
        toast({
          title: 'Atualizações concluídas',
          description: `${successCount} de ${totalCount} atualizações foram bem-sucedidas`,
        });
      } else {
        toast({
          title: 'Algumas atualizações falharam',
          description: `${successCount} de ${totalCount} atualizações foram bem-sucedidas`,
          variant: 'destructive'
        });
      }

      setBatchResults(results);
      return results;
    } finally {
      setIsBatchUpdating(false);
    }
  }, [updateOperations, keys, toast]);

  return {
    operations: updateOperations,
    isBatchUpdating,
    batchResults,
    batchUpdate
  };
}