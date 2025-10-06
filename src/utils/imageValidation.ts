export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ImageValidationOptions {
  maxSize?: number; // em bytes
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

const DEFAULT_OPTIONS: Required<ImageValidationOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxWidth: 4096,
  maxHeight: 4096,
  minWidth: 100,
  minHeight: 100,
};

/**
 * Valida um arquivo de imagem
 */
export async function validateImage(
  file: File,
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  // Validar tipo
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Formato não suportado. Use: ${opts.allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`,
    };
  }

  // Validar tamanho
  if (file.size > opts.maxSize) {
    const maxSizeMB = (opts.maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Imagem muito grande. Máximo ${maxSizeMB}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'Arquivo vazio',
    };
  }

  // Validar dimensões
  try {
    const dimensions = await getImageDimensions(file);

    if (dimensions.width > opts.maxWidth || dimensions.height > opts.maxHeight) {
      return {
        valid: false,
        error: `Dimensões muito grandes. Máximo ${opts.maxWidth}x${opts.maxHeight}px`,
      };
    }

    if (dimensions.width < opts.minWidth || dimensions.height < opts.minHeight) {
      return {
        valid: false,
        error: `Dimensões muito pequenas. Mínimo ${opts.minWidth}x${opts.minHeight}px`,
      };
    }

    // Avisos
    if (file.size > 5 * 1024 * 1024) {
      warnings.push('Imagem grande. Considere comprimir para melhor performance.');
    }

    if (dimensions.width > 2048 || dimensions.height > 2048) {
      warnings.push('Imagem de alta resolução. Pode demorar para carregar.');
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch {
    return {
      valid: false,
      error: 'Não foi possível ler a imagem',
    };
  }
}

/**
 * Obtém dimensões de uma imagem
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar imagem'));
    };

    img.src = url;
  });
}

/**
 * Comprime uma imagem se necessário
 */
export async function compressImage(
  file: File,
  maxSizeKB: number = 1024
): Promise<File> {
  const currentSizeKB = file.size / 1024;

  if (currentSizeKB <= maxSizeKB) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Não foi possível criar canvas'));
        return;
      }

      // Calcular nova dimensão mantendo aspect ratio
      const ratio = maxSizeKB / currentSizeKB;
      const scale = Math.sqrt(ratio);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        file.type,
        0.9 // qualidade
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar imagem'));
    };

    img.src = url;
  });
}

/**
 * Valida múltiplas imagens
 */
export async function validateImages(
  files: File[],
  options?: ImageValidationOptions
): Promise<Map<File, ImageValidationResult>> {
  const results = new Map<File, ImageValidationResult>();

  await Promise.all(
    files.map(async (file) => {
      const result = await validateImage(file, options);
      results.set(file, result);
    })
  );

  return results;
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
