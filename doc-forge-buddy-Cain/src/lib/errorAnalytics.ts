/**
 * Sistema de Error Analytics
 * Implementa análise avançada de frequência, impacto do usuário e tendências de resolução
 */

import { getErrorStats, type ErrorStats } from './errorTracking';
import { captureMessage } from './sentry';
import { log } from '@/utils/logger';

// Tipos para analytics
export interface ErrorAnalytics {
  totalErrors: number;
  uniqueErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorRate: number;
  mttr: number; // Mean Time To Resolution (em minutos)
  userImpactScore: number;
  topErrorCategories: Array<{
    category: string;
    count: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    impact: 'high' | 'medium' | 'low';
  }>;
  errorTrends: Array<{
    date: string;
    total: number;
    critical: number;
    resolved: number;
  }>;
  userImpact: Array<{
    userId: string;
    affectedCount: number;
    severity: 'high' | 'medium' | 'low';
    lastError: Date;
  }>;
  resolutionMetrics: {
    averageResolutionTime: number;
    fastestResolution: number;
    slowestResolution: number;
    resolutionRate: number;
  };
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  category?: string;
  metadata?: Record<string, any>;
}

export interface TrendAnalysis {
  period: string;
  startDate: Date;
  endDate: Date;
  totalErrors: number;
  errorChange: number; // percentage
  criticalChange: number;
  resolutionChange: number;
  trend: 'improving' | 'stable' | 'worsening';
  insights: string[];
  recommendations: string[];
}

// Store para analytics
class ErrorAnalyticsStore {
  private analytics: ErrorAnalytics | null = null;
  private timeSeriesData: TimeSeriesPoint[] = [];
  private userImpactData: Map<string, any> = new Map();
  private resolutionTimes: number[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeAnalytics();
  }

  private initializeAnalytics() {
    // Inicializar com dados vazios
    this.analytics = this.generateEmptyAnalytics();
    
    // Carregar dados históricos se existirem
    this.loadHistoricalData();
    
    // Programar atualizações periódicas
    this.scheduleUpdates();
  }

  private generateEmptyAnalytics(): ErrorAnalytics {
    return {
      totalErrors: 0,
      uniqueErrors: 0,
      criticalErrors: 0,
      resolvedErrors: 0,
      errorRate: 0,
      mttr: 0,
      userImpactScore: 0,
      topErrorCategories: [],
      errorTrends: [],
      userImpact: [],
      resolutionMetrics: {
        averageResolutionTime: 0,
        fastestResolution: 0,
        slowestResolution: 0,
        resolutionRate: 0,
      },
    };
  }

  private scheduleUpdates() {
    // Atualizar a cada 5 minutos
    setInterval(() => {
      this.updateAnalytics();
    }, 5 * 60 * 1000);
    
    // Atualização inicial
    setTimeout(() => this.updateAnalytics(), 1000);
  }

  private loadHistoricalData() {
    try {
      const stored = localStorage.getItem('error_analytics_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.timeSeriesData = data.timeSeriesData || [];
        this.userImpactData = new Map(data.userImpactData || []);
        this.resolutionTimes = data.resolutionTimes || [];
      }
    } catch (error) {
      log.warn('Failed to load historical analytics data:', error);
    }
  }

  private saveData() {
    try {
      const data = {
        timeSeriesData: this.timeSeriesData,
        userImpactData: Array.from(this.userImpactData.entries()),
        resolutionTimes: this.resolutionTimes,
        lastUpdate: new Date().toISOString(),
      };
      localStorage.setItem('error_analytics_data', JSON.stringify(data));
    } catch (error) {
      log.warn('Failed to save analytics data:', error);
    }
  }

  // Adicionar ponto de dados à série temporal
  addDataPoint(point: TimeSeriesPoint) {
    this.timeSeriesData.push(point);
    
    // Manter apenas os últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.timeSeriesData = this.timeSeriesData.filter(
      p => p.timestamp > thirtyDaysAgo
    );
    
