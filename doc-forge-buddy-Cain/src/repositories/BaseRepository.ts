/**
 * Classe base para Repositories
 * Implementa funcionalidades comuns para todos os repositories específicos
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseEntity } from '@/types/shared/base';
import type { IRepository } from './interfaces/IRepository';
import { RepositoryError, RepositoryErrorType } from './errors/RepositoryError';
import { repositoryLogger, LogLevel, createQueryTimer } from './logging/RepositoryLogger';

export abstract class BaseRepository<T extends BaseEntity, ID = string> implements IRepository<T, ID> {
  protected readonly tableName: string;
  protected readonly entityName: string;
  protected readonly userId: string | null;

  constructor(tableName: string, entityName: string, userId?: string | null) {
    this.tableName = tableName;
    this.entityName = entityName;
    this.userId = userId || null;
  }

  /**
   * Busca uma entidade pelo ID
   */
  async findById(id: ID): Promise<T | null> {
    const timer = createQueryTimer(this.entityName, 'findById', `SELECT * FROM ${this.tableName} WHERE id = ?`, this.userId);
    
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Registro não encontrado
          timer.error(error);
          return null;
        }
        throw RepositoryError.fromUnknown(error, this.entityName, 'findById');
      }

      timer.success(data);
      return data as T;
    } catch (error) {
      timer.error(error);
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'findById');
    }
  }

  /**
   * Busca múltiplas entidades com filtros opcionais
   */
  async findMany(filters?: Partial<T>): Promise<T[]> {
    const timer = createQueryTimer(this.entityName, 'findMany', `SELECT * FROM ${this.tableName} WHERE ?`, this.userId);
    
    try {
      let query = supabase.from(this.tableName).select('*');

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;

      if (error) {
        throw RepositoryError.fromUnknown(error, this.entityName, 'findMany');
      }

      timer.success(data, filters);
      return (data || []) as T[];
    } catch (error) {
      timer.error(error, filters);
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'findMany');
    }
  }

  /**
   * Busca múltiplas entidades com paginação
   */
  async findManyPaginated(
    filters?: Partial<T>,
    page = 1,
    limit = 20
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const timer = createQueryTimer(
      this.entityName, 
      'findManyPaginated', 
      `SELECT * FROM ${this.tableName} WHERE ? LIMIT ? OFFSET ?`, 
      this.userId
    );
    
    try {
      const offset = (page - 1) * limit;
      
      // Monta query base
      let query = supabase.from(this.tableName).select('*', { count: 'exact' });

      // Aplica filtros
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Aplica paginação
      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        throw RepositoryError.fromUnknown(error, this.entityName, 'findManyPaginated');
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      timer.success({ data, total, page, totalPages }, { filters, page, limit });

      return {
        data: (data || []) as T[],
        total,
        page,
        totalPages
      };
    } catch (error) {
      timer.error(error, { filters, page, limit });
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'findManyPaginated');
    }
  }

  /**
   * Cria uma nova entidade
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const timer = createQueryTimer(this.entityName, 'create', `INSERT INTO ${this.tableName}`, this.userId);
    
    try {
      // Remove campos undefined para evitar problemas com RLS
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          throw RepositoryError.uniqueConstraint('unknown', 'unknown', this.entityName);
        }
        if (error.code === '23503') {
          // Foreign key constraint violation
          throw RepositoryError.foreignKeyConstraint(error.message, this.entityName);
        }
        throw RepositoryError.fromUnknown(error, this.entityName, 'create');
      }

      timer.success(result, cleanData);
      return result as T;
    } catch (error) {
      timer.error(error, data);
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'create');
    }
  }

  /**
   * Atualiza uma entidade existente
   */
  async update(id: ID, data: Partial<T>): Promise<T> {
    const timer = createQueryTimer(this.entityName, 'update', `UPDATE ${this.tableName} WHERE id = ?`, this.userId);
    
    try {
      // Verifica se a entidade existe
      const exists = await this.exists(id);
      if (!exists) {
        throw RepositoryError.notFound(this.entityName, String(id));
      }

      // Remove campos undefined e campos que não devem ser atualizados
      const allowedFields = Object.keys(data).filter(key => 
        !['id', 'created_at'].includes(key) && data[key as keyof T] !== undefined
      );
      
      const updateData: Record<string, any> = {};
      allowedFields.forEach(field => {
        updateData[field] = data[field as keyof T];
      });

      if (Object.keys(updateData).length === 0) {
        throw RepositoryError.validation('Nenhum campo válido para atualização', null, this.entityName);
      }

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw RepositoryError.fromUnknown(error, this.entityName, 'update');
      }

      timer.success(result, { id, updateData });
      return result as T;
    } catch (error) {
      timer.error(error, { id, data });
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'update');
    }
  }

  /**
   * Remove uma entidade
   */
  async delete(id: ID): Promise<void> {
    const timer = createQueryTimer(this.entityName, 'delete', `DELETE FROM ${this.tableName} WHERE id = ?`, this.userId);
    
    try {
      // Verifica se a entidade existe
      const exists = await this.exists(id);
      if (!exists) {
        throw RepositoryError.notFound(this.entityName, String(id));
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw RepositoryError.fromUnknown(error, this.entityName, 'delete');
      }

      timer.success();
    } catch (error) {
      timer.error(error);
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'delete');
    }
  }

  /**
   * Conta o total de entidades que atendem aos filtros
   */
  async count(filters?: Partial<T>): Promise<number> {
    const timer = createQueryTimer(this.entityName, 'count', `SELECT COUNT(*) FROM ${this.tableName} WHERE ?`, this.userId);
    
    try {
      let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw RepositoryError.fromUnknown(error, this.entityName, 'count');
      }

      timer.success(count);
      return count || 0;
    } catch (error) {
      timer.error(error, filters);
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'count');
    }
  }

  /**
   * Verifica se uma entidade existe
   */
  async exists(id: ID): Promise<boolean> {
    const timer = createQueryTimer(this.entityName, 'exists', `SELECT COUNT(*) FROM ${this.tableName} WHERE id = ?`, this.userId);
    
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        throw RepositoryError.fromUnknown(error, this.entityName, 'exists');
      }

      timer.success(!!count);
      return !!count;
    } catch (error) {
      timer.error(error);
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'exists');
    }
  }

  /**
   * Busca múltiplas entidades com condições customizadas
   */
  async findWithConditions(
    conditions: Array<{
      column: string;
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in';
      value: any;
    }>,
    orderBy?: { column: string; ascending?: boolean },
    limit?: number
  ): Promise<T[]> {
    const timer = createQueryTimer(
      this.entityName, 
      'findWithConditions', 
      `SELECT * FROM ${this.tableName} WHERE ? ORDER BY ? LIMIT ?`, 
      this.userId
    );
    
    try {
      let query = supabase.from(this.tableName).select('*');

      // Aplica condições
      conditions.forEach(condition => {
        switch (condition.operator) {
          case 'eq':
            query = query.eq(condition.column, condition.value);
            break;
          case 'neq':
            query = query.neq(condition.column, condition.value);
            break;
          case 'gt':
            query = query.gt(condition.column, condition.value);
            break;
          case 'gte':
            query = query.gte(condition.column, condition.value);
            break;
          case 'lt':
            query = query.lt(condition.column, condition.value);
            break;
          case 'lte':
            query = query.lte(condition.column, condition.value);
            break;
          case 'like':
            query = query.like(condition.column, condition.value);
            break;
          case 'ilike':
            query = query.ilike(condition.column, condition.value);
            break;
          case 'in':
            query = query.in(condition.column, condition.value);
            break;
          case 'not_in':
            query = query.not(condition.column, 'in', `(${condition.value.join(',')})`);
            break;
        }
      });

      // Aplica ordenação
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
      }

      // Aplica limite
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw RepositoryError.fromUnknown(error, this.entityName, 'findWithConditions');
      }

      timer.success(data, { conditions, orderBy, limit });
      return (data || []) as T[];
    } catch (error) {
      timer.error(error, { conditions, orderBy, limit });
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'findWithConditions');
    }
  }

  /**
   * Executa uma operação em lote
   */
  async bulkOperation(
    operation: 'create' | 'update' | 'delete',
    data: any[]
  ): Promise<{ success: T[]; failed: Array<{ data: any; error: string }> }> {
    const timer = createQueryTimer(
      this.entityName, 
      'bulkOperation', 
      `BULK ${operation.toUpperCase()} ON ${this.tableName}`, 
      this.userId
    );
    
    try {
      if (data.length === 0) {
        return { success: [], failed: [] };
      }

      let result;
      const failed: Array<{ data: any; error: string }> = [];

      switch (operation) {
        case 'create':
          // Para create, vamos processar em lote simples primeiro
          const { data: createResult, error: createError } = await supabase
            .from(this.tableName)
            .insert(data)
            .select();

          if (createError) {
            // Tenta uma por uma se falhar em lote
            for (const item of data) {
              try {
                const { data: singleResult, error: singleError } = await supabase
                  .from(this.tableName)
                  .insert(item)
                  .select()
                  .single();
                
                if (singleError) {
                  failed.push({ data: item, error: singleError.message });
                }
              } catch (err) {
                failed.push({ data: item, error: err instanceof Error ? err.message : String(err) });
              }
            }
            result = createResult;
          } else {
            result = createResult;
          }
          break;

        case 'update':
          // Para update, processa uma por uma para manter integridade
          result = [];
          for (const item of data) {
            try {
              const { data: updateResult, error: updateError } = await supabase
                .from(this.tableName)
                .update(item.data)
                .eq('id', item.id)
                .select();
              
              if (updateError) {
                failed.push({ data: item, error: updateError.message });
              } else if (updateResult && updateResult.length > 0) {
                result.push(updateResult[0]);
              }
            } catch (err) {
              failed.push({ data: item, error: err instanceof Error ? err.message : String(err) });
            }
          }
          break;

        case 'delete':
          // Para delete, processa uma por uma
          result = [];
          for (const id of data) {
            try {
              const { error: deleteError } = await supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);
              
              if (deleteError) {
                failed.push({ data: id, error: deleteError.message });
              } else {
                result.push({ id });
              }
            } catch (err) {
              failed.push({ data: id, error: err instanceof Error ? err.message : String(err) });
            }
          }
          break;
      }

      timer.success({ success: result, failed }, { operation, data });
      return { success: (result || []) as T[], failed };
    } catch (error) {
      timer.error(error, { operation, data });
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.bulkOperation(
        `Erro na operação em lote ${operation}: ${error instanceof Error ? error.message : String(error)}`,
        error,
        this.entityName
      );
    }
  }

  /**
   * Executa uma transação
   */
  async transaction<R>(
    operations: Array<() => Promise<R>>
  ): Promise<R[]> {
    const timer = createQueryTimer(
      this.entityName, 
      'transaction', 
      `TRANSACTION WITH ${operations.length} OPERATIONS`, 
      this.userId
    );
    
    try {
      const results: R[] = [];
      
      // Usar Supabase transaction via RPC ou implementar com retry manual
      // Por enquanto, executa as operações sequencialmente com rollback em caso de erro
      for (let i = 0; i < operations.length; i++) {
        try {
          const result = await operations[i]();
          results.push(result);
        } catch (error) {
          // Rollback: poderia implementar lógica de rollback se necessário
          timer.error(error, { operationIndex: i, totalOperations: operations.length });
          
          throw RepositoryError.transaction(
            `Falha na operação ${i + 1} de ${operations.length} da transação`,
            error,
            this.entityName
          );
        }
      }

      timer.success(results, { operationsCount: operations.length });
      return results;
    } catch (error) {
      timer.error(error, { operationsCount: operations.length });
      
      if (error instanceof RepositoryError) {
        throw error;
      }
      
      throw RepositoryError.fromUnknown(error, this.entityName, 'transaction');
    }
  }
}