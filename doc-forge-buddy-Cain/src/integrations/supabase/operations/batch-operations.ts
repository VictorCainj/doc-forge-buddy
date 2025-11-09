import { supabase } from '../client';
import { CacheManager } from '../cache/cache-manager';
import { QueryAnalytics } from '../monitoring/query-analytics';
import type { Database } from '../types';

// Interface para operações em lote
export interface BatchOperation<T = any> {
  id: string;
  type: 'insert' | 'update' | 'delete' | 'upsert';
  table: string;
  data: T[];
  options: BatchOptions;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: BatchResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BatchOptions {
  chunkSize?: number;
  parallelLimit?: number;
  retryAttempts?: number;
  retryDelay?: number;
  useTransaction?: boolean;
  validateData?: boolean;
  clearCache?: boolean;
  cacheStrategy?: 'memory' | 'redis' | 'localStorage' | 'hybrid';
}

export interface BatchResult {
  success: number;
  failed: number;
  errors: Array<{ index: number; error: any; data: any }>;
  totalTime: number;
  averageTimePerItem: number;
}

export interface BatchProgress {
  operationId: string;
  progress: number; // 0-100
  current: number;
  total: number;
  estimatedTimeRemaining: number;
  status: string;
}

// Interface para transações
export interface TransactionOperation {
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  where?: any;
}

// Gerenciador de operações em lote
export class BatchOperationsManager {
  private cacheManager: CacheManager;
  private analytics: QueryAnalytics;
  private activeOperations = new Map<string, BatchOperation>();
  private operationQueue: BatchOperation[] = [];
  private isProcessing = false;

  constructor() {
    this.cacheManager = new CacheManager();
    this.analytics = new QueryAnalytics();
  }

