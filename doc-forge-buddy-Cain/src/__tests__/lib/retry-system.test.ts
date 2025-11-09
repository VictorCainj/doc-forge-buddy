/**
 * Testes para o Sistema de Retry Logic e Error Handling
 */

import { 
  withRetry, 
  ValidationError, 
  NotFoundError, 
  NetworkError,
  TimeoutError,
  RateLimitError,
  CircuitBreakerError,
  ApplicationError,
  ErrorType,
  CircuitBreaker,
  RecoveryStrategies,
  defaultRetryConfig
} from '@/lib/retry-system';
import { retryMonitor } from '@/lib/retry-monitoring';

// Mock do queryMonitor
jest.mock('@/lib/queryMonitor', () => ({
  queryMonitor: {
    logEvent: jest.fn()
  }
}));

// Mock do console.warn para evitar spam nos testes
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
  jest.clearAllMocks();
  retryMonitor.reset();
});

describe('Retry System', () => {
  // ===========================================
  // 1. TESTS DE RETRY BASICO
  // ===========================================

  describe('withRetry', () => {
    it('deve executar operação com sucesso na primeira tentativa', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('deve fazer retry em caso de erro temporário', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Network error'))
        .mockResolvedValueOnce('success');
      
      const result = await withRetry(operation, {
        maxAttempts: 3,
        retryableErrors: [ErrorType.NETWORK_ERROR]
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('deve falhar após todas as tentativas', async () => {
      const error = new NetworkError('Persistent network error');
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(
        withRetry(operation, { maxAttempts: 2 })
      ).rejects.toThrow('Persistent network error');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('deve respeitar timeout configurado', async () => {
      const slowOperation = jest.fn(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      const timeoutPromise = withRetry(slowOperation, { timeout: 100 });
      
      await expect(timeoutPromise).rejects.toThrow('Operation timed out');
      expect(slowOperation).toHaveBeenCalledTimes(1);
    });

    it('deve usar backoff exponencial', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Error 1'))
        .mockRejectedValueOnce(new NetworkError('Error 2'))
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      await withRetry(operation, {
        maxAttempts: 3,
        exponentialBase: 100,
        backoffMultiplier: 2
      });
      const endTime = Date.now();
      
      // Deve ter esperado pelo menos 200ms (100 * 2^1)
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
    });

    it('deve usar jitter para evitar thundering herd', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Error'))
        .mockResolvedValueOnce('success');
      
      const delays: number[] = [];
      const startTime = Date.now();
      
      await withRetry(operation, {
        maxAttempts: 2,
        exponentialBase: 100,
        jitter: true
      });
      
      const totalTime = Date.now() - startTime;
      // Com jitter, o tempo pode variar significativamente
      expect(totalTime).toBeGreaterThanOrEqual(50);
      expect(totalTime).toBeLessThanOrEqual(200);
    });
  });

  // ===========================================
  // 2. TESTS DE HIERARQUIA DE ERROS
  // ===========================================

  describe('Error Hierarchy', () => {
    it('deve criar ValidationError corretamente', () => {
      const error = new ValidationError('Invalid field', 'email', 'invalid@');
      
      expect(error.message).toBe('Invalid field');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.errorType).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid@');
    });

    it('deve criar NotFoundError corretamente', () => {
      const error = new NotFoundError('User', '123');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.resource).toBe('User');
      expect(error.resourceId).toBe('123');
    });

    it('deve criar NetworkError corretamente', () => {
      const originalError = new Error('Connection failed');
      const error = new NetworkError('Network error', originalError);
      
      expect(error.message).toBe('Network error');
      expect(error.statusCode).toBe(0);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.errorType).toBe(ErrorType.NETWORK_ERROR);
      expect(error.isOperational).toBe(false);
      expect(error.originalError).toBe(originalError);
    });

    it('deve criar TimeoutError corretamente', () => {
      const error = new TimeoutError(5000, 'userData');
      
      expect(error.message).toBe('Operation timed out after 5000ms');
      expect(error.statusCode).toBe(408);
      expect(error.code).toBe('TIMEOUT');
      expect(error.errorType).toBe(ErrorType.TIMEOUT);
      expect(error.timeoutMs).toBe(5000);
      expect(error.operation).toBe('userData');
    });

    it('deve criar RateLimitError corretamente', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.retryAfter).toBe(60);
    });

    it('deve criar CircuitBreakerError corretamente', () => {
      const error = new CircuitBreakerError('Circuit is open', 'OPEN');
      
      expect(error.message).toBe('Circuit is open');
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('CIRCUIT_BREAKER');
      expect(error.state).toBe('OPEN');
    });
  });

  // ===========================================
  // 3. TESTS DE CIRCUIT BREAKER
  // ===========================================

  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 5000,
        successThreshold: 2
      });
    });

    it('deve iniciar no estado CLOSED', () => {
      const state = circuitBreaker.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.failures).toBe(0);
    });

    it('deve permanecer CLOSED quando operações succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      await circuitBreaker.execute(operation);
      await circuitBreaker.execute(operation);
      
      const state = circuitBreaker.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.failures).toBe(0);
    });

    it('deve abrir após threshold de falhas', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Fail'));
      
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      
      const state = circuitBreaker.getState();
      expect(state.state).toBe('OPEN');
      expect(state.failures).toBe(3);
    });

    it('deve ir para HALF_OPEN após timeout', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Fail'));
      
      // Trigger circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      
      // Wait for reset timeout (simulado)
      jest.advanceTimersByTime(5000);
      
      // Próxima operação deve ir para HALF_OPEN
      const stateBefore = circuitBreaker.getState();
      expect(stateBefore.state).toBe('HALF_OPEN');
    });

    it('deve fechar após sucessos suficientes no HALF_OPEN', async () => {
      const fastOperation = jest.fn()
        .mockRejectedValue(new Error('Fail')) // Para abrir
        .mockRejectedValue(new Error('Fail'))
        .mockRejectedValue(new Error('Fail'))
        .mockResolvedValue('success') // HALF_OPEN success 1
        .mockResolvedValue('success'); // HALF_OPEN success 2
      
      // Abrir circuit breaker
      await expect(circuitBreaker.execute(fastOperation)).rejects.toThrow('Fail');
      await expect(circuitBreaker.execute(fastOperation)).rejects.toThrow('Fail');
      await expect(circuitBreaker.execute(fastOperation)).rejects.toThrow('Fail');
      
      // Reset timeout
      jest.advanceTimersByTime(5000);
      
      // Sucessos no HALF_OPEN
      await circuitBreaker.execute(fastOperation);
      await circuitBreaker.execute(fastOperation);
      
      const state = circuitBreaker.getState();
      expect(state.state).toBe('CLOSED');
    });

    it('deve rejeitar operações quando OPEN', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Fail'));
      
      // Abrir circuit breaker
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Fail');
      
      // Próxima operação deve falhar imediatamente
      await expect(circuitBreaker.execute(operation)).rejects.toThrow(CircuitBreakerError);
    });
  });

  // ===========================================
  // 4. TESTS DE ESTRATÉGIAS
  // ===========================================

  describe('Recovery Strategies', () => {
    it('immediateRetry deve ter configuração correta', () => {
      const config = RecoveryStrategies.immediateRetry();
      
      expect(config.maxAttempts).toBe(2);
      expect(config.backoffMultiplier).toBe(1);
      expect(config.maxBackoffTime).toBe(1000);
      expect(config.retryableErrors).toContain(ErrorType.NETWORK_ERROR);
      expect(config.retryableErrors).toContain(ErrorType.TEMPORARY_FAILURE);
      expect(config.circuitBreaker).toBe(false);
    });

    it('exponentialBackoff deve ter configuração correta', () => {
      const config = RecoveryStrategies.exponentialBackoff();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.maxBackoffTime).toBe(60000);
      expect(config.retryableErrors).toContain(ErrorType.RATE_LIMIT);
      expect(config.retryableErrors).toContain(ErrorType.TIMEOUT);
      expect(config.circuitBreaker).toBe(true);
    });

    it('circuitBreakerPattern deve ter configuração correta', () => {
      const config = RecoveryStrategies.circuitBreakerPattern();
      
      expect(config.maxAttempts).toBe(1);
      expect(config.circuitBreaker).toBe(true);
      expect(config.retryableErrors).toContain(ErrorType.TEMPORARY_FAILURE);
      expect(config.retryableErrors).toContain(ErrorType.INTERNAL_ERROR);
    });

    it('gracefulDegradation deve ter configuração correta', () => {
      const fallbackData = { cached: true };
      const config = RecoveryStrategies.gracefulDegradation(fallbackData);
      
      expect(config.useFallback).toBe(true);
      expect(config.fallbackData).toBe(fallbackData);
      expect(config.maxAttempts).toBe(1);
      expect(config.circuitBreaker).toBe(false);
    });
  });

  // ===========================================
  // 5. TESTS DE MONITORAMENTO
  // ===========================================

  describe('Monitoring', () => {
    it('deve registrar tentativa de retry', () => {
      const error = new NetworkError('Test error');
      
      retryMonitor.recordRetryAttempt(error, 1, 1000);
      
      const metrics = retryMonitor.getMetrics();
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.errorTypeDistribution[ErrorType.NETWORK_ERROR]).toBe(1);
      expect(metrics.avgRetryDelay).toBe(1000);
    });

    it('deve registrar sucesso de retry', () => {
      retryMonitor.recordRetrySuccess(2, 5000);
      
      const metrics = retryMonitor.getMetrics();
      expect(metrics.successfulRetries).toBe(1);
    });

    it('deve registrar falha de retry', () => {
      const error = new NetworkError('Test error');
      retryMonitor.recordRetryFailure(error, 3);
      
      const metrics = retryMonitor.getMetrics();
      expect(metrics.failedRetries).toBe(1);
    });

    it('deve atualizar estado do circuit breaker', () => {
      const state = {
        state: 'OPEN' as const,
        failures: 5,
        lastFailureTime: new Date()
      };
      
      retryMonitor.updateCircuitBreakerState('test-cb', state);
      
      const metrics = retryMonitor.getMetrics();
      expect(metrics.circuitBreakerState['test-cb']).toEqual(state);
    });

    it('deve resetar métricas', () => {
      // Adicionar algumas métricas
      retryMonitor.recordRetryAttempt(new NetworkError('error'), 1, 1000);
      retryMonitor.recordRetrySuccess(1, 5000);
      
      // Reset
      retryMonitor.reset();
      
      const metrics = retryMonitor.getMetrics();
      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.successfulRetries).toBe(0);
      expect(metrics.failedRetries).toBe(0);
    });
  });

  // ===========================================
  // 6. TESTS DE INTEGRAÇÃO
  // ===========================================

  describe('Integration', () => {
    it('deve integrar retry com circuit breaker', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Network error'))
        .mockResolvedValueOnce('success');
      
      const config = {
        maxAttempts: 3,
        circuitBreaker: true,
        retryableErrors: [ErrorType.NETWORK_ERROR]
      };
      
      const result = await withRetry(operation, config);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('deve falhar rapidamente para erros não-retryable', async () => {
      const operation = jest.fn().mockRejectedValue(new ValidationError('Invalid'));
      
      await expect(
        withRetry(operation, { maxAttempts: 3 })
      ).rejects.toThrow(ValidationError);
      
      // Deve falhar na primeira tentativa
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('deve usar timeout corretamente com retry', async () => {
      const slowOperation = jest.fn(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new NetworkError('Timeout')), 100);
        })
      );
      
      await expect(
        withRetry(slowOperation, { timeout: 50, maxAttempts: 2 })
      ).rejects.toThrow('Operation timed out');
      
      expect(slowOperation).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================
  // 7. TESTS DE PERFORMANCE
  // ===========================================

  describe('Performance', () => {
    it('deve manter overhead baixo para operações que succeed', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const start = Date.now();
      await withRetry(operation, { maxAttempts: 1 });
      const duration = Date.now() - start;
      
      // Deve completar rapidamente (menos de 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('deve evitar thundering herd com jitter', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        withRetry(
          jest.fn().mockRejectedValueOnce(new NetworkError('Error')).mockResolvedValueOnce('success'),
          { maxAttempts: 2, jitter: true }
        )
      );
      
      const start = Date.now();
      await Promise.all(concurrentOperations);
      const duration = Date.now() - start;
      
      // Com jitter, as operações devem se espalhar no tempo
      // Permitimos um tempo maior devido ao jitter
      expect(duration).toBeGreaterThan(100);
    });
  });
});

