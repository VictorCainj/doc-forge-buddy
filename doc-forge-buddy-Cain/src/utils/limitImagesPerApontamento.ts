import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

export interface LimitImagesReport {
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  totalAnalyses: number;
  totalApontamentos: number;
  totalImagesRemoved: number;
  errors: number;
  details: Array<{
    vistoriaId: string;
    apontamentoId: string;
    tipoVistoria: 'inicial' | 'final';
    totalImages: number;
    imagesRemoved: number;
  }>;
}

/**
 * Utilitário para limitar imagens por apontamento
 */
export class LimitImagesPerApontamento {
  /**
   * Remove imagens excedentes mantendo apenas as 4 primeiras (mais antigas) por apontamento
   * @param userId Filtrar por usuário (opcional)
   * @param dryRun Se true, apenas simula sem deletar
   * @param maxImages Número máximo de imagens por apontamento (padrão: 4)
   */
  static async limitImages(
    userId?: string,
    dryRun: boolean = false,
    maxImages: number = 4
  ): Promise<LimitImagesReport> {
    const startTime = new Date().toISOString();
    const report: LimitImagesReport = {
      success: false,
      startTime,
      endTime: '',
      duration: 0,
      totalAnalyses: 0,
      totalApontamentos: 0,
      totalImagesRemoved: 0,
      errors: 0,
      details: [],
    };

    try {
      const mode = dryRun ? '🧪 SIMULAÇÃO' : '✂️ LIMITAÇÃO';
      log.info(`${mode} - Limitando imagens a ${maxImages} por apontamento`);

      // Buscar todas as análises
      let query = supabase
        .from('vistoria_analises')
        .select('id')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
        log.info(`Filtrando por user_id: ${userId}`);
      }

      const { data: analises, error: analisesError } = await query;

      if (analisesError) {
        log.error('Erro ao buscar análises:', analisesError);
        throw analisesError;
      }

      if (!analises || analises.length === 0) {
        log.info('Nenhuma análise encontrada');
        report.success = true;
        report.endTime = new Date().toISOString();
        report.duration = this.calculateDuration(startTime, report.endTime);
        return report;
      }

      report.totalAnalyses = analises.length;
      log.info(`📊 Total de análises: ${report.totalAnalyses}`);

      // Processar cada análise
      for (const analise of analises) {
        try {
          const analiseDetails = await this.processAnalise(
            analise.id,
            maxImages,
            dryRun
          );

          report.details.push(...analiseDetails);
          report.totalApontamentos += analiseDetails.length;
          report.totalImagesRemoved += analiseDetails.reduce(
            (sum, d) => sum + d.imagesRemoved,
            0
          );
        } catch (error) {
          log.error(`Erro ao processar análise ${analise.id}:`, error);
          report.errors++;
        }
      }

      report.success = true;
      log.info(`✅ ${mode} concluída`, {
        totalAnalyses: report.totalAnalyses,
        totalApontamentos: report.totalApontamentos,
        totalImagesRemoved: report.totalImagesRemoved,
        errors: report.errors,
      });
    } catch (error) {
      log.error('❌ Erro durante limitação:', error);
      report.success = false;
    } finally {
      report.endTime = new Date().toISOString();
      report.duration = this.calculateDuration(startTime, report.endTime);
    }

    return report;
  }

  /**
   * Processa uma análise específica
   */
  private static async processAnalise(
    vistoriaId: string,
    maxImages: number,
    dryRun: boolean
  ): Promise<LimitImagesReport['details']> {
    const details: LimitImagesReport['details'] = [];

    // Buscar todas as imagens da análise
    const { data: images, error } = await supabase
      .from('vistoria_images')
      .select('*')
      .eq('vistoria_id', vistoriaId)
      .order('created_at', { ascending: true });

    if (error || !images || images.length === 0) {
      return details;
    }

    // Agrupar por apontamento e tipo de vistoria
    const grouped = this.groupByApontamentoAndTipo(images);

    // Para cada grupo, verificar se excede o limite
    for (const [key, groupImages] of Object.entries(grouped)) {
      const [apontamentoId, tipoVistoria] = key.split('|');

      if (groupImages.length > maxImages) {
        // Manter apenas as primeiras (mais antigas)
        const _toKeep = groupImages.slice(0, maxImages);
        const toRemove = groupImages.slice(maxImages);

        log.info(
          `Apontamento ${apontamentoId} (${tipoVistoria}): ${groupImages.length} imagens, removendo ${toRemove.length}`
        );

        // Remover imagens excedentes (se não for dry-run)
        let removed = 0;
        if (!dryRun) {
          for (const image of toRemove) {
            const { error: deleteError } = await supabase
              .from('vistoria_images')
              .delete()
              .eq('id', image.id);

            if (deleteError) {
              log.error(`Erro ao remover imagem ${image.id}:`, deleteError);
            } else {
              removed++;
            }
          }
        } else {
          removed = toRemove.length; // Em dry-run, simular remoção
        }

        details.push({
          vistoriaId,
          apontamentoId,
          tipoVistoria: tipoVistoria as 'inicial' | 'final',
          totalImages: groupImages.length,
          imagesRemoved: removed,
        });
      }
    }

    return details;
  }

  /**
   * Agrupa imagens por apontamento e tipo de vistoria
   */
  private static groupByApontamentoAndTipo(
    images: Array<{
      apontamento_id: string;
      tipo_vistoria: string;
      [key: string]: unknown;
    }>
  ): Record<string, typeof images> {
    return images.reduce(
      (acc, img) => {
        const key = `${img.apontamento_id}|${img.tipo_vistoria}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(img);
        return acc;
      },
      {} as Record<string, typeof images>
    );
  }

  /**
   * Calcula duração em segundos
   */
  private static calculateDuration(start: string, end: string): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.round((endTime - startTime) / 1000);
  }

  /**
   * Escaneia e retorna estatísticas sem remover
   */
  static async scanExcessImages(
    userId?: string,
    maxImages: number = 4
  ): Promise<{
    totalApontamentosWithExcess: number;
    totalExcessImages: number;
    details: Array<{
      vistoriaId: string;
      apontamentoId: string;
      tipoVistoria: string;
      totalImages: number;
      excessImages: number;
    }>;
  }> {
    const result = {
      totalApontamentosWithExcess: 0,
      totalExcessImages: 0,
      details: [] as Array<{
        vistoriaId: string;
        apontamentoId: string;
        tipoVistoria: string;
        totalImages: number;
        excessImages: number;
      }>,
    };

    try {
      // Buscar todas as análises
      let query = supabase
        .from('vistoria_analises')
        .select('id')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: analises } = await query;

      if (!analises) return result;

      // Para cada análise, verificar excesso de imagens
      for (const analise of analises) {
        const { data: images } = await supabase
          .from('vistoria_images')
          .select('apontamento_id, tipo_vistoria')
          .eq('vistoria_id', analise.id);

        if (!images) continue;

        const grouped = this.groupByApontamentoAndTipo(images);

        for (const [key, groupImages] of Object.entries(grouped)) {
          if (groupImages.length > maxImages) {
            const [apontamentoId, tipoVistoria] = key.split('|');
            const excessImages = groupImages.length - maxImages;

            result.totalApontamentosWithExcess++;
            result.totalExcessImages += excessImages;

            result.details.push({
              vistoriaId: analise.id,
              apontamentoId,
              tipoVistoria,
              totalImages: groupImages.length,
              excessImages,
            });
          }
        }
      }
    } catch (error) {
      log.error('Erro ao escanear excesso de imagens:', error);
    }

    return result;
  }
}
