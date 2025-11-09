/**
 * Hook para Retry Logic e Error Handling Robusto
 * 
 * Integra com React Query para fornecer retry automático, circuit breaker
 * e monitoramento de performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  withRetry, 
  RetryConfig, 
  defaultRetryConfig,
  CircuitBreaker,
  ApplicationError,
  ErrorType,
  RecoveryStrategies
} from '@/lib/retry-system';
import { 
  retryMonitor, 
  retryDashboard,
  useMonitoredRetry,
  RetryMetrics,
  PerformanceMetrics 
} from '@/lib/retry-monitoring';
import { toast } from '@/hooks/shared/use-toast';

// ===========================================
// 1. HOOK PRINCIPAL
// ===========================================

export function useRetryLogic<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApplicationError | null>(null);
  const [metrics, setMetrics] = useState<RetryMetrics | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);

  const finalConfig = useMemo(() => ({ ...defaultRetryConfig, ...config }), [config]);
  const monitoredRetry = useMonitoredRetry();

  // Executar operação com retry
  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await monitoredRetry.withRetry(operation, finalConfig);
      setData(result);
      return result;
    } catch (err) {
      const appError = err as ApplicationError;
      setError(appError);
      
      // Notificar usuário baseado no tipo de erro
      notifyUser(appError);
      throw appError;
    } finally {
      setIsLoading(false);
      // Atualizar métricas
      setTimeout(() => {
        setMetrics(monitoredRetry.getMetrics());
        setPerformance(monitoredRetry.getPerformanceMetrics());
      }, 100);
    }
  }, [operation, finalConfig, monitoredRetry]);

  // Resetar estado
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Health check
  const health = useMemo(() => {
    if (!metrics) return null;
    return retryDashboard.generateHealthReport();
  }, [metrics]);

  return {
    // Estado
    data,
    error,
    isLoading,
    metrics,
    performance,
    health,
    
    // Ações
    execute,
    reset,
    
    // Utilitários
    canRetry: !error || (error && [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT,
      ErrorType.RATE_LIMIT,
      ErrorType.TEMPORARY_FAILURE
    ].includes(error.errorType)),
    
    shouldShowFallback: error && !error.isOperational
  };
}

// ===========================================
// 2. HOOK PARA MUTATIONS COM RETRY
// ===========================================

export function useRetryableMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config: Partial<RetryConfig> & {
    variables: TVariables;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApplicationError, variables: TVariables) => void;
  }
) {
  const [state, setState] = useState<{
    data: TData | null;
    error: ApplicationError | null;
    isLoading: boolean;
  }>({
    data: null,
    error: null,
    isLoading: false
  });

  const finalConfig = useMemo(() => ({ 
    ...defaultRetryConfig, 
    ...config 
  }), [config]);

  const mutate = useCallback(async (variables: TVariables) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await withRetry(
        () => mutationFn(variables),
        finalConfig
      );
      
      setState({
        data: result,
        error: null,
        isLoading: false
      });

      config.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const appError = err as ApplicationError;
      setState({
        data: null,
        error: appError,
        isLoading: false
      });

      config.onError?.(appError, variables);
      throw appError;
    }
  }, [mutationFn, finalConfig, config]);

  return {
    ...state,
    mutate,
    mutateAsync: mutate
  };
}

// ===========================================
// 3. HOOK PARA CIRCUIT BREAKER
// ===========================================

export function useCircuitBreaker(
  name: string,
  config: {
    failureThreshold: number;
    resetTimeout: number;
    successThreshold: number;
  }
) {
  const [state, setState] = useState<{
    status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    lastFailureTime?: Date;
  }>({
    status: 'CLOSED',
    failures: 0
  });

  const circuitBreaker = useMemo(() => new CircuitBreaker(config), [config]);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    const result = await circuitBreaker.execute(operation);
    
    // Atualizar estado do circuit breaker
    const cbState = circuitBreaker.getState();
    setState({
      status: cbState.state,
      failures: cbState.failures,
      lastFailureTime: cbState.lastFailureTime
    });

    // Atualizar monitoramento
    retryMonitor.updateCircuitBreakerState(name, {
      state: cbState.state,
      failures: cbState.failures,
      lastFailureTime: cbState.lastFailureTime
    });

    return result;
  }, [circuitBreaker, name]);

  const reset = useCallback(() => {
    // Reset manual do circuit breaker (apenas para emergências)
    setState({
      status: 'CLOSED',
      failures: 0
    });
    
    // Não podemos resetar o circuit breaker internamente
    //Isso deve ser feito através de uma ação administrativa
  }, []);

  return {
    state,
    execute,
    reset,
    isClosed: state.status === 'CLOSED',
    isOpen: state.status === 'OPEN',
    isHalfOpen: state.status === 'HALF_OPEN'
  };
}

// ===========================================
// 4. HOOK PARA FALLBACK STRATEGIES
// ===========================================

export function useFallbackStrategy<T>(
  primaryOperation: () => Promise<T>,
  fallbackData: T | null = null,
  config: Partial<RetryConfig> = {}
) {
  const [state, setState] = useState<{
    data: T | null;
    error: ApplicationError | null;
    isLoading: boolean;
    useFallback: boolean;
    strategy: 'primary' | 'fallback';
  }>({
    data: null,
    error: null,
    isLoading: false,
    useFallback: false,
    strategy: 'primary'
  });

  const finalConfig = useMemo(() => ({ 
    ...defaultRetryConfig,
    ...config,
    maxAttempts: config.maxAttempts || 1 // Só uma tentativa para fallback
  }), [config]);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, useFallback: false }));

    try {
      // Tentar operação primária
      const result = await withRetry(primaryOperation, finalConfig);
      
      setState({
        data: result,
        error: null,
        isLoading: false,
        useFallback: false,
        strategy: 'primary'
      });

      return result;
    } catch (error) {
      // Se a operação primária falhar e temos fallback, usar fallback
      if (fallbackData !== null) {
        setState({
          data: fallbackData,
          error: error as ApplicationError,
          isLoading: false,
          useFallback: true,
          strategy: 'fallback'
        });

        toast({
          title: "Usando dados em cache",
          description: "Alguns dados podem estar desatualizados devido a problemas de conectividade.",
          variant: "default"
        });

        return fallbackData;
      }

      // Sem fallback disponível
      setState({
        data: null,
        error: error as ApplicationError,
        isLoading: false,
        useFallback: false,
        strategy: 'primary'
      });

      throw error;
    }
  }, [primaryOperation, fallbackData, finalConfig]);

  return {
    ...state,
    execute
  };
}

// ===========================================
// 5. HOOK PARA MONITORAMENTO EM TEMPO REAL
// ===========================================

export function useRetryMonitoring(autostart = true) {
  const [metrics, setMetrics] = useState<RetryMetrics | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!autostart) return;

    setIsMonitoring(true);
    retryDashboard.startRealTimeMonitoring(5000); // 5 segundos

    const unsubscribe = retryDashboard.subscribe((metrics) => {
      setMetrics(metrics);
      setAlerts(retryMonitor.getAlerts(10));
    });

    return () => {
      retryDashboard.stopRealTimeMonitoring();
      unsubscribe();
      setIsMonitoring(false);
    };
  }, [autostart]);

  const refreshMetrics = useCallback(() => {
    setMetrics(retryMonitor.getMetrics());
    setAlerts(retryMonitor.getAlerts(10));
  }, []);

  const getHealthReport = useCallback(() => {
    return retryDashboard.generateHealthReport();
  }, []);

  const resetMonitoring = useCallback(() => {
    retryMonitor.reset();
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    metrics,
    alerts,
    isMonitoring,
    refreshMetrics,
    getHealthReport,
    resetMonitoring,
    startMonitoring: () => retryDashboard.startRealTimeMonitoring(),
    stopMonitoring: () => retryDashboard.stopRealTimeMonitoring()
  };
}

// ===========================================
// 6. HOOK PARA ESTRATÉGIAS PRÉ-CONFIGURADAS
// ===========================================

export function usePredefinedStrategies() {
  const strategies = useMemo(() => ({
    // Para operações críticas (ex: pagamentos)
    critical: RecoveryStrategies.circuitBreakerPattern({
      timeout: 5000,
      maxAttempts: 1
    }),
    
    // Para APIs externas (ex: webhook)
    external: RecoveryStrategies.exponentialBackoff({
      maxAttempts: 5,
      timeout: 15000
    }),
    
    // Para operações de cache
    cache: RecoveryStrategies.immediateRetry({
      maxAttempts: 2,
      timeout: 2000
    }),
    
    // Para operações que podem degradar
    graceful: RecoveryStrategies.gracefulDegradation(null) // Será definido pelo usuário
  }), []);

  return strategies;
}

// ===========================================
// 7. UTILITÁRIOS
// ===========================================

// Notificar usuário baseado no tipo de erro
function notifyUser(error: ApplicationError) {
  const { toast: toastImpl } = { toast };

  switch (error.errorType) {
    case ErrorType.NETWORK_ERROR:
      toastImpl({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente.",
        variant: "destructive"
      });
      break;

    case ErrorType.RATE_LIMIT:
      toastImpl({
        title: "Muitas tentativas",
        description: "Aguarde um momento antes de tentar novamente.",
        variant: "destructive"
      });
      break;

    case ErrorType.TIMEOUT:
      toastImpl({
        title: "Operação demorou muito",
        description: "A operação foi cancelada por timeout.",
        variant: "destructive"
      });
      break;

    case ErrorType.CIRCUIT_BREAKER:
      toastImpl({
        title: "Serviço temporariamente indisponível",
        description: "O serviço está com problemas. Tente novamente em alguns minutos.",
        variant: "destructive"
      });
      break;

    default:
      if (error.statusCode >= 500) {
        toastImpl({
          title: "Erro do servidor",
          description: "Estamos com problemas técnicos. Tente novamente em alguns minutos.",
          variant: "destructive"
        });
      }
  }
}

// Hook para error boundary integration
export function useRetryErrorHandler() {
  const handleRetry = useCallback((retryFn: () => void) => {
    toast({
      title: "Algo deu errado",
      description: "Deseja tentar novamente?",
      variant: "default",
      action: {
        label: "Tentar novamente",
        onClick: retryFn
      }
    });
  }, []);

  return { handleRetry };
}

// Cleanup na destruição da página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    retryDashboard.stopRealTimeMonitoring();
  });
}