/**
 * Hook com useReducer para gerenciar estados complexos de modais
 * Substitui 25+ useState por um reducer organizado
 */

// @ts-nocheck
import { useReducer, useCallback } from 'react';
import { Contract, VistoriaType, PersonType } from '@/types/contract';

// Estado do reducer
export interface ContractModalState {
  // Estados dos modais
  modals: {
    agendamento: boolean;
    recusaAssinatura: boolean;
    whatsApp: boolean;
    assinante: boolean;
    nps: boolean;
    npsNumbers: boolean;
    edit: boolean;
  };
  
  // Contratos selecionados
  selectedContracts: {
    main: Contract | null;
    nps: Contract | null;
    editing: Contract | null;
  };
  
  // Dados de formulário
  formData: {
    agendamento: {
      dataVistoria: string;
      horaVistoria: string;
      tipoVistoria: VistoriaType;
    };
    recusaAssinatura: {
      dataRealizacaoVistoria: string;
      tipoVistoriaRecusa: VistoriaType;
    };
    whatsApp: {
      type: PersonType | null;
      selectedPerson: string;
    };
    assinante: {
      selecionado: string;
    };
    nps: {
      method: 'email' | 'whatsapp' | null;
      whatsAppType: PersonType | null;
      selectedPerson: string;
      numbers: Record<string, string>;
      selectedParties: Record<string, boolean>;
    };
    edit: Record<string, string>;
  };
  
  // Estados de loading
  loading: {
    generatingDocument: string | null;
    updating: boolean;
  };
  
  // Dados pendentes
  pendingData: {
    document: {
      contract: Contract;
      template: string;
      documentType: string;
    } | null;
  };
}

// Ações do reducer
export type ContractModalAction =
  // Ações de modais
  | { type: 'OPEN_AGENDAMENTO_MODAL'; payload: Contract }
  | { type: 'CLOSE_AGENDAMENTO_MODAL' }
  | { type: 'OPEN_RECUSA_MODAL'; payload: Contract }
  | { type: 'CLOSE_RECUSA_MODAL' }
  | { type: 'OPEN_WHATSAPP_MODAL'; payload: { contract: Contract; type: PersonType } }
  | { type: 'CLOSE_WHATSAPP_MODAL' }
  | { type: 'OPEN_ASSINANTE_MODAL'; payload: { contract: Contract; template: string; documentType: string } }
  | { type: 'CLOSE_ASSINANTE_MODAL' }
  | { type: 'OPEN_NPS_MODAL'; payload: Contract }
  | { type: 'CLOSE_NPS_MODAL' }
  | { type: 'OPEN_NPS_NUMBERS_MODAL' }
  | { type: 'CLOSE_NPS_NUMBERS_MODAL' }
  | { type: 'OPEN_EDIT_MODAL'; payload: Contract }
  | { type: 'CLOSE_EDIT_MODAL' }
  
  // Ações de formulário
  | { type: 'UPDATE_AGENDAMENTO_DATA'; payload: Partial<ContractModalState['formData']['agendamento']> }
  | { type: 'UPDATE_RECUSA_DATA'; payload: Partial<ContractModalState['formData']['recusaAssinatura']> }
  | { type: 'UPDATE_WHATSAPP_DATA'; payload: Partial<ContractModalState['formData']['whatsApp']> }
  | { type: 'UPDATE_ASSINANTE_DATA'; payload: Partial<ContractModalState['formData']['assinante']> }
  | { type: 'UPDATE_NPS_DATA'; payload: Partial<ContractModalState['formData']['nps']> }
  | { type: 'UPDATE_EDIT_DATA'; payload: Record<string, string> }
  
  // Ações de loading
  | { type: 'SET_GENERATING_DOCUMENT'; payload: string | null }
  | { type: 'SET_UPDATING'; payload: boolean }
  
  // Ações de reset
  | { type: 'RESET_MODAL_DATA'; payload: keyof ContractModalState['formData'] }
  | { type: 'RESET_ALL' };

// Estado inicial
const initialState: ContractModalState = {
  modals: {
    agendamento: false,
    recusaAssinatura: false,
    whatsApp: false,
    assinante: false,
    nps: false,
    npsNumbers: false,
    edit: false,
  },
  selectedContracts: {
    main: null,
    nps: null,
    editing: null,
  },
  formData: {
    agendamento: {
      dataVistoria: '',
      horaVistoria: '',
      tipoVistoria: 'final',
    },
    recusaAssinatura: {
      dataRealizacaoVistoria: '',
      tipoVistoriaRecusa: 'vistoria',
    },
    whatsApp: {
      type: null,
      selectedPerson: '',
    },
    assinante: {
      selecionado: '',
    },
    nps: {
      method: null,
      whatsAppType: null,
      selectedPerson: '',
      numbers: {},
      selectedParties: {},
    },
    edit: {},
  },
  loading: {
    generatingDocument: null,
    updating: false,
  },
  pendingData: {
    document: null,
  },
};

