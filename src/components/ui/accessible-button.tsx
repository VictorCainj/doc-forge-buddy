import * as React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Botão acessível com suporte completo a ARIA
 * Estende o Button base com atributos de acessibilidade
 */
export interface AccessibleButtonProps extends ButtonProps {
  /**
   * Label acessível para leitores de tela
   * Obrigatório se o botão não tiver texto visível
   */
  'aria-label'?: string;

  /**
   * Descrição detalhada do botão
   */
  'aria-describedby'?: string;

  /**
   * Indica se o botão está em estado de loading
   */
  isLoading?: boolean;

  /**
   * Texto alternativo durante loading
   */
  loadingText?: string;

  /**
   * Indica se o botão controla um elemento expandível
   */
  'aria-expanded'?: boolean;

  /**
   * ID do elemento controlado por este botão
   */
  'aria-controls'?: string;

  /**
   * Indica se o elemento está pressionado (para toggles)
   */
  'aria-pressed'?: boolean;

  /**
   * Indica se há um popup associado
   */
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

/**
 * Botão com acessibilidade completa
 *
 * @example
 * ```tsx
 * // Botão com ícone apenas
 * <AccessibleButton aria-label="Fechar modal" onClick={onClose}>
 *   <X />
 * </AccessibleButton>
 *
 * // Botão com loading
 * <AccessibleButton isLoading={isLoading} loadingText="Salvando...">
 *   Salvar
 * </AccessibleButton>
 *
 * // Botão toggle
 * <AccessibleButton
 *   aria-pressed={isActive}
 *   onClick={() => setIsActive(!isActive)}
 * >
 *   {isActive ? 'Ativo' : 'Inativo'}
 * </AccessibleButton>
 * ```
 */
export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      disabled,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedby,
      'aria-expanded': ariaExpanded,
      'aria-controls': ariaControls,
      'aria-pressed': ariaPressed,
      'aria-haspopup': ariaHaspopup,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-pressed={ariaPressed}
        aria-haspopup={ariaHaspopup}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText || 'Carregando...'}</span>
          </>
        )}
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
