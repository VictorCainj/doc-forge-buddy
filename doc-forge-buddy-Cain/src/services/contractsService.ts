// Serviço de contratos com React Query otimizado
import { 
  useOptimizedQuery, 
  useOptimizedMutation, 
  useOptimisticMutation,
  usePrefetch,
  useInvalidateQueries 
} from '@/hooks/query';
import { queryClient } from '@/lib/queryClient';

// Tipos
export interface Contract {
  id: string;
  contractNumber: string;
  clientName: string;
  property: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalValue: number;
  paidValue: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractFilters {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ContractsListResponse {
  contracts: Contract[];
  total: number;
  page: number;
  hasMore: boolean;
}

// Serviços de API
const contractsApi = {
  // Buscar lista de contratos com filtros
  getContracts: async (filters: ContractFilters = {}): Promise<ContractsListResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`/api/contracts?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contratos: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Buscar contrato por ID
  getContract: async (id: string): Promise<Contract> => {
    const response = await fetch(`/api/contracts/${id}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contrato: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Criar novo contrato
  createContract: async (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contract> => {
    const response = await fetch('/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contract),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao criar contrato: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Atualizar contrato
  updateContract: async (id: string, updates: Partial<Contract>): Promise<Contract> => {
    const response = await fetch(`/api/contracts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar contrato: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Deletar contrato
  deleteContract: async (id: string): Promise<void> => {
    const response = await fetch(`/api/contracts/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao deletar contrato: ${response.statusText}`);
    }
  },
};

// Hooks otimizados para contratos

// Hook para buscar lista de contratos
export function useContracts(filters: ContractFilters = {}) {
  const queryKey = ['contracts', 'list', filters];
  
  return useOptimizedQuery(
    queryKey,
    () => contractsApi.getContracts(filters),
    {
      // Configurações específicas para lista de contratos
      staleTime: 2 * 60 * 1000, // 2 minutos
      refetchOnMount: 'always', // Sempre refetch para dados de lista
    }
  );
}

// Hook para buscar contrato específico
export function useContract(contractId: string) {
  const queryKey = ['contracts', contractId];
  
  return useOptimizedQuery(
    queryKey,
    () => contractsApi.getContract(contractId),
    {
      // Configurações específicas para contrato específico
      staleTime: 5 * 60 * 1000, // 5 minutos (dados mais estáveis)
      enabled: !!contractId, // Só executar se contractId for fornecido
    }
  );
}

// Hook para criar contrato com optimistic update
export function useCreateContract() {
  const queryClient = useQueryClient();
  
  const createOptimisticData = (variables: any, currentData: any) => {
    const newContract: Contract = {
      ...variables,
      id: `temp-${Date.now()}`, // ID temporário
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      paidValue: 0,
    };

    if (currentData?.contracts) {
      return {
        ...currentData,
        contracts: [newContract, ...currentData.contracts],
        total: (currentData.total || 0) + 1,
      };
    }
    
    return currentData;
  };

  return useOptimisticMutation(
    contractsApi.createContract,
    createOptimisticData,
    ['contracts', 'list'], // Query key para atualizar
    {
      // Configurações de retry para criação
      retry: 2,
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: ['contracts'],
          exact: false,
        });
      },
    }
  );
}

// Hook para atualizar contrato
export function useUpdateContract() {
  const queryClient = useQueryClient();
  
  return useOptimizedMutation(
    ({ id, ...updates }: { id: string; updates: Partial<Contract> }) => 
      contractsApi.updateContract(id, updates),
    {
      onSuccess: (data, variables) => {
        // Atualizar cache do contrato específico
        queryClient.setQueryData(['contracts', data.id], data);
        
        // Invalidar lista de contratos
        queryClient.invalidateQueries({
          queryKey: ['contracts', 'list'],
          exact: false,
        });
      },
    }
  );
}

// Hook para deletar contrato
export function useDeleteContract() {
  const queryClient = useQueryClient();
  
  return useOptimizedMutation(
    (id: string) => contractsApi.deleteContract(id),
    {
      retry: 1,
      onSuccess: (_, contractId) => {
        // Remover do cache
        queryClient.removeQueries({
          queryKey: ['contracts', contractId],
        });
        
        // Invalidar lista
        queryClient.invalidateQueries({
          queryKey: ['contracts', 'list'],
          exact: false,
        });
      },
    }
  );
}

// Hooks utilitários

// Hook para prefetch de contratos
export function usePrefetchContracts() {
  const { prefetchQuery } = usePrefetch();
  
  const prefetchContract = (contractId: string) => {
    prefetchQuery(
      ['contracts', contractId],
      () => contractsApi.getContract(contractId),
      { priority: 'high', staleTime: 10 * 60 * 1000 }
    );
  };
  
  const prefetchContractsList = (filters: ContractFilters = {}) => {
    prefetchQuery(
      ['contracts', 'list', filters],
      () => contractsApi.getContracts(filters),
      { priority: 'normal', staleTime: 5 * 60 * 1000 }
    );
  };
  
  return { prefetchContract, prefetchContractsList };
}

// Hook para invalidar cache de contratos
export function useInvalidateContracts() {
  const { invalidateByPattern, invalidateEntity } = useInvalidateQueries();
  
  const invalidateAllContracts = () => {
    invalidateByPattern(/^contracts/);
  };
  
  const invalidateContractsList = () => {
    invalidateEntity('contracts');
  };
  
  return { 
    invalidateAllContracts, 
    invalidateContractsList,
    invalidateByPattern,
    invalidateEntity
  };
}

// Hook para dados derivados (dashboard)
export function useContractStats() {
  return useOptimizedQuery(
    ['contracts', 'stats'],
    async () => {
      const response = await fetch('/api/contracts/stats');
      return response.json();
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos (dados de stats)
      gcTime: 30 * 60 * 1000, // 30 minutos
    }
  );
}

// Hook para contratos recentes
export function useRecentContracts() {
  return useOptimizedQuery(
    ['contracts', 'recent'],
    () => contractsApi.getContracts({ limit: 5 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchInterval: 5 * 60 * 1000, // Refetch automático a cada 5 minutos
    }
  );
}