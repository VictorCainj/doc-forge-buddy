import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateContractsList, type Contract } from '@/utils/dataValidator';
import { dbLogger } from '@/utils/logger';
import { cacheManager } from '@/utils/cacheManager';

interface UseOptimizedDataOptions {
  documentType?: string;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}

interface UseOptimizedDataReturn {
  data: Contract[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Hook otimizado para carregamento de dados com cache e paginação
 * Reduz re-renders desnecessários e melhora performance
 */
export const useOptimizedData = (
  options: UseOptimizedDataOptions = {}
): UseOptimizedDataReturn => {
  const {
    documentType = 'contrato',
    limit = 50,
    orderBy = 'created_at',
    ascending = false,
  } = options;

  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Cache para evitar requisições desnecessárias
  const cacheKey = useMemo(
    () => `${documentType}-${limit}-${orderBy}-${ascending}`,
    [documentType, limit, orderBy, ascending]
  );

  // Função para buscar dados com paginação (otimizado com cache)
  const fetchData = useCallback(
    async (page: number = 0, reset: boolean = false) => {
      try {
        if (reset) {
          setLoading(true);
          setError(null);
        }

        // Verificar cache para primeira página
        if (page === 0 && reset) {
          const cachedData = cacheManager.get<{ data: Contract[]; count: number }>(`contracts-${cacheKey}`);
          if (cachedData) {
            dbLogger.debug('Usando dados do cache');
            setData(cachedData.data);
            setTotalCount(cachedData.count);
            setCurrentPage(0);
            setLoading(false);
            return;
          }
        }

        const from = page * limit;
        const to = from + limit - 1;

        // Buscar apenas os dados necessários (sem count extra)
        // O count é feito apenas na primeira página
        const query = supabase
          .from('saved_terms')
          .select('id, title, document_type, form_data, created_at, updated_at', 
            page === 0 ? { count: 'exact' } : {})
          .eq('document_type', documentType)
          .order(orderBy, { ascending })
          .range(from, to);

        const result = await query;

        if (result.error) throw result.error;

        const validatedData = validateContractsList(result.data || []);

        setData((prevData) =>
          reset ? validatedData : [...prevData, ...validatedData]
        );
        
        // Atualizar count apenas na primeira página
        if (page === 0 && result.count !== null) {
          setTotalCount(result.count);
          // Cachear dados da primeira página
          cacheManager.set(`contracts-${cacheKey}`, {
            data: validatedData,
            count: result.count,
          }, 2 * 60 * 1000); // Cache de 2 minutos
        }
        
        setCurrentPage(page);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro desconhecido';
        dbLogger.error('Erro ao carregar dados:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [documentType, limit, orderBy, ascending, cacheKey]
  );

  // Função para recarregar dados (limpa cache)
  const refetch = useCallback(async () => {
    cacheManager.delete(`contracts-${cacheKey}`);
    await fetchData(0, true);
  }, [fetchData, cacheKey]);

  // Função para carregar mais dados
  const loadMore = useCallback(async () => {
    if (!loading && data.length < totalCount) {
      await fetchData(currentPage + 1, false);
    }
  }, [loading, data.length, totalCount, currentPage, fetchData]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchData(0, true);
  }, [fetchData, cacheKey]); // Recarregar apenas quando as opções mudarem

  // Verificar se há mais dados
  const hasMore = useMemo(
    () => data.length < totalCount,
    [data.length, totalCount]
  );

  return {
    data,
    loading,
    error,
    refetch,
    totalCount,
    hasMore,
    loadMore,
  };
};

/**
 * Hook para dados do dashboard com cache inteligente
 */
export const useDashboardData = () => {
  const {
    data: contracts,
    loading,
    error,
    refetch,
  } = useOptimizedData({
    documentType: 'contrato',
    limit: 1000, // Carregar todos os contratos para o dashboard
  });

  // Calcular métricas do dashboard
  const metrics = useMemo(() => {
    if (!contracts.length) {
      return {
        totalContracts: 0,
        currentMonthContracts: 0,
        previousMonthContracts: 0,
        growthPercentage: 0,
        expiredContracts: 0,
        upcomingContracts: 0,
        chartData: [],
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

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

    // Contratos do mês atual (baseado na data de início da desocupação)
    const currentMonthContracts = contracts.filter((contract) => {
      const vacationStartDate = contract.form_data.dataInicioRescisao 
        ? parseBrazilianDate(contract.form_data.dataInicioRescisao)
        : new Date(contract.created_at);
      
      if (!vacationStartDate) return false;
      
      return (
        vacationStartDate.getMonth() === currentMonth &&
        vacationStartDate.getFullYear() === currentYear
      );
    }).length;

    // Contratos do mês anterior (baseado na data de início da desocupação)
    const previousMonthContracts = contracts.filter((contract) => {
      const vacationStartDate = contract.form_data.dataInicioRescisao 
        ? parseBrazilianDate(contract.form_data.dataInicioRescisao)
        : new Date(contract.created_at);
      
      if (!vacationStartDate) return false;
      
      return (
        vacationStartDate.getMonth() === previousMonth &&
        vacationStartDate.getFullYear() === previousYear
      );
    }).length;

    // Calcular crescimento
    const growthPercentage =
      previousMonthContracts > 0
        ? ((currentMonthContracts - previousMonthContracts) /
            previousMonthContracts) *
          100
        : 0;

    // Contratos expirados e próximos do vencimento
    const contractsWithVacationDate = contracts.filter(
      (c) => c.form_data.dataTerminoRescisao
    );

    const expiredContracts = contractsWithVacationDate.filter((contract) => {
      const vacationDate = parseBrazilianDate(
        contract.form_data.dataTerminoRescisao
      );
      return vacationDate && vacationDate < now;
    }).length;

    const upcomingContracts = contractsWithVacationDate.filter((contract) => {
      const vacationDate = parseBrazilianDate(
        contract.form_data.dataTerminoRescisao
      );
      if (!vacationDate) return false;
      const daysUntilVacation = Math.ceil(
        (vacationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilVacation >= 0 && daysUntilVacation <= 7;
    }).length;

    // Gerar dados do gráfico (últimos 12 meses) baseado na data de início da desocupação
    const chartData: Array<{
      month: string;
      value: number;
      fullMonth: string;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

      const contractsInMonth = contracts.filter((contract) => {
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

      chartData.push({
        month: monthName,
        value: contractsInMonth,
        fullMonth: date.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        }),
      });
    }

    return {
      totalContracts: contracts.length,
      currentMonthContracts,
      previousMonthContracts,
      growthPercentage,
      expiredContracts,
      upcomingContracts,
      chartData,
    };
  }, [contracts]);

  return {
    contracts,
    metrics,
    loading,
    error,
    refetch,
  };
};
