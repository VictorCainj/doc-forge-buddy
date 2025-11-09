import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { log } from '@/utils/logger';
import { useLocalStorage } from './useLocalStorage';
import { useDebounce } from './useDebounce';

export interface QueryOptions<T = unknown> {
  table: string;
  columns?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  search?: {
    columns: string[];
    query: string;
  };
  cacheTime?: number;
  staleTime?: number;
  enabled?: boolean;
  // Adicionar suporte para operadores customizados
  filterOperators?: {
    [key: string]: {
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains';
      value: unknown;
    };
  };
}

export interface MutationOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  optimistic?: boolean;
}

export interface UseAPIReturn {
  // Query methods
  query: <T = unknown>(options: QueryOptions<T>) => {
    data: T[] | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  };
  
  querySingle: <T = unknown>(options: QueryOptions<T> & { id: string }) => {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  };
  
  // Mutation methods
  create: <T = unknown>(options: {
    table: string;
    data: Record<string, unknown>;
    options?: MutationOptions<T>;
  }) => Promise<T>;
  
  update: <T = unknown>(options: {
    table: string;
    id: string;
    data: Record<string, unknown>;
    options?: MutationOptions<T>;
  }) => Promise<T>;
  
  delete: (options: {
    table: string;
    id: string;
    options?: MutationOptions<void>;
  }) => Promise<void>;
  
  upsert: <T = unknown>(options: {
    table: string;
    data: Record<string, unknown>;
    onConflict?: string;
    options?: MutationOptions<T>;
  }) => Promise<T>;
  
  // Utilities
  search: <T = unknown>(options: {
    table: string;
    columns: string[];
    query: string;
    limit?: number;
  }) => Promise<T[]>;
  
  count: (options: {
    table: string;
    filters?: Record<string, unknown>;
  }) => Promise<number>;
  
  bulkInsert: <T = unknown>(options: {
    table: string;
    data: Record<string, unknown>[];
    options?: MutationOptions<T[]>;
  }) => Promise<T[]>;
  
  bulkUpdate: <T = unknown>(options: {
    table: string;
    updates: Array<{ id: string; data: Record<string, unknown> }>;
    options?: MutationOptions<T[]>;
  }) => Promise<T[]>;
  
  bulkDelete: (options: {
    table: string;
    ids: string[];
    options?: MutationOptions<void>;
  }) => Promise<void>;
}

/**
 * Hook consolidado para operações de API/Database
 * Unifica operações comuns de Supabase com cache, otimização e error handling
 */
