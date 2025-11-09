/**
 * Interface base para todos os services da aplicação
 * Define contratos padronizados para operações CRUD
 */

import { ApiResponse, PaginatedResult, SearchFilters, PaginationOptions, OperationCallbacks } from '@/types/domain/common';

export interface IService<T, CreateDTO, UpdateDTO> {
  /**
   * Cria uma nova entidade
   * @param data Dados para criação
   * @param callbacks Callbacks de sucesso/erro
   * @returns Promise com a entidade criada
   */
  create(data: CreateDTO, callbacks?: OperationCallbacks<T>): Promise<T>;
  
  /**
   * Atualiza uma entidade existente
   * @param id ID da entidade
   * @param data Dados para atualização
   * @param callbacks Callbacks de sucesso/erro
   * @returns Promise com a entidade atualizada
   */
  update(id: string, data: UpdateDTO, callbacks?: OperationCallbacks<T>): Promise<T>;
  
  /**
   * Remove uma entidade
   * @param id ID da entidade
   * @param callbacks Callbacks de sucesso/erro
   * @returns Promise<void>
   */
  delete(id: string, callbacks?: OperationCallbacks<T>): Promise<void>;
  
  /**
   * Busca uma entidade por ID
   * @param id ID da entidade
   * @returns Promise com a entidade ou null
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Busca múltiplas entidades com filtros opcionais
   * @param filters Filtros de busca opcionais
   * @param options Opções de paginação
   * @returns Promise com lista de entidades
   */
  findMany(filters?: SearchFilters, options?: PaginationOptions): Promise<T[]>;
  
  /**
   * Busca entidades com paginação
   * @param filters Filtros de busca opcionais
   * @param options Opções de paginação
   * @returns Promise com resultado paginado
   */
  findManyPaginated(
    filters?: SearchFilters, 
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>>;
  
  /**
   * Verifica se uma entidade existe
   * @param id ID da entidade
   * @returns Promise<boolean>
   */
  exists(id: string): Promise<boolean>;
  
  /**
   * Conta o total de entidades
   * @param filters Filtros opcionais
   * @returns Promise com o total
   */
  count(filters?: SearchFilters): Promise<number>;
}

/**
 * Interface para services que suportam validação de dados
 */
export interface IValidatableService<T, CreateDTO, UpdateDTO> extends IService<T, CreateDTO, UpdateDTO> {
  /**
   * Valida dados antes de criar
   * @param data Dados para validação
   * @returns Promise com resultado da validação
   */
  validateCreate(data: CreateDTO): Promise<ValidationResult>;
  
  /**
   * Valida dados antes de atualizar
   * @param id ID da entidade
   * @param data Dados para validação
   * @returns Promise com resultado da validação
   */
  validateUpdate(id: string, data: UpdateDTO): Promise<ValidationResult>;
}

/**
 * Interface para services que suportam eventos
 */
export interface IEventSourcedService<T, CreateDTO, UpdateDTO> extends IService<T, CreateDTO, UpdateDTO> {
  /**
   * Publica um evento
   * @param event Evento a ser publicado
   * @returns Promise<void>
   */
  publishEvent<TEvent>(event: TEvent): Promise<void>;
  
  /**
   * Registra um handler para eventos
   * @param eventType Tipo do evento
   * @param handler Handler do evento
   * @returns Função para desregistrar o handler
   */
  subscribeToEvent<TEvent>(eventType: string, handler: (event: TEvent) => void): () => void;
}

/**
 * Interface para services transacionais
 */
export interface ITransactionalService<T, CreateDTO, UpdateDTO> extends IService<T, CreateDTO, UpdateDTO> {
  /**
   * Executa operação dentro de transação
   * @param operation Operação a ser executada
   * @returns Promise com resultado
   */
  executeInTransaction<TResult>(operation: () => Promise<TResult>): Promise<TResult>;
  
  /**
   * Commit da transação
   * @returns Promise<void>
   */
  commit(): Promise<void>;
  
  /**
   * Rollback da transação
   * @returns Promise<void>
   */
  rollback(): Promise<void>;
}

/**
 * Resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  severity: 'error' | 'warning';
}

/**
 * Interface para métricas de performance de services
 */
export interface ServiceMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Interface para configuração de service
 */
export interface ServiceConfig {
  name: string;
  version: string;
  timeout?: number;
  retryAttempts?: number;
  enableMetrics?: boolean;
  enableValidation?: boolean;
  enableLogging?: boolean;
}

/**
 * Interface para contexto de service
 */
export interface ServiceContext {
  userId?: string;
  requestId?: string;
  correlationId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Interface base para repositories
 */
export interface IRepository<T, CreateDTO, UpdateDTO> {
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<T | null>;
  findMany(filters?: SearchFilters, options?: PaginationOptions): Promise<T[]>;
  findManyPaginated(
    filters?: SearchFilters, 
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>>;
  exists(id: string): Promise<boolean>;
  count(filters?: SearchFilters): Promise<number>;
}