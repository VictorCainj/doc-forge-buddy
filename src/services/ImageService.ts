import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

/**
 * Interface para imagens da vistoria
 */
export interface VistoriaImage {
  id: string;
  vistoria_id: string;
  apontamento_id: string;
  tipo_vistoria: 'inicial' | 'final';
  image_url: string;
  image_serial?: string;
  created_at: string;
  [key: string]: unknown;
}

/**
 * Interface para relatório de limpeza
 */
export interface CleanupReport {
  success: boolean;
  totalImages: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  imagesKept: number;
  errors: number;
}

/**
 * Serviço unificado para gerenciamento de imagens da vistoria
 * Centraliza lógica de deduplicação, limpeza e organização
 */
export class ImageService {
  /**
   * Remove imagens duplicadas de um array
   * Compara por serial ou URL
   */
  static deduplicateImages<
    T extends { image_serial?: string; image_url?: string },
  >(images: T[]): T[] {
    const seenSerials = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueImages: T[] = [];
    let duplicatesRemoved = 0;

    for (const image of images) {
      const hasSerial = image.image_serial && image.image_serial.length > 0;
      const hasUrl = image.image_url && image.image_url.length > 0;

      if (hasSerial) {
        // Deduplicar por serial
        if (seenSerials.has(image.image_serial!)) {
          duplicatesRemoved++;
          log.debug(
            'Imagem duplicada removida por serial:',
            image.image_serial
          );
          continue;
        }
        seenSerials.add(image.image_serial!);
      } else if (hasUrl) {
        // Fallback: deduplicar por URL se não tem serial
        if (seenUrls.has(image.image_url!)) {
          duplicatesRemoved++;
          log.debug('Imagem duplicada removida por URL:', image.image_url);
          continue;
        }
        seenUrls.add(image.image_url!);
      } else {
        // Sem serial nem URL, adicionar mesmo assim
        uniqueImages.push(image);
        continue;
      }

      uniqueImages.push(image);
    }

    if (duplicatesRemoved > 0) {
      log.info('Duplicatas removidas:', {
        original: images.length,
        unique: uniqueImages.length,
        removed: duplicatesRemoved,
      });
    }

    return uniqueImages;
  }

  /**
   * Agrupa imagens por chave única para identificar duplicatas
   * Chave: apontamento_id + tipo_vistoria + image_url
   */
  private static groupImagesByKey(
    images: VistoriaImage[]
  ): Record<string, VistoriaImage[]> {
    const grouped: Record<string, VistoriaImage[]> = {};

    for (const image of images) {
      const key = `${image.apontamento_id}_${image.tipo_vistoria}_${image.image_url}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(image);
    }

    return grouped;
  }

  /**
   * Corrige duplicações em uma análise específica
   * Remove duplicatas mantendo apenas as imagens mais antigas
   */
  static async fixVistoriaDuplicates(
    vistoriaId: string
  ): Promise<CleanupReport> {
    const report: CleanupReport = {
      success: false,
      totalImages: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      imagesKept: 0,
      errors: 0,
    };

    try {
      // Buscar todas as imagens da vistoria
      const { data: images, error: fetchError } = await supabase
        .from('vistoria_images')
        .select('*')
        .eq('vistoria_id', vistoriaId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        log.error('Erro ao buscar imagens:', fetchError);
        report.errors++;
        return report;
      }

      report.totalImages = images?.length || 0;

      if (!images || images.length === 0) {
        report.success = true;
        return report;
      }

      // Agrupar por chave única
      const groupedImages = this.groupImagesByKey(images as VistoriaImage[]);

      // Remover duplicatas
      for (const [key, group] of Object.entries(groupedImages)) {
        if (group.length > 1) {
          // Ordenar por created_at (mais antigo primeiro)
          group.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

          // Manter a primeira (mais antiga), remover as outras
          const toRemove = group.slice(1);

          log.info(
            `Grupo ${key}: ${group.length} imagens, removendo ${toRemove.length}`
          );

          report.duplicatesFound += toRemove.length;

          for (const duplicate of toRemove) {
            const { error: deleteError } = await supabase
              .from('vistoria_images')
              .delete()
              .eq('id', duplicate.id);

            if (deleteError) {
              log.error('Erro ao remover duplicata:', deleteError);
              report.errors++;
            } else {
              report.duplicatesRemoved++;
              log.debug(`Duplicata removida: ${duplicate.id}`);
            }
          }

          report.imagesKept++;
        } else {
          // Grupo com apenas 1 imagem
          report.imagesKept++;
        }
      }

      report.success = true;
      log.info('Limpeza de duplicatas concluída', report);
      return report;
    } catch (error) {
      log.error('Erro durante limpeza de duplicatas:', error);
      report.errors++;
      return report;
    }
  }

  /**
   * Verifica se existem duplicatas em uma vistoria
   */
  static async hasDuplicates(vistoriaId: string): Promise<boolean> {
    try {
      const { data: images, error } = await supabase
        .from('vistoria_images')
        .select('*')
        .eq('vistoria_id', vistoriaId);

      if (error || !images) {
        return false;
      }

      const groupedImages = this.groupImagesByKey(images as VistoriaImage[]);

      // Verificar se algum grupo tem mais de 1 imagem
      return Object.values(groupedImages).some((group) => group.length > 1);
    } catch {
      return false;
    }
  }

  /**
   * Conta o número de duplicatas em uma vistoria
   */
  static async countDuplicates(vistoriaId: string): Promise<number> {
    try {
      const { data: images, error } = await supabase
        .from('vistoria_images')
        .select('*')
        .eq('vistoria_id', vistoriaId);

      if (error || !images) {
        return 0;
      }

      const groupedImages = this.groupImagesByKey(images as VistoriaImage[]);

      let count = 0;
      for (const group of Object.values(groupedImages)) {
        if (group.length > 1) {
          count += group.length - 1; // -1 para manter a original
        }
      }

      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Busca todas as imagens de uma vistoria sem duplicatas
   */
  static async getVistoriaImages(vistoriaId: string): Promise<VistoriaImage[]> {
    try {
      const { data: images, error } = await supabase
        .from('vistoria_images')
        .select('*')
        .eq('vistoria_id', vistoriaId)
        .order('created_at', { ascending: true });

      if (error || !images) {
        return [];
      }

      // Aplicar deduplicação
      return this.deduplicateImages(images as VistoriaImage[]);
    } catch {
      return [];
    }
  }

  /**
   * Limpa todas as duplicatas de todas as vistorias do sistema
   * Use com cuidado!
   */
  static async cleanupAllDuplicates(userId?: string): Promise<{
    success: boolean;
    totalVistorias: number;
    totalDuplicatesRemoved: number;
    errors: number;
  }> {
    const result = {
      success: false,
      totalVistorias: 0,
      totalDuplicatesRemoved: 0,
      errors: 0,
    };

    try {
      log.info('Iniciando limpeza em massa de duplicatas...');

      // Buscar todas as vistorias
      let query = supabase.from('vistoria_analises').select('id');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: vistorias, error } = await query;

      if (error || !vistorias) {
        log.error('Erro ao buscar vistorias:', error);
        return result;
      }

      result.totalVistorias = vistorias.length;

      // Processar cada vistoria
      for (const vistoria of vistorias) {
        const report = await this.fixVistoriaDuplicates(vistoria.id);
        result.totalDuplicatesRemoved += report.duplicatesRemoved;
        result.errors += report.errors;
      }

      result.success = true;
      log.info('Limpeza em massa concluída', result);
      return result;
    } catch (error) {
      log.error('Erro durante limpeza em massa:', error);
      result.errors++;
      return result;
    }
  }
}
