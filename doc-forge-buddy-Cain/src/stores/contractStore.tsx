/**
 * Store para gerenciamento de contratos
 * Estado local de contratos sendo editados/manipulados
 */

import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

export interface Contract {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  value: number;
  client_name: string;
  property_address: string;
  created_at: string;
  updated_at: string;
  // Outros campos do contrato
  [key: string]: any;
}

export interface ContractEditState {
  currentContract: Contract | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: string | null;
  errors: Record<string, string>;
  validationErrors: Record<string, string>;
}

export interface ContractStore {
  state: ContractEditState;
  actions: {
    setCurrentContract: (contract: Contract | null) => void;
    startEditing: (contract: Contract) => void;
    stopEditing: () => void;
    updateField: (field: string, value: any) => void;
    save: () => Promise<{ success: boolean; error?: string }>;
    reset: () => void;
    validate: () => { isValid: boolean; errors: Record<string, string> };
  };
}

// Ações do reducer
const ContractActions = {
  SET_CONTRACT: 'SET_CONTRACT',
  SET_EDITING: 'SET_EDITING',
  UPDATE_FIELD: 'UPDATE_FIELD',
  SET_SAVED: 'SET_SAVED',
  SET_ERROR: 'SET_ERROR',
  SET_VALIDATION_ERRORS: 'SET_VALIDATION_ERRORS',
  RESET: 'RESET',
} as const;

type ContractAction =
  | { type: typeof ContractActions.SET_CONTRACT; payload: Contract | null }
  | { type: typeof ContractActions.SET_EDITING; payload: boolean }
  | { type: typeof ContractActions.UPDATE_FIELD; payload: { field: string; value: any } }
  | { type: typeof ContractActions.SET_SAVED; payload: string }
  | { type: typeof ContractActions.SET_ERROR; payload: Record<string, string> }
  | { type: typeof ContractActions.SET_VALIDATION_ERRORS; payload: Record<string, string> }
  | { type: typeof ContractActions.RESET };

// Estado inicial
const initialState: ContractEditState = {
  currentContract: null,
  isEditing: false,
  hasUnsavedChanges: false,
  lastSaved: null,
  errors: {},
  validationErrors: {},
};

// Reducer
const contractReducer = (state: ContractEditState, action: ContractAction): ContractEditState => {
  switch (action.type) {
    case ContractActions.SET_CONTRACT:
      return {
        ...state,
        currentContract: action.payload,
        isEditing: false,
        hasUnsavedChanges: false,
        errors: {},
        validationErrors: {},
      };

    case ContractActions.SET_EDITING:
      return {
        ...state,
        isEditing: action.payload,
        hasUnsavedChanges: action.payload ? state.hasUnsavedChanges : false,
      };

    case ContractActions.UPDATE_FIELD:
      if (!state.currentContract) return state;
      
      return {
        ...state,
        currentContract: {
          ...state.currentContract,
          [action.payload.field]: action.payload.value,
          updated_at: new Date().toISOString(),
        },
        hasUnsavedChanges: true,
        errors: {
          ...state.errors,
          [action.payload.field]: '', // Limpar erro do campo
        },
      };

    case ContractActions.SET_SAVED:
      return {
        ...state,
        hasUnsavedChanges: false,
        lastSaved: action.payload,
        errors: {},
      };

    case ContractActions.SET_ERROR:
      return {
        ...state,
        errors: action.payload,
      };

    case ContractActions.SET_VALIDATION_ERRORS:
      return {
        ...state,
        validationErrors: action.payload,
      };

    case ContractActions.RESET:
      return {
        ...initialState,
      };

    default:
      return state;
  }
};

// Context
const ContractStoreContext = createContext<ContractStore | null>(null);

// Provider
interface ContractStoreProviderProps {
  children: ReactNode;
}

export const ContractStoreProvider = ({ children }: ContractStoreProviderProps) => {
  const [state, dispatch] = useReducer(contractReducer, initialState);

  // Validação básica de campos
  const validateContract = useCallback((contract: Contract): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!contract.title?.trim()) {
      errors.title = 'Título é obrigatório';
    }

    if (!contract.client_name?.trim()) {
      errors.client_name = 'Nome do cliente é obrigatório';
    }

    if (!contract.property_address?.trim()) {
      errors.property_address = 'Endereço da propriedade é obrigatório';
    }

    if (!contract.start_date) {
      errors.start_date = 'Data de início é obrigatória';
    }

    if (!contract.end_date) {
      errors.end_date = 'Data de fim é obrigatória';
    }

    if (contract.start_date && contract.end_date && new Date(contract.start_date) >= new Date(contract.end_date)) {
      errors.end_date = 'Data de fim deve ser posterior à data de início';
    }

    if (!contract.value || contract.value <= 0) {
      errors.value = 'Valor deve ser maior que zero';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  // Ações
  const setCurrentContract = useCallback((contract: Contract | null) => {
    dispatch({ type: ContractActions.SET_CONTRACT, payload: contract });
  }, []);

  const startEditing = useCallback((contract: Contract) => {
    dispatch({ type: ContractActions.SET_CONTRACT, payload: contract });
    dispatch({ type: ContractActions.SET_EDITING, payload: true });
  }, []);

  const stopEditing = useCallback(() => {
    dispatch({ type: ContractActions.SET_EDITING, payload: false });
  }, []);

  const updateField = useCallback((field: string, value: any) => {
    dispatch({ type: ContractActions.UPDATE_FIELD, payload: { field, value } });
  }, []);

  const save = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.currentContract) {
      return { success: false, error: 'Nenhum contrato selecionado' };
    }

    // Validar antes de salvar
    const validation = validateContract(state.currentContract);
    if (!validation.isValid) {
      dispatch({ type: ContractActions.SET_VALIDATION_ERRORS, payload: validation.errors });
      return { success: false, error: 'Dados inválidos' };
    }

    try {
      // Aqui seria feita a chamada para a API
      // Por enquanto, simulamos um save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch({ type: ContractActions.SET_SAVED, payload: new Date().toISOString() });
      dispatch({ type: ContractActions.SET_EDITING, payload: false });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao salvar contrato' 
      };
    }
  }, [state.currentContract, validateContract]);

  const reset = useCallback(() => {
    dispatch({ type: ContractActions.RESET });
  }, []);

  const validate = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    if (!state.currentContract) {
      return { isValid: false, errors: { general: 'Nenhum contrato selecionado' } };
    }
    return validateContract(state.currentContract);
  }, [state.currentContract, validateContract]);

  const store: ContractStore = {
    state,
    actions: {
      setCurrentContract,
      startEditing,
      stopEditing,
      updateField,
      save,
      reset,
      validate,
    },
  };

  return (
    <ContractStoreContext.Provider value={store}>
      {children}
    </ContractStoreContext.Provider>
  );
};

// Hook
export const useContractStore = (): ContractStore => {
  const context = useContext(ContractStoreContext);
  if (!context) {
    throw new Error('useContractStore must be used within a ContractStoreProvider');
  }
  return context;
};