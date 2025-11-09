import { useCallback, useMemo, useRef, useEffect } from 'react';
import { isEqual } from 'lodash';

/**
 * Hook para criar callbacks memoizados com dependências otimizadas
 * Evita re-criação desnecessária de funções
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options?: {
    equalityFn?: (a: any, b: any) => boolean;
    maxCacheSize?: number;
  }
): T {
  const { equalityFn = isEqual, maxCacheSize = 10 } = options || {};
  const cacheRef = useRef<Map<string, { deps: any[]; result: T }>>(new Map());
  
  return useCallback((...args: any[]) => {
    const cacheKey = JSON.stringify(deps);
    const cached = cacheRef.current.get(cacheKey);
    
    // Check cache first
    if (cached && equalityFn(cached.deps, deps)) {
      return cached.result(...args);
    }
    
    // Create new callback and cache it
    const newCallback = ((...callbackArgs: any[]) => {
      try {
        return callback(...callbackArgs);
      } catch (error) {
        console.error('Error in memoized callback:', error);
        throw error;
      }
    }) as T;
    
    // Maintain cache size
    if (cacheRef.current.size >= maxCacheSize) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    
    cacheRef.current.set(cacheKey, { deps: [...deps], result: newCallback });
    
    return newCallback(...args);
  }, deps) as T;
}

/**
 * Hook para memoização de resultados computados
 * Otimizado para computações pesadas
 */
export function useOptimizedMemo<T>(
  computeFn: () => T,
  deps: React.DependencyList,
  options?: {
    equalityFn?: (a: any, b: any) => boolean;
    timeout?: number;
    maxCacheSize?: number;
  }
): T {
  const { equalityFn = isEqual, timeout, maxCacheSize = 10 } = options || {};
  const cacheRef = useRef<Map<string, { deps: any[]; result: T; timestamp: number }>>(new Map());
  const computeRef = useRef(computeFn);
  computeRef.current = computeFn;

  useEffect(() => {
    // Cleanup old cache entries
    if (timeout) {
      const now = Date.now();
      for (const [key, value] of cacheRef.current.entries()) {
        if (now - value.timestamp > timeout) {
          cacheRef.current.delete(key);
        }
      }
    }
    
    // Maintain cache size
    if (cacheRef.current.size > maxCacheSize) {
      const entries = Array.from(cacheRef.current.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < entries.length - maxCacheSize; i++) {
        cacheRef.current.delete(entries[i][0]);
      }
    }
  });

  return useMemo(() => {
    const cacheKey = JSON.stringify(deps);
    const cached = cacheRef.current.get(cacheKey);
    
    // Check cache first
    if (cached && equalityFn(cached.deps, deps)) {
      return cached.result;
    }
    
    // Compute new result
    try {
      const result = computeRef.current();
      
      cacheRef.current.set(cacheKey, {
        deps: [...deps],
        result,
        timestamp: Date.now(),
      });
      
      return result;
    } catch (error) {
      console.error('Error in optimized memo:', error);
      throw error;
    }
  }, deps);
}

/**
 * Hook para memoização de objetos complexos
 * Especialmente útil para context providers
 */
export function useMemoizedValue<T>(
  value: T,
  options?: {
    equalityFn?: (a: any, b: any) => boolean;
    debugName?: string;
  }
): T {
  const { equalityFn = isEqual, debugName } = options || {};
  const ref = useRef(value);

  return useMemo(() => {
    if (debugName) {
      console.log(`[useMemoizedValue] ${debugName}: computing new value`);
    }
    
    const newValue = value;
    
    if (!equalityFn(ref.current, newValue)) {
      ref.current = newValue;
    }
    
    return ref.current;
  }, [value]);
}

/**
 * Hook para memoização condicional
 * Computa valor apenas quando condições específicas são atendidas
 */
export function useConditionalMemo<T>(
  shouldCompute: boolean,
  computeFn: () => T,
  deps: React.DependencyList,
  options?: {
    equalityFn?: (a: any, b: any) => boolean;
    fallback?: T;
  }
): T {
  const { equalityFn = isEqual, fallback } = options || {};
  const cacheRef = useRef<Map<string, { deps: any[]; result: T; timestamp: number }>>(new Map());

  return useMemo(() => {
    if (!shouldCompute) {
      return fallback;
    }
    
    const cacheKey = JSON.stringify([...deps, shouldCompute]);
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && equalityFn(cached.deps, [...deps, shouldCompute])) {
      return cached.result;
    }
    
    const result = computeFn();
    
    cacheRef.current.set(cacheKey, {
      deps: [...deps, shouldCompute],
      result,
      timestamp: Date.now(),
    });
    
    return result;
  }, [shouldCompute, ...deps]);
}

/**
 * Hook para memoização de arrays com operações otimizadas
 * Útil para listas e coleções
 */
