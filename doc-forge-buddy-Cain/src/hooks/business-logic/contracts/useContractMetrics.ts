import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// Tipos para métricas de contrato
export interface ContractMetrics {
  total: number;
  active: number;
  draft: number;
  suspended: number;
  terminated: number;
  expired: number;
  byMonth: MonthlyMetrics[];
  trends: MetricTrend[];
  performance: PerformanceMetrics;
  financial: FinancialMetrics;
}

export interface MonthlyMetrics {
  month: string;
  year: number;
  created: number;
  terminated: number;
  active: number;
  revenue: number;
  avgDuration: number;
}

export interface MetricTrend {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface PerformanceMetrics {
  avgContractValue: number;
  avgContractDuration: number;
  conversionRate: number;
  renewalRate: number;
  terminationRate: number;
  satisfactionScore: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageRevenue: number;
  projectedRevenue: number;
  outstandingAmount: number;
  collectionRate: number;
}

export interface ContractFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  type?: string[];
  valueRange?: {
    min: number;
    max: number;
  };
  location?: string[];
  searchTerm?: string;
  sortBy?: 'created' | 'updated' | 'value' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface UseContractMetricsOptions {
  refreshInterval?: number;
  enableRealTime?: boolean;
  includeArchived?: boolean;
  calculateTrends?: boolean;
  calculateProjections?: boolean;
}

const DEFAULT_FILTERS: ContractFilters = {
  sortBy: 'created',
  sortOrder: 'desc'
};

export function useContractMetrics(
  filters: ContractFilters = DEFAULT_FILTERS,
  options: UseContractMetricsOptions = {}
) {
  const {
    refreshInterval = 300000, // 5 minutos
    enableRealTime = false,
    includeArchived = false,
    calculateTrends = true,
    calculateProjections = true
  } = options;

  // Estados locais
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>('30d');

  // Query para dados brutos dos contratos
  const {
    data: rawContracts,
    isLoading: contractsLoading,
    error: contractsError,
    refetch: refetchContracts
  } = useQuery({
    queryKey: ['contracts-metrics', filters, includeArchived],
    queryFn: async () => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Gerar dados simulados
      return generateMockContracts();
    },
    refetchInterval: enableRealTime ? refreshInterval : false,
    staleTime: refreshInterval / 2
  });

