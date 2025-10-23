import { useState, useCallback } from 'react';
import {
  CleanAllDuplicatedImages,
  CleanupReport,
} from '@/utils/cleanAllDuplicatedImages';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/utils/logger';

/**
 * Hook para gerenciar limpeza de duplicatas em massa
 */
export function useCleanupDuplicates() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CleanupReport | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Escaneia duplicatas sem remover
   */
  const scanDuplicates = useCallback(
    async (userId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        log.info('Iniciando escaneamento de duplicatas...');

        toast({
          title: 'Escaneando duplicatas',
          description: 'Analisando imagens do sistema...',
        });

        const result = await CleanAllDuplicatedImages.scanDuplicates(userId);
        setReport(result);

        if (result.success) {
          toast({
            title: 'Escaneamento concluído',
            description: `${result.totalDuplicatesFound} duplicatas encontradas em ${result.totalAnalyses} análises`,
            variant: result.totalDuplicatesFound > 0 ? 'default' : 'default',
          });
        } else {
          throw new Error('Escaneamento falhou');
        }

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        log.error('Erro ao escanear duplicatas:', error);

        toast({
          title: 'Erro ao escanear',
          description: error.message,
          variant: 'destructive',
        });

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  /**
   * Limpa duplicatas (ou simula com dry-run)
   */
  const cleanDuplicates = useCallback(
    async (userId?: string, dryRun: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const mode = dryRun ? 'Simulando limpeza' : 'Limpando duplicatas';
        log.info(`${mode}...`);

        toast({
          title: mode,
          description: 'Processando imagens...',
        });

        const result = await CleanAllDuplicatedImages.cleanAllDuplicates(
          userId,
          dryRun
        );
        setReport(result);

        if (result.success) {
          const action = dryRun ? 'seriam removidas' : 'foram removidas';

          toast({
            title: dryRun ? 'Simulação concluída' : 'Limpeza concluída',
            description: `${result.totalDuplicatesRemoved} duplicatas ${action} em ${result.duration}s`,
            variant: 'default',
          });
        } else {
          throw new Error('Limpeza falhou');
        }

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        log.error('Erro ao limpar duplicatas:', error);

        toast({
          title: 'Erro ao limpar',
          description: error.message,
          variant: 'destructive',
        });

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  /**
   * Baixa relatório em JSON
   */
  const downloadReport = useCallback(() => {
    if (!report) {
      toast({
        title: 'Nenhum relatório disponível',
        description: 'Execute um escaneamento ou limpeza primeiro',
        variant: 'destructive',
      });
      return;
    }

    try {
      const jsonString = JSON.stringify(report, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `cleanup-report-${timestamp}.json`;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);

      toast({
        title: 'Relatório baixado',
        description: 'Arquivo JSON salvo com sucesso',
      });

      log.info('Relatório exportado', { filename: link.download });
    } catch (err) {
      log.error('Erro ao baixar relatório:', err);
      toast({
        title: 'Erro ao baixar',
        description: 'Não foi possível salvar o relatório',
        variant: 'destructive',
      });
    }
  }, [report, toast]);

  /**
   * Limpa o relatório atual
   */
  const clearReport = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return {
    isLoading,
    report,
    error,
    scanDuplicates,
    cleanDuplicates,
    downloadReport,
    clearReport,
  };
}
