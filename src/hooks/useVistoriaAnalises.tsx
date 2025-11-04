// @ts-nocheck
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
  cleanPayload,
} from '@/types/vistoria.extended';
import { generateUniqueImageSerial } from '@/utils/imageSerialGenerator';
import { log } from '@/utils/logger';

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
      log.debug('Usuário não autenticado, não carregando análises');
      return;
    }

    try {
      setLoading(true);
      log.debug('Carregando análises para usuário:', user.id);

      // Buscar análises
      const { data: analisesData, error: analisesError } = await supabase
        .from('vistoria_analises')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analisesError) throw analisesError;

      log.debug('Análises encontradas:', analisesData?.length || 0);

      // Buscar imagens para cada análise
      const analisesWithImages = await Promise.all(
        (analisesData || []).map(async (analise) => {
          log.debug(`🔍 Buscando imagens para vistoria_id: ${analise.id}`);

          const { data: imagesData, error: imagesError } = await supabase
            .from('vistoria_images')
            .select('*')
            .eq('vistoria_id', analise.id)
            .order('created_at', { ascending: true });

          if (imagesError) {
            log.error('❌ Erro ao carregar imagens:', imagesError);
            return { ...analise, images: [] };
          }

          log.debug(`✅ Imagens encontradas: ${imagesData?.length || 0}`);
          if (imagesData && imagesData.length > 0) {
            log.debug(
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
      log.info('Análises carregadas com sucesso:', analisesWithImages.length);
    } catch (error) {
      log.error('Erro ao carregar análises:', error);
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

        // Remover campos undefined do payload para evitar problemas com RLS
        const cleanedPayload = cleanPayload(updatePayload);

        const { error: updateError } = await supabase
          .from('vistoria_analises')
          .update(cleanedPayload)
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
        log.warn(
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
      log.error('Erro ao salvar análise:', error);
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

      // Remover campos undefined do payload para evitar problemas com RLS
      const cleanedPayload = cleanPayload(updatePayload);

      const { error: analiseError } = await supabase
        .from('vistoria_analises')
        .update(cleanedPayload)
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
      log.error('Erro ao atualizar análise:', error);
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
      log.error('Erro ao deletar análise:', error);
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
      log.error('Erro ao carregar análise:', error);
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
      log.warn(
        '⚠️ Processamento de imagens já em andamento para:',
        vistoriaId
      );
      return;
    }

    try {
      // Marcar como em processamento
      setProcessingImages((prev) => new Set(prev).add(vistoriaId));

      log.debug('=== PROCESSANDO IMAGENS PARA VISTORIA:', vistoriaId, '===');
      log.debug('Total de apontamentos:', apontamentos.length);

      // ✅ PROTEÇÃO 2: Buscar imagens existentes no banco ANTES de processar
      const { data: existingDbImages } = await supabase
        .from('vistoria_images')
        .select('id, image_url, apontamento_id, tipo_vistoria, file_name')
        .eq('vistoria_id', vistoriaId);

      log.debug(
        '📊 Imagens já existentes no banco:',
        existingDbImages?.length || 0
      );
      if (existingDbImages && existingDbImages.length > 0) {
        log.debug(
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

        log.debug(
          `\n--- Apontamento ${i + 1}: ${apontamentoData.ambiente || 'Sem nome'} ---`
        );

        // Processar fotos da vistoria inicial
        const vistoriaInicial = apontamentoData.vistoriaInicial as any;
        if (vistoriaInicial?.fotos && Array.isArray(vistoriaInicial.fotos)) {
          const fotosIniciais = vistoriaInicial.fotos;
          log.debug('Fotos vistoria inicial:', fotosIniciais.length);

          for (let j = 0; j < fotosIniciais.length; j++) {
            const foto = fotosIniciais[j];
            log.debug(`  Foto inicial ${j + 1}:`, {
              isFile: foto instanceof File,
              isFromDatabase: foto?.isFromDatabase,
              isExternal: foto?.isExternal,
              name: foto?.name,
              url: foto?.url,
            });

            if (foto instanceof File) {
              // ✅ Nova imagem - fazer upload
              log.debug('  → Upload de nova imagem:', foto.name);
              const apontamentoId =
                typeof apontamentoData.id === 'string'
                  ? apontamentoData.id
                  : String(apontamentoData.id);
              imagePromises.push(
                uploadImageToStorage(foto, vistoriaId, apontamentoId, 'inicial')
              );
            } else if (foto?.isFromDatabase && foto?.url) {
              // ✅ PROTEÇÃO 3: Imagem já existe no banco - NÃO re-inserir, apenas ignorar
              // Registrar no cache
              processedUrls.add(foto.url);
              log.debug(
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
                log.debug('  → Salvando imagem externa:', foto.url);
                const apontamentoId =
                  typeof apontamentoData.id === 'string'
                    ? apontamentoData.id
                    : String(apontamentoData.id);
                externalImageRefs.push({
                  apontamento_id: apontamentoId,
                  tipo_vistoria: 'inicial',
                  image_url: foto.url,
                  file_name: foto.name || 'imagem_externa',
                  file_size: foto.size || 0,
                  file_type: foto.type || 'image/external',
                });
              } else {
                log.debug(
                  '  ⚠️ Imagem externa já existe, ignorando:',
                  foto.url
                );
              }
            }
          }
        }

        // Processar fotos da vistoria final
        const vistoriaFinal = apontamentoData.vistoriaFinal as any;
        if (vistoriaFinal?.fotos && Array.isArray(vistoriaFinal.fotos)) {
          const fotosFinais = vistoriaFinal.fotos;
          log.debug('Fotos vistoria final:', fotosFinais.length);

          for (let j = 0; j < fotosFinais.length; j++) {
            const foto = fotosFinais[j];
            log.debug(`  Foto final ${j + 1}:`, {
              isFile: foto instanceof File,
              isFromDatabase: foto?.isFromDatabase,
              isExternal: foto?.isExternal,
              name: foto?.name,
              url: foto?.url,
            });

            if (foto instanceof File) {
              // ✅ Nova imagem - fazer upload
              log.debug('  → Upload de nova imagem:', foto.name);
              const apontamentoId =
                typeof apontamentoData.id === 'string'
                  ? apontamentoData.id
                  : String(apontamentoData.id);
              imagePromises.push(
                uploadImageToStorage(foto, vistoriaId, apontamentoId, 'final')
              );
            } else if (foto?.isFromDatabase && foto?.url) {
              // ✅ PROTEÇÃO 3: Imagem já existe no banco - NÃO re-inserir, apenas ignorar
              // Registrar no cache
              processedUrls.add(foto.url);
              log.debug(
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
                log.debug('  → Salvando imagem externa:', foto.url);
                const apontamentoId =
                  typeof apontamentoData.id === 'string'
                    ? apontamentoData.id
                    : String(apontamentoData.id);
                externalImageRefs.push({
                  apontamento_id: apontamentoId,
                  tipo_vistoria: 'final',
                  image_url: foto.url,
                  file_name: foto.name || 'imagem_externa',
                  file_size: foto.size || 0,
                  file_type: foto.type || 'image/external',
                });
              } else {
                log.debug(
                  '  ⚠️ Imagem externa já existe, ignorando:',
                  foto.url
                );
              }
            }
          }
        }
      }

      log.debug('\n=== RESUMO DO PROCESSAMENTO ===');
      log.debug('Novas imagens para upload:', imagePromises.length);
      log.debug('Imagens externas para inserir:', externalImageRefs.length);
      log.debug(
        'Imagens do banco preservadas (não re-inseridas):',
        existingDbImages?.length || 0
      );

      // Aguardar upload de todas as novas imagens
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
        log.debug('✓ Todas as novas imagens foram enviadas com sucesso');
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
          log.warn(
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
            log.error('❌ Erro ao inserir imagens externas:', insertError);
          } else {
            log.debug(
              '✓ Imagens externas inseridas com sucesso:',
              uniqueRefs.length
            );
          }
        }
      }

      log.debug('=== PROCESSAMENTO DE IMAGENS CONCLUÍDO ===\n');
    } catch (error) {
      log.error('❌ Erro ao processar imagens:', error);
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
        log.warn('⚠️ Imagem já existe no banco, pulando upload:', {
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
        log.warn('Bucket vistoria-images não existe. Criando...');
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
          log.error('Erro ao criar bucket:', createError);
          // Continuar mesmo se não conseguir criar o bucket
        }
      }

      // Gerar nome único para o arquivo (incluindo user_id para políticas de segurança)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${vistoriaId}/${apontamentoId}/${tipoVistoria}/${Date.now()}.${fileExt}`;

      // Upload para o Supabase Storage
      log.debug(
        '📤 Fazendo upload da imagem:',
        fileName,
        'Tamanho:',
        file.size
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vistoria-images')
        .upload(fileName, file);

      if (uploadError) {
        log.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      log.debug('✓ Upload realizado com sucesso:', uploadData);

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
        log.error('❌ Erro ao salvar referência no banco:', dbError);
        throw dbError;
      }

      log.debug('✓ Referência salva no banco para:', file.name);
    } catch (error) {
      log.error('❌ Erro ao fazer upload da imagem:', error);
      throw error;
    }
  };

  // Carregar análises quando o componente montar
  useEffect(() => {
    if (user) {
      fetchAnalises();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