// ===========================================
// TESTES DE COMPENSAÇÃO
// ===========================================

describe('Compensation Pattern', () => {
  it('deve executar operação com compensação em caso de erro', async () => {
    const { CompensationPattern } = require('@/lib/retry-system');
    const compensation = new CompensationPattern();
    
    const compensations: Array<() => Promise<void>> = [];
    const mockCompensation = jest.fn().mockResolvedValue(undefined);
    compensations.push(mockCompensation);
    
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    
    await expect(
      compensation.executeWithCompensation(operation, compensations)
    ).rejects.toThrow('Operation failed');
    
    expect(mockCompensation).toHaveBeenCalled();
  });

  it('deve executar múltiplas compensações em ordem reversa', async () => {
    const { CompensationPattern } = require('@/lib/retry-system');
    const compensation = new CompensationPattern();
    
    const calls: number[] = [];
    const compensations: Array<() => Promise<void>> = [
      () => { calls.push(1); return Promise.resolve(); },
      () => { calls.push(2); return Promise.resolve(); }
    ];
    
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    
    await expect(
      compensation.executeWithCompensation(operation, compensations)
    ).rejects.toThrow('Operation failed');
    
    expect(calls).toEqual([2, 1]); // Ordem reversa
  });
});

// ===========================================
// TESTES DE TIMEOUT
// ===========================================

describe('Timeout Handling', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('deve implementar timeout corretamente', async () => {
    const { withTimeout } = require('@/lib/retry-system');
    
    const slowOperation = jest.fn(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    const timeoutPromise = withTimeout(slowOperation(), 500);
    
    jest.advanceTimersByTime(500);
    
    await expect(timeoutPromise).rejects.toThrow('Operation timed out');
  });
});