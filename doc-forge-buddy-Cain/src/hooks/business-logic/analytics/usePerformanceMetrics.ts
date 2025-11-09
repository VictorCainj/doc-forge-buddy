import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';

// Tipos para métricas de performance
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'percentage' | 'count' | 'score';
  category: MetricCategory;
  timestamp: Date;
  metadata: MetricMetadata;
  threshold?: MetricThreshold;
  trend: TrendDirection;
}

export type MetricCategory = 
  | 'web_vitals'
  | 'load_time'
  | 'network'
  | 'memory'
  | 'cpu'
  | 'rendering'
  | 'interaction'
  | 'api'
  | 'database'
  | 'bundle_size'
  | 'error_rate'
  | 'availability';

export type TrendDirection = 'improving' | 'degrading' | 'stable' | 'unknown';

export interface MetricMetadata {
  page?: string;
  route?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  connectionType?: 'wifi' | '4g' | '3g' | '2g' | 'offline';
  location?: string;
  customFields?: Record<string, any>;
}

export interface MetricThreshold {
  good: number;
  poor: number;
  unit: 'ms' | 'bytes' | 'percentage' | 'count' | 'score';
  operator: 'less_than' | 'greater_than' | 'between' | 'equals';
  description?: string;
}

export interface WebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp?: number | null; // Interaction to Next Paint (substitui FID)
  loadTime: number;
  domContentLoaded: number;
  timeToInteractive: number;
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  category: MetricCategory;
  target?: number;
  isGood: boolean;
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  metricId: string;
  metricName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  metadata: AlertMetadata;
}

