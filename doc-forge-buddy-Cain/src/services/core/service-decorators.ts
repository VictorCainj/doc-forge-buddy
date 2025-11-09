/**
 * Service Decorators - Decorators para services
 * Implementa cross-cutting concerns como logging, caching, retry, validation
 */

import { ServiceContext, ServiceMetrics } from './interfaces';

// === Base Decorator Class ===

export abstract class ServiceDecorator<T> {
  constructor(protected target: T) {}

  // Proxy para o service original
  protected getTarget(): T {
    return this.target;
  }

  // Método chamado antes de cada operação
  protected beforeOperation(operation: string, ...args: unknown[]): void {}

  // Método chamado depois de cada operação
  protected afterOperation(operation: string, result: unknown, ...args: unknown[]): void {}

  // Método chamado quando há erro
  protected onError(operation: string, error: Error, ...args: unknown[]): void {}
}

// === Logging Decorator ===

export function Loggable(config?: {
  level?: 'debug' | 'info' | 'warn' | 'error';
  includeArgs?: boolean;
  includeResult?: boolean;
}) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      private logger = {
        level: config?.level || 'info',
        includeArgs: config?.includeArgs ?? false,
        includeResult: config?.includeResult ?? true
      };

      private log(level: string, message: string, data?: unknown): void {
        if (this.shouldLog(level)) {
          console[level as keyof Console](`[${constructor.name}] ${message}`, data);
        }
      }

      private shouldLog(level: string): boolean {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.logger.level);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
      }

      // Override methods to add logging (simplified - would need more complex proxy)
      protected beforeOperation(operation: string, ...args: unknown[]): void {
        this.log('info', `Starting operation: ${operation}`, 
          this.logger.includeArgs ? args : undefined);
      }

      protected afterOperation(operation: string, result: unknown, ...args: unknown[]): void {
        this.log('info', `Completed operation: ${operation}`, 
          this.logger.includeResult ? { result } : undefined);
      }

      protected onError(operation: string, error: Error, ...args: unknown[]): void {
        this.log('error', `Error in operation: ${operation}`, { error: error.message, args });
      }
    };
  };
}

// === Caching Decorator ===

export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  keyGenerator?: (...args: any[]) => string;
  maxSize?: number;
}

export function Cacheable(config?: CacheConfig) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      private cache = new Map<string, { value: any; timestamp: number }>();
      private config = { ttl: 300000, maxSize: 100, ...config }; // 5min default

      private generateCacheKey(methodName: string, ...args: any[]): string {
        if (config?.keyGenerator) {
          return config.keyGenerator(...args);
        }
        return `${constructor.name}_${methodName}_${JSON.stringify(args)}`;
      }

      private isValid(timestamp: number): boolean {
        return Date.now() - timestamp < this.config.ttl!;
      }

      private cleanupCache(): void {
        if (this.cache.size > this.config.maxSize!) {
          const entries = Array.from(this.cache.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
          
          const toRemove = entries.slice(0, entries.length - this.config.maxSize!);
          for (const [key] of toRemove) {
            this.cache.delete(key);
          }
        }
      }

      // Simplified cache implementation
      getCached<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && this.isValid(cached.timestamp)) {
          return cached.value;
        }
        this.cache.delete(key);
        return null;
      }

      setCached<T>(key: string, value: T): void {
        this.cleanupCache();
        this.cache.set(key, { value, timestamp: Date.now() });
      }

      invalidateCache(pattern?: string): void {
        if (pattern) {
          for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
              this.cache.delete(key);
            }
          }
        } else {
          this.cache.clear();
        }
      }
    };
  };
}

// === Retry Decorator ===

export interface RetryConfig {
  attempts?: number;
  delay?: number;
  backoff?: number;
  retryOn?: (error: any) => boolean;
}

export function Retryable(config?: RetryConfig) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      private config = {
        attempts: 3,
        delay: 1000,
        backoff: 2,
        ...config
      };

      private async retryOperation<T>(
        operation: () => Promise<T>,
        ...args: any[]
      ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= this.config.attempts!; attempt++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error as Error;
            
            if (attempt === this.config.attempts) {
              throw error;
            }

            if (config?.retryOn && !config.retryOn(error)) {
              throw error;
            }

            // Wait before retry
            const delay = this.config.delay! * Math.pow(this.config.backoff!, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        throw lastError!;
      }
    };
  };
}

// === Metrics Decorator ===

export function Monitorable(config?: {
  trackPerformance?: boolean;
  trackErrors?: boolean;
  customMetrics?: string[];
}) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      private metrics: ServiceMetrics[] = [];
      private config = {
        trackPerformance: true,
        trackErrors: true,
        ...config
      };

      recordMetric(metric: ServiceMetrics): void {
        this.metrics.push(metric);
      }

      getMetrics(): ServiceMetrics[] {
        return [...this.metrics];
      }

      clearMetrics(): void {
        this.metrics = [];
      }

      getAverageExecutionTime(operationName?: string): number {
        const relevantMetrics = this.metrics.filter(m => 
          !operationName || m.operationName === operationName
        );
        
        if (relevantMetrics.length === 0) return 0;
        
        const totalTime = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
        return totalTime / relevantMetrics.length;
      }

      getErrorRate(operationName?: string): number {
        const relevantMetrics = this.metrics.filter(m => 
          !operationName || m.operationName === operationName
        );
        
        if (relevantMetrics.length === 0) return 0;
        
        const errors = relevantMetrics.filter(m => !m.success).length;
        return errors / relevantMetrics.length;
      }
    };
  };
}

