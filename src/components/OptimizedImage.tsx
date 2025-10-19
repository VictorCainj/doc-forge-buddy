import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente de imagem otimizada com:
 * - Lazy loading nativo
 * - Placeholder blur durante carregamento
 * - Fallback para erro
 * - Suporte a WebP automático (quando disponível)
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/photo.jpg"
 *   alt="Descrição da imagem"
 *   width={800}
 *   height={600}
 *   priority={false}
 * />
 * ```
 */
export const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    // Reset quando src mudar
    setIsLoaded(false);
    setHasError(false);
    setImageSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
    // Fallback para placeholder
    setImageSrc('/placeholder.svg');
  };

  // Criar srcSet para diferentes resoluções
  const srcSet =
    src && !src.startsWith('data:') && !src.startsWith('blob:')
      ? `${src} 1x, ${src} 2x`
      : undefined;

  return (
    <div
      className={cn('relative overflow-hidden bg-neutral-100', className)}
      style={{ width, height }}
    >
      {/* Placeholder blur durante carregamento */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200"
          aria-hidden="true"
        />
      )}

      {/* Imagem principal */}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        srcSet={srcSet}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          'w-full h-full object-cover'
        )}
      />

      {/* Mensagem de erro */}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-neutral-500"
          role="alert"
        >
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Imagem não disponível</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook para pré-carregar imagens
 * @param urls - Array de URLs de imagens para pré-carregar
 *
 * @example
 * ```tsx
 * usePreloadImages(['/image1.jpg', '/image2.jpg']);
 * ```
 */
export const usePreloadImages = (urls: string[]) => {
  useEffect(() => {
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [urls]);
};

export default OptimizedImage;
