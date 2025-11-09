/**
 * Tipos para a feature de Contratos
 */

export interface ContractFilters {
  selectedMonth: string;
  selectedYear: string;
  showFavoritesOnly: boolean;
  selectedTagFilter: string;
}

export interface ContractStats {
  totalContracts: number;
  displayedContracts: number;
  favoriteContracts: number;
  contractsWithTags: number;
}

export interface ContractActionHandler {
  generateDocument: (contract: Contract, template: string, documentType: string) => void;
  handleGenerateAgendamento: () => void;
  handleGenerateRecusaAssinatura: () => void;
  handleGenerateWhatsApp: () => void;
  handleGenerateWithAssinante: () => void;
  handleGenerateStatusVistoria: () => void;
}

export interface ExportOptions {
  selectedMonth?: string;
  selectedYear?: string;
  hasSearched?: boolean;
}

export interface DocumentTemplate {
  name: string;
  template: string;
  documentType: string;
}

export interface ContractFormData {
  dataVistoria?: string;
  horaVistoria?: string;
  tipoVistoria?: string;
  selectedPerson?: string;
  whatsAppType?: string;
  assinanteSelecionado?: string;
  dataRealizacaoVistoria?: string;
  tipoVistoriaRecusa?: string;
  statusVistoria?: string;
}

export interface ContractModalState {
  agendamento: boolean;
  recusaAssinatura: boolean;
  statusVistoria: boolean;
  whatsapp: boolean;
  assinante: boolean;
}

export interface ContractReducerState {
  currentPage: number;
  loading: {
    generating: string | null;
    loadMore: boolean;
  };
  modals: ContractModalState;
  selectedContract: Contract | null;
  pendingDocument: DocumentTemplate | null;
  formData: ContractFormData;
}

export interface ContractReducerActions {
  setPage: (page: number) => void;
  setLoading: (type: keyof ContractReducerState['loading'], value: any) => void;
  openModal: (modal: keyof ContractModalState) => void;
  closeModal: (modal: keyof ContractModalState) => void;
  selectContract: (contract: Contract | null) => void;
  setPendingDocument: (document: DocumentTemplate | null) => void;
  setFormData: (key: keyof ContractFormData, value: any) => void;
  resetFormData: () => void;
}

export interface ContractReducer {
  state: ContractReducerState;
  actions: ContractReducerActions;
}

// Re-exportar o tipo Contract existente
export type { Contract } from '@/types/contract';