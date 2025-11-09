/**
 * BaseService - Implementação base para todos os services
 * Fornece funcionalidades comuns como validação, logging, métricas e tratamento de erros
 */

import { 
  IService, 
  IValidatableService, 
  IEventSourcedService, 
  ITransactionalService,
  ServiceContext,
  ServiceConfig,
  ServiceMetrics,
  ValidationResult,
  ValidationError
} from './interfaces';
import { SearchFilters, PaginationOptions, PaginatedResult, ApiResponse, OperationCallbacks } from '@/types/domain/common';

export abstract class BaseService<T, CreateDTO, UpdateDTO> implements 
  IService<T, CreateDTO, UpdateDTO>,
  IValidatableService<T, CreateDTO, UpdateDTO>,
  IEventSourcedService<T, CreateDTO, UpdateDTO>,
  ITransactionalService<T, CreateDTO, UpdateDTO> {

  protected config: ServiceConfig;
  protected context: ServiceContext;
  private metrics: ServiceMetrics[] = [];
  private eventHandlers: Map<string, Array<(event: unknown) => void>> = new Map();
  private transactionActive = false;
  private transactionData: Array<() => Promise<unknown>> = [];

  constructor(config: ServiceConfig, context: ServiceContext = {}) {
    this.config = {
      timeout: 30000, // 30 segundos
      retryAttempts: 3,
      enableMetrics: true,
      enableValidation: true,
      enableLogging: true,
      ...config
    };
    this.context = context;
  }

  // === CRUD Operations ===
  async create(data: CreateDTO, callbacks?: OperationCallbacks<T>): Promise<T> {
    return this.executeWithMetrics('create', async () => {
      try {
        callbacks?.onStart?.('create');

        // Validação
        if (this.config.enableValidation) {
          const validation = await this.validateCreate(data);
          if (!validation.isValid) {
            throw new ValidationErrorCollection(validation.errors);
          }
        }

        // Verificar se está em transação
        if (this.transactionActive) {
          const result = await this.createWithTransaction(data);
          this.transactionData.push(async () => result);
          return result;
        }

        const result = await this.doCreate(data);
        
        // Publicar evento
        await this.publishEvent({ type: 'entity.created', data: result, entity: 'unknown' });

        callbacks?.onSuccess?.('create', result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logError('create', errorMessage);
        callbacks?.onError?.('create', error as Error);
        throw error;
      } finally {
        callbacks?.onComplete?.('create');
      }
    });
  }

  async update(id: string, data: UpdateDTO, callbacks?: OperationCallbacks<T>): Promise<T> {
    return this.executeWithMetrics('update', async () => {
      try {
        callbacks?.onStart?.('update');

        // Verificar se a entidade existe
        if (!(await this.exists(id))) {
          throw new Error(`Entity with id ${id} not found`);
        }

        // Validação
        if (this.config.enableValidation) {
          const validation = await this.validateUpdate(id, data);
          if (!validation.isValid) {
            throw new ValidationErrorCollection(validation.errors);
          }
        }

        // Verificar se está em transação
        if (this.transactionActive) {
          const result = await this.updateWithTransaction(id, data);
          this.transactionData.push(async () => result);
          return result;
        }

        const result = await this.doUpdate(id, data);
        
        // Publicar evento
        await this.publishEvent({ type: 'entity.updated', data: result, entity: 'unknown', id });

        callbacks?.onSuccess?.('update', result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logError('update', errorMessage);
        callbacks?.onError?.('update', error as Error);
        throw error;
      } finally {
        callbacks?.onComplete?.('update');
      }
    });
  }

  async delete(id: string, callbacks?: OperationCallbacks<T>): Promise<void> {
    return this.executeWithMetrics('delete', async () => {
      try {
        callbacks?.onStart?.('delete');

        // Verificar se a entidade existe
        if (!(await this.exists(id))) {
          throw new Error(`Entity with id ${id} not found`);
        }

        // Verificar se está em transação
        if (this.transactionActive) {
          const result = await this.deleteWithTransaction(id);
          this.transactionData.push(async () => result);
          return result;
        }

        await this.doDelete(id);
        
        // Publicar evento
        await this.publishEvent({ type: 'entity.deleted', entity: 'unknown', id });

        callbacks?.onSuccess?.('delete');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logError('delete', errorMessage);
        callbacks?.onError?.('delete', error as Error);
        throw error;
      } finally {
        callbacks?.onComplete?.('delete');
      }
    });
  }

  async findById(id: string): Promise<T | null> {
    return this.executeWithMetrics('findById', async () => {
      const result = await this.doFindById(id);
      if (result) {
        await this.publishEvent({ type: 'entity.retrieved', data: result, entity: 'unknown', id });
      }
      return result;
    });
  }

  async findMany(filters?: SearchFilters, options?: PaginationOptions): Promise<T[]> {
    return this.executeWithMetrics('findMany', async () => {
      const result = await this.doFindMany(filters, options);
      await this.publishEvent({ type: 'entities.listRetrieved', data: result, entity: 'unknown', count: result.length });
      return result;
    });
  }

  async findManyPaginated(
    filters?: SearchFilters, 
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    return this.executeWithMetrics('findManyPaginated', async () => {
      const result = await this.doFindManyPaginated(filters, options);
      await this.publishEvent({ 
        type: 'entities.listRetrievedPaginated', 
        data: result, 
        entity: 'unknown', 
        pagination: result 
      });
      return result;
    });
  }

  async exists(id: string): Promise<boolean> {
    return this.executeWithMetrics('exists', async () => {
      return await this.doExists(id);
    });
  }

  async count(filters?: SearchFilters): Promise<number> {
    return this.executeWithMetrics('count', async () => {
      return await this.doCount(filters);
    });
  }

  // === Validation ===
  async validateCreate(data: CreateDTO): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  async validateUpdate(id: string, data: UpdateDTO): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  // === Event Sourcing ===
  async publishEvent<TEvent>(event: TEvent): Promise<void> {
    if (this.config.enableLogging) {
      console.log(`[Service ${this.config.name}] Publishing event:`, event);
    }

    const handlers = this.eventHandlers.get((event as any).type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logError('eventHandler', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  subscribeToEvent<TEvent>(eventType: string, handler: (event: TEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    const handlers = this.eventHandlers.get(eventType)!;
    handlers.push(handler as (event: unknown) => void);

    // Retorna função para desregistrar
    return () => {
      const index = handlers.indexOf(handler as (event: unknown) => void);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  // === Transaction Management ===
  async executeInTransaction<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    if (this.transactionActive) {
      throw new Error('Transaction already active');
    }

    this.transactionActive = true;
    this.transactionData = [];

    try {
      const result = await operation();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    } finally {
      this.transactionActive = false;
      this.transactionData = [];
    }
  }

  async commit(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction to commit');
    }

    // Executar operações da transação
    for (const operation of this.transactionData) {
      await operation();
    }

    await this.publishEvent({ type: 'transaction.committed', operations: this.transactionData.length });
  }

  async rollback(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction to rollback');
    }

    this.transactionData = [];
    await this.publishEvent({ type: 'transaction.rolledback' });
  }

  // === Metrics ===
  getMetrics(): ServiceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // === Protected Methods (to be implemented by subclasses) ===
  protected abstract doCreate(data: CreateDTO): Promise<T>;
  protected abstract doUpdate(id: string, data: UpdateDTO): Promise<T>;
  protected abstract doDelete(id: string): Promise<void>;
  protected abstract doFindById(id: string): Promise<T | null>;
  protected abstract doFindMany(filters?: SearchFilters, options?: PaginationOptions): Promise<T[]>;
  protected abstract doFindManyPaginated(
    filters?: SearchFilters, 
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>>;
  protected abstract doExists(id: string): Promise<boolean>;
  protected abstract doCount(filters?: SearchFilters): Promise<number>;

  // === Transaction-specific implementations ===
  protected async createWithTransaction(data: CreateDTO): Promise<T> {
    return this.doCreate(data);
  }

  protected async updateWithTransaction(id: string, data: UpdateDTO): Promise<T> {
    return this.doUpdate(id, data);
  }

  protected async deleteWithTransaction(id: string): Promise<void> {
    return this.doDelete(id);
  }

  // === Private Methods ===
  private async executeWithMetrics<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    const timestamp = startTime;
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation ${operationName} timed out`)), this.config.timeout!);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      
      // Registrar métrica de sucesso
      if (this.config.enableMetrics) {
        this.metrics.push({
          operationName,
          duration: Date.now() - startTime,
          timestamp,
          success: true
        });
      }

      return result;
    } catch (error) {
      // Registrar métrica de erro
      if (this.config.enableMetrics) {
        this.metrics.push({
          operationName,
          duration: Date.now() - startTime,
          timestamp,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  private logError(operation: string, message: string): void {
    if (this.config.enableLogging) {
      console.error(`[Service ${this.config.name}] Error in ${operation}:`, message);
    }
  }
}

/**
 * Classe para coleção de erros de validação
 */
export class ValidationErrorCollection extends Error {
  constructor(public errors: ValidationError[]) {
    super(`Validation failed with ${errors.length} error(s)`);
    this.name = 'ValidationErrorCollection';
  }
}