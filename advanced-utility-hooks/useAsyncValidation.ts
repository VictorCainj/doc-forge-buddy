import { useState, useCallback, useRef, useEffect } from 'react';

export interface AsyncValidationState<T> {
  isValidating: boolean;
  isValid: boolean | null; // null para estado inicial
  error: string | null;
  lastValidatedValue: T | null;
}

export interface AsyncValidationActions<T> {
  validate: (value: T) => Promise<boolean>;
  clear: () => void;
  reset: () => void;
}

/**
 * Hook para validação assíncrona com debounce
 * 
 * @param validator - Função de validação assíncrona
 * @param delay - Delay em ms para debounce (padrão: 500ms)
 * @returns Estado e ações de validação assíncrona
 */
export function useAsyncValidation<T>(
  validator: (value: T) => Promise<boolean>,
  delay: number = 500
): AsyncValidationState<T> & AsyncValidationActions<T> {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastValidatedValue, setLastValidatedValue] = useState<T | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const validate = useCallback(async (value: T): Promise<boolean> => {
    // Cancelar validação anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController para esta validação
    abortControllerRef.current = new AbortController();

    return new Promise<boolean>((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        setIsValidating(true);
        setError(null);

        try {
          const result = await validator(value);
          
          if (abortControllerRef.current?.signal.aborted) {
            resolve(false);
            return;
          }

          setIsValid(result);
          setLastValidatedValue(value);
          setIsValidating(false);
          resolve(result);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro na validação';
          setError(errorMessage);
          setIsValid(false);
          setIsValidating(false);
          resolve(false);
        }
      }, delay);
    });
  }, [validator, delay]);

  const clear = useCallback(() => {
    setIsValid(null);
    setError(null);
    setLastValidatedValue(null);
  }, []);

  const reset = useCallback(() => {
    setIsValidating(false);
    setIsValid(null);
    setError(null);
    setLastValidatedValue(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isValidating,
    isValid,
    error,
    lastValidatedValue,
    validate,
    clear,
    reset,
  };
}