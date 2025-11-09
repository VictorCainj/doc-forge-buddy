import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { log } from '@/utils/logger';
import { DadosVistoria, ApontamentoVistoria, VistoriaAnaliseWithImages } from '@/types/vistoria';
import { BudgetItemType } from '@/types/orcamento';
'analise' | 'orcamento';
  
  // Estado de interface
  extractionText: string;
  showExtractionPanel: boolean;
  showExternalUrlInput: boolean;
  externalImageUrl: string;
  
  // Estado de UI
  saving: boolean;
  loading: boolean;
  componentError: string | null;
  
  // Estado de análise
  isEditMode: boolean;
  savedAnaliseId: string | null;
  editingAnaliseId: string | null;
  existingAnaliseId: string | null;
  hasExistingAnalise: boolean;
  loadingExistingAnalise: boolean;
  
  // Estado de limpeza
  previewImageModal: string | null;
  documentPreview: string;
}

export interface VistoriaStateActions {
  // Ações de dados básicos
  setDadosVistoria: (dados: DadosVistoria) => void;
  setSelectedPrestadorId: (id: string) => void;
  setDocumentMode: (mode: 'analise' | 'orcamento') => void;
  
  // Ações de interface
  setExtractionText: (text: string) => void;
  setShowExtractionPanel: (show: boolean) => void;
  setShowExternalUrlInput: (show: boolean) => void;
  setExternalImageUrl: (url: string) => void;
  
  // Ações de estado
  setSaving: (saving: boolean) => void;
  setLoading: (loading: boolean) => void;
  setComponentError: (error: string | null) => void;
  
  // Ações de análise
  setIsEditMode: (edit: boolean) => void;
  setSavedAnaliseId: (id: string | null) => void;
  setEditingAnaliseId: (id: string | null) => void;
  setExistingAnaliseId: (id: string | null) => void;
  setHasExistingAnalise: (has: boolean) => void;
  setLoadingExistingAnalise: (loading: boolean) => void;
  
  // Ações de UI
  setPreviewImageModal: (url: string | null) => void;
  setDocumentPreview: (preview: string) => void;
  
  // Ações de limpeza
  clearAllData: () => void;
  resetFormState: () => void;
}

export interface VistoriaStateReturn extends VistoriaFormState, VistoriaStateActions {
  // Estado atual do componente
  currentApontamento: Partial<ApontamentoVistoria & {
    tipo?: BudgetItemType;
    valor?: number;
    quantidade?: number;
  }>;
  setCurrentApontamento: (apontamento: Partial<ApontamentoVistoria & {
    tipo?: BudgetItemType;
    valor?: number;
    quantidade?: number;
  }>) => void;
  editingApontamento: string | null;
  setEditingApontamento: (id: string | null) => void;
  
  // Estados relacionados a contratos
  contracts: Array<{ id: string; form_data: Record<string, string>; created_at: string }>;
  selectedContract: { id: string; form_data: Record<string, string>; created_at: string } | null;
  setSelectedContract: (contract: { id: string; form_data: Record<string, string>; created_at: string } | null) => void;
  
  // Lista de apontamentos (será gerenciada pelo hook useVistoriaApontamentos)
  apontamentos: ApontamentoVistoria[];
  setApontamentos: (apontamentos: ApontamentoVistoria[]) => void;
}

/**
 * Hook customizado para gerenciar o estado local do formulário de vistoria
 */
