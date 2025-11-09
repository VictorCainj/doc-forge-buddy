// Exemplo de uso dos hooks customizados da vistoria
import React from 'react';
import { useVistoriaState } from '@/hooks/useVistoriaState';
import { useVistoriaApi } from '@/hooks/useVistoriaApi';
import { useVistoriaValidation } from '@/hooks/useVistoriaValidation';
import { useVistoriaApontamentos } from '@/hooks/useVistoriaApontamentos';
import { useVistoriaImages } from '@/hooks/useVistoriaImages';
import { useVistoriaPrestadores } from '@/hooks/useVistoriaPrestadores';

const ExemploUsoHooks: React.FC = () => {
  // Hook de estado
  const {
    dadosVistoria,
    documentMode,
    setDadosVistoria,
    clearAllData,
  } = useVistoriaState();

  // Hook de API
  const {
    contracts,
    saveAnalysis,
    loadAnalysisData,
  } = useVistoriaApi();

  // Hook de validação
  const {
    canSaveAnalysis,
    validateVistoria,
  } = useVistoriaValidation();

  // Hook de apontamentos
  const {
    apontamentos,
    addApontamento,
    validateCurrentApontamento,
  } = useVistoriaApontamentos();

  // Hook de imagens
  const {
    handleFileUpload,
    convertImagesForAI,
  } = useVistoriaImages();

  // Hook de prestadores
  const {
    selection: prestadorSelection,
    selectPrestador,
  } = useVistoriaPrestadores();

  // Exemplo de função completa usando múltiplos hooks
  const handleSalvarAnaliseCompleta = async () => {
    try {
      // 1. Validar dados
      const validation = validateVistoria(dadosVistoria, apontamentos, documentMode);
      if (validation.hasBlockingErrors) {
        console.error('Erros de validação:', validation.overall);
        return;
      }

      // 2. Verificar se pode salvar
      const canSave = canSaveAnalysis(dadosVistoria, apontamentos, documentMode);
      if (!canSave.canSave) {
        console.error('Não pode salvar:', canSave.reason);
        return;
      }

      // 3. Salvar análise
      const result = await saveAnalysis(
        dadosVistoria,
        apontamentos,
        'contract-id', // obter do estado
        undefined, // existingAnaliseId
        prestadorSelection.selectedId || undefined,
        documentMode
      );

      if (result.success) {
        console.log('Análise salva com ID:', result.analiseId);
      } else {
        console.error('Erro ao salvar:', result.error);
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };

  // Exemplo de função para adicionar apontamento com validação
  const handleAdicionarApontamentoComValidacao = (
    novoApontamento: any
  ) => {
    // Usar o hook de validação específico do apontamento atual
    const validation = validateCurrentApontamento(documentMode);
    
    if (!validation.isValid) {
      console.error('Apontamento inválido:', validation.errors);
      return false;
    }

    // Adicionar apontamento
    addApontamento(novoApontamento);
    return true;
  };

  // Exemplo de processamento de imagens para IA
  const processarImagensParaIA = async (fotos: any[]) => {
    try {
      const base64Images = await convertImagesForAI(fotos);
      console.log('Imagens convertidas para IA:', base64Images.length);
      return base64Images;
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      return [];
    }
  };

  // Exemplo de uso do hook de prestadores
  const handleSelecionarPrestador = (prestadorId: string) => {
    const canSelect = prestadorSelection.canSelectPrestador?.(prestadorId);
    if (canSelect?.canSelect) {
      selectPrestador(prestadorId);
    } else {
      console.error('Não pode selecionar prestador:', canSelect?.reason);
    }
  };

  return (
    <div className="p-4">
      <h2>Exemplo de Uso dos Hooks Customizados</h2>
      
      <div className="space-y-4">
        <div>
          <h3>Estado Atual</h3>
          <p>Modo: {documentMode}</p>
          <p>Apontamentos: {apontamentos.length}</p>
          <p>Contratos carregados: {contracts.length}</p>
          <p>Prestador selecionado: {prestadorSelection.selectedPrestador?.nome || 'Nenhum'}</p>
        </div>

        <div>
          <h3>Ações</h3>
          <button onClick={handleSalvarAnaliseCompleta}>
            Salvar Análise Completa
          </button>
          <button onClick={clearAllData}>
            Limpar Todos os Dados
          </button>
        </div>

        <div>
          <h3>Validação</h3>
          <p>Pode salvar: {canSaveAnalysis(dadosVistoria, apontamentos, documentMode).canSave ? 'Sim' : 'Não'}</p>
          <p>Apontamento atual válido: {validateCurrentApontamento(documentMode).isValid ? 'Sim' : 'Não'}</p>
        </div>

        <div>
          <h3>Estatísticas</h3>
          <p>Total de prestadores: {prestadores?.length || 0}</p>
          <p>Prestadores ativos: {prestadorSelection.prestadores?.filter(p => p.ativo).length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default ExemploUsoHooks;