/**
 * Componente Input Acessível
 * Implementa todas as diretrizes WCAG para campos de entrada
 */

import React, { forwardRef, useId } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export interface AccessibleInputProps extends Omit<InputProps, 'id'> {
  /** Label obrigatório para o input */
  label: string;
  /** Texto de ajuda/descrição */
  description?: string;
  /** Mensagem de erro */
  error?: string;
  /** Mensagem de sucesso */
  success?: string;
  /** Indica se o campo é obrigatório */
  required?: boolean;
  /** Ocultar label visualmente (mantém acessibilidade) */
  hideLabel?: boolean;
  /** ID customizado (opcional, será gerado automaticamente se não fornecido) */
  id?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    label,
    description,
    error,
    success,
    required = false,
    hideLabel = false,
    className,
    id: customId,
    'aria-describedby': ariaDescribedby,
    ...props 
  }, ref) => {
    // ✅ ID único gerado automaticamente
    const generatedId = useId();
    const inputId = customId || generatedId;
    
    // ✅ IDs para elementos relacionados
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const successId = success ? `${inputId}-success` : undefined;
    
    // ✅ Combinar todos os IDs para aria-describedby
    const describedBy = [
      ariaDescribedby,
      descriptionId,
      errorId,
      successId,
    ].filter(Boolean).join(' ') || undefined;

    // ✅ Estado do input baseado em erro/sucesso
    const inputState = error ? 'error' : success ? 'success' : 'default';

    return (
      <div className="space-y-2">
        {/* ✅ Label sempre associado ao input */}
        <Label 
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            hideLabel && 'sr-only', // Screen reader only
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </Label>

        {/* ✅ Descrição/ajuda */}
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            <Info className="inline h-3 w-3 mr-1" aria-hidden="true" />
            {description}
          </p>
        )}

        {/* ✅ Input com todos os atributos de acessibilidade */}
        <Input
          ref={ref}
          id={inputId}
          className={cn(
            // ✅ Estados visuais claros
            'transition-colors',
            inputState === 'error' && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            inputState === 'success' && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            // ✅ Foco visível
            'focus:ring-2 focus:ring-offset-2',
            className
          )}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
          {...props}
        />

        {/* ✅ Mensagem de erro */}
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-600 flex items-center"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* ✅ Mensagem de sucesso */}
        {success && (
          <p 
            id={successId}
            className="text-sm text-green-600 flex items-center"
            role="status"
            aria-live="polite"
          >
            <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
