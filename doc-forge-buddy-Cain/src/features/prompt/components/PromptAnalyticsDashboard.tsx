/**
 * Dashboard de Analytics para Sistema de Aprendizado de Prompts
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Clock, 
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Zap } from '@/lib/icons';
import { usePromptAnalytics } from '../hooks/usePromptLearning';
import type { AnalyticsDashboard, EffectivenessHeatmap } from '../types/prompt';

// Componente de heatmap de eficácia
const EffectivenessHeatmapComponent = ({ heatmap }: { heatmap: EffectivenessHeatmap }) => {
  if (!heatmap) return null;

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getIntensity = (value: number) => {
    if (typeof value === 'number') {
      return Math.max(0.1, value);
    }
    return 0.1;
  };

  const getColor = (value: number) => {
    if (value >= 0.8) return 'bg-green-500';
    if (value >= 0.6) return 'bg-yellow-500';
    if (value >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-25 gap-1 text-xs">
        {/* Header com horas */}
        <div></div>
        {hours.map(hour => (
          <div key={hour} className="text-center text-muted-foreground">
            {hour}h
          </div>
        ))}
        
        {/* Grid do heatmap */}
        {days.map((day, dayIndex) => (
          <>
            <div key={`${day}-label`} className="text-right pr-2 text-muted-foreground font-medium">
              {day}
            </div>
            {hours.map(hour => {
              const value = heatmap.data[day]?.[hour.toString()] || 0;
              return (
                <div
                  key={`${dayIndex}-${hour}`}
                  className={`w-3 h-3 rounded-sm ${getColor(value)} opacity-75 hover:opacity-100 transition-opacity cursor-pointer`}
                  title={`${day} ${hour}:00 - Eficácia: ${(value * 100).toFixed(1)}%`}
                />
              );
            })}
          </>
        ))}
      </div>
      
      {/* Legenda */}
      <div className="flex items-center justify-center space-x-4 text-xs">
        <span className="text-muted-foreground">Baixa</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
          <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
        </div>
        <span className="text-muted-foreground">Alta</span>
      </div>
    </div>
  );
};

// Componente de métricas resumidas
const SummaryMetrics = ({ dashboard }: { dashboard: AnalyticsDashboard }) => {
  const { summaryMetrics } = dashboard;
  
  const metrics = [
    {
      title: 'Total de Prompts',
      value: summaryMetrics.totalPrompts,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Eficácia Média',
      value: `${(summaryMetrics.averageEffectiveness * 100).toFixed(1)}%`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      progress: summaryMetrics.averageEffectiveness * 100
    },
    {
      title: 'Taxa de Completude',
      value: `${(summaryMetrics.averageCompletionRate * 100).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      progress: summaryMetrics.averageCompletionRate * 100
    },
    {
      title: 'Satisfação do Usuário',
      value: summaryMetrics.averageSatisfaction.toFixed(1),
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      max: 5
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    {metric.max && (
                      <span className="text-sm text-muted-foreground">/{metric.max}</span>
                    )}
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
              {metric.progress !== undefined && (
                <div className="mt-4">
                  <Progress value={metric.progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Componente de tendência
const TrendIndicator = ({ trend, value }: { trend: 'improving' | 'stable' | 'declining'; value: number }) => {
  const getTrendInfo = () => {
    switch (trend) {
      case 'improving':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          text: `+${value.toFixed(1)}%`,
          description: 'Melhorando'
        };
      case 'declining':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          text: `${value.toFixed(1)}%`,
          description: 'Declinando'
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          text: 'Estável',
          description: 'Estável'
        };
    }
  };

  const trendInfo = getTrendInfo();
  const Icon = trendInfo.icon;

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${trendInfo.bgColor}`}>
      <Icon className={`h-4 w-4 ${trendInfo.color}`} />
      <span className={`text-sm font-medium ${trendInfo.color}`}>
        {trendInfo.text}
      </span>
    </div>
  );
};

// Componente de insights
const KeyInsights = ({ insights }: { insights: string[] }) => {
  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Insights Principais</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum insight disponível no momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>Insights Principais</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
            <Zap className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{insight}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Componente de recomendações
const RecommendationsPanel = ({ recommendations }: { recommendations: any[] }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-500" />
            <span>Recomendações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma recomendação disponível.</p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-green-500" />
          <span>Recomendações</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium">{rec.title}</h4>
              <Badge variant="secondary" className="ml-2">
                {rec.priority}
              </Badge>
            </div>
            <p className="text-sm opacity-80">{rec.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Componente principal do Dashboard
export const PromptAnalyticsDashboard = () => {
  const {
    dateRange,
    dashboard,
    heatmap,
    trendAnalysis,
    generateReport,
    updateDateRange,
    isDashboardLoading,
    isHeatmapLoading,
    isTrendLoading,
    isGeneratingReport
  } = usePromptAnalytics();

  // Gerar date range rápido
  const quickRanges = [
    {
      label: '7 dias',
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    {
      label: '30 dias',
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    {
      label: '90 dias',
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  ];

  const handleQuickRange = (range: any) => {
    updateDateRange({ start: range.start, end: range.end });
  };

  if (isDashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground mb-4">
              Não foram encontrados dados de analytics no período selecionado.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Analytics</h2>
          <p className="text-muted-foreground">
            Análise completa do desempenho dos seus prompts
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {quickRanges.map((range, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickRange(range)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateReport('comprehensive')}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Métricas resumidas */}
      <SummaryMetrics dashboard={dashboard} />

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KeyInsights insights={dashboard.keyInsights} />
            <RecommendationsPanel recommendations={dashboard.recommendations} />
          </div>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Heatmap de Eficácia por Horário</CardTitle>
              <CardDescription>
                Visualize quando você é mais eficaz na criação de prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isHeatmapLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : heatmap ? (
                <div className="space-y-4">
                  <EffectivenessHeatmapComponent heatmap={heatmap} />
                  
                  {/* Insights do heatmap */}
                  {heatmap.insights && heatmap.insights.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Insights do Horário</h4>
                      <ul className="space-y-1 text-sm">
                        {heatmap.insights.map((insight, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recomendações do heatmap */}
                  {heatmap.recommendations && heatmap.recommendations.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium mb-2 text-green-800">Recomendações de Horário</h4>
                      <ul className="space-y-1 text-sm text-green-700">
                        {heatmap.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-500">✓</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum dado de heatmap disponível.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {isTrendLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando análise de tendências...</p>
              </CardContent>
            </Card>
          ) : trendAnalysis ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Previsões de Tendências</CardTitle>
                  <CardDescription>
                    Projeções baseadas no seu histórico de uso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trendAnalysis.predictions && trendAnalysis.predictions.length > 0 ? (
                    <div className="space-y-3">
                      {trendAnalysis.predictions.map((prediction, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <span className="font-medium capitalize">{prediction.metric}</span>
                            <p className="text-sm text-muted-foreground">
                              Confiança: {prediction.confidence}
                            </p>
                          </div>
                          <TrendIndicator 
                            trend={prediction.prediction} 
                            value={0} 
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma previsão disponível.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Insights das tendências */}
              {trendAnalysis.insights && trendAnalysis.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Insights de Tendências</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {trendAnalysis.insights.map((insight, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma análise de tendências disponível.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KeyInsights insights={dashboard.keyInsights} />
            <RecommendationsPanel recommendations={dashboard.recommendations} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromptAnalyticsDashboard;