import { useCallback } from 'react';
import { ApontamentoVistoria } from '@/types/vistoria';
import { useAnaliseVistoriaContext } from '../context/AnaliseVistoriaContext';
import { useToast } from '@/hooks/use-toast';

export const useApontamentosManager = () => {
  const {
    apontamentos,
    currentApontamento,
    editingApontamento,
    documentMode,
    setApontamentos,
    setCurrentApontamento,
    setEditingApontamento,
  } = useAnaliseVistoriaContext();
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
      descricaoServico: currentApontamento.descricaoServico || '',
      vistoriaInicial: {
        fotos: currentApontamento.vistoriaInicial?.fotos || [],
        descritivoLaudo:
          currentApontamento.vistoriaInicial?.descritivoLaudo || '',
      },
      vistoriaFinal: { fotos: currentApontamento.vistoriaFinal?.fotos || [] },
      observacao: currentApontamento.observacao || '',
      classificacao: currentApontamento.classificacao,
      ...(documentMode === 'orcamento' && {
        tipo: currentApontamento.tipo || 'material',
        valor: currentApontamento.valor || 0,
        quantidade: currentApontamento.quantidade || 0,
      }),
    };

    const updatedApontamentos = [...apontamentos, newApontamento];
    setApontamentos(updatedApontamentos);
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      descricaoServico: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
      classificacao: undefined,
      tipo: 'material',
      valor: 0,
      quantidade: 0,
    });

    toast({
      title: 'Apontamento adicionado',
      description: 'O apontamento foi adicionado com sucesso.',
    });
  }, [currentApontamento, apontamentos, documentMode, setApontamentos, setCurrentApontamento, toast]);

  const handleRemoveApontamento = useCallback(
    (id: string) => {
      setApontamentos(apontamentos.filter((ap) => ap.id !== id));
      toast({
        title: 'Apontamento removido',
        description: 'O apontamento foi removido com sucesso.',
      });
    },
    [apontamentos, setApontamentos, toast]
  );

  const handleEditApontamento = useCallback(
    (apontamento: ApontamentoVistoria) => {
      setEditingApontamento(apontamento.id);
      setCurrentApontamento({
        ambiente: apontamento.ambiente,
        subtitulo: apontamento.subtitulo,
        descricao: apontamento.descricao,
        descricaoServico: apontamento.descricaoServico || '',
        vistoriaInicial: {
          fotos: apontamento.vistoriaInicial.fotos,
          descritivoLaudo: apontamento.vistoriaInicial.descritivoLaudo || '',
        },
        vistoriaFinal: { fotos: apontamento.vistoriaFinal.fotos },
        observacao: apontamento.observacao,
        classificacao: apontamento.classificacao,
        tipo: apontamento.tipo || 'material',
        valor: apontamento.valor || 0,
        quantidade: apontamento.quantidade || 0,
      });
      toast({
        title: 'Editando apontamento',
        description: 'Modifique os dados e clique em "Salvar Alterações".',
      });
    },
    [setEditingApontamento, setCurrentApontamento, toast]
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingApontamento) return;

    const updatedApontamentos = apontamentos.map((apontamento) =>
      apontamento.id === editingApontamento
        ? {
            ...apontamento,
            ambiente: currentApontamento.ambiente || '',
            subtitulo: currentApontamento.subtitulo || '',
            descricao: currentApontamento.descricao || '',
            descricaoServico: currentApontamento.descricaoServico || '',
            vistoriaInicial: {
              fotos: currentApontamento.vistoriaInicial?.fotos || [],
              descritivoLaudo:
                currentApontamento.vistoriaInicial?.descritivoLaudo || '',
            },
            vistoriaFinal: {
              fotos: currentApontamento.vistoriaFinal?.fotos || [],
            },
            observacao: currentApontamento.observacao || '',
            classificacao: currentApontamento.classificacao,
            ...(documentMode === 'orcamento' && {
              tipo: currentApontamento.tipo || 'material',
              valor: currentApontamento.valor || 0,
              quantidade: currentApontamento.quantidade || 0,
            }),
          }
        : apontamento
    );

    setApontamentos(updatedApontamentos);
    setEditingApontamento(null);
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      descricaoServico: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
      classificacao: undefined,
      tipo: 'material',
      valor: 0,
      quantidade: 0,
    });

    toast({
      title: 'Apontamento atualizado',
      description: 'As alterações foram salvas com sucesso.',
    });
  }, [
    editingApontamento,
    currentApontamento,
    apontamentos,
    documentMode,
    setApontamentos,
    setEditingApontamento,
    setCurrentApontamento,
    toast,
  ]);

  const handleCancelEdit = useCallback(() => {
    setEditingApontamento(null);
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      descricaoServico: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
      classificacao: undefined,
      tipo: 'material',
      valor: 0,
      quantidade: 0,
    });
  }, [setEditingApontamento, setCurrentApontamento]);

  return {
    handleAddApontamento,
    handleRemoveApontamento,
    handleEditApontamento,
    handleSaveEdit,
    handleCancelEdit,
  };
};
