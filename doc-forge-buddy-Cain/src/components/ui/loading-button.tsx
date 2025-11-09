/**
 * Componente de botão com estado de loading
 * Elimina duplicação de lógica de loading em botões
 */

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from '@/utils/iconMapper';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    loading = false, 
    loadingText, 
    children, 
    disabled, 
    className,
    icon: Icon,
    ...props 
  }, ref) => {
    const isDisabled = loading || disabled;
    const displayText = loading && loadingText ? loadingText : children;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(className)}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {displayText}
          </>
        ) : (
          <>
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {children}
          </>
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

/**
 * Variantes específicas do LoadingButton
 */

export const SaveButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="default"
    loadingText="Salvando..."
    {...props}
  />
);

export const SubmitButton: React.FC<Omit<LoadingButtonProps, 'variant' | 'type'>> = (props) => (
  <LoadingButton
    type="submit"
    variant="default"
    loadingText="Enviando..."
    {...props}
  />
);

export const DeleteButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="destructive"
    loadingText="Removendo..."
    {...props}
  />
);

export const UpdateButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="default"
    loadingText="Atualizando..."
    {...props}
  />
);

export const CreateButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="default"
    loadingText="Criando..."
    {...props}
  />
);

export const RefreshButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="outline"
    loadingText="Atualizando..."
    {...props}
  />
);

export const UploadButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="default"
    loadingText="Enviando..."
    {...props}
  />
);

export const DownloadButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="outline"
    loadingText="Baixando..."
    {...props}
  />
);

export const PrintButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="outline"
    loadingText="Imprimindo..."
    {...props}
  />
);

export const SearchButton: React.FC<Omit<LoadingButtonProps, 'variant'>> = (props) => (
  <LoadingButton
    variant="outline"
    loadingText="Buscando..."
    {...props}
  />
);
