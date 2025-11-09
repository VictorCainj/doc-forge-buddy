import { useEffect, useRef } from 'react';

/**
 * Hook para obter o valor anterior de um estado
 * Útil para comparações e animações
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

export default usePrevious;