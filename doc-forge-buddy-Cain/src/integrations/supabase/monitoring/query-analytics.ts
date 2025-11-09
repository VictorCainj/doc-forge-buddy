// Analytics e monitoramento de queries
export interface QueryMetrics {
  queryId: string;
  table: string;
  queryType: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  duration: number;
  cacheHit: boolean;
  cacheStrategy: string;
  rowsAffected?: number;
  timestamp: number;
  userId?: string;
  status: 'success' | 'error' | 'timeout';
  error?: string;
  metadata?: Record<string, any>;
}

export interface SlowQuery {
  queryId: string;
  query: string;
  duration: number;
  timestamp: number;
  frequency: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
}

export interface QueryPerformanceStats {
  totalQueries: number;
  averageDuration: number;
  cacheHitRate: number;
  errorRate: number;
  slowestQueries: SlowQuery[];
  queryDistribution: Record<string, number>;
  performanceTrends: Array<{
    timestamp: number;
    averageDuration: number;
    queryCount: number;
  }>;
}

export interface QueryOptimization {
  table: string;
  column: string;
  type: 'index' | 'statistics' | 'partition' | 'materialized_view';
  reason: string;
  estimatedImprovement: number;
  priority: 'low' | 'medium' | 'high';
}

export class QueryAnalytics {
  private metrics: QueryMetrics[] = [];
  private queryPatterns = new Map<string, { count: number; totalDuration: number; lastUsed: number }>();
  private slowQueryThreshold = 1000; // 1 segundo
  private maxMetricsHistory = 10000;
  private analyticsBuffer: QueryMetrics[] = [];

  // Log de query
  logQuery(metrics: Partial<QueryMetrics>): void {
    const fullMetrics: QueryMetrics = {
      queryId: metrics.queryId || this.generateQueryId(),
      table: metrics.table || 'unknown',
      queryType: metrics.queryType || 'select',
      duration: metrics.duration || 0,
      cacheHit: metrics.cacheHit || false,
      cacheStrategy: metrics.cacheStrategy || 'none',
      rowsAffected: metrics.rowsAffected || 0,
      timestamp: metrics.timestamp || Date.now(),
      userId: metrics.userId,
      status: metrics.status || 'success',
      error: metrics.error,
      metadata: metrics.metadata
    };

    // Adicionar ao buffer
    this.analyticsBuffer.push(fullMetrics);

    // Processar em batch se buffer está cheio
    if (this.analyticsBuffer.length >= 100) {
      this.flushMetrics();
    }

    // Atualizar padrões de query
    this.updateQueryPattern(fullMetrics);
  }

  // Log de operação em lote
  logBatchOperation(operation: {
    operationId: string;
    type: string;
    table: string;
    totalItems: number;
    success: number;
    failed: number;
    duration: number;
    error?: string;
    timestamp: number;
  }): void {
    // Log individual para cada item processado
    const avgDurationPerItem = operation.duration / operation.totalItems;
    
    for (let i = 0; i < operation.totalItems; i++) {
      const isSuccess = i < operation.success;
      this.logQuery({
        queryId: `${operation.operationId}_item_${i}`,
        table: operation.table,
        queryType: operation.type as any,
        duration: avgDurationPerItem,
        cacheHit: false,
        cacheStrategy: 'none',
        status: isSuccess ? 'success' : 'error',
        error: isSuccess ? undefined : operation.error,
        metadata: {
          operationId: operation.operationId,
          batchIndex: i,
          totalItems: operation.totalItems
        }
      });
    }
  }

  // Log de erro
  logError(error: any, context: { queryId?: string; table?: string; queryType?: string }): void {
    this.logQuery({
      queryId: context.queryId,
      table: context.table,
      queryType: context.queryType as any,
      duration: 0,
      cacheHit: false,
      cacheStrategy: 'none',
      status: 'error',
      error: error?.message || 'Unknown error',
      metadata: {
        errorStack: error?.stack,
        errorCode: error?.code
      }
    });
  }

