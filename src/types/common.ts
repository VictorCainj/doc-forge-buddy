/**
 * Tipos comuns utilizados em todo o projeto
 * Centraliza definições de tipos reutilizáveis
 */

/**
 * Tipos para operações CRUD
 */
export type CrudOperation = 'create' | 'read' | 'update' | 'delete' | 'list';

/**
 * Tipos para estados de loading
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Tipos para variantes de toast
 */
export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning';

/**
 * Tipos para prioridades
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Tipos para status genéricos
 */
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';

/**
 * Interface para callbacks de operações
 */
export interface OperationCallbacks<T = unknown> {
  onSuccess?: (operation: CrudOperation, data?: T) => void;
  onError?: (operation: CrudOperation, error: Error) => void;
  onStart?: (operation: CrudOperation) => void;
  onComplete?: (operation: CrudOperation) => void;
}

/**
 * Interface para opções de paginação
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  page?: number;
  orderBy?: string;
  ascending?: boolean;
}

/**
 * Interface para filtros de busca
 */
export interface SearchFilters {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: Status;
  category?: string;
  tags?: string[];
}

/**
 * Interface para resultados paginados
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Interface para opções de localStorage
 */
export interface StorageOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  onError?: (error: Error) => void;
  ttl?: number; // Time to live em milliseconds
}

/**
 * Interface para métricas de performance
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  component?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Interface para configurações de validação
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  message?: string;
}

/**
 * Interface para erros de validação
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Interface para resposta de API
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  timestamp: string;
}

/**
 * Interface para configurações de componente
 */
export interface ComponentConfig {
  enabled: boolean;
  settings: Record<string, unknown>;
  version?: string;
  lastUpdated?: string;
}

/**
 * Utility types
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Type guards utilitários
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const hasProperty = <T extends Record<string, unknown>, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> => {
  return prop in obj;
};
