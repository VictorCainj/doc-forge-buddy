/**
 * Interface base para o padrão Repository
 * Define operações CRUD genéricas para todas as entidades
 */

import { BaseEntity } from '@/types/shared/base';

export interface IRepository<T extends BaseEntity, ID = string> {
  /**
   * Busca uma entidade pelo ID
   */
  findById(id: ID): Promise<T | null>;
  
  /**
   * Busca múltiplas entidades com filtros opcionais
   */
  findMany(filters?: Partial<T>): Promise<T[]>;
  
  /**
   * Busca múltiplas entidades com paginação
   */
  findManyPaginated(
    filters?: Partial<T>,
    page?: number,
    limit?: number
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }>;
  
  /**
   * Cria uma nova entidade
   */
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  
  /**
   * Atualiza uma entidade existente
   */
  update(id: ID, data: Partial<T>): Promise<T>;
  
  /**
   * Remove uma entidade
   */
  delete(id: ID): Promise<void>;
  
  /**
   * Conta o total de entidades que atendem aos filtros
   */
  count(filters?: Partial<T>): Promise<number>;
  
  /**
   * Verifica se uma entidade existe
   */
  exists(id: ID): Promise<boolean>;
  
  /**
   * Busca múltiplas entidades com condições customizadas
   */
  findWithConditions(
    conditions: Array<{
      column: string;
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in';
      value: any;
    }>,
    orderBy?: { column: string; ascending?: boolean },
    limit?: number
  ): Promise<T[]>;
  
  /**
   * Executa uma operação em lote
   */
  bulkOperation(
    operation: 'create' | 'update' | 'delete',
    data: any[]
  ): Promise<{ success: T[]; failed: Array<{ data: any; error: string }> }>;
  
  /**
   * Executa uma transação
   */
  transaction<R>(
    operations: Array<() => Promise<R>>
  ): Promise<R[]>;
}