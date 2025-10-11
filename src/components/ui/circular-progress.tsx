import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export const CircularProgress = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  label,
  color = 'blue',
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / max) * circumference;

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'stroke-green-500';
      case 'yellow':
        return 'stroke-yellow-500';
      case 'red':
        return 'stroke-red-500';
      case 'purple':
        return 'stroke-purple-500';
      default:
        return 'stroke-blue-500';
    }
  };

  const getBackgroundColor = () => {
    switch (color) {
      case 'green':
        return 'stroke-green-200';
      case 'yellow':
        return 'stroke-yellow-200';
      case 'red':
        return 'stroke-red-200';
      case 'purple':
        return 'stroke-purple-200';
      default:
        return 'stroke-blue-200';
    }
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className={cn('opacity-20', getBackgroundColor())}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              'transition-all duration-500 ease-in-out',
              getColorClasses()
            )}
            strokeLinecap="round"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">
                {value.toFixed(0)}%
              </div>
              {label && (
                <div className="text-xs text-neutral-500 mt-1">{label}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