  // Inserir dados em lote
  async batchInsert<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert'][],
    options: Partial<BatchOptions> = {}
  ): Promise<BatchOperation<Database['public']['Tables'][T]['Insert']>> {
    const operation: BatchOperation<Database['public']['Tables'][T]['Insert']> = {
      id: this.generateOperationId(),
      type: 'insert',
      table: table as string,
      data,
      options: {
        chunkSize: 100,
        parallelLimit: 5,
        retryAttempts: 3,
        retryDelay: 1000,
        useTransaction: true,
        validateData: true,
        clearCache: false,
        cacheStrategy: 'hybrid',
        ...options
      },
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.activeOperations.set(operation.id, operation);
    
    // Processar em background
    this.processBatchOperation(operation);

    return operation;
  }

  // Atualizar dados em lote
  async batchUpdate<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Partial<Database['public']['Tables'][T]['Update']>[],
    whereConditions: any[],
    options: Partial<BatchOptions> = {}
  ): Promise<BatchOperation<Database['public']['Tables'][T]['Update']>> {
    if (data.length !== whereConditions.length) {
      throw new Error('Data and where conditions arrays must have the same length');
    }

    const operation: BatchOperation<Database['public']['Tables'][T]['Update']> = {
      id: this.generateOperationId(),
      type: 'update',
      table: table as string,
      data: data.map((item, index) => ({
        ...item,
        _where: whereConditions[index]
      })) as any,
      options: {
        chunkSize: 100,
        parallelLimit: 3,
        retryAttempts: 3,
        retryDelay: 1000,
        useTransaction: true,
        validateData: true,
        clearCache: true,
        cacheStrategy: 'hybrid',
        ...options
      },
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.activeOperations.set(operation.id, operation);
    this.processBatchOperation(operation);

    return operation;
  }

  // Deletar dados em lote
  async batchDelete<T extends keyof Database['public']['Tables']>(
    table: T,
    whereConditions: any[],
    options: Partial<BatchOptions> = {}
  ): Promise<BatchOperation<any>> {
    const operation: BatchOperation<any> = {
      id: this.generateOperationId(),
      type: 'delete',
      table: table as string,
      data: whereConditions,
      options: {
        chunkSize: 200,
        parallelLimit: 5,
        retryAttempts: 3,
        retryDelay: 1000,
        useTransaction: true,
        validateData: false,
        clearCache: true,
        cacheStrategy: 'hybrid',
        ...options
      },
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.activeOperations.set(operation.id, operation);
    this.processBatchOperation(operation);

    return operation;
  }

  // Upsert em lote
  async batchUpsert<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert'][],
    options: Partial<BatchOptions> = {}
  ): Promise<BatchOperation<Database['public']['Tables'][T]['Insert']>> {
    const operation: BatchOperation<Database['public']['Tables'][T]['Insert']> = {
      id: this.generateOperationId(),
      type: 'upsert',
      table: table as string,
      data,
      options: {
        chunkSize: 50,
        parallelLimit: 3,
        retryAttempts: 3,
        retryDelay: 1000,
        useTransaction: true,
        validateData: true,
        clearCache: false,
        cacheStrategy: 'hybrid',
        ...options
      },
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.activeOperations.set(operation.id, operation);
    this.processBatchOperation(operation);

    return operation;
  }

  // Executar transação
  async executeTransaction(
    operations: TransactionOperation[],
    options: Partial<BatchOptions> = {}
  ): Promise<{ success: boolean; results: any[]; errors: any[] }> {
    const startTime = Date.now();
    const results: any[] = [];
    const errors: any[] = [];

    try {
      if (options.useTransaction !== false) {
        // Usar RPC para transação
        const { data, error } = await supabase.rpc('execute_transaction', {
          operations
        });

        if (error) {
          throw error;
        }

        return {
          success: true,
          results: [data],
          errors: []
        };
      } else {
        // Executar operações individualmente
        for (const operation of operations) {
          try {
            let result;
            
            switch (operation.type) {
              case 'insert':
                result = await supabase.from(operation.table).insert(operation.data);
                break;
              case 'update':
                result = await supabase
                  .from(operation.table)
                  .update(operation.data)
                  .match(operation.where);
                break;
              case 'delete':
                result = await supabase
                  .from(operation.table)
                  .delete()
                  .match(operation.where);
                break;
            }

            if (result.error) {
              errors.push({ operation, error: result.error });
            } else {
              results.push(result.data);
            }
          } catch (error) {
            errors.push({ operation, error });
          }
        }

        return {
          success: errors.length === 0,
          results,
          errors
        };
      }
    } catch (error) {
      return {
        success: false,
        results,
        errors: [{ operation: 'transaction', error }]
      };
    }
  }

  // Processar operação em lote
  private async processBatchOperation<T>(operation: BatchOperation<T>): Promise<void> {
    operation.status = 'running';
    operation.startedAt = new Date();

    const startTime = Date.now();
    let success = 0;
    let failed = 0;
    const errors: Array<{ index: number; error: any; data: any }> = [];

    try {
      // Dividir em chunks
      const chunks = this.chunkArray(operation.data, operation.options.chunkSize!);
      const totalChunks = chunks.length;

      // Processar chunks em paralelo
      const chunkPromises = chunks.map(async (chunk, chunkIndex) => {
        return this.processChunk(operation, chunk, chunkIndex, totalChunks);
      });

      const chunkResults = await Promise.allSettled(chunkPromises);

      // Consolidar resultados
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const chunkResult = result.value;
          success += chunkResult.success;
          failed += chunkResult.failed;
          errors.push(...chunkResult.errors);
        } else {
          failed += chunks[index].length;
          errors.push({
            index,
            error: result.reason,
            data: chunks[index]
          });
        }
      });

      // Atualizar progresso
      operation.progress = 100;
      operation.status = 'completed';
      operation.completedAt = new Date();

      operation.result = {
        success,
        failed,
        errors,
        totalTime: Date.now() - startTime,
        averageTimePerItem: (Date.now() - startTime) / operation.data.length
      };

      // Limpar cache se necessário
      if (operation.options.clearCache) {
        await this.invalidateTableCache(operation.table);
      }

      // Log analytics
      this.analytics.logBatchOperation({
        operationId: operation.id,
        type: operation.type,
        table: operation.table,
        totalItems: operation.data.length,
        success,
        failed,
        duration: operation.result.totalTime,
        timestamp: Date.now()
      });

    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      operation.completedAt = new Date();

      this.analytics.logBatchOperation({
        operationId: operation.id,
        type: operation.type,
        table: operation.table,
        totalItems: operation.data.length,
        success: 0,
        failed: operation.data.length,
        duration: Date.now() - startTime,
        error: operation.error,
        timestamp: Date.now()
      });
    }