// === Validation Decorator ===

export function Validatable(config?: {
  validateInput?: boolean;
  validateOutput?: boolean;
  strict?: boolean;
}) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      private config = {
        validateInput: true,
        validateOutput: false,
        strict: false,
        ...config
      };

      protected validate(data: any, type: 'input' | 'output'): boolean {
        if (type === 'input' && !this.config.validateInput) return true;
        if (type === 'output' && !this.config.validateOutput) return true;

        // Simplified validation - in real implementation would use schemas
        if (data === null || data === undefined) {
          if (this.config.strict) {
            throw new Error(`${type} validation failed: data is null/undefined`);
          }
          return false;
        }

        return true;
      }
    };
  };
}

// === Transaction Decorator ===

export function Transactional(config?: {
  isolation?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
  timeout?: number;
}) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      private config = {
        isolation: 'read_committed',
        timeout: 30000,
        ...config
      };

      private async executeInTransaction<T>(operation: () => Promise<T>): Promise<T> {
        // Simplified transaction implementation
        // In real implementation would use database transactions
        try {
          // Start transaction
          this.log('Starting transaction');
          
          const result = await operation();
          
          // Commit transaction
          this.log('Committing transaction');
          
          return result;
        } catch (error) {
          // Rollback transaction
          this.log('Rolling back transaction', error);
          throw error;
        }
      }

      private log(message: string, data?: unknown): void {
        console.log(`[${constructor.name}] ${message}`, data);
      }
    };
  };
}

// === Rate Limiting Decorator ===

export interface RateLimitConfig {
  maxRequests?: number;
  windowMs?: number;
  keyGenerator?: (args: any[]) => string;
}

export function RateLimited(config?: RateLimitConfig) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      private config = {
        maxRequests: 10,
        windowMs: 60000, // 1 minute
        ...config
      };

      private requests = new Map<string, number[]>();

      private generateKey(methodName: string, ...args: any[]): string {
        if (config?.keyGenerator) {
          return config.keyGenerator(args);
        }
        return `${constructor.name}_${methodName}`;
      }

      private isRateLimited(key: string): boolean {
        const now = Date.now();
        const windowStart = now - this.config.windowMs!;
        
        if (!this.requests.has(key)) {
          this.requests.set(key, []);
        }

        const requests = this.requests.get(key)!;
        
        // Remove old requests
        const recentRequests = requests.filter(time => time > windowStart);
        this.requests.set(key, recentRequests);

        if (recentRequests.length >= this.config.maxRequests!) {
          return true;
        }

        recentRequests.push(now);
        return false;
      }

      checkRateLimit(methodName: string, ...args: any[]): boolean {
        const key = this.generateKey(methodName, ...args);
        return this.isRateLimited(key);
      }

      getRemainingRequests(methodName: string, ...args: any[]): number {
        const key = this.generateKey(methodName, ...args);
        const requests = this.requests.get(key) || [];
        const now = Date.now();
        const windowStart = now - this.config.windowMs!;
        const recentRequests = requests.filter(time => time > windowStart);
        
        return Math.max(0, this.config.maxRequests! - recentRequests.length);
      }
    };
  };
}

// === Security Decorator ===

export function Secure(config?: {
  requireAuth?: boolean;
  requireRole?: string | string[];
  encryptData?: boolean;
  sanitizeInput?: boolean;
}) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      private config = {
        requireAuth: false,
        requireRole: undefined,
        encryptData: false,
        sanitizeInput: true,
        ...config
      };

      private sanitizeInput(input: any): any {
        if (!this.config.sanitizeInput || typeof input !== 'string') {
          return input;
        }

        // Basic sanitization - remove potentially dangerous characters
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }

      private checkAuth(context?: ServiceContext): boolean {
        if (!this.config.requireAuth) return true;
        return !!(context?.userId);
      }

      private checkRole(context?: ServiceContext): boolean {
        if (!this.config.requireRole) return true;
        if (!context?.metadata?.roles) return false;

        const userRoles = context.metadata.roles as string[];
        const requiredRoles = Array.isArray(this.config.requireRole) 
          ? this.config.requireRole 
          : [this.config.requireRole];

        return requiredRoles.some(role => userRoles.includes(role));
      }

      protected validateSecurity(context?: ServiceContext): boolean {
        return this.checkAuth(context) && this.checkRole(context);
      }
    };
  };
}

// === Composite Decorator ===

export function CompositeDecorator(...decorators: Function[]) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    return decorators.reduce((acc, decorator) => decorator(acc), constructor);
  };
}

// === Usage Example ===

/*
@Loggable({ level: 'info', includeArgs: true })
@Cacheable({ ttl: 300000 })
@Retryable({ attempts: 3, delay: 1000 })
@Monitorable({ trackPerformance: true })
@Validatable({ validateInput: true, validateOutput: false })
@RateLimited({ maxRequests: 10, windowMs: 60000 })
class MyService {
  async myMethod(data: any): Promise<any> {
    // Method implementation
  }
}
*/