import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void;

/**
 * Hook para gerenciar localStorage com sincronização automática
 * 
 * @param key - Chave do localStorage
 * @param initialValue - Valor inicial
 * @returns [valor, função para definir valor]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetValue<T>] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Obter do localStorage pela chave
      const item = window.localStorage.getItem(key);
      // Parsear JSON ou retornar valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Se erro, retornar valor inicial
      console.warn(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Função para definir valor
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        // Permitir que value seja uma função para ter a mesma API do useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Salvar estado
        setStoredValue(valueToStore);
        
        // Salvar no localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // Um erro mais avançado de tratamento pode ser implementado aqui
        console.warn(`Erro ao definir localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Listener para mudanças no localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Erro ao processar mudança de localStorage:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}