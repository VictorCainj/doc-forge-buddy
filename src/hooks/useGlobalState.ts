/**
 * Hook para gerenciar estado global compartilhado
 * Elimina duplicação de estado entre componentes
 */

import { useState, useCallback, useEffect } from 'react';
import { Contract } from '@/types/contract';
import { supabase } from '@/integrations/supabase/client';

// Interface para estado global compartilhado
interface GlobalState {
  // Cache de contratos (evita múltiplas requisições)
  contractsCache: {
    data: Contract[];
    lastFetch: number;
    isValid: boolean;
  };
  
  // Estados de loading globais
  loadingStates: Record<string, boolean>;
  
  // Configurações do usuário
  userSettings: {
    contractsPerPage: number;
    defaultView: 'grid' | 'list';
    autoRefresh: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  
  // Cache de busca
  searchCache: Record<string, Contract[]>;
}

// Estado inicial
const initialState: GlobalState = {
  contractsCache: {
    data: [],
    lastFetch: 0,
    isValid: false,
  },
  loadingStates: {},
  userSettings: {
    contractsPerPage: 6,
    defaultView: 'grid',
    autoRefresh: true,
    theme: 'system',
  },
  searchCache: {},
};

// Singleton para estado global
class GlobalStateManager {
  private state: GlobalState = initialState;
  private listeners: Set<() => void> = new Set();

  getState() {
    return this.state;
  }

  setState(updater: (state: GlobalState) => GlobalState) {
    this.state = updater(this.state);
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

const globalStateManager = new GlobalStateManager();

// Hook principal
export const useGlobalState = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = globalStateManager.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  const state = globalStateManager.getState();

  const setState = useCallback((updater: (state: GlobalState) => GlobalState) => {
    globalStateManager.setState(updater);
  }, []);

  return { state, setState };
};

// Hook para cache de contratos
export const useContractsCache = () => {
  const { state, setState } = useGlobalState();

  const setContracts = useCallback((contracts: Contract[]) => {
    setState(prev => ({
      ...prev,
      contractsCache: {
        data: contracts,
        lastFetch: Date.now(),
        isValid: true,
      },
    }));
  }, [setState]);

  const invalidateCache = useCallback(() => {
    setState(prev => ({
      ...prev,
      contractsCache: {
        ...prev.contractsCache,
        isValid: false,
      },
    }));
  }, [setState]);

  const isExpired = (maxAge: number = 5 * 60 * 1000) => { // 5 minutos
    const { lastFetch } = state.contractsCache;
    return Date.now() - lastFetch > maxAge;
  };

  const shouldFetch = () => {
    const { isValid, data } = state.contractsCache;
    return !isValid || data.length === 0 || isExpired();
  };

  return {
    contracts: state.contractsCache.data,
    isValid: state.contractsCache.isValid,
    lastFetch: state.contractsCache.lastFetch,
    setContracts,
    invalidateCache,
    shouldFetch,
    isExpired: isExpired(),
  };
};

// Hook para estados de loading globais
export const useGlobalLoadingState = () => {
  const { state, setState } = useGlobalState();

  const setLoading = useCallback((key: string, loading: boolean) => {
    setState(prev => ({
      ...prev,
      loadingStates: {
        ...prev.loadingStates,
        [key]: loading,
      },
    }));
  }, [setState]);

  const isLoading = useCallback((key: string) => {
    return state.loadingStates[key] || false;
  }, [state.loadingStates]);

  const clearLoading = useCallback((key: string) => {
    setState(prev => {
      const newLoadingStates = { ...prev.loadingStates };
      delete newLoadingStates[key];
      return {
        ...prev,
        loadingStates: newLoadingStates,
      };
    });
  }, [setState]);

  const isAnyLoading = Object.values(state.loadingStates).some(Boolean);

  return {
    loadingStates: state.loadingStates,
    setLoading,
    isLoading,
    clearLoading,
    isAnyLoading,
  };
};

// Hook para configurações do usuário
export const useUserSettings = () => {
  const { state, setState } = useGlobalState();

  const updateSettings = useCallback((updates: Partial<GlobalState['userSettings']>) => {
    setState(prev => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        ...updates,
      },
    }));

    // Persistir no localStorage
    const newSettings = { ...state.userSettings, ...updates };
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
  }, [setState, state.userSettings]);

  // Carregar configurações do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          userSettings: { ...prev.userSettings, ...parsed },
        }));
      } catch (error) {
        console.warn('Erro ao carregar configurações do usuário:', error);
      }
    }
  }, [setState]);

  return {
    settings: state.userSettings,
    updateSettings,
  };
};

// Hook para cache de busca
export const useSearchCache = () => {
  const { state, setState } = useGlobalState();

  const setSearchResults = useCallback((query: string, results: Contract[]) => {
    setState(prev => ({
      ...prev,
      searchCache: {
        ...prev.searchCache,
        [query]: results,
      },
    }));
  }, [setState]);

  const getSearchResults = useCallback((query: string) => {
    return state.searchCache[query] || null;
  }, [state.searchCache]);

  const clearSearchCache = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchCache: {},
    }));
  }, [setState]);

  return {
    setSearchResults,
    getSearchResults,
    clearSearchCache,
    cacheSize: Object.keys(state.searchCache).length,
  };
};

// Hook unificado para contratos (elimina duplicação)
export const useUnifiedContracts = () => {
  const { contracts, setContracts, shouldFetch, invalidateCache } = useContractsCache();
  const { setLoading, isLoading } = useGlobalLoadingState();
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async (force = false) => {
    if (!force && !shouldFetch) {
      return contracts;
    }

    setLoading('fetchContracts', true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('saved_terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const processedContracts = (data || []).map(contract => ({
        ...contract,
        form_data: typeof contract.form_data === 'string' 
          ? JSON.parse(contract.form_data) 
          : contract.form_data || {},
      })) as Contract[];

      setContracts(processedContracts);
      return processedContracts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar contratos:', err);
      return contracts;
    } finally {
      setLoading('fetchContracts', false);
    }
  }, [contracts, shouldFetch, setContracts, setLoading]);

  const refreshContracts = useCallback(() => {
    invalidateCache();
    return fetchContracts(true);
  }, [invalidateCache, fetchContracts]);

  return {
    contracts,
    loading: isLoading('fetchContracts'),
    error,
    fetchContracts,
    refreshContracts,
  };
};