export interface AlertMetadata {
  page?: string;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

export interface PerformanceReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: ReportSummary;
  metrics: ReportMetrics;
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlert[];
  trends: MetricTrend[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ReportSummary {
  overallScore: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  totalMetrics: number;
  goodMetrics: number;
  poorMetrics: number;
  criticalAlerts: number;
  uptime: number;
  errorRate: number;
  avgLoadTime: number;
}

export interface ReportMetrics {
  webVitals: {
    average: Partial<WebVitals>;
    distribution: Record<string, number[]>;
    percentile: Record<string, { p50: number; p75: number; p90: number; p95: number; p99: number }>;
  };
  loadTime: {
    average: number;
    distribution: number[];
    breakdown: {
      dns: number;
      tcp: number;
      request: number;
      response: number;
      processing: number;
      rendering: number;
    };
  };
  network: {
    averageLatency: number;
    throughput: number;
    errorRate: number;
    retryRate: number;
  };
  custom: CustomMetric[];
}

export interface PerformanceRecommendation {
  id: string;
  category: MetricCategory;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  actions: RecommendationAction[];
  estimatedImprovement?: string;
  resources?: string[];
}

export interface RecommendationAction {
  title: string;
  description: string;
  type: 'code' | 'config' | 'infrastructure' | 'process';
  effort: 'low' | 'medium' | 'high';
  resources: string[];
  codeExample?: string;
}

export interface MetricTrend {
  metricId: string;
  metricName: string;
  direction: TrendDirection;
  change: number;
  changePercentage: number;
  currentValue: number;
  previousValue: number;
  period: string;
  confidence: number;
}

export interface PerformanceFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  pages?: string[];
  devices?: string[];
  categories?: MetricCategory[];
  metrics?: string[];
  threshold?: 'all' | 'good' | 'poor' | 'critical';
  includeAlerts?: boolean;
}

export function usePerformanceMetrics() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados locais
  const [filters, setFilters] = useState<PerformanceFilters>({
    dateRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
      end: new Date()
    },
    threshold: 'all',
    includeAlerts: true
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetric[]>([]);
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Query para métricas históricas
  const {
    data: historicalMetrics,
    isLoading: metricsLoading,
    error: metricsError
  } = useQuery({
    queryKey: ['performance-metrics', filters],
    queryFn: async (): Promise<PerformanceMetric[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockMetrics();
    },
    refetchInterval: 30000
  });

  // Query para web vitals atuais
  const {
    data: webVitals,
    isLoading: vitalsLoading
  } = useQuery({
    queryKey: ['web-vitals'],
    queryFn: async (): Promise<WebVitals> => {
      return await measureWebVitals();
    },
    refetchInterval: 5000
  });

  // Query para alertas ativos
  const {
    data: activeAlerts,
    isLoading: alertsLoading
  } = useQuery({
    queryKey: ['performance-alerts', filters],
    queryFn: async (): Promise<PerformanceAlert[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 200));
      return generateMockAlerts();
    },
    refetchInterval: 10000,
    enabled: filters.includeAlerts
  });

  // Mutação para gerar relatório
  const generateReportMutation = useMutation({
    mutationFn: async (options: {
      period: { start: Date; end: Date };
      includeRecommendations: boolean;
      format: 'json' | 'pdf' | 'csv';
    }) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const report: PerformanceReport = {
        id: `report-${Date.now()}`,
        period: options.period,
        summary: {
          overallScore: 87,
          status: 'good',
          totalMetrics: 25,
          goodMetrics: 20,
          poorMetrics: 4,
          criticalAlerts: 1,
          uptime: 99.7,
          errorRate: 0.3,
          avgLoadTime: 1200
        },
        metrics: {
          webVitals: {
            average: {
              lcp: 1200,
              fid: 80,
              cls: 0.1,
              fcp: 900,
              ttfb: 200,
              loadTime: 2100,
              domContentLoaded: 1500,
              timeToInteractive: 1800
            },
            distribution: {},
            percentile: {}
          },
          loadTime: {
            average: 1200,
            distribution: [],
            breakdown: {
              dns: 50,
              tcp: 100,
              request: 200,
              response: 300,
              processing: 400,
              rendering: 150
            }
          },
          network: {
            averageLatency: 120,
            throughput: 85,
            errorRate: 0.2,
            retryRate: 0.1
          },
          custom: []
        },
        recommendations: generateMockRecommendations(),
        alerts: activeAlerts || [],
        trends: [],
        generatedAt: new Date(),
        generatedBy: user?.id || 'system'
      };
      
      return report;
    },
    onSuccess: (report) => {
      toast({
        title: 'Relatório gerado',
        description: `Relatório de performance gerado com sucesso`,
      });
    }
  });

  // Medir Web Vitals
  const measureWebVitals = useCallback(async (): Promise<WebVitals> => {
    const vitals: Partial<WebVitals> = {};

    try {
      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          vitals.lcp = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // FID (First Input Delay) - ou INP
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            vitals.fid = entry.processingStart - entry.startTime;
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
      }

      // CLS (Cumulative Layout Shift)
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          let cls = 0;
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
          vitals.cls = cls;
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      }

      // FCP (First Contentful Paint)
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }

      // TTFB (Time to First Byte)
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
      }

      // Tempos de carregamento
      vitals.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      vitals.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      
      // TTI (Time to Interactive) - aproximado
      vitals.timeToInteractive = vitals.loadTime + 500; // Adicionar tempo estimado

    } catch (error) {
      console.warn('Erro ao medir Web Vitals:', error);
    }

    return vitals as WebVitals;
  }, []);

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);

    // Configurar observers de performance
    if ('PerformanceObserver' in window) {
      // Observer para métricas customizadas
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const metric = createMetricFromEntry(entry);
          if (metric) {
            setCurrentMetrics(prev => [...prev, metric]);
          }
        });
      });
      
      observerRef.current.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }

    // Medir performance periodicamente
    const interval = setInterval(() => {
      collectPerformanceMetrics();
    }, 10000); // A cada 10 segundos

    return () => {
      clearInterval(interval);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isMonitoring]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Coletar métricas de performance
  const collectPerformanceMetrics = useCallback(async () => {
    const metrics: PerformanceMetric[] = [];

    // Métricas de navegação
    if (performance.getEntriesByType('navigation').length > 0) {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      metrics.push(
        {
          id: `load-time-${Date.now()}`,
          name: 'Page Load Time',
          value: nav.loadEventEnd - nav.fetchStart,
          unit: 'ms',
          category: 'load_time',
          timestamp: new Date(),
          metadata: {
            page: window.location.pathname,
            userAgent: navigator.userAgent
          },
          trend: 'stable'
        },
        {
          id: `dom-content-loaded-${Date.now()}`,
          name: 'DOM Content Loaded',
          value: nav.domContentLoadedEventEnd - nav.fetchStart,
          unit: 'ms',
          category: 'load_time',
          timestamp: new Date(),
          metadata: {
            page: window.location.pathname
          },
          trend: 'stable'
        }
      );
    }

    // Métricas de recursos
    const resources = performance.getEntriesByType('resource');
    if (resources.length > 0) {
      const totalSize = resources.reduce((sum, resource: any) => {
        return sum + (resource.transferSize || 0);
      }, 0);

      metrics.push({
        id: `resource-size-${Date.now()}`,
        name: 'Total Resource Size',
        value: totalSize,
        unit: 'bytes',
        category: 'bundle_size',
        timestamp: new Date(),
        metadata: {
          page: window.location.pathname
        },
        trend: 'stable'
      });
    }

    // Métricas de memória (se disponíveis)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.push({
        id: `memory-usage-${Date.now()}`,
        name: 'Memory Usage',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        category: 'memory',
        timestamp: new Date(),
        metadata: {
          page: window.location.pathname
        },
        trend: 'stable',
        threshold: {
          good: 50 * 1024 * 1024, // 50MB
          poor: 100 * 1024 * 1024, // 100MB
          unit: 'bytes',
          operator: 'less_than',
          description: 'Memória usada pelo JavaScript'
        }
      });
    }

    setCurrentMetrics(prev => [...prev, ...metrics]);
  }, []);

  // Verificar thresholds
  const checkThresholds = useCallback((metrics: PerformanceMetric[]) => {
    const newAlerts: PerformanceAlert[] = [];

    metrics.forEach(metric => {
      if (!metric.threshold) return;

      const { threshold } = metric;
      let isViolated = false;
      let message = '';

      switch (threshold.operator) {
        case 'less_than':
          isViolated = metric.value > threshold.poor;
          message = `${metric.name} está acima do limite (${metric.value}${metric.unit} > ${threshold.poor}${threshold.unit})`;
          break;
        case 'greater_than':
          isViolated = metric.value < threshold.good;
          message = `${metric.name} está abaixo do limite (${metric.value}${metric.unit} < ${threshold.good}${threshold.unit})`;
          break;
        // Adicionar outros operadores conforme necessário
      }

      if (isViolated) {
        const severity = determineSeverity(metric.value, threshold);
        const existingAlert = alerts.find(a => a.metricId === metric.id && !a.isResolved);

        if (!existingAlert) {
          newAlerts.push({
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            metricId: metric.id,
            metricName: metric.name,
            severity,
            message,
            value: metric.value,
            threshold: threshold.poor,
            timestamp: new Date(),
            isResolved: false,
            metadata: {
              page: metric.metadata.page,
              userId: user?.id,
              url: window.location.href
            }
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
      
      // Notificar sobre alertas críticos
      const criticalAlerts = newAlerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0 && toast) {
        toast({
          title: 'Alerta de Performance',
          description: `${criticalAlerts.length} alerta(s) crítico(s) detectado(s)`,
          variant: 'destructive'
        });
      }
    }
  }, [alerts, user, toast]);

  // Resolver alerta
  const resolveAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isResolved: true, resolvedAt: new Date() }
        : alert
    ));
  }, []);

  // Reconhecer alerta
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledgedBy: user?.id || 'system' }
        : alert
    ));
  }, [user]);

  // Gerar relatório
  const generateReport = useCallback(async (options: {
    period: { start: Date; end: Date };
    includeRecommendations?: boolean;
    format?: 'json' | 'pdf' | 'csv';
  }) => {
    await generateReportMutation.mutateAsync({
      period: options.period,
      includeRecommendations: options.includeRecommendations ?? true,
      format: options.format ?? 'json'
    });
  }, [generateReportMutation]);

  // Filtrar métricas
  const filteredMetrics = useMemo(() => {
    if (!historicalMetrics) return [];

    return historicalMetrics.filter(metric => {
      // Filtro por data
      if (filters.dateRange) {
        if (metric.timestamp < filters.dateRange.start || metric.timestamp > filters.dateRange.end) {
          return false;
        }
      }

      // Filtro por páginas
      if (filters.pages?.length && metric.metadata.page) {
        if (!filters.pages.includes(metric.metadata.page)) {
          return false;
        }
      }

      // Filtro por categorias
      if (filters.categories?.length && !filters.categories.includes(metric.category)) {
        return false;
      }

      // Filtro por threshold
      if (filters.threshold && filters.threshold !== 'all') {
        const isGood = isMetricGood(metric);
        if (filters.threshold === 'good' && !isGood) return false;
        if (filters.threshold === 'poor' && isGood) return false;
        if (filters.threshold === 'critical' && !isMetricCritical(metric)) return false;
      }

      return true;
    });
  }, [historicalMetrics, filters]);

  // Calcular tendências
  const trends = useMemo(() => {
    if (!filteredMetrics.length) return [];

    const groupedMetrics = filteredMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    return Object.entries(groupedMetrics).map(([name, metrics]) => {
      const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const latest = sortedMetrics[sortedMetrics.length - 1];
      const previous = sortedMetrics[sortedMetrics.length - 2];

      if (!previous) return null;

      const change = latest.value - previous.value;
      const changePercentage = (change / previous.value) * 100;

      return {
        metricId: latest.id,
        metricName: name,
        direction: Math.abs(changePercentage) < 5 ? 'stable' : change > 0 ? 'improving' : 'degrading',
        change,
        changePercentage,
        currentValue: latest.value,
        previousValue: previous.value,
        period: '24h',
        confidence: 0.8
      } as MetricTrend;
    }).filter(Boolean) as MetricTrend[];
  }, [filteredMetrics]);

  // Efeito para verificar thresholds quando novas métricas são coletadas
  useEffect(() => {
    if (currentMetrics.length > 0) {
      checkThresholds(currentMetrics);
    }
  }, [currentMetrics, checkThresholds]);

  // Iniciar monitoramento automaticamente
  useEffect(() => {
    if (!isMonitoring) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  return {
    // Estado
    webVitals: webVitals || null,
    currentMetrics,
    historicalMetrics: filteredMetrics,
    alerts: alerts.filter(a => !a.isResolved),
    trends,
    isMonitoring,
    isLoading: metricsLoading || vitalsLoading || alertsLoading,
    error: metricsError,

    // Ações
    startMonitoring,
    stopMonitoring,
    collectPerformanceMetrics,
    resolveAlert,
    acknowledgeAlert,
    generateReport,

    // Filtros
    filters,
    setFilters: (newFilters: Partial<PerformanceFilters>) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    },

    // Utilitários
    getMetricsByCategory: (category: MetricCategory) => 
      filteredMetrics.filter(m => m.category === category),
    getAlertsBySeverity: (severity: PerformanceAlert['severity']) => 
      alerts.filter(a => a.severity === severity),
    getMetricByName: (name: string) => 
      filteredMetrics.find(m => m.name === name),
    isMetricGood: (metric: PerformanceMetric) => isMetricGood(metric),
    isMetricCritical: (metric: PerformanceMetric) => isMetricCritical(metric),
    getOverallScore: () => {
      if (!filteredMetrics.length) return 0;
      const goodMetrics = filteredMetrics.filter(m => isMetricGood(m)).length;
      return Math.round((goodMetrics / filteredMetrics.length) * 100);
    }
  };
}

