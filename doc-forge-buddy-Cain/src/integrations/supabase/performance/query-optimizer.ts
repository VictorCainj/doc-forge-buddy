// Otimizador de queries do Supabase
export interface QueryOptimization {
  useSelectColumns: string[];  // Evitar SELECT *
  useIndexHints: string[];     // Usar índices
  useJoinHints: string[];      // Otimizar joins
  usePagination: boolean;      // Paginação eficiente
  useOrderBy: { column: string; ascending: boolean }[];
  useLimit?: number;
  useOffset?: number;
  useWhereOptimization?: boolean;
  useJoinOptimization?: boolean;
  useAggregateOptimization?: boolean;
}

export interface OptimizationRule {
  pattern: RegExp;
  apply: (query: string, context: any) => string;
  priority: number;
  description: string;
}

export class QueryOptimizer {
  private optimizationRules: OptimizationRule[] = [];
  private tableIndexes: Map<string, string[]> = new Map();
  private tableStats: Map<string, { rowCount: number; lastAnalyzed: number }> = new Map();

  constructor() {
    this.initializeOptimizationRules();
    this.loadTableMetadata();
  }

  // Aplicar otimizações de seleção de colunas
  optimizeSelectColumns(columns: string[], table: string): string[] {
    // Evitar SELECT *
    if (columns.length === 1 && columns[0] === '*') {
      const optimizedColumns = this.getOptimizedColumnsForTable(table);
      return optimizedColumns.length > 0 ? optimizedColumns : columns;
    }

    // Verificar se há colunas desnecessárias
    const essentialColumns = this.getEssentialColumnsForTable(table);
    return columns.filter(col => essentialColumns.includes(col) || col === '*');
  }

  // Otimizar WHERE clause
  optimizeWhereColumn(column: string): string {
    // Aplicar index hints
    const tableIndexes = this.getTableIndexes(this.getCurrentTable());
    if (tableIndexes.includes(column)) {
      return `/*+ INDEX(${column}) */ ${column}`;
    }

    return column;
  }

  // Otimizar ORDER BY
  optimizeOrderColumn(column: string): string {
    // Verificar se há índice para ORDER BY
    const indexes = this.getTableIndexes(this.getCurrentTable());
    if (indexes.includes(column)) {
      return `/*+ INDEX_SORT(${column}) */ ${column}`;
    }

    return column;
  }

  // Otimizar GROUP BY
  optimizeGroupColumn(column: string): string {
    // Verificar se é uma boa coluna para group by
    const highCardinalityColumns = this.getHighCardinalityColumns(this.getCurrentTable());
    if (highCardinalityColumns.includes(column)) {
      return `/*+ GROUP_INDEX(${column}) */ ${column}`;
    }

    return column;
  }

  // Otimizar JOINs
  optimizeJoin(table: string, condition: string, type: string): { table: string; condition: string; type: string } {
    // Verificar se há índices para o JOIN
    const joinIndexes = this.getJoinIndexes(table, condition);
    
    if (joinIndexes.length > 0) {
      return {
        table: `/*+ INDEX_JOIN(${joinIndexes.join(',')}) */ ${table}`,
        condition: `/*+ OPTIMIZE_JOIN */ ${condition}`,
        type
      };
    }

    // Aplicar heurísticas de JOIN
    if (type === 'inner' && this.isLargeTable(table)) {
      return {
        table,
        condition: `/*+ LARGE_TABLE_JOIN */ ${condition}`,
        type: 'inner'
      };
    }

    return { table, condition, type };
  }

  // Otimizar paginação
  optimizePagination(page: number, pageSize: number, totalRows: number): { offset: number; limit: number; hasMore: boolean } {
    const offset = (page - 1) * pageSize;
    const hasMore = offset + pageSize < totalRows;
    
    // Usar keyset pagination para grandes datasets
    if (totalRows > 10000) {
      return {
        offset: 0, // Será substituído por keyset
        limit: pageSize,
        hasMore
      };
    }

    return { offset, limit: pageSize, hasMore };
  }

