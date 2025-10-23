import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  VistoriaAnaliseWithImages,
  CreateVistoriaData,
  UpdateVistoriaData,
} from '@/types/vistoria';
import { useToast } from '@/hooks/use-toast';
import {
  toSupabaseJson,
  UpdateVistoriaAnalisePayload,
} from '@/types/vistoria.extended';
import {
  generateUniqueImageSerial,
  deduplicateImagesBySerial,
} from '@/utils/imageSerialGenerator';

export const useVistoriaAnalises = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analises, setAnalises] = useState<VistoriaAnaliseWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Controle para prevenir processamento simultâneo de imagens
  const [processingImages, setProcessingImages] = useState<Set<string>>(
    new Set()
  );

  // ✅ Cache de imagens processadas para evitar reprocessamento
  const [processedImagesCache] = useState<Map<string, Set<string>>>(new Map());

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

        const updatePayload: UpdateVistoriaAnalisePayload = {
          title: data.title,
          dados_vistoria: data.dados_vistoria
            ? toSupabaseJson(data.dados_vistoria)
            : undefined,
          apontamentos: data.apontamentos
            ? toSupabaseJson(data.apontamentos)
            : undefined,
        };

        const { error: updateError } = await supabase
          .from('vistoria_analises')
          .update(updatePayload)
          .eq('id', analiseId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // ✅ PROTEÇÃO 4: NÃO deletar todas as imagens
        // A função processAndSaveImages agora preserva imagens existentes
        // e adiciona apenas as novas
      } else {
        // Criar nova análise
        const { data: analiseData, error: analiseError } = await supabase
          .from('vistoria_analises')
          .insert({
            title: data.title,
            contract_id: data.contract_id,
            dados_vistoria: data.dados_vistoria
              ? toSupabaseJson(data.dados_vistoria)
              : null,
            apontamentos: data.apontamentos
              ? toSupabaseJson(data.apontamentos)
              : null,
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
      const updatePayload: UpdateVistoriaAnalisePayload = {
        title: data.title,
        dados_vistoria: data.dados_vistoria
          ? toSupabaseJson(data.dados_vistoria)
          : undefined,
        apontamentos: data.apontamentos
          ? toSupabaseJson(data.apontamentos)
          : undefined,
      };

      const { error: analiseError } = await supabase
        .from('vistoria_analises')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id);

      if (analiseError) throw analiseError;

      // ✅ PROTEÇÃO 4: NÃO deletar todas as imagens
      // A função processAndSaveImages agora preserva imagens existentes
      // e adiciona apenas as novas

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

  // Processar e salvar imagens com proteção contra duplicação
  const processAndSaveImages = async (
    vistoriaId: string,
    apontamentos: unknown[]
  ) => {
    // ✅ PROTEÇÃO 1: Prevenir processamento simultâneo
    if (processingImages.has(vistoriaId)) {
      // eslint-disable-next-line no-console
      console.warn(
        '⚠️ Processamento de imagens já em andamento para:',
        vistoriaId
      );
      return;
    }

    try {
      // Marcar como em processamento
      setProcessingImages((prev) => new Set(prev).add(vistoriaId));

      // eslint-disable-next-line no-console
      console.log('=== PROCESSANDO IMAGENS PARA VISTORIA:', vistoriaId, '===');
      // eslint-disable-next-line no-console
      console.log('Total de apontamentos:', apontamentos.length);

      // ✅ PROTEÇÃO 2: Buscar imagens existentes no banco ANTES de processar
      const { data: existingDbImages } = await supabase
        .from('vistoria_images')
        .select('id, image_url, apontamento_id, tipo_vistoria, file_name')
        .eq('vistoria_id', vistoriaId);

      // eslint-disable-next-line no-console
      console.log(
        '📊 Imagens já existentes no banco:',
        existingDbImages?.length || 0
      );
      if (existingDbImages && existingDbImages.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          '📸 IDs das imagens existentes:',
          existingDbImages.map((img) => img.id)
        );
      }

      // ✅ Cache de imagens processadas para esta vistoria
      const cacheKey = vistoriaId;
      if (!processedImagesCache.has(cacheKey)) {
        processedImagesCache.set(cacheKey, new Set());
      }
      const processedUrls = processedImagesCache.get(cacheKey)!;

      const imagePromises: Promise<unknown>[] = [];
      const externalImageRefs: Array<{
        apontamento_id: string;
        tipo_vistoria: 'inicial' | 'final';
        image_url: string;
        file_name: string;
        file_size: number;
        file_type: string;
      }> = [];

      for (let i = 0; i < apontamentos.length; i++) {
        const apontamentoData = apontamentos[i] as Record<string, unknown>;

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
              // ✅ Nova imagem - fazer upload
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
              // ✅ PROTEÇÃO 3: Imagem já existe no banco - NÃO re-inserir, apenas ignorar
              // Registrar no cache
              processedUrls.add(foto.url);
              // eslint-disable-next-line no-console
              console.log(
                '  ✓ Imagem do banco preservada (não será re-inserida):',
                foto.url
              );
            } else if (foto?.isExternal && foto?.url) {
              // ✅ Imagem externa - verificar se já existe antes de adicionar
              const alreadyExists = existingDbImages?.some(
                (dbImg) =>
                  dbImg.image_url === foto.url &&
                  dbImg.apontamento_id === apontamentoData.id &&
                  dbImg.tipo_vistoria === 'inicial'
              );

              if (!alreadyExists) {
                // eslint-disable-next-line no-console
                console.log('  → Salvando imagem externa:', foto.url);
                externalImageRefs.push({
                  apontamento_id: apontamentoData.id,
                  tipo_vistoria: 'inicial',
                  image_url: foto.url,
                  file_name: foto.name || 'imagem_externa',
                  file_size: foto.size || 0,
                  file_type: foto.type || 'image/external',
                });
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  '  ⚠️ Imagem externa já existe, ignorando:',
                  foto.url
                );
              }
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
              // ✅ Nova imagem - fazer upload
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
              // ✅ PROTEÇÃO 3: Imagem já existe no banco - NÃO re-inserir, apenas ignorar
              // Registrar no cache
              processedUrls.add(foto.url);
              // eslint-disable-next-line no-console
              console.log(
                '  ✓ Imagem do banco preservada (não será re-inserida):',
                foto.url
              );
            } else if (foto?.isExternal && foto?.url) {
              // ✅ Imagem externa - verificar se já existe antes de adicionar
              const alreadyExists = existingDbImages?.some(
                (dbImg) =>
                  dbImg.image_url === foto.url &&
                  dbImg.apontamento_id === apontamentoData.id &&
                  dbImg.tipo_vistoria === 'final'
              );

              if (!alreadyExists) {
                // eslint-disable-next-line no-console
                console.log('  → Salvando imagem externa:', foto.url);
                externalImageRefs.push({
                  apontamento_id: apontamentoData.id,
                  tipo_vistoria: 'final',
                  image_url: foto.url,
                  file_name: foto.name || 'imagem_externa',
                  file_size: foto.size || 0,
                  file_type: foto.type || 'image/external',
                });
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  '  ⚠️ Imagem externa já existe, ignorando:',
                  foto.url
                );
              }
            }
          }
        }
      }

      // eslint-disable-next-line no-console
      console.log('\n=== RESUMO DO PROCESSAMENTO ===');
      // eslint-disable-next-line no-console
      console.log('Novas imagens para upload:', imagePromises.length);
      // eslint-disable-next-line no-console
      console.log('Imagens externas para inserir:', externalImageRefs.length);
      // eslint-disable-next-line no-console
      console.log(
        'Imagens do banco preservadas (não re-inseridas):',
        existingDbImages?.length || 0
      );

      // Aguardar upload de todas as novas imagens
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
        // eslint-disable-next-line no-console
        console.log('✓ Todas as novas imagens foram enviadas com sucesso');
      }

      // ✅ PROTEÇÃO 4: Inserir apenas imagens externas novas (não duplicadas)
      if (externalImageRefs.length > 0) {
        // Filtrar novamente para garantir que não há duplicatas
        const uniqueRefs = externalImageRefs.filter(
          (ref, index, self) =>
            index ===
            self.findIndex(
              (r) =>
                r.image_url === ref.image_url &&
                r.apontamento_id === ref.apontamento_id &&
                r.tipo_vistoria === ref.tipo_vistoria
            )
        );

        if (uniqueRefs.length < externalImageRefs.length) {
          // eslint-disable-next-line no-console
          console.warn(
            '⚠️ Duplicatas removidas:',
            externalImageRefs.length - uniqueRefs.length
          );
        }

        if (uniqueRefs.length > 0) {
          // Gerar seriais únicos para imagens externas
          const refsWithSerials = await Promise.all(
            uniqueRefs.map(async (ref, index) => {
              const imageSerial = await generateUniqueImageSerial(
                vistoriaId,
                1, // Apontamento index - será ajustado quando tivermos o contexto completo
                ref.tipo_vistoria,
                index + 1
              );

              return {
                vistoria_id: vistoriaId,
                apontamento_id: ref.apontamento_id,
                tipo_vistoria: ref.tipo_vistoria,
                image_url: ref.image_url,
                image_serial: imageSerial,
                file_name: ref.file_name,
                file_size: ref.file_size,
                file_type: ref.file_type,
                user_id: user?.id,
              };
            })
          );

          const { error: insertError } = await supabase
            .from('vistoria_images')
            .insert(refsWithSerials);

          if (insertError) {
            // eslint-disable-next-line no-console
            console.error('❌ Erro ao inserir imagens externas:', insertError);
          } else {
            // eslint-disable-next-line no-console
            console.log(
              '✓ Imagens externas inseridas com sucesso:',
              uniqueRefs.length
            );
          }
        }
      }

      // eslint-disable-next-line no-console
      console.log('=== PROCESSAMENTO DE IMAGENS CONCLUÍDO ===\n');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Erro ao processar imagens:', error);
      // Não re-lançar o erro para não quebrar o salvamento da análise principal
    } finally {
      // ✅ PROTEÇÃO 1: Remover flag de processamento
      setProcessingImages((prev) => {
        const next = new Set(prev);
        next.delete(vistoriaId);
        return next;
      });
    }
  };

  // Upload de imagem para o Supabase Storage com proteção contra duplicação
  const uploadImageToStorage = async (
    file: File,
    vistoriaId: string,
    apontamentoId: string,
    tipoVistoria: 'inicial' | 'final'
  ) => {
    if (!user) return;

    try {
      // ✅ PROTEÇÃO 5: Verificar se já existe imagem com mesmo nome antes do upload
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
        console.warn('⚠️ Imagem já existe no banco, pulando upload:', {
          file: file.name,
          existing_id: existingImage.id,
          url: existingImage.image_url,
        });
        return;
      }

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
      console.log(
        '📤 Fazendo upload da imagem:',
        fileName,
        'Tamanho:',
        file.size
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vistoria-images')
        .upload(fileName, file);

      if (uploadError) {
        // eslint-disable-next-line no-console
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      // eslint-disable-next-line no-console
      console.log('✓ Upload realizado com sucesso:', uploadData);

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('vistoria-images').getPublicUrl(fileName);

      // Gerar número de série único para a imagem
      const imageSerial = await generateUniqueImageSerial(
        vistoriaId,
        1, // Apontamento index - será ajustado quando tivermos o contexto completo
        tipoVistoria,
        1 // Image index - será ajustado quando tivermos o contexto completo
      );

      // Salvar referência no banco
      const { error: dbError } = await supabase.from('vistoria_images').insert({
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

      if (dbError) {
        // eslint-disable-next-line no-console
        console.error('❌ Erro ao salvar referência no banco:', dbError);
        throw dbError;
      }

      // eslint-disable-next-line no-console
      console.log('✓ Referência salva no banco para:', file.name);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Erro ao fazer upload da imagem:', error);
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
