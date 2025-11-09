import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { log } from '@/utils/logger';
import { validateImages } from '@/utils/imageValidation';

/**
 * Interface para resultado de validação de imagem
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Interface para resultado de upload de imagem
 */
export interface ImageUploadResult {
  success: boolean;
  image?: {
    name: string;
    size: number;
    type: string;
    url: string;
    isFromDatabase?: boolean;
    isExternal?: boolean;
    lastModified: number;
  };
  error?: string;
}

/**
 * Interface para processamento de imagem externa
 */
export interface ExternalImageData {
  name: string;
  size: number;
  type: string;
  isExternal: boolean;
  url: string;
  lastModified: number;
}

/**
 * Hook para gerenciamento de imagens da vistoria
 */
export const useVistoriaImages = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  /**
   * Converte File para base64
   */
  const fileToBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  /**
   * Converte base64 para File
   */
  const base64ToFile = useCallback(async (
    base64: string, 
    name: string, 
    type: string
  ): Promise<File> => {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], name, { type });
  }, []);

  /**
   * Valida lista de arquivos de imagem
   */
  const validateImageFiles = useCallback(async (
    files: File[],
    options: {
      maxSize?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ) => {
    const { maxSize = 10 * 1024 * 1024, maxWidth = 4096, maxHeight = 4096 } = options;

    const validationResults = await validateImages(files, {
      maxSize,
      maxWidth,
      maxHeight,
    });

    const validFiles: File[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    validationResults.forEach((result, file) => {
      if (result.valid) {
        validFiles.push(file);
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }
    });

    return { validFiles, errors, warnings };
  }, []);

  /**
   * Processa upload de arquivos (substituindo _handleFileUpload)
   */
  const handleFileUpload = useCallback(async (
    files: FileList | null,
    tipo: 'inicial' | 'final',
    onAddImages: (images: File[], tipo: 'inicial' | 'final') => void
  ): Promise<{ success: boolean; added: number; errors: string[] }> => {
    if (!files) {
      return { success: false, added: 0, errors: ['Nenhum arquivo selecionado'] };
    }

    const fileArray = Array.from(files);

    // Validar imagens
    const { validFiles, errors, warnings } = await validateImageFiles(fileArray);

    // Mostrar avisos se houver
    warnings.forEach((warning) => {
      toast({
        title: 'Aviso',
        description: warning,
        variant: 'default',
      });
    });

    // Mostrar erros se houver
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast({
          title: 'Erro na validação',
          description: error,
          variant: 'destructive',
        });
      });
    }

    if (validFiles.length === 0) {
      return { success: false, added: 0, errors };
    }

    // Adicionar arquivos válidos
    onAddImages(validFiles, tipo);

    if (validFiles.length > 0) {
      toast({
        title: 'Imagens adicionadas',
        description: `${validFiles.length} imagem(ns) adicionada(s) com sucesso.`,
      });
    }

    return { success: true, added: validFiles.length, errors };
  }, [toast]);

  /**
   * Converte imagens para base64 para análise com IA
   */
  const convertImagesForAI = useCallback(async (
    fotos: any[]
  ): Promise<string[]> => {
    const base64Images: string[] = [];

    for (const foto of fotos) {
      if (foto instanceof File) {
        // Se é um File, converter para base64
        const base64 = await fileToBase64(foto);
        base64Images.push(base64);
      } else if (foto && typeof foto === 'object' && foto.url) {
        // Foto do banco de dados ou externa
        if (foto.url.startsWith('data:image/')) {
          // Se a URL já é base64, usar diretamente
          base64Images.push(foto.url);
        } else {
          // Se é uma URL normal, converter para base64
          try {
            const response = await fetch(foto.url);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            base64Images.push(base64);
          } catch (error) {
            log.error('Erro ao converter imagem para base64:', error);
            throw new Error(`Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }
      }
    }

    return base64Images;
  }, [fileToBase64]);

  /**
   * Adiciona imagem externa
   */
  const addExternalImage = useCallback((
    url: string,
    onAddImage: (image: ExternalImageData) => void
  ): ImageUploadResult => {
    // Validar se é uma URL válida
    try {
      new URL(url);
    } catch {
      return {
        success: false,
        error: 'URL inválida. Por favor, insira uma URL válida.',
      };
    }

    // Criar objeto que simula um File mas com URL externa
    const externalImage: ExternalImageData = {
      name: `Imagem Externa - ${new Date().toLocaleString()}`,
      size: 0,
      type: 'image/external',
      isExternal: true,
      url,
      lastModified: Date.now(),
    };

    onAddImage(externalImage);

    return {
      success: true,
      image: externalImage,
    };
  }, []);

  /**
   * Remove foto específica de uma lista
   */
  const removePhoto = useCallback((
    fotos: any[],
    index: number
  ): any[] => {
    return fotos.filter((_, i) => i !== index);
  }, []);

  /**
   * Verifica se uma foto é válida
   */
  const isValidPhoto = useCallback((foto: any): boolean => {
    // Se é do banco de dados, verificar se tem URL
    if (foto?.isFromDatabase) {
      return foto.url && foto.url.length > 0;
    }
    // Se é externa, verificar URL
    if (foto?.isExternal) {
      return foto.url && foto.url.length > 0;
    }
    // Se é File, verificar se é válido
    const isValidFile = foto instanceof File && foto.size > 0;
    return isValidFile;
  }, []);

  /**
   * Filtra fotos válidas de uma lista
   */
  const getValidPhotos = useCallback((fotos: any[]): any[] => {
    return fotos.filter(foto => isValidPhoto(foto));
  }, [isValidPhoto]);

  /**
   * Processa colagem de imagens (Ctrl+V)
   */
  const handlePaste = useCallback((
    event: ClipboardEvent,
    onAddImages: (images: File[], tipo: 'inicial' | 'final') => void,
    tipo: 'inicial' | 'final'
  ): { success: boolean; added: number; images: File[] } => {
    const items = event.clipboardData?.items;
    if (!items) {
      return { success: false, added: 0, images: [] };
    }

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      onAddImages(files, tipo);
      return { success: true, added: files.length, images: files };
    }

    return { success: false, added: 0, images: [] };
  }, []);

  /**
   * Obtém informações resumidas das fotos
   */
  const getPhotosSummary = useCallback((fotos: any[]): {
    total: number;
    valid: number;
    invalid: number;
    fromDatabase: number;
    external: number;
    files: number;
  } => {
    const summary = {
      total: fotos.length,
      valid: 0,
      invalid: 0,
      fromDatabase: 0,
      external: 0,
      files: 0,
    };

    fotos.forEach(foto => {
      if (isValidPhoto(foto)) {
        summary.valid++;
        if (foto.isFromDatabase) {
          summary.fromDatabase++;
        } else if (foto.isExternal) {
          summary.external++;
        } else {
          summary.files++;
        }
      } else {
        summary.invalid++;
      }
    });

    return summary;
  }, [isValidPhoto]);

  /**
   * Valida se existem fotos para análise
   */
  const hasValidPhotos = useCallback((fotos: any[]): boolean => {
    const validPhotos = getValidPhotos(fotos);
    return validPhotos.length > 0;
  }, [getValidPhotos]);

  /**
   * Processa múltiplas fotos para template
   */
  const processPhotosForTemplate = useCallback(async (
    fotos: any[]
  ): Promise<any[]> => {
    const processed: any[] = [];

    for (const foto of fotos) {
      if (isValidPhoto(foto)) {
        // Se é do banco de dados, manter como está
        if (foto.isFromDatabase || foto.isExternal) {
          processed.push({
            name: foto.name,
            size: foto.size,
            type: foto.type,
            url: foto.url,
            isFromDatabase: foto.isFromDatabase,
            isExternal: foto.isExternal,
            lastModified: foto.lastModified,
          });
        } else if (foto instanceof File) {
          // Se é File, manter como está (será processado pelo template)
          processed.push(foto);
        }
      }
    }

    return processed;
  }, [isValidPhoto]);

  return {
    // Estado
    uploading,
    
    // Conversão de arquivos
    fileToBase64,
    base64ToFile,
    
    // Validação
    validateImageFiles,
    isValidPhoto,
    getValidPhotos,
    hasValidPhotos,
    
    // Upload e manipulação
    handleFileUpload,
    addExternalImage,
    removePhoto,
    handlePaste,
    
    // Análise com IA
    convertImagesForAI,
    
    // Utilitários
    getPhotosSummary,
    processPhotosForTemplate,
    
    // Setters
    setUploading,
  };
};

export default useVistoriaImages;