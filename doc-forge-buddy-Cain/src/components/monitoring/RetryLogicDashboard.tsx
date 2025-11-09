/**
 * Dashboard de Monitoramento do Retry Logic e Error Handling
 * 
 * Componente React para visualizar métricas, circuit breaker status,
 * alertas e health check do sistema de retry
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useRetryMonitoring, 
  useCircuitBreaker, 
  usePredefinedStrategies 
} from '@/hooks/useRetryLogic';
import { ErrorType } from '@/lib/retry-system';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  Clock,
  Shield,
  BarChart3,
  AlertCircle
} from 'lucide-react';

// ===========================================
// 1. COMPONENTE PRINCIPAL
// ===========================================

export function RetryLogicDashboard() {
  const {
    metrics,
    alerts,
    isMonitoring,
    refreshMetrics,
    getHealthReport,
    resetMonitoring,
    startMonitoring,
    stopMonitoring
  } = useRetryMonitoring();

  const [healthReport, setHealthReport] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (healthReport) return;
    setHealthReport(getHealthReport());
  }, [getHealthReport, healthReport]);

  const handleRefresh = () => {
    refreshMetrics();
    setHealthReport(getHealthReport());
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  // Auto-refresh a cada 30 segundos se monitoramento ativo
  useEffect(() => {
    if (isMonitoring && !refreshInterval) {
      const interval = setInterval(() => {
        handleRefresh();
      }, 30000);
      setRefreshInterval(interval);
    } else if (!isMonitoring && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isMonitoring, refreshInterval]);

  if (!metrics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Iniciando monitoramento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Retry Logic Monitor</h1>
          <p className="text-muted-foreground">
            Sistema de monitoramento e health check
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Monitorando" : "Pausado"}
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={toggleMonitoring} 
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
          >
            {isMonitoring ? "Pausar" : "Iniciar"}
          </Button>
        </div>
      </div>

      {/* Health Score */}
      {healthReport && (
        <HealthScoreCard health={healthReport} />
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Taxa de Sucesso"
          value={`${((metrics.successfulRetries / Math.max(metrics.totalAttempts, 1)) * 100).toFixed(1)}%`}
          icon={CheckCircle}
          trend={metrics.successfulRetries}
          color="green"
        />
        
        <MetricsCard
          title="Total de Tentativas"
          value={metrics.totalAttempts.toString()}
          icon={BarChart3}
          trend={metrics.totalAttempts}
          color="blue"
        />
        
        <MetricsCard
          title="Delay Médio"
          value={`${metrics.avgRetryDelay.toFixed(0)}ms`}
          icon={Clock}
          trend={metrics.avgRetryDelay}
          color="orange"
        />
        
        <MetricsCard
          title="Circuit Breakers"
          value={Object.keys(metrics.circuitBreakerState).length.toString()}
          icon={Shield}
          trend={Object.keys(metrics.circuitBreakerState).length}
          color="purple"
        />
      </div>

      {/* Alertas Recentes */}
      {alerts.length > 0 && (
        <AlertsSection alerts={alerts} />
      )}

      {/* Circuit Breaker Status */}
      <CircuitBreakerStatusSection circuitBreakers={metrics.circuitBreakerState} />

      {/* Distribuição de Erros */}
      <ErrorDistributionSection errorDistribution={metrics.errorTypeDistribution} />

      {/* Performance Metrics */}
      <PerformanceSection />

      {/* Estratégias de Retry */}
      <StrategiesSection />
    </div>
  );
}

// ===========================================
// 2. COMPONENTES AUXILIARES
// ===========================================

