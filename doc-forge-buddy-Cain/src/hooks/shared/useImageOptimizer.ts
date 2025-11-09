import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { log } from '@/utils/logger';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maxSizeKB?: number;
  enableLazy?: boolean;
  enablePreload?: boolean;
  priorityImages?: string[]; // Seletores CSS para imagens prioritárias
}

export interface OptimizedImage {
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  url?: string; // Para imagens otimizadas salvas
}

export interface UseImageOptimizerReturn {
  // Estado de compressão
  optimizedImages: OptimizedImage[];
  isProcessing: boolean;
  progress: number;
  
  // Funções de compressão
  processImages: (files: File[]) => Promise<OptimizedImage[]>;
  optimizeSingleImage: (file: File) => Promise<OptimizedImage>;
  removeImage: (index: number) => void;
  clearImages: () => void;
  
  // Funções de otimização global
  optimizeExistingImages: () => void;
  setupGlobalOptimization: () => void;
  refreshOptimization: () => void;
  
  // Estatísticas
  getTotalSize: () => number;
  getCompressionStats: () => {
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    totalImages: number;
  };
  
  // Utilitários
  preloadCriticalImages: () => void;
  cleanupImageUrls: () => void;
}

/**
 * Hook consolidado para otimização de imagens
 * Unifica funcionalidades de:
 * - useImageOptimizationGlobal (otimização global)
 * - useOptimizedImages (compressão e redimensionamento)
 */
