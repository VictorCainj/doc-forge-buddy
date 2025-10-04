/**
 * Hook genérico para gerenciamento de localStorage
 * Elimina duplicação de código para operações de localStorage
 */

import { useState, useCallback, useEffect } from 'react';
import { log } from '@/utils/logger';

export interface UseLocalStorageOptions<T = unknown> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  onError?: (error: Error) => void;
}

/**
 * Hook para gerenciar dados no localStorage com tipagem
 */
export const useLocalStorage = <T>(
  key: string,
  defaultValue: T,
  options: UseLocalStorageOptions = {}
) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError = (error) => log.error(`localStorage error for key "${key}":`, error),
  } = options;

  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return deserialize(item);
    } catch (error) {
      onError(error as Error);
      return defaultValue;
    }
  });

  // Função para atualizar o valor
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        // Permitir função como valor para consistência com useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        onError(error as Error);
      }
    },
    [key, serialize, storedValue, onError]
  );

  // Função para remover o valor
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      onError(error as Error);
    }
  }, [key, defaultValue, onError]);

  // Função para verificar se existe no localStorage
  const hasValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(key) !== null;
  }, [key]);

  // Escutar mudanças no localStorage de outras abas
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          onError(error as Error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize, onError]);

  return [storedValue, setValue, removeValue, hasValue] as const;
};

/**
 * Hook especializado para arrays no localStorage
 */
export const useLocalStorageArray = <T>(key: string, defaultValue: T[] = []) => {
  const [array, setArray, removeArray, hasArray] = useLocalStorage(key, defaultValue);

  const addItem = useCallback((item: T) => {
    setArray(prev => [...prev, item]);
  }, [setArray]);

  const removeItem = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, [setArray]);

  const updateItem = useCallback((index: number, item: T) => {
    setArray(prev => prev.map((existingItem, i) => i === index ? item : existingItem));
  }, [setArray]);

  const clearArray = useCallback(() => {
    setArray([]);
  }, [setArray]);

  const findItem = useCallback((predicate: (item: T) => boolean) => {
    return array.find(predicate);
  }, [array]);

  const findIndex = useCallback((predicate: (item: T) => boolean) => {
    return array.findIndex(predicate);
  }, [array]);

  return {
    array,
    setArray,
    removeArray,
    hasArray,
    addItem,
    removeItem,
    updateItem,
    clearArray,
    findItem,
    findIndex,
    length: array.length,
  };
};

/**
 * Hook para cache com expiração
 */
export const useLocalStorageCache = <T>(
  key: string,
  defaultValue: T,
  expirationMinutes: number = 60
) => {
  const cacheKey = `${key}_cache`;
  const timestampKey = `${key}_timestamp`;

  const [cachedValue, setCachedValue] = useLocalStorage(cacheKey, defaultValue);
  const [timestamp, setTimestamp] = useLocalStorage(timestampKey, 0);

  const isExpired = useCallback(() => {
    if (!timestamp) return true;
    const now = Date.now();
    const expirationTime = timestamp + (expirationMinutes * 60 * 1000);
    return now > expirationTime;
  }, [timestamp, expirationMinutes]);

  const setValue = useCallback((value: T) => {
    setCachedValue(value);
    setTimestamp(Date.now());
  }, [setCachedValue, setTimestamp]);

  const getValue = useCallback(() => {
    if (isExpired()) {
      return defaultValue;
    }
    return cachedValue;
  }, [isExpired, cachedValue, defaultValue]);

  const clearCache = useCallback(() => {
    setCachedValue(defaultValue);
    setTimestamp(0);
  }, [setCachedValue, setTimestamp, defaultValue]);

  return {
    value: getValue(),
    setValue,
    clearCache,
    isExpired: isExpired(),
    timestamp,
  };
};

/**
 * Utilitários para localStorage sem hooks (para uso em funções utilitárias)
 */
export const LocalStorageHelpers = {
  /**
   * Salva um valor no localStorage
   */
  setItem: <T>(key: string, value: T): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      log.error(`Erro ao salvar no localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Obtém um valor do localStorage
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      log.error(`Erro ao ler do localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  /**
   * Remove um item do localStorage
   */
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      log.error(`Erro ao remover do localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Verifica se um item existe no localStorage
   */
  hasItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      return window.localStorage.getItem(key) !== null;
    } catch (error) {
      log.error(`Erro ao verificar localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Limpa todo o localStorage
   */
  clear: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.clear();
      return true;
    } catch (error) {
      log.error('Erro ao limpar localStorage:', error);
      return false;
    }
  },

  /**
   * Obtém todas as chaves do localStorage
   */
  getAllKeys: (): string[] => {
    try {
      if (typeof window === 'undefined') return [];
      return Object.keys(window.localStorage);
    } catch (error) {
      log.error('Erro ao obter chaves do localStorage:', error);
      return [];
    }
  },

  /**
   * Obtém o tamanho usado do localStorage em bytes
   */
  getSize: (): number => {
    try {
      if (typeof window === 'undefined') return 0;
      let total = 0;
      for (const key in window.localStorage) {
        if (Object.prototype.hasOwnProperty.call(window.localStorage, key)) {
          total += window.localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      log.error('Erro ao calcular tamanho do localStorage:', error);
      return 0;
    }
  },
};
