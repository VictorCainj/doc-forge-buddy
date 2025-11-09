/**
 * React Profiler Wrapper - Integração com React DevTools Profiler
 * Permite profiling avançado de componentes React com relatórios detalhados
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ProfilerOnRenderCallback, ProfilerProps } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Download,
  BarChart3,
  Play,
  Pause
} from '@/lib/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export interface ProfilerData {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
  timestamp: number;
}

export interface ProfilerStats {
  totalRenders: number;
  totalRenderTime: number;
  averageRenderTime: number;
  slowestRender: ProfilerData | null;
  fastestRender: ProfilerData | null;
  rendersByPhase: {
    mount: number;
    update: number;
    nestedUpdate: number;
  };
  renderTimeDistribution: Array<{ time: number; count: number }>;
  performanceScore: number;
}

interface ReactProfilerWrapperProps {
  children: React.ReactNode;
  id?: string;
  onRender?: ProfilerOnRenderCallback;
  enableAdvancedMetrics?: boolean;
  trackInteractions?: boolean;
  threshold?: number; // ms threshold for slow renders
  onThresholdExceeded?: (data: ProfilerData) => void;
  exportData?: boolean;
  position?: 'overlay' | 'inline';
}

export const ReactProfilerWrapper: React.FC<ReactProfilerWrapperProps> = ({
  children,
  id = 'ReactProfilerWrapper',
  onRender,
  enableAdvancedMetrics = true,
  trackInteractions = true,
  threshold = 16, // 60fps threshold
  onThresholdExceeded,
  exportData = true,
  position = 'overlay'
}) => {
  const [profileData, setProfileData] = useState<ProfilerData[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState<ProfilerStats | null>(null);
  const interactionsRef = useRef<Set<any>>(new Set());

  // Calculate statistics from profile data
  const calculateStats = useCallback((data: ProfilerData[]): ProfilerStats => {
    if (data.length === 0) {
      return {
        totalRenders: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        slowestRender: null,
        fastestRender: null,
        rendersByPhase: { mount: 0, update: 0, nestedUpdate: 0 },
        renderTimeDistribution: [],
        performanceScore: 100
      };
    }

    const totalRenderTime = data.reduce((sum, item) => sum + item.actualDuration, 0);
    const averageRenderTime = totalRenderTime / data.length;
    
    const slowestRender = data.reduce((slowest, current) => 
      !slowest || current.actualDuration > slowest.actualDuration ? current : slowest
    , null as ProfilerData | null);

    const fastestRender = data.reduce((fastest, current) => 
      !fastest || current.actualDuration < fastest.actualDuration ? current : fastest
    , null as ProfilerData | null);

    const rendersByPhase = data.reduce((acc, item) => {
      acc[item.phase] = (acc[item.phase] || 0) + 1;
      return acc;
    }, { mount: 0, update: 0, nestedUpdate: 0 });

    // Create time distribution (group renders by time ranges)
    const timeRanges = [0, 5, 10, 16, 33, 50, 100, 200, 500, 1000];
    const renderTimeDistribution = timeRanges.map((range, index) => {
      const nextRange = timeRanges[index + 1] || Infinity;
      const count = data.filter(item => 
        item.actualDuration >= range && item.actualDuration < nextRange
      ).length;
      
      return {
        time: range === 0 ? 0 : range,
        count,
        label: index === 0 ? '0ms' : 
               index === timeRanges.length - 1 ? `${range}+ms` : 
               `${range}-${nextRange}ms`
      };
    });

    // Calculate performance score (0-100)
    const slowRenders = data.filter(item => item.actualDuration > threshold).length;
    const performanceScore = Math.max(0, 100 - (slowRenders / data.length) * 100);

    return {
      totalRenders: data.length,
      totalRenderTime,
      averageRenderTime,
      slowestRender,
      fastestRender,
      rendersByPhase,
      renderTimeDistribution,
      performanceScore
    };
  }, [threshold]);

  // Enhanced onRender callback
  const handleRender: ProfilerOnRenderCallback = useCallback((
    profilerId,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    if (!isRecording) return;

    // Track interactions if enabled
    if (trackInteractions && interactions) {
      interactions.forEach(interaction => {
        interactionsRef.current.add(interaction);
      });
    }

    const newData: ProfilerData = {
      id: profilerId,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions: trackInteractions ? new Set(interactions) : new Set(),
      timestamp: Date.now()
    };

    setProfileData(prev => {
      const updated = [...prev, newData];
      // Keep only the last 100 renders to prevent memory issues
      if (updated.length > 100) {
        updated.shift();
      }
      return updated;
    });

    // Check threshold
    if (actualDuration > threshold && onThresholdExceeded) {
      onThresholdExceeded(newData);
    }

    // Call custom onRender if provided
    if (onRender) {
      onRender(profilerId, phase, actualDuration, baseDuration, startTime, commitTime, interactions);
    }
  }, [isRecording, trackInteractions, threshold, onThresholdExceeded, onRender]);

  // Update stats when data changes
  useEffect(() => {
    const newStats = calculateStats(profileData);
    setStats(newStats);
  }, [profileData, calculateStats]);

  // Export profiling data
  const handleExportData = useCallback(() => {
    const exportData = {
      componentId: id,
      timestamp: new Date().toISOString(),
      stats,
      profileData: profileData.slice(-50), // Export last 50 renders
      interactions: Array.from(interactionsRef.current),
      configuration: {
        threshold,
        trackInteractions,
        enableAdvancedMetrics
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `react-profiler-${id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [id, stats, profileData, threshold, trackInteractions, enableAdvancedMetrics]);

  // Clear profile data
  const handleClearData = useCallback(() => {
    setProfileData([]);
    interactionsRef.current.clear();
  }, []);

  // Performance score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1) return `${ms.toFixed(2)}ms`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Don't render profiler wrapper in production if not explicitly enabled
  if (process.env.NODE_ENV === 'production' && !exportData) {
    return <>{children}</>;
  }

  const ProfilerComponent = (
    <div className={position === 'overlay' ? 'relative' : ''}>
      <React.Profiler id={id} onRender={handleRender}>
        {children}
      </React.Profiler>

      {/* Performance Overlay */}
      {position === 'overlay' && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="w-80 bg-background/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <CardTitle className="text-sm">React Profiler</CardTitle>
                  <Badge variant={isRecording ? 'default' : 'secondary'}>
                    {isRecording ? 'Ativo' : 'Pausado'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {stats && (
                <CardDescription className="text-xs">
                  Score: <span className={getScoreColor(stats.performanceScore)}>
                    {stats.performanceScore.toFixed(0)}
                  </span> • {stats.totalRenders} renders
                </CardDescription>
              )}
            </CardHeader>

            {showDetails && stats && (
              <CardContent className="pt-0">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="distribution" className="text-xs">Distribuição</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Média</div>
                        <div className="font-mono">{formatDuration(stats.averageRenderTime)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-mono">{formatDuration(stats.totalRenderTime)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Mais Lento</div>
                        <div className="font-mono text-red-500">
                          {stats.slowestRender ? formatDuration(stats.slowestRender.actualDuration) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Mais Rápido</div>
                        <div className="font-mono text-green-500">
                          {stats.fastestRender ? formatDuration(stats.fastestRender.actualDuration) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Por Fase</div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <Badge variant="outline">Mount: {stats.rendersByPhase.mount}</Badge>
                        <Badge variant="outline">Update: {stats.rendersByPhase.update}</Badge>
                        <Badge variant="outline">Nested: {stats.rendersByPhase.nestedUpdate}</Badge>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="distribution" className="space-y-2 mt-2">
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.renderTimeDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>

                {exportData && (
                  <div className="flex gap-1 mt-2">
                    <Button variant="outline" size="sm" onClick={handleExportData} className="flex-1 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearData} className="flex-1 text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );

  return ProfilerComponent;
};

// Higher-order component for easy integration
export function withReactProfiler<P extends object>(
  Component: React.ComponentType<P>,
  profilerId?: string,
  options?: Omit<ReactProfilerWrapperProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ReactProfilerWrapper id={profilerId || Component.displayName || Component.name} {...options}>
      <Component {...props} />
    </ReactProfilerWrapper>
  );

  WrappedComponent.displayName = `withReactProfiler(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Custom hook for accessing profiler data
export const useReactProfiler = (profilerId?: string) => {
  const [data, setData] = useState<ProfilerData[]>([]);
  const [stats, setStats] = useState<ProfilerStats | null>(null);

  // This would need to be implemented with a context or global state management
  // For now, returning mock data structure
  return {
    data,
    stats,
    clearData: () => setData([]),
    exportData: () => {
      const exportObj = { data, stats, timestamp: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profiler-data-${profilerId || 'default'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
};

export default ReactProfilerWrapper;