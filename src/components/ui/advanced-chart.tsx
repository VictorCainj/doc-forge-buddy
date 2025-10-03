import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Maximize2,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

interface AdvancedChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'line' | 'area' | 'pie';
  height?: number;
  showTrend?: boolean;
  trendValue?: number;
  trendPeriod?: string;
  className?: string;
  onDataPointClick?: (dataPoint: ChartDataPoint) => void;
  onExport?: () => void;
  onFilter?: () => void;
  onMaximize?: () => void;
}

export const AdvancedChart = ({
  title,
  subtitle,
  data,
  type = 'bar',
  height = 300,
  showTrend = false,
  trendValue,
  trendPeriod: _propTrendPeriod = 'vs mês anterior',
  className,
  onDataPointClick,
  onExport: _onExport,
  onFilter,
  onMaximize,
}: AdvancedChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);

  const getTrendIcon = () => {
    if (!trendValue) return null;
    if (trendValue > 0) return TrendingUp;
    if (trendValue < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trendValue && trendValue > 0) return 'text-green-500';
    if (trendValue && trendValue < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  // Removed useTrendAnalysis hook as it's not defined
  const TrendIcon = getTrendIcon();

  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full px-4 bg-muted/20 rounded-lg py-4 gap-2">
      {data.map((item, index) => {
        const heightPercentage = (item.value / maxValue) * 100;
        const isHovered = hoveredIndex === index;
        const barWidth = 40; // Largura fixa para todas as barras
        // Altura baseada no valor, sem altura mínima para valores 0
        const barHeight = item.value === 0 ? 4 : Math.max(heightPercentage, 8);

        return (
          <div
            key={index}
            className="flex flex-col items-center flex-1 group cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onDataPointClick?.(item)}
          >
            <div className="relative w-full flex justify-center">
              <div
                className={cn(
                  'rounded-t-lg transition-all duration-300 hover:scale-105 chart-bar relative',
                  item.color ||
                    'bg-gradient-to-t from-primary via-primary/90 to-primary/70',
                  isHovered && 'shadow-lg shadow-primary/25'
                )}
                style={{
                  height: `${barHeight}%`,
                  width: `${barWidth}px`,
                  minHeight: item.value === 0 ? '4px' : '16px',
                  boxShadow: isHovered
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : 'none',
                }}
                title={`${item.label}: ${item.value.toLocaleString('pt-BR')} contratos`}
              >
                {/* Valor dentro da barra quando hover */}
                {isHovered && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground drop-shadow-sm">
                      {item.value}
                    </span>
                  </div>
                )}

                {/* Tooltip no topo */}
                {isHovered && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-card text-foreground text-xs px-3 py-2 rounded-lg opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 border border-border shadow-lg">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-primary">
                      {item.value.toLocaleString('pt-BR')} contratos
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-3 font-medium text-center leading-tight">
              {item.label}
            </span>
            {/* Valor abaixo da barra */}
            <span className="text-xs text-muted-foreground mt-1 font-normal opacity-75">
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderLineChart = () => (
    <div className="h-full px-4 py-4">
      <svg width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.8"
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.1"
            />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <line
            key={percent}
            x1="0"
            y1={`${percent}%`}
            x2="100%"
            y2={`${percent}%`}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}

        {/* Line path */}
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={data
            .map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y =
                100 - ((item.value - minValue) / (maxValue - minValue)) * 100;
              return `${x}%,${y}%`;
            })
            .join(' ')}
        />

        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y =
            100 - ((item.value - minValue) / (maxValue - minValue)) * 100;
          const isHovered = hoveredIndex === index;

          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r={isHovered ? '6' : '4'}
              fill="hsl(var(--primary))"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onDataPointClick?.(item)}
            />
          );
        })}
      </svg>
    </div>
  );

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'area':
        return renderLineChart(); // Simplified for now
      case 'pie':
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Gráfico de Pizza em desenvolvimento
          </div>
        );
      default:
        return renderBarChart();
    }
  };

  return (
    <Card className={cn('metric-card shadow-card border-0', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                {title}
              </CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showTrend && trendValue !== undefined && TrendIcon && (
              <Badge
                variant="secondary"
                className={cn('flex items-center space-x-1', getTrendColor())}
              >
                <TrendIcon className="h-3 w-3" />
                <span>
                  {trendValue > 0 ? '+' : ''}
                  {trendValue.toFixed(1)}%
                </span>
              </Badge>
            )}
            <div className="flex space-x-1">
              {onFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFilter}
                  className="h-8 w-8 p-0"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}
              {/* Bloco de download removido */}
              {onMaximize && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMaximize}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>{renderChart()}</div>
      </CardContent>
    </Card>
  );
};
