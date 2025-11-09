import React, { Suspense, useState, useEffect } from 'react';
import { useLazyLoad, useLazyImport, useLoadingMetrics } from '@/hooks/useLazyLoad';
import { ChartSkeleton } from './SkeletonComponents';
import { cn } from '@/lib/utils';

// Lazy imports para Chart.js
const loadChartJS = () => import('chart.js').then(module => ({ default: module }));
const loadReactChartJS2 = () => import('react-chartjs-2').then(module => ({ default: module }));

interface LazyChartProps {
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'bubble' | 'scatter';
  data?: any;
  options?: any;
  className?: string;
  height?: string;
  showLegend?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
  enableAnnotations?: boolean;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

/**
 * Componente Chart.js com Lazy Loading Avançado
 * Suporte a múltiplos tipos de gráfico e configurações avançadas
 */
export function LazyAdvancedChart({
  type = 'bar',
  data,
  options = {},
  className,
  height = 'h-64',
  showLegend = true,
  onLoad,
  onError,
  fallback = <ChartSkeleton height={height} showLegend={showLegend} />,
  enableAnnotations = false,
  responsive = true,
  maintainAspectRatio = false,
}: LazyChartProps) {
  const [chartLib, setChartLib] = useState<any>(null);
  const [reactChartLib, setReactChartLib] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Hooks de lazy loading
  const { elementRef, isVisible } = useLazyLoad(0.1);
  const { metrics, startLoad, endLoad } = useLoadingMetrics();

  // Carregar dependências do Chart.js
  const loadChartDependencies = async () => {
    if (chartLib && reactChartLib) return;

    startLoad();
    setIsLoading(true);
    setError(null);

    try {
      // Carregar Chart.js e React-ChartJS-2
      const [chartModule, reactChartModule] = await Promise.all([
        loadChartJS(),
        loadReactChartJS2()
      ]);

      setChartLib(chartModule.default);
      setReactChartLib(reactChartModule.default);

      // Configurar Chart.js apenas uma vez
      if (!chartModule.default.registered) {
        const { Chart } = chartModule.default;
        Chart.register(
          Chart.CategoryScale,
          Chart.LinearScale,
          Chart.PointElement,
          Chart.LineElement,
          Chart.BarElement,
          Chart.ArcElement,
          Chart.RadialLinearScale,
          Chart.PolarAreaController,
          Chart.BubbleController,
          Chart.ScatterController,
          Chart.Title,
          Chart.Tooltip,
          Chart.Legend,
          Chart.Filler
        );
        chartModule.default.registered = true;
      }

      endLoad();
      onLoad?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar Chart.js');
      setError(error);
      endLoad();
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar quando visível
  useEffect(() => {
    if (isVisible) {
      loadChartDependencies();
    }
  }, [isVisible]);

  if (isLoading) {
    return (
      <div ref={elementRef} className={className}>
        {fallback}
        {metrics.loadDuration > 0 && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            📊 Carregando Chart.js em {metrics.loadDuration.toFixed(0)}ms
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div ref={elementRef} className={cn('p-4 border border-red-200 rounded-lg bg-red-50', className)}>
        <div className="text-center space-y-2">
          <div className="text-red-500 text-sm">📊 Erro ao carregar gráfico</div>
          <div className="text-red-400 text-xs">{error.message}</div>
          <button
            onClick={loadChartDependencies}
            className="text-sm text-red-600 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!chartLib || !reactChartLib) {
    return (
      <div ref={elementRef} className={className}>
        {fallback}
      </div>
    );
  }

  // Opções padrão com otimizações
  const defaultOptions = {
    responsive,
    maintainAspectRatio,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    ...options,
  };

  // Criar e renderizar o componente de gráfico
  const ChartComponent = reactChartLib[type];

  return (
    <div ref={elementRef} className={cn('relative', className)}>
      <div className={cn('relative', height)}>
        <ChartComponent 
          data={data} 
          options={defaultOptions}
          plugins={enableAnnotations ? [] : []}
        />
      </div>
      
      {metrics.loadDuration > 0 && (
        <div className="text-xs text-gray-500 mt-1 text-center">
          📊 {type} chart carregado em {metrics.loadDuration.toFixed(0)}ms
        </div>
      )}
    </div>
  );
}

/**
 * Componente simplificado para gráficos básicos
 */
export function LazyChart({
  type = 'bar',
  data,
  options,
  className,
  height = 'h-64',
  showLegend = true,
  onLoad,
  onError,
}: Omit<LazyChartProps, 'enableAnnotations' | 'responsive' | 'maintainAspectRatio'>) {
  return (
    <LazyAdvancedChart
      type={type}
      data={data}
      options={options}
      className={className}
      height={height}
      showLegend={showLegend}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

/**
 * Hook para pré-carregamento de gráficos
 */
export function usePreloadChart() {
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadChart = async () => {
    if (isPreloading) return;
    
    setIsPreloading(true);
    try {
      const startTime = performance.now();
      await Promise.all([
        loadChartJS(),
        loadReactChartJS2()
      ]);
      const loadTime = performance.now() - startTime;
      console.log(`📊 Chart.js pré-carregado em ${loadTime.toFixed(0)}ms`);
    } catch (error) {
      console.warn('Falha ao pré-carregar Chart.js:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  return { preloadChart, isPreloading };
}

/**
 * Componente para gráficos em lote (Dashboard)
 */
export function LazyChartBundle({
  charts,
  onAllLoad,
  onError,
  className,
}: {
  charts: Array<{
    id: string;
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    data: any;
    options?: any;
    className?: string;
    height?: string;
  }>;
  onAllLoad?: (loadedCharts: string[]) => void;
  onError?: (error: Error, chartId: string) => void;
  className?: string;
}) {
  const [loadedCharts, setLoadedCharts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { elementRef, isVisible } = useLazyLoad(0.1);

  useEffect(() => {
    if (isVisible) {
      setLoadedCharts([]);
      setIsLoading(true);
      
      // Simular carregamento em lote
      setTimeout(() => {
        setLoadedCharts(charts.map(chart => chart.id));
        setIsLoading(false);
        onAllLoad?.(charts.map(chart => chart.id));
      }, 1000);
    }
  }, [isVisible, charts, onAllLoad]);

  if (isLoading) {
    return (
      <div ref={elementRef} className={cn('grid gap-6', className)}>
        {charts.map(chart => (
          <div key={chart.id} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
            <ChartSkeleton height={chart.height || 'h-64'} showLegend={true} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={elementRef} className={cn('grid gap-6', className)}>
      {charts.map(chart => (
        <div key={chart.id} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <LazyChart
            type={chart.type}
            data={chart.data}
            options={chart.options}
            className={chart.className}
            height={chart.height}
          />
        </div>
      ))}
    </div>
  );
}