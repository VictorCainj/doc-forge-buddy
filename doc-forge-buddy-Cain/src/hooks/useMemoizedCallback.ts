import { useCallback } from 'react';

/**
 * Hook para criar callbacks memoizados de forma simples
 * Wrapper otimizado para useCallback com TypeScript avançado
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps) as T;
}

export default useMemoizedCallback;