  // Detectar queries lentas
  detectSlowQueries(): SlowQuery[] {
    const slowQueries: SlowQuery[] = [];
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    for (const [pattern, data] of this.queryPatterns.entries()) {
      if (data.lastUsed < oneHourAgo) continue;

      const averageDuration = data.totalDuration / data.count;
      
      if (averageDuration > this.slowQueryThreshold) {
        const impact = this.calculateImpact(averageDuration, data.count);
        const suggestions = this.generateSuggestions(pattern, averageDuration);

        slowQueries.push({
          queryId: this.generateQueryId(),
          query: pattern,
          duration: averageDuration,
          timestamp: data.lastUsed,
          frequency: data.count,
          impact,
          suggestions
        });
      }
    }

    return slowQueries.sort((a, b) => b.duration - a.duration);
  }

  // Obter estatísticas de performance
  getPerformanceStats(timeRange: { start: number; end: number }): QueryPerformanceStats {
    const filteredMetrics = this.metrics.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    const totalQueries = filteredMetrics.length;
    const cacheHits = filteredMetrics.filter(m => m.cacheHit).length;
    const errors = filteredMetrics.filter(m => m.status === 'error').length;

    const averageDuration = totalQueries > 0 
      ? filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0;

    const slowQueries = this.detectSlowQueries();

    // Distribuição de queries por tabela
    const queryDistribution: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      queryDistribution[m.table] = (queryDistribution[m.table] || 0) + 1;
    });

    // Tendências de performance
    const performanceTrends = this.calculatePerformanceTrends(timeRange);

    return {
      totalQueries,
      averageDuration,
      cacheHitRate: totalQueries > 0 ? cacheHits / totalQueries : 0,
      errorRate: totalQueries > 0 ? errors / totalQueries : 0,
      slowestQueries: slowQueries.slice(0, 10),
      queryDistribution,
      performanceTrends
    };
  }

  // Gerar otimizações sugeridas
  generateOptimizations(): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];

    // Analisar padrões de query para sugerir índices
    for (const [pattern, data] of this.queryPatterns.entries()) {
      const table = this.extractTableFromPattern(pattern);
      const whereColumns = this.extractWhereColumns(pattern);
      
      for (const column of whereColumns) {
        if (data.count > 100) { // Só sugerir para queries frequentes
          optimizations.push({
            table,
            column,
            type: 'index',
            reason: `Coluna usada frequentemente em WHERE (${data.count} vezes)`,
            estimatedImprovement: Math.min(0.8, data.count / 1000),
            priority: data.count > 500 ? 'high' : data.count > 200 ? 'medium' : 'low'
          });
        }
      }

      // Sugerir estatísticas para colunas com alta cardinalidade
      const orderColumns = this.extractOrderColumns(pattern);
      for (const column of orderColumns) {
        optimizations.push({
          table,
          column,
          type: 'statistics',
          reason: 'Coluna usada em ORDER BY - atualizar estatísticas',
          estimatedImprovement: 0.2,
          priority: 'medium'
        });
      }
    }

    return optimizations.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);
  }

  // Dashboard de métricas
  getDashboardMetrics(): {
    overview: {
      totalQueries: number;
      averageResponseTime: number;
      cacheHitRate: number;
      errorRate: number;
      uptime: number;
    };
    topTables: Array<{ table: string; queryCount: number; avgDuration: number }>;
    recentSlowQueries: SlowQuery[];
    performanceAlerts: Array<{ level: string; message: string; timestamp: number }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    const dailyMetrics = this.metrics.filter(m => m.timestamp > oneDayAgo);

    // Overview
    const overview = {
      totalQueries: recentMetrics.length,
      averageResponseTime: recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0,
      cacheHitRate: recentMetrics.length > 0 
        ? recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length
        : 0,
      errorRate: recentMetrics.length > 0 
        ? recentMetrics.filter(m => m.status === 'error').length / recentMetrics.length
        : 0,
      uptime: 100 - (recentMetrics.filter(m => m.status === 'error').length / recentMetrics.length) * 100
    };

    // Top tables
    const tableStats = new Map<string, { count: number; totalDuration: number }>();
    recentMetrics.forEach(m => {
      const current = tableStats.get(m.table) || { count: 0, totalDuration: 0 };
      current.count++;
      current.totalDuration += m.duration;
      tableStats.set(m.table, current);
    });

    const topTables = Array.from(tableStats.entries())
      .map(([table, stats]) => ({
        table,
        queryCount: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 10);

    // Slow queries recentes
    const recentSlowQueries = this.detectSlowQueries()
      .filter(q => q.timestamp > oneHourAgo)
      .slice(0, 5);

    // Alertas de performance
    const performanceAlerts = this.generatePerformanceAlerts();

    return {
      overview,
      topTables,
      recentSlowQueries,
      performanceAlerts
    };
  }

  // Exportar dados para análise externa
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: this.metrics,
      queryPatterns: Object.fromEntries(this.queryPatterns),
      exportTimestamp: Date.now(),
      version: '1.0.0'
    };

    if (format === 'csv') {
      return this.metricsToCSV();
    }

    return JSON.stringify(data, null, 2);
  }

  // Limpar métricas antigas
  cleanOldMetrics(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    const beforeCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    // Limpar padrões antigos também
    for (const [pattern, data] of this.queryPatterns.entries()) {
      if (data.lastUsed < cutoff) {
        this.queryPatterns.delete(pattern);
      }
    }

    console.debug(`Cleaned ${beforeCount - this.metrics.length} old metrics`);
  }

  // Processar buffer de métricas
  private flushMetrics(): void {
    if (this.analyticsBuffer.length === 0) return;

    this.metrics.push(...this.analyticsBuffer);
    this.analyticsBuffer = [];

    // Manter apenas o histórico necessário
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  // Atualizar padrão de query
  private updateQueryPattern(metrics: QueryMetrics): void {
    const pattern = this.createQueryPattern(metrics);
    const existing = this.queryPatterns.get(pattern);
    
    if (existing) {
      existing.count++;
      existing.totalDuration += metrics.duration;
      existing.lastUsed = metrics.timestamp;
    } else {
      this.queryPatterns.set(pattern, {
        count: 1,
        totalDuration: metrics.duration,
        lastUsed: metrics.timestamp
      });
    }
  }

  // Criar padrão de query
  private createQueryPattern(metrics: QueryMetrics): string {
    // Simplificado - em produção seria mais sofisticado
    return `${metrics.queryType}:${metrics.table}`;
  }

  // Calcular impacto
  private calculateImpact(duration: number, frequency: number): 'low' | 'medium' | 'high' | 'critical' {
    const impactScore = (duration / 1000) * frequency;
    
    if (impactScore > 100) return 'critical';
    if (impactScore > 50) return 'high';
    if (impactScore > 10) return 'medium';
    return 'low';
  }

  // Gerar sugestões
  private generateSuggestions(pattern: string, duration: number): string[] {
    const suggestions: string[] = [];

    if (duration > 2000) {
      suggestions.push('Query muito lenta - considerar otimização urgente');
      suggestions.push('Verificar índices nas colunas WHERE');
    }

    if (pattern.includes('select *')) {
      suggestions.push('Evitar SELECT * - especificar colunas necessárias');
    }

    if (pattern.includes('join')) {
      suggestions.push('Verificar se JOINs estão otimizados');
      suggestions.push('Considerar materialized views para JOINs complexos');
    }

    if (pattern.includes('order by')) {
      suggestions.push('Verificar índices para ORDER BY');
    }

    if (pattern.includes('like')) {
      suggestions.push('LIKE com wildcard pode ser lento - usar índices adequados');
    }

    return suggestions;
  }

  // Extrair tabela do padrão
  private extractTableFromPattern(pattern: string): string {
    const match = pattern.match(/:(\w+)/);
    return match ? match[1] : 'unknown';
  }

  // Extrair colunas WHERE
  private extractWhereColumns(pattern: string): string[] {
    // Simplificado - em produção seria parsing real da query
    const matches = pattern.match(/where\s+(\w+)/gi);
    return matches ? matches.map(m => m.replace(/where\s+/gi, '')) : [];
  }

  // Extrair colunas ORDER BY
  private extractOrderColumns(pattern: string): string[] {
    const matches = pattern.match(/order\s+by\s+(\w+)/gi);
    return matches ? matches.map(m => m.replace(/order\s+by\s+/gi, '')) : [];
  }

  // Calcular tendências de performance
  private calculatePerformanceTrends(timeRange: { start: number; end: number }) {
    const interval = 15 * 60 * 1000; // 15 minutos
    const trends = [];
    
    for (let timestamp = timeRange.start; timestamp <= timeRange.end; timestamp += interval) {
      const nextTimestamp = timestamp + interval;
      const intervalMetrics = this.metrics.filter(
        m => m.timestamp >= timestamp && m.timestamp < nextTimestamp
      );
      
      const avgDuration = intervalMetrics.length > 0
        ? intervalMetrics.reduce((sum, m) => sum + m.duration, 0) / intervalMetrics.length
        : 0;
      
      trends.push({
        timestamp,
        averageDuration: avgDuration,
        queryCount: intervalMetrics.length
      });
    }
    
    return trends;
  }

  // Gerar alertas de performance
  private generatePerformanceAlerts(): Array<{ level: string; message: string; timestamp: number }> {
    const alerts: Array<{ level: string; message: string; timestamp: number }> = [];
    const now = Date.now();
    
    // Alerta de alta taxa de erro
    const recentErrors = this.metrics.filter(m => 
      m.timestamp > now - (10 * 60 * 1000) && m.status === 'error'
    );
    
    if (recentErrors.length > 10) {
      alerts.push({
        level: 'warning',
        message: `Alta taxa de erro detectada: ${recentErrors.length} erros em 10 minutos`,
        timestamp: now
      });
    }
    
    // Alerta de cache hit rate baixo
    const recentQueries = this.metrics.filter(m => 
      m.timestamp > now - (30 * 60 * 1000)
    );
    
    if (recentQueries.length > 0) {
      const cacheHitRate = recentQueries.filter(m => m.cacheHit).length / recentQueries.length;
      if (cacheHitRate < 0.3) {
        alerts.push({
          level: 'info',
          message: `Cache hit rate baixo: ${(cacheHitRate * 100).toFixed(1)}%`,
          timestamp: now
        });
      }
    }
    
    // Alerta de queries muito lentas
    const slowQueries = this.detectSlowQueries();
    if (slowQueries.length > 5) {
      alerts.push({
        level: 'warning',
        message: `${slowQueries.length} queries lentas detectadas`,
        timestamp: now
      });
    }
    
    return alerts;
  }

  // Converter métricas para CSV
  private metricsToCSV(): string {
    const headers = [
      'queryId', 'table', 'queryType', 'duration', 'cacheHit', 
      'cacheStrategy', 'rowsAffected', 'timestamp', 'status', 'error'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const metric of this.metrics) {
      const row = [
        metric.queryId,
        metric.table,
        metric.queryType,
        metric.duration.toString(),
        metric.cacheHit.toString(),
        metric.cacheStrategy,
        (metric.rowsAffected || 0).toString(),
        metric.timestamp.toString(),
        metric.status,
        metric.error || ''
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    }
    
    return csvRows.join('\n');
  }

  // Gerar ID de query
  private generateQueryId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}