    this.saveData();
    this.notifyListeners();
  }

  // Atualizar dados de impacto do usuário
  updateUserImpact(userId: string, errorData: {
    affectedCount: number;
    severity: 'high' | 'medium' | 'low';
    timestamp: Date;
  }) {
    const existing = this.userImpactData.get(userId) || {
      userId,
      affectedCount: 0,
      severity: 'low' as const,
      lastError: new Date(),
      totalErrors: 0,
    };

    existing.affectedCount = Math.max(existing.affectedCount, errorData.affectedCount);
    existing.severity = this.getHigherSeverity(existing.severity, errorData.severity);
    existing.lastError = errorData.timestamp;
    existing.totalErrors++;

    this.userImpactData.set(userId, existing);
    this.saveData();
    this.notifyListeners();
  }

  // Adicionar tempo de resolução
  addResolutionTime(minutes: number) {
    this.resolutionTimes.push(minutes);
    
    // Manter apenas os últimos 100 resoluções
    if (this.resolutionTimes.length > 100) {
      this.resolutionTimes.shift();
    }
    
    this.saveData();
    this.notifyListeners();
  }

  // Gerar analytics atual
  private updateAnalytics() {
    const errorStats = getErrorStats();
    const now = new Date();
    
    // Calcular métricas básicas
    const totalErrors = errorStats.reduce((sum, stat) => sum + stat.count, 0);
    const uniqueErrors = errorStats.length;
    const criticalErrors = errorStats.filter(stat => 
      stat.trend === 'increasing' || stat.affectedUsers.size > 10
    ).length;
    const resolvedErrors = errorStats.filter(stat => stat.resolved).length;
    
    // Calcular taxa de erro (erros por hora)
    const errorRate = this.calculateErrorRate(totalErrors);
    
    // Calcular MTTR (Mean Time To Resolution)
    const mttr = this.calculateMTTR();
    
    // Calcular score de impacto do usuário
    const userImpactScore = this.calculateUserImpactScore(errorStats);
    
    // Top categorias de erro
    const topErrorCategories = this.getTopErrorCategories(errorStats);
    
    // Tendências de erro
    const errorTrends = this.calculateErrorTrends();
    
    // Impacto por usuário
    const userImpact = this.getUserImpact();
    
    // Métricas de resolução
    const resolutionMetrics = this.getResolutionMetrics();
    
    this.analytics = {
      totalErrors,
      uniqueErrors,
      criticalErrors,
      resolvedErrors,
      errorRate,
      mttr,
      userImpactScore,
      topErrorCategories,
      errorTrends,
      userImpact,
      resolutionMetrics,
    };
    
    this.notifyListeners();
  }

  private calculateErrorRate(totalErrors: number): number {
    // Calcular taxa baseada no período de 24h
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const errorsInLastDay = this.timeSeriesData
      .filter(point => point.timestamp > oneDayAgo)
      .reduce((sum, point) => sum + point.value, 0);
    
    return errorsInLastDay;
  }

  private calculateMTTR(): number {
    if (this.resolutionTimes.length === 0) return 0;
    
    const average = this.resolutionTimes.reduce((sum, time) => sum + time, 0) / this.resolutionTimes.length;
    return Math.round(average);
  }

  private calculateUserImpactScore(errorStats: ErrorStats[]): number {
    // Score baseado em usuários afetados e severidade
    const totalAffectedUsers = errorStats.reduce((sum, stat) => sum + stat.affectedUsers.size, 0);
    const criticalUsers = errorStats
      .filter(stat => stat.trend === 'increasing')
      .reduce((sum, stat) => sum + stat.affectedUsers.size, 0);
    
    // Score de 0 a 100
    return Math.min(100, Math.round((criticalUsers * 10 + totalAffectedUsers * 2)));
  }

  private getTopErrorCategories(errorStats: ErrorStats[]) {
    const categoryMap = new Map<string, { count: number; trend: any; impact: any }>();
    
    errorStats.forEach(stat => {
      const existing = categoryMap.get(stat.category) || { count: 0, trend: 'stable', impact: 'low' as const };
      existing.count += stat.count;
      existing.trend = stat.trend;
      
      // Determinar impacto baseado em usuários afetados
      if (stat.affectedUsers.size > 20) {
        existing.impact = 'high';
      } else if (stat.affectedUsers.size > 5) {
        existing.impact = 'medium';
      }
      
      categoryMap.set(stat.category, existing);
    });
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        trend: data.trend,
        impact: data.impact,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateErrorTrends() {
    // Agrupar dados por dia
    const dailyData = new Map<string, { total: number; critical: number; resolved: number }>();
    
    this.timeSeriesData.forEach(point => {
      const date = point.timestamp.toISOString().split('T')[0];
      const existing = dailyData.get(date) || { total: 0, critical: 0, resolved: 0 };
      
      existing.total += point.value;
      if (point.metadata?.severity === 'critical') {
        existing.critical += point.value;
      }
      if (point.metadata?.resolved) {
        existing.resolved += point.value;
      }
      
      dailyData.set(date, existing);
    });
    
    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        total: data.total,
        critical: data.critical,
        resolved: data.resolved,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // últimos 7 dias
  }

  private getUserImpact() {
    return Array.from(this.userImpactData.values())
      .sort((a, b) => b.affectedCount - a.affectedCount)
      .slice(0, 20);
  }

  private getResolutionMetrics() {
    if (this.resolutionTimes.length === 0) {
      return {
        averageResolutionTime: 0,
        fastestResolution: 0,
        slowestResolution: 0,
        resolutionRate: 0,
      };
    }
    
    const sorted = [...this.resolutionTimes].sort((a, b) => a - b);
    const totalErrors = getErrorStats().reduce((sum, stat) => sum + stat.count, 0);
    
    return {
      averageResolutionTime: Math.round(sorted.reduce((sum, time) => sum + time, 0) / sorted.length),
      fastestResolution: sorted[0],
      slowestResolution: sorted[sorted.length - 1],
      resolutionRate: totalErrors > 0 ? (this.resolutionTimes.length / totalErrors) * 100 : 0,
    };
  }

  private getHigherSeverity(a: 'high' | 'medium' | 'low', b: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
    const priority = { high: 3, medium: 2, low: 1 };
    return priority[a] >= priority[b] ? a : b;
  }

  // Análise de tendências
  generateTrendAnalysis(period: '1d' | '7d' | '30d'): TrendAnalysis {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }
    
    // Dados do período atual
    const currentData = this.timeSeriesData.filter(p => p.timestamp >= startDate);
    const currentTotal = currentData.reduce((sum, p) => sum + p.value, 0);
    
    // Dados do período anterior para comparação
    const previousStartDate = new Date(startDate);
    previousStartDate.setTime(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousData = this.timeSeriesData.filter(p => 
      p.timestamp >= previousStartDate && p.timestamp < startDate
    );
    const previousTotal = previousData.reduce((sum, p) => sum + p.value, 0);
    
    // Calcular mudanças percentuais
    const errorChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    
    // Determinar tendência geral
    let trend: 'improving' | 'stable' | 'worsening';
    if (errorChange < -10) {
      trend = 'improving';
    } else if (errorChange > 10) {
      trend = 'worsening';
    } else {
      trend = 'stable';
    }
    
    // Gerar insights e recomendações
    const insights = this.generateInsights(currentData, trend, errorChange);
    const recommendations = this.generateRecommendations(insights, trend);
    
    return {
      period,
      startDate,
      endDate: now,
      totalErrors: currentTotal,
      errorChange: Math.round(errorChange * 100) / 100,
      criticalChange: this.calculateCriticalChange(currentData, previousData),
      resolutionChange: this.calculateResolutionChange(currentData, previousData),
      trend,
      insights,
      recommendations,
    };
  }

  private generateInsights(data: TimeSeriesPoint[], trend: string, change: number): string[] {
    const insights: string[] = [];
    
    if (trend === 'worsening') {
      insights.push(`Aumento de ${change.toFixed(1)}% nos erros comparado ao período anterior`);
      
      const criticalCount = data.filter(p => p.metadata?.severity === 'critical').length;
      if (criticalCount > 5) {
        insights.push(`Alto número de erros críticos (${criticalCount}) detectado`);
      }
    } else if (trend === 'improving') {
      insights.push(`Redução de ${Math.abs(change).toFixed(1)}% nos erros`);
    }
    
    // Análise por categoria
    const categoryCounts = new Map<string, number>();
    data.forEach(p => {
      if (p.category) {
        categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + p.value);
      }
    });
    
    const topCategory = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      insights.push(`Categoria mais afetada: ${topCategory[0]} (${topCategory[1]} erros)`);
    }
    
    return insights;
  }

  private generateRecommendations(insights: string[], trend: string): string[] {
    const recommendations: string[] = [];
    
    if (trend === 'worsening') {
      recommendations.push('Investigar imediatamente as causas do aumento de erros');
      recommendations.push('Implementar monitoring mais detalhado para identificar padrões');
    }
    
    if (insights.some(i => i.includes('críticos'))) {
      recommendations.push('Priorizar resolução de erros críticos');
      recommendations.push('Considerar implementar circuit breakers');
    }
    
    recommendations.push('Revisar logs de erros regularmente');
    recommendations.push('Implementar testes de regressão para prevenir novos erros');
    
    return recommendations;
  }

  private calculateCriticalChange(current: TimeSeriesPoint[], previous: TimeSeriesPoint[]): number {
    const currentCritical = current.filter(p => p.metadata?.severity === 'critical').length;
    const previousCritical = previous.filter(p => p.metadata?.severity === 'critical').length;
    
    if (previousCritical === 0) return currentCritical > 0 ? 100 : 0;
    
    return Math.round(((currentCritical - previousCritical) / previousCritical) * 100);
  }

  private calculateResolutionChange(current: TimeSeriesPoint[], previous: TimeSeriesPoint[]): number {
    const currentResolved = current.filter(p => p.metadata?.resolved).length;
    const previousResolved = previous.filter(p => p.metadata?.resolved).length;
    
    if (previousResolved === 0) return currentResolved > 0 ? 100 : 0;
    
    return Math.round(((currentResolved - previousResolved) / previousResolved) * 100);
  }

  // Métodos públicos
  getAnalytics(): ErrorAnalytics {
    return this.analytics || this.generateEmptyAnalytics();
  }

  getTimeSeriesData(period: '1h' | '6h' | '24h' | '7d' = '24h'): TimeSeriesPoint[] {
    const now = new Date();
    const cutoff = new Date();
    
    switch (period) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoff.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoff.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
    }
    
    return this.timeSeriesData.filter(p => p.timestamp > cutoff);
  }

  generateReport(): string {
    const analytics = this.getAnalytics();
    const analysis7d = this.generateTrendAnalysis('7d');
    
    return `
# Error Analytics Report
Generated: ${new Date().toLocaleString()}

## Summary
- Total Errors: ${analytics.totalErrors}
- Unique Error Types: ${analytics.uniqueErrors}
- Critical Errors: ${analytics.criticalErrors}
- Error Rate: ${analytics.errorRate} errors/hour
- Mean Time to Resolution: ${analytics.mttr} minutes
- User Impact Score: ${analytics.userImpactScore}/100

## Top Error Categories
${analytics.topErrorCategories.map(cat => 
  `- ${cat.category}: ${cat.count} errors (${cat.trend}, ${cat.impact} impact)`
).join('\n')}

## 7-Day Trend Analysis
- Total Errors: ${analysis7d.totalErrors}
- Change: ${analysis7d.errorChange}%
- Trend: ${analysis7d.trend}
- Critical Change: ${analysis7d.criticalChange}%

## Key Insights
${analysis7d.insights.map(insight => `- ${insight}`).join('\n')}

## Recommendations
${analysis7d.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
  }

  // Subscription pattern
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Instância global do store
export const errorAnalytics = new ErrorAnalyticsStore();

// Funções de conveniência
export function getCurrentAnalytics(): ErrorAnalytics {
  return errorAnalytics.getAnalytics();
}

export function getTrendAnalysis(period: '1d' | '7d' | '30d'): TrendAnalysis {
  return errorAnalytics.generateTrendAnalysis(period);
}

export function exportAnalyticsReport(): string {
  return errorAnalytics.generateReport();
}

// Inicializar sistema de analytics
export function initErrorAnalytics() {
  if (import.meta.env.DEV) {
    log.info('Error analytics initialized');
  }
  
  // Registrar ponto inicial
  errorAnalytics.addDataPoint({
    timestamp: new Date(),
    value: 0,
    category: 'initialization',
    metadata: { type: 'system_start' },
  });
}