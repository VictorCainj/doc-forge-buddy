import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { OptimizedImage, usePreloadImages } from './OptimizedImage';

interface ImageOptimizedProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  critical?: boolean; // Se true, força preload
  placeholder?: 'blur' | 'empty';
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente de imagem otimizada avançado
 * Inclui todas as otimizações de performance:
 * - Preload para imagens críticas
 * - Lazy loading para não-críticas
 * - WebP com fallbacks
 * - Dimensões para evitar CLS
 * - Placeholder inteligente
 * - Multiple sources
 *
 * @example
 * ```tsx
 * <ImageOptimized
 *   src="/images/hero.jpg"
 *   alt="Imagem principal"
 *   width={1200}
 *   height={800}
 *   priority={true}
 *   critical={true}
 *   placeholder="blur"
 * />
 * ```
 */
export const ImageOptimized = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  critical = false,
  placeholder = 'empty',
  quality = 85,
  sizes,
  onLoad,
  onError,
}: ImageOptimizedProps) => {
  const [isInView, setIsInView] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const observerRef = useState<IntersectionObserver | null>(null);

  // Preload para imagens críticas
  const isCritical = priority || critical;
  
  if (isCritical) {
    usePreloadImages([src], true);
  }

  // Lazy loading com Intersection Observer para não-críticas
  useEffect(() => {
    if (!isCritical && !isInView) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1,
        }
      );

      observerRef.current = observer;
      
      // Criar um elemento para observar
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '1px';
      element.style.height = '1px';
      document.body.appendChild(element);
      
      observer.observe(element);

      return () => {
        observer.disconnect();
        if (document.body.contains(element)) {
          document.body.removeChild(element);
        }
      };
    }
  }, [isCritical, isInView]);

  // Determinar URL final baseada no tipo de imagem
  useEffect(() => {
    if (isCritical || isInView) {
      setImageUrl(src);
    }
  }, [src, isCritical, isInView]);

  // Gerar sizes adequados baseado no contexto
  const generateSizes = () => {
    if (sizes) return sizes;
    
    if (width && height) {
      // Se temos dimensões específicas, usar aspect-ratio
      return `(max-width: ${width}px) 100vw, ${width}px`;
    }
    
    // Sizes padrão responsivo
    return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`;
  };

  // Não renderizar até que esteja na viewport (para não-críticas)
  if (!isCritical && !isInView) {
    return (
      <div
        className={cn('relative overflow-hidden bg-neutral-100 animate-pulse', className)}
        style={{ 
          width, 
          height,
          ...(width && height ? { aspectRatio: `${width} / ${height}` } : {})
        }}
      >
        {placeholder === 'blur' && (
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200" />
        )}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={imageUrl || src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      priority={isCritical}
      placeholder={placeholder}
      quality={quality}
      sizes={generateSizes()}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

export default ImageOptimized;