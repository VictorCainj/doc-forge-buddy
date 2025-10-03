/**
 * Componente Button Acessível
 * Implementa todas as diretrizes WCAG para botões
 */

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AccessibleButtonProps extends ButtonProps {
  /** Rótulo acessível obrigatório para screen readers */
  'aria-label': string;
  /** Descrição adicional do botão */
  'aria-describedby'?: string;
  /** Estado expandido para botões de toggle */
  'aria-expanded'?: boolean;
  /** Indica se o botão controla outro elemento */
  'aria-controls'?: string;
  /** Indica se o botão está pressionado (para toggle buttons) */
  'aria-pressed'?: boolean;
  /** Tecla de atalho */
  accessKey?: string;
  /** Tooltip acessível */
  title?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    children, 
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-pressed': ariaPressed,
    accessKey,
    title,
    onKeyDown,
    ...props 
  }, ref) => {
    // ✅ Manipulador de teclado para acessibilidade
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Enter e Space ativam o botão (comportamento padrão)
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.currentTarget.click();
      }
      
      // Escape para fechar modais/dropdowns
      if (event.key === 'Escape' && ariaExpanded) {
        event.preventDefault();
        // Lógica para fechar será implementada pelo componente pai
      }
      
      onKeyDown?.(event);
    };

    return (
      <Button
        ref={ref}
        className={cn(
          // ✅ Estilos de foco acessíveis
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // ✅ Indicador visual claro para foco
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          // ✅ Contraste adequado para estados
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-pressed={ariaPressed}
        accessKey={accessKey}
        title={title}
        onKeyDown={handleKeyDown}
        // ✅ Role explícito para clareza
        role="button"
        // ✅ Tabindex apropriado
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
