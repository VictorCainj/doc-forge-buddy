/**
 * Hook para gerenciar múltiplos estados de loading
 * Elimina duplicação de useState para loading em diferentes componentes
 */

import { useState, useCallback, useMemo } from 'react';

export interface LoadingStates {
  [key: string]: boolean;
}

export interface UseLoadingStatesReturn {
  loadingStates: LoadingStates;
  isLoading: (key: string) => boolean;
  setLoading: (key: string, value: boolean) => void;
  setMultipleLoading: (states: Record<string, boolean>) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  toggleLoading: (key: string) => void;
  resetAllLoading: () => void;
  isAnyLoading: boolean;
  loadingKeys: string[];
  loadingCount: number;
}

/**
 * Hook para gerenciar múltiplos estados de loading
 */
export const useLoadingStates = (
  initialStates: LoadingStates = {}
): UseLoadingStatesReturn => {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>(initialStates);

  // Verificar se uma chave específica está carregando
  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  // Definir estado de loading para uma chave específica
  const setLoading = useCallback((key: string, value: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Definir múltiplos estados de loading de uma vez
  const setMultipleLoading = useCallback((states: Record<string, boolean>) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states
    }));
  }, []);

  // Iniciar loading para uma chave
  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  // Parar loading para uma chave
  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  // Alternar estado de loading para uma chave
  const toggleLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // Resetar todos os estados de loading
  const resetAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  // Valores computados
  const isAnyLoading = useMemo(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const loadingKeys = useMemo(() => {
    return Object.keys(loadingStates).filter(key => loadingStates[key]);
  }, [loadingStates]);

  const loadingCount = useMemo(() => {
    return loadingKeys.length;
  }, [loadingKeys]);

  return {
    loadingStates,
    isLoading,
    setLoading,
    setMultipleLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    resetAllLoading,
    isAnyLoading,
    loadingKeys,
    loadingCount,
  };
};

/**
 * Hook especializado para operações CRUD
 */
export const useCrudLoadingStates = () => {
  const {
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    isAnyLoading,
  } = useLoadingStates();

  return {
    // Estados específicos do CRUD
    isCreating: isLoading('creating'),
    isReading: isLoading('reading'),
    isUpdating: isLoading('updating'),
    isDeleting: isLoading('deleting'),
    
    // Métodos para controlar estados
    startCreating: () => startLoading('creating'),
    stopCreating: () => stopLoading('creating'),
    startReading: () => startLoading('reading'),
    stopReading: () => stopLoading('reading'),
    startUpdating: () => startLoading('updating'),
    stopUpdating: () => stopLoading('updating'),
    startDeleting: () => startLoading('deleting'),
    stopDeleting: () => stopLoading('deleting'),
    
    // Estado geral
    isAnyLoading,
    
    // Método genérico
    setLoading,
  };
};

/**
 * Hook para operações de formulário
 */
export const useFormLoadingStates = () => {
  const {
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    isAnyLoading,
  } = useLoadingStates();

  return {
    // Estados específicos de formulário
    isSubmitting: isLoading('submitting'),
    isValidating: isLoading('validating'),
    isSaving: isLoading('saving'),
    isUploading: isLoading('uploading'),
    
    // Métodos para controlar estados
    startSubmitting: () => startLoading('submitting'),
    stopSubmitting: () => stopLoading('submitting'),
    startValidating: () => startLoading('validating'),
    stopValidating: () => stopLoading('validating'),
    startSaving: () => startLoading('saving'),
    stopSaving: () => stopLoading('saving'),
    startUploading: () => startLoading('uploading'),
    stopUploading: () => stopLoading('uploading'),
    
    // Estado geral
    isAnyLoading,
    
    // Método genérico
    setLoading,
  };
};

/**
 * Hook para operações de UI
 */
export const useUILoadingStates = () => {
  const {
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    isAnyLoading,
  } = useLoadingStates();

  return {
    // Estados específicos de UI
    isInitializing: isLoading('initializing'),
    isRefreshing: isLoading('refreshing'),
    isSearching: isLoading('searching'),
    isFiltering: isLoading('filtering'),
    isPaginating: isLoading('paginating'),
    
    // Métodos para controlar estados
    startInitializing: () => startLoading('initializing'),
    stopInitializing: () => stopLoading('initializing'),
    startRefreshing: () => startLoading('refreshing'),
    stopRefreshing: () => stopLoading('refreshing'),
    startSearching: () => startLoading('searching'),
    stopSearching: () => stopLoading('searching'),
    startFiltering: () => startLoading('filtering'),
    stopFiltering: () => stopLoading('filtering'),
    startPaginating: () => startLoading('paginating'),
    stopPaginating: () => stopLoading('paginating'),
    
    // Estado geral
    isAnyLoading,
    
    // Método genérico
    setLoading,
  };
};

/**
 * Hook com timeout automático para loading
 */
export const useLoadingWithTimeout = (
  key: string,
  timeoutMs: number = 30000 // 30 segundos por padrão
) => {
  const { isLoading, setLoading } = useLoadingStates();

  const startLoadingWithTimeout = useCallback(() => {
    setLoading(key, true);
    
    const timeoutId = setTimeout(() => {
      setLoading(key, false);
    }, timeoutMs);

    // Retornar função para limpar o timeout
    return () => {
      clearTimeout(timeoutId);
      setLoading(key, false);
    };
  }, [key, timeoutMs, setLoading]);

  return {
    isLoading: isLoading(key),
    startLoadingWithTimeout,
    stopLoading: () => setLoading(key, false),
  };
};

/**
 * Utilitários para loading states
 */
export const LoadingHelpers = {
  /**
   * Cria um wrapper para função assíncrona com loading
   */
  withLoading: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    setLoading: (loading: boolean) => void
  ) => {
    return async (...args: T): Promise<R> => {
      setLoading(true);
      try {
        return await fn(...args);
      } finally {
        setLoading(false);
      }
    };
  },

  /**
   * Cria um wrapper para função assíncrona com loading e error handling
   */
  withLoadingAndError: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    setLoading: (loading: boolean) => void,
    onError?: (error: Error) => void
  ) => {
    return async (...args: T): Promise<R | null> => {
      setLoading(true);
      try {
        return await fn(...args);
      } catch (error) {
        onError?.(error as Error);
        return null;
      } finally {
        setLoading(false);
      }
    };
  },

  /**
   * Delay artificial para demonstração
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};