function HealthScoreCard({ health }: { health: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return AlertCircle;
    }
  };

  const StatusIcon = getStatusIcon(health.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <StatusIcon className={`h-5 w-5 mr-2 ${getStatusColor(health.status)}`} />
          Health Score
        </CardTitle>
        <CardDescription>Status geral do sistema de retry</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{health.healthScore.toFixed(0)}/100</span>
            <Badge className={getStatusColor(health.status)}>
              {health.status.toUpperCase()}
            </Badge>
          </div>
          <Progress value={health.healthScore} className="h-2" />
          {health.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Recomendações:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {health.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color 
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: number;
  color: string;
}) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsSection({ alerts }: { alerts: any[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Alertas Recentes
        </CardTitle>
        <CardDescription>Últimos alertas do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert, idx) => (
            <Alert key={idx} className={getSeverityColor(alert.severity)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{alert.message}</span>
                  <Badge variant="outline" className="ml-2">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CircuitBreakerStatusSection({ circuitBreakers }: { circuitBreakers: any }) {
  const circuitBreakerNames = Object.keys(circuitBreakers);
  
  if (circuitBreakerNames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Circuit Breakers
          </CardTitle>
          <CardDescription>Status dos circuit breakers ativos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum circuit breaker ativo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Circuit Breakers
        </CardTitle>
        <CardDescription>Status dos circuit breakers ativos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circuitBreakerNames.map((name) => {
            const cb = circuitBreakers[name];
            const getStatusColor = (state: string) => {
              switch (state) {
                case 'CLOSED': return 'bg-green-100 text-green-800';
                case 'OPEN': return 'bg-red-100 text-red-800';
                case 'HALF_OPEN': return 'bg-yellow-100 text-yellow-800';
                default: return 'bg-gray-100 text-gray-800';
              }
            };

            return (
              <div key={name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{name}</h4>
                  <Badge className={getStatusColor(cb.state)}>
                    {cb.state}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Falhas: {cb.failures}</p>
                  {cb.lastFailureTime && (
                    <p>Última falha: {new Date(cb.lastFailureTime).toLocaleString()}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorDistributionSection({ errorDistribution }: { errorDistribution: Record<ErrorType, number> }) {
  const entries = Object.entries(errorDistribution)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Distribuição de Erros
          </CardTitle>
          <CardDescription>Tipos de erro mais frequentes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum erro registrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Distribuição de Erros
        </CardTitle>
        <CardDescription>Tipos de erro mais frequentes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map(([errorType, count]) => {
            const percentage = (count / total) * 100;
            
            return (
              <div key={errorType} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {errorType.replace(/_/g, ' ')}
                  </span>
                  <div className="text-sm text-muted-foreground">
                    {count} ({percentage.toFixed(1)}%)
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceSection() {
  const strategies = usePredefinedStrategies();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Performance & Estratégias
        </CardTitle>
        <CardDescription>Métricas de performance e estratégias configuradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Estratégias Pré-configuradas</h4>
            <div className="space-y-2">
              {Object.entries(strategies).map(([name, config]) => (
                <div key={name} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{name}</span>
                    <Badge variant="outline">
                      {config.maxAttempts || 1} tentativas
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Timeout: {config.timeout || 0}ms | 
                    Circuit Breaker: {config.circuitBreaker ? 'Sim' : 'Não'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Métricas de Sistema</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Retry Overhead:</span>
                <span className="font-mono">0.0ms</span>
              </div>
              <div className="flex justify-between">
                <span>Circuit Breaker Impact:</span>
                <span className="font-mono">0.0ms</span>
              </div>
              <div className="flex justify-between">
                <span>Error Recovery Rate:</span>
                <span className="font-mono">0.0%</span>
              </div>
              <div className="flex justify-between">
                <span>Fallbacks Ativados:</span>
                <span className="font-mono">0</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StrategiesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Retry</CardTitle>
        <CardDescription>
          Estratégias configuradas para diferentes tipos de operação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Estratégias Disponíveis</h4>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Críticas</span>
                  <Badge variant="destructive">Alta Prioridade</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Para operações críticas como pagamentos
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Externas</span>
                  <Badge variant="secondary">API Third-party</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Para integrações com APIs externas
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Cache</span>
                  <Badge variant="outline">Leitura</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Para operações de cache e leitura
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Graceful</span>
                  <Badge variant="default">Degradação</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Para operações que podem degradar
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Padrões de Retry</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-muted rounded">
                <strong>Exponential Backoff:</strong> 1s, 2s, 4s, 8s...
              </div>
              <div className="p-2 bg-muted rounded">
                <strong>Fixed Delay:</strong> Intervalos fixos entre tentativas
              </div>
              <div className="p-2 bg-muted rounded">
                <strong>Jitter:</strong> Variação aleatória para evitar thundering herd
              </div>
              <div className="p-2 bg-muted rounded">
                <strong>Timeout:</strong> Cancelamento por tempo limite
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}