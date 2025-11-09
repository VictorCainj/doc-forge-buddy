// Analytics e monitoramento de cache
export interface CacheMetrics {
  key: string;
  strategy: 'memory' | 'redis' | 'localStorage' | 'hybrid';
  source: 'memory' | 'redis' | 'localStorage' | 'miss';
  hit: boolean;
  duration: number;
  timestamp: number;
  size: number;
  ttl: number;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  totalRequests: number;
  hits: number;
  misses: number;
  hitRate: number;
  averageResponseTime: number;
  totalSize: number;
  entryCount: number;
  strategyBreakdown: Record<string, {
    requests: number;
    hits: number;
    hitRate: number;
  }>;
  topKeys: Array<{ key: string; hits: number; lastAccessed: number }>;
  invalidationEvents: number;
  cleanupEvents: number;
}

export interface CacheAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  strategy: string;
}

export interface CacheOptimization {
  type: 'ttl_adjustment' | 'memory_optimization' | 'eviction_strategy' | 'prefetch';
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimatedImprovement: number;
  implementation: string;
  priority: 'low' | 'medium' | 'high';
}

export class CacheAnalytics {
  private metrics: CacheMetrics[] = [];
  private keyAccessHistory = new Map<string, { hits: number; lastAccessed: number; totalDuration: number }>();
  private maxMetricsHistory = 5000;
  private alerts: CacheAlert[] = [];
  private analyticsBuffer: CacheMetrics[] = [];

  // Log de acesso ao cache
  logCacheAccess(metrics: Omit<CacheMetrics, 'timestamp'>): void {
    const fullMetrics: CacheMetrics = {
      ...metrics,
      timestamp: Date.now()
    };

    // Adicionar ao buffer
    this.analyticsBuffer.push(fullMetrics);

    // Processar em batch se buffer está cheio
    if (this.analyticsBuffer.length >= 50) {
      this.flushMetrics();
    }

    // Atualizar histórico de chaves
    this.updateKeyHistory(fullMetrics);
  }

  // Log de evento de invalidação
  logInvalidation(event: {
    pattern: string;
    strategy: string;
    count: number;
    timestamp: number;
  }): void {
    this.analyticsBuffer.push({
      key: `invalidation:${event.pattern}`,
      strategy: event.strategy as any,
      source: 'memory',
      hit: true,
      duration: 0,
      timestamp: event.timestamp,
      size: 0,
      ttl: 0,
      metadata: {
        type: 'invalidation',
        pattern: event.pattern,
        count: event.count
      }
    });
  }

  // Log de evento de cleanup
  logCleanup(event: {
    strategy: string;
    entriesRemoved: number;
    spaceFreed: number;
    timestamp: number;
  }): void {
    this.analyticsBuffer.push({
      key: `cleanup:${event.strategy}`,
      strategy: event.strategy as any,
      source: 'memory',
      hit: true,
      duration: 0,
      timestamp: event.timestamp,
      size: 0,
      ttl: 0,
      metadata: {
        type: 'cleanup',
        entriesRemoved: event.entriesRemoved,
        spaceFreed: event.spaceFreed
      }
    });
  }

  // Obter estatísticas do cache
  getStats(strategy?: string, timeRange?: { start: number; end: number }): CacheStats {
    let filteredMetrics = this.metrics;

    // Filtrar por estratégia
    if (strategy) {
      filteredMetrics = filteredMetrics.filter(m => m.strategy === strategy);
    }

    // Filtrar por período
    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    const totalRequests = filteredMetrics.length;
    const hits = filteredMetrics.filter(m => m.hit).length;
    const misses = totalRequests - hits;
    const hitRate = totalRequests > 0 ? hits / totalRequests : 0;

    const averageResponseTime = totalRequests > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
      : 0;

    // Breakdown por estratégia
    const strategyBreakdown: Record<string, { requests: number; hits: number; hitRate: number }> = {};
    filteredMetrics.forEach(m => {
      if (!strategyBreakdown[m.strategy]) {
        strategyBreakdown[m.strategy] = { requests: 0, hits: 0, hitRate: 0 };
      }
      strategyBreakdown[m.strategy].requests++;
      if (m.hit) {
        strategyBreakdown[m.strategy].hits++;
      }
    });

    // Calcular hit rates por estratégia
    Object.keys(strategyBreakdown).forEach(strategy => {
      const data = strategyBreakdown[strategy];
      data.hitRate = data.requests > 0 ? data.hits / data.requests : 0;
    });

    // Top chaves mais acessadas
    const topKeys = Array.from(this.keyAccessHistory.entries())
      .map(([key, data]) => ({
        key,
        hits: data.hits,
        lastAccessed: data.lastAccessed
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 20);

    // Contar eventos de invalidação e cleanup
    const invalidationEvents = filteredMetrics.filter(m => 
      m.metadata?.type === 'invalidation'
    ).length;

    const cleanupEvents = filteredMetrics.filter(m => 
      m.metadata?.type === 'cleanup'
    ).length;

    // Calcular tamanho total e número de entries (aproximado)
    const totalSize = filteredMetrics
      .filter(m => m.hit)
      .reduce((sum, m) => sum + m.size, 0);

    const entryCount = new Set(filteredMetrics.map(m => m.key)).size;

    return {
      totalRequests,
      hits,
      misses,
      hitRate,
      averageResponseTime,
      totalSize,
      entryCount,
      strategyBreakdown,
      topKeys,
      invalidationEvents,
      cleanupEvents
    };
  }

  // Detectar problemas de performance
  detectPerformanceIssues(): CacheAlert[] {
    const alerts: CacheAlert[] = [];
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);

    if (recentMetrics.length === 0) return alerts;

    // 1. Taxa de hit rate baixa
    const hitRate = recentMetrics.filter(m => m.hit).length / recentMetrics.length;
    if (hitRate < 0.5) {
      alerts.push({
        level: hitRate < 0.3 ? 'critical' : 'warning',
        message: `Cache hit rate muito baixo: ${(hitRate * 100).toFixed(1)}%`,
        metric: 'hitRate',
        value: hitRate,
        threshold: 0.5,
        timestamp: now,
        strategy: 'all'
      });
    }

    // 2. Tempo de resposta alto
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    if (avgResponseTime > 100) {
      alerts.push({
        level: avgResponseTime > 500 ? 'error' : 'warning',
        message: `Tempo de resposta do cache alto: ${avgResponseTime.toFixed(1)}ms`,
        metric: 'responseTime',
        value: avgResponseTime,
        threshold: 100,
        timestamp: now,
        strategy: 'all'
      });
    }

    // 3. Many cache misses por estratégia
    const strategyMisses = new Map<string, number>();
    recentMetrics.forEach(m => {
      if (!m.hit) {
        strategyMisses.set(m.strategy, (strategyMisses.get(m.strategy) || 0) + 1);
      }
    });

    for (const [strategy, misses] of strategyMisses.entries()) {
      if (misses > 100) {
        alerts.push({
          level: 'warning',
          message: `Muitas misses no cache ${strategy}: ${misses} misses em 1h`,
          metric: 'misses',
          value: misses,
          threshold: 100,
          timestamp: now,
          strategy
        });
      }
    }

    // 4. Chaves muito acessadas (possível hotspot)
    const keyAccess = new Map<string, number>();
    recentMetrics.forEach(m => {
      if (m.hit) {
        keyAccess.set(m.key, (keyAccess.get(m.key) || 0) + 1);
      }
    });

    for (const [key, accesses] of keyAccess.entries()) {
      if (accesses > 1000) {
        alerts.push({
          level: 'info',
          message: `Chave muito acessada: ${key} (${accesses} vezes em 1h)`,
          metric: 'keyAccess',
          value: accesses,
          threshold: 1000,
          timestamp: now,
          strategy: 'all'
        });
      }
    }

    this.alerts = [...this.alerts, ...alerts];
    return alerts;
  }

  // Gerar otimizações sugeridas
  generateOptimizations(): CacheOptimization[] {
    const optimizations: CacheOptimization[] = [];
    const stats = this.getStats();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const dailyMetrics = this.metrics.filter(m => m.timestamp > oneDayAgo);

    // 1. Ajustar TTL baseado em padrões de acesso
    if (stats.hitRate < 0.7) {
      optimizations.push({
        type: 'ttl_adjustment',
        description: 'Aumentar TTL para melhorar cache hit rate',
        impact: 'high',
        estimatedImprovement: 0.2,
        implementation: 'Increase TTL by 50% for frequently accessed keys',
        priority: 'high'
      });
    }

    // 2. Otimizar estratégia de memória
    if (stats.totalRequests > 1000 && stats.hitRate < 0.6) {
      optimizations.push({
        type: 'memory_optimization',
        description: 'Aumentar tamanho do memory cache',
        impact: 'medium',
        estimatedImprovement: 0.15,
        implementation: 'Double memory cache size and implement LRU eviction',
        priority: 'medium'
      });
    }

    // 3. Estratégia de prefetch
    const topKeys = stats.topKeys.slice(0, 5);
    if (topKeys.length > 0) {
      optimizations.push({
        type: 'prefetch',
        description: 'Implementar prefetch para chaves mais acessadas',
        impact: 'medium',
        estimatedImprovement: 0.1,
        implementation: `Implement prefetch for: ${topKeys.map(k => k.key).join(', ')}`,
        priority: 'medium'
      });
    }

    // 4. Evitar frequente invalidação
    if (stats.invalidationEvents > 50) {
      optimizations.push({
        type: 'eviction_strategy',
        description: 'Implementar estratégia de invalidação mais eficiente',
        impact: 'high',
        estimatedImprovement: 0.25,
        implementation: 'Use selective invalidation instead of clear()',
        priority: 'high'
      });
    }

    // 5. Otimizar híbrido cache
    if (stats.strategyBreakdown.hybrid) {
      const hybridStats = stats.strategyBreakdown.hybrid;
      if (hybridStats.hitRate < 0.8) {
        optimizations.push({
          type: 'memory_optimization',
          description: 'Otimizar sincronização entre caches L1 e L2',
          impact: 'medium',
          estimatedImprovement: 0.12,
          implementation: 'Adjust sync interval and improve L1 cache size',
          priority: 'medium'
        });
      }
    }

    return optimizations.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);
  }

