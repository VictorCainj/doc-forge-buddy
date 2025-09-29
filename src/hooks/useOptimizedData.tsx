import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateContractsList, type Contract } from '@/utils/dataValidator';
import { dbLogger } from '@/utils/logger';

interface UseOptimizedDataOptions {
  documentType?: string;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
  searchTerm?: string;
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
    searchTerm,
  } = options;

  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Cache para evitar requisições desnecessárias
  const cacheKey = useMemo(
    () => `${documentType}-${limit}-${orderBy}-${ascending}-${searchTerm}`,
    [documentType, limit, orderBy, ascending, searchTerm]
  );

  // Função para buscar dados com paginação
  const fetchData = useCallback(
    async (page: number = 0, reset: boolean = false) => {
      try {
        if (reset) {
          setLoading(true);
          setError(null);
        }

        const from = page * limit;
        const to = from + limit - 1;

        let dataQuery = supabase
          .from('saved_terms')
          .select('*')
          .eq('document_type', documentType);

        let countQuery = supabase
          .from('saved_terms')
          .select('*', { count: 'exact', head: true })
          .eq('document_type', documentType);

        if (searchTerm && searchTerm.trim().length > 0) {
          const term = searchTerm.trim();
          const searchPattern = `%${term}%`;
          const orFilter = [
            `title.ilike.${searchPattern}`,
            `form_data->>nomeLocatario.ilike.${searchPattern}`,
            `form_data->>primeiroLocatario.ilike.${searchPattern}`,
            `form_data->>nomeProprietario.ilike.${searchPattern}`,
            `form_data->>nomesResumidosLocadores.ilike.${searchPattern}`,
            `form_data->>endereco.ilike.${searchPattern}`,
            `form_data->>enderecoImovel.ilike.${searchPattern}`,
            `form_data->>numeroContrato.ilike.${searchPattern}`,
          ].join(',');
          dataQuery = dataQuery.or(orFilter);
          countQuery = countQuery.or(orFilter);
        }

        // Buscar dados com contagem total
        const [dataResult, countResult] = await Promise.all([
          dataQuery.order(orderBy, { ascending }).range(from, to),
          countQuery,
        ]);

        if (dataResult.error) throw dataResult.error;
        if (countResult.error) throw countResult.error;

        const validatedData = validateContractsList(dataResult.data || []);
        const total = countResult.count || 0;

        setData((prevData) =>
          reset ? validatedData : [...prevData, ...validatedData]
        );
        setTotalCount(total);
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
    [documentType, limit, orderBy, ascending, searchTerm]
  );

  // Função para recarregar dados
  const refetch = useCallback(async () => {
    await fetchData(0, true);
  }, [fetchData]);

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