  // Query para dados históricos (para tendências)
  const {
    data: historicalData,
    isLoading: historicalLoading
  } = useQuery({
    queryKey: ['contracts-historical', filters],
    queryFn: async () => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockHistoricalData();
    },
    enabled: calculateTrends,
    staleTime: 300000 // 5 minutos
  });

  // Aplicar filtros
  const filteredContracts = useMemo(() => {
    if (!rawContracts) return [];

    return rawContracts.filter(contract => {
      // Filtro por status
      if (filters.status?.length && !filters.status.includes(contract.status)) {
        return false;
      }

      // Filtro por data
      if (filters.dateRange) {
        const contractDate = new Date(contract.createdAt);
        if (!isWithinInterval(contractDate, filters.dateRange)) {
          return false;
        }
      }

      // Filtro por valor
      if (filters.valueRange) {
        if (contract.value < filters.valueRange.min || contract.value > filters.valueRange.max) {
          return false;
        }
      }

      // Filtro por tipo
      if (filters.type?.length && !filters.type.includes(contract.type)) {
        return false;
      }

      // Filtro por localização
      if (filters.location?.length && !filters.location.includes(contract.location)) {
        return false;
      }

      // Filtro por termo de busca
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        return (
          contract.title.toLowerCase().includes(searchTerm) ||
          contract.clientName.toLowerCase().includes(searchTerm) ||
          contract.id.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
  }, [rawContracts, filters]);

  // Calcular métricas principais
  const metrics = useMemo((): ContractMetrics => {
    if (!filteredContracts.length) {
      return getEmptyMetrics();
    }

    const now = new Date();
    const currentMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const currentYear = new Date(now.getFullYear(), 0, 1);

    // Métricas básicas
    const total = filteredContracts.length;
    const active = filteredContracts.filter(c => c.status === 'active').length;
    const draft = filteredContracts.filter(c => c.status === 'draft').length;
    const suspended = filteredContracts.filter(c => c.status === 'suspended').length;
    const terminated = filteredContracts.filter(c => c.status === 'terminated').length;
    const expired = filteredContracts.filter(c => c.status === 'expired').length;

    // Métricas mensais
    const byMonth = calculateMonthlyMetrics(filteredContracts);

    // Tendências
    const trends = calculateTrends ? calculateMetricTrends(historicalData || []) : [];

    // Métricas de performance
    const performance = calculatePerformanceMetrics(filteredContracts);

    // Métricas financeiras
    const financial = calculateFinancialMetrics(filteredContracts);

    setLastUpdated(now);

    return {
      total,
      active,
      draft,
      suspended,
      terminated,
      expired,
      byMonth,
      trends,
      performance,
      financial
    };
  }, [filteredContracts, historicalData, calculateTrends]);

  // Calcular KPIs específicos
  const kpis = useMemo(() => {
    if (!metrics) return null;

    const {
      total,
      active,
      terminated,
      performance,
      financial
    } = metrics;

    return {
      activationRate: total > 0 ? (active / total) * 100 : 0,
      terminationRate: total > 0 ? (terminated / total) * 100 : 0,
      avgValue: performance.avgContractValue,
      avgDuration: performance.avgContractDuration,
      monthlyRevenue: financial.monthlyRevenue,
      collectionRate: financial.collectionRate,
      conversionRate: performance.conversionRate,
      renewalRate: performance.renewalRate
    };
  }, [metrics]);

  // Gerar dados para gráficos
  const chartData = useMemo(() => {
    if (!metrics) return null;

    return {
      statusDistribution: {
        labels: ['Ativos', 'Rascunhos', 'Suspensos', 'Rescindidos', 'Expirados'],
        data: [metrics.active, metrics.draft, metrics.suspended, metrics.terminated, metrics.expired],
        colors: ['#10b981', '#6b7280', '#f59e0b', '#ef4444', '#f97316']
      },
      monthlyTrends: {
        labels: metrics.byMonth.map(m => `${m.month}/${m.year}`),
        datasets: [
          {
            label: 'Contratos Criados',
            data: metrics.byMonth.map(m => m.created),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          },
          {
            label: 'Contratos Ativos',
            data: metrics.byMonth.map(m => m.active),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          },
          {
            label: 'Receita',
            data: metrics.byMonth.map(m => m.revenue),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            yAxisID: 'y1'
          }
        ]
      },
      performanceMetrics: {
        labels: ['Conversão', 'Renovação', 'Satisfação'],
        data: [
          metrics.performance.conversionRate,
          metrics.performance.renewalRate,
          metrics.performance.satisfactionScore
        ]
      }
    };
  }, [metrics]);

  // Função para recálculo manual
  const recalculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      await refetchContracts();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao recálcular métricas:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [refetchContracts]);

  // Exportar dados
  const exportData = useCallback((format: 'csv' | 'json' | 'excel') => {
    const data = {
      metrics,
      filters,
      exportedAt: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `contratos-metricas-${Date.now()}.json`);
        break;
      case 'csv':
        // Implementar exportação CSV
        break;
      case 'excel':
        // Implementar exportação Excel
        break;
    }
  }, [metrics, filters]);

  return {
    // Estado
    metrics,
    kpis,
    chartData,
    filteredContracts,
    isCalculating: contractsLoading || historicalLoading || isCalculating,
    error: contractsError,
    lastUpdated,

    // Ações
    recalculate,
    exportData,
    
    // Filtros
    filters,
    setFilters: (newFilters: Partial<ContractFilters>) => {
      // Implementar atualização de filtros
    },

    // Configurações
    selectedPeriod,
    setSelectedPeriod
  };
}