// Reducer
const contractModalReducer = (
  state: ContractModalState,
  action: ContractModalAction
): ContractModalState => {
  switch (action.type) {
    case 'OPEN_AGENDAMENTO_MODAL':
      return {
        ...state,
        modals: { ...state.modals, agendamento: true },
        selectedContracts: { ...state.selectedContracts, main: action.payload },
      };
      
    case 'CLOSE_AGENDAMENTO_MODAL':
      return {
        ...state,
        modals: { ...state.modals, agendamento: false },
        selectedContracts: { ...state.selectedContracts, main: null },
        formData: {
          ...state.formData,
          agendamento: initialState.formData.agendamento,
        },
      };
      
    case 'OPEN_RECUSA_MODAL':
      return {
        ...state,
        modals: { ...state.modals, recusaAssinatura: true },
        selectedContracts: { ...state.selectedContracts, main: action.payload },
      };
      
    case 'CLOSE_RECUSA_MODAL':
      return {
        ...state,
        modals: { ...state.modals, recusaAssinatura: false },
        selectedContracts: { ...state.selectedContracts, main: null },
        formData: {
          ...state.formData,
          recusaAssinatura: initialState.formData.recusaAssinatura,
          assinante: initialState.formData.assinante,
        },
      };
      
    case 'OPEN_WHATSAPP_MODAL':
      return {
        ...state,
        modals: { ...state.modals, whatsApp: true },
        selectedContracts: { ...state.selectedContracts, main: action.payload.contract },
        formData: {
          ...state.formData,
          whatsApp: { ...state.formData.whatsApp, type: action.payload.type },
        },
      };
      
    case 'CLOSE_WHATSAPP_MODAL':
      return {
        ...state,
        modals: { ...state.modals, whatsApp: false },
        selectedContracts: { ...state.selectedContracts, main: null },
        formData: {
          ...state.formData,
          whatsApp: initialState.formData.whatsApp,
          assinante: initialState.formData.assinante,
        },
      };
      
    case 'OPEN_ASSINANTE_MODAL':
      return {
        ...state,
        modals: { ...state.modals, assinante: true },
        pendingData: {
          ...state.pendingData,
          document: action.payload,
        },
      };
      
    case 'CLOSE_ASSINANTE_MODAL':
      return {
        ...state,
        modals: { ...state.modals, assinante: false },
        pendingData: { ...state.pendingData, document: null },
        formData: {
          ...state.formData,
          assinante: initialState.formData.assinante,
        },
      };
      
    case 'OPEN_NPS_MODAL':
      return {
        ...state,
        modals: { ...state.modals, nps: true },
        selectedContracts: { ...state.selectedContracts, nps: action.payload },
      };
      
    case 'CLOSE_NPS_MODAL':
      return {
        ...state,
        modals: { ...state.modals, nps: false },
        selectedContracts: { ...state.selectedContracts, nps: null },
        formData: {
          ...state.formData,
          nps: initialState.formData.nps,
        },
      };
      
    case 'OPEN_NPS_NUMBERS_MODAL':
      return {
        ...state,
        modals: { ...state.modals, npsNumbers: true },
      };
      
    case 'CLOSE_NPS_NUMBERS_MODAL':
      return {
        ...state,
        modals: { ...state.modals, npsNumbers: false },
      };
      
    case 'OPEN_EDIT_MODAL':
      return {
        ...state,
        modals: { ...state.modals, edit: true },
        selectedContracts: { ...state.selectedContracts, editing: action.payload },
        formData: {
          ...state.formData,
          edit: action.payload.form_data || {},
        },
      };
      
    case 'CLOSE_EDIT_MODAL':
      return {
        ...state,
        modals: { ...state.modals, edit: false },
        selectedContracts: { ...state.selectedContracts, editing: null },
        formData: { ...state.formData, edit: {} },
        loading: { ...state.loading, updating: false },
      };
      
    case 'UPDATE_AGENDAMENTO_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          agendamento: { ...state.formData.agendamento, ...action.payload },
        },
      };
      
    case 'UPDATE_RECUSA_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          recusaAssinatura: { ...state.formData.recusaAssinatura, ...action.payload },
        },
      };
      
    case 'UPDATE_WHATSAPP_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          whatsApp: { ...state.formData.whatsApp, ...action.payload },
        },
      };
      
    case 'UPDATE_ASSINANTE_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          assinante: { ...state.formData.assinante, ...action.payload },
        },
      };
      
    case 'UPDATE_NPS_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          nps: { ...state.formData.nps, ...action.payload },
        },
      };
      
    case 'UPDATE_EDIT_DATA':
      return {
        ...state,
        formData: { ...state.formData, edit: action.payload },
      };
      
    case 'SET_GENERATING_DOCUMENT':
      return {
        ...state,
        loading: { ...state.loading, generatingDocument: action.payload },
      };
      
    case 'SET_UPDATING':
      return {
        ...state,
        loading: { ...state.loading, updating: action.payload },
      };
      
    case 'RESET_MODAL_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload]: initialState.formData[action.payload],
        },
      };
      
    case 'RESET_ALL':
      return initialState;
      
    default:
      return state;
  }
};