// Funções auxiliares
function createMetricFromEntry(entry: PerformanceEntry): PerformanceMetric | null {
  switch (entry.entryType) {
    case 'navigation':
      const nav = entry as PerformanceNavigationTiming;
      return {
        id: `nav-${Date.now()}`,
        name: 'Navigation Time',
        value: nav.loadEventEnd - nav.fetchStart,
        unit: 'ms',
        category: 'load_time',
        timestamp: new Date(),
        metadata: {
          page: window.location.pathname
        },
        trend: 'stable'
      };
    
    case 'resource':
      const resource = entry as PerformanceResourceTiming;
      return {
        id: `resource-${Date.now()}`,
        name: 'Resource Load Time',
        value: resource.responseEnd - resource.startTime,
        unit: 'ms',
        category: 'load_time',
        timestamp: new Date(),
        metadata: {
          page: window.location.pathname
        },
        trend: 'stable'
      };
    
    default:
      return null;
  }
}

function determineSeverity(
  value: number, 
  threshold: MetricThreshold
): PerformanceAlert['severity'] {
  switch (threshold.operator) {
    case 'less_than':
      if (value > threshold.poor * 2) return 'critical';
      if (value > threshold.poor * 1.5) return 'high';
      if (value > threshold.poor) return 'medium';
      return 'low';
    
    case 'greater_than':
      if (value < threshold.good * 0.5) return 'critical';
      if (value < threshold.good * 0.7) return 'high';
      if (value < threshold.good) return 'medium';
      return 'low';
    
    default:
      return 'medium';
  }
}

