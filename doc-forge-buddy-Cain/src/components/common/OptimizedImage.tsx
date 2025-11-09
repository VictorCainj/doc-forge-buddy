import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente de imagem otimizada com:
 * - Lazy loading nativo
 * - Placeholder blur durante carregamento
 * - Fallback para erro
 * - Suporte a WebP automático (quando disponível)
 * - Preload para imagens críticas
 * - Dimensões para evitar CLS (Cumulative Layout Shift)
 * - Multiple sources com srcSet
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/photo.jpg"
 *   alt="Descrição da imagem"
 *   width={800}
 *   height={600}
 *   priority={false}
 *   placeholder="blur"
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
  placeholder = 'empty',
  quality = 85,
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [webpSupported, setWebpSupported] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset quando src mudar
    setIsLoaded(false);
    setHasError(false);
    setImageSrc(src);
  }, [src]);

  // Verificar suporte a WebP
  useEffect(() => {
    const checkWebPSupport = async () => {
      try {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
          setWebpSupported(webP.height === 2);
        };
        webP.src =
          'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      } catch {
        setWebpSupported(false);
      }
    };
    checkWebPSupport();
  }, []);

  // Preload para imagens críticas
  useEffect(() => {
    if (priority && src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, priority]);

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

  // Gerar múltiplas resoluções
  const generateSrcSet = (baseSrc: string) => {
    if (baseSrc.startsWith('data:') || baseSrc.startsWith('blob:')) {
      return undefined;
    }

    const baseUrl = baseSrc.split('?')[0];
    const query = baseSrc.includes('?') ? baseSrc.slice(baseSrc.indexOf('?')) : '';
    
    // Se o arquivo já tem extensão, adicionar sufixos de resolução
    const hasExtension = /\.[a-zA-Z]+$/.test(baseUrl);
    if (hasExtension) {
      return [
        `${baseUrl}?w=400${query} 400w`,
        `${baseUrl}?w=800${query} 800w`,
        `${baseUrl}?w=1200${query} 1200w`,
        `${baseUrl}?w=1600${query} 1600w`,
        `${baseUrl}?w=2000${query} 2000w`,
      ].join(', ');
    }
    
    return baseSrc;
  };

  // Gerar fontes WebP se suportado
  const getWebPSource = (baseSrc: string) => {
    if (!webpSupported || baseSrc.startsWith('data:') || baseSrc.startsWith('blob:')) {
      return undefined;
    }

    const baseUrl = baseSrc.split('?')[0];
    const query = baseSrc.includes('?') ? baseSrc.slice(baseSrc.indexOf('?')) : '';
    
    // Se o arquivo já tem extensão, adicionar extensão WebP
    if (/\.[a-zA-Z]+$/.test(baseUrl)) {
      return baseUrl.replace(/\.[a-zA-Z]+$/, '.webp') + query;
    }
    
    return baseSrc;
  };

  const srcSet = generateSrcSet(src);
  const webpSrc = getWebPSource(src);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-neutral-100', className)}
      style={{ 
        width, 
        height,
        // Prevenir CLS especificando aspect-ratio se dimensões disponíveis
        ...(width && height ? { aspectRatio: `${width} / ${height}` } : {})
      }}
    >
      {/* Placeholder blur durante carregamento */}
      {!isLoaded && !hasError && placeholder === 'blur' && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200"
          aria-hidden="true"
        />
      )}

      {/* Placeholder vazio para evitar CLS */}
      {!isLoaded && !hasError && placeholder === 'empty' && (
        <div
          className="absolute inset-0 bg-neutral-100"
          aria-hidden="true"
        />
      )}

      {/* Elemento picture para WebP com fallbacks */}
      <picture ref={imgRef}>
        {/* Fonte WebP se suportado */}
        {webpSrc && (
          <source
            srcSet={generateSrcSet(webpSrc)}
            sizes={sizes}
            type="image/webp"
          />
        )}
        
        {/* Imagem principal */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          srcSet={srcSet}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchpriority={priority ? 'high' : 'low'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            'w-full h-full object-cover'
          )}
        />
      </picture>

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
 * Hook para pré-carregar imagens críticas
 * @param urls - Array de URLs de imagens para pré-carregar
 * @param priority - Se true, usa preload no head; se false, apenas carrega em background
 *
 * @example
 * ```tsx
 * usePreloadImages(['/hero.jpg', '/logo.png'], true);
 * ```
 */
export const usePreloadImages = (urls: string[], priority = false) => {
  useEffect(() => {
    urls.forEach((url) => {
      if (priority && !url.startsWith('data:') && !url.startsWith('blob:')) {
        // Adicionar ao head com preload
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        
        // Remover após um tempo para não poluir o head
        setTimeout(() => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        }, 5000);
      } else {
        // Pré-carregar em background
        const img = new Image();
        img.src = url;
        img.crossOrigin = 'anonymous';
      }
    });
  }, [urls, priority]);
};

export default OptimizedImage;
