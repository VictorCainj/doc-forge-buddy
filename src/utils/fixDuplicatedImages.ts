import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

/**
 * Utilitário para corrigir duplicações em uma análise específica
 * Remove duplicatas mantendo apenas as imagens mais antigas (originais)
 */
export class FixDuplicatedImages {
  /**
   * Corrige duplicações de uma análise específica
   * @param vistoriaId ID da vistoria a ser corrigida
   * @returns Estatísticas da correção
   */
  static async fixAnalysisDuplicates(vistoriaId: string): Promise<{
    success: boolean;
    stats: {
      totalImages: number;
      duplicatesRemoved: number;
      imagesKept: number;
      errors: number;
    };
  }> {
    const stats = {
      totalImages: 0,
      duplicatesRemoved: 0,
      imagesKept: 0,
      errors: 0,
    };

    try {
      log.info(
        `🔧 Iniciando correção de duplicações para vistoria: ${vistoriaId}`
      );

      // 1. Buscar todas as imagens da vistoria
      const { data: images, error: fetchError } = await supabase
        .from('vistoria_images')
        .select('*')
        .eq('vistoria_id', vistoriaId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        log.error('Erro ao buscar imagens:', fetchError);
        return { success: false, stats };
      }

      if (!images || images.length === 0) {
        log.info('Nenhuma imagem encontrada para esta vistoria');
        return { success: true, stats };
      }

      stats.totalImages = images.length;
      log.info(`📊 Total de imagens encontradas: ${stats.totalImages}`);

      // 2. Agrupar por chave única (apontamento + tipo + URL)
      const groupedImages = this.groupImagesByUniqueKey(images);

      // 3. Para cada grupo, manter apenas a mais antiga
      for (const [key, groupImages] of Object.entries(groupedImages)) {
        if (groupImages.length > 1) {
          // Ordenar por created_at (mais antigo primeiro)
          groupImages.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

          // Manter o primeiro (mais antigo), remover os outros
          const toKeep = groupImages[0];
          const toRemove = groupImages.slice(1);

          log.info(
            `🔍 Grupo ${key}: ${groupImages.length} imagens, mantendo ${toKeep.id}, removendo ${toRemove.length}`
          );

          // Remover duplicatas
          for (const duplicate of toRemove) {
            const { error: deleteError } = await supabase
              .from('vistoria_images')
              .delete()
              .eq('id', duplicate.id);

            if (deleteError) {
              log.error(
                `Erro ao remover duplicata ${duplicate.id}:`,
                deleteError
              );
              stats.errors++;
            } else {
              stats.duplicatesRemoved++;
              log.debug(`🗑️ Duplicata removida: ${duplicate.id} (${key})`);
            }
          }

          stats.imagesKept++;
        } else {
          // Grupo com apenas 1 imagem, manter
          stats.imagesKept++;
        }
      }

      log.info('✅ Correção de duplicações concluída', stats);
      return { success: true, stats };
    } catch (error) {
      log.error('❌ Erro durante correção de duplicações:', error);
      return { success: false, stats };
    }
  }

  /**
   * Agrupa imagens por chave única (apontamento + tipo + URL)
   */
  private static groupImagesByUniqueKey(images: any[]): Record<string, any[]> {
    return images.reduce(
      (acc, img) => {
        const key = `${img.apontamento_id}-${img.tipo_vistoria}-${img.image_url}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(img);
        return acc;
      },
      {} as Record<string, any[]>
    );
  }

  /**
   * Verifica se uma análise tem duplicatas
   * @param vistoriaId ID da vistoria
   * @returns true se tem duplicatas, false caso contrário
   */
  static async hasDuplicates(vistoriaId: string): Promise<boolean> {
    try {
      const { data: images, error } = await supabase
        .from('vistoria_images')
        .select('apontamento_id, tipo_vistoria, image_url')
        .eq('vistoria_id', vistoriaId);

      if (error || !images) {
        return false;
      }

      // Agrupar por chave única
      const groupedImages = this.groupImagesByUniqueKey(images);

      // Verificar se algum grupo tem mais de 1 imagem
      return Object.values(groupedImages).some((group) => group.length > 1);
    } catch (error) {
      log.error('Erro ao verificar duplicatas:', error);
      return false;
    }
  }

  /**
   * Conta quantas duplicatas existem em uma análise
   * @param vistoriaId ID da vistoria
   * @returns Número de duplicatas encontradas
   */
  static async countDuplicates(vistoriaId: string): Promise<number> {
    try {
      const { data: images, error } = await supabase
        .from('vistoria_images')
        .select('apontamento_id, tipo_vistoria, image_url')
        .eq('vistoria_id', vistoriaId);

      if (error || !images) {
        return 0;
      }

      const groupedImages = this.groupImagesByUniqueKey(images);
      let duplicatesCount = 0;

      Object.values(groupedImages).forEach((group) => {
        if (group.length > 1) {
          duplicatesCount += group.length - 1; // -1 porque mantemos 1 original
        }
      });

      return duplicatesCount;
    } catch (error) {
      log.error('Erro ao contar duplicatas:', error);
      return 0;
    }
  }
}
