import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

/**
 * Gera um número de série único para uma imagem
 * Formato: V{vistoria_id}-A{apontamento_index}-{tipo}-{index}
 * Exemplo: V123-A1-inicial-1, V123-A1-inicial-2, V123-A2-final-1
 */
export function generateImageSerial(
  vistoriaId: string,
  apontamentoIndex: number,
  tipoVistoria: 'inicial' | 'final',
  imageIndex: number
): string {
  const apontamentoKey = `A${apontamentoIndex}`;
  const tipoKey = tipoVistoria === 'inicial' ? 'inicial' : 'final';
  const imageKey = `${imageIndex}`;

  return `V${vistoriaId}-${apontamentoKey}-${tipoKey}-${imageKey}`;
}

/**
 * Valida se um número de série é único para a vistoria
 * @param vistoriaId ID da vistoria
 * @param serial Número de série a validar
 * @returns true se único, false se já existe
 */
export async function validateUniqueSerial(
  vistoriaId: string,
  serial: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('vistoria_images')
      .select('id')
      .eq('vistoria_id', vistoriaId)
      .eq('image_serial', serial)
      .maybeSingle();

    if (error) {
      log.error('Erro ao validar serial único:', error);
      return false;
    }

    // Se não encontrou nenhum registro, o serial é único
    return !data;
  } catch (error) {
    log.error('Erro inesperado ao validar serial:', error);
    return false;
  }
}

/**
 * Gera um número de série único garantido (com validação)
 * Tenta gerar um serial e se já existir, incrementa o índice
 */
export async function generateUniqueImageSerial(
  vistoriaId: string,
  apontamentoIndex: number,
  tipoVistoria: 'inicial' | 'final',
  startIndex: number = 1
): Promise<string> {
  let imageIndex = startIndex;
  let serial: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100; // Prevenir loop infinito

  do {
    serial = generateImageSerial(
      vistoriaId,
      apontamentoIndex,
      tipoVistoria,
      imageIndex
    );
    isUnique = await validateUniqueSerial(vistoriaId, serial);

    if (!isUnique) {
      imageIndex++;
      attempts++;

      if (attempts >= maxAttempts) {
        log.error('Máximo de tentativas atingido para gerar serial único', {
          vistoriaId,
          apontamentoIndex,
          tipoVistoria,
          startIndex,
          attempts,
        });
        // Fallback: usar timestamp para garantir unicidade
        serial = `V${vistoriaId}-A${apontamentoIndex}-${tipoVistoria}-${Date.now()}`;
        break;
      }
    }
  } while (!isUnique && attempts < maxAttempts);

  log.debug('Serial único gerado:', {
    serial,
    vistoriaId,
    apontamentoIndex,
    tipoVistoria,
    finalIndex: imageIndex,
    attempts,
  });

  return serial;
}

/**
 * Gera seriais únicos para múltiplas imagens de um apontamento
 * @param vistoriaId ID da vistoria
 * @param apontamentoIndex Índice do apontamento (1-based)
 * @param tipoVistoria Tipo da vistoria
 * @param imageCount Quantidade de imagens
 * @returns Array de seriais únicos
 */
export async function generateMultipleImageSerials(
  vistoriaId: string,
  apontamentoIndex: number,
  tipoVistoria: 'inicial' | 'final',
  imageCount: number
): Promise<string[]> {
  const serials: string[] = [];

  for (let i = 1; i <= imageCount; i++) {
    const serial = await generateUniqueImageSerial(
      vistoriaId,
      apontamentoIndex,
      tipoVistoria,
      i
    );
    serials.push(serial);
  }

  return serials;
}

/**
 * Valida e limpa seriais duplicados de um array de imagens
 * @param images Array de imagens com seriais
 * @returns Array de imagens únicas (mantém apenas a primeira ocorrência de cada serial)
 */
export function deduplicateImagesBySerial<
  T extends { image_serial?: string; image_url?: string },
>(images: T[]): T[] {
  const seenSerials = new Set<string>();
  const seenUrls = new Set<string>();
  const uniqueImages: T[] = [];
  let duplicatesRemoved = 0;

  for (const image of images) {
    // ✅ NOVA LÓGICA: Verificar por serial OU por URL
    const hasSerial = image.image_serial && image.image_serial.length > 0;
    const hasUrl = image.image_url && image.image_url.length > 0;

    if (hasSerial) {
      // Deduplicar por serial
      if (seenSerials.has(image.image_serial!)) {
        duplicatesRemoved++;
        log.warn('Imagem duplicada removida por serial:', {
          serial: image.image_serial,
          totalDuplicates: duplicatesRemoved,
        });
        continue;
      }
      seenSerials.add(image.image_serial!);
    } else if (hasUrl) {
      // Fallback: deduplicar por URL se não tem serial
      if (seenUrls.has(image.image_url!)) {
        duplicatesRemoved++;
        log.warn('Imagem duplicada removida por URL:', {
          url: image.image_url,
          totalDuplicates: duplicatesRemoved,
        });
        continue;
      }
      seenUrls.add(image.image_url!);
    } else {
      // Se não tem serial nem URL, adicionar mesmo assim
      uniqueImages.push(image);
      continue;
    }

    uniqueImages.push(image);
  }

  if (duplicatesRemoved > 0) {
    log.info('Duplicatas removidas:', {
      totalImages: images.length,
      uniqueImages: uniqueImages.length,
      duplicatesRemoved,
    });
  }

  return uniqueImages;
}

/**
 * Gera um serial simplificado para exibição na UI
 * @param serial Serial completo
 * @returns Serial simplificado (ex: V123-A1-inicial-1 -> #1)
 */
export function getSimplifiedSerial(serial: string): string {
  const match = serial.match(/-(\d+)$/);
  if (match) {
    return `#${match[1]}`;
  }
  return `#${serial.split('-').pop()}`;
}
