/**
 * PerformanceMonitor Component - Web Vitals Integration
 * Componente completo de monitoramento de Web Vitals integrado com o sistema
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWebVitals, useComponentPerformance } from '../../lib/web-vitals/useWebVitals';
import { PerformanceDashboard } from './PerformanceDashboard';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  X,
  Info,
  BarChart3,
  Settings,
  Download,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface PerformanceMonitorProps {
  componentName?: string;
  isDevelopment?: boolean;
  showOnGoodPerformance?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'compact' | 'full' | 'dashboard';
  enableRealTime?: boolean;
  autoStart?: boolean;
  onAlert?: (metric: any) => void;
}

interface MetricDisplay {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  unit: string;
  trend?: 'improving' | 'degrading' | 'stable';
  change?: number;
}

// Cores para ratings
const RATING_COLORS = {
  good: 'text-green-600 bg-green-50 border-green-200',
  'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
  poor: 'text-red-600 bg-red-50 border-red-200'
};

const RATING_ICONS = {
  good: CheckCircle,
  'needs-improvement': Clock,
  poor: AlertTriangle
};

const formatValue = (value: number, unit: string): string => {
  if (unit === 'ms') {
    return `${Math.round(value)}ms`;
  }
  if (unit === 'score') {
    return value.toFixed(3);
  }
  return value.toString();
};

const getProgressValue = (value: number, rating: 'good' | 'needs-improvement' | 'poor'): number => {
  if (rating === 'good') return 33;
  if (rating === 'needs-improvement') return 66;
  return 100;
};

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName = 'PerformanceMonitor',
  isDevelopment = process.env.NODE_ENV === 'development',
  showOnGoodPerformance = false,
  position = 'top-right',
  size = 'compact',
  enableRealTime = true,
  autoStart = true,
  onAlert
}) => {
  // Usar o hook de Web Vitals
  const webVitals = useComponentPerformance(componentName, {
    autoStart,
    enableAlerts: true,
    onAlert
  });

  // Estados locais
  const [isVisible, setIsVisible] = useState(false);
  const [realTimeData, setRealTimeData] = useState<MetricDisplay[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(enableRealTime);

  // Atualizar dados em tempo real
  const updateRealTimeData = useCallback(() => {
    const metrics: MetricDisplay[] = [];
    
    ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].forEach(metricName => {
      const latestMetric = webVitals.getLatestMetric(metricName);
      if (latestMetric) {
        const trend = webVitals.trends[metricName];
        
        metrics.push({
          name: metricName,
          value: latestMetric.value,
          rating: latestMetric.rating,
          unit: metricName === 'CLS' ? 'score' : 'ms',
          trend: trend?.trend,
          change: trend?.change
        });
      }
    });

    setRealTimeData(metrics);
    setLastUpdate(Date.now());
  }, [webVitals]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(updateRealTimeData, 2000); // Atualizar a cada 2 segundos
    return () => clearInterval(interval);
  }, [autoRefresh, updateRealTimeData]);

  // Atualizar quando métricas mudarem
  useEffect(() => {
    updateRealTimeData();
  }, [webVitals.metrics, updateRealTimeData]);

  // Mostrar apenas em desenvolvimento ou se explicitamente habilitado
  const shouldShow = isDevelopment || showOnGoodPerformance || 
    realTimeData.some(metric => metric.rating !== 'good');

  if (!shouldShow) {
    return null;
  }

  // Posições do componente
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  // Dashboard completo
  if (size === 'dashboard') {
    return <PerformanceDashboard />;
  }

  // Componente compacto
  if (!isVisible) {
    return (
      <div className={`fixed z-50 ${positionClasses[position]}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/90 backdrop-blur-sm shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Web Vitals
          {realTimeData.length > 0 && (
            <Badge 
              variant={webVitals.getOverallScore() >= 90 ? 'default' : 
                      webVitals.getOverallScore() >= 50 ? 'secondary' : 'destructive'}
              className="ml-2 text-xs"
            >
              {Math.round(webVitals.getOverallScore())}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  const handleExportData = () => {
    const data = {
      metrics: webVitals.metrics,
      currentScore: webVitals.currentScore,
      trends: webVitals.trends,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-vitals-${componentName}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleFullView = () => {
    setIsVisible(false);
    // Trigger para abrir dashboard em nova aba ou modal
    window.open('/performance-dashboard', '_blank');
  };

  return (
    <Card className={`fixed z-50 w-80 bg-background/95 backdrop-blur-sm shadow-lg ${positionClasses[position]} max-h-[80vh] overflow-hidden`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <h3 className="font-semibold text-sm">Web Vitals Monitor</h3>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant={webVitals.getOverallScore() >= 90 ? 'default' : 
                      webVitals.getOverallScore() >= 50 ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {Math.round(webVitals.getOverallScore())}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Componente: {componentName}
        </div>
        <div className="text-xs text-muted-foreground">
          Última atualização: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {size === 'full' ? (
          <Tabs defaultValue="realtime" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="realtime" className="text-xs">Tempo Real</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">Tendências</TabsTrigger>
              <TabsTrigger value="details" className="text-xs">Detalhes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="realtime" className="space-y-3">
              {renderRealTimeMetrics()}
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-3">
              {renderTrends()}
            </TabsContent>
            
            <TabsContent value="details" className="space-y-3">
              {renderDetails()}
            </TabsContent>
          </Tabs>
        ) : (
          renderRealTimeMetrics()
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateRealTimeData}
            className="flex-1 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportData}
            className="flex-1 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToggleFullView}
            className="flex-1 text-xs"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Dashboard
          </Button>
        </div>
      </div>
    </Card>
  );

  function renderRealTimeMetrics() {
    if (realTimeData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aguardando métricas...</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {realTimeData.map((metric) => {
          const Icon = RATING_ICONS[metric.rating];
          const TrendIcon = metric.trend === 'improving' ? TrendingUp :
                          metric.trend === 'degrading' ? TrendingDown : Info;

          return (
            <div key={metric.name} className={`p-3 rounded-lg border ${RATING_COLORS[metric.rating]}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{metric.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {metric.trend && (
                    <TrendIcon className={`h-3 w-3 ${
                      metric.trend === 'improving' ? 'text-green-500' :
                      metric.trend === 'degrading' ? 'text-red-500' : 'text-gray-500'
                    }`} />
                  )}
                  <span className="text-sm font-mono">
                    {formatValue(metric.value, metric.unit)}
                  </span>
                </div>
              </div>
              
              <Progress 
                value={getProgressValue(metric.value, metric.rating)} 
                className="h-1 mb-2"
              />
              
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {metric.rating === 'good' ? 'Bom' :
                   metric.rating === 'needs-improvement' ? 'Melhorar' : 'Ruim'}
                </span>
                {metric.change && (
                  <span className={`text-xs ${
                    metric.change < 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change < 0 ? '' : '+'}{metric.change.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderTrends() {
    return (
      <div className="space-y-3">
        {Object.entries(webVitals.trends).map(([metricName, trend]) => (
          <div key={metricName} className="flex items-center justify-between p-2 rounded bg-muted/50">
            <div className="flex items-center gap-2">
              {trend.trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {trend.trend === 'degrading' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {trend.trend === 'stable' && <Activity className="h-4 w-4 text-gray-500" />}
              <span className="text-sm font-medium">{metricName}</span>
            </div>
            <div className="text-right">
              <div className="text-sm">{trend.change.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">
                {formatValue(trend.average, 'ms')}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderDetails() {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-muted/50">
            <div className="text-muted-foreground">Métricas Coletadas</div>
            <div className="font-medium">{webVitals.metrics.length}</div>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <div className="text-muted-foreground">Status Geral</div>
            <div className="font-medium">
              {webVitals.getStatus().isGood ? 'Bom' : 
               webVitals.getStatus().isNeedsImprovement ? 'Melhorar' : 'Ruim'}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recomendações</h4>
          {realTimeData
            .filter(m => m.rating === 'poor' || m.rating === 'needs-improvement')
            .map(metric => (
              <div key={`rec-${metric.name}`} className="text-xs p-2 rounded bg-yellow-50 dark:bg-yellow-950/20">
                <strong>{metric.name}:</strong> {getRecommendation(metric.name, metric.rating)}
              </div>
            ))
          }
        </div>
      </div>
    );
  }
};

function getRecommendation(metricName: string, rating: string): string {
  const recommendations: Record<string, Record<string, string>> = {
    FCP: {
      'needs-improvement': 'Otimize imagens, use CDN, minifique CSS/JS',
      'poor': 'Priorize conteúdo acima da dobra, otimize carregamento de recursos'
    },
    LCP: {
      'needs-improvement': 'Otimize largest content element, use preload',
      'poor': 'Compresse imagens, otimize servidor, use cache effectively'
    },
    FID: {
      'needs-improvement': 'Reduza JavaScript blocking, otimize event handlers',
      'poor': 'Code split, use web workers, otimize third-party scripts'
    },
    CLS: {
      'needs-improvement': 'Defina dimensiones de imagens e ads',
      'poor': 'Evite conteúdo dinâmico acima do fold, use font-display'
    },
    TTFB: {
      'needs-improvement': 'Otimize server response, use edge caching',
      'poor': 'Melhore server infrastructure, otimize database queries'
    }
  };

  return recommendations[metricName]?.[rating] || 'Considere otimizações de performance';
}

export default PerformanceMonitor;