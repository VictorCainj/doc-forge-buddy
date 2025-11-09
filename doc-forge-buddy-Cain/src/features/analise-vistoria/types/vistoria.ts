import { BudgetItemType } from '@/types/orcamento';

export interface ApontamentoVistoria {
  id: string;
  ambiente: string;
  subtitulo: string;
  descricao: string;
  descricaoServico: string;
  vistoriaInicial: {
    fotos: (File | {
      name: string;
      size: number;
      type: string;
      lastModified?: number;
      base64?: string;
      isFromDatabase?: boolean;
      isExternal?: boolean;
      url?: string;
      image_serial?: string;
    })[];
    descritivoLaudo: string;
  };
  vistoriaFinal: {
    fotos: (File | {
      name: string;
      size: number;
      type: string;
      lastModified?: number;
      base64?: string;
      isFromDatabase?: boolean;
      isExternal?: boolean;
      url?: string;
      image_serial?: string;
    })[];
  };
  observacao: string;
  classificacao?: 'responsabilidade' | 'revisao';
  tipo?: BudgetItemType;
  valor?: number;
  quantidade?: number;
}

export interface DadosVistoria {
  locatario: string;
  endereco: string;
  dataVistoria: string;
  documentMode?: 'analise' | 'orcamento';
  prestador?: {
    id: string;
  };
}

export interface VistoriaAnaliseWithImages {
  id: string;
  contract_id: string;
  public_document_id?: string;
  dados_vistoria: DadosVistoria & Record<string, unknown>;
  apontamentos: Record<string, unknown>[];
  images?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  form_data: Record<string, string>;
  created_at: string;
}

export interface VistoriaState {
  apontamentos: ApontamentoVistoria[];
  currentApontamento: Partial<ApontamentoVistoria & {
    tipo?: BudgetItemType;
    valor?: number;
    quantidade?: number;
  }>;
  contracts: Contract[];
  selectedContract: Contract | null;
  dadosVistoria: DadosVistoria;
  editingApontamento: string | null;
  savedAnaliseId: string | null;
  isEditMode: boolean;
  existingAnaliseId: string | null;
  hasExistingAnalise: boolean;
  selectedPrestadorId: string;
  documentMode: 'analise' | 'orcamento';
  publicDocumentId: string | null;
}

export interface VistoriaHandlers {
  handleAddApontamento: () => void;
  handleRemoveApontamento: (id: string) => void;
  handleEditApontamento: (id: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleCorrectText: () => Promise<void>;
  handleAIAnalysisForCurrentApontamento: () => Promise<void>;
  handleExtractApontamentos: () => Promise<void>;
  clearAllData: () => void;
  saveAnalysis: () => Promise<void>;
  generateDocument: () => Promise<void>;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ImageValidationOptions {
  maxSize: number;
  maxWidth: number;
  maxHeight: number;
}