  // Análise de padrões de acesso
  analyzeAccessPatterns(): {
    peakHours: Array<{ hour: number; requestCount: number; hitRate: number }>;
    popularKeys: Array<{ key: string; pattern: string; frequency: number }>;
    cacheEfficiency: {
      overall: number;
      byStrategy: Record<string, number>;
      byKey: Record<string, number>;
    };
  } {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const dailyMetrics = this.metrics.filter(m => m.timestamp > oneDayAgo);

    // Análise de horários de pico
    const hourlyStats = new Map<number, { requests: number; hits: number }>();
    dailyMetrics.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      const current = hourlyStats.get(hour) || { requests: 0, hits: 0 };
      current.requests++;
      if (m.hit) current.hits++;
      hourlyStats.set(hour, current);
    });

    const peakHours = Array.from(hourlyStats.entries()).map(([hour, stats]) => ({
      hour,
      requestCount: stats.requests,
      hitRate: stats.requests > 0 ? stats.hits / stats.requests : 0
    })).sort((a, b) => b.requestCount - a.requestCount);

    // Chaves populares
    const keyPatterns = new Map<string, { count: number; keys: Set<string> }>();
    dailyMetrics.forEach(m => {
      if (m.hit) {
        const pattern = this.extractKeyPattern(m.key);
        const current = keyPatterns.get(pattern) || { count: 0, keys: new Set() };
        current.count++;
        current.keys.add(m.key);
        keyPatterns.set(pattern, current);
      }
    });

    const popularKeys = Array.from(keyPatterns.entries())
      .map(([pattern, data]) => ({
        key: Array.from(data.keys)[0], // Example key
        pattern,
        frequency: data.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Eficiência do cache
    const overallEfficiency = dailyMetrics.length > 0
      ? dailyMetrics.filter(m => m.hit).length / dailyMetrics.length
      : 0;

    const byStrategy: Record<string, number> = {};
    dailyMetrics.forEach(m => {
      if (!byStrategy[m.strategy]) {
        byStrategy[m.strategy] = { requests: 0, hits: 0 };
      }
      byStrategy[m.strategy].requests++;
      if (m.hit) byStrategy[m.strategy].hits++;
    });

    Object.keys(byStrategy).forEach(strategy => {
      const data = byStrategy[strategy];
      byStrategy[strategy] = data.requests > 0 ? data.hits / data.requests : 0;
    });

    const byKey: Record<string, number> = {};
    dailyMetrics.forEach(m => {
      if (!byKey[m.key]) {
        byKey[m.key] = { requests: 0, hits: 0 };
      }
      byKey[m.key].requests++;
      if (m.hit) byKey[m.key].hits++;
    });

    Object.keys(byKey).forEach(key => {
      const data = byKey[key];
      byKey[key] = data.requests > 0 ? data.hits / data.requests : 0;
    });

    return {
      peakHours,
      popularKeys,
      cacheEfficiency: {
        overall: overallEfficiency,
        byStrategy,
        byKey
      }
    };
  }

  // Dashboard de métricas
  getCacheDashboard(): {
    overview: {
      totalRequests: number;
      hitRate: number;
      avgResponseTime: number;
      activeStrategies: number;
      cacheEfficiency: string;
    };
    topPerformers: Array<{ strategy: string; hitRate: number; requests: number }>;
    recentAlerts: CacheAlert[];
    recommendations: CacheOptimization[];
    trends: Array<{
      timestamp: number;
      hitRate: number;
      responseTime: number;
      requestCount: number;
    }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    const dailyMetrics = this.metrics.filter(m => m.timestamp > oneDayAgo);

    // Overview
    const totalRequests = recentMetrics.length;
    const hits = recentMetrics.filter(m => m.hit).length;
    const hitRate = totalRequests > 0 ? hits / totalRequests : 0;
    const avgResponseTime = totalRequests > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
      : 0;

    const activeStrategies = new Set(recentMetrics.map(m => m.strategy)).size;
    const cacheEfficiency = hitRate > 0.8 ? 'Excelente' : 
                           hitRate > 0.6 ? 'Boa' : 
                           hitRate > 0.4 ? 'Regular' : 'Ruim';

    // Top performers
    const strategyStats = new Map<string, { requests: number; hits: number }>();
    recentMetrics.forEach(m => {
      const current = strategyStats.get(m.strategy) || { requests: 0, hits: 0 };
      current.requests++;
      if (m.hit) current.hits++;
      strategyStats.set(m.strategy, current);
    });

    const topPerformers = Array.from(strategyStats.entries())
      .map(([strategy, stats]) => ({
        strategy,
        hitRate: stats.requests > 0 ? stats.hits / stats.requests : 0,
        requests: stats.requests
      }))
      .sort((a, b) => b.hitRate - a.hitRate);

    // Alertas recentes
    const recentAlerts = this.alerts
      .filter(alert => alert.timestamp > oneHourAgo)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    // Recomendações
    const recommendations = this.generateOptimizations().slice(0, 3);

    // Tendências (últimas 2 horas)
    const trends = [];
    const interval = 15 * 60 * 1000; // 15 minutos
    for (let timestamp = now - (2 * 60 * 60 * 1000); timestamp <= now; timestamp += interval) {
      const nextTimestamp = timestamp + interval;
      const intervalMetrics = recentMetrics.filter(
        m => m.timestamp >= timestamp && m.timestamp < nextTimestamp
      );

      const intervalHitRate = intervalMetrics.length > 0
        ? intervalMetrics.filter(m => m.hit).length / intervalMetrics.length
        : 0;

      const intervalAvgTime = intervalMetrics.length > 0
        ? intervalMetrics.reduce((sum, m) => sum + m.duration, 0) / intervalMetrics.length
        : 0;

      trends.push({
        timestamp,
        hitRate: intervalHitRate,
        responseTime: intervalAvgTime,
        requestCount: intervalMetrics.length
      });
    }

    return {
      overview: {
        totalRequests,
        hitRate,
        avgResponseTime,
        activeStrategies,
        cacheEfficiency
      },
      topPerformers,
      recentAlerts,
      recommendations,
      trends
    };
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

  // Atualizar histórico de chaves
  private updateKeyHistory(metrics: CacheMetrics): void {
    const existing = this.keyAccessHistory.get(metrics.key);
    
    if (existing) {
      if (metrics.hit) {
        existing.hits++;
      }
      existing.lastAccessed = metrics.timestamp;
      existing.totalDuration += metrics.duration;
    } else {
      this.keyAccessHistory.set(metrics.key, {
        hits: metrics.hit ? 1 : 0,
        lastAccessed: metrics.timestamp,
        totalDuration: metrics.duration
      });
    }
  }

  // Extrair padrão de chave
  private extractKeyPattern(key: string): string {
    // Simplificado - em produção seria mais sofisticado
    const parts = key.split(':');
    if (parts.length > 1) {
      return parts.slice(0, -1).join(':'); // Remove o ID único
    }
    return key;
  }

  // Exportar dados
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: this.metrics,
      alerts: this.alerts,
      keyHistory: Object.fromEntries(this.keyAccessHistory),
      exportTimestamp: Date.now(),
      version: '1.0.0'
    };

    if (format === 'csv') {
      return this.metricsToCSV();
    }

    return JSON.stringify(data, null, 2);
  }

  // Converter métricas para CSV
  private metricsToCSV(): string {
    const headers = [
      'key', 'strategy', 'source', 'hit', 'duration', 'timestamp', 'size', 'ttl'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const metric of this.metrics) {
      const row = [
        metric.key,
        metric.strategy,
        metric.source,
        metric.hit.toString(),
        metric.duration.toString(),
        metric.timestamp.toString(),
        metric.size.toString(),
        metric.ttl.toString()
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    }
    
    return csvRows.join('\n');
  }
}