export const useAPI = (): UseAPIReturn => {
  const queryClient = useQueryClient();
  const [apiCache, setApiCache] = useLocalStorage<Record<string, any>>('api-cache', {});
  const [lastApiSync, setLastApiSync] = useLocalStorage<number>('api-last-sync', 0);

  // Request deduplication
  const pendingRequests = useRef<Map<string, Promise<any>>>(new Map());

  // Query builder
  const buildQuery = useCallback((options: QueryOptions) => {
    let query = supabase
      .from(options.table)
      .select(options.columns || '*', { count: 'exact' });

    // Aplicar filtros
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value.operator) {
            // Operadores customizados como gte, lte, etc.
            const { operator, value: opValue } = value as any;
            query = query[operator](key, opValue);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    // Aplicar busca
    if (options.search) {
      const { columns, query: searchQuery } = options.search;
      const searchConditions = columns.map(col => `${col}.ilike.%${searchQuery}%`).join(',');
      query = query.or(searchConditions);
    }

    // Aplicar ordenação
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? false 
      });
    }

    // Aplicar paginação
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    return query;
  }, []);

  // Query method
  const query = useCallback(<T = any>(options: QueryOptions) => {
    const cacheKey = JSON.stringify({
      table: options.table,
      filters: options.filters,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
      search: options.search,
    });

    return useQuery({
      queryKey: ['api', cacheKey],
      queryFn: async () => {
        // Request deduplication
        if (pendingRequests.current.has(cacheKey)) {
          return pendingRequests.current.get(cacheKey);
        }

        const requestPromise = (async () => {
          const { data, error, count } = await buildQuery(options);
          if (error) throw error;
          return { data, count };
        })();

        pendingRequests.current.set(cacheKey, requestPromise);

        try {
          const result = await requestPromise;
          pendingRequests.current.delete(cacheKey);
          return result;
        } catch (error) {
          pendingRequests.current.delete(cacheKey);
          throw error;
        }
      },
      staleTime: options.staleTime || 5 * 60 * 1000,
      gcTime: options.cacheTime || 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: options.enabled !== false,
    });
  }, [buildQuery]);

  // Query single method
  const querySingle = useCallback(<T = any>(options: QueryOptions & { id: string }) => {
    return useQuery({
      queryKey: ['api', 'single', options.table, options.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(options.table)
          .select(options.columns || '*')
          .eq('id', options.id)
          .single();

        if (error) throw error;
        return data as T;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  }, []);

  // Create mutation
  const create = useCallback(async (options: {
    table: string;
    data: Record<string, any>;
    options?: MutationOptions;
  }) => {
    const mutation = useMutation({
      mutationFn: async (data: Record<string, any>) => {
        const { data: result, error } = await supabase
          .from(options.table)
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      onSuccess: (data) => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['api', options.table] });
        options.options?.onSuccess?.(data);
        toast.success('Registro criado com sucesso');
      },
      onError: (error: Error) => {
        options.options?.onError?.(error);
        toast.error(`Erro ao criar: ${error.message}`);
      },
    });

    return mutation.mutateAsync(options.data);
  }, [queryClient]);

  // Update mutation
  const update = useCallback(async (options: {
    table: string;
    id: string;
    data: Record<string, any>;
    options?: MutationOptions;
  }) => {
    const mutation = useMutation({
      mutationFn: async (data: Record<string, any>) => {
        const { data: result, error } = await supabase
          .from(options.table)
          .update(data)
          .eq('id', options.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      onMutate: async (newData) => {
        if (options.options?.optimistic) {
          await queryClient.cancelQueries({ queryKey: ['api', options.table] });
          
          const previousData = queryClient.getQueryData(['api', options.table]);
          
          queryClient.setQueryData(['api', options.table], (old: unknown) => 
            old && Array.isArray(old) ? (old as unknown[]).map((item: unknown) => 
              (item as Record<string, unknown>).id === options.id ? { ...item, ...newData } : item
            ) : old
          );
          
          return { previousData };
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['api', options.table] });
        options.options?.onSuccess?.(data);
        toast.success('Registro atualizado com sucesso');
      },
      onError: (error: Error, _newData, context) => {
        if (options.options?.optimistic && context?.previousData) {
          queryClient.setQueryData(['api', options.table], context.previousData);
        }
        options.options?.onError?.(error);
        toast.error(`Erro ao atualizar: ${error.message}`);
      },
    });

    return mutation.mutateAsync(options.data);
  }, [queryClient]);

  // Delete mutation
  const deleteRecord = useCallback(async (options: {
    table: string;
    id: string;
    options?: MutationOptions;
  }) => {
    const mutation = useMutation({
      mutationFn: async () => {
        const { error } = await supabase
          .from(options.table)
          .delete()
          .eq('id', options.id);

        if (error) throw error;
      },
      onMutate: async () => {
        if (options.options?.optimistic) {
          await queryClient.cancelQueries({ queryKey: ['api', options.table] });
          
          const previousData = queryClient.getQueryData(['api', options.table]);
          
          queryClient.setQueryData(['api', options.table], (old: unknown) => 
            old && Array.isArray(old) ? (old as unknown[]).filter((item: unknown) => 
              (item as Record<string, unknown>).id !== options.id
            ) : old
          );
          
          return { previousData };
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['api', options.table] });
        options.options?.onSuccess?.(null);
        toast.success('Registro deletado com sucesso');
      },
      onError: (error: Error, _variables, context) => {
        if (options.options?.optimistic && context?.previousData) {
          queryClient.setQueryData(['api', options.table], context.previousData);
        }
        options.options?.onError?.(error);
        toast.error(`Erro ao deletar: ${error.message}`);
      },
    });

    return mutation.mutateAsync();
  }, [queryClient]);

  // Upsert mutation
  const upsert = useCallback(async (options: {
    table: string;
    data: Record<string, any>;
    onConflict?: string;
    options?: MutationOptions;
  }) => {
    const mutation = useMutation({
      mutationFn: async (data: Record<string, any>) => {
        const query = supabase
          .from(options.table)
          .upsert(data, { onConflict: options.onConflict });

        const { data: result, error } = await query.select().single();
        if (error) throw error;
        return result;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['api', options.table] });
        options.options?.onSuccess?.(data);
        toast.success('Registro salvo com sucesso');
      },
      onError: (error: Error) => {
        options.options?.onError?.(error);
        toast.error(`Erro ao salvar: ${error.message}`);
      },
    });

    return mutation.mutateAsync(options.data);
  }, [queryClient]);

  // Search method
  const search = useCallback(async (options: {
    table: string;
    columns: string[];
    query: string;
    limit?: number;
  }) => {
    try {
      const searchConditions = options.columns
        .map(col => `${col}.ilike.%${options.query}%`)
        .join(',');

      const { data, error } = await supabase
        .from(options.table)
        .select('*')
        .or(searchConditions)
        .limit(options.limit || 50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Erro na busca:', error);
      throw error;
    }
  }, []);

  // Count method
  const count = useCallback(async (options: {
    table: string;
    filters?: Record<string, any>;
  }) => {
    try {
      let query = supabase
        .from(options.table)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      log.error('Erro ao contar registros:', error);
      throw error;
    }
  }, []);

  // Bulk insert
  const bulkInsert = useCallback(async (options: {
    table: string;
    data: Record<string, any>[];
    options?: MutationOptions;
  }) => {
    const mutation = useMutation({
      mutationFn: async (data: Record<string, any>[]) => {
        const { data: result, error } = await supabase
          .from(options.table)
          .insert(data)
          .select();

        if (error) throw error;
        return result;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['api', options.table] });
        options.options?.onSuccess?.(data);
        toast.success(`${data.length} registros criados com sucesso`);
      },
      onError: (error: Error) => {
        options.options?.onError?.(error);
        toast.error(`Erro ao inserir registros: ${error.message}`);
      },
    });

    return mutation.mutateAsync(options.data);
  }, [queryClient]);

  // Bulk update
  const bulkUpdate = useCallback(async (options: {
    table: string;
    updates: Array<{ id: string; data: Record<string, any> }>;
    options?: MutationOptions;
  }) => {
    const mutation = useMutation({
      mutationFn: async (updates: Array<{ id: string; data: Record<string, any> }>) => {
        const promises = updates.map(update =>
          supabase
            .from(options.table)
            .update(update.data)
            .eq('id', update.id)
            .select()
        );

        const results = await Promise.all(promises);
        const errors = results.filter(result => result.error);
        
        if (errors.length > 0) {
          throw new Error(`Erro em ${errors.length} atualizações`);
        }

        return results.map(result => result.data);
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['api', options.table] });
        options.options?.onSuccess?.(data);
        toast.success(`${data.length} registros atualizados com sucesso`);
      },
      onError: (error: Error) => {
        options.options?.onError?.(error);
        toast.error(`Erro ao atualizar registros: ${error.message}`);
      },
    });

    return mutation.mutateAsync(options.updates);
  }, [queryClient]);

  // Bulk delete
  const bulkDelete = useCallback(async (options: {
    table: string;
    ids: string[];
    options?: MutationOptions;
  }) => {
    const mutation = useMutation({
      mutationFn: async (ids: string[]) => {
        const { error } = await supabase
          .from(options.table)
          .delete()
          .in('id', ids);

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['api', options.table] });
        options.options?.onSuccess?.(null);
        toast.success(`${options.ids.length} registros deletados com sucesso`);
      },
      onError: (error: Error) => {
        options.options?.onError?.(error);
        toast.error(`Erro ao deletar registros: ${error.message}`);
      },
    });

    return mutation.mutateAsync(options.ids);
  }, [queryClient]);

  return {
    query,
    querySingle,
    create,
    update,
    deleteRecord,
    upsert,
    search,
    count,
    bulkInsert,
    bulkUpdate,
    bulkDelete,
  };
};

export default useAPI;