/**
 * Sistema Robusto de Retry Logic e Error Handling
 * 
 * Implementa retry strategy, circuit breaker, error hierarchy e recovery patterns
 */

import { toast } from '@/hooks/shared/use-toast';
import { queryMonitor } from './queryMonitor';
import { errorHandler } from './errorHandler';

// ===========================================
// 1. TIPOS E INTERFACES
// ===========================================

// Configuração de retry
export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  maxBackoffTime: number;
  retryableErrors: ErrorType[];
  circuitBreaker: boolean;
  timeout: number;
  jitter: boolean;
  exponentialBase: number;
}

// Tipos de erro para retry
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  TEMPORARY_FAILURE = 'TEMPORARY_FAILURE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// ===========================================
// 2. HIERARQUIA DE ERROS
// ===========================================

// Classe base de erro da aplicação
export abstract class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public isOperational: boolean = true,
    public errorType: ErrorType = ErrorType.UNKNOWN,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Erro de validação
export class ValidationError extends ApplicationError {
  constructor(message: string, public field?: string, public value?: any) {
    super(message, 'VALIDATION_ERROR', 400, true, ErrorType.VALIDATION_ERROR, {
      field,
      value
    });
  }
}

// Erro de não encontrado
export class NotFoundError extends ApplicationError {
  constructor(resource: string, public resourceId?: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, true, ErrorType.NOT_FOUND, {
      resource,
      resourceId
    });
  }
}

// Erro de regra de negócio
export class BusinessRuleError extends ApplicationError {
  constructor(message: string, public rule?: string) {
    super(message, 'BUSINESS_RULE_ERROR', 422, true, ErrorType.TEMPORARY_FAILURE, {
      rule
    });
  }
}

// Erro de rede
export class NetworkError extends ApplicationError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'NETWORK_ERROR', 0, false, ErrorType.NETWORK_ERROR, {
      originalError: originalError?.message
    });
  }
}

// Erro de timeout
export class TimeoutError extends ApplicationError {
  constructor(timeoutMs: number, operation?: string) {
    super(`Operation timed out after ${timeoutMs}ms`, 'TIMEOUT', 408, true, ErrorType.TIMEOUT, {
      timeoutMs,
      operation
    });
  }
}

// Erro de rate limit
export class RateLimitError extends ApplicationError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429, true, ErrorType.RATE_LIMIT, {
      retryAfter
    });
  }
}

// Erro de circuit breaker
export class CircuitBreakerError extends ApplicationError {
  constructor(message: string, public state: 'OPEN' | 'HALF_OPEN' = 'OPEN') {
    super(message, 'CIRCUIT_BREAKER', 503, true, ErrorType.TEMPORARY_FAILURE, {
      circuitBreakerState: state
    });
  }
}

// ===========================================
// 3. CIRCUIT BREAKER PATTERN
// ===========================================

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime?: Date;
  private successesInHalfOpen = 0;
  
  constructor(
    private config: {
      failureThreshold: number;
      resetTimeout: number;
      successThreshold: number;
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        queryMonitor.logEvent('circuit_breaker_half_open', {
          timestamp: new Date()
        });
      } else {
        throw new CircuitBreakerError('Circuit breaker is OPEN', 'OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successesInHalfOpen++;
      if (this.successesInHalfOpen >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.successesInHalfOpen = 0;
        queryMonitor.logEvent('circuit_breaker_closed', {
          timestamp: new Date()
        });
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.state === 'HALF_OPEN' || this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.successesInHalfOpen = 0;
      queryMonitor.logEvent('circuit_breaker_opened', {
        failures: this.failures,
        timestamp: new Date()
      });
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime.getTime() >= this.config.resetTimeout;
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// ===========================================
// 4. CONFIGURAÇÕES DEFAULT
// ===========================================

export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  maxBackoffTime: 30000, // 30 segundos
  retryableErrors: [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT,
    ErrorType.RATE_LIMIT,
    ErrorType.TEMPORARY_FAILURE
  ],
  circuitBreaker: true,
  timeout: 30000, // 30 segundos
  jitter: true,
  exponentialBase: 1000 // 1 segundo base
};

// Circuit breaker default
export const defaultCircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minuto
  successThreshold: 3
};

// ===========================================
// 5. RETRY DECORATOR
// ===========================================

export function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  const circuitBreaker = config.circuitBreaker 
    ? new CircuitBreaker(defaultCircuitBreakerConfig)
    : null;

  return retryWithConfig(operation, config, circuitBreaker, 0);
}

async function retryWithConfig<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  circuitBreaker: CircuitBreaker | null,
  attempt: number
): Promise<T> {
  const executeOperation = async (): Promise<T> => {
    // Aplicar timeout se configurado
    if (config.timeout > 0) {
      return withTimeout(operation(), config.timeout);
    }
    return operation();
  };

  try {
    // Usar circuit breaker se configurado
    const result = circuitBreaker
      ? await circuitBreaker.execute(executeOperation)
      : await executeOperation();

    // Log de sucesso
    if (attempt > 0) {
      queryMonitor.logEvent('retry_success', {
        attempt: attempt + 1,
        timestamp: new Date()
      });
    }

    return result;
  } catch (error) {
    const appError = toApplicationError(error);
    
    // Verificar se deve tentar novamente
    if (shouldRetry(appError, config, attempt)) {
      const delay = calculateBackoff(config, attempt);
      
      queryMonitor.logEvent('retry_attempt', {
        error: appError.message,
        errorType: appError.errorType,
        attempt: attempt + 1,
        maxAttempts: config.maxAttempts,
        delay,
        timestamp: new Date()
      });

      // Aguardar antes do próximo retry
      await sleep(delay);
      
      return retryWithConfig(operation, config, circuitBreaker, attempt + 1);
    }

    // Não fazer mais retry, propagar erro
    throw appError;
  }
}

