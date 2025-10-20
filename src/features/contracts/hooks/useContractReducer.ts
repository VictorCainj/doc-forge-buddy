import { useReducer, Dispatch } from 'react';
import { Contract, VistoriaType, PersonType } from '@/types/contract';

/**
 * Estado centralizado para a página de Contratos
 * Substitui ~20 useState por um único reducer
 */
export type ContractState = {
  // Dados
  contracts: Contract[];
  selectedContract: Contract | null;

  // Paginação
  currentPage: number;
  contractsPerPage: number;
  hasMore: boolean;
  totalCount: number;

  // Modais
  modals: {
    agendamento: boolean;
    recusaAssinatura: boolean;
    whatsapp: boolean;
    assinante: boolean;
    statusVistoria: boolean;
  };

  // Dados dos formulários
  formData: {
    dataVistoria: string;
    horaVistoria: string;
    tipoVistoria: VistoriaType;
    tipoVistoriaRecusa: VistoriaType;
    dataRealizacaoVistoria: string;
    whatsAppType: PersonType | null;
    selectedPerson: string;
    assinanteSelecionado: string;
    statusVistoria: 'APROVADA' | 'REPROVADA';
  };

  // Estados de loading
  loading: {
    fetch: boolean;
    loadMore: boolean;
    generating: string | null;
    deleting: string | null;
  };

  // Dados pendentes
  pendingDocument: {
    contract: Contract | null;
    template: string;
    documentType: string;
  } | null;
};

/**
 * Ações disponíveis para o reducer
 */
export type ContractAction =
  // Dados
  | { type: 'SET_CONTRACTS'; payload: Contract[] }
  | { type: 'ADD_CONTRACTS'; payload: Contract[] }
  | { type: 'UPDATE_CONTRACT'; payload: Contract }
  | { type: 'DELETE_CONTRACT'; payload: string }
  | { type: 'SELECT_CONTRACT'; payload: Contract | null }

  // Paginação
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'SET_TOTAL_COUNT'; payload: number }

  // Modais
  | { type: 'OPEN_MODAL'; payload: keyof ContractState['modals'] }
  | { type: 'CLOSE_MODAL'; payload: keyof ContractState['modals'] }
  | { type: 'CLOSE_ALL_MODALS' }

  // Form Data
  | {
      type: 'SET_FORM_DATA';
      payload: { key: keyof ContractState['formData']; value: any };
    }
  | { type: 'RESET_FORM_DATA' }

  // Loading
  | {
      type: 'SET_LOADING';
      payload: { key: keyof ContractState['loading']; value: any };
    }

  // Pending Document
  | { type: 'SET_PENDING_DOCUMENT'; payload: ContractState['pendingDocument'] }

  // Bulk
  | { type: 'RESET_STATE' };

/**
 * Estado inicial
 */
export const initialState: ContractState = {
  contracts: [],
  selectedContract: null,

  currentPage: 1,
  contractsPerPage: 6,
  hasMore: false,
  totalCount: 0,

  modals: {
    agendamento: false,
    recusaAssinatura: false,
    whatsapp: false,
    assinante: false,
    statusVistoria: false,
  },

  formData: {
    dataVistoria: '',
    horaVistoria: '',
    tipoVistoria: 'final',
    tipoVistoriaRecusa: 'vistoria',
    dataRealizacaoVistoria: '',
    whatsAppType: null,
    selectedPerson: '',
    assinanteSelecionado: '',
    statusVistoria: 'APROVADA',
  },

  loading: {
    fetch: false,
    loadMore: false,
    generating: null,
    deleting: null,
  },

  pendingDocument: null,
};

/**
 * Reducer function
 */
function contractReducer(
  state: ContractState,
  action: ContractAction
): ContractState {
  switch (action.type) {
    // Dados
    case 'SET_CONTRACTS':
      return { ...state, contracts: action.payload };

    case 'ADD_CONTRACTS':
      return { ...state, contracts: [...state.contracts, ...action.payload] };

    case 'UPDATE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'DELETE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.filter((c) => c.id !== action.payload),
      };

    case 'SELECT_CONTRACT':
      return { ...state, selectedContract: action.payload };

    // Paginação
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };

    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };

    case 'SET_TOTAL_COUNT':
      return { ...state, totalCount: action.payload };

    // Modais
    case 'OPEN_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: true },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: false },
      };

    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modals: {
          agendamento: false,
          recusaAssinatura: false,
          whatsapp: false,
          assinante: false,
          statusVistoria: false,
        },
      };

    // Form Data
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'RESET_FORM_DATA':
      return {
        ...state,
        formData: initialState.formData,
      };

    // Loading
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    // Pending Document
    case 'SET_PENDING_DOCUMENT':
      return { ...state, pendingDocument: action.payload };

    // Reset
    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

/**
 * Hook customizado que encapsula o reducer
 *
 * @example
 * ```tsx
 * const { state, dispatch, actions } = useContractReducer();
 *
 * // Usar actions helper
 * actions.openModal('agendamento');
 * actions.selectContract(contract);
 *
 * // Ou dispatch direto
 * dispatch({ type: 'SET_CONTRACTS', payload: contracts });
 * ```
 */
export function useContractReducer() {
  const [state, dispatch] = useReducer(contractReducer, initialState);

  // Helper actions para simplificar uso
  const actions = {
    // Contratos
    setContracts: (contracts: Contract[]) =>
      dispatch({ type: 'SET_CONTRACTS', payload: contracts }),
    addContracts: (contracts: Contract[]) =>
      dispatch({ type: 'ADD_CONTRACTS', payload: contracts }),
    updateContract: (contract: Contract) =>
      dispatch({ type: 'UPDATE_CONTRACT', payload: contract }),
    deleteContract: (id: string) =>
      dispatch({ type: 'DELETE_CONTRACT', payload: id }),
    selectContract: (contract: Contract | null) =>
      dispatch({ type: 'SELECT_CONTRACT', payload: contract }),

    // Paginação
    setPage: (page: number) => dispatch({ type: 'SET_PAGE', payload: page }),
    setHasMore: (hasMore: boolean) =>
      dispatch({ type: 'SET_HAS_MORE', payload: hasMore }),
    setTotalCount: (count: number) =>
      dispatch({ type: 'SET_TOTAL_COUNT', payload: count }),

    // Modais
    openModal: (modal: keyof ContractState['modals']) =>
      dispatch({ type: 'OPEN_MODAL', payload: modal }),
    closeModal: (modal: keyof ContractState['modals']) =>
      dispatch({ type: 'CLOSE_MODAL', payload: modal }),
    closeAllModals: () => dispatch({ type: 'CLOSE_ALL_MODALS' }),

    // Form Data
    setFormData: (key: string, value: any) =>
      dispatch({
        type: 'SET_FORM_DATA',
        payload: { key: key as keyof ContractState['formData'], value },
      }),
    resetFormData: () => dispatch({ type: 'RESET_FORM_DATA' }),

    // Loading
    setLoading: (key: keyof ContractState['loading'], value: any) =>
      dispatch({ type: 'SET_LOADING', payload: { key, value } }),

    // Pending
    setPendingDocument: (data: ContractState['pendingDocument']) =>
      dispatch({ type: 'SET_PENDING_DOCUMENT', payload: data }),

    // Reset
    reset: () => dispatch({ type: 'RESET_STATE' }),
  };

  return { state, dispatch, actions };
}

/**
 * Type helper para dispatch
 */
export type ContractDispatch = Dispatch<ContractAction>;
