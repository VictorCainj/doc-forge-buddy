import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useVistoriaImages } from '@/hooks/useVistoriaImages';
import { log } from '@/utils/logger';
import { 
  ApontamentoVistoria, 
  BudgetItemType,
  VistoriaAnaliseWithImages,
  Contract 
} from '../types/vistoria';

interface UseVistoriaHandlersProps {
  apontamentos: ApontamentoVistoria[];
  setApontamentos: (apontamentos: ApontamentoVistoria[]) => void;
  currentApontamento: Partial<ApontamentoVistoria & {
    tipo?: BudgetItemType;
    valor?: number;
    quantidade?: number;
  }>;
  setCurrentApontamento: (apontamento: any) => void;
  editingApontamento: string | null;
  setEditingApontamento: (id: string | null) => void;
  documentMode: 'analise' | 'orcamento';
  fileToBase64: (file: File) => Promise<string>;
  toast: ReturnType<typeof useToast>['toast'];
}

export const useVistoriaHandlers = ({
  apontamentos,
  setApontamentos,
  currentApontamento,
  setCurrentApontamento,
  editingApontamento,
  setEditingApontamento,
  documentMode,
  fileToBase64,
  toast,
}: UseVistoriaHandlersProps) => {
  const { correctText, extractApontamentos, isAILoading } = useOpenAI();

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
        descritivoLaudo: currentApontamento.vistoriaInicial?.descritivoLaudo || '',
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
  }, [currentApontamento, apontamentos, editingApontamento, toast, documentMode]);

  const handleRemoveApontamento = useCallback(
    (id: string) => {
      setApontamentos(apontamentos.filter((ap) => ap.id !== id));
      toast({
        title: 'Apontamento removido',
        description: 'O apontamento foi removido com sucesso.',
      });
    },
    [apontamentos, toast]
  );

  const handleEditApontamento = useCallback(
    (id: string) => {
      const apontamento = apontamentos.find((ap) => ap.id === id);
      if (!apontamento) return;

      setEditingApontamento(id);
      setCurrentApontamento({
        ambiente: apontamento.ambiente,
        subtitulo: apontamento.subtitulo,
        descricao: apontamento.descricao,
        descricaoServico: apontamento.descricaoServico,
        vistoriaInicial: apontamento.vistoriaInicial,
        vistoriaFinal: apontamento.vistoriaFinal,
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
    [apontamentos, toast]
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
              descritivoLaudo: currentApontamento.vistoriaInicial?.descritivoLaudo || '',
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
  }, [editingApontamento, currentApontamento, apontamentos, toast, documentMode]);

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
  }, []);

  const handleCorrectText = async () => {
    const currentText = currentApontamento.observacao || '';
    if (!currentText.trim()) {
      toast({
        title: 'Texto vazio',
        description: 'Não há texto para corrigir na análise técnica.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!correctText) {
        throw new Error('Função correctText não está disponível');
      }

      const correctedText = await correctText(currentText);
      setCurrentApontamento((prev) => ({
        ...prev,
        observacao: correctedText,
      }));
      toast({
        title: 'Texto corrigido',
        description: 'A análise técnica foi corrigida ortograficamente.',
      });
    } catch {
      toast({
        title: 'Erro na correção',
        description: 'Não foi possível corrigir o texto. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleExtractApontamentos = async () => {
    if (!extractionText.trim()) {
      toast({
        title: 'Texto vazio',
        description: 'Digite ou cole o texto da vistoria para extrair os apontamentos.',
        variant: 'destructive',
      });
      return;
    }

    // Avisar se o texto for muito grande
    const textLength = extractionText.length;
    if (textLength > 10000) {
      toast({
        title: 'Texto extenso detectado',
        description: `O texto possui ${textLength} caracteres. O processamento pode levar alguns segundos...`,
      });
    }

    try {
      toast({
        title: 'Processando...',
        description: 'Extraindo apontamentos do texto com IA. Aguarde...',
      });

      if (!extractApontamentos) {
        throw new Error('Função extractApontamentos não está disponível');
      }

      const extractedApontamentos = await extractApontamentos(extractionText);

      if (extractedApontamentos.length === 0) {
        toast({
          title: 'Nenhum apontamento encontrado',
          description: 'Não foi possível extrair apontamentos do texto fornecido. Verifique o formato.',
          variant: 'destructive',
        });
        return;
      }

      // Converter apontamentos extraídos para o formato correto
      const newApontamentos = extractedApontamentos.map((item, index) => ({
        id:
          Date.now().toString() +
          index.toString() +
          Math.random().toString(36).substr(2, 9),
        ambiente: item.ambiente,
        subtitulo: item.subtitulo,
        descricao: item.descricao,
        descricaoServico: '',
        vistoriaInicial: { fotos: [], descritivoLaudo: '' },
        vistoriaFinal: { fotos: [] },
        observacao: '',
        classificacao: undefined,
        ...(documentMode === 'orcamento' && {
          tipo: 'material' as const,
          valor: 0,
          quantidade: 0,
        }),
      }));

      // Adicionar aos apontamentos existentes
      setApontamentos((prev) => [...prev, ...newApontamentos]);

      // Contar ambientes processados
      const ambientesUnicos = new Set(
        extractedApontamentos.map((a) => a.ambiente)
      );

      toast({
        title: 'Apontamentos criados! 🎉',
        description: `${extractedApontamentos.length} apontamento(s) em ${ambientesUnicos.size} ambiente(s) foram criados automaticamente.`,
      });

      // Limpar o texto e fechar o painel
      setExtractionText('');
      setShowExtractionPanel(false);
    } catch (error) {
      log.error('Erro ao extrair apontamentos:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Não foi possível extrair os apontamentos. Tente novamente.';

      toast({
        title: 'Erro ao processar',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleAIAnalysisForCurrentApontamento = async () => {
    console.log('Debug - handleAIAnalysisForCurrentApontamento chamada');
    console.log('Debug - currentApontamento:', {
      fotosInicial: currentApontamento.vistoriaInicial?.fotos?.length || 0,
      fotosFinal: currentApontamento.vistoriaFinal?.fotos?.length || 0,
      descricao: currentApontamento.descricao ? 'Sim' : 'Não',
      descricaoLength: currentApontamento.descricao?.trim().length || 0,
    });

    if (
      !currentApontamento.vistoriaInicial?.fotos?.length ||
      !currentApontamento.vistoriaFinal?.fotos?.length ||
      !currentApontamento.descricao?.trim()
    ) {
      console.log('Debug - Validação falhou');
      toast({
        title: 'Erro',
        description:
          'É necessário ter fotos inicial e final, além da descrição do apontamento.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Debug - Validação passou, iniciando análise');

    try {
      // Converter fotos para base64 se necessário
      const fotosInicialBase64: string[] = [];
      const fotosFinalBase64: string[] = [];

      console.log('Debug - Processando imagens:', {
        fotosInicialCount: currentApontamento.vistoriaInicial.fotos.length,
        fotosFinalCount: currentApontamento.vistoriaFinal.fotos.length,
      });

      // Processar fotos iniciais
      for (
        let i = 0;
        i < currentApontamento.vistoriaInicial.fotos.length;
        i++
      ) {
        const foto = currentApontamento.vistoriaInicial.fotos[i];
        console.log(`Debug - Processando foto inicial ${i + 1}:`, {
          isFile: foto instanceof File,
          isObject: typeof foto === 'object',
          hasUrl: foto && typeof foto === 'object' && 'url' in foto,
          url:
            foto && typeof foto === 'object' && 'url' in foto
              ? foto.url
              : 'N/A',
        });

        if (foto instanceof File) {
          const base64 = await fileToBase64(foto);
          fotosInicialBase64.push(base64);
        } else if (foto && typeof foto === 'object') {
          // Foto do banco de dados - verificar se já é base64 ou se precisa converter
          if (foto.url) {
            // Se a URL já é base64, usar diretamente
            if (foto.url.startsWith('data:image/')) {
              fotosInicialBase64.push(foto.url);
            } else {
              // Se é uma URL normal, converter para base64
              try {
                const response = await fetch(foto.url);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
                fotosInicialBase64.push(base64);
              } catch (error) {
                console.error('Erro ao converter imagem do banco:', error);
                toast({
                  title: 'Erro',
                  description: `Erro ao processar imagem inicial: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                  variant: 'destructive',
                });
                return;
              }
            }
          }
        }
      }

      // Processar fotos finais
      for (const foto of currentApontamento.vistoriaFinal.fotos) {
        if (foto instanceof File) {
          const base64 = await fileToBase64(foto);
          fotosFinalBase64.push(base64);
        } else if (foto && typeof foto === 'object') {
          // Foto do banco de dados - verificar se já é base64 ou se precisa converter
          if (foto.url) {
            // Se a URL já é base64, usar diretamente
            if (foto.url.startsWith('data:image/')) {
              fotosFinalBase64.push(foto.url);
            } else {
              // Se é uma URL normal, converter para base64
              try {
                const response = await fetch(foto.url);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
                fotosFinalBase64.push(base64);
              } catch (error) {
                console.error('Erro ao converter imagem do banco:', error);
                toast({
                  title: 'Erro',
                  description: `Erro ao processar imagem final: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                  variant: 'destructive',
                });
                return;
              }
            }
          }
        }
      }

      if (fotosInicialBase64.length === 0 || fotosFinalBase64.length === 0) {
        toast({
          title: 'Erro',
          description: 'Não foi possível processar as imagens para análise.',
          variant: 'destructive',
        });
        return;
      }

      // Chamar IA para análise comparativa
      const analysis = await compareVistoriaImages(
        fotosInicialBase64,
        fotosFinalBase64,
        currentApontamento.descricao,
        currentApontamento.vistoriaInicial?.descritivoLaudo,
        {
          ambiente: currentApontamento.ambiente,
          subtitulo: currentApontamento.subtitulo,
          observacao: currentApontamento.observacao,
        }
      );

      // Atualizar a análise técnica com o resultado da IA
      setCurrentApontamento((prev) => ({
        ...prev,
        observacao: analysis,
      }));

      toast({
        title: 'Análise por IA concluída',
        description:
          'A análise técnica foi gerada com base nas imagens comparadas.',
      });
    } catch (error) {
      console.error('Erro na análise por IA:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro na análise por IA',
        description: `Ocorreu um erro durante a análise: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  return {
    handleAddApontamento,
    handleRemoveApontamento,
    handleEditApontamento,
    handleSaveEdit,
    handleCancelEdit,
    handleCorrectText,
    handleExtractApontamentos,
    handleAIAnalysisForCurrentApontamento,
  };
};