// Hook principal
export const useContractModalReducer = () => {
  const [state, dispatch] = useReducer(contractModalReducer, initialState);

  // ✅ Actions organizadas por categoria
  const actions = {
    // Modais
    openAgendamentoModal: useCallback((contract: Contract) => {
      dispatch({ type: 'OPEN_AGENDAMENTO_MODAL', payload: contract });
    }, []),
    
    closeAgendamentoModal: useCallback(() => {
      dispatch({ type: 'CLOSE_AGENDAMENTO_MODAL' });
    }, []),
    
    openRecusaModal: useCallback((contract: Contract) => {
      dispatch({ type: 'OPEN_RECUSA_MODAL', payload: contract });
    }, []),
    
    closeRecusaModal: useCallback(() => {
      dispatch({ type: 'CLOSE_RECUSA_MODAL' });
    }, []),
    
    openWhatsAppModal: useCallback((contract: Contract, type: PersonType) => {
      dispatch({ type: 'OPEN_WHATSAPP_MODAL', payload: { contract, type } });
    }, []),
    
    closeWhatsAppModal: useCallback(() => {
      dispatch({ type: 'CLOSE_WHATSAPP_MODAL' });
    }, []),
    
    openAssinanteModal: useCallback((contract: Contract, template: string, documentType: string) => {
      dispatch({ type: 'OPEN_ASSINANTE_MODAL', payload: { contract, template, documentType } });
    }, []),
    
    closeAssinanteModal: useCallback(() => {
      dispatch({ type: 'CLOSE_ASSINANTE_MODAL' });
    }, []),
    
    openNPSModal: useCallback((contract: Contract) => {
      dispatch({ type: 'OPEN_NPS_MODAL', payload: contract });
    }, []),
    
    closeNPSModal: useCallback(() => {
      dispatch({ type: 'CLOSE_NPS_MODAL' });
    }, []),
    
    openEditModal: useCallback((contract: Contract) => {
      dispatch({ type: 'OPEN_EDIT_MODAL', payload: contract });
    }, []),
    
    closeEditModal: useCallback(() => {
      dispatch({ type: 'CLOSE_EDIT_MODAL' });
    }, []),
    
    // Formulários
    updateAgendamentoData: useCallback((data: Partial<ContractModalState['formData']['agendamento']>) => {
      dispatch({ type: 'UPDATE_AGENDAMENTO_DATA', payload: data });
    }, []),
    
    updateRecusaData: useCallback((data: Partial<ContractModalState['formData']['recusaAssinatura']>) => {
      dispatch({ type: 'UPDATE_RECUSA_DATA', payload: data });
    }, []),
    
    updateWhatsAppData: useCallback((data: Partial<ContractModalState['formData']['whatsApp']>) => {
      dispatch({ type: 'UPDATE_WHATSAPP_DATA', payload: data });
    }, []),
    
    updateAssinanteData: useCallback((data: Partial<ContractModalState['formData']['assinante']>) => {
      dispatch({ type: 'UPDATE_ASSINANTE_DATA', payload: data });
    }, []),
    
    updateNPSData: useCallback((data: Partial<ContractModalState['formData']['nps']>) => {
      dispatch({ type: 'UPDATE_NPS_DATA', payload: data });
    }, []),
    
    updateEditData: useCallback((data: Record<string, string>) => {
      dispatch({ type: 'UPDATE_EDIT_DATA', payload: data });
    }, []),
    
    // Loading
    setGeneratingDocument: useCallback((id: string | null) => {
      dispatch({ type: 'SET_GENERATING_DOCUMENT', payload: id });
    }, []),
    
    setUpdating: useCallback((updating: boolean) => {
      dispatch({ type: 'SET_UPDATING', payload: updating });
    }, []),
    
    // Reset
    resetModalData: useCallback((modalType: keyof ContractModalState['formData']) => {
      dispatch({ type: 'RESET_MODAL_DATA', payload: modalType });
    }, []),
    
    resetAll: useCallback(() => {
      dispatch({ type: 'RESET_ALL' });
    }, []),
  };

  return {
    state,
    actions,
    // ✅ Getters convenientes
    isModalOpen: (modalType: keyof ContractModalState['modals']) => state.modals[modalType],
    isGenerating: (id: string) => state.loading.generatingDocument === id,
    isUpdating: state.loading.updating,
  };
};
