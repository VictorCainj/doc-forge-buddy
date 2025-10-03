/**
 * Context para gerenciar estado global da aplicação
 * Centraliza dados que são compartilhados entre múltiplos componentes
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Contract } from '@/types/contract';

// Estados globais da aplicação
export interface AppState {
  // Dados de contratos (cache global)
  contracts: {
    data: Contract[];
    loading: boolean;
    error: string | null;
    lastFetch: number | null;
  };
  
  // Estados de loading globais
  loading: {
    global: boolean;
    operations: Record<string, boolean>;
  };
  
  // Configurações do usuário
  userPreferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'pt-BR' | 'en-US';
    contractsPerPage: number;
    autoSave: boolean;
  };
  
  // Cache de dados frequentemente acessados
  cache: {
    searchResults: Record<string, Contract[]>;
    documentTemplates: Record<string, string>;
    userSettings: Record<string, unknown>;
  };
}

// Ações do reducer
export type AppAction =
  | { type: 'SET_CONTRACTS'; payload: Contract[] }
  | { type: 'SET_CONTRACTS_LOADING'; payload: boolean }
  | { type: 'SET_CONTRACTS_ERROR'; payload: string | null }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_OPERATION_LOADING'; payload: { operation: string; loading: boolean } }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<AppState['userPreferences']> }
  | { type: 'SET_CACHE_DATA'; payload: { key: string; data: unknown } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RESET_STATE' };

// Estado inicial
const initialState: AppState = {
  contracts: {
    data: [],
    loading: false,
    error: null,
    lastFetch: null,
  },
  loading: {
    global: false,
    operations: {},
  },
  userPreferences: {
    theme: 'system',
    language: 'pt-BR',
    contractsPerPage: 6,
    autoSave: true,
  },
  cache: {
    searchResults: {},
    documentTemplates: {},
    userSettings: {},
  },
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CONTRACTS':
      return {
        ...state,
        contracts: {
          ...state.contracts,
          data: action.payload,
          loading: false,
          error: null,
          lastFetch: Date.now(),
        },
      };
      
    case 'SET_CONTRACTS_LOADING':
      return {
        ...state,
        contracts: {
          ...state.contracts,
          loading: action.payload,
        },
      };
      
    case 'SET_CONTRACTS_ERROR':
      return {
        ...state,
        contracts: {
          ...state.contracts,
          error: action.payload,
          loading: false,
        },
      };
      
    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          global: action.payload,
        },
      };
      
    case 'SET_OPERATION_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          operations: {
            ...state.loading.operations,
            [action.payload.operation]: action.payload.loading,
          },
        },
      };
      
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload,
        },
      };
      
    case 'SET_CACHE_DATA':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: action.payload.data,
        },
      };
      
    case 'CLEAR_CACHE':
      return {
        ...state,
        cache: {
          searchResults: {},
          documentTemplates: {},
          userSettings: {},
        },
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
};

// Context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook personalizado
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

// Hooks especializados
export const useContracts = () => {
  const { state, dispatch } = useAppState();
  
  const setContracts = (contracts: Contract[]) => {
    dispatch({ type: 'SET_CONTRACTS', payload: contracts });
  };
  
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_CONTRACTS_LOADING', payload: loading });
  };
  
  const setError = (error: string | null) => {
    dispatch({ type: 'SET_CONTRACTS_ERROR', payload: error });
  };
  
  return {
    contracts: state.contracts.data,
    loading: state.contracts.loading,
    error: state.contracts.error,
    lastFetch: state.contracts.lastFetch,
    setContracts,
    setLoading,
    setError,
  };
};

export const useGlobalLoading = () => {
  const { state, dispatch } = useAppState();
  
  const setGlobalLoading = (loading: boolean) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
  };
  
  const setOperationLoading = (operation: string, loading: boolean) => {
    dispatch({ type: 'SET_OPERATION_LOADING', payload: { operation, loading } });
  };
  
  return {
    globalLoading: state.loading.global,
    operationLoading: state.loading.operations,
    setGlobalLoading,
    setOperationLoading,
    isOperationLoading: (operation: string) => state.loading.operations[operation] || false,
  };
};

export const useUserPreferences = () => {
  const { state, dispatch } = useAppState();
  
  const updatePreferences = (preferences: Partial<AppState['userPreferences']>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
  };
  
  return {
    preferences: state.userPreferences,
    updatePreferences,
  };
};