export const useImageOptimizer = (
  options: ImageOptimizationOptions = {}
): UseImageOptimizerReturn => {
  const {
    maxWidth = 2560,
    maxHeight = 1440,
    quality = 0.95,
    format = 'jpeg',
    maxSizeKB = 2048,
    enableLazy = true,
    enablePreload = true,
    priorityImages = ['.hero-image', '.logo', '[data-critical]'],
  } = options;

  // Estado
  const [optimizedImages, setOptimizedImages] = useState<OptimizedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>();
  const observerRef = useRef<MutationObserver | null>(null);
  const processedImagesRef = useRef<Set<string>>(new Set());

  // Função para redimensionar imagem
  const resizeImage = useCallback((
    file: File,
    maxW: number,
    maxH: number
  ): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width *= ratio;
          height *= ratio;
        }

        // Criar canvas se não existir
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Usar algoritmo de alta qualidade para redimensionamento
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve({ canvas, ctx });
      };
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Função para comprimir imagem
  const compressImage = useCallback(async (
    canvas: HTMLCanvasElement,
    targetFormat: string,
    targetQuality: number,
    maxSize: number
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      let currentQuality = targetQuality;
      
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(new Blob());
            return;
          }

          // Se o arquivo está dentro do tamanho limite, usar
          if (blob.size <= maxSize * 1024 || currentQuality <= 0.1) {
            resolve(blob);
            return;
          }

          // Reduzir qualidade e tentar novamente
          currentQuality -= 0.1;
          tryCompress();
        }, `image/${targetFormat}`, currentQuality);
      };

      tryCompress();
    });
  }, []);

  // Processar múltiplas imagens
  const processImages = useCallback(async (files: File[]): Promise<OptimizedImage[]> => {
    if (files.length === 0) return [];

    setIsProcessing(true);
    setProgress(0);

    const results: OptimizedImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Verificar se é imagem
        if (!file.type.startsWith('image/')) {
          log.warn(`Arquivo ${file.name} não é uma imagem`);
          continue;
        }

        try {
          // Redimensionar
          const { canvas } = await resizeImage(file, maxWidth, maxHeight);
          
          // Comprimir
          const compressedBlob = await compressImage(
            canvas,
            format,
            quality,
            maxSizeKB
          );

          // Criar novo arquivo
          const compressedFile = new File(
            [compressedBlob],
            `optimized_${file.name}`,
            { type: `image/${format}` }
          );

          // Criar preview
          const preview = URL.createObjectURL(compressedBlob);

          // Calcular estatísticas
          const originalSize = file.size;
          const compressedSize = compressedFile.size;
          const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

          results.push({
            file: compressedFile,
            preview,
            originalSize,
            compressedSize,
            compressionRatio,
          });

        } catch (error) {
          log.error(`Erro ao processar ${file.name}:`, error);
        }

        // Atualizar progresso
        setProgress(((i + 1) / files.length) * 100);
      }

      setOptimizedImages(prev => [...prev, ...results]);
      return results;

    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [resizeImage, compressImage, maxWidth, maxHeight, format, quality, maxSizeKB]);

  // Processar imagem única
  const optimizeSingleImage = useCallback(async (file: File): Promise<OptimizedImage> => {
    const results = await processImages([file]);
    return results[0];
  }, [processImages]);

  // Otimizar imagens existentes no DOM
  const optimizeExistingImages = useCallback(() => {
    if (typeof window === 'undefined') return;

    const images = document.querySelectorAll('img:not([data-optimized])');

    images.forEach((img) => {
      const imageEl = img as HTMLImageElement;
      const imageSrc = imageEl.src;

      // Evitar processar a mesma imagem duas vezes
      if (processedImagesRef.current.has(imageSrc)) {
        return;
      }

      // Marcar como otimizada para não processar novamente
      imageEl.setAttribute('data-optimized', 'true');
      processedImagesRef.current.add(imageSrc);

      // Adicionar loading="lazy" se habilitado
      if (enableLazy) {
        if (!imageEl.hasAttribute('priority') && 
            !imageEl.closest('[data-critical]') &&
            !priorityImages.some(selector => imageEl.matches(selector))) {
          if (!imageEl.hasAttribute('loading')) {
            imageEl.setAttribute('loading', 'lazy');
          }
        }
      }

      // Adicionar dimensions se não tiver
      if (!imageEl.width || !imageEl.height) {
        if (!imageEl.style.aspectRatio && !imageEl.style.height) {
          imageEl.style.aspectRatio = '16/9';
        }
      }

      // Adicionar decoding async
      if (!imageEl.hasAttribute('decoding')) {
        imageEl.setAttribute('decoding', 'async');
      }

      // Configurar fetch priority
      if (!imageEl.hasAttribute('fetchpriority')) {
        const isPriority = priorityImages.some(selector => 
          imageEl.matches(selector) || 
          imageEl.closest(selector)
        ) || 
        imageEl.hasAttribute('priority') || 
        imageEl.classList.contains('hero-image') ||
        imageEl.classList.contains('logo');

        imageEl.setAttribute('fetchpriority', isPriority ? 'high' : 'low');
      }
    });
  }, [enableLazy, priorityImages]);

  // Configurar otimização global com MutationObserver
  const setupGlobalOptimization = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Otimizar imagens existentes inicialmente
    optimizeExistingImages();

    // Configurar MutationObserver para novos elementos
    observerRef.current = new MutationObserver((mutations) => {
      let shouldOptimize = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'IMG' || element.querySelector('img')) {
                shouldOptimize = true;
              }
            }
          });
        }
      });

      if (shouldOptimize) {
        // Pequeno delay para garantir que o DOM foi atualizado
        setTimeout(optimizeExistingImages, 100);
      }
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }, [optimizeExistingImages]);

  // Recarregar otimização
  const refreshOptimization = useCallback(() => {
    // Limpar marcas de otimização
    document.querySelectorAll('[data-optimized]').forEach(el => {
      el.removeAttribute('data-optimized');
    });
    
    // Limpar cache de imagens processadas
    processedImagesRef.current.clear();
    
    // Re-otimizar
    optimizeExistingImages();
  }, [optimizeExistingImages]);

  // Preload de imagens críticas
  const preloadCriticalImages = useCallback(() => {
    if (!enablePreload) return;

    priorityImages.forEach(selector => {
      const images = document.querySelectorAll(selector);
      images.forEach((img) => {
        const imageEl = img as HTMLImageElement;
        if (imageEl.src) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = imageEl.src;
          document.head.appendChild(link);
        }
      });
    });
  }, [enablePreload, priorityImages]);

  // Limpar URLs de imagens para evitar memory leak
  const cleanupImageUrls = useCallback(() => {
    optimizedImages.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
  }, [optimizedImages]);

  // Remover imagem
  const removeImage = useCallback((index: number) => {
    setOptimizedImages(prev => {
      const newImages = [...prev];
      const removedImage = newImages[index];
      
      // Limpar URL do preview
      if (removedImage?.preview) {
        URL.revokeObjectURL(removedImage.preview);
      }
      
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  // Limpar todas as imagens
  const clearImages = useCallback(() => {
    cleanupImageUrls();
    setOptimizedImages([]);
  }, [cleanupImageUrls]);

  // Calcular tamanho total
  const getTotalSize = useCallback(() => {
    return optimizedImages.reduce((total, img) => total + img.compressedSize, 0);
  }, [optimizedImages]);

  // Estatísticas de compressão
  const getCompressionStats = useCallback(() => {
    if (optimizedImages.length === 0) {
      return {
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        averageCompressionRatio: 0,
        totalImages: 0,
      };
    }

    const totalOriginalSize = optimizedImages.reduce(
      (total, img) => total + img.originalSize, 0
    );
    const totalCompressedSize = optimizedImages.reduce(
      (total, img) => total + img.compressedSize, 0
    );
    const averageCompressionRatio = optimizedImages.reduce(
      (total, img) => total + img.compressionRatio, 0
    ) / optimizedImages.length;

    return {
      totalOriginalSize,
      totalCompressedSize,
      averageCompressionRatio,
      totalImages: optimizedImages.length,
    };
  }, [optimizedImages]);

  // Configurar otimização global na montagem
  useEffect(() => {
    setupGlobalOptimization();
    
    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      cleanupImageUrls();
    };
  }, [setupGlobalOptimization, cleanupImageUrls]);

  return {
    // Estado
    optimizedImages,
    isProcessing,
    progress,
    
    // Funções de compressão
    processImages,
    optimizeSingleImage,
    removeImage,
    clearImages,
    
    // Funções de otimização global
    optimizeExistingImages,
    setupGlobalOptimization,
    refreshOptimization,
    
    // Estatísticas
    getTotalSize,
    getCompressionStats,
    
    // Utilitários
    preloadCriticalImages,
    cleanupImageUrls,
  };
};

export default useImageOptimizer;