// Funções auxiliares
function generateMockContracts() {
  const statuses = ['active', 'draft', 'suspended', 'terminated', 'expired'] as const;
  const types = ['residential', 'commercial', 'industrial'] as const;
  const locations = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador'] as const;
  
  return Array.from({ length: 150 }, (_, i) => ({
    id: `contract-${i + 1}`,
    title: `Contrato ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    type: types[Math.floor(Math.random() * types.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    value: Math.floor(Math.random() * 100000) + 10000,
    clientName: `Cliente ${i + 1}`,
    createdAt: subDays(new Date(), Math.floor(Math.random() * 365)).toISOString(),
    updatedAt: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
    startDate: subDays(new Date(), Math.floor(Math.random() * 100)).toISOString(),
    endDate: new Date(Date.now() + Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString(),
    duration: Math.floor(Math.random() * 36) + 1
  }));
}

function generateMockHistoricalData() {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    months.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      created: Math.floor(Math.random() * 50) + 10,
      terminated: Math.floor(Math.random() * 20) + 5,
      active: Math.floor(Math.random() * 200) + 50,
      revenue: Math.floor(Math.random() * 1000000) + 500000
    });
  }
  return months;
}

function calculateMonthlyMetrics(contracts: any[]): MonthlyMetrics[] {
  const monthlyData = new Map<string, MonthlyMetrics>();
  
  contracts.forEach(contract => {
    const date = new Date(contract.createdAt);
    const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!monthlyData.has(key)) {
      monthlyData.set(key, {
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        year: date.getFullYear(),
        created: 0,
        terminated: 0,
        active: 0,
        revenue: 0,
        avgDuration: 0
      });
    }
    
    const monthData = monthlyData.get(key)!;
    monthData.created++;
    monthData.revenue += contract.value;
    monthData.active += contract.status === 'active' ? 1 : 0;
    monthData.terminated += contract.status === 'terminated' ? 1 : 0;
  });
  
  return Array.from(monthlyData.values());
}

function calculateMetricTrends(historicalData: any[]): MetricTrend[] {
  return historicalData.slice(-6).map((current, index, array) => {
    const previous = index > 0 ? array[index - 1] : null;
    const change = previous ? current.active - previous.active : 0;
    const changePercent = previous ? (change / previous.active) * 100 : 0;
    
    return {
      period: `${current.month}/${current.year}`,
      value: current.active,
      change,
      changePercent
    };
  });
}

function calculatePerformanceMetrics(contracts: any[]): PerformanceMetrics {
  const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);
  const totalDuration = contracts.reduce((sum, c) => sum + c.duration, 0);
  const activeCount = contracts.filter(c => c.status === 'active').length;
  const terminatedCount = contracts.filter(c => c.status === 'terminated').length;
  
  return {
    avgContractValue: contracts.length > 0 ? totalValue / contracts.length : 0,
    avgContractDuration: contracts.length > 0 ? totalDuration / contracts.length : 0,
    conversionRate: 85.5, // Valor simulado
    renewalRate: 78.2, // Valor simulado
    terminationRate: contracts.length > 0 ? (terminatedCount / contracts.length) * 100 : 0,
    satisfactionScore: 4.3 // Valor simulado
  };
}

function calculateFinancialMetrics(contracts: any[]): FinancialMetrics {
  const activeContracts = contracts.filter(c => c.status === 'active');
  const totalRevenue = activeContracts.reduce((sum, c) => sum + c.value, 0);
  const currentMonth = startOfMonth(new Date());
  const monthlyContracts = contracts.filter(c => {
    const createdDate = new Date(c.createdAt);
    return isWithinInterval(createdDate, {
      start: currentMonth,
      end: endOfMonth(currentMonth)
    });
  });
  
  return {
    totalRevenue,
    monthlyRevenue: monthlyContracts.reduce((sum, c) => sum + c.value, 0),
    averageRevenue: contracts.length > 0 ? totalRevenue / contracts.length : 0,
    projectedRevenue: totalRevenue * 1.1, // 10% de projeção
    outstandingAmount: 50000, // Valor simulado
    collectionRate: 94.5 // Valor simulado
  };
}

function getEmptyMetrics(): ContractMetrics {
  return {
    total: 0,
    active: 0,
    draft: 0,
    suspended: 0,
    terminated: 0,
    expired: 0,
    byMonth: [],
    trends: [],
    performance: {
      avgContractValue: 0,
      avgContractDuration: 0,
      conversionRate: 0,
      renewalRate: 0,
      terminationRate: 0,
      satisfactionScore: 0
    },
    financial: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageRevenue: 0,
      projectedRevenue: 0,
      outstandingAmount: 0,
      collectionRate: 0
    }
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}