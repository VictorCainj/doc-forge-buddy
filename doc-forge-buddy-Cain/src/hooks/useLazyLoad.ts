import { useState, useEffect, useRef } from 'react';

/**
 * Hook para lazy loading de componentes ou bibliotecas
 * @param threshold - Percentual do elemento que deve estar visível para carregar (0-1)
 * @param rootMargin - Margem do root para iniciar o carregamento
 */
export function useLazyLoad(
  threshold = 0.1,
  rootMargin = '0px 0px 50px 0px'
) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoaded) {
          setIsVisible(true);
          setIsLoaded(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, isLoaded]);

  return { elementRef, isVisible, isLoaded };
}

/**
 * Hook para lazy loading de bibliotecas com cache
 */
export function useLazyImport<T = any>(
  importFunction: () => Promise<{ default: T }>
) {
  const [component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = async () => {
    if (component || isLoading || hasLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const importedModule = await importFunction();
      setComponent(importedModule.default);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar módulo'));
    } finally {
      setIsLoading(false);
    }
  };

  return { component, isLoading, error, load, hasLoaded };
}

/**
 * Hook para pré-carregamento de bibliotecas
 */
export function usePreloadLibrary() {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedLibs, setPreloadedLibs] = useState<Set<string>>(new Set());

  const preload = async (libName: string, importFunction: () => Promise<any>) => {
    if (preloadedLibs.has(libName) || isPreloading) return;

    setIsPreloading(true);
    try {
      await importFunction();
      setPreloadedLibs(prev => new Set([...prev, libName]));
    } catch (error) {
      console.warn(`Falha ao pré-carregar biblioteca ${libName}:`, error);
    } finally {
      setIsPreloading(false);
    }
  };

  return { preload, isPreloading, preloadedLibs };
}

/**
 * Hook para monitoramento de performance de carregamento
 */
export function useLoadingMetrics() {
  const [metrics, setMetrics] = useState({
    loadStartTime: 0,
    loadEndTime: 0,
    loadDuration: 0,
    loadedSize: 0,
  });

  const startLoad = () => {
    setMetrics(prev => ({
      ...prev,
      loadStartTime: performance.now(),
    }));
  };

  const endLoad = (size?: number) => {
    const endTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      loadEndTime: endTime,
      loadDuration: endTime - prev.loadStartTime,
      loadedSize: size || prev.loadedSize,
    }));
  };

  const resetMetrics = () => {
    setMetrics({
      loadStartTime: 0,
      loadEndTime: 0,
      loadDuration: 0,
      loadedSize: 0,
    });
  };

  return { metrics, startLoad, endLoad, resetMetrics };
}