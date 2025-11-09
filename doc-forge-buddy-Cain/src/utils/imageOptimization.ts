/**
 * Utilitários para otimização de imagens
 * Compressão, conversão para WebP, lazy loading e placeholders
 */

import { logger } from './logger';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  enableWebP?: boolean;
  enableCompression?: boolean;
}

export interface OptimizedImageResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
}

/**
 * Verificar se o navegador suporta WebP
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Comprimir imagem usando Canvas
 */
export const compressImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    enableWebP = true,
    enableCompression: _enableCompression = true,
  } = options;

  logger.info('ImageOptimization: Iniciando compressão', {
    fileName: file.name,
    originalSize: file.size,
    options,
  });

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = async () => {
      try {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Determinar formato final
        let finalFormat = format;
        let finalQuality = quality;

        if (enableWebP && (await supportsWebP())) {
          finalFormat = 'webp';
          // WebP geralmente tem melhor qualidade com qualidade ligeiramente menor
          finalQuality = Math.max(0.7, quality * 0.9);
        }

        // Converter para blob
        const mimeType = `image/${finalFormat}`;
        const blob = await new Promise<Blob>((resolveBlob) => {
          canvas.toBlob(resolveBlob, mimeType, finalQuality);
        });

        if (!blob) {
          reject(new Error('Failed to compress image'));
          return;
        }

        // Criar arquivo otimizado
        const optimizedFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, `.${finalFormat}`),
          {
            type: mimeType,
            lastModified: Date.now(),
          }
        );

        // Gerar data URL
        const dataUrl = canvas.toDataURL(mimeType, finalQuality);
        const compressionRatio =
          ((file.size - optimizedFile.size) / file.size) * 100;

        logger.info('ImageOptimization: Compressão concluída', {
          fileName: file.name,
          originalSize: file.size,
          optimizedSize: optimizedFile.size,
          compressionRatio: `${compressionRatio.toFixed(1)}%`,
          format: finalFormat,
        });

        resolve({
          file: optimizedFile,
          dataUrl,
          originalSize: file.size,
          optimizedSize: optimizedFile.size,
          compressionRatio,
          format: finalFormat,
        });
      } catch (error) {
        logger.error('ImageOptimization: Erro na compressão', {
          error,
          fileName: file.name,
        });
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gerar placeholder blur para lazy loading
 */
export const generateBlurPlaceholder = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Criar versão pequena (20x20 ou menor)
        const size = Math.min(20, Math.min(img.width, img.height));
        canvas.width = size;
        canvas.height = size;

        // Desenhar imagem pequena
        ctx.drawImage(img, 0, 0, size, size);

        // Aplicar blur usando CSS filter via canvas
        ctx.filter = 'blur(5px)';
        ctx.drawImage(img, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to generate blur placeholder'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Lazy loading com Intersection Observer
 */
export const setupLazyLoading = (): void => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            const blurSrc = img.dataset.blurSrc;

            if (src) {
              // Adicionar transição suave
              img.style.transition = 'opacity 0.3s ease';
              img.style.opacity = '0';

              img.onload = () => {
                img.style.opacity = '1';
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
              };

              img.src = src;
              img.removeAttribute('data-src');

              // Remover placeholder blur
              if (blurSrc) {
                img.style.backgroundImage = '';
                img.removeAttribute('data-blur-src');
              }
            }

            imageObserver.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    // Observar todas as imagens com data-src
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img) => {
      img.classList.add('lazy-loading');
      imageObserver.observe(img);
    });
  }
};

/**
 * Otimizar múltiplas imagens em lote
 */
export const optimizeImageBatch = async (
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult[]> => {
  logger.info('ImageOptimization: Iniciando otimização em lote', {
    fileCount: files.length,
    options,
  });

  const results: OptimizedImageResult[] = [];
  const errors: Error[] = [];

  // Processar em paralelo (máximo 5 simultâneas)
  const batchSize = 5;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchPromises = batch.map(async (file) => {
      try {
        return await compressImage(file, options);
      } catch (error) {
        logger.error('ImageOptimization: Erro no lote', {
          error,
          fileName: file.name,
        });
        errors.push(error as Error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(
      ...batchResults.filter(
        (result): result is OptimizedImageResult => result !== null
      )
    );
  }

  logger.info('ImageOptimization: Otimização em lote concluída', {
    totalFiles: files.length,
    successful: results.length,
    errors: errors.length,
  });

  return results;
};

/**
 * Validar se arquivo é uma imagem válida
 */
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Máximo 10MB.',
    };
  }

  return { valid: true };
};

/**
 * Hook para usar otimização de imagens
 */
export const useImageOptimization = () => {
  const optimizeSingle = async (
    file: File,
    options?: ImageOptimizationOptions
  ) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return await compressImage(file, options);
  };

  const optimizeMultiple = async (
    files: File[],
    options?: ImageOptimizationOptions
  ) => {
    const validFiles = files.filter((file) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        logger.warn('ImageOptimization: Arquivo inválido ignorado', {
          fileName: file.name,
          error: validation.error,
        });
      }
      return validation.valid;
    });

    return await optimizeImageBatch(validFiles, options);
  };

  return {
    optimizeSingle,
    optimizeMultiple,
    validateImageFile,
    generateBlurPlaceholder,
    setupLazyLoading,
  };
};
