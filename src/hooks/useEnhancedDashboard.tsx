import { useState, useCallback, useMemo } from 'react';
import { useDashboardData } from './useOptimizedData';
import { useAdvancedAnalytics } from './useAdvancedAnalytics';
import { useProactiveInsights } from './useProactiveInsights';

export interface EnhancedMetrics {
  // Métricas essenciais (apenas dados reais)
  totalContracts: number;
  contractsOver30Days: number;
  contractsNear30Days: number;
  averageProcessingTime: number;
  occupancyRate?: number;
  monthlyRevenue?: number;
  contractsAtRisk?: number;
  monthlyContractsByVacation: Array<{
    month: string;
    count: number;
  }>;
  [key: string]: any;
}

export interface DashboardFilters {
  period: string;
  status: string[];
  region: string[];
  type: string[];
  responsible: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface ChartData {
  monthlyTrends: Array<{
    month: string;
    value: number;
    revenue: number;
  }>;
  geographicData: Array<{
    location: string;
    count: number;
    revenue: number;
  }>;
  riskAnalysis: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  performanceMetrics: Array<{
    metric: string;
    value: number;
    target: number;
    status: 'good' | 'warning' | 'critical';
  }>;
  [key: string]: any;
}

export const useEnhancedDashboard = () => {
  const { contracts, loading, refetch } = useDashboardData();
  const { insights } = useAdvancedAnalytics(contracts);
  const { alerts, recommendations, predictions } =
    useProactiveInsights(contracts);

  const [filters, setFilters] = useState<DashboardFilters>({
    period: '30d',
    status: [],
    region: [],
    type: [],
    responsible: [],
    dateRange: {
      start: null,
      end: null,
    },
  });

  // Função para parsear data brasileira (DD/MM/AAAA)
  const parseBrazilianDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  // Aplicar filtros aos contratos
  const filteredContracts = useMemo(() => {
    let filtered = [...contracts];

    // Filtro por período
    if (filters.period) {
      const now = new Date();
      const days = parseInt(filters.period.replace('d', ''));
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((contract) => {
        // Usar a data de início da desocupação se disponível, senão usar data de criação
        const vacationStartDate = contract.form_data.dataInicioRescisao 
          ? parseBrazilianDate(contract.form_data.dataInicioRescisao)
          : new Date(contract.created_at);
        
        if (!vacationStartDate) return false;
        
        return vacationStartDate >= cutoffDate;
      });
    }

    // Filtro por status
    if (filters.status.length > 0) {
      filtered = filtered.filter((contract) => {
        const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
        const now = new Date();
        const daysUntilExpiry = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return filters.status.some((status) => {
          switch (status) {
            case 'active':
              return daysUntilExpiry > 30;
            case 'expiring':
              return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
            case 'expired':
              return daysUntilExpiry <= 0;
            default:
              return true;
          }
        });
      });
    }

    // Filtro por região
    if (filters.region.length > 0) {
      filtered = filtered.filter((contract) => {
        const address = contract.form_data.enderecoImovel || '';
        return filters.region.some((region) =>
          address.toLowerCase().includes(region.toLowerCase())
        );
      });
    }

    // Filtro por tipo
    if (filters.type.length > 0) {
      filtered = filtered.filter((contract) => {
        const address = contract.form_data.enderecoImovel || '';
        const isCommercial = address.toLowerCase().includes('comercial');
        const hasDocuments = contract.form_data.solicitarCND === 'sim';
        const hasKeys = contract.form_data.incluirQuantidadeChaves === 'sim';

        return filters.type.some((type) => {
          switch (type) {
            case 'residential':
              return !isCommercial;
            case 'commercial':
              return isCommercial;
            case 'with_documents':
              return hasDocuments;
            case 'with_keys':
              return hasKeys;
            default:
              return true;
          }
        });
      });
    }

    // Filtro por data
    if (filters.dateRange.start) {
      filtered = filtered.filter((contract) => {
        const vacationStartDate = contract.form_data.dataInicioRescisao 
          ? parseBrazilianDate(contract.form_data.dataInicioRescisao)
          : new Date(contract.created_at);
        
        if (!vacationStartDate) return false;
        
        return vacationStartDate >= (filters.dateRange.start as Date);
      });
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter((contract) => {
        const vacationStartDate = contract.form_data.dataInicioRescisao 
          ? parseBrazilianDate(contract.form_data.dataInicioRescisao)
          : new Date(contract.created_at);
        
        if (!vacationStartDate) return false;
        
        return vacationStartDate <= (filters.dateRange.end as Date);
      });
    }

    return filtered;
  }, [contracts, filters]);

  // Calcular métricas aprimoradas
  const enhancedMetrics = useMemo((): EnhancedMetrics => {
    const now = new Date();

    // Total de contratos
    const totalContracts = filteredContracts.length;

    // Contratos que ultrapassaram 30 dias
    const contractsOver30Days = filteredContracts.filter((contract) => {
      const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
      const daysSinceExpiry = Math.ceil(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceExpiry > 30;
    }).length;

    // Contratos próximos de 30 dias (até 1 semana antes)
    const contractsNear30Days = filteredContracts.filter((contract) => {
      const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    }).length;

    // Tempo médio de processamento
    const processingTimes = filteredContracts.map((contract) => {
      const created = new Date(contract.created_at);
      const updated = new Date(contract.updated_at);
      return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });
    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
        : 0;

    // Contratos por mês (baseado na data de início da desocupação)
    const monthlyContractsByVacation: Array<{ month: string; count: number }> =
      [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

      const contractsInMonth = filteredContracts.filter((contract) => {
        // Usar a data de início da desocupação se disponível, senão usar data de criação
        const vacationStartDate = contract.form_data.dataInicioRescisao 
          ? parseBrazilianDate(contract.form_data.dataInicioRescisao)
          : new Date(contract.created_at);
        
        if (!vacationStartDate) return false;
        
        return (
          vacationStartDate.getMonth() === date.getMonth() &&
          vacationStartDate.getFullYear() === date.getFullYear()
        );
      }).length;

      monthlyContractsByVacation.push({
        month: monthName,
        count: contractsInMonth,
      });
    }

    return {
      totalContracts,
      contractsOver30Days,
      contractsNear30Days,
      averageProcessingTime,
      monthlyContractsByVacation,
    };
  }, [filteredContracts]);

  // Dados para gráficos (simplificados)
  const chartData = useMemo((): ChartData => {
    return {
      monthlyTrends: enhancedMetrics.monthlyContractsByVacation.map((item) => ({
        month: item.month,
        value: item.count,
        revenue: 0,
      })),
      geographicData: [],
      riskAnalysis: [],
      performanceMetrics: [],
    };
  }, [enhancedMetrics]);

  // Funções de controle
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      period: '30d',
      status: [],
      region: [],
      type: [],
      responsible: [],
      dateRange: {
        start: null,
        end: null,
      },
    });
  }, []);

  const exportData = useCallback(() => {
    const data = {
      metrics: enhancedMetrics,
      chartData,
      contracts: filteredContracts,
      filters,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [enhancedMetrics, chartData, filteredContracts, filters]);

  return {
    // Dados
    contracts: filteredContracts,
    metrics: enhancedMetrics,
    chartData,
    insights,
    alerts,
    recommendations,
    predictions,

    // Estados
    loading,
    filters,

    // Funções
    refetch,
    updateFilters,
    resetFilters,
    exportData,
  };
};
