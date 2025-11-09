/**
 * PerformanceMonitor Component
 * Visualizes Core Web Vitals and performance metrics in development mode
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Monitor, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  X,
  Info } from '@/lib/icons';
import { 
  performanceCollector, 
  getPerformanceData, 
  reportPerformanceData,
  getNavigationTiming,
  PERFORMANCE_THRESHOLDS,
  type PerformanceMetricName,
  type PerformanceRating
} from '@/utils/performance';

interface PerformanceMonitorProps {
  isDevelopment?: boolean;
  showOnGoodPerformance?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'compact' | 'full';
}

interface MetricDisplay {
  name: PerformanceMetricName;
  value: number;
  rating: PerformanceRating;
  delta?: number;
  unit: string;
}

const getRatingColor = (rating: PerformanceRating): string => {
  switch (rating) {
    case 'good': return 'bg-green-500';
    case 'needs-improvement': return 'bg-yellow-500';
    case 'poor': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getRatingIcon = (rating: PerformanceRating) => {
  switch (rating) {
    case 'good': return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'needs-improvement': return <Clock className="h-3 w-3 text-yellow-500" />;
    case 'poor': return <AlertTriangle className="h-3 w-3 text-red-500" />;
    default: return <Info className="h-3 w-3 text-gray-500" />;
  }
};

const formatValue = (value: number, metric: PerformanceMetricName): string => {
  if (metric === 'CLS') {
    return value.toFixed(3);
  }
  return `${value.toFixed(0)}`;
};

const getProgressValue = (value: number, metric: PerformanceMetricName): number => {
  const threshold = PERFORMANCE_THRESHOLDS[metric];
  if (metric === 'CLS') {
    return (value / threshold.poor) * 100;
  }
  return Math.min((value / threshold.poor) * 100, 100);
};

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isDevelopment = process.env.NODE_ENV === 'development',
  showOnGoodPerformance = false,
  position = 'top-right',
  size = 'compact'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<MetricDisplay[]>([]);
  const [summary, setSummary] = useState<{
    overall: PerformanceRating;
    issues: string[];
  }>({ overall: 'good', issues: [] });
  const [navigationTiming, setNavigationTiming] = useState<any>(null);

  const updateMetrics = useCallback(() => {
    const data = getPerformanceData();
    const metricDisplays: MetricDisplay[] = Object.entries(data.metrics).map(([name, metric]) => ({
      name: name as PerformanceMetricName,
      value: metric.value,
      rating: performanceCollector.getRating(name as PerformanceMetricName, metric.value),
      delta: metric.delta,
      unit: name === 'CLS' ? '' : 'ms'
    }));

    setMetrics(metricDisplays);
    setSummary(data.summary);
  }, []);

  const updateNavigationTiming = useCallback(() => {
    const timing = getNavigationTiming();
    setNavigationTiming(timing);
  }, []);

  useEffect(() => {
    // Only show in development or if explicitly enabled
    if (!isDevelopment && !showOnGoodPerformance) {
      return;
    }

    // Subscribe to performance updates
    const unsubscribe = performanceCollector.subscribe(() => {
      updateMetrics();
    });

    // Initial data fetch
    updateMetrics();
    updateNavigationTiming();

    // Update navigation timing after load
    const handleLoad = () => {
      setTimeout(updateNavigationTiming, 1000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', handleLoad);
      }
    };
  }, [isDevelopment, showOnGoodPerformance, updateMetrics, updateNavigationTiming]);

  // Don't render if no issues and not in development
  if (!isDevelopment && !showOnGoodPerformance && summary.overall === 'good') {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const handleReportData = () => {
    reportPerformanceData('console');
  };

  const handleReset = () => {
    // Clear performance data
    performanceCollector.subscribe(() => {}); // This will be handled automatically
    setMetrics([]);
    setSummary({ overall: 'good', issues: [] });
  };

  if (!isVisible) {
    return (
      <div className={`fixed z-50 ${positionClasses[position]}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Activity className="h-4 w-4 mr-1" />
          Perf
        </Button>
      </div>
    );
  }

  return (
    <Card className={`fixed z-50 w-96 bg-background/95 backdrop-blur-sm shadow-lg ${positionClasses[position]} max-h-[80vh] overflow-y-auto`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <CardTitle className="text-sm">Performance Monitor</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant={summary.overall === 'good' ? 'default' : summary.overall === 'needs-improvement' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {summary.overall === 'good' && 'Boa'}
              {summary.overall === 'needs-improvement' && 'A melhorar'}
              {summary.overall === 'poor' && 'Ruim'}
            </Badge>
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
        <CardDescription className="text-xs">
          Core Web Vitals em tempo real
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metrics" className="text-xs">Métricas</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">Detalhes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="space-y-3">
            {metrics.length > 0 ? (
              <div className="space-y-3">
                {metrics.map((metric) => (
                  <div key={metric.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {getRatingIcon(metric.rating)}
                        <span className="text-sm font-medium">{metric.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatValue(metric.value, metric.name)}{metric.unit}
                      </span>
                    </div>
                    <Progress 
                      value={getProgressValue(metric.value, metric.name)} 
                      className="h-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Boa: {formatValue(PERFORMANCE_THRESHOLDS[metric.name].good, metric.name)}{metric.unit}</span>
                      <span>Ruim: {formatValue(PERFORMANCE_THRESHOLDS[metric.name].poor, metric.name)}{metric.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aguardando métricas...
              </p>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-3">
            {summary.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  Problemas Identificados
                </h4>
                {summary.issues.map((issue, index) => (
                  <div key={index} className="text-xs text-muted-foreground p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                    {issue}
                  </div>
                ))}
              </div>
            )}

            {navigationTiming && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Navegação</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>DNS:</span>
                    <span>{navigationTiming.dns.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TCP:</span>
                    <span>{navigationTiming.tcp.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TTFB:</span>
                    <span>{navigationTiming.ttfb.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DOM:</span>
                    <span>{navigationTiming.dom.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{navigationTiming.load.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReportData} className="flex-1 text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Relatório
          </Button>
          <Button variant="outline" size="sm" onClick={updateMetrics} className="flex-1 text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;