import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Minimalista: fundo sólido neutro
        default: 'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-700 shadow-sm hover:shadow-md',
        // Destrutivo suave
        destructive: 'bg-error-500 text-white hover:bg-error-700 focus-visible:ring-error-500 shadow-sm hover:shadow-md',
        // Outline minimalista
        outline: 'border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 focus-visible:ring-primary-500/20',
        // Secundário com fundo suave
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-500',
        // Ghost sem bordas
        ghost: 'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900',
        // Link simples
        link: 'text-neutral-900 underline-offset-4 hover:underline hover:text-neutral-700',
        // Novo: Primary com cor de acento
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 shadow-sm hover:shadow-md',
        // Novo: Subtle para ações secundárias
        subtle: 'bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-500/20',
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-md',
        sm: 'h-9 px-3 text-sm rounded-md',
        default: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-12 px-6 text-base rounded-lg',
        xl: 'h-14 px-8 text-base rounded-lg',
        icon: 'h-10 w-10 rounded-md',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-lg',
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
