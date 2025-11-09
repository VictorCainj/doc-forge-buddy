import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from '@/utils/iconMapper';
import { AppIcon } from '@/types/icons';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: AppIcon;
  trend?: {
    value: number;
    period: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status = 'info',
  className,
  onClick,
}: MetricCardProps) => {
  const getStatusColors = () => {
    switch (status) {
      case 'success':
        return 'from-success-500 to-success-600';
      case 'warning':
        return 'from-warning-500 to-warning-600';
      case 'error':
        return 'from-destructive to-destructive/80';
      default:
        return 'from-primary to-primary/80';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-success-200';
    if (trend.value < 0) return 'text-error-200';
    return 'text-neutral-200';
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card
      className={cn(
        'metric-card bg-gradient-to-br text-white border-0 shadow-card transition-all duration-200 hover:shadow-soft',
        getStatusColors(),
        onClick && 'cursor-pointer hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold mb-1">
              {typeof value === 'number'
                ? value.toLocaleString('pt-BR')
                : value}
            </p>
            {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
            {trend && TrendIcon && (
              <div className="flex items-center mt-2">
                <TrendIcon className={cn('h-4 w-4 mr-1', getTrendColor())} />
                <span className={cn('text-sm font-medium', getTrendColor())}>
                  {trend.value > 0 ? '+' : ''}
                  {trend.value.toFixed(1)}%
                </span>
                <span className="text-white/60 text-xs ml-1">
                  {trend.period}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-white/20 rounded-full">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
