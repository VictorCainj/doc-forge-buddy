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
      primary: 'bg-neutral-900 hover:bg-neutral-800 text-white',
      secondary: 'bg-neutral-600 hover:bg-neutral-700 text-white',
      success: 'bg-neutral-600 hover:bg-neutral-700 text-white',
      danger: 'bg-neutral-700 hover:bg-neutral-800 text-white',
      warning: 'bg-neutral-600 hover:bg-neutral-700 text-white',
      ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200',
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
