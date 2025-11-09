import { useEffect, useState, useRef, useCallback } from 'react';

export interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
  devicePixelContentBoxSize?: ReadonlyArray<ResizeObserverSize>;
}

export interface UseResizeObserverReturn<T extends HTMLElement> {
  ref: React.RefObject<T>;
  bounds: DOMRectReadOnly;
  isResizing: boolean;
}

/**
 * Hook para observar redimensionamento de elementos
 * 
 * @param options - Opções do ResizeObserver
 * @returns Referência do elemento e dimensões
 */
export function useResizeObserver<T extends HTMLElement>(
  options?: ResizeObserverOptions
): UseResizeObserverReturn<T> {
  const [bounds, setBounds] = useState<DOMRectReadOnly>(
    () => new DOMRectReadOnly()
  );
  const [isResizing, setIsResizing] = useState(false);
  const ref = useRef<T>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    setIsResizing(true);
    
    // Debounce do evento de resize
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, 150);

    if (entries.length > 0) {
      const entry = entries[0];
      setBounds(entry.contentRect);
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Cleanup observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Criar novo observer
    observerRef.current = new ResizeObserver(handleResize);
    observerRef.current.observe(element, options);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize, options]);

  return {
    ref,
    bounds,
    isResizing,
  };
}