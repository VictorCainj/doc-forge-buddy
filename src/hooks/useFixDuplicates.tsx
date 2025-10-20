import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FixDuplicatedImages } from '@/utils/fixDuplicatedImages';
import { log } from '@/utils/logger';

interface FixDuplicatesResult {
  success: boolean;
  stats: {
    totalImages: number;
    duplicatesRemoved: number;
    imagesKept: number;
    errors: number;
  };
}

export function useFixDuplicates() {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [lastResult, setLastResult] = useState<FixDuplicatesResult | null>(
    null
  );

  const fixAnalysis = useCallback(
    async (vistoriaId: string): Promise<FixDuplicatesResult | null> => {
      if (!vistoriaId) return null;

      setIsFixing(true);

      try {
        log.info(
          `🔧 Iniciando correção de duplicatas para vistoria: ${vistoriaId}`
        );

        const result =
          await FixDuplicatedImages.fixAnalysisDuplicates(vistoriaId);
        setLastResult(result);

        if (result.success) {
          const { stats } = result;

          if (stats.duplicatesRemoved > 0) {
            toast({
              title: 'Duplicatas corrigidas!',
              description: `${stats.duplicatesRemoved} imagens duplicadas foram removidas. ${stats.imagesKept} imagens originais mantidas.`,
              variant: 'default',
            });
          } else {
            toast({
              title: 'Nenhuma duplicata encontrada',
              description: 'Esta análise não possui imagens duplicadas.',
              variant: 'default',
            });
          }

          log.info('Correção concluída com sucesso', stats);
        } else {
          toast({
            title: 'Erro ao corrigir duplicatas',
            description:
              'Não foi possível remover as imagens duplicadas. Tente novamente.',
            variant: 'destructive',
          });
        }

        return result;
      } catch (error) {
        log.error('Erro ao corrigir duplicatas:', error);
        toast({
          title: 'Erro inesperado',
          description: 'Ocorreu um erro inesperado. Tente novamente.',
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsFixing(false);
      }
    },
    [toast]
  );

  const checkDuplicates = useCallback(
    async (
      vistoriaId: string
    ): Promise<{
      hasDuplicates: boolean;
      count: number;
    }> => {
      try {
        const [hasDups, count] = await Promise.all([
          FixDuplicatedImages.hasDuplicates(vistoriaId),
          FixDuplicatedImages.countDuplicates(vistoriaId),
        ]);

        return { hasDuplicates: hasDups, count };
      } catch (error) {
        log.error('Erro ao verificar duplicatas:', error);
        return { hasDuplicates: false, count: 0 };
      }
    },
    []
  );

  const fixMultiple = useCallback(
    async (
      vistoriaIds: string[]
    ): Promise<
      Array<{
        vistoriaId: string;
        result: FixDuplicatesResult | null;
      }>
    > => {
      if (vistoriaIds.length === 0) return [];

      setIsFixing(true);

      try {
        log.info(
          `🔧 Iniciando correção em lote para ${vistoriaIds.length} análises`
        );

        const results = await Promise.all(
          vistoriaIds.map(async (vistoriaId) => {
            const result =
              await FixDuplicatedImages.fixAnalysisDuplicates(vistoriaId);
            return { vistoriaId, result };
          })
        );

        const successCount = results.filter((r) => r.result?.success).length;
        const totalDuplicates = results.reduce(
          (acc, r) => acc + (r.result?.stats.duplicatesRemoved || 0),
          0
        );

        toast({
          title: 'Correção em lote concluída!',
          description: `${successCount} de ${vistoriaIds.length} análises corrigidas. ${totalDuplicates} duplicatas removidas no total.`,
          variant: successCount > 0 ? 'default' : 'destructive',
        });

        log.info('Correção em lote concluída', {
          successCount,
          totalDuplicates,
        });
        return results;
      } catch (error) {
        log.error('Erro durante correção em lote:', error);
        toast({
          title: 'Erro na correção em lote',
          description: 'Ocorreu um erro inesperado. Tente novamente.',
          variant: 'destructive',
        });
        return [];
      } finally {
        setIsFixing(false);
      }
    },
    [toast]
  );

  return {
    isFixing,
    lastResult,
    fixAnalysis,
    checkDuplicates,
    fixMultiple,
  };
}
