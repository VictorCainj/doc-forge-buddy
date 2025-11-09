import { useState, useEffect, useRef, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface AsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para lidar com operações assíncronas de forma segura
 * Cancela operações se o componente desmontar ou dependências mudarem
 */
export function useAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  dependencies: any[] = [],
  options: AsyncOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<AsyncState<any>>({
    data: null,
    loading: immediate,
    error: null,
  });
  
  const mountedRef = useRef(true);
  const cancelRef = useRef<(() => void) | null>(null);
  
  const execute = useCallback(
    async (...args: Parameters<T>) => {
      if (cancelRef.current) {
        cancelRef.current();
      }
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const controller = new AbortController();
      cancelRef.current = () => controller.abort();
      
      try {
        const data = await asyncFunction(...args);
        
        if (mountedRef.current) {
          setState({ data, loading: false, error: null });
          onSuccess?.(data);
        }
        
        return data;
      } catch (error) {
        if (mountedRef.current && error instanceof Error) {
          setState({ data: null, loading: false, error });
          onError?.(error);
        }
        throw error;
      } finally {
        if (mountedRef.current) {
          cancelRef.current = null;
        }
      }
    },
    [asyncFunction, onSuccess, onError]
  );
  
  useEffect(() => {
    mountedRef.current = true;
    
    if (immediate) {
      execute();
    }
    
    return () => {
      mountedRef.current = false;
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, [execute, immediate]);
  
  return {
    ...state,
    execute,
    reset: () => {
      setState({ data: null, loading: false, error: null });
    },
  };
}

export default useAsync;