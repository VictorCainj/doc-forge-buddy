import { supabase } from './client';
import { CacheManager } from './cache/cache-manager';
import { QueryOptimizer } from './performance/query-optimizer';
import { QueryAnalytics } from './monitoring/query-analytics';
import type { Database } from './types';

// Tipos de erro específicos do Supabase
export class SupabaseQueryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseQueryError';
  }
}

// Interface para configurações de query
export interface QueryBuilderConfig {
  table: string;
  cacheTTL?: number;
  cacheStrategy?: 'memory' | 'redis' | 'localStorage' | 'hybrid';
  enableAnalytics?: boolean;
  batchSize?: number;
  retryAttempts?: number;
  timeout?: number;
}

// Interface para otimizações de query
export interface QueryOptimization {
  useSelectColumns: string[];  // Evitar SELECT *
  useIndexHints: string[];     // Usar índices
  useJoinHints: string[];      // Otimizar joins
  usePagination: boolean;      // Paginação eficiente
  useOrderBy: { column: string; ascending: boolean }[];
  useLimit?: number;
  useOffset?: number;
}

// Query builder otimizado com cache e analytics
export class SupabaseQueryBuilder<T = any> {
  private query = supabase.from(this.table);
  private cacheKey = '';
  private cacheTTL: number;
  private config: QueryBuilderConfig;
  private optimizer: QueryOptimizer;
  private analytics: QueryAnalytics;
  private cacheManager: CacheManager;

  constructor(
    private table: string,
    config: Partial<QueryBuilderConfig> = {}
  ) {
    this.config = {
      table,
      cacheTTL: 5 * 60 * 1000, // 5 minutos por padrão
      cacheStrategy: 'hybrid',
      enableAnalytics: true,
      batchSize: 100,
      retryAttempts: 3,
      timeout: 30000,
      ...config
    };

    this.cacheTTL = this.config.cacheTTL!;
    this.optimizer = new QueryOptimizer();
    this.analytics = new QueryAnalytics();
    this.cacheManager = new CacheManager();
  }

  // Seleção otimizada de colunas
  select(columns: string | string[] = '*'): this {
    const columnsArray = Array.isArray(columns) ? columns : [columns];
    
    // Otimizar seleção de colunas
    this.query = this.query.select(
      this.optimizer.optimizeSelectColumns(columnsArray, this.table)
    );
    
    this.cacheKey += `select:${columnsArray.join(',')}`;
    return this;
  }

  // WHERE clause com otimizações
  where(column: keyof Database['public']['Tables'][string]['Row'], operator: string, value: any): this {
    // Aplicar otimizações de índice
    const optimizedColumn = this.optimizer.optimizeWhereColumn(column as string);
    this.query = this.query[operator](optimizedColumn, value);
    
    this.cacheKey += `|${column}:${operator}:${value}`;
    return this;
  }

  // Equal condition otimizada
  eq(column: keyof Database['public']['Tables'][string]['Row'], value: any): this {
    return this.where(column, 'eq', value);
  }

  // Greater than otimizada
  gt(column: keyof Database['public']['Tables'][string]['Row'], value: any): this {
    return this.where(column, 'gt', value);
  }

  // Less than otimizada
  lt(column: keyof Database['public']['Tables'][string]['Row'], value: any): this {
    return this.where(column, 'lt', value);
  }

  // Gte otimizada
  gte(column: keyof Database['public']['Tables'][string]['Row'], value: any): this {
    return this.where(column, 'gte', value);
  }

  // Lte otimizada
  lte(column: keyof Database['public']['Tables'][string]['Row'], value: any): this {
    return this.where(column, 'lte', value);
  }

  // Like otimizada
  like(column: keyof Database['public']['Tables'][string]['Row'], pattern: string): this {
    return this.where(column, 'like', pattern);
  }

  // ILike otimizada
  ilike(column: keyof Database['public']['Tables'][string]['Row'], pattern: string): this {
    return this.where(column, 'ilike', pattern);
  }

  // In otimizada
  in(column: keyof Database['public']['Tables'][string]['Row'], values: any[]): this {
    return this.where(column, 'in', `(${values.join(',')})`);
  }

  // OrderBy otimizado
  order(column: keyof Database['public']['Tables'][string]['Row'], ascending = true): this {
    const optimizedColumn = this.optimizer.optimizeOrderColumn(column as string);
    this.query = this.query.order(optimizedColumn, { ascending });
    
    this.cacheKey += `|order:${column}:${ascending}`;
    return this;
  }

  // Limit otimizado
  limit(count: number): this {
    this.query = this.query.limit(count);
    this.cacheKey += `|limit:${count}`;
    return this;
  }

  // Range otimizado
  range(from: number, to: number): this {
    this.query = this.query.range(from, to);
    this.cacheKey += `|range:${from}:${to}`;
    return this;
  }

  // Paginação eficiente
  paginate(page: number, pageSize: number): this {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    return this.range(from, to);
  }

  // JOIN otimizado
  join(
    table: string,
    condition: string,
    type: 'inner' | 'left' | 'right' | 'full' = 'inner'
  ): this {
    // Aplicar otimizações de JOIN
    const optimizedJoin = this.optimizer.optimizeJoin(table, condition, type);
    
    // Implementação de JOIN via RPC ou views otimizadas
    this.query = this.query.rpc('optimized_join', {
      join_table: table,
      join_condition: condition,
      join_type: type
    });
    
    this.cacheKey += `|join:${table}:${type}`;
    return this;
  }

