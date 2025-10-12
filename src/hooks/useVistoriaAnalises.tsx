import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  VistoriaAnaliseWithImages,
  CreateVistoriaData,
  UpdateVistoriaData,
} from '@/types/vistoria';
import { useToast } from '@/hooks/use-toast';

export const useVistoriaAnalises = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analises, setAnalises] = useState<VistoriaAnaliseWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar todas as análises do usuário
  const fetchAnalises = useCallback(async () => {
    if (!user) {
      // eslint-disable-next-line no-console
      console.log('Usuário não autenticado, não carregando análises');
      return;
    }

    try {
      setLoading(true);
      // eslint-disable-next-line no-console
      console.log('Carregando análises para usuário:', user.id);

      // Buscar análises
      const { data: analisesData, error: analisesError } = await supabase
        .from('vistoria_analises')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analisesError) throw analisesError;

      // eslint-disable-next-line no-console
      console.log('Análises encontradas:', analisesData?.length || 0);

      // Buscar imagens para cada análise
      const analisesWithImages = await Promise.all(
        (analisesData || []).map(async (analise) => {
          // eslint-disable-next-line no-console
          console.log(`🔍 Buscando imagens para vistoria_id: ${analise.id}`);

          const { data: imagesData, error: imagesError } = await supabase
            .from('vistoria_images')
            .select('*')
            .eq('vistoria_id', analise.id)
            .order('created_at', { ascending: true });

          if (imagesError) {
            // eslint-disable-next-line no-console
            console.error('❌ Erro ao carregar imagens:', imagesError);
            return { ...analise, images: [] };
          }

          // eslint-disable-next-line no-console
          console.log(`✅ Imagens encontradas: ${imagesData?.length || 0}`);
          if (imagesData && imagesData.length > 0) {
            // eslint-disable-next-line no-console
            console.log(
              '📸 Detalhes das imagens:',
              imagesData.map((img) => ({
                apontamento_id: img.apontamento_id,
                tipo: img.tipo_vistoria,
                file_name: img.file_name,
                url: img.image_url,
              }))
            );
          }

          return {
            ...analise,
            images: imagesData || [],
          };
        })
      );

      setAnalises(analisesWithImages as unknown as VistoriaAnaliseWithImages[]);
      // eslint-disable-next-line no-console
      console.log(
        'Análises carregadas com sucesso:',
        analisesWithImages.length
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao carregar análises:', error);
      toast({
        title: 'Erro ao carregar análises',
        description: 'Não foi possível carregar as análises de vistoria.',
        variant: 'destructive',
      });
      setAnalises([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Salvar nova análise ou atualizar existente (baseado no contract_id)
  const saveAnalise = async (
    data: CreateVistoriaData
  ): Promise<string | null> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para salvar análises.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setSaving(true);

      // Verificar se já existe uma análise para este contrato
      const { data: existingAnalise, error: checkError } = await supabase
        .from('vistoria_analises')
        .select('id')
        .eq('contract_id', data.contract_id as string)
        .eq('user_id', user.id)
        .single();

      let analiseId: string;
      let isUpdate = false;

      if (existingAnalise && !checkError) {
        // Atualizar análise existente
        isUpdate = true;
        analiseId = existingAnalise.id;

        const { error: updateError } = await supabase
          .from('vistoria_analises')
          .update({
            title: data.title,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dados_vistoria: data.dados_vistoria as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apontamentos: data.apontamentos as any,
          })
          .eq('id', analiseId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Remover TODAS as imagens antigas antes de processar
        // (serão re-inseridas com as novas no processAndSaveImages)
        await supabase
          .from('vistoria_images')
          .delete()
          .eq('vistoria_id', analiseId);
      } else {
        // Criar nova análise
        const { data: analiseData, error: analiseError } = await supabase
          .from('vistoria_analises')
          .insert({
            title: data.title,
            contract_id: data.contract_id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dados_vistoria: data.dados_vistoria as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apontamentos: data.apontamentos as any,
            user_id: user.id,
          })
          .select()
          .single();

        if (analiseError) throw analiseError;
        analiseId = analiseData.id;
      }

      // Processar e salvar imagens (não crítico para o salvamento)
      try {
        await processAndSaveImages(analiseId, data.apontamentos);
      } catch (imageError) {
        // eslint-disable-next-line no-console
        console.warn(
          'Erro ao salvar imagens, mas análise foi salva:',
          imageError
        );
      }

      toast({
        title: isUpdate ? 'Análise atualizada' : 'Análise salva',
        description: isUpdate
          ? 'A análise de vistoria foi atualizada com sucesso.'
          : 'A análise de vistoria foi salva com sucesso.',
      });

      // Recarregar lista
      await fetchAnalises();

      return analiseId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao salvar análise:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a análise de vistoria.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Atualizar análise existente
  const updateAnalise = async (
    id: string,
    data: UpdateVistoriaData
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para atualizar análises.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);

      // Atualizar análise principal
      const { error: analiseError } = await supabase
        .from('vistoria_analises')
        .update({
          title: data.title,
          contract_id: data.contract_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dados_vistoria: data.dados_vistoria as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          apontamentos: data.apontamentos as any,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (analiseError) throw analiseError;

      // Remover TODAS as imagens antigas antes de processar
      // (serão re-inseridas com as novas no processAndSaveImages)
      await supabase.from('vistoria_images').delete().eq('vistoria_id', id);

      // Processar e salvar novas imagens
      if (data.apontamentos) {
        await processAndSaveImages(id, data.apontamentos);
      }

      toast({
        title: 'Análise atualizada',
        description: 'A análise de vistoria foi atualizada com sucesso.',
      });

      // Recarregar lista
      await fetchAnalises();

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao atualizar análise:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a análise de vistoria.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Deletar análise
  const deleteAnalise = async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para deletar análises.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);

      // Deletar análise (as imagens serão deletadas automaticamente devido ao CASCADE)
      const { error } = await supabase
        .from('vistoria_analises')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Análise deletada',
        description: 'A análise de vistoria foi deletada com sucesso.',
      });

      // Recarregar lista
      await fetchAnalises();

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao deletar análise:', error);
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar a análise de vistoria.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Carregar análise específica
  const getAnaliseById = async (
    id: string
  ): Promise<VistoriaAnaliseWithImages | null> => {
    if (!user) return null;

    try {
      // Buscar análise
      const { data: analiseData, error: analiseError } = await supabase
        .from('vistoria_analises')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (analiseError) throw analiseError;

      // Buscar imagens
      const { data: imagesData, error: imagesError } = await supabase
        .from('vistoria_images')
        .select('*')
        .eq('vistoria_id', id)
        .order('created_at', { ascending: true });

      if (imagesError) throw imagesError;

      return {
        ...analiseData,
        images: imagesData || [],
      } as unknown as VistoriaAnaliseWithImages;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao carregar análise:', error);
      return null;
    }
  };

  // Processar e salvar imagens
  const processAndSaveImages = async (
    vistoriaId: string,
    apontamentos: unknown[]
  ) => {
    try {
      // eslint-disable-next-line no-console
      console.log('=== PROCESSANDO IMAGENS PARA VISTORIA:', vistoriaId, '===');
      // eslint-disable-next-line no-console
      console.log('Total de apontamentos:', apontamentos.length);

      const imagePromises: Promise<unknown>[] = [];
      const existingImageRefs: Array<{
        apontamento_id: string;
        tipo_vistoria: 'inicial' | 'final';
        image_url: string;
        file_name: string;
        file_size: number;
        file_type: string;
      }> = [];

      for (let i = 0; i < apontamentos.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apontamentoData = apontamentos[i] as any;

        // eslint-disable-next-line no-console
        console.log(
          `\n--- Apontamento ${i + 1}: ${apontamentoData.ambiente || 'Sem nome'} ---`
        );

        // Processar fotos da vistoria inicial
        if (apontamentoData.vistoriaInicial?.fotos) {
          const fotosIniciais = apontamentoData.vistoriaInicial.fotos;
          // eslint-disable-next-line no-console
          console.log('Fotos vistoria inicial:', fotosIniciais.length);

          for (let j = 0; j < fotosIniciais.length; j++) {
            const foto = fotosIniciais[j];
            // eslint-disable-next-line no-console
            console.log(`  Foto inicial ${j + 1}:`, {
              isFile: foto instanceof File,
              isFromDatabase: foto?.isFromDatabase,
              isExternal: foto?.isExternal,
              name: foto?.name,
              url: foto?.url,
            });

            if (foto instanceof File) {
              // Nova imagem - fazer upload
              // eslint-disable-next-line no-console
              console.log('  → Upload de nova imagem:', foto.name);
              imagePromises.push(
                uploadImageToStorage(
                  foto,
                  vistoriaId,
                  apontamentoData.id,
                  'inicial'
                )
              );
            } else if (foto?.isFromDatabase && foto?.url) {
              // Imagem já existe no banco - preservar referência
              // eslint-disable-next-line no-console
              console.log('  → Preservando imagem do banco:', foto.url);
              existingImageRefs.push({
                apontamento_id: apontamentoData.id,
                tipo_vistoria: 'inicial',
                image_url: foto.url,
                file_name: foto.name || 'unknown',
                file_size: foto.size || 0,
                file_type: foto.type || 'image/jpeg',
              });
            } else if (foto?.isExternal && foto?.url) {
              // Imagem externa - salvar URL diretamente
              // eslint-disable-next-line no-console
              console.log('  → Salvando imagem externa:', foto.url);
              existingImageRefs.push({
                apontamento_id: apontamentoData.id,
                tipo_vistoria: 'inicial',
                image_url: foto.url,
                file_name: foto.name || 'imagem_externa',
                file_size: foto.size || 0,
                file_type: foto.type || 'image/external',
              });
            }
          }
        }

        // Processar fotos da vistoria final
        if (apontamentoData.vistoriaFinal?.fotos) {
          const fotosFinais = apontamentoData.vistoriaFinal.fotos;
          // eslint-disable-next-line no-console
          console.log('Fotos vistoria final:', fotosFinais.length);

          for (let j = 0; j < fotosFinais.length; j++) {
            const foto = fotosFinais[j];
            // eslint-disable-next-line no-console
            console.log(`  Foto final ${j + 1}:`, {
              isFile: foto instanceof File,
              isFromDatabase: foto?.isFromDatabase,
              isExternal: foto?.isExternal,
              name: foto?.name,
              url: foto?.url,
            });

            if (foto instanceof File) {
              // Nova imagem - fazer upload
              // eslint-disable-next-line no-console
              console.log('  → Upload de nova imagem:', foto.name);
              imagePromises.push(
                uploadImageToStorage(
                  foto,
                  vistoriaId,
                  apontamentoData.id,
                  'final'
                )
              );
            } else if (foto?.isFromDatabase && foto?.url) {
              // Imagem já existe no banco - preservar referência
              // eslint-disable-next-line no-console
              console.log('  → Preservando imagem do banco:', foto.url);
              existingImageRefs.push({
                apontamento_id: apontamentoData.id,
                tipo_vistoria: 'final',
                image_url: foto.url,
                file_name: foto.name || 'unknown',
                file_size: foto.size || 0,
                file_type: foto.type || 'image/jpeg',
              });
            } else if (foto?.isExternal && foto?.url) {
              // Imagem externa - salvar URL diretamente
              // eslint-disable-next-line no-console
              console.log('  → Salvando imagem externa:', foto.url);
              existingImageRefs.push({
                apontamento_id: apontamentoData.id,
                tipo_vistoria: 'final',
                image_url: foto.url,
                file_name: foto.name || 'imagem_externa',
                file_size: foto.size || 0,
                file_type: foto.type || 'image/external',
              });
            }
          }
        }
      }

      // eslint-disable-next-line no-console
      console.log('\n=== RESUMO DO PROCESSAMENTO ===');
      // eslint-disable-next-line no-console
      console.log('Novas imagens para upload:', imagePromises.length);
      // eslint-disable-next-line no-console
      console.log('Imagens existentes preservadas:', existingImageRefs.length);

      // Aguardar upload de todas as novas imagens
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
        // eslint-disable-next-line no-console
        console.log('✓ Todas as novas imagens foram enviadas com sucesso');
      }

      // Re-inserir referências de imagens existentes
      if (existingImageRefs.length > 0) {
        const { error: insertError } = await supabase
          .from('vistoria_images')
          .insert(
            existingImageRefs.map((ref) => ({
              vistoria_id: vistoriaId,
              apontamento_id: ref.apontamento_id,
              tipo_vistoria: ref.tipo_vistoria,
              image_url: ref.image_url,
              file_name: ref.file_name,
              file_size: ref.file_size,
              file_type: ref.file_type,
              user_id: user?.id,
            }))
          );

        if (insertError) {
          // eslint-disable-next-line no-console
          console.error('Erro ao re-inserir imagens existentes:', insertError);
        } else {
          // eslint-disable-next-line no-console
          console.log('✓ Imagens existentes re-inseridas com sucesso');
        }
      }

      // eslint-disable-next-line no-console
      console.log('=== PROCESSAMENTO DE IMAGENS CONCLUÍDO ===\n');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Erro ao processar imagens:', error);
      // Não re-lançar o erro para não quebrar o salvamento da análise principal
    }
  };

  // Upload de imagem para o Supabase Storage
  const uploadImageToStorage = async (
    file: File,
    vistoriaId: string,
    apontamentoId: string,
    tipoVistoria: 'inicial' | 'final'
  ) => {
    if (!user) return;

    try {
      // Verificar se o bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(
        (bucket) => bucket.name === 'vistoria-images'
      );

      if (!bucketExists) {
        // eslint-disable-next-line no-console
        console.warn('Bucket vistoria-images não existe. Criando...');
        const { error: createError } = await supabase.storage.createBucket(
          'vistoria-images',
          {
            public: true,
            allowedMimeTypes: [
              'image/jpeg',
              'image/png',
              'image/webp',
              'image/gif',
            ],
            fileSizeLimit: 10485760, // 10MB
          }
        );

        if (createError) {
          // eslint-disable-next-line no-console
          console.error('Erro ao criar bucket:', createError);
          // Continuar mesmo se não conseguir criar o bucket
        }
      }

      // Gerar nome único para o arquivo (incluindo user_id para políticas de segurança)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${vistoriaId}/${apontamentoId}/${tipoVistoria}/${Date.now()}.${fileExt}`;

      // Upload para o Supabase Storage
      // eslint-disable-next-line no-console
      console.log('Fazendo upload da imagem:', fileName, 'Tamanho:', file.size);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vistoria-images')
        .upload(fileName, file);

      if (uploadError) {
        // eslint-disable-next-line no-console
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      // eslint-disable-next-line no-console
      console.log('Upload realizado com sucesso:', uploadData);

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('vistoria-images').getPublicUrl(fileName);

      // Salvar referência no banco
      const { error: dbError } = await supabase.from('vistoria_images').insert({
        vistoria_id: vistoriaId,
        apontamento_id: apontamentoId,
        tipo_vistoria: tipoVistoria,
        image_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        user_id: user.id,
      });

      if (dbError) {
        // eslint-disable-next-line no-console
        console.error('Erro ao salvar referência no banco:', dbError);
        throw dbError;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  };

  // Carregar análises quando o componente montar
  useEffect(() => {
    if (user) {
      fetchAnalises();
    }
  }, [user, fetchAnalises]);

  return {
    analises,
    loading,
    saving,
    fetchAnalises,
    saveAnalise,
    updateAnalise,
    deleteAnalise,
    getAnaliseById,
  };
};