export const useVistoriaState = (): VistoriaStateReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ contractId?: string }>();

  // Estado principal do formulário
  const [dadosVistoria, setDadosVistoria] = useState<DadosVistoria>({
    locatario: '',
    endereco: '',
    dataVistoria: '',
  });

  const [selectedPrestadorId, setSelectedPrestadorId] = useState<string>('');
  const [documentMode, setDocumentMode] = useState<'analise' | 'orcamento'>('analise');
  
  // Estado de interface
  const [extractionText, setExtractionText] = useState('');
  const [showExtractionPanel, setShowExtractionPanel] = useState(false);
  const [showExternalUrlInput, setShowExternalUrlInput] = useState(false);
  const [externalImageUrl, setExternalImageUrl] = useState('');
  
  // Estado de loading e erro
  const [_loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);
  
  // Estado de análise
  const [isEditMode, setIsEditMode] = useState(false);
  const [savedAnaliseId, setSavedAnaliseId] = useState<string | null>(null);
  const [editingAnaliseId, setEditingAnaliseId] = useState<string | null>(null);
  const [existingAnaliseId, setExistingAnaliseId] = useState<string | null>(null);
  const [hasExistingAnalise, setHasExistingAnalise] = useState(false);
  const [loadingExistingAnalise, setLoadingExistingAnalise] = useState(false);
  
  // Estado de UI
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState('');
  
  // Estado do apontamento atual
  const [currentApontamento, setCurrentApontamento] = useState<Partial<ApontamentoVistoria & {
    tipo?: BudgetItemType;
    valor?: number;
    quantidade?: number;
  }>>({
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

  const [editingApontamento, setEditingApontamento] = useState<string | null>(null);
  
  // Estados de contratos e apontamentos (serão integrados com outros hooks)
  const [contracts, setContracts] = useState<Array<{ id: string; form_data: Record<string, string>; created_at: string }>>([]);
  const [selectedContract, setSelectedContract] = useState<{ id: string; form_data: Record<string, string>; created_at: string } | null>(null);
  const [apontamentos, setApontamentos] = useState<ApontamentoVistoria[]>([]);

  // Capturar erros gerais do componente
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      log.error('Erro capturado no componente AnaliseVistoria:', event.error);
      setComponentError(event.error?.message || 'Erro desconhecido');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Limpar cache quando não houver contrato na URL
  useEffect(() => {
    if (!params.contractId && !location.state) {
      clearAllData();
    }
  }, [params.contractId, location.state]);

  // Função para limpar todos os dados
  const clearAllData = useCallback(() => {
    setApontamentos([]);
    setSelectedContract(null);
    setDadosVistoria({
      locatario: '',
      endereco: '',
      dataVistoria: '',
    });
    setSavedAnaliseId(null);
    setIsEditMode(false);
    setEditingAnaliseId(null);
    setExistingAnaliseId(null);
    setHasExistingAnalise(false);
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
    setEditingApontamento(null);
    setDocumentPreview('');
    localStorage.removeItem('analise-vistoria-state');
  }, []);

  // Função para resetar apenas o estado do formulário (sem limpar apontamentos salvos)
  const resetFormState = useCallback(() => {
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
    setEditingApontamento(null);
    setExtractionText('');
    setShowExtractionPanel(false);
    setShowExternalUrlInput(false);
    setExternalImageUrl('');
  }, []);

  return {
    // Estado
    dadosVistoria,
    selectedPrestadorId,
    documentMode,
    extractionText,
    showExtractionPanel,
    showExternalUrlInput,
    externalImageUrl,
    saving,
    _loading,
    componentError,
    isEditMode,
    savedAnaliseId,
    editingAnaliseId,
    existingAnaliseId,
    hasExistingAnalise,
    loadingExistingAnalise,
    previewImageModal,
    documentPreview,
    currentApontamento,
    editingApontamento,
    contracts,
    selectedContract,
    apontamentos,

    // Ações
    setDadosVistoria,
    setSelectedPrestadorId,
    setDocumentMode,
    setExtractionText,
    setShowExtractionPanel,
    setShowExternalUrlInput,
    setExternalImageUrl,
    setSaving,
    setLoading,
    setComponentError,
    setIsEditMode,
    setSavedAnaliseId,
    setEditingAnaliseId,
    setExistingAnaliseId,
    setHasExistingAnalise,
    setLoadingExistingAnalise,
    setPreviewImageModal,
    setDocumentPreview,
    setCurrentApontamento,
    setEditingApontamento,
    setSelectedContract,
    setContracts,
    setApontamentos,
    clearAllData,
    resetFormState,
  };
};

export default useVistoriaState;