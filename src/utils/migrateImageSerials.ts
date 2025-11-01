// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { generateUniqueImageSerial } from '@/utils/imageSerialGenerator';
import { log } from '@/utils/logger';

/**
 * Script para migrar dados existentes e adicionar números de série únicos
 * Remove duplicatas e gera seriais para imagens existentes
 */
export class ImageSerialMigrator {
  /**
   * Executa a migração completa
   */
  static async executeMigration(): Promise<{
    success: boolean;
    stats: {
      totalImages: number;
      duplicatesRemoved: number;
      serialsGenerated: number;
      errors: number;
    };
  }> {
    const stats = {
      totalImages: 0,
      duplicatesRemoved: 0,
      serialsGenerated: 0,
      errors: 0,
    };

    try {
      log.info('🚀 Iniciando migração de números de série para imagens');

      // 1. Buscar todas as imagens existentes
      const { data: allImages, error: fetchError } = await supabase
        .from('vistoria_images')
        .select('*')
        .order('created_at', { ascending: true });

      if (fetchError) {
        log.error('Erro ao buscar imagens:', fetchError);
        return { success: false, stats };
      }

      if (!allImages || allImages.length === 0) {
        log.info('Nenhuma imagem encontrada para migrar');
        return { success: true, stats };
      }

      stats.totalImages = allImages.length;
      log.info(`📊 Total de imagens encontradas: ${stats.totalImages}`);

      // 2. Agrupar por vistoria_id para processar em lotes
      const imagesByVistoria = allImages.reduce(
        (acc, img) => {
          if (!acc[img.vistoria_id]) {
            acc[img.vistoria_id] = [];
          }
          acc[img.vistoria_id].push(img);
          return acc;
        },
        {} as Record<string, typeof allImages>
      );

      log.info(
        `📁 Vistorias encontradas: ${Object.keys(imagesByVistoria).length}`
      );

      // 3. Processar cada vistoria
      for (const [vistoriaId, images] of Object.entries(imagesByVistoria)) {
        try {
          await this.processVistoriaImages(vistoriaId, images, stats);
        } catch (error) {
          log.error(`Erro ao processar vistoria ${vistoriaId}:`, error);
          stats.errors++;
        }
      }

      log.info('✅ Migração concluída', stats);
      return { success: true, stats };
    } catch (error) {
      log.error('❌ Erro durante migração:', error);
      return { success: false, stats };
    }
  }

