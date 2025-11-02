import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateContractsList, type Contract } from '@/utils/dataValidator';
import { dbLogger } from '@/utils/logger';
import { cacheManager } from '@/utils/cacheManager';
import { persistentCache } from '@/utils/persistentCache';
import { parseBrazilianDate } from '@/utils/contractIndex';

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

// Request deduplication - evitar múltiplas requisições simultâneas
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Hook otimizado para carregamento de dados com cache persistente e paginação
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
  const backgroundSyncRef = useRef(false);

  // Cache para evitar requisições desnecessárias
  const cacheKey = useMemo(
    () => `contracts-${documentType}-${limit}-${orderBy}-${ascending}`,
    [documentType, limit, orderBy, ascending]
  );

  // Função para buscar dados com paginação (otimizado com cache persistente)
  const fetchData = useCallback(
    async (page: number = 0, reset: boolean = false) => {
      try {
        if (reset) {
          setLoading(true);
          setError(null);
        }

        // Verificar cache persistente primeiro (localStorage)
        if (page === 0 && reset) {
          const persistentCached = persistentCache.get<{
            data: Contract[];
            count: number;
          }>(cacheKey);
          
          if (persistentCached) {
            dbLogger.debug('Usando dados do cache persistente');
            setData(persistentCached.data);
            setTotalCount(persistentCached.count);
            setCurrentPage(0);
            setLoading(false);
            
            // Sincronizar em background sem bloquear UI
            if (!backgroundSyncRef.current) {
              backgroundSyncRef.current = true;
              // Usar requestIdleCallback para não bloquear UI
              const idleCallback = (window as any).requestIdleCallback || ((fn: () => void) => setTimeout(fn, 100));
              idleCallback(async () => {
                try {
                  const from = 0;
                  const to = limit - 1;
                  const query = supabase
                    .from('saved_terms')
                    .select('id, title, document_type, form_data, created_at, updated_at', { count: 'exact' })
                    .eq('document_type', documentType)
                    .order(orderBy, { ascending })
                    .range(from, to);

                  const result = await query;
                  if (!result.error && result.data) {
                    const validatedData = validateContractsList(result.data || []);
                    const cacheData = {
                      data: validatedData,
                      count: result.count || 0,
                    };
                    
                    // Atualizar cache
                    cacheManager.set(cacheKey, cacheData, 5 * 60 * 1000);
                    persistentCache.set(cacheKey, cacheData, {
                      expiresIn: 5 * 60 * 1000,
                    });
                    
                    // Atualizar estado se dados mudaram
                    setData(validatedData);
                    if (result.count !== null) {
                      setTotalCount(result.count);
                    }
                  }
                } catch (err) {
                  console.warn('Erro na sincronização em background:', err);
                } finally {
                  backgroundSyncRef.current = false;
                }
              });
            }
            return;
          }
        }

        // Verificar cache em memória
        if (page === 0 && reset) {
          const cachedData = cacheManager.get<{
            data: Contract[];
            count: number;
          }>(cacheKey);
          if (cachedData) {
            dbLogger.debug('Usando dados do cache em memória');
            setData(cachedData.data);
            setTotalCount(cachedData.count);
            setCurrentPage(0);
            setLoading(false);
            return;
          }
        }

        // Request deduplication - verificar se já existe requisição pendente
        const requestKey = `${cacheKey}-page-${page}`;
        if (pendingRequests.has(requestKey)) {
          const pendingResult = await pendingRequests.get(requestKey);
          if (pendingResult) {
            setData((prevData) =>
              reset ? pendingResult.data : [...prevData, ...pendingResult.data]
            );
            if (page === 0 && pendingResult.count !== null) {
              setTotalCount(pendingResult.count);
            }
            setCurrentPage(page);
            setLoading(false);
            return;
          }
        }

        const from = page * limit;
        const to = from + limit - 1;

        // Criar promessa para request deduplication
        const requestPromise = (async () => {
          const query = supabase
            .from('saved_terms')
            .select(
              'id, title, document_type, form_data, created_at, updated_at',
              page === 0 ? { count: 'exact' } : {}
            )
            .eq('document_type', documentType)
            .order(orderBy, { ascending })
            .range(from, to);

          const result = await query;

          if (result.error) throw result.error;

          const validatedData = validateContractsList(result.data || []);

          return {
            data: validatedData,
            count: result.count,
          };
        })();

        pendingRequests.set(requestKey, requestPromise);

        try {
          const result = await requestPromise;

          setData((prevData) =>
            reset ? result.data : [...prevData, ...result.data]
          );

          // Atualizar count apenas na primeira página
          if (page === 0 && result.count !== null) {
            setTotalCount(result.count);
            // Cachear dados da primeira página (memória + localStorage)
            const cacheData = {
              data: result.data,
              count: result.count,
            };
            cacheManager.set(cacheKey, cacheData, 5 * 60 * 1000); // 5 minutos
            persistentCache.set(cacheKey, cacheData, {
              expiresIn: 5 * 60 * 1000, // 5 minutos no localStorage
            });
          }

          setCurrentPage(page);
          setError(null);
        } finally {
          pendingRequests.delete(requestKey);
          setLoading(false);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro desconhecido';
        dbLogger.error('Erro ao carregar dados:', err);
        setError(errorMessage);
        setLoading(false);
      }
    },
    [documentType, limit, orderBy, ascending, cacheKey]
  );

  // Função para recarregar dados (limpa cache)
  const refetch = useCallback(async () => {
    cacheManager.delete(cacheKey);
    persistentCache.delete(cacheKey);
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
