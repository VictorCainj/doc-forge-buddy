import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconOnly?: boolean;
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ icon: Icon, label, variant = 'ghost', size = 'md', loading, iconOnly, className, ...props }, ref) => {
    const variantStyles = {
      primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0',
      secondary: 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600',
      success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
      danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
      warning: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600',
      ghost: 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-500',
    };

    const sizeStyles = {
      sm: iconOnly ? 'h-8 w-8 p-0' : 'h-8 px-3 text-xs',
      md: iconOnly ? 'h-9 w-9 p-0' : 'h-9 px-4 text-sm',
      lg: iconOnly ? 'h-10 w-10 p-0' : 'h-10 px-5 text-base',
    };

    const iconSizes = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'rounded-lg transition-all duration-200 shadow-sm hover:shadow-md',
          variantStyles[variant],
          sizeStyles[size],
          loading && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', iconSizes[size])} />
        ) : (
          <>
            <Icon className={cn(iconSizes[size], !iconOnly && label && 'mr-2')} />
            {!iconOnly && label && <span>{label}</span>}
          </>
        )}
      </Button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

export { ActionButton };
