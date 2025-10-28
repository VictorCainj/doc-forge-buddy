import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApontamentoVistoria, DadosVistoria } from '@/types/vistoria';
import {
  AnaliseVistoriaContextValue,
  CurrentApontamento,
  DocumentMode,
} from '../types';
import { Contract } from '../types';

const initialState: AnaliseVistoriaContextValue = {
  // Estado principal
  apontamentos: [],
  currentApontamento: {
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
  },
  selectedContract: null,
  dadosVistoria: {
    locatario: '',
    endereco: '',
    dataVistoria: '',
  },
  documentMode: 'analise',
  
  // Estado de edição
  editingApontamento: null,
  savedAnaliseId: null,
  isEditMode: false,
  editingAnaliseId: null,
  existingAnaliseId: null,
  hasExistingAnalise: false,
  
  // Estado de UI
  showExtractionPanel: false,
  extractionText: '',
  previewImageModal: null,
  imageZoom: 1,
  documentPreview: '',
  isContractInfoExpanded: false,
  
  // Prestador
  selectedPrestadorId: '',
  
  // Documentos públicos
  publicDocumentId: null,
  publicDocumentUrl: null,
  
  // Loading
  saving: false,
  loadingExistingAnalise: false,
  
  // Contadores
  apontamentosSemClassificacao: 0,
  
  // URLs externas
  externalImageUrl: '',
  showExternalUrlInput: false,
  
  // Actions
  setApontamentos: () => {},
  setCurrentApontamento: () => {},
  setEditingApontamento: () => {},
  setSelectedContract: () => {},
  setDadosVistoria: () => {},
  setDocumentMode: () => {},
  setDocumentPreview: () => {},
  setSelectedPrestadorId: () => {},
  setIsEditMode: () => {},
  setSavedAnaliseId: () => {},
  setEditingAnaliseId: () => {},
  setExistingAnaliseId: () => {},
  setHasExistingAnalise: () => {},
  setShowExtractionPanel: () => {},
  setExtractionText: () => {},
  setPreviewImageModal: () => {},
  setImageZoom: () => {},
  setIsContractInfoExpanded: () => {},
  setPublicDocumentId: () => {},
  setPublicDocumentUrl: () => {},
  setSaving: () => {},
  setLoadingExistingAnalise: () => {},
  setExternalImageUrl: () => {},
  setShowExternalUrlInput: () => {},
};

const AnaliseVistoriaContext = createContext<AnaliseVistoriaContextValue>(initialState);

export const useAnaliseVistoriaContext = () => {
  const context = useContext(AnaliseVistoriaContext);
  if (!context) {
    throw new Error('useAnaliseVistoriaContext must be used within AnaliseVistoriaProvider');
  }
  return context;
};

interface AnaliseVistoriaProviderProps {
  children: ReactNode;
}

export const AnaliseVistoriaProvider = ({ children }: AnaliseVistoriaProviderProps) => {
  // Estado principal
  const [apontamentos, setApontamentos] = useState<ApontamentoVistoria[]>([]);
  const [currentApontamento, setCurrentApontamento] = useState<CurrentApontamento>({
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
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [dadosVistoria, setDadosVistoria] = useState<DadosVistoria>({
    locatario: '',
    endereco: '',
    dataVistoria: '',
  });
  const [documentMode, setDocumentMode] = useState<DocumentMode>('analise');
  
  // Estado de edição
  const [editingApontamento, setEditingApontamento] = useState<string | null>(null);
  const [savedAnaliseId, setSavedAnaliseId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAnaliseId, setEditingAnaliseId] = useState<string | null>(null);
  const [existingAnaliseId, setExistingAnaliseId] = useState<string | null>(null);
  const [hasExistingAnalise, setHasExistingAnalise] = useState(false);
  
  // Estado de UI
  const [showExtractionPanel, setShowExtractionPanel] = useState(false);
  const [extractionText, setExtractionText] = useState('');
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [documentPreview, setDocumentPreview] = useState<string>('');
  const [isContractInfoExpanded, setIsContractInfoExpanded] = useState(false);
  
  // Prestador
  const [selectedPrestadorId, setSelectedPrestadorId] = useState<string>('');
  
  // Documentos públicos
  const [publicDocumentId, setPublicDocumentId] = useState<string | null>(null);
  const [publicDocumentUrl, setPublicDocumentUrl] = useState<string | null>(null);
  
  // Loading
  const [saving, setSaving] = useState(false);
  const [loadingExistingAnalise, setLoadingExistingAnalise] = useState(false);
  
  // URLs externas
  const [externalImageUrl, setExternalImageUrl] = useState('');
  const [showExternalUrlInput, setShowExternalUrlInput] = useState(false);
  
  // Contadores
  const [apontamentosSemClassificacao, setApontamentosSemClassificacao] = useState(0);
  
  // Efeito para calcular apontamentos sem classificação
  useEffect(() => {
    const semClassificacao = apontamentos.filter(ap => !ap.classificacao).length;
    setApontamentosSemClassificacao(semClassificacao);
  }, [apontamentos]);
  
  const value: AnaliseVistoriaContextValue = {
    // Estado
    apontamentos,
    currentApontamento,
    selectedContract,
    dadosVistoria,
    documentMode,
    editingApontamento,
    savedAnaliseId,
    isEditMode,
    editingAnaliseId,
    existingAnaliseId,
    hasExistingAnalise,
    showExtractionPanel,
    extractionText,
    previewImageModal,
    imageZoom,
    documentPreview,
    isContractInfoExpanded,
    selectedPrestadorId,
    publicDocumentId,
    publicDocumentUrl,
    saving,
    loadingExistingAnalise,
    apontamentosSemClassificacao,
    externalImageUrl,
    showExternalUrlInput,
    
    // Actions
    setApontamentos,
    setCurrentApontamento,
    setEditingApontamento,
    setSelectedContract,
    setDadosVistoria,
    setDocumentMode,
    setDocumentPreview,
    setSelectedPrestadorId,
    setIsEditMode,
    setSavedAnaliseId,
    setEditingAnaliseId,
    setExistingAnaliseId,
    setHasExistingAnalise,
    setShowExtractionPanel,
    setExtractionText,
    setPreviewImageModal,
    setImageZoom,
    setIsContractInfoExpanded,
    setPublicDocumentId,
    setPublicDocumentUrl,
    setSaving,
    setLoadingExistingAnalise,
    setExternalImageUrl,
    setShowExternalUrlInput,
  };
  
  return (
    <AnaliseVistoriaContext.Provider value={value}>
      {children}
    </AnaliseVistoriaContext.Provider>
  );
};
