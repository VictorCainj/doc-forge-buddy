import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Input acessível com label e mensagens de erro
 */
export interface AccessibleInputProps extends React.ComponentProps<typeof Input> {
  /**
   * Label do input (obrigatório para acessibilidade)
   */
  label: string;

  /**
   * Mensagem de erro a ser exibida
   */
  error?: string;

  /**
   * Texto de ajuda/descrição do campo
   */
  helperText?: string;

  /**
   * Se true, oculta o label visualmente mas mantém para leitores de tela
   */
  hideLabel?: boolean;

  /**
   * Indica se o campo é obrigatório
   */
  required?: boolean;

  /**
   * Container className
   */
  containerClassName?: string;
}

/**
 * Input com acessibilidade completa
 * Sempre inclui label associado e suporte a mensagens de erro
 *
 * @example
 * ```tsx
 * <AccessibleInput
 *   label="Email"
 *   type="email"
 *   required
 *   error={errors.email}
 *   helperText="Digite seu email corporativo"
 * />
 *
 * <AccessibleInput
 *   label="Pesquisar"
 *   hideLabel
 *   placeholder="Buscar documentos..."
 * />
 * ```
 */
export const AccessibleInput = React.forwardRef<
  HTMLInputElement,
  AccessibleInputProps
>(
  (
    {
      label,
      error,
      helperText,
      hideLabel = false,
      required = false,
      containerClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);
    const hasHelper = Boolean(helperText);

    const ariaDescribedby = [hasError && errorId, hasHelper && helperId]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={inputId} className={cn(hideLabel && 'sr-only')}>
          {label}
          {required && (
            <span className="text-error-500 ml-1" aria-label="obrigatório">
              *
            </span>
          )}
        </Label>

        <Input
          ref={ref}
          id={inputId}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedby || undefined}
          className={cn(
            hasError && 'border-error-500 focus-visible:ring-error-500',
            className
          )}
          {...props}
        />

        {hasHelper && !hasError && (
          <p id={helperId} className="text-sm text-neutral-500" role="status">
            {helperText}
          </p>
        )}

        {hasError && (
          <p
            id={errorId}
            className="text-sm text-error-600 font-medium"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
