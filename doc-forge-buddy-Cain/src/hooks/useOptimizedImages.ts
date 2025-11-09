/**
 * Hook para otimização de imagens
 * Compressão, redimensionamento e carregamento lazy
 */

import { useState, useCallback, useRef } from 'react';
import { log } from '@/utils/logger';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maxSizeKB?: number;
}

export interface OptimizedImage {
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface UseOptimizedImagesReturn {
  optimizedImages: OptimizedImage[];
  isProcessing: boolean;
  progress: number;
  processImages: (files: File[]) => Promise<OptimizedImage[]>;
  removeImage: (index: number) => void;
  clearImages: () => void;
  getTotalSize: () => number;
  getCompressionStats: () => {
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
  };
}

export const useOptimizedImages = (
  options: ImageOptimizationOptions = {}
): UseOptimizedImagesReturn => {
  const {
    maxWidth = 2560,
    maxHeight = 1440,
    quality = 0.95,
    format = 'jpeg',
    maxSizeKB = 2048,
  } = options;

  const [optimizedImages, setOptimizedImages] = useState<OptimizedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>();

  // ✅ Função para redimensionar imagem
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

        // ✅ Usar algoritmo de alta qualidade para redimensionamento
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

  // ✅ Função para comprimir imagem
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
            // Blob is null, resolve with empty blob
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

  // ✅ Processar múltiplas imagens com progresso
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

  // ✅ Remover imagem
  const removeImage = useCallback((index: number) => {
    setOptimizedImages(prev => {
      const newImages = [...prev];
      // Limpar URL do preview para evitar memory leak
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  // ✅ Limpar todas as imagens
  const clearImages = useCallback(() => {
    // Limpar URLs dos previews
    optimizedImages.forEach(img => {
      URL.revokeObjectURL(img.preview);
    });
    setOptimizedImages([]);
  }, [optimizedImages]);

  // ✅ Calcular tamanho total
  const getTotalSize = useCallback(() => {
    return optimizedImages.reduce((total, img) => total + img.compressedSize, 0);
  }, [optimizedImages]);

  // ✅ Estatísticas de compressão
  const getCompressionStats = useCallback(() => {
    if (optimizedImages.length === 0) {
      return {
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        averageCompressionRatio: 0,
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
    };
  }, [optimizedImages]);

  return {
    optimizedImages,
    isProcessing,
    progress,
    processImages,
    removeImage,
    clearImages,
    getTotalSize,
    getCompressionStats,
  };
};
