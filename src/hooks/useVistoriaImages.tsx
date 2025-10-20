import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { generateUniqueImageSerial } from '@/utils/imageSerialGenerator';

export interface ImageUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const useVistoriaImages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress[]>(
    []
  );
  const [uploading, setUploading] = useState(false);

  // Upload de múltiplas imagens
  const uploadImages = async (
    files: File[],
    vistoriaId: string,
    apontamentoId: string,
    tipoVistoria: 'inicial' | 'final'
  ): Promise<string[]> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para fazer upload de imagens.',
        variant: 'destructive',
      });
      return [];
    }

    if (files.length === 0) return [];

    setUploading(true);
    setUploadProgress([]);

    const uploadedUrls: string[] = [];

    try {
      // Inicializar progresso
      const initialProgress = files.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: 'uploading' as const,
      }));
      setUploadProgress(initialProgress);

      // Upload de cada arquivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // ✅ PROTEÇÃO 6: Verificar se já existe imagem com mesmo nome
          const { data: existingImage } = await supabase
            .from('vistoria_images')
            .select('id, image_url')
            .eq('vistoria_id', vistoriaId)
            .eq('apontamento_id', apontamentoId)
            .eq('tipo_vistoria', tipoVistoria)
            .eq('file_name', file.name)
            .maybeSingle();

          if (existingImage) {
            // eslint-disable-next-line no-console
            console.warn('⚠️ Imagem já existe, pulando upload:', file.name);
            setUploadProgress((prev) =>
              prev.map((item, index) =>
                index === i
                  ? { ...item, progress: 100, status: 'completed' }
                  : item
              )
            );
            uploadedUrls.push(existingImage.image_url);
            continue;
          }

          // Atualizar progresso
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i ? { ...item, progress: 25 } : item
            )
          );

          // Gerar nome único para o arquivo
          const fileExt = file.name.split('.').pop();
          const fileName = `${vistoriaId}/${apontamentoId}/${tipoVistoria}/${Date.now()}_${i}.${fileExt}`;

          // Upload para o Supabase Storage
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i ? { ...item, progress: 50 } : item
            )
          );

          const { data: _uploadData, error: uploadError } =
            await supabase.storage
              .from('vistoria-images')
              .upload(fileName, file);

          if (uploadError) throw uploadError;

          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i ? { ...item, progress: 75 } : item
            )
          );

          // Obter URL pública
          const {
            data: { publicUrl },
          } = supabase.storage.from('vistoria-images').getPublicUrl(fileName);

          // Gerar número de série único para a imagem
          const imageSerial = await generateUniqueImageSerial(
            vistoriaId,
            apontamentoIndex || 1, // Fallback para 1 se não especificado
            tipoVistoria as 'inicial' | 'final',
            1 // Começar com índice 1
          );

          // Salvar referência no banco
          const { error: dbError } = await supabase
            .from('vistoria_images')
            .insert({
              vistoria_id: vistoriaId,
              apontamento_id: apontamentoId,
              tipo_vistoria: tipoVistoria,
              image_url: publicUrl,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              image_serial: imageSerial,
              user_id: user.id,
            });

          if (dbError) throw dbError;

          // Marcar como concluído
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? { ...item, progress: 100, status: 'completed' }
                : item
            )
          );

          uploadedUrls.push(publicUrl);
        } catch (error) {
          // Marcar como erro
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? {
                    ...item,
                    status: 'error',
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Erro desconhecido',
                  }
                : item
            )
          );
        }
      }

      // Verificar se houve erros
      const hasErrors = uploadProgress.some((item) => item.status === 'error');

      if (hasErrors) {
        toast({
          title: 'Upload parcialmente concluído',
          description:
            'Algumas imagens não foram carregadas. Verifique os detalhes.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Upload concluído',
          description: `${files.length} imagem(ns) carregada(s) com sucesso.`,
        });
      }

      return uploadedUrls;
    } catch {
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload das imagens.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setUploading(false);
      // Limpar progresso após 3 segundos
      setTimeout(() => setUploadProgress([]), 3000);
    }
  };

  // Upload de uma única imagem
  const uploadSingleImage = async (
    file: File,
    vistoriaId: string,
    apontamentoId: string,
    tipoVistoria: 'inicial' | 'final'
  ): Promise<string | null> => {
    const urls = await uploadImages(
      [file],
      vistoriaId,
      apontamentoId,
      tipoVistoria
    );
    return urls.length > 0 ? urls[0] : null;
  };

  // Deletar imagem
  const deleteImage = async (
    imageUrl: string,
    vistoriaId: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para deletar imagens.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Extrair nome do arquivo da URL
      const fileName = imageUrl.split('/').pop();
      if (!fileName) throw new Error('Nome do arquivo não encontrado');

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('vistoria-images')
        .remove([`${vistoriaId}/**/${fileName}`]);

      if (storageError) {
        // Erro no storage, mas continuar com a exclusão do banco
        // console.warn('Erro no storage:', storageError);
      }

      // Deletar referência do banco
      const { error: dbError } = await supabase
        .from('vistoria_images')
        .delete()
        .eq('image_url', imageUrl)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      toast({
        title: 'Imagem deletada',
        description: 'A imagem foi deletada com sucesso.',
      });

      return true;
    } catch {
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar a imagem.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Obter URL pública de uma imagem
  const getImageUrl = (imagePath: string): string => {
    const {
      data: { publicUrl },
    } = supabase.storage.from('vistoria-images').getPublicUrl(imagePath);

    return publicUrl;
  };

  // Converter File para base64 (para pré-visualização)
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  // Converter base64 para File (para recuperar dados)
  const base64ToFile = useCallback(
    (base64: string, filename: string, mimeType: string): File => {
      try {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;

        // Verificar se o base64 é válido antes de decodificar
        if (!arr[1] || arr[1].trim() === '') {
          console.warn('Base64 string is empty or invalid:', base64);
          return new File([], filename, { type: mimeType });
        }

        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      } catch (error) {
        console.error('Erro ao converter base64 para File:', error);
        console.error('Base64 problemático:', base64);
        // Retornar um arquivo vazio como fallback
        return new File([], filename, { type: mimeType });
      }
    },
    []
  );

  return {
    uploadImages,
    uploadSingleImage,
    deleteImage,
    getImageUrl,
    fileToBase64,
    base64ToFile,
    uploadProgress,
    uploading,
  };
};