    // Remover da lista de operações ativas
    setTimeout(() => {
      this.activeOperations.delete(operation.id);
    }, 300000); // Manter por 5 minutos para debug
  }

  // Processar um chunk
  private async processChunk<T>(
    operation: BatchOperation<T>,
    chunk: T[],
    chunkIndex: number,
    totalChunks: number
  ): Promise<BatchResult> {
    const startTime = Date.now();
    let success = 0;
    let failed = 0;
    const errors: Array<{ index: number; error: any; data: any }> = [];

    try {
      let result;

      switch (operation.type) {
        case 'insert':
          result = await supabase.from(operation.table).insert(chunk as any);
          break;
        case 'update':
          const updates = chunk.map((item: any) => item._where ? 
            { ...item, where: item._where } : item
          );
          result = await this.batchUpdateChunk(operation.table, updates);
          break;
        case 'delete':
          result = await this.batchDeleteChunk(operation.table, chunk as any[]);
          break;
        case 'upsert':
          result = await supabase.from(operation.table).upsert(chunk as any);
          break;
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }

      if (result.error) {
        failed += chunk.length;
        chunk.forEach((item, index) => {
          errors.push({
            index: chunkIndex * operation.options.chunkSize! + index,
            error: result.error,
            data: item
          });
        });
      } else {
        success += chunk.length;
      }

    } catch (error) {
      failed += chunk.length;
      chunk.forEach((item, index) => {
        errors.push({
          index: chunkIndex * operation.options.chunkSize! + index,
          error,
          data: item
        });
      });
    }

    // Atualizar progresso
    operation.progress = ((chunkIndex + 1) / totalChunks) * 100;

    return {
      success,
      failed,
      errors,
      totalTime: Date.now() - startTime,
      averageTimePerItem: (Date.now() - startTime) / chunk.length
    };
  }

  // Batch update para um chunk
  private async batchUpdateChunk(table: string, updates: any[]): Promise<any> {
    const results = [];
    
    for (const update of updates) {
      const { data, error } = await supabase
        .from(table)
        .update(update.data || update)
        .match(update.where);
      
      if (error) {
        return { error, data: null };
      }
      
      results.push(data);
    }
    
    return { data: results, error: null };
  }

  // Batch delete para um chunk
  private async batchDeleteChunk(table: string, conditions: any[]): Promise<any> {
    const results = [];
    
    for (const condition of conditions) {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .match(condition);
      
      if (error) {
        return { error, data: null };
      }
      
      results.push(data);
    }
    
    return { data: results, error: null };
  }

  // Dividir array em chunks
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Invalidar cache de tabela
  private async invalidateTableCache(table: string): Promise<void> {
    const pattern = `${table}:*`;
    await this.cacheManager.invalidate(pattern);
  }

  // Obter progresso da operação
  getOperationProgress(operationId: string): BatchProgress | null {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return null;

    const elapsed = operation.startedAt ? 
      Date.now() - operation.startedAt.getTime() : 0;
    
    const estimatedTotal = elapsed / (operation.progress / 100);
    const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);

    return {
      operationId,
      progress: operation.progress,
      current: Math.floor((operation.progress / 100) * operation.data.length),
      total: operation.data.length,
      estimatedTimeRemaining: estimatedRemaining,
      status: operation.status
    };
  }

  // Obter operação por ID
  getOperation(operationId: string): BatchOperation | null {
    return this.activeOperations.get(operationId) || null;
  }

  // Listar operações ativas
  getActiveOperations(): BatchOperation[] {
    return Array.from(this.activeOperations.values());
  }

  // Cancelar operação
  cancelOperation(operationId: string): boolean {
    const operation = this.activeOperations.get(operationId);
    if (operation && operation.status === 'running') {
      operation.status = 'failed';
      operation.error = 'Operation cancelled by user';
      operation.completedAt = new Date();
      return true;
    }
    return false;
  }

  // Gerar ID de operação
  private generateOperationId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Otimizações específicas para Supabase
  async optimizeForSupabase<T extends keyof Database['public']['Tables']>(
    operation: BatchOperation<T>
  ): Promise<BatchOperation<T>> {
    // Ajustar chunk size baseado na tabela
    const tableSizes = {
      'contracts': 50,
      'users': 200,
      'vistorias': 100,
      'documents': 30
    };

    const optimalChunkSize = tableSizes[operation.table as keyof typeof tableSizes] || 100;
    operation.options.chunkSize = Math.min(operation.options.chunkSize!, optimalChunkSize);

    // Ajustar parallel limit baseado no tipo de operação
    const parallelLimits = {
      'insert': 3,
      'update': 2,
      'delete': 5,
      'upsert': 2
    };

    operation.options.parallelLimit = parallelLimits[operation.type] || 3;

    return operation;
  }

  // Validação de dados
  validateBatchData<T>(data: T[], schema: any): { valid: T[]; invalid: Array<{ data: T; errors: string[] }> } {
    const valid: T[] = [];
    const invalid: Array<{ data: T; errors: string[] }> = [];

    for (const item of data) {
      const errors = this.validateItem(item, schema);
      if (errors.length === 0) {
        valid.push(item);
      } else {
        invalid.push({ data: item, errors });
      }
    }

    return { valid, invalid };
  }

  // Validar item individual
  private validateItem(item: any, schema: any): string[] {
    const errors: string[] = [];

    // Validações básicas do schema
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in item)) {
          errors.push(`Campo obrigatório ausente: ${field}`);
        }
      }
    }

    // Validações de tipo
    if (schema.types) {
      for (const [field, type] of Object.entries(schema.types)) {
        if (field in item && typeof item[field] !== type) {
          errors.push(`Campo ${field} deve ser do tipo ${type}`);
        }
      }
    }

    return errors;
  }
}

// Singleton instance
let batchManagerInstance: BatchOperationsManager | null = null;

export const getBatchManager = (): BatchOperationsManager => {
  if (!batchManagerInstance) {
    batchManagerInstance = new BatchOperationsManager();
  }
  return batchManagerInstance;
};

// Hook para usar batch operations
export const useBatchOperations = () => {
  return {
    batchInsert: getBatchManager().batchInsert.bind(getBatchManager()),
    batchUpdate: getBatchManager().batchUpdate.bind(getBatchManager()),
    batchDelete: getBatchManager().batchDelete.bind(getBatchManager()),
    batchUpsert: getBatchManager().batchUpsert.bind(getBatchManager()),
    executeTransaction: getBatchManager().executeTransaction.bind(getBatchManager()),
    getOperationProgress: getBatchManager().getOperationProgress.bind(getBatchManager()),
    cancelOperation: getBatchManager().cancelOperation.bind(getBatchManager()),
    getActiveOperations: getBatchManager().getActiveOperations.bind(getBatchManager())
  };
};