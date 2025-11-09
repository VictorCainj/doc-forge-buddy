/**
 * Testes para os Hooks de Retry Logic
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useRetryLogic,
  useRetryableMutation,
  useCircuitBreaker,
  useFallbackStrategy,
  useRetryMonitoring,
  usePredefinedStrategies
} from '@/hooks/useRetryLogic';
import { NetworkError, ErrorType, defaultRetryConfig } from '@/lib/retry-system';
import { jest } from '@jest/globals';

// Mock dos componentes UI
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant = 'default', ...props }: any) => (
    <span data-variant={variant} {...props}>{children}</span>
  )
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-value={value} />
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@/hooks/shared/use-toast', () => ({
  toast: jest.fn()
}));

// Mock do retry monitoring
jest.mock('@/lib/retry-monitoring', () => ({
  retryMonitor: {
    getMetrics: jest.fn().mockReturnValue({
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      avgRetryDelay: 0,
      maxRetryAttempts: 0,
      errorTypeDistribution: {},
      circuitBreakerState: {}
    }),
    getPerformanceMetrics: jest.fn().mockReturnValue({
      retryOverhead: 0,
      circuitBreakerImpact: 0,
      errorRecoveryRate: 0,
      fallbacksActivated: 0
    }),
    recordRetryAttempt: jest.fn(),
    recordRetrySuccess: jest.fn(),
    recordRetryFailure: jest.fn(),
    updateCircuitBreakerState: jest.fn(),
    reset: jest.fn()
  },
  retryDashboard: {
    startRealTimeMonitoring: jest.fn(),
    stopRealTimeMonitoring: jest.fn(),
    generateHealthReport: jest.fn().mockReturnValue({
      healthScore: 85,
      status: 'healthy',
      recommendations: []
    }),
    subscribe: jest.fn().mockReturnValue(jest.fn())
  },
  useMonitoredRetry: () => ({
    withRetry: jest.fn((operation) => operation()),
    getMetrics: jest.fn().mockReturnValue({
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      avgRetryDelay: 0,
      maxRetryAttempts: 0,
      errorTypeDistribution: {},
      circuitBreakerState: {}
    }),
    getPerformanceMetrics: jest.fn(),
    getAlerts: jest.fn().mockReturnValue([]),
    getHealthReport: jest.fn()
  })
}));

// Mock do queryMonitor
jest.mock('@/lib/queryMonitor', () => ({
  queryMonitor: {
    logEvent: jest.fn()
  }
}));

// Mock do errorHandler
jest.mock('@/lib/errorHandler', () => ({
  errorHandler: {
    handleMutationError: jest.fn(),
    handleQueryError: jest.fn()
  }
}));

// Setup do React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useRetryLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve executar operação com sucesso', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const { result } = renderHook(() => useRetryLogic(operation), {
      wrapper: createWrapper()
    });
    
    await act(async () => {
      await result.current.execute();
    });
    
    expect(result.current.data).toBe('success');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('deve lidar com erro de rede com retry', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new NetworkError('Network error'))
      .mockResolvedValueOnce('success');
    
    const { result } = renderHook(() => useRetryLogic(operation, {
      maxAttempts: 3,
      retryableErrors: [ErrorType.NETWORK_ERROR]
    }), {
      wrapper: createWrapper()
    });
    
    await act(async () => {
      await result.current.execute();
    });
    
    expect(result.current.data).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('deve falhar após todas as tentativas', async () => {
    const error = new NetworkError('Persistent error');
    const operation = jest.fn().mockRejectedValue(error);
    
    const { result } = renderHook(() => useRetryLogic(operation, {
      maxAttempts: 2
    }), {
      wrapper: createWrapper()
    });
    
    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        expect(err).toBe(error);
      }
    });
    
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeNull();
  });

  it('deve resetar estado quando solicitado', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const { result } = renderHook(() => useRetryLogic(operation), {
      wrapper: createWrapper()
    });
    
    // Executar operação
    await act(async () => {
      await result.current.execute();
    });
    
    // Resetar
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('deve calcular se pode fazer retry corretamente', async () => {
    const networkOperation = jest.fn().mockRejectedValue(
      new NetworkError('Network error')
    );
    
    const validationOperation = jest.fn().mockRejectedValue(
      new Error('Validation error')
    );
    
    const { result: networkResult } = renderHook(
      () => useRetryLogic(networkOperation),
      { wrapper: createWrapper() }
    );
    
    const { result: validationResult } = renderHook(
      () => useRetryLogic(validationOperation),
      { wrapper: createWrapper() }
    );
    
    // Para erro de rede
    act(() => {
      networkResult.current.execute().catch(() => {});
    });
    
    await waitFor(() => {
      expect(networkResult.current.canRetry).toBe(true);
    });
    
    // Para erro de validação (padrão não é retryable)
    // Note: o ValidationError não é listado como retryable por padrão
    // então deve retornar false
    expect(validationResult.current.canRetry).toBe(false);
  });

  it('deve retornar health check', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const { result } = renderHook(() => useRetryLogic(operation), {
      wrapper: createWrapper()
    });
    
    await act(async () => {
      await result.current.execute();
    });
    
    expect(result.current.health).toBeDefined();
    expect(result.current.health?.healthScore).toBe(85);
    expect(result.current.health?.status).toBe('healthy');
  });
});

describe('useRetryableMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve executar mutation com sucesso', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ id: 1 });
    
    const { result } = renderHook(() => 
      useRetryableMutation(mutationFn, { variables: { name: 'test' } }),
      { wrapper: createWrapper() }
    );
    
    await act(async () => {
      await result.current.mutate({ name: 'test' });
    });
    
    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('deve fazer retry em caso de erro temporário', async () => {
    const mutationFn = jest.fn()
      .mockRejectedValueOnce(new NetworkError('Network error'))
      .mockResolvedValueOnce({ id: 1 });
    
    const { result } = renderHook(() => 
      useRetryableMutation(mutationFn, {
        variables: { name: 'test' },
        maxAttempts: 3,
        retryableErrors: [ErrorType.NETWORK_ERROR]
      }),
      { wrapper: createWrapper() }
    );
    
    await act(async () => {
      await result.current.mutate({ name: 'test' });
    });
    
    expect(result.current.data).toEqual({ id: 1 });
    expect(mutationFn).toHaveBeenCalledTimes(2);
  });

  it('deve chamar callbacks de sucesso e erro', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ id: 1 });
    const onSuccess = jest.fn();
    const onError = jest.fn();
    
    const { result } = renderHook(() => 
      useRetryableMutation(mutationFn, {
        variables: { name: 'test' },
        onSuccess,
        onError
      }),
      { wrapper: createWrapper() }
    );
    
    await act(async () => {
      await result.current.mutate({ name: 'test' });
    });
    
    expect(onSuccess).toHaveBeenCalledWith(
      { id: 1 },
      { name: 'test' }
    );
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('useCircuitBreaker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve iniciar no estado CLOSED', () => {
    const { result } = renderHook(() => 
      useCircuitBreaker('test-cb', {
        failureThreshold: 3,
        resetTimeout: 5000,
        successThreshold: 2
      }),
      { wrapper: createWrapper() }
    );
    
    expect(result.current.state.status).toBe('CLOSED');
    expect(result.current.isClosed).toBe(true);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isHalfOpen).toBe(false);
  });

  it('deve executar operação quando CLOSED', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const { result } = renderHook(() => 
      useCircuitBreaker('test-cb', {
        failureThreshold: 3,
        resetTimeout: 5000,
        successThreshold: 2
      }),
      { wrapper: createWrapper() }
    );
    
    await act(async () => {
      const data = await result.current.execute(operation);
      expect(data).toBe('success');
    });
    
    expect(operation).toHaveBeenCalledTimes(1);
    expect(result.current.state.status).toBe('CLOSED');
  });

  it('deve abrir após threshold de falhas', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Fail'));
    
    const { result } = renderHook(() => 
      useCircuitBreaker('test-cb', {
        failureThreshold: 2,
        resetTimeout: 5000,
        successThreshold: 1
      }),
      { wrapper: createWrapper() }
    );
    
    // Primeira falha
    await act(async () => {
      try {
        await result.current.execute(operation);
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
    
    expect(result.current.state.status).toBe('CLOSED');
    expect(result.current.state.failures).toBe(1);
    
    // Segunda falha - deve abrir
    await act(async () => {
      try {
        await result.current.execute(operation);
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
    
    expect(result.current.state.status).toBe('OPEN');
    expect(result.current.state.failures).toBe(2);
  });
});

describe('useFallbackStrategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve usar operação primária quando succeeds', async () => {
    const primaryOperation = jest.fn().mockResolvedValue('primary-success');
    const fallbackData = 'fallback-data';
    
    const { result } = renderHook(() => 
      useFallbackStrategy(primaryOperation, fallbackData),
      { wrapper: createWrapper() }
    );
    
    await act(async () => {
      const data = await result.current.execute();
      expect(data).toBe('primary-success');
    });
    
    expect(result.current.strategy).toBe('primary');
    expect(result.current.useFallback).toBe(false);
  });

  it('deve usar fallback quando operação primária falha', async () => {
    const primaryOperation = jest.fn().mockRejectedValue(
      new NetworkError('Network error')
    );
    const fallbackData = { cached: true, timestamp: Date.now() };
    
    const { result } = renderHook(() => 
      useFallbackStrategy(primaryOperation, fallbackData),
      { wrapper: createWrapper() }
    );
    
    await act(async () => {
      const data = await result.current.execute();
      expect(data).toEqual(fallbackData);
    });
    
    expect(result.current.strategy).toBe('fallback');
    expect(result.current.useFallback).toBe(true);
    expect(result.current.data).toEqual(fallbackData);
  });

  it('deve propagar erro quando não há fallback', async () => {
    const primaryOperation = jest.fn().mockRejectedValue(
      new NetworkError('Network error')
    );
    const fallbackData = null;
    
    const { result } = renderHook(() => 
      useFallbackStrategy(primaryOperation, fallbackData),
      { wrapper: createWrapper() }
    );
    
    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
    
    expect(result.current.useFallback).toBe(false);
    expect(result.current.error).toBeDefined();
  });
});

describe('useRetryMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve iniciar monitoramento automaticamente', async () => {
    const { result } = renderHook(() => useRetryMonitoring(true), {
      wrapper: createWrapper()
    });
    
    // Deve começar com métricas null
    expect(result.current.metrics).toBeDefined();
    expect(result.current.isMonitoring).toBe(true);
  });

  it('deve não iniciar monitoramento quando autostart=false', async () => {
    const { result } = renderHook(() => useRetryMonitoring(false), {
      wrapper: createWrapper()
    });
    
    expect(result.current.isMonitoring).toBe(false);
  });

  it('deve refresh métricas', async () => {
    const { result } = renderHook(() => useRetryMonitoring(false), {
      wrapper: createWrapper()
    });
    
    act(() => {
      result.current.refreshMetrics();
    });
    
    expect(result.current.metrics).toBeDefined();
  });

  it('deve resetar monitoramento', async () => {
    const { result } = renderHook(() => useRetryMonitoring(false), {
      wrapper: createWrapper()
    });
    
    act(() => {
      result.current.resetMonitoring();
    });
    
    // Deve ter chamado reset do retryMonitor
    expect(require('@/lib/retry-monitoring').retryMonitor.reset).toHaveBeenCalled();
  });
});

describe('usePredefinedStrategies', () => {
  it('deve retornar estratégias pré-configuradas', () => {
    const { result } = renderHook(() => usePredefinedStrategies(), {
      wrapper: createWrapper()
    });
    
    expect(result.current.critical).toBeDefined();
    expect(result.current.external).toBeDefined();
    expect(result.current.cache).toBeDefined();
    expect(result.current.graceful).toBeDefined();
    
    // Verificar configurações específicas
    expect(result.current.critical.maxAttempts).toBe(1);
    expect(result.current.critical.circuitBreaker).toBe(true);
    
    expect(result.current.external.maxAttempts).toBe(5);
    expect(result.current.external.circuitBreaker).toBe(true);
    
    expect(result.current.cache.maxAttempts).toBe(2);
    expect(result.current.cache.circuitBreaker).toBe(false);
  });
});