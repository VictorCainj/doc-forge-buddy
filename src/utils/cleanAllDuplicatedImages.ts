import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';
import { FixDuplicatedImages } from '@/utils/fixDuplicatedImages';

export interface AnalyseDetail {
  vistoriaId: string;
  contract_id: string | null;
  totalImages: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
}

export interface CleanupReport {
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number; // em segundos
  totalAnalyses: number;
  totalImagesScanned: number;
  totalDuplicatesFound: number;
  totalDuplicatesRemoved: number;
  errors: number;
  analyseDetails: AnalyseDetail[];
}

/**
 * Utilitário para limpeza em massa de duplicações em todo o sistema
 */
export class CleanAllDuplicatedImages {
  /**
   * Escaneia todo o banco e gera relatório de duplicações
   * NÃO remove nada, apenas relata
   */
  static async scanDuplicates(userId?: string): Promise<CleanupReport> {
    const startTime = new Date().toISOString();
    const report: CleanupReport = {
      success: false,
      startTime,
      endTime: '',
      duration: 0,
      totalAnalyses: 0,
      totalImagesScanned: 0,
      totalDuplicatesFound: 0,
      totalDuplicatesRemoved: 0,
      errors: 0,
      analyseDetails: [],
    };

    try {
      log.info('🔍 Iniciando escaneamento de duplicações em massa');

      // Buscar todas as análises (filtrado por usuário se fornecido)
      let query = supabase
        .from('vistoria_analises')
        .select('id, contract_id')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
        log.info(`Filtrando análises por user_id: ${userId}`);
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
      log.info(`📊 Total de análises encontradas: ${report.totalAnalyses}`);

      // Processar cada análise
      for (const analise of analises) {
        try {
          const stats = await this.processAnalysis(analise, true); // true = apenas escanear
          report.analyseDetails.push(stats);
          report.totalImagesScanned += stats.totalImages;
          report.totalDuplicatesFound += stats.duplicatesFound;
        } catch (error) {
          log.error(`Erro ao processar análise ${analise.id}:`, error);
          report.errors++;
        }
      }

      report.success = true;
      log.info('✅ Escaneamento concluído', {
        totalAnalyses: report.totalAnalyses,
        totalImagesScanned: report.totalImagesScanned,
        totalDuplicatesFound: report.totalDuplicatesFound,
      });
    } catch (error) {
      log.error('❌ Erro durante escaneamento:', error);
      report.success = false;
    } finally {
      report.endTime = new Date().toISOString();
      report.duration = this.calculateDuration(startTime, report.endTime);
    }

    return report;
  }

  /**
   * Remove duplicatas de todo o sistema
   * Opcionalmente filtrado por usuário
   */
  static async cleanAllDuplicates(
    userId?: string,
    dryRun: boolean = false
  ): Promise<CleanupReport> {
    const startTime = new Date().toISOString();
    const report: CleanupReport = {
      success: false,
      startTime,
      endTime: '',
      duration: 0,
      totalAnalyses: 0,
      totalImagesScanned: 0,
      totalDuplicatesFound: 0,
      totalDuplicatesRemoved: 0,
      errors: 0,
      analyseDetails: [],
    };

    try {
      const mode = dryRun ? '🧪 SIMULAÇÃO' : '🗑️ LIMPEZA DEFINITIVA';
      log.info(`${mode} - Iniciando limpeza de duplicações em massa`);

      // Buscar todas as análises (filtrado por usuário se fornecido)
      let query = supabase
        .from('vistoria_analises')
        .select('id, contract_id')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
        log.info(`Filtrando análises por user_id: ${userId}`);
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
      log.info(`📊 Total de análises a processar: ${report.totalAnalyses}`);

      // Processar cada análise
      let processedCount = 0;
      for (const analise of analises) {
        processedCount++;

        try {
          log.info(
            `Processando análise ${processedCount}/${report.totalAnalyses}: ${analise.id}`
          );

          const stats = await this.processAnalysis(analise, dryRun);
          report.analyseDetails.push(stats);
          report.totalImagesScanned += stats.totalImages;
          report.totalDuplicatesFound += stats.duplicatesFound;
          report.totalDuplicatesRemoved += stats.duplicatesRemoved;

          if (stats.duplicatesFound > 0) {
            log.info(
              `  ✓ Análise ${analise.id}: ${stats.duplicatesRemoved} duplicatas ${dryRun ? 'encontradas' : 'removidas'}`
            );
          }
        } catch (error) {
          log.error(`  ❌ Erro ao processar análise ${analise.id}:`, error);
          report.errors++;
        }
      }

      report.success = true;
      log.info(`✅ ${mode} concluída`, {
        totalAnalyses: report.totalAnalyses,
        totalImagesScanned: report.totalImagesScanned,
        totalDuplicatesFound: report.totalDuplicatesFound,
        totalDuplicatesRemoved: report.totalDuplicatesRemoved,
        errors: report.errors,
      });
    } catch (error) {
      log.error('❌ Erro durante limpeza:', error);
      report.success = false;
    } finally {
      report.endTime = new Date().toISOString();
      report.duration = this.calculateDuration(startTime, report.endTime);
    }

    return report;
  }

  /**
   * Processa uma análise específica
   * @param analise Dados da análise
   * @param dryRun Se true, apenas conta duplicatas sem remover
   */
  private static async processAnalysis(
    analise: { id: string; contract_id: string | null },
    dryRun: boolean
  ): Promise<AnalyseDetail> {
    const detail: AnalyseDetail = {
      vistoriaId: analise.id,
      contract_id: analise.contract_id,
      totalImages: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
    };

    // Buscar imagens da análise
    const { data: images, error } = await supabase
      .from('vistoria_images')
      .select('*')
      .eq('vistoria_id', analise.id)
      .order('created_at', { ascending: true });

    if (error || !images) {
      log.error(`Erro ao buscar imagens da análise ${analise.id}:`, error);
      return detail;
    }

    detail.totalImages = images.length;

    if (images.length === 0) {
      return detail;
    }

    // Agrupar por chave única para identificar duplicatas
    const groupedImages = this.groupImagesByUniqueKey(images);

    // Contar duplicatas
    Object.values(groupedImages).forEach((group) => {
      if (group.length > 1) {
        detail.duplicatesFound += group.length - 1; // -1 porque mantemos 1 original
      }
    });

    // Se não for dry-run, executar limpeza
    if (!dryRun && detail.duplicatesFound > 0) {
      const result = await FixDuplicatedImages.fixAnalysisDuplicates(
        analise.id
      );
      detail.duplicatesRemoved = result.stats.duplicatesRemoved;
    } else if (dryRun) {
      // Em modo dry-run, simular remoção
      detail.duplicatesRemoved = detail.duplicatesFound;
    }

    return detail;
  }

  /**
   * Agrupa imagens por chave única (apontamento + tipo + URL)
   */
  private static groupImagesByUniqueKey(
    images: Array<{
      apontamento_id: string;
      tipo_vistoria: string;
      image_url: string;
      [key: string]: unknown;
    }>
  ): Record<string, typeof images> {
    return images.reduce(
      (acc, img) => {
        const key = `${img.apontamento_id}-${img.tipo_vistoria}-${img.image_url}`;
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
   * Calcula duração em segundos entre dois timestamps ISO
   */
  private static calculateDuration(start: string, end: string): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.round((endTime - startTime) / 1000);
  }
}
