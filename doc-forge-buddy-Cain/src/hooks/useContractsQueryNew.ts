/**
 * Hooks React Query otimizados para o novo ContractService
 * Mantém compatibilidade com os hooks existentes e adiciona novas funcionalidades
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contractServiceAdapter, LegacyContract, LegacyContractFilters, LegacyContractsListResponse } from '@/services/contracts/contract-service-adapter';
import { ContractRenewalData, ContractTerminationData } from '@/services/contracts/contract-service-interface';

// === HOOKS COMPATÍVEIS COM O CÓDIGO EXISTENTE ===

/**
 * Hook para buscar lista de contratos (substitui useContracts do contractsService.ts antigo)
 */
export function useContracts(filters: LegacyContractFilters = {}) {
  return useQuery({
    queryKey: ['contracts', 'list', filters],
    queryFn: () => contractServiceAdapter.getContracts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnMount: 'always',
  });
}

/**
 * Hook para buscar contrato específico (substitui useContract do contractsService.ts antigo)
 */
export function useContract(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId],
    queryFn: () => contractServiceAdapter.getContract(contractId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!contractId,
  });
}

/**
 * Hook para criar contrato com optimistic update
 */
export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contract: Omit<LegacyContract, 'id' | 'createdAt' | 'updatedAt'>) =>
      contractServiceAdapter.createContract(contract),
    
    onMutate: async (newContract) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['contracts'] });
      
      // Snapshot do valor anterior
      const previousContracts = queryClient.getQueryData<LegacyContractsListResponse>(['contracts', 'list']);
      
      // Optimistic update: adicionar contrato temporário ao cache
      if (previousContracts) {
        const optimisticContract: LegacyContract = {
          ...newContract,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'pending',
          paidValue: 0,
        };

        const optimisticResponse: LegacyContractsListResponse = {
          contracts: [optimisticContract, ...previousContracts.contracts],
          total: previousContracts.total + 1,
          page: previousContracts.page,
          hasMore: previousContracts.hasMore,
        };

        queryClient.setQueryData(['contracts', 'list'], optimisticResponse);
      }
      
      return { previousContracts };
    },
    
    onSuccess: (data) => {
      // Substituir contrato temporário pelo real
      queryClient.setQueryData<LegacyContractsListResponse>(['contracts', 'list'], (old) => {
        if (!old) return old;
        
        const filtered = old.contracts.filter(c => !c.id.startsWith('temp-'));
        return {
          ...old,
          contracts: [data, ...filtered],
          total: old.total,
        };
      });
      
      // Atualizar cache do contrato específico
      queryClient.setQueryData(['contracts', data.id], data);
      
      toast.success('Contrato criado com sucesso');
    },
    
    onError: (error: Error, _newContract, context) => {
      // Rollback em caso de erro
      if (context?.previousContracts) {
        queryClient.setQueryData(['contracts', 'list'], context.previousContracts);
      }
      toast.error(`Erro ao criar contrato: ${error.message}`);
    },
  });
}

/**
 * Hook para atualizar contrato
 */
export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; updates: Partial<LegacyContract> }) =>
      contractServiceAdapter.updateContract(id, updates),
    
    onMutate: async ({ id, ...updates }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['contracts'] });
      
      // Snapshot do valor anterior
      const previousContracts = queryClient.getQueryData<LegacyContractsListResponse>(['contracts', 'list']);
      const previousContract = queryClient.getQueryData<LegacyContract>(['contracts', id]);
      
      // Optimistic update: atualizar contrato no cache imediatamente
      if (previousContracts) {
        queryClient.setQueryData<LegacyContractsListResponse>(['contracts', 'list'], (old) => {
          if (!old) return old;
          return {
            ...old,
            contracts: old.contracts.map(contract =>
              contract.id === id ? { ...contract, ...updates } : contract
            )
          };
        });
      }
      
      if (previousContract) {
        queryClient.setQueryData(['contracts', id], { ...previousContract, ...updates });
      }
      
      return { previousContracts, previousContract };
    },
    
    onSuccess: (data) => {
      // Atualizar com dados reais do servidor
      queryClient.setQueryData<LegacyContractsListResponse>(['contracts', 'list'], (old) => {
        if (!old) return old;
        return {
          ...old,
          contracts: old.contracts.map(contract =>
            contract.id === data.id ? data : contract
          )
        };
      });
      
      queryClient.setQueryData(['contracts', data.id], data);
      toast.success('Contrato atualizado com sucesso');
    },
    
    onError: (error: Error, _variables, context) => {
      // Rollback em caso de erro
      if (context?.previousContracts) {
        queryClient.setQueryData(['contracts', 'list'], context.previousContracts);
      }
      if (context?.previousContract) {
        queryClient.setQueryData(['contracts', _variables.id], context.previousContract);
      }
      toast.error(`Erro ao atualizar contrato: ${error.message}`);
    },
  });
}

