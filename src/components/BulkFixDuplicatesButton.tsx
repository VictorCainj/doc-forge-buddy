import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Database,
} from '@/utils/iconMapper';
import { useToast } from '@/hooks/use-toast';
import { FixDuplicatedImages } from '@/utils/fixDuplicatedImages';
import { log } from '@/utils/logger';

interface BulkFixDuplicatesButtonProps {
  vistoriaIds: string[];
  onFixed?: (
    results: Array<{
      vistoriaId: string;
      success: boolean;
      stats: {
        totalImages: number;
        duplicatesRemoved: number;
        imagesKept: number;
        errors: number;
      };
    }>
  ) => void;
  className?: string;
}

export function BulkFixDuplicatesButton({
  vistoriaIds,
  onFixed,
  className = '',
}: BulkFixDuplicatesButtonProps) {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<Array<{
    vistoriaId: string;
    success: boolean;
    stats: {
      totalImages: number;
      duplicatesRemoved: number;
      imagesKept: number;
      errors: number;
    };
  }> | null>(null);

  const handleBulkFix = async () => {
    if (vistoriaIds.length === 0) return;

    setIsFixing(true);
    setResults(null);

    try {
      log.info(
        `🔧 Iniciando correção em lote para ${vistoriaIds.length} análises`
      );

      const fixPromises = vistoriaIds.map(async (vistoriaId) => {
        const result =
          await FixDuplicatedImages.fixAnalysisDuplicates(vistoriaId);
        return {
          vistoriaId,
          success: result.success,
          stats: result.stats,
        };
      });

      const allResults = await Promise.all(fixPromises);
      setResults(allResults);

      // Calcular estatísticas totais
      const totalStats = allResults.reduce(
        (acc, result) => ({
          totalImages: acc.totalImages + result.stats.totalImages,
          duplicatesRemoved:
            acc.duplicatesRemoved + result.stats.duplicatesRemoved,
          imagesKept: acc.imagesKept + result.stats.imagesKept,
          errors: acc.errors + result.stats.errors,
        }),
        { totalImages: 0, duplicatesRemoved: 0, imagesKept: 0, errors: 0 }
      );

      const successCount = allResults.filter((r) => r.success).length;
      const failedCount = allResults.length - successCount;

      toast({
        title: 'Correção em lote concluída!',
        description: `${successCount} análises corrigidas, ${failedCount} falharam. ${totalStats.duplicatesRemoved} duplicatas removidas no total.`,
        variant: successCount > 0 ? 'default' : 'destructive',
      });

      onFixed?.(allResults);

      log.info('Correção em lote concluída', {
        totalStats,
        successCount,
        failedCount,
      });
    } catch (error) {
      log.error('Erro durante correção em lote:', error);
      toast({
        title: 'Erro na correção em lote',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsFixing(false);
    }
  };

  const totalDuplicates =
    results?.reduce((acc, r) => acc + r.stats.duplicatesRemoved, 0) || 0;
  const hasResults = results !== null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleBulkFix}
          disabled={isFixing || vistoriaIds.length === 0}
          size="sm"
          variant="outline"
          className="h-8"
        >
          {isFixing ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Corrigindo...
            </>
          ) : (
            <>
              <Database className="h-3 w-3 mr-1" />
              Corrigir Todas ({vistoriaIds.length})
            </>
          )}
        </Button>

        {hasResults && (
          <Badge variant="outline" className="text-xs">
            {totalDuplicates} duplicatas removidas
          </Badge>
        )}
      </div>

      {hasResults && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Correção concluída:</strong>{' '}
            {results.filter((r) => r.success).length} de {results.length}{' '}
            análises corrigidas.
            {totalDuplicates > 0 && (
              <span className="block mt-1 text-xs text-muted-foreground">
                {totalDuplicates} imagens duplicadas foram removidas, mantendo
                apenas as originais.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