function shouldRetry(error: ApplicationError, config: RetryConfig, attempt: number): boolean {
  // Verificar número máximo de tentativas
  if (attempt >= config.maxAttempts - 1) {
    return false;
  }

  // Verificar se o tipo de erro é retryable
  if (!config.retryableErrors.includes(error.errorType)) {
    return false;
  }

  // Para rate limit, respeitar retry-after header
  if (error instanceof RateLimitError && error.retryAfter) {
    return true;
  }

  // Para circuit breaker open, não retry
  if (error instanceof CircuitBreakerError) {
    return false;
  }

  return true;
}

function calculateBackoff(config: RetryConfig, attempt: number): number {
  let delay = config.exponentialBase * Math.pow(config.backoffMultiplier, attempt);
  
  // Aplicar jitter para evitar thundering herd
  if (config.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  // Limitar ao máximo configurado
  return Math.min(delay, config.maxBackoffTime);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toApplicationError(error: any): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  // Mapear erros conhecidos
  if (error?.name === 'TypeError' && error.message.includes('fetch')) {
    return new NetworkError('Network request failed', error);
  }

  if (error?.code === 'ETIMEDOUT' || error?.code === 'ENOTFOUND') {
    return new NetworkError('Network connectivity issue', error);
  }

  if (error?.status === 429) {
    return new RateLimitError('Rate limit exceeded', error.retryAfter);
  }

  if (error?.status === 404) {
    return new NotFoundError('Resource not found');
  }

  if (error?.status === 400) {
    return new ValidationError('Invalid request', 'general', error);
  }

  // Erro genérico
  return new ApplicationError(
    error?.message || 'Unknown error',
    'UNKNOWN_ERROR',
    500,
    false,
    ErrorType.UNKNOWN,
    { originalError: error }
  );
}

// ===========================================
// 6. ESTRATÉGIAS DE RECUPERAÇÃO
// ===========================================

// Fallback strategies
export class RecoveryStrategies {
  
  // Immediate retry para erros temporários
  static immediateRetry = (config?: Partial<RetryConfig>) => ({
    maxAttempts: 2,
    backoffMultiplier: 1,
    maxBackoffTime: 1000,
    retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.TEMPORARY_FAILURE],
    circuitBreaker: false,
    timeout: 5000,
    jitter: false,
    exponentialBase: 0,
    ...config
  });

  // Exponential backoff para rate limiting
  static exponentialBackoff = (config?: Partial<RetryConfig>) => ({
    maxAttempts: 5,
    backoffMultiplier: 2,
    maxBackoffTime: 60000,
    retryableErrors: [ErrorType.RATE_LIMIT, ErrorType.TIMEOUT],
    circuitBreaker: true,
    timeout: 30000,
    jitter: true,
    exponentialBase: 1000,
    ...config
  });

  // Circuit breaker para serviços indisponíveis
  static circuitBreakerPattern = (config?: Partial<RetryConfig>) => ({
    maxAttempts: 1,
    backoffMultiplier: 1,
    maxBackoffTime: 0,
    retryableErrors: [ErrorType.TEMPORARY_FAILURE, ErrorType.INTERNAL_ERROR],
    circuitBreaker: true,
    timeout: 10000,
    jitter: false,
    exponentialBase: 0,
    ...config
  });

  // Graceful degradation
  static gracefulDegradation = (fallbackData: any) => ({
    useFallback: true,
    fallbackData,
    maxAttempts: 1,
    circuitBreaker: false
  });
}

// Hook para usar com React Query
export function useRetryableOperation() {
  return {
    withRetry,
    withTimeout,
    CircuitBreaker,
    RecoveryStrategies
  };
}

// ===========================================
// 7. COMPENSATION PATTERNS
// ===========================================

export class CompensationPattern {
  private compensations: Array<() => Promise<void>> = [];

  addCompensation(compensation: () => Promise<void>) {
    this.compensations.push(compensation);
  }

  async executeWithCompensation<T>(
    operation: () => Promise<T>,
    compensations: Array<() => Promise<void>> = []
  ): Promise<T> {
    this.compensations = [...compensations];

    try {
      return await operation();
    } catch (error) {
      await this.compensate();
      throw error;
    }
  }

  private async compensate() {
    const failures: Error[] = [];
    
    // Executar compensations em ordem reversa
    for (const compensation of this.compensations.reverse()) {
      try {
        await compensation();
      } catch (error) {
        failures.push(error);
        queryMonitor.logEvent('compensation_failed', {
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    if (failures.length > 0) {
      queryMonitor.logEvent('compensation_completed_with_failures', {
        totalCompensations: this.compensations.length,
        failedCompensations: failures.length,
        timestamp: new Date()
      });
    }
  }
}