  /**
   * Processa imagens de uma vistoria específica
   */
  private static async processVistoriaImages(
    vistoriaId: string,
    images: any[],
    stats: any
  ): Promise<void> {
    log.info(
      `🔍 Processando vistoria ${vistoriaId} com ${images.length} imagens`
    );

    // Agrupar por apontamento_id e tipo_vistoria
    const groupedImages = images.reduce(
      (acc, img) => {
        const key = `${img.apontamento_id}-${img.tipo_vistoria}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(img);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Processar cada grupo
    for (const [groupKey, groupImages] of Object.entries(groupedImages)) {
      const [apontamentoId, tipoVistoria] = groupKey.split('-');

      // Remover duplicatas baseadas em image_url
      const uniqueImages = this.removeDuplicateImages(groupImages);

      if (uniqueImages.length < groupImages.length) {
        const duplicatesRemoved = groupImages.length - uniqueImages.length;
        stats.duplicatesRemoved += duplicatesRemoved;
        log.warn(
          `⚠️ Removidas ${duplicatesRemoved} duplicatas do grupo ${groupKey}`
        );
      }

      // Gerar seriais únicos para imagens sem serial
      for (let i = 0; i < uniqueImages.length; i++) {
        const img = uniqueImages[i];

        if (!img.image_serial) {
          try {
            const serial = await generateUniqueImageSerial(
              vistoriaId,
              this.extractApontamentoIndex(apontamentoId),
              tipoVistoria as 'inicial' | 'final',
              i + 1
            );

            // Atualizar imagem com serial
            const { error: updateError } = await supabase
              .from('vistoria_images')
              .update({ image_serial: serial })
              .eq('id', img.id);

            if (updateError) {
              log.error(
                `Erro ao atualizar serial para imagem ${img.id}:`,
                updateError
              );
              stats.errors++;
            } else {
              stats.serialsGenerated++;
              log.debug(`✅ Serial gerado: ${serial} para imagem ${img.id}`);
            }
          } catch (error) {
            log.error(`Erro ao gerar serial para imagem ${img.id}:`, error);
            stats.errors++;
          }
        }
      }
    }
  }

  /**
   * Remove imagens duplicadas baseadas em image_url
   */
  private static removeDuplicateImages(images: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const img of images) {
      if (!seen.has(img.image_url)) {
        seen.add(img.image_url);
        unique.push(img);
      } else {
        // Log da duplicata removida
        log.debug(`🔄 Duplicata removida: ${img.image_url} (ID: ${img.id})`);
      }
    }

    return unique;
  }

  /**
   * Extrai índice do apontamento do ID (assumindo formato padrão)
   */
  private static extractApontamentoIndex(apontamentoId: string): number {
    // Se o ID contém números, tentar extrair
    const match = apontamentoId.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    // Fallback: usar hash do ID para gerar número consistente
    let hash = 0;
    for (let i = 0; i < apontamentoId.length; i++) {
      const char = apontamentoId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return (Math.abs(hash) % 100) + 1; // Retorna número entre 1-100
  }

  /**
   * Remove duplicatas físicas do banco de dados
   */
  static async removePhysicalDuplicates(): Promise<{
    success: boolean;
    duplicatesRemoved: number;
  }> {
    try {
      log.info('🧹 Removendo duplicatas físicas do banco de dados');

      // Buscar duplicatas baseadas em vistoria_id, apontamento_id, tipo_vistoria e image_url
      const { data: duplicates, error } = await supabase
        .from('vistoria_images')
        .select(
          'vistoria_id, apontamento_id, tipo_vistoria, image_url, id, created_at'
        )
        .order('created_at', { ascending: true });

      if (error) {
        log.error('Erro ao buscar duplicatas:', error);
        return { success: false, duplicatesRemoved: 0 };
      }

      if (!duplicates || duplicates.length === 0) {
        return { success: true, duplicatesRemoved: 0 };
      }

      // Agrupar por chave única
      const groups = duplicates.reduce(
        (acc, img) => {
          const key = `${img.vistoria_id}-${img.apontamento_id}-${img.tipo_vistoria}-${img.image_url}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(img);
          return acc;
        },
        {} as Record<string, any[]>
      );

      let duplicatesRemoved = 0;

      // Para cada grupo, manter apenas o mais antigo
      for (const [key, group] of Object.entries(groups)) {
        if (group.length > 1) {
          // Ordenar por created_at (mais antigo primeiro)
          group.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

          // Manter o primeiro (mais antigo), remover os outros
          const toRemove = group.slice(1);

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
            } else {
              duplicatesRemoved++;
              log.debug(`🗑️ Duplicata removida: ${duplicate.id} (${key})`);
            }
          }
        }
      }

      log.info(`✅ Duplicatas físicas removidas: ${duplicatesRemoved}`);
      return { success: true, duplicatesRemoved };
    } catch (error) {
      log.error('❌ Erro ao remover duplicatas físicas:', error);
      return { success: false, duplicatesRemoved: 0 };
    }
  }
}

/**
 * Função utilitária para executar a migração completa
 */
export async function migrateImageSerials(): Promise<boolean> {
  try {
    log.info('🚀 Iniciando migração completa de números de série');

    // 1. Remover duplicatas físicas primeiro
    const duplicatesResult =
      await ImageSerialMigrator.removePhysicalDuplicates();
    if (!duplicatesResult.success) {
      log.error('Falha ao remover duplicatas físicas');
      return false;
    }

    // 2. Gerar seriais únicos
    const migrationResult = await ImageSerialMigrator.executeMigration();
    if (!migrationResult.success) {
      log.error('Falha na migração de seriais');
      return false;
    }

    log.info('✅ Migração completa finalizada', {
      duplicatesRemoved: duplicatesResult.duplicatesRemoved,
      ...migrationResult.stats,
    });

    return true;
  } catch (error) {
    log.error('❌ Erro na migração completa:', error);
    return false;
  }
}
