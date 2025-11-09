/**
 * Componente de Exemplo - Demonstração do Sistema de Performance Monitoring
 * Mostra como integrar todos os hooks e componentes de performance
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useRenderTime, 
  useMemoryUsage, 
  useComponentDidMount, 
  useApiPerformance, 
  usePerformanceMonitor,
  useAsyncOperationMonitor,
  withRenderTime,
  withComponentDidMount,
  withPerformanceMonitoring
} from '@/hooks/performance';
import { PerformanceDashboard, ReactProfilerWrapper } from '@/components/performance';
import { 
  Activity, 
  Memory, 
  Network, 
  Zap, 
  Play,
  Pause,
  BarChart3,
  Settings
} from '@/lib/icons';

// Componente simples para demonstrar os hooks
const SimpleComponent: React.FC<{ iteration: number }> = ({ iteration }) => {
  // Hook de render time
  const renderTime = useRenderTime('SimpleComponent', {
    threshold: 10,
    onSlowRender: (data) => {
      console.log('🐌 Slow render detected:', data);
    }
  });

  // Hook de memory usage
  const memory = useMemoryUsage({
    warningThreshold: 80,
    onMemoryLeak: (data) => {
      console.log('🧠 Memory leak detected:', data);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Componente Simples #{iteration}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Render Time</div>
            <div className="font-mono">{renderTime.renderTime.toFixed(2)}ms</div>
          </div>
          <div>
            <div className="text-muted-foreground">Memory</div>
            <div className="font-mono">
              {memory.memoryData ? `${memory.memoryData.usedMB.toFixed(2)} MB` : 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente com HOC de performance
const PerformanceWrappedComponent = withRenderTime(
  ({ children, title }: { children: React.ReactNode; title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  ),
  'PerformanceWrappedComponent',
  { threshold: 20 }
);

// Componente para demonstrar API monitoring
const ApiTestComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Hook de performance de API
  const { fetchWithMonitoring, stats } = useApiPerformance({
    slowThreshold: 2000,
    onSlowCall: (data) => {
      console.log('🐌 Slow API call:', data);
    }
  });

  // Hook para operações async
  const { executeWithMonitoring, isLoading } = useAsyncOperationMonitor('complexOperation');

  const makeTestApiCall = useCallback(async () => {
    setLoading(true);
    try {
      // Simular API call com fetch
      const response = await fetchWithMonitoring('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      
      setResults(prev => [...prev.slice(-4), {
        type: 'fetch',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        status: response.status,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('API call failed:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchWithMonitoring]);

  const makeTestOperation = useCallback(async () => {
    setLoading(true);
    try {
      await executeWithMonitoring(async () => {
        // Simular operação complexa
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        return 'Operation completed';
      });
      
      setResults(prev => [...prev.slice(-4), {
        type: 'operation',
        name: 'complexOperation',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  }, [executeWithMonitoring]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">API & Operation Testing</CardTitle>
        <CardDescription>Teste de performance para calls de API e operações</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={makeTestApiCall} 
              disabled={loading}
              size="sm"
            >
              <Network className="h-4 w-4 mr-1" />
              Test API Call
            </Button>
            <Button 
              onClick={makeTestOperation} 
              disabled={loading}
              size="sm"
            >
              <Activity className="h-4 w-4 mr-1" />
              Test Operation
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground">API Stats</div>
              <div className="font-mono">
                {stats.totalCalls} calls • {stats.averageResponseTime.toFixed(0)}ms avg
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Error Rate</div>
              <div className="font-mono">{stats.errorRate.toFixed(1)}%</div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Recent Results</div>
              {results.map((result, index) => (
                <div key={index} className="text-xs p-2 bg-muted rounded">
                  {result.type === 'fetch' ? 'API' : 'Operation'}: {result.url || result.name}
                  {result.status && ` (${result.status})`}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal de demonstração
const PerformanceDemo: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showProfiler, setShowProfiler] = useState(true);
  const [componentCount, setComponentCount] = useState(5);
  const [isGeneratingLoad, setIsGeneratingLoad] = useState(false);

  // Hook principal de performance monitoring
  const performanceData = usePerformanceMonitor({
    componentName: 'PerformanceDemo',
    enableRenderTracking: true,
    enableMemoryTracking: true,
    enableApiTracking: true,
    enableObserver: true,
    onPerformanceIssue: (issue) => {
      console.warn('Performance issue detected:', issue);
    }
  });

  // Hook de lifecycle monitoring
  const mountData = useComponentDidMount('PerformanceDemo', {
    trackLifecycle: true,
    trackUpdates: true,
    warningThreshold: 100
  });

  // Hook de memory monitoring
  const memoryMonitor = useMemoryUsage({
    interval: 3000,
    warningThreshold: 75
  });

  const generateLoad = useCallback(async () => {
    setIsGeneratingLoad(true);
    
    try {
      // Gerar múltiplos renders para testar performance
      for (let i = 0; i < 10; i++) {
        setComponentCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Simular operação pesada
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } finally {
      setIsGeneratingLoad(false);
    }
  }, []);

  const clearLoad = useCallback(() => {
    setComponentCount(5);
  }, []);

  return (
    <ReactProfilerWrapper 
      id="PerformanceDemo"
      enableAdvancedMetrics={true}
      threshold={20}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance Monitoring Demo</h1>
            <p className="text-muted-foreground">
              Demonstração completa do sistema de performance monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showDashboard ? "default" : "outline"}
              onClick={() => setShowDashboard(!showDashboard)}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            <Badge variant="outline">
              <Zap className="h-3 w-3 mr-1" />
              Profiler: {showProfiler ? 'On' : 'Off'}
            </Badge>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Mount Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mountData.mountTime.toFixed(2)}ms
              </div>
              <div className="text-xs text-muted-foreground">
                {mountData.updateCount} updates
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Memory className="h-3 w-3" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {memoryMonitor.memoryData ? `${memoryMonitor.memoryData.usedMB.toFixed(1)} MB` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                {memoryMonitor.memoryData?.memoryPressure || 'Unknown'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceData.performanceIssues.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {performanceData.performanceIssues.length === 0 ? 'Clean' : 'Problems detected'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={performanceData.isActive ? 'default' : 'secondary'}>
                  {performanceData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Observer: {performanceData.isObserverSupported ? 'Yes' : 'No'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Load Testing</CardTitle>
            <CardDescription>
              Gere carga de trabalho para testar o sistema de performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="component-count">Componentes:</Label>
                <Input
                  id="component-count"
                  type="number"
                  value={componentCount}
                  onChange={(e) => setComponentCount(Number(e.target.value))}
                  className="w-20"
                  min="1"
                  max="50"
                />
              </div>
              <Button
                onClick={generateLoad}
                disabled={isGeneratingLoad}
                size="sm"
              >
                <Play className="h-4 w-4 mr-1" />
                {isGeneratingLoad ? 'Generating...' : 'Generate Load'}
              </Button>
              <Button
                onClick={clearLoad}
                variant="outline"
                size="sm"
              >
                <Pause className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: componentCount }, (_, i) => (
            <SimpleComponent key={i} iteration={i + 1} />
          ))}
        </div>

        {/* API Testing */}
        <ApiTestComponent />

        {/* PerformanceWrappedComponent Demo */}
        <PerformanceWrappedComponent title="HOC Performance Monitoring">
          <div className="text-sm">
            Este componente está sendo monitorado com um HOC de performance.
            <br />
            <Badge variant="outline" className="mt-2">
              threshold: 20ms
            </Badge>
          </div>
        </PerformanceWrappedComponent>

        {/* Performance Dashboard */}
        {showDashboard && (
          <PerformanceDashboard
            componentName="PerformanceDemo"
            showRealTimeData={true}
            autoRefresh={true}
            refreshInterval={2000}
            enableAlerts={true}
            position="overlay"
            enableProfiler={showProfiler}
          />
        )}
      </div>
    </ReactProfilerWrapper>
  );
};

export default PerformanceDemo;