function isMetricGood(metric: PerformanceMetric): boolean {
  if (!metric.threshold) return true;

  const { threshold } = metric;
  switch (threshold.operator) {
    case 'less_than':
      return metric.value <= threshold.good;
    case 'greater_than':
      return metric.value >= threshold.good;
    default:
      return true;
  }
}

function isMetricCritical(metric: PerformanceMetric): boolean {
  if (!metric.threshold) return false;

  const { threshold } = metric;
  const severity = determineSeverity(metric.value, threshold);
  return severity === 'critical';
}

function generateMockMetrics(): PerformanceMetric[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `metric-${i + 1}`,
    name: `Metric ${i + 1}`,
    value: Math.random() * 2000 + 100,
    unit: 'ms',
    category: 'load_time',
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    metadata: {
      page: '/dashboard',
      deviceType: Math.random() > 0.5 ? 'desktop' : 'mobile'
    },
    trend: ['improving', 'degrading', 'stable'][Math.floor(Math.random() * 3)] as TrendDirection,
    threshold: {
      good: 1000,
      poor: 2000,
      unit: 'ms',
      operator: 'less_than'
    }
  }));
}

function generateMockAlerts(): PerformanceAlert[] {
  return Array.from({ length: 3 }, (_, i) => ({
    id: `alert-${i + 1}`,
    metricId: `metric-${i + 1}`,
    metricName: `Métrica ${i + 1}`,
    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
    message: `Alerta de performance detectado para métrica ${i + 1}`,
    value: Math.random() * 3000 + 1000,
    threshold: 2000,
    timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
    isResolved: false,
    metadata: {
      page: '/dashboard',
      url: window.location.href
    }
  }));
}

function generateMockRecommendations(): PerformanceRecommendation[] {
  return [
    {
      id: 'rec-1',
      category: 'load_time',
      priority: 'high',
      title: 'Otimizar carregamento de recursos',
      description: 'O tempo de carregamento da página pode ser melhorado otimizando recursos',
      impact: 'high',
      effort: 'medium',
      actions: [
        {
          title: 'Minificar CSS/JS',
          description: 'Minificar arquivos CSS e JavaScript',
          type: 'code',
          effort: 'low',
          resources: ['Build tools', 'Terser', 'CleanCSS']
        }
      ],
      estimatedImprovement: 'Redução de 20-30% no tempo de carregamento'
    }
  ];
}