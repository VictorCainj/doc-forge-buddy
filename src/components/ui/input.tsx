import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Design minimalista com bordas suaves e transições
          'flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2',
          'text-sm text-neutral-900 placeholder:text-neutral-400',
          'transition-all duration-200',
          // Estados de foco com cor primária sutil
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          // Estados hover
          'hover:border-neutral-400',
          // Estados desabilitados
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
          // Estilos para input file
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-700',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
