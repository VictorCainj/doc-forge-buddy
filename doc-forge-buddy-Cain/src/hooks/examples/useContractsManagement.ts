// Hook de exemplo demonstrando todas as otimizações do React Query
import { useState, useEffect } from 'react';
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract, usePrefetchContracts, useInvalidateContracts } from '@/services/contractsService';
import { useOptimizedQuery, useOptimizedMutation } from '@/hooks/query';
import { queryMonitor } from '@/lib/queryMonitor';
import { cacheManager } from '@/lib/queryCache';

// Hook principal de demonstração
export function useContractsManagement() {
  // Estados de filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 20
  });

  // Hooks principais para dados
  const contracts = useContracts(filters);
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  
  // Hooks utilitários
  const { prefetchContract, prefetchContractsList } = usePrefetchContracts();
  const { invalidateContractsList, invalidateAllContracts } = useInvalidateContracts();

  // Hook de monitoramento de performance
  useQueryPerformanceMonitoring();

  // Prefetch quando filtros mudam
  useEffect(() => {
    if (contracts.data) {
      // Prefetch contratos individuais para navegação rápida
      contracts.data.contracts.forEach(contract => {
        prefetchContract(contract.id);
      });
    }
  }, [contracts.data, prefetchContract]);

  // Handlers de ações
  const handleCreate = async (contractData: any) => {
    try {
      await createContract.mutateAsync(contractData);
      // Invalidar lista para mostrar novo contrato
      invalidateContractsList();
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      await updateContract.mutateAsync({ id, updates });
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContract.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
    }
  };

  // Atualizar filtros
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Limpar cache
  const clearCache = () => {
    invalidateAllContracts();
  };

  return {
    // Estados de dados
    contracts: contracts.data,
    isLoading: contracts.isLoading,
    isError: contracts.isError,
    error: contracts.error,
    isRefetching: contracts.isRefetching,
    
    // Estados de mutations
    isCreating: createContract.isPending,
    isUpdating: updateContract.isPending,
    isDeleting: deleteContract.isPending,
    
    // Handlers
    handleCreate,
    handleUpdate,
    handleDelete,
    updateFilters,
    clearCache,
    
    // Utilitários
    refetch: contracts.refetch,
    isStale: contracts.isStale,
    
    // Filtros
    filters
  };
}

// Hook para monitoramento de performance
function useQueryPerformanceMonitoring() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Log inicial
      const initialMetrics = queryMonitor.getDetailedMetrics();
      console.log('📊 React Query Initial Metrics:', {
        totalQueries: initialMetrics.cache.totalQueries,
        activeQueries: initialMetrics.cache.activeQueries,
        errorRate: `${initialMetrics.performance.errorRate.toFixed(1)}%`,
        averageQueryTime: `${initialMetrics.performance.averageQueryTime.toFixed(0)}ms`
      });

      // Monitoramento periódico
      const interval = setInterval(() => {
        const metrics = queryMonitor.getCacheMetrics();
        
        // Alert para problemas
        if (metrics.hitRate < 70) {
          console.warn('⚠️ Low Cache Hit Rate:', `${metrics.hitRate.toFixed(1)}%`);
        }
        
        if (metrics.staleQueries > 20) {
          console.warn('⚠️ Many Stale Queries:', metrics.staleQueries);
        }
      }, 60000); // A cada minuto

      return () => clearInterval(interval);
    }
  }, []);
}

// Hook para dados derivados com seletores otimizados
export function useContractStats() {
  // Query para estatísticas
  const stats = useOptimizedQuery(
    ['contracts', 'stats'],
    async () => {
      const response = await fetch('/api/contracts/stats');
      return response.json();
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
      refetchInterval: 10 * 60 * 1000, // Refetch a cada 10 minutos
    }
  );

  // Query para gráficos (dados mais frequentes)
  const chartData = useOptimizedQuery(
    ['contracts', 'charts', 'monthly'],
    async () => {
      const response = await fetch('/api/contracts/charts/monthly');
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
    }
  );

  return {
    stats: stats.data,
    chartData: chartData.data,
    isLoading: stats.isLoading || chartData.isLoading,
    error: stats.error || chartData.error
  };
}

// Hook para busca otimizada com debounce
export function useContractSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Query otimizada para busca
  const searchResults = useOptimizedQuery(
    ['contracts', 'search', debouncedTerm],
    async () => {
      if (!debouncedTerm) return { contracts: [], total: 0 };
      
      const response = await fetch(`/api/contracts/search?q=${encodeURIComponent(debouncedTerm)}`);
      return response.json();
    },
    {
      enabled: !!debouncedTerm, // Só executar se há termo de busca
      staleTime: 1 * 60 * 1000, // 1 minuto
    }
  );

  return {
    searchTerm,
    setSearchTerm,
    results: searchResults.data,
    isSearching: searchResults.isLoading,
    error: searchResults.error
  };
}

// Hook para cache management
export function useCacheManagement() {
  const [cacheStats, setCacheStats] = useState({
    totalQueries: 0,
    activeQueries: 0,
    staleQueries: 0,
    errorQueries: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      const stats = cacheManager.getStats();
      setCacheStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const clearAll = () => {
    cacheManager.clearEntityCache('contracts');
  };

  const keepOnlyCritical = () => {
    cacheManager.keepOnlyCritical();
  };

  return {
    cacheStats,
    clearAll,
    keepOnlyCritical
  };
}

// Hook para offline support
export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Query que funciona offline
  const offlineData = useOptimizedQuery(
    ['offline', 'contracts'],
    async () => {
      if (!isOnline) {
        // Retornar dados do cache
        const cachedData = localStorage.getItem('cached_contracts');
        return cachedData ? JSON.parse(cachedData) : { contracts: [], total: 0 };
      }
      
      // Buscar dados online e cache
      const response = await fetch('/api/contracts');
      const data = await response.json();
      
      // Cache para uso offline
      localStorage.setItem('cached_contracts', JSON.stringify(data));
      
      return data;
    },
    {
      networkMode: 'offline', // Permite queries mesmo offline
      retry: false, // Não retry se offline
    }
  );

  return {
    isOnline,
    offlineData: offlineData.data,
    hasOfflineData: !!offlineData.data
  };
}