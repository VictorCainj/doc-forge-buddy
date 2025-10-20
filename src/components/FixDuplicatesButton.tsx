import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from '@/utils/iconMapper';
import { useToast } from '@/hooks/use-toast';
import { FixDuplicatedImages } from '@/utils/fixDuplicatedImages';
import { log } from '@/utils/logger';

interface FixDuplicatesButtonProps {
  vistoriaId: string;
  onFixed?: (stats: {
    totalImages: number;
    duplicatesRemoved: number;
    imagesKept: number;
    errors: number;
  }) => void;
  className?: string;
}

export function FixDuplicatesButton({
  vistoriaId,
  onFixed,
  className = '',
}: FixDuplicatesButtonProps) {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [duplicatesCount, setDuplicatesCount] = useState<number | null>(null);
  const [hasDuplicates, setHasDuplicates] = useState<boolean | null>(null);

  // Verificar duplicatas ao montar o componente
  useEffect(() => {
    checkDuplicates();
  }, [vistoriaId]);

  const checkDuplicates = async () => {
    try {
      const [hasDups, count] = await Promise.all([
        FixDuplicatedImages.hasDuplicates(vistoriaId),
        FixDuplicatedImages.countDuplicates(vistoriaId),
      ]);

      setHasDuplicates(hasDups);
      setDuplicatesCount(count);
    } catch (error) {
      log.error('Erro ao verificar duplicatas:', error);
    }
  };

  const handleFixDuplicates = async () => {
    if (!vistoriaId) return;

    setIsFixing(true);

    try {
      const result =
        await FixDuplicatedImages.fixAnalysisDuplicates(vistoriaId);

      if (result.success) {
        const { stats } = result;

        toast({
          title: 'Duplicatas corrigidas!',
          description: `${stats.duplicatesRemoved} imagens duplicadas foram removidas. ${stats.imagesKept} imagens originais mantidas.`,
          variant: 'default',
        });

        // Atualizar contadores
        setDuplicatesCount(0);
        setHasDuplicates(false);

        // Callback para atualizar a interface
        onFixed?.(stats);

        log.info('Duplicatas corrigidas com sucesso', stats);
      } else {
        toast({
          title: 'Erro ao corrigir duplicatas',
          description:
            'Não foi possível remover as imagens duplicadas. Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Erro ao corrigir duplicatas:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Se ainda está carregando, mostrar loading
  if (hasDuplicates === null || duplicatesCount === null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          disabled
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
        >
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Verificando...
        </Button>
      </div>
    );
  }

  // Se não tem duplicatas, mostrar botão desabilitado
  if (hasDuplicates === false || duplicatesCount === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          disabled
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs opacity-50"
          title="Nenhuma duplicata encontrada"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Sem Duplicatas
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {duplicatesCount !== null && duplicatesCount > 0 && (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {duplicatesCount} duplicata{duplicatesCount !== 1 ? 's' : ''}
        </Badge>
      )}

      <Button
        onClick={handleFixDuplicates}
        disabled={isFixing || !hasDuplicates}
        size="sm"
        variant="outline"
        className="h-8 px-3 text-xs"
      >
        {isFixing ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Corrigindo...
          </>
        ) : (
          <>
            <Trash2 className="h-3 w-3 mr-1" />
            Corrigir Duplicatas
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Versão compacta do botão (apenas ícone)
 */
export function FixDuplicatesButtonCompact({
  vistoriaId,
  onFixed,
  className = '',
}: FixDuplicatesButtonProps) {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [hasDuplicates, setHasDuplicates] = useState<boolean | null>(null);

  useEffect(() => {
    checkDuplicates();
  }, [vistoriaId]);

  const checkDuplicates = async () => {
    try {
      const hasDups = await FixDuplicatedImages.hasDuplicates(vistoriaId);
      setHasDuplicates(hasDups);
    } catch (error) {
      log.error('Erro ao verificar duplicatas:', error);
    }
  };

  const handleFixDuplicates = async () => {
    if (!vistoriaId) return;

    setIsFixing(true);

    try {
      const result =
        await FixDuplicatedImages.fixAnalysisDuplicates(vistoriaId);

      if (result.success) {
        const { stats } = result;

        toast({
          title: 'Duplicatas corrigidas!',
          description: `${stats.duplicatesRemoved} duplicatas removidas, ${stats.imagesKept} originais mantidas.`,
        });

        setHasDuplicates(false);
        onFixed?.(stats);
      } else {
        toast({
          title: 'Erro ao corrigir duplicatas',
          description: 'Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Erro ao corrigir duplicatas:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Se ainda está carregando, mostrar loading
  if (hasDuplicates === null) {
    return (
      <Button
        disabled
        size="sm"
        variant="ghost"
        className={`h-6 w-6 p-0 ${className}`}
        title="Verificando duplicatas..."
      >
        <Loader2 className="h-3 w-3 animate-spin" />
      </Button>
    );
  }

  // Se não tem duplicatas, mostrar botão desabilitado
  if (hasDuplicates === false) {
    return (
      <Button
        disabled
        size="sm"
        variant="ghost"
        className={`h-6 w-6 p-0 opacity-50 ${className}`}
        title="Nenhuma duplicata encontrada"
      >
        <CheckCircle className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleFixDuplicates}
      disabled={isFixing}
      size="sm"
      variant="ghost"
      className={`h-6 w-6 p-0 ${className}`}
      title="Corrigir duplicatas de imagens"
    >
      {isFixing ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
    </Button>
  );
}
