/**
 * Performance Dashboard - Sistema completo de monitoramento
 * Integra todos os hooks de performance e oferece uma interface completa
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Memory, 
  Monitor, 
  Network, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  Zap,
  Play,
  Pause,
  Trash2
} from '@/lib/icons';
import { usePerformanceMonitor, useRenderTime, useMemoryUsage, useComponentDidMount, useApiPerformance } from '@/hooks/performance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PerformanceDashboardProps {
  componentName?: string;
  showRealTimeData?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAlerts?: boolean;
  position?: 'overlay' | 'sidebar' | 'modal';
  enableProfiler?: boolean;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
  if (value <= thresholds.good) return 'text-green-500';
  if (value <= thresholds.warning) return 'text-yellow-500';
  return 'text-red-500';
};

const getPerformanceBadge = (value: number, thresholds: { good: number; warning: number }) => {
  if (value <= thresholds.good) return { variant: 'default' as const, text: 'Bom' };
  if (value <= thresholds.warning) return { variant: 'secondary' as const, text: 'A Melhorar' };
  return { variant: 'destructive' as const, text: 'Ruim' };
};

// Componente para exibir React Profiler
const ReactProfiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileData, setProfileData] = useState<any[]>([]);
  
  const onRender = useCallback((id: string, phase: string, actualDuration: number) => {
    const profileEntry = {
      id,
      phase,
      duration: actualDuration,
      timestamp: Date.now()
    };
    setProfileData(prev => [...prev.slice(-19), profileEntry]);
  }, []);

  if (typeof window !== 'undefined' && 'React' in window) {
    const React = (window as any).React;
    if (React && React.Profiler) {
      return React.createElement(React.Profiler, { id: 'PerformanceDashboard', onRender }, children);
    }
  }
  
  return <>{children}</>;
};

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  componentName = 'PerformanceDashboard',
  showRealTimeData = true,
  autoRefresh = true,
  refreshInterval = 2000,
  enableAlerts = true,
  position = 'overlay',
  enableProfiler = true
}) => {
  const [isVisible, setIsVisible] = useState(position === 'overlay');
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isRecording, setIsRecording] = useState(true);

  const {
    isActive,
    currentSnapshot,
    performanceIssues,
    renderTime,
    memoryUsage,
    mountData,
    apiStats,
    startMonitoring,
    stopMonitoring,
    getPerformanceReport,
    clearHistory,
    isObserverSupported
  } = usePerformanceMonitor({
    componentName,
    enableRenderTracking: true,
    enableMemoryTracking: true,
    enableApiTracking: true,
    enableObserver: true,
    reportInterval: refreshInterval
  });

  // Hooks individuais para dados mais específicos
  const renderPerformance = useRenderTime(`${componentName}-Render`);
  const memoryMonitor = useMemoryUsage({
    interval: 5000,
    onMemoryLeak: (data) => {
      console.warn('🧠 Memory leak detected:', data);
    }
  });
  const componentLifecycle = useComponentDidMount(`${componentName}-Lifecycle`);
  const apiMonitor = useApiPerformance({
    slowThreshold: 1000,
    onSlowCall: (data) => {
      console.warn('🐌 Slow API call:', data);
    }
  });

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      
      // Adicionar dados ao gráfico
      if (currentSnapshot) {
        setChartData(prev => {
          const newData = {
            time: new Date().toLocaleTimeString(),
            renderTime: renderTime.renderTime,
            memoryUsage: memoryUsage?.usedMB || 0,
            apiCalls: apiStats.totalCalls,
            issues: performanceIssues.length,
            mountTime: mountData.mountTime,
            updateCount: mountData.updateCount
          };
          
          const updated = [...prev, newData];
          return updated.slice(-30); // Manter os últimos 30 pontos
        });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, currentSnapshot, renderTime.renderTime, memoryUsage?.usedMB, apiStats.totalCalls, performanceIssues.length, mountData.mountTime, mountData.updateCount]);

  // Start/Stop monitoring
  useEffect(() => {
    if (isObserverSupported && isRecording) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring, isObserverSupported, isRecording]);

  const handleExportReport = useCallback(() => {
    const report = getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getPerformanceReport]);

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // Thresholds de performance
  const renderTimeThresholds = { good: 16, warning: 50 };
  const memoryThresholds = { good: 50, warning: 100 }; // MB
  const apiThresholds = { good: 500, warning: 1000 }; // ms
  const mountThresholds = { good: 100, warning: 500 }; // ms

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm shadow-lg"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Performance Monitor
          {performanceIssues.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {performanceIssues.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <ReactProfiler>
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="h-full flex flex-col">
          {/* Header */}
          <Card className="m-4 mb-0 rounded-none border-x-0 border-t-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-6 w-6" />
                  <div>
                    <CardTitle className="text-xl">Performance Dashboard</CardTitle>
                    <CardDescription>
                      Monitoramento completo de performance em tempo real
                    </CardDescription>
                  </div>
                  <Badge variant={isActive && isRecording ? 'default' : 'secondary'}>
                    {isActive && isRecording ? 'Ativo' : 'Pausado'}
                  </Badge>
                  {enableProfiler && (
                    <Badge variant="outline">
                      <Zap className="h-3 w-3 mr-1" />
                      React Profiler
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isRecording ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleRecording}
                  >
                    {isRecording ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {isRecording ? 'Pausar' : 'Gravar'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportReport}>
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearHistory}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Última atualização: {new Date(currentTime).toLocaleTimeString()}</span>
                <span>•</span>
                <span>Observer API: {isObserverSupported ? 'Suportado' : 'Não suportado'}</span>
                <span>•</span>
                <span>Performance Issues: {performanceIssues.length}</span>
              </div>
            </CardHeader>
          </Card>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-4 pt-0">
            <Card className="h-full">
              <CardContent className="h-full p-0">
                <Tabs defaultValue="overview" className="h-full flex flex-col">
                  <div className="px-6 pt-6">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                      <TabsTrigger value="components">Componentes</TabsTrigger>
                      <TabsTrigger value="network">Rede</TabsTrigger>
                      <TabsTrigger value="memory">Memória</TabsTrigger>
                      <TabsTrigger value="issues">Issues</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="overview" className="flex-1 overflow-hidden px-6 pb-6">
                    <ScrollArea className="h-full">
                      {/* Métricas principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Render Performance */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Render
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              <span className={getPerformanceColor(renderTime.renderTime, renderTimeThresholds)}>
                                {formatDuration(renderTime.renderTime)}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min((renderTime.renderTime / renderTimeThresholds.warning) * 100, 100)} 
                              className="mt-2"
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {renderTime.renderCount} renders
                            </div>
                          </CardContent>
                        </Card>

                        {/* Mount Performance */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Mount
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              <span className={getPerformanceColor(mountData.mountTime, mountThresholds)}>
                                {formatDuration(mountData.mountTime)}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min((mountData.mountTime / mountThresholds.warning) * 100, 100)} 
                              className="mt-2"
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {mountData.updateCount} updates
                            </div>
                          </CardContent>
                        </Card>

                        {/* Memory Usage */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-1">
                              <Memory className="h-3 w-3" />
                              Memória
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              <span className={getPerformanceColor(memoryUsage?.usedMB || 0, memoryThresholds)}>
                                {memoryUsage ? formatBytes(memoryUsage.usedJSHeapSize) : 'N/A'}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(((memoryUsage?.usedMB || 0) / memoryThresholds.warning) * 100, 100)} 
                              className="mt-2"
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {memoryUsage ? memoryUsage.memoryPressure : 'N/A'}
                            </div>
                          </CardContent>
                        </Card>

                        {/* API Performance */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-1">
                              <Network className="h-3 w-3" />
                              API
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              <span className={getPerformanceColor(apiStats.averageResponseTime, apiThresholds)}>
                                {formatDuration(apiStats.averageResponseTime)}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min((apiStats.averageResponseTime / apiThresholds.warning) * 100, 100)} 
                              className="mt-2"
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {apiStats.totalCalls} calls • {apiStats.errorRate.toFixed(1)}% erro
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Gráfico de tempo real */}
                      {showRealTimeData && chartData.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Performance em Tempo Real</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" />
                                  <YAxis yAxisId="left" />
                                  <YAxis yAxisId="right" orientation="right" />
                                  <Tooltip />
                                  <Line 
                                    yAxisId="left" 
                                    type="monotone" 
                                    dataKey="renderTime" 
                                    stroke="#8884d8" 
                                    name="Render (ms)"
                                    strokeWidth={2}
                                  />
                                  <Line 
                                    yAxisId="left" 
                                    type="monotone" 
                                    dataKey="mountTime" 
                                    stroke="#82ca9d" 
                                    name="Mount (ms)"
                                    strokeWidth={2}
                                  />
                                  <Line 
                                    yAxisId="right" 
                                    type="monotone" 
                                    dataKey="memoryUsage" 
                                    stroke="#ffc658" 
                                    name="Memory (MB)"
                                    strokeWidth={2}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Alertas */}
                      {enableAlerts && performanceIssues.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Performance Issues Recentes
                          </h4>
                          {performanceIssues.slice(0, 3).map((issue, index) => (
                            <Alert key={index} variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <div className="flex justify-between items-start">
                                  <span>{issue.message}</span>
                                  <span className="text-xs">
                                    {new Date(issue.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="components" className="flex-1 overflow-hidden px-6 pb-6">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        {/* Render Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Render Performance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Tempo atual</div>
                                <div className="font-mono">{formatDuration(renderTime.renderTime)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Média</div>
                                <div className="font-mono">{formatDuration(renderTime.averageRenderTime)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Contagem</div>
                                <div className="font-mono">{renderTime.renderCount}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Status</div>
                                <Badge {...getPerformanceBadge(renderTime.renderTime, renderTimeThresholds)}>
                                  {getPerformanceBadge(renderTime.renderTime, renderTimeThresholds).text}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Mount Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Mount/Unmount Performance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Tempo de mount</div>
                                <div className="font-mono">{formatDuration(mountData.mountTime)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Updates</div>
                                <div className="font-mono">{mountData.updateCount}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Unmounts</div>
                                <div className="font-mono">{mountData.unmountCount}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Status</div>
                                <Badge variant={mountData.isMounted ? 'default' : 'secondary'}>
                                  {mountData.isMounted ? 'Montado' : 'Desmontado'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Lifecycle Phases */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Lifecycle Phases</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Constructor</div>
                                <div className="font-mono">{formatDuration(mountData.lifecyclePhases.constructor)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Render</div>
                                <div className="font-mono">{formatDuration(mountData.lifecyclePhases.render)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">ComponentDidMount</div>
                                <div className="font-mono">{formatDuration(mountData.lifecyclePhases.componentDidMount)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">UseEffect</div>
                                <div className="font-mono">{formatDuration(mountData.lifecyclePhases.useEffect)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="network" className="flex-1 overflow-hidden px-6 pb-6">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        {/* API Stats */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">API Performance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Total calls</div>
                                <div className="font-mono text-lg">{apiStats.totalCalls}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Taxa de erro</div>
                                <div className="font-mono text-lg">{apiStats.errorRate.toFixed(1)}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Throughput</div>
                                <div className="font-mono text-lg">{apiStats.throughput.toFixed(1)}/min</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">P99</div>
                                <div className="font-mono text-lg">{formatDuration(apiStats.p99)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Performance Distribution */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Distribuição de Performance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">P50 (Mediana)</div>
                                <div className="font-mono">{formatDuration(apiStats.p50)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">P90</div>
                                <div className="font-mono">{formatDuration(apiStats.p90)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">P99</div>
                                <div className="font-mono">{formatDuration(apiStats.p99)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Slowest/Fastest calls */}
                        {apiStats.slowestCall && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Chamadas Mais Lenta/Rápida</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded">
                                  <div className="text-sm text-red-600 dark:text-red-400">Mais Lenta</div>
                                  <div className="font-mono text-xs mt-1 break-all">{apiStats.slowestCall.url}</div>
                                  <div className="text-lg font-bold text-red-600">
                                    {formatDuration(apiStats.slowestCall.duration)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(apiStats.slowestCall.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                                  <div className="text-sm text-green-600 dark:text-green-400">Mais Rápida</div>
                                  <div className="font-mono text-xs mt-1 break-all">{apiStats.fastestCall?.url || 'N/A'}</div>
                                  <div className="text-lg font-bold text-green-600">
                                    {formatDuration(apiStats.fastestCall?.duration || 0)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {apiStats.fastestCall ? new Date(apiStats.fastestCall.timestamp).toLocaleTimeString() : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="memory" className="flex-1 overflow-hidden px-6 pb-6">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        {/* Memory Overview */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Uso de Memória</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Usado</div>
                                <div className="font-mono text-lg">
                                  {memoryUsage ? formatBytes(memoryUsage.usedJSHeapSize) : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Total</div>
                                <div className="font-mono text-lg">
                                  {memoryUsage ? formatBytes(memoryUsage.totalJSHeapSize) : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Limite</div>
                                <div className="font-mono text-lg">
                                  {memoryUsage ? formatBytes(memoryUsage.jsHeapSizeLimit) : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Pressão</div>
                                <Badge variant={
                                  memoryUsage?.memoryPressure === 'critical' ? 'destructive' :
                                  memoryUsage?.memoryPressure === 'high' ? 'secondary' :
                                  memoryUsage?.memoryPressure === 'medium' ? 'outline' : 'default'
                                }>
                                  {memoryUsage?.memoryPressure || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Memory Growth */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Crescimento de Memória</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Taxa de crescimento</div>
                                <div className="font-mono text-lg">
                                  {memoryUsage ? `${memoryUsage.growthRate.toFixed(2)} MB/s` : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Última atualização</div>
                                <div className="font-mono text-lg">
                                  {memoryUsage ? new Date(memoryUsage.timestamp).toLocaleTimeString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="issues" className="flex-1 overflow-hidden px-6 pb-6">
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        {performanceIssues.length === 0 ? (
                          <div className="text-center text-muted-foreground py-16">
                            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                            <h3 className="text-lg font-medium mb-2">Nenhum problema detectado</h3>
                            <p>Sua aplicação está executando com boa performance!</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-medium">
                                Performance Issues ({performanceIssues.length})
                              </h3>
                              <Button variant="outline" size="sm" onClick={clearHistory}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Limpar
                              </Button>
                            </div>
                            {performanceIssues.map((issue, index) => (
                              <Card key={index}>
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="destructive" className="text-xs">
                                          {issue.type}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(issue.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="text-sm font-medium mb-1">{issue.message}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Componente: {issue.data?.componentName || 'N/A'}
                                        {issue.data?.renderTime && (
                                          <span> • Render: {formatDuration(issue.data.renderTime)}</span>
                                        )}
                                        {issue.data?.duration && (
                                          <span> • Duração: {formatDuration(issue.data.duration)}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ReactProfiler>
  );
};

export default PerformanceDashboard;