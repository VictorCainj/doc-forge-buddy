import React, { ComponentType, useMemo, useCallback } from 'react';

/**
 * Higher Order Component para memoização de componentes
 * Previne re-renders desnecessários
 */
export function withMemo<P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<ComponentType<P>> {
  return React.memo(Component, areEqual);
}

/**
 * Hook customizado para memoização de eventos
 * Evita criar novas funções a cada render
 */
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps) as T;
}

/**
 * Hook para memoização de resultados computados
 */
export function useComputed<Result>(
  computeFn: () => Result,
  deps: React.DependencyList
): Result {
  return useMemo(computeFn, deps);
}

/**
 * Wrapper para componentes que recebem children
 * Evita re-renders quando children não mudam
 */
export const MemoizedChildren = React.memo<{
  children: React.ReactNode;
}>(({ children }) => <>{children}</>);

MemoizedChildren.displayName = 'MemoizedChildren';

/**
 * Hook para debounce de valores
 * Útil para campos de busca
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de valores
 * Útil para eventos de scroll
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook para lazy loading de componentes
 */
export function useLazyComponent<T = ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  deps: React.DependencyList = []
): T | null {
  const [Component, setComponent] = React.useState<T | null>(null);

  React.useEffect(() => {
    importFn().then((module) => {
      setComponent(() => module.default as T);
    });
  }, deps);

  return Component;
}
