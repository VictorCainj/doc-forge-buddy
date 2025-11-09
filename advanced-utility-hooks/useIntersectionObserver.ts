import { useEffect, useState, useRef } from 'react';

export interface IntersectionObserverEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
  intersectionRect: DOMRectReadOnly;
  boundingClientRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  target: Element;
  time: number;
}

export interface UseIntersectionObserverReturn {
  ref: React.RefObject<Element>;
  entry: IntersectionObserverEntry | null;
  isIntersecting: boolean;
}

/**
 * Hook para observar interseção de elementos com o viewport
 * 
 * @param options - Opções do IntersectionObserver
 * @param deps - Dependências para re-observar
 * @returns Referência do elemento e estado de interseção
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit,
  deps: React.DependencyList = []
): UseIntersectionObserverReturn {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<Element>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Cleanup observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Criar novo observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [observerEntry] = entries;
        setEntry(observerEntry);
        setIsIntersecting(observerEntry.isIntersecting);
      },
      {
        root: options?.root || null,
        rootMargin: options?.rootMargin || '0px',
        threshold: options?.threshold || 0,
      }
    );

    // Observar elemento
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, deps);

  return {
    ref: elementRef,
    entry,
    isIntersecting,
  };
}