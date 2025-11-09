import { useCallback } from 'react';
import { ApontamentoVistoria } from '@/types/vistoria';
import { BudgetItemType } from '@/types/orcamento';
'@/components/ui/use-toast';

interface UseApontamentosManagerProps {
  currentApontamento: Partial<ApontamentoVistoria & { tipo?: BudgetItemType; valor?: number; quantidade?: number }>;
  editingApontamento: string | null;
  documentMode: 'analise' | 'orcamento';
  onAdd: (apontamento: ApontamentoVistoria) => void;
  onUpdate: (id: string, data: Partial<ApontamentoVistoria>) => void;
  onRemove: (id: string) => void;
  onSetCurrent: (apontamento: Partial<ApontamentoVistoria>) => void;
  onResetCurrent: () => void;
  onSetEditing: (id: string | null) => void;
}

export function useApontamentosManager({
  currentApontamento,
  editingApontamento,
  documentMode,
  onAdd,
  onUpdate,
  onRemove,
  onSetCurrent,
  onResetCurrent,
  onSetEditing,
}: UseApontamentosManagerProps) {
  const { toast } = useToast();

  const handleAddApontamento = useCallback(() => {
    if (!currentApontamento.ambiente || !currentApontamento.descricao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o ambiente e a descrição do apontamento.',
        variant: 'destructive',
      });
      return;
    }

    const newApontamento: ApontamentoVistoria = {
      id: Date.now().toString(),
      ambiente: currentApontamento.ambiente || '',
      subtitulo: currentApontamento.subtitulo || '',
      descricao: currentApontamento.descricao || '',
      vistoriaInicial: {
        fotos: currentApontamento.vistoriaInicial?.fotos || [],
      },
      vistoriaFinal: { fotos: currentApontamento.vistoriaFinal?.fotos || [] },
      observacao: currentApontamento.observacao || '',
      ...(documentMode === 'orcamento' && {
        tipo: currentApontamento.tipo || 'material',
        valor: currentApontamento.valor || 0,
        quantidade: currentApontamento.quantidade || 0,
      }),
    };

    onAdd(newApontamento);
    toast({
      title: 'Apontamento adicionado',
      description: 'O apontamento foi adicionado com sucesso.',
    });
  }, [currentApontamento, documentMode, onAdd, toast]);

  const handleRemoveApontamento = useCallback((id: string) => {
    onRemove(id);
    toast({
      title: 'Apontamento removido',
      description: 'O apontamento foi removido com sucesso.',
    });
  }, [onRemove, toast]);

  const handleEditApontamento = useCallback((apontamento: ApontamentoVistoria) => {
    onSetEditing(apontamento.id);
    onSetCurrent({
      ambiente: apontamento.ambiente,
      subtitulo: apontamento.subtitulo,
      descricao: apontamento.descricao,
      vistoriaInicial: {
        fotos: apontamento.vistoriaInicial.fotos,
        descritivoLaudo: apontamento.vistoriaInicial.descritivoLaudo || '',
      },
      vistoriaFinal: { fotos: apontamento.vistoriaFinal.fotos },
      observacao: apontamento.observacao,
      tipo: apontamento.tipo || 'material',
      valor: apontamento.valor || 0,
      quantidade: apontamento.quantidade || 0,
    });
    toast({
      title: 'Editando apontamento',
      description: 'Modifique os dados e clique em "Salvar Alterações".',
    });
  }, [onSetEditing, onSetCurrent, toast]);

  const handleSaveEdit = useCallback(() => {
    if (!editingApontamento) return;

    const updatedData: Partial<ApontamentoVistoria> = {
      ambiente: currentApontamento.ambiente || '',
      subtitulo: currentApontamento.subtitulo || '',
      descricao: currentApontamento.descricao || '',
      vistoriaInicial: {
        fotos: currentApontamento.vistoriaInicial?.fotos || [],
        descritivoLaudo: currentApontamento.vistoriaInicial?.descritivoLaudo || '',
      },
      vistoriaFinal: {
        fotos: currentApontamento.vistoriaFinal?.fotos || [],
      },
      observacao: currentApontamento.observacao || '',
      ...(documentMode === 'orcamento' && {
        tipo: currentApontamento.tipo || 'material',
        valor: currentApontamento.valor || 0,
        quantidade: currentApontamento.quantidade || 0,
      }),
    };

    onUpdate(editingApontamento, updatedData);
    onResetCurrent();
    onSetEditing(null);
    
    toast({
      title: 'Alterações salvas',
      description: 'O apontamento foi atualizado com sucesso.',
    });
  }, [editingApontamento, currentApontamento, documentMode, onUpdate, onResetCurrent, onSetEditing, toast]);

  const handleCancelEdit = useCallback(() => {
    onResetCurrent();
    onSetEditing(null);
    toast({
      title: 'Edição cancelada',
      description: 'As alterações foram descartadas.',
    });
  }, [onResetCurrent, onSetEditing, toast]);

  const handleRemoveFotoInicial = useCallback((index: number) => {
    onSetCurrent({
      ...currentApontamento,
      vistoriaInicial: {
        ...currentApontamento.vistoriaInicial,
        fotos: currentApontamento.vistoriaInicial?.fotos?.filter((_, i) => i !== index) || [],
      },
    });
    toast({
      title: 'Foto removida',
      description: 'A foto foi removida da vistoria inicial.',
    });
  }, [currentApontamento, onSetCurrent, toast]);

  const handleRemoveFotoFinal = useCallback((index: number) => {
    onSetCurrent({
      ...currentApontamento,
      vistoriaFinal: {
        ...currentApontamento.vistoriaFinal,
        fotos: currentApontamento.vistoriaFinal?.fotos?.filter((_, i) => i !== index) || [],
      },
    });
    toast({
      title: 'Foto removida',
      description: 'A foto foi removida da vistoria final.',
    });
  }, [currentApontamento, onSetCurrent, toast]);

  const handlePaste = useCallback((event: ClipboardEvent, tipo: 'inicial' | 'final') => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      onSetCurrent({
        ...currentApontamento,
        [`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]: {
          fotos: [
            ...(currentApontamento[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]?.fotos || []),
            ...files,
          ],
        },
      });

      toast({
        title: 'Imagens coladas',
        description: `${files.length} imagem(ns) adicionada(s) via Ctrl+V.`,
      });
    }
  }, [currentApontamento, onSetCurrent, toast]);

  return {
    handleAddApontamento,
    handleRemoveApontamento,
    handleEditApontamento,
    handleSaveEdit,
    handleCancelEdit,
    handleRemoveFotoInicial,
    handleRemoveFotoFinal,
    handlePaste,
  };
}
