/**
 * Componente Image Acessível
 * Implementa diretrizes WCAG para imagens
 */

import React, { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff, Loader2 } from 'lucide-react';

export interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Texto alternativo obrigatório */
  alt: string;
  /** Indica se a imagem é decorativa (alt será vazio) */
  decorative?: boolean;
  /** Descrição longa da imagem (para imagens complexas) */
  longDescription?: string;
  /** ID do elemento que contém a descrição longa */
  'aria-describedby'?: string;
  /** Fallback quando a imagem não carrega */
  fallback?: React.ReactNode;
  /** Mostrar loading state */
  showLoading?: boolean;
}

export const AccessibleImage = forwardRef<HTMLImageElement, AccessibleImageProps>(
  ({ 
    alt,
    decorative = false,
    longDescription,
    'aria-describedby': ariaDescribedby,
    fallback,
    showLoading = true,
    className,
    onLoad,
    onError,
    ...props 
  }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // ✅ Manipuladores de evento
    const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
      setLoading(false);
      setError(false);
      onLoad?.(event);
    };

    const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
      setLoading(false);
      setError(true);
      onError?.(event);
    };

    // ✅ Se a imagem é decorativa, alt deve ser vazio
    const altText = decorative ? '' : alt;

    // ✅ Combinar descrições
    const describedBy = [
      ariaDescribedby,
      longDescription ? `${props.id || 'img'}-long-desc` : undefined,
    ].filter(Boolean).join(' ') || undefined;

    // ✅ Estado de erro - mostrar fallback
    if (error) {
      return (
        <div 
          className={cn(
            'flex items-center justify-center bg-muted rounded-md p-4',
            className
          )}
          role="img"
          aria-label={decorative ? undefined : `Erro ao carregar imagem: ${alt}`}
        >
          {fallback || (
            <div className="text-center text-muted-foreground">
              <ImageOff className="h-8 w-8 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm">Imagem não disponível</p>
              {!decorative && (
                <p className="text-xs mt-1">{alt}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        {/* ✅ Loading state */}
        {loading && showLoading && (
          <div 
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-muted rounded-md',
              className
            )}
            aria-label="Carregando imagem"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        {/* ✅ Imagem principal */}
        <img
          ref={ref}
          alt={altText}
          className={cn(
            'transition-opacity duration-200',
            loading && 'opacity-0',
            className
          )}
          aria-describedby={describedBy}
          onLoad={handleLoad}
          onError={handleError}
          // ✅ Role para imagens decorativas
          role={decorative ? 'presentation' : undefined}
          {...props}
        />

        {/* ✅ Descrição longa (se fornecida) */}
        {longDescription && (
          <div 
            id={`${props.id || 'img'}-long-desc`}
            className="sr-only"
          >
            {longDescription}
          </div>
        )}
      </div>
    );
  }
);

AccessibleImage.displayName = 'AccessibleImage';