  // Gerar query otimizada
  generateOptimizedQuery(baseQuery: string, optimizations: QueryOptimization): string {
    let optimizedQuery = baseQuery;

    // Aplicar regras de otimização
    const rules = this.optimizationRules
      .filter(rule => rule.pattern.test(baseQuery))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      optimizedQuery = rule.apply(optimizedQuery, optimizations);
    }

    return optimizedQuery;
  }

  // Analisar performance de query
  analyzeQueryPerformance(query: string): {
    score: number;
    issues: string[];
    suggestions: string[];
    estimatedTime: number;
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;
    let estimatedTime = 1; // ms

    // Verificar SELECT *
    if (query.toLowerCase().includes('select *')) {
      issues.push('Query usa SELECT * (desnecessário)');
      suggestions.push('Especificar colunas específicas');
      score -= 20;
      estimatedTime += 10;
    }

    // Verificar JOINs sem condições
    const joinWithoutCondition = query.match(/join\s+\w+\s+(?!on)/gi);
    if (joinWithoutCondition) {
      issues.push('JOIN sem condição ON');
      suggestions.push('Adicionar condições de JOIN específicas');
      score -= 15;
      estimatedTime += 50;
    }

    // Verificar ORDER BY em colunas sem índice
    const orderByMatches = query.match(/order\s+by\s+(\w+)/gi);
    if (orderByMatches) {
      for (const match of orderByMatches) {
        const column = match.replace(/order\s+by\s+/gi, '').trim();
        if (!this.hasIndexForColumn(this.getCurrentTable(), column)) {
          issues.push(`ORDER BY em coluna sem índice: ${column}`);
          suggestions.push(`Criar índice para coluna ${column}`);
          score -= 10;
          estimatedTime += 20;
        }
      }
    }

    // Verificar LIKE no início
    const likeAtStart = query.match(/like\s+['"]%/gi);
    if (likeAtStart) {
      issues.push('LIKE com % no início (não usa índice)');
      suggestions.push('Usar LIKE com prefixo fixo quando possível');
      score -= 15;
      estimatedTime += 30;
    }

    // Verificar subconsultas correlacionadas
    const correlatedSubquery = query.match(/\w+\s+in\s*\(\s*select/gi);
    if (correlatedSubquery) {
      issues.push('Subconsulta correlacionada detectada');
      suggestions.push('Considerar JOIN em vez de subconsulta');
      score -= 25;
      estimatedTime += 100;
    }

    // Ajustar score mínimo
    score = Math.max(0, score);

    return { score, issues, suggestions, estimatedTime };
  }

  // Detectar query patterns problemáticos
  detectProblematicPatterns(query: string): {
    pattern: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    fix: string;
  }[] {
    const patterns = [];

    // Pattern 1: SELECT * em tabela grande
    if (query.toLowerCase().includes('select *') && this.isLargeTable(this.getCurrentTable())) {
      patterns.push({
        pattern: 'SELECT *',
        severity: 'high' as const,
        description: 'SELECT * em tabela com muitos registros',
        fix: 'Especificar apenas as colunas necessárias'
      });
    }

    // Pattern 2: Múltiplos JOINs
    const joinCount = (query.match(/join/gi) || []).length;
    if (joinCount > 3) {
      patterns.push({
        pattern: 'Multiple JOINs',
        severity: 'medium' as const,
        description: `${joinCount} JOINs podem impactar performance`,
        fix: 'Considerar desnormalização ou materialized views'
      });
    }

    // Pattern 3: Função em WHERE clause
    const functionInWhere = query.match(/where\s+.*\w+\s*\(/gi);
    if (functionInWhere) {
      patterns.push({
        pattern: 'Function in WHERE',
        severity: 'medium' as const,
        description: 'Função na cláusula WHERE impede uso de índice',
        fix: 'Mover função para o lado direito da comparação'
      });
    }

    // Pattern 4: OR conditions
    const orConditions = (query.match(/\bor\b/gi) || []).length;
    if (orConditions > 2) {
      patterns.push({
        pattern: 'Multiple OR conditions',
        severity: 'medium' as const,
        description: 'Múltiplas condições OR podem ser lentas',
        fix: 'Considerar UNION ou índices especializados'
      });
    }

    return patterns;
  }

  // Gerar índices sugeridos
  generateIndexSuggestions(query: string, table: string): {
    column: string;
    type: 'single' | 'composite' | 'partial';
    reason: string;
    estimated_improvement: number;
  }[] {
    const suggestions = [];

    // Analisar colunas em WHERE
    const whereMatches = query.match(/where\s+(\w+)/gi);
    if (whereMatches) {
      for (const match of whereMatches) {
        const column = match.replace(/where\s+/gi, '');
        suggestions.push({
          column,
          type: 'single' as const,
          reason: 'Coluna usada em WHERE clause',
          estimated_improvement: 0.3
        });
      }
    }

    // Analisar colunas em ORDER BY
    const orderMatches = query.match(/order\s+by\s+(\w+)/gi);
    if (orderMatches) {
      for (const match of orderMatches) {
        const column = match.replace(/order\s+by\s+/gi, '');
        suggestions.push({
          column,
          type: 'single' as const,
          reason: 'Coluna usada em ORDER BY',
          estimated_improvement: 0.4
        });
      }
    }

    // Analisar combinações WHERE + ORDER BY
    if (whereMatches && orderMatches) {
      const whereColumn = whereMatches[0].replace(/where\s+/gi, '');
      const orderColumn = orderMatches[0].replace(/order\s+by\s+/gi, '');
      
      suggestions.push({
        column: `${whereColumn},${orderColumn}`,
        type: 'composite' as const,
        reason: 'Combinação WHERE + ORDER BY',
        estimated_improvement: 0.6
      });
    }

    return suggestions;
  }

  // Inicializar regras de otimização
  private initializeOptimizationRules(): void {
    // Regra 1: Converter SELECT * para colunas específicas
    this.optimizationRules.push({
      pattern: /select\s+\*/gi,
      apply: (query: string) => {
        const table = this.extractTableName(query);
        const columns = this.getOptimizedColumnsForTable(table);
        return query.replace(/select\s+\*/gi, `select ${columns.join(', ')}`);
      },
      priority: 100,
      description: 'Converter SELECT * para colunas específicas'
    });

    // Regra 2: Adicionar LIMIT em queries sem ORDER BY
    this.optimizationRules.push({
      pattern: /select\s+.*from\s+\w+(?!\s*order\s+by)(?!\s*limit)/gi,
      apply: (query: string) => {
        if (this.isLargeTable(this.getCurrentTable())) {
          return query + ' limit 100';
        }
        return query;
      },
      priority: 80,
      description: 'Adicionar LIMIT em tabelas grandes'
    });

    // Regra 3: Otimizar LIKE patterns
    this.optimizationRules.push({
      pattern: /like\s+['"]%/gi,
      apply: (query: string) => {
        return query.replace(/like\s+['"]%/gi, 'ilike');
      },
      priority: 70,
      description: 'Converter LIKE % para ilike (mais eficiente)'
    });

    // Regra 4: Adicionar hints de índice
    this.optimizationRules.push({
      pattern: /where\s+(\w+)/gi,
      apply: (query: string, context: any) => {
        const indexes = this.getTableIndexes(this.getCurrentTable());
        return query.replace(/where\s+(\w+)/gi, (match, column) => {
          if (indexes.includes(column)) {
            return `where /*+ INDEX(${column}) */ ${column}`;
          }
          return match;
        });
      },
      priority: 60,
      description: 'Adicionar hints de índice'
    });
  }

  // Carregar metadados das tabelas
  private loadTableMetadata(): void {
    // Simular metadados das tabelas
    // Em produção, isso viria de um catálogo do banco
    this.tableIndexes.set('contracts', ['id', 'user_id', 'created_at', 'status']);
    this.tableIndexes.set('users', ['id', 'email', 'created_at']);
    this.tableIndexes.set('vistorias', ['id', 'contract_id', 'created_at', 'status']);
    this.tableIndexes.set('prestadores', ['id', 'user_id', 'specialty', 'created_at']);
  }

  // Obter colunas otimizadas para uma tabela
  private getOptimizedColumnsForTable(table: string): string[] {
    const optimizedColumns: Record<string, string[]> = {
      contracts: ['id', 'user_id', 'status', 'created_at', 'updated_at'],
      users: ['id', 'email', 'name', 'created_at'],
      vistorias: ['id', 'contract_id', 'status', 'created_at', 'completed_at'],
      prestadores: ['id', 'user_id', 'name', 'specialty', 'rating']
    };

    return optimizedColumns[table] || ['*'];
  }

  // Obter colunas essenciais
  private getEssentialColumnsForTable(table: string): string[] {
    const essential: Record<string, string[]> = {
      contracts: ['id', 'status', 'user_id'],
      users: ['id', 'email'],
      vistorias: ['id', 'contract_id', 'status'],
      prestadores: ['id', 'user_id', 'specialty']
    };

    return essential[table] || [];
  }

  // Obter colunas de alta cardinalidade
  private getHighCardinalityColumns(table: string): string[] {
    const highCardinality: Record<string, string[]> = {
      contracts: ['id', 'user_id'],
      users: ['id', 'email'],
      vistorias: ['id', 'contract_id'],
      prestadores: ['id']
    };

    return highCardinality[table] || [];
  }

  // Verificar se tabela é grande
  private isLargeTable(table: string): boolean {
    const stats = this.tableStats.get(table);
    if (stats) {
      return stats.rowCount > 10000;
    }
    
    // Valores padrão por tabela
    const largeTables = ['contracts', 'vistorias', 'documents'];
    return largeTables.includes(table);
  }

  // Obter índices de tabela
  private getTableIndexes(table: string): string[] {
    return this.tableIndexes.get(table) || [];
  }

  // Verificar se coluna tem índice
  private hasIndexForColumn(table: string, column: string): boolean {
    return this.getTableIndexes(table).includes(column);
  }

  // Obter índices de JOIN
  private getJoinIndexes(table: string, condition: string): string[] {
    // Analisar condições de JOIN para sugerir índices
    const joinColumn = condition.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
    if (joinColumn) {
      return [joinColumn[2], joinColumn[4]];
    }
    return [];
  }

  // Extrair nome da tabela da query
  private extractTableName(query: string): string {
    const match = query.match(/from\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  // Obter tabela atual (simplificado)
  private getCurrentTable(): string {
    // Em uma implementação real, isso seria mantido no contexto
    return 'contracts'; // padrão
  }

  // Atualizar estatísticas de tabela
  updateTableStats(table: string, rowCount: number): void {
    this.tableStats.set(table, {
      rowCount,
      lastAnalyzed: Date.now()
    });
  }

  // Obter estatísticas de query
  getQueryStats(query: string) {
    return {
      estimatedRows: this.estimateRows(query),
      complexity: this.calculateComplexity(query),
      executionPlan: this.generateExecutionPlan(query)
    };
  }

  // Estimar número de linhas
  private estimateRows(query: string): number {
    const table = this.extractTableName(query);
    const stats = this.tableStats.get(table);
    
    if (!stats) {
      return 1000; // valor padrão
    }

    // Heurísticas simples
    if (query.toLowerCase().includes('where')) {
      return Math.floor(stats.rowCount * 0.1);
    }
    
    return stats.rowCount;
  }

  // Calcular complexidade
  private calculateComplexity(query: string): 'low' | 'medium' | 'high' {
    let complexity = 0;
    
    complexity += (query.match(/join/gi) || []).length * 10;
    complexity += (query.match(/subselect/gi) || []).length * 15;
    complexity += (query.match(/group\s+by/gi) || []).length * 5;
    complexity += (query.match(/order\s+by/gi) || []).length * 3;
    
    if (complexity < 20) return 'low';
    if (complexity < 50) return 'medium';
    return 'high';
  }

  // Gerar plano de execução
  private generateExecutionPlan(query: string): string[] {
    const plan: string[] = [];
    
    if (query.toLowerCase().includes('select')) {
      plan.push('TABLE ACCESS FULL (scan completo)');
    }
    
    if (query.toLowerCase().includes('where')) {
      plan.push('INDEX RANGE SCAN (se índices disponíveis)');
    }
    
    if (query.toLowerCase().includes('order by')) {
      plan.push('SORT ORDER BY (ordenação)');
    }
    
    if (query.toLowerCase().includes('join')) {
      plan.push('NESTED LOOP JOIN (ou HASH JOIN)');
    }
    
    return plan;
  }
}