export function useMemoizedArray<T>(
  items: T[],
  options?: {
    equalityFn?: (a: any, b: any) => boolean;
    sortFn?: (a: T, b: T) => number;
    filterFn?: (item: T, index: number) => boolean;
    mapFn?: (item: T, index: number) => any;
  }
): T[] {
  const { equalityFn = isEqual, sortFn, filterFn, mapFn } = options || {};
  const cacheRef = useRef<Map<string, { result: T[]; timestamp: number }>>(new Map());

  return useMemo(() => {
    let result = [...items];
    
    // Apply transformations
    if (filterFn) {
      result = result.filter(filterFn);
    }
    
    if (sortFn) {
      result = result.sort(sortFn);
    }
    
    if (mapFn) {
      result = result.map(mapFn);
    }
    
    // Check cache
    const cacheKey = JSON.stringify({
      items,
      sortFn: sortFn?.toString(),
      filterFn: filterFn?.toString(),
      mapFn: mapFn?.toString(),
    });
    
    const cached = cacheRef.current.get(cacheKey);
    if (cached && equalityFn(cached.result, result)) {
      return cached.result;
    }
    
    // Update cache
    cacheRef.current.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
    
    return result;
  }, [items, sortFn, filterFn, mapFn]);
}

/**
 * Hook para memoização de eventos com debounce otimizado
 */
export function useDebouncedMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  delay: number,
  options?: {
    equalityFn?: (a: any, b: any) => boolean;
    maxCacheSize?: number;
  }
): T {
  const { equalityFn = isEqual, maxCacheSize = 10 } = options || {};
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<string, { deps: any[]; result: T }>>(new Map());

  return useMemoizedCallback(
    (...args: any[]) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        const cacheKey = JSON.stringify(deps);
        const cached = cacheRef.current.get(cacheKey);
        
        if (cached && equalityFn(cached.deps, deps)) {
          cached.result(...args);
        } else {
          callback(...args);
        }
      }, delay);
    },
    [callback, delay, ...deps],
    { equalityFn, maxCacheSize }
  );
}

/**
 * Hook para memoização com purge automático
 * Útil para cache de dados que mudam infrequently
 */
export function usePurgableMemo<T>(
  computeFn: () => T,
  deps: React.DependencyList,
  options?: {
    equalityFn?: (a: any, b: any) => boolean;
    ttl?: number;
    maxCacheSize?: number;
    onPurge?: (reason: string) => void;
  }
): [T, () => void, boolean] {
  const { equalityFn = isEqual, ttl, maxCacheSize = 10, onPurge } = options || {};
  const cacheRef = useRef<Map<string, { deps: any[]; result: T; timestamp: number; ttl?: number }>>(new Map());
  const [isStale, setIsStale] = React.useState(false);

  const purge = useCallback(() => {
    cacheRef.current.clear();
    setIsStale(false);
    onPurge?.('manual');
  }, [onPurge]);

  const result = useMemo(() => {
    const cacheKey = JSON.stringify(deps);
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    // Check if cached value is still valid
    if (cached) {
      const isExpired = cached.ttl && (now - cached.timestamp) > cached.ttl;
      if (!isExpired && equalityFn(cached.deps, deps)) {
        setIsStale(false);
        return cached.result;
      } else if (isExpired) {
        onPurge?.('expired');
        setIsStale(true);
      }
    }
    
    // Compute new result
    try {
      const result = computeFn();
      
      // Maintain cache size
      if (cacheRef.current.size >= maxCacheSize) {
        const entries = Array.from(cacheRef.current.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < entries.length - maxCacheSize + 1; i++) {
          cacheRef.current.delete(entries[i][0]);
        }
      }
      
      cacheRef.current.set(cacheKey, {
        deps: [...deps],
        result,
        timestamp: now,
        ttl,
      });
      
      setIsStale(false);
      return result;
    } catch (error) {
      console.error('Error in purgable memo:', error);
      throw error;
    }
  }, [computeFn, deps, ttl, maxCacheSize, equalityFn, onPurge]);

  // Auto-purge on mount if TTL is set
  useEffect(() => {
    if (ttl) {
      const interval = setInterval(() => {
        const now = Date.now();
        for (const [key, value] of cacheRef.current.entries()) {
          if (value.ttl && (now - value.timestamp) > value.ttl) {
            cacheRef.current.delete(key);
            setIsStale(true);
            onPurge?.('auto-expired');
          }
        }
      }, ttl / 4); // Check 4 times during TTL
      
      return () => clearInterval(interval);
    }
  }, [ttl, onPurge]);

  return [result, purge, isStale];
}

// Export tipos para TypeScript
export type MemoizedCallback<T extends (...args: any[]) => any> = T;
export type OptimizedMemoOptions = {
  equalityFn?: (a: any, b: any) => boolean;
  timeout?: number;
  maxCacheSize?: number;
};