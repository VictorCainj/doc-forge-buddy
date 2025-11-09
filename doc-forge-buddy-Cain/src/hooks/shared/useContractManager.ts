import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';
import { toast } from 'sonner';
import { log } from '@/utils/logger';
import { useLocalStorage } from './useLocalStorage';
import { useDebounce } from './useDebounce';

export interface ContractFormData {
  [key: string]: string | number | boolean | null;
}

export interface ContractQueryOptions {
  documentType?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface ContractMutationData {
  id?: string;
  title: string;
  content: string;
  document_type: string;
  form_data: ContractFormData;
}

/**
 * Hook consolidado para gerenciamento de contratos
 * Unifica funcionalidades de:
 * - useContractData (CRUD básico)
 * - useContractsQuery (React Query otimizado)
 * - useCompleteContractData (dados completos)
 * - useContractAnalysis (análise e busca)
 */
export const useContractManager = (options: ContractQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const {
    documentType = 'contrato',
    search = '',
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    ascending = false,
  } = options;

  // Estado para cache local
  const [cache, setCache] = useLocalStorage<Record<string, Contract>>('contracts-cache', {});
  const [lastSync, setLastSync] = useLocalStorage<number>('contracts-last-sync', 0);

  // Debounce para busca
  const debouncedSearch = useDebounce(search, 300);

  // Query key dinâmica
  const queryKey = useMemo(
    () => ['contracts', documentType, debouncedSearch, limit, offset, orderBy, ascending],
    [documentType, debouncedSearch, limit, offset, orderBy, ascending]
  );

  // Query para buscar contratos
  const {
    data: contracts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('saved_terms')
        .select('*', { count: 'exact' })
        .eq('document_type', documentType);

      // Aplicar filtro de busca
      if (debouncedSearch) {
        query = query.or(
          `title.ilike.%${debouncedSearch}%,form_data::text.ilike.%${debouncedSearch}%`
        );
      }

      // Aplicar ordenação e paginação
      query = query
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Processar dados dos contratos
      const processedContracts: Contract[] = (data || []).map(contract => ({
        ...contract,
        form_data: typeof contract.form_data === 'string'
          ? JSON.parse(contract.form_data)
          : contract.form_data || {},
      }));

      // Atualizar cache local
      const cacheUpdate = processedContracts.reduce((acc, contract) => {
        acc[contract.id] = contract;
        return acc;
      }, {} as Record<string, Contract>);

      setCache(prev => ({ ...prev, ...cacheUpdate }));
      setLastSync(Date.now());

      return processedContracts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation para criar contrato
  const createContract = useMutation({
    mutationFn: async (contractData: ContractMutationData) => {
      const { data, error } = await supabase
        .from('saved_terms')
        .insert({
          title: contractData.title,
          content: contractData.content,
          document_type: contractData.document_type,
          form_data: contractData.form_data,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Contract;
    },
    onMutate: async (newContract) => {
      await queryClient.cancelQueries({ queryKey: ['contracts'] });
      
      const previousContracts = queryClient.getQueryData<Contract[]>(queryKey);
      
      if (previousContracts) {
        const optimisticContract: Contract = {
          id: `temp-${Date.now()}`,
          ...newContract,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Contract[]>(queryKey, (old = []) => [
          optimisticContract,
          ...old,
        ]);
      }
      
      return { previousContracts };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Contract[]>(queryKey, (old = []) => {
        const filtered = old.filter(c => !c.id.startsWith('temp-'));
        return [data, ...filtered];
      });
      toast.success('Contrato criado com sucesso');
    },
    onError: (error: Error, _newContract, context) => {
      if (context?.previousContracts) {
        queryClient.setQueryData(queryKey, context.previousContracts);
      }
      toast.error(`Erro ao criar contrato: ${error.message}`);
    },
  });

  // Mutation para atualizar contrato
  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from('saved_terms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Contract;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['contracts'] });
      
      const previousContracts = queryClient.getQueryData<Contract[]>(queryKey);
      
      if (previousContracts) {
        queryClient.setQueryData<Contract[]>(queryKey, (old = []) =>
          old.map((contract) =>
            contract.id === id ? { ...contract, ...updates } : contract
          )
        );
      }
      
      return { previousContracts };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Contract[]>(queryKey, (old = []) =>
        old.map((contract) => (contract.id === data.id ? data : contract))
      );
      toast.success('Contrato atualizado com sucesso');
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousContracts) {
        queryClient.setQueryData(queryKey, context.previousContracts);
      }
      toast.error(`Erro ao atualizar contrato: ${error.message}`);
    },
  });

  // Mutation para deletar contrato
  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['contracts'] });
      
      const previousContracts = queryClient.getQueryData<Contract[]>(queryKey);
      
      if (previousContracts) {
        queryClient.setQueryData<Contract[]>(queryKey, (old = []) =>
          old.filter((contract) => contract.id !== id)
        );
      }
      
      return { previousContracts };
    },
    onSuccess: () => {
      toast.success('Contrato deletado com sucesso');
    },
    onError: (error: Error, _id, context) => {
      if (context?.previousContracts) {
        queryClient.setQueryData(queryKey, context.previousContracts);
      }
      toast.error(`Erro ao deletar contrato: ${error.message}`);
    },
  });

  // Função para buscar contrato por ID (com cache)
  const getContractById = useCallback(async (id: string): Promise<Contract | null> => {
    // Verificar cache primeiro
    if (cache[id]) {
      return cache[id];
    }

    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const contract: Contract = {
        ...data,
        form_data: typeof data.form_data === 'string'
          ? JSON.parse(data.form_data)
          : data.form_data || {},
      };

      // Atualizar cache
      setCache(prev => ({ ...prev, [id]: contract }));
      return contract;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contrato';
      log.error('Erro ao buscar contrato por ID:', err);
      throw new Error(errorMessage);
    }
  }, [cache, setCache]);

  // Função para buscar por tipo específico
  const getContractsByType = useCallback(async (type: string): Promise<Contract[]> => {
    try {
      let query = supabase.from('saved_terms').select('*');
      
      if (type !== 'all') {
        query = query.eq('document_type', type);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const processedContracts: Contract[] = (data || []).map(contract => ({
        ...contract,
        form_data: typeof contract.form_data === 'string'
          ? JSON.parse(contract.form_data)
          : contract.form_data || {},
      }));

      return processedContracts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contratos por tipo';
      log.error('Erro ao buscar contratos por tipo:', err);
      throw new Error(errorMessage);
    }
  }, []);

  // Função para sincronizar cache
  const syncCache = useCallback(async () => {
    try {
      const timeSinceSync = Date.now() - lastSync;
      if (timeSinceSync < 5 * 60 * 1000) { // 5 minutos
        return; // Não precisa sincronizar
      }

      await refetch();
      setLastSync(Date.now());
    } catch (error) {
      log.error('Erro ao sincronizar cache:', error);
    }
  }, [lastSync, refetch]);

  // Sincronizar cache periodicamente
  useEffect(() => {
    syncCache();
  }, [syncCache]);

  return {
    // Data
    contracts,
    isLoading,
    error,
    refetch,
    
    // Mutations
    createContract: createContract.mutate,
    updateContract: updateContract.mutate,
    deleteContract: deleteContract.mutate,
    
    // Mutation states
    isCreating: createContract.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Functions
    getContractById,
    getContractsByType,
    syncCache,
    
    // Cache
    cacheSize: Object.keys(cache).length,
    lastSync,
  };
};

export default useContractManager;