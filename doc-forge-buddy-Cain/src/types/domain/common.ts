/**
 * @fileoverview Tipos comuns utilizados em todo o projeto
 * @description Centraliza definições de tipos reutilizáveis e utilidades TypeScript
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

/**
 * Tipos para operações CRUD
 * @description Define as operações padrão para operações de banco de dados
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
 * @description Define callbacks para diferentes estados de uma operação CRUD
 * @template T Tipo dos dados retornados pela operação
 */
export interface OperationCallbacks<T = unknown> {
  /** Callback executado quando a operação é bem-sucedida */
  onSuccess?: (operation: CrudOperation, data?: T) => void;
  /** Callback executado quando ocorre um erro na operação */
  onError?: (operation: CrudOperation, error: Error) => void;
  /** Callback executado quando a operação inicia */
  onStart?: (operation: CrudOperation) => void;
  /** Callback executado quando a operação é concluída (independente do resultado) */
  onComplete?: (operation: CrudOperation) => void;
}

/**
 * Interface para opções de paginação
 * @description Define parâmetros para paginação de resultados
 */
export interface PaginationOptions {
  /** Número máximo de itens por página */
  limit?: number;
  /** Número de itens para pular (offset) */
  offset?: number;
  /** Número da página (alternativa ao offset) */
  page?: number;
  /** Campo para ordenação dos resultados */
  orderBy?: string;
  /** Direção da ordenação (true = ascendente, false = descendente) */
  ascending?: boolean;
}

/**
 * Interface para filtros de busca
 * @description Define critérios de filtro para buscas
 */
export interface SearchFilters {
  /** Termo de busca livre */
  query?: string;
  /** Data inicial para filtro de período */
  dateFrom?: string;
  /** Data final para filtro de período */
  dateTo?: string;
  /** Status para filtro */
  status?: Status;
  /** Categoria para filtro */
  category?: string;
  /** Tags para filtro */
  tags?: string[];
}

/**
 * Interface para resultados paginados
 * @description Estrutura padrão para resultados de consultas paginadas
 * @template T Tipo dos itens retornados
 */
export interface PaginatedResult<T> {
  /** Array com os dados da página atual */
  data: T[];
  /** Total de itens disponíveis */
  total: number;
  /** Número da página atual */
  page: number;
  /** Limite de itens por página */
  limit: number;
  /** Indica se existem mais páginas */
  hasMore: boolean;
}

/**
 * Interface para opções de localStorage
 * @description Define configurações para operações com localStorage
 * @template T Tipo dos dados a serem armazenados
 */
export interface StorageOptions<T> {
  /** Função personalizada para serializar dados */
  serialize?: (value: T) => string;
  /** Função personalizada para deserializar dados */
  deserialize?: (value: string) => T;
  /** Callback para tratar erros de storage */
  onError?: (error: Error) => void;
  /** Time to live em milliseconds (opcional) */
  ttl?: number;
}

/**
 * Interface para métricas de performance
 * @description Define estrutura para coleta de métricas de performance
 */
export interface PerformanceMetric {
  /** Nome da métrica */
  name: string;
  /** Valor da métrica */
  value: number;
  /** Timestamp de coleta */
  timestamp: number;
  /** Nome do componente associado (opcional) */
  component?: string;
  /** Dados adicionais da métrica */
  metadata?: Record<string, unknown>;
}

/**
 * Interface para configurações de validação
 * @description Define regras de validação para campos
 */
export interface ValidationRule {
  /** Indica se o campo é obrigatório */
  required?: boolean;
  /** Comprimento mínimo do campo */
  minLength?: number;
  /** Comprimento máximo do campo */
  maxLength?: number;
  /** Padrão regex para validação */
  pattern?: RegExp;
  /** Função de validação personalizada */
  custom?: (value: string) => string | null;
  /** Mensagem de erro personalizada */
  message?: string;
}

/**
 * Interface para erros de validação
 * @description Define estrutura para erros de validação
 */
export interface ValidationError {
  /** Nome do campo com erro */
  field: string;
  /** Mensagem de erro */
  message: string;
  /** Código de erro específico (opcional) */
  code?: string;
}

/**
 * Interface para resposta de API
 * @description Estrutura padrão para respostas de API
 * @template T Tipo dos dados retornados
 */
export interface ApiResponse<T = unknown> {
  /** Dados da resposta (opcional) */
  data?: T;
  /** Mensagem de erro (opcional) */
  error?: string;
  /** Mensagem informativa (opcional) */
  message?: string;
  /** Código de status HTTP */
  status: number;
  /** Timestamp da resposta */
  timestamp: string;
}

/**
 * Interface para configurações de componente
 * @description Define configurações para componentes dinâmicos
 */
export interface ComponentConfig {
  /** Indica se o componente está habilitado */
  enabled: boolean;
  /** Configurações específicas do componente */
  settings: Record<string, unknown>;
  /** Versão do componente (opcional) */
  version?: string;
  /** Data da última atualização (opcional) */
  lastUpdated?: string;
}

/**
 * Utility types
 * @description Tipos utilitários para manipulação avançada de tipos
 */

/**
 * Torna opcional um conjunto de propriedades de um tipo
 * @template T Tipo base
 * @template K Propriedades a tornarem opcionais
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Torna obrigatório um conjunto de propriedades de um tipo
 * @template T Tipo base
 * @template K Propriedades a tornarem obrigatórias
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Torna recursivamente todas as propriedades de um tipo opcionais
 * @template T Tipo a ser parcialmente tipado
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Type guards utilitários
 * @description Funções para validação de tipos em tempo de execução
 */

/**
 * Verifica se um valor é uma string
 * @param value Valor a ser verificado
 * @returns True se o valor for uma string
 * @example
 * ```typescript
 * isString("hello") // true
 * isString(123) // false
 * ```
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Verifica se um valor é um número válido
 * @param value Valor a ser verificado
 * @returns True se o valor for um número (não NaN)
 * @example
 * ```typescript
 * isNumber(123) // true
 * isNumber(NaN) // false
 * isNumber("123") // false
 * ```
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Verifica se um valor é um objeto (não array, não null)
 * @param value Valor a ser verificado
 * @returns True se o valor for um objeto válido
 * @example
 * ```typescript
 * isObject({}) // true
 * isObject([]) // false
 * isObject(null) // false
 * ```
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Verifica se um valor é um array
 * @param value Valor a ser verificado
 * @returns True se o valor for um array
 * @template T Tipo dos elementos do array
 * @example
 * ```typescript
 * isArray([1, 2, 3]) // true
 * isArray("hello") // false
 * ```
 */
export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

/**
 * Verifica se um objeto possui uma propriedade específica
 * @param obj Objeto a ser verificado
 * @param prop Nome da propriedade
 * @returns True se o objeto possui a propriedade
 * @template T Tipo do objeto
 * @template K Tipo da propriedade
 * @example
 * ```typescript
 * const obj = { name: "John", age: 30 };
 * hasProperty(obj, "name") // true
 * hasProperty(obj, "email") // false
 * ```
 */
export const hasProperty = <T extends Record<string, unknown>, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> => {
  return prop in obj;
};
