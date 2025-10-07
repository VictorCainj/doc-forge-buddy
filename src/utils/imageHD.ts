/**
 * Utilitário para processamento de imagens em HD para documentos
 * Garante qualidade máxima na geração de PDFs e documentos
 */

export interface HDImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

const DEFAULT_HD_OPTIONS: Required<HDImageOptions> = {
  maxWidth: 2560,
  maxHeight: 1440,
  quality: 0.95,
  format: 'jpeg',
  maintainAspectRatio: true,
};

/**
 * Converte File para base64 em alta qualidade
 */
export async function fileToBase64HD(
  file: File,
  options: HDImageOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_HD_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
          alpha: true,
          desynchronized: false,
        });

        if (!ctx) {
          reject(new Error('Não foi possível criar contexto canvas'));
          return;
        }

        // Calcular dimensões mantendo proporção
        let { width, height } = img;

        if (opts.maintainAspectRatio) {
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
        } else {
          width = Math.min(width, opts.maxWidth);
          height = Math.min(height, opts.maxHeight);
        }

        canvas.width = width;
        canvas.height = height;

        // Configurar renderização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Desenhar imagem
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para base64 com alta qualidade
        const mimeType = `image/${opts.format}`;
        const base64 = canvas.toDataURL(mimeType, opts.quality);

        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = url;
  });
}

/**
 * Converte URL de imagem para base64 HD
 */
export async function urlToBase64HD(
  url: string,
  options: HDImageOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_HD_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
          alpha: true,
          desynchronized: false,
        });

        if (!ctx) {
          reject(new Error('Não foi possível criar contexto canvas'));
          return;
        }

        // Calcular dimensões mantendo proporção
        let { width, height } = img;

        if (opts.maintainAspectRatio) {
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
        } else {
          width = Math.min(width, opts.maxWidth);
          height = Math.min(height, opts.maxHeight);
        }

        canvas.width = width;
        canvas.height = height;

        // Configurar renderização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Desenhar imagem
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para base64 com alta qualidade
        const mimeType = `image/${opts.format}`;
        const base64 = canvas.toDataURL(mimeType, opts.quality);

        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem da URL'));
    };

    img.src = url;
  });
}

/**
 * Processa múltiplas imagens para HD
 */
export async function processMultipleImagesHD(
  files: (File | { url: string; isFromDatabase: boolean })[],
  options: HDImageOptions = {}
): Promise<Array<{ nome: string; base64: string }>> {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        // Se é uma imagem do banco de dados com URL
        if ('url' in file && file.isFromDatabase) {
          // Tentar converter URL para base64 HD
          try {
            const base64 = await urlToBase64HD(file.url, options);
            return { nome: 'imagem', base64 };
          } catch {
            // Se falhar, usar URL diretamente
            return { nome: 'imagem', base64: file.url };
          }
        }

        // Se é um File
        if (file instanceof File) {
          const base64 = await fileToBase64HD(file, options);
          return { nome: file.name, base64 };
        }

        return null;
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        return null;
      }
    })
  );

  return results.filter((r): r is { nome: string; base64: string } => r !== null);
}

/**
 * Otimiza imagem para impressão (300 DPI)
 */
export async function optimizeForPrint(
  file: File,
  targetWidthInches: number = 8.5, // Largura A4
  targetHeightInches: number = 11 // Altura A4
): Promise<string> {
  const dpi = 300;
  const maxWidth = targetWidthInches * dpi;
  const maxHeight = targetHeightInches * dpi;

  return fileToBase64HD(file, {
    maxWidth,
    maxHeight,
    quality: 0.98,
    format: 'jpeg',
    maintainAspectRatio: true,
  });
}

/**
 * Redimensiona imagem mantendo qualidade para documentos
 */
export async function resizeForDocument(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<string> {
  return fileToBase64HD(file, {
    maxWidth,
    maxHeight,
    quality: 0.95,
    format: 'jpeg',
    maintainAspectRatio: true,
  });
}

/**
 * Verifica se uma string é uma URL de imagem válida
 */
export function isImageUrl(str: string): boolean {
  if (!str) return false;
  
  // Verifica se é uma URL HTTP/HTTPS
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return true;
  }
  
  // Verifica se é base64
  if (str.startsWith('data:image/')) {
    return true;
  }
  
  return false;
}

/**
 * Obtém informações sobre uma imagem
 */
export async function getImageInfo(
  source: File | string
): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
  size?: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const info = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        size: source instanceof File ? source.size : undefined,
      };

      if (source instanceof File) {
        URL.revokeObjectURL(img.src);
      }

      resolve(info);
    };

    img.onerror = () => {
      if (source instanceof File) {
        URL.revokeObjectURL(img.src);
      }
      reject(new Error('Erro ao carregar imagem'));
    };

    if (source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}
