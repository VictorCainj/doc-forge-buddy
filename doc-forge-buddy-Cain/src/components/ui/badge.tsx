import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        // Badges neutros minimalistas
        default: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
        secondary: 'bg-neutral-50 text-neutral-600 border border-neutral-200',
        outline: 'border border-neutral-300 text-neutral-700 bg-transparent',

        // Estados semânticos com cores suaves
        success: 'bg-success-50 text-success-700 border border-success-200',
        warning: 'bg-warning-50 text-warning-700 border border-warning-200',
        error: 'bg-error-50 text-error-700 border border-error-200',
        info: 'bg-info-50 text-info-700 border border-info-200',

        // Variante primária sutil
        primary: 'bg-primary-50 text-primary-700 border border-primary-200',

        // Variante ghost sem bordas
        ghost: 'bg-transparent text-neutral-600',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        default: 'px-2 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
