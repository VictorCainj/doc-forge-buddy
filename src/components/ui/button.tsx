import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Google Material: Azul primário
        default:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500/50 shadow-elevation-1 hover:shadow-elevation-2',
        // Destrutivo Google: Vermelho
        destructive:
          'bg-error-500 text-white hover:bg-error-600 focus-visible:ring-error-500/50 shadow-elevation-1 hover:shadow-elevation-2',
        // Outline Material: Borda azul sutil
        outline:
          'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-primary-500 focus-visible:ring-primary-500/30',
        // Secundário: Cinza claro
        secondary:
          'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-500/50',
        // Ghost: Sem fundo, hover sutil
        ghost: 'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900',
        // Link: Azul Google
        link: 'text-primary-600 underline-offset-4 hover:underline hover:text-primary-700',
        // Primary explícito: Azul Google
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500/50 shadow-elevation-1 hover:shadow-elevation-2',
        // Subtle: Fundo azul muito claro
        subtle:
          'bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-500/30',
        // Success: Verde Google
        success:
          'bg-success-500 text-white hover:bg-success-600 focus-visible:ring-success-500/50 shadow-elevation-1 hover:shadow-elevation-2',
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-lg',
        sm: 'h-9 px-3 text-sm rounded-lg',
        default: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-base rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-lg',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