  // GroupBy otimizado
  groupBy(column: keyof Database['public']['Tables'][string]['Row']): this {
    const optimizedColumn = this.optimizer.optimizeGroupColumn(column as string);
    
    // Implementar via RPC para melhor performance
    this.query = this.query.rpc('group_by_optimized', {
      group_column: optimizedColumn
    });
    
    this.cacheKey += `|group:${column}`;
    return this;
  }

  // Agregações otimizadas
  count(): this {
    this.query = this.query.rpc('count_optimized');
    this.cacheKey += `|count`;
    return this;
  }

  sum(column: keyof Database['public']['Tables'][string]['Row']): this {
    this.query = this.query.rpc('sum_optimized', { sum_column: column });
    this.cacheKey += `|sum:${column}`;
    return this;
  }

  avg(column: keyof Database['public']['Tables'][string]['Row']): this {
    this.query = this.query.rpc('avg_optimized', { avg_column: column });
    this.cacheKey += `|avg:${column}`;
    return this;
  }

  // Filtros de segurança e performance
  security(): this {
    // Adicionar RLS policies automaticamente
    this.query = this.query.rpc('apply_rls_policies', {
      table_name: this.table
    });
    
    this.cacheKey += `|security`;
    return this;
  }

  // Cache strategy
  withCache(strategy: 'memory' | 'redis' | 'localStorage' | 'hybrid' = 'hybrid'): this {
    this.config.cacheStrategy = strategy;
    return this;
  }

  // TTL customizado
  withTTL(ttl: number): this {
    this.cacheTTL = ttl;
    return this;
  }

  // Analytics enabled
  withAnalytics(enabled: boolean = true): this {
    this.config.enableAnalytics = enabled;
    return this;
  }

  // Execução da query com cache e otimizações
  async execute(): Promise<T[]> {
    const startTime = performance.now();
    const queryId = this.generateQueryId();

    try {
      // Verificar cache primeiro
      const cached = await this.getFromCache();
      if (cached && !this.isCacheStale()) {
        this.logQueryPerformance(startTime, queryId, 'cache_hit');
        return cached;
      }

      // Executar query otimizada
      const { data, error, count } = await this.executeWithRetry();

      if (error) {
        throw new SupabaseQueryError(
          error.message,
          error.code,
          error.details,
          error.hint
        );
      }

      // Salvar no cache
      await this.setCache(data || []);

      // Log de performance
      this.logQueryPerformance(startTime, queryId, 'success', count);

      return data || [];
    } catch (error) {
      this.logQueryPerformance(startTime, queryId, 'error');
      throw error;
    }
  }

  // Execução com retry e timeout
  private async executeWithRetry(): Promise<any> {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), this.config.timeout);
    });

    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        const result = await Promise.race([
          this.query,
          timeout
        ]);

        return result;
      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw error;
        }

        // Backoff exponencial
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    throw new Error('Max retry attempts reached');
  }

  // Cache management
  private async getFromCache(): Promise<T[] | null> {
    if (!this.cacheKey) return null;

    const cached = await this.cacheManager.get(this.cacheKey, this.config.cacheStrategy!);
    return cached;
  }

  private async setCache(data: T[]): Promise<void> {
    if (!this.cacheKey || !data.length) return;

    await this.cacheManager.set(
      this.cacheKey,
      data,
      this.cacheTTL,
      this.config.cacheStrategy!
    );
  }

  private isCacheStale(): boolean {
    // Implementar lógica de validação de cache stale
    return false;
  }

  // Performance logging
  private logQueryPerformance(
    startTime: number,
    queryId: string,
    status: 'cache_hit' | 'success' | 'error',
    count?: number
  ): void {
    if (!this.config.enableAnalytics) return;

    const duration = performance.now() - startTime;
    const queryInfo = {
      queryId,
      table: this.table,
      cacheKey: this.cacheKey,
      duration,
      status,
      count,
      timestamp: new Date().toISOString(),
      strategy: this.config.cacheStrategy
    };

    this.analytics.logQuery(queryInfo);
  }

  private generateQueryId(): string {
    return `${this.table}:${btoa(this.cacheKey).slice(0, 16)}:${Date.now()}`;
  }

  // Obter apenas uma linha
  async single(): Promise<T | null> {
    this.limit(1);
    const results = await this.execute();
    return results.length > 0 ? results[0] : null;
  }

  // Obter primeira linha ou error
  async maybeSingle(): Promise<T | null> {
    this.limit(1);
    const results = await this.execute();
    return results.length > 0 ? results[0] : null;
  }

  // Contar registros
  async count(): Promise<number> {
    const query = this.query.select('*', { count: 'exact', head: true });
    const { count, error } = await query;
    
    if (error) {
      throw new SupabaseQueryError(error.message, error.code, error.details, error.hint);
    }

    return count || 0;
  }

  // Verificar se existe
  async exists(): Promise<boolean> {
    const result = await this.single();
    return result !== null;
  }

  // Limpar cache desta query
  async clearCache(): Promise<void> {
    if (this.cacheKey) {
      await this.cacheManager.delete(this.cacheKey, this.config.cacheStrategy!);
    }
  }
}

// Factory function para facilitar uso
export function createQueryBuilder<T = any>(
  table: string,
  config?: Partial<QueryBuilderConfig>
): SupabaseQueryBuilder<T> {
  return new SupabaseQueryBuilder<T>(table, config);
}

// Export do supabase client para compatibilidade
export { supabase } from './client';