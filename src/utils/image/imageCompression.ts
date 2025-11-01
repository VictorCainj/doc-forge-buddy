// @ts-nocheck
/**
 * Utilitário para compressão automática de imagens
 * Reduz tamanho de uploads em até 90% mantendo qualidade visual
 */

import imageCompression from 'browser-image-compression';
import { log } from '../logger';

/**
 * Opções de compressão de imagem
 */
export interface CompressionOptions {
  /**
   * Tamanho máximo em MB
   * @default 1
   */
  maxSizeMB?: number;

  /**
   * Largura máxima em pixels
   * @default 1920
   */
  maxWidthOrHeight?: number;

  /**
   * Qualidade da compressão (0-100)
   * @default 0.8
   */
  quality?: number;

  /**
   * Usar Web Worker para compressão (melhor performance)
   * @default true
   */
  useWebWorker?: boolean;

  /**
   * Formato de saída
   * @default 'image/jpeg'
   */
  fileType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Resultado da compressão
 */
export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  savedBytes: number;
}

/**
 * Comprime uma imagem automaticamente
 *
 * Reduz significativamente o tamanho do arquivo mantendo qualidade visual.
 * Útil para uploads grandes de fotos de vistoria.
 *
 * @example
 * ```typescript
 * const compressed = await compressImage(file);
 * await uploadImage(compressed.file);
 * ```
 *
 * @param file - Arquivo de imagem a ser comprimido
 * @param options - Opções de compressão
 * @returns Arquivo comprimido com metadados
 *
 * @throws {Error} Se a compressão falhar
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.8,
    useWebWorker = true,
    fileType = 'image/jpeg',
  } = options;

  try {
    const originalSize = file.size;

    log.debug('Comprimindo imagem:', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      filename: file.name,
    });

    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      quality,
      useWebWorker,
      fileType,
    });

    const compressedSize = compressedFile.size;
    const compressionRatio =
      ((originalSize - compressedSize) / originalSize) * 100;
    const savedBytes = originalSize - compressedSize;

    log.debug('Imagem comprimida:', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      compressionRatio: `${compressionRatio.toFixed(1)}%`,
      saved: `${(savedBytes / 1024 / 1024).toFixed(2)}MB`,
    });

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      savedBytes,
    };
  } catch (error) {
    log.error('Erro ao comprimir imagem:', error);
    // Em caso de erro, retornar arquivo original
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      savedBytes: 0,
    };
  }
}

/**
 * Verifica se a imagem precisa ser comprimida
 *
 * @param file - Arquivo de imagem
 * @param maxSizeMB - Tamanho máximo em MB
 * @returns true se a compressão é necessária
 */
export function shouldCompressImage(
  file: File,
  maxSizeMB: number = 1
): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size > maxBytes;
}

/**
 * Obtém estatísticas de uma imagem
 *
 * @param file - Arquivo de imagem
 * @returns Estatísticas da imagem
 */
export function getImageStats(file: File) {
  return {
    name: file.name,
    size: file.size,
    sizeMB: (file.size / 1024 / 1024).toFixed(2),
    type: file.type,
    lastModified: new Date(file.lastModified),
  };
}
