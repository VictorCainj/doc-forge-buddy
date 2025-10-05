import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

export interface UploadImageResult {
  url: string;
  path: string;
  base64?: string;
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param file - Arquivo de imagem
 * @param userId - ID do usuário
 * @returns URL pública da imagem e caminho
 */
export async function uploadChatImage(
  file: File,
  userId: string
): Promise<UploadImageResult> {
  try {
    // Converter para base64 primeiro (para enviar à OpenAI)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    log.debug('Uploading image to Supabase Storage:', filePath);

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      log.error('Error uploading image:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('chat-images')
      .getPublicUrl(filePath);

    log.debug('Image uploaded successfully:', publicUrl);

    return {
      url: publicUrl,
      path: filePath,
      base64, // Retornar base64 também para usar com OpenAI
    };
  } catch (error) {
    log.error('Failed to upload image:', error);
    throw error;
  }
}

/**
 * Converte base64 para File
 * @param base64 - String base64 da imagem
 * @param fileName - Nome do arquivo
 * @returns File object
 */
export function base64ToFile(base64: string, fileName: string = 'image.png'): File {
  // Remover prefixo data:image/...;base64,
  const base64Data = base64.split(',')[1] || base64;
  const mimeType = base64.match(/data:([^;]+);/)?.[1] || 'image/png';
  
  // Converter base64 para blob
  const byteString = atob(base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([ab], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

/**
 * Faz upload de múltiplas imagens
 * @param files - Array de arquivos
 * @param userId - ID do usuário
 * @returns Array de URLs públicas
 */
export async function uploadMultipleChatImages(
  files: File[],
  userId: string
): Promise<UploadImageResult[]> {
  const uploadPromises = files.map(file => uploadChatImage(file, userId));
  return Promise.all(uploadPromises);
}

/**
 * Deleta uma imagem do storage
 * @param path - Caminho do arquivo no storage
 */
export async function deleteChatImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('chat-images')
      .remove([path]);

    if (error) {
      log.error('Error deleting image:', error);
      throw new Error(`Erro ao deletar imagem: ${error.message}`);
    }

    log.debug('Image deleted successfully:', path);
  } catch (error) {
    log.error('Failed to delete image:', error);
    throw error;
  }
}
