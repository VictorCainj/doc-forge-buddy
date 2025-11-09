'analise' | 'orcamento';

export interface AnaliseVistoriaContextState {
  // Estado principal
  apontamentos: ApontamentoVistoria[];
  currentApontamento: CurrentApontamento;
  selectedContract: Contract | null;
  dadosVistoria: DadosVistoria;
  documentMode: DocumentMode;
  
  // Estado de edição
  editingApontamento: string | null;
  savedAnaliseId: string | null;
  isEditMode: boolean;
  editingAnaliseId: string | null;
  existingAnaliseId: string | null;
  hasExistingAnalise: boolean;
  
  // Estado de UI
  showExtractionPanel: boolean;
  extractionText: string;
  previewImageModal: string | null;
  imageZoom: number;
  documentPreview: string;
  isContractInfoExpanded: boolean;
  
  // Estado de prestador (modo orçamento)
  selectedPrestadorId: string;
  
  // Estado de documentos públicos
  publicDocumentId: string | null;
  publicDocumentUrl: string | null;
  
  // Estado de loading
  saving: boolean;
  loadingExistingAnalise: boolean;
  
  // Contadores
  apontamentosSemClassificacao: number;
  
  // URLs externas
  externalImageUrl: string;
  showExternalUrlInput: boolean;
}

export interface AnaliseVistoriaContextActions {
  // Apontamentos
  setApontamentos: (apontamentos: ApontamentoVistoria[]) => void;
  setCurrentApontamento: (apontamento: CurrentApontamento) => void;
  setEditingApontamento: (id: string | null) => void;
  
  // Contrato
  setSelectedContract: (contract: Contract | null) => void;
  setDadosVistoria: (dados: DadosVistoria) => void;
  
  // Documento
  setDocumentMode: (mode: DocumentMode) => void;
  setDocumentPreview: (preview: string) => void;
  
  // Prestador
  setSelectedPrestadorId: (id: string) => void;
  
  // Estado de edição
  setIsEditMode: (edit: boolean) => void;
  setSavedAnaliseId: (id: string | null) => void;
  setEditingAnaliseId: (id: string | null) => void;
  setExistingAnaliseId: (id: string | null) => void;
  setHasExistingAnalise: (has: boolean) => void;
  
  // UI
  setShowExtractionPanel: (show: boolean) => void;
  setExtractionText: (text: string) => void;
  setPreviewImageModal: (url: string | null) => void;
  setImageZoom: (zoom: number) => void;
  setIsContractInfoExpanded: (expanded: boolean) => void;
  
  // Documentos públicos
  setPublicDocumentId: (id: string | null) => void;
  setPublicDocumentUrl: (url: string | null) => void;
  
  // Loading
  setSaving: (saving: boolean) => void;
  setLoadingExistingAnalise: (loading: boolean) => void;
  
  // URLs externas
  setExternalImageUrl: (url: string) => void;
  setShowExternalUrlInput: (show: boolean) => void;
}

export type AnaliseVistoriaContextValue = AnaliseVistoriaContextState & AnaliseVistoriaContextActions;