/**
 * Hook para deletar contrato
 */
export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contractServiceAdapter.deleteContract(id),
    
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['contracts'] });
      
      // Snapshot do valor anterior
      const previousContracts = queryClient.getQueryData<LegacyContractsListResponse>(['contracts', 'list']);
      
      // Optimistic update: remover contrato do cache imediatamente
      if (previousContracts) {
        queryClient.setQueryData<LegacyContractsListResponse>(['contracts', 'list'], (old) => {
          if (!old) return old;
          return {
            ...old,
            contracts: old.contracts.filter(contract => contract.id !== id),
            total: old.total - 1,
          };
        });
      }
      
      return { previousContracts };
    },
    
    onSuccess: () => {
      toast.success('Contrato deletado com sucesso');
    },
    
    onError: (error: Error, _id, context) => {
      // Rollback em caso de erro
      if (context?.previousContracts) {
        queryClient.setQueryData(['contracts', 'list'], context.previousContracts);
      }
      toast.error(`Erro ao deletar contrato: ${error.message}`);
    },
  });
}

// === HOOKS PARA NOVAS FUNCIONALIDADES ===

/**
 * Hook para renovar contrato
 */
export function useRenewContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, renewalData }: { id: string; renewalData: ContractRenewalData }) =>
      contractServiceAdapter.renewContract(id, renewalData),
    
    onSuccess: (data) => {
      // Atualizar cache dos contratos
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.setQueryData(['contracts', data.id], data);
      toast.success('Contrato renovado com sucesso');
    },
    
    onError: (error: Error) => {
      toast.error(`Erro ao renovar contrato: ${error.message}`);
    },
  });
}

/**
 * Hook para terminar contrato
 */
export function useTerminateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, terminationData }: { id: string; terminationData: ContractTerminationData }) =>
      contractServiceAdapter.terminateContract(id, terminationData),
    
    onSuccess: (data) => {
      // Atualizar cache dos contratos
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.setQueryData(['contracts', data.id], data);
      toast.success('Contrato terminado com sucesso');
    },
    
    onError: (error: Error) => {
      toast.error(`Erro ao terminar contrato: ${error.message}`);
    },
  });
}

/**
 * Hook para buscar contratos por propriedade
 */
export function useContractsByProperty(propertyId: string) {
  return useQuery({
    queryKey: ['contracts', 'by-property', propertyId],
    queryFn: () => contractServiceAdapter.getContractsByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para métricas de contrato específico
 */
export function useContractMetrics(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'metrics'],
    queryFn: () => contractServiceAdapter.calculateContractMetrics(contractId),
    enabled: !!contractId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para métricas gerais de contratos
 */
export function useContractStats() {
  return useQuery({
    queryKey: ['contracts', 'stats'],
    queryFn: () => contractServiceAdapter.getContractMetrics(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
}

// === HOOKS UTILITÁRIOS ===

/**
 * Hook para prefetch de contratos
 */
export function usePrefetchContracts() {
  const queryClient = useQueryClient();

  const prefetchContract = (contractId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['contracts', contractId],
      queryFn: () => contractServiceAdapter.getContract(contractId),
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchContractsList = (filters: LegacyContractFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: ['contracts', 'list', filters],
      queryFn: () => contractServiceAdapter.getContracts(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchContract, prefetchContractsList };
}

/**
 * Hook para invalidar cache de contratos
 */
export function useInvalidateContracts() {
  const queryClient = useQueryClient();

  const invalidateAllContracts = () => {
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
  };

  const invalidateContractsList = () => {
    queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] });
  };

  const invalidateContract = (contractId: string) => {
    queryClient.invalidateQueries({ queryKey: ['contracts', contractId] });
  };

  return {
    invalidateAllContracts,
    invalidateContractsList,
    invalidateContract,
  };
}

/**
 * Hook para contratos recentes
 */
export function useRecentContracts() {
  return useQuery({
    queryKey: ['contracts', 'recent'],
    queryFn: () => contractServiceAdapter.getContracts({ limit: 5 }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refetch automático a cada 5 minutos
  });
}

/**
 * Hook combinado para operações de contrato (equivalente ao useContractsQuery antigo)
 */
export function useContractsQuery() {
  const queryClient = useQueryClient();
  
  // Buscar todos os contratos
  const {
    data: contracts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contracts', 'list'],
    queryFn: () => contractServiceAdapter.getContracts(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Mutations
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();

  return {
    // Data
    contracts: contracts.contracts, // Array direto para compatibilidade
    contractsResponse: contracts, // Resposta completa
    isLoading,
    error,
    refetch,
    
    // Mutations
    createContract: createContract.mutate,
    updateContract: updateContract.mutate,
    deleteContract: deleteContract.mutate,
    
    // Mutation states
    isCreating: createContract.isPending,
    isUpdating: updateContract.isPending,
    isDeleting: deleteContract.isPending,
  };
}