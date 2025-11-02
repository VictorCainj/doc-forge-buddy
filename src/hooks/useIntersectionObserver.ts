/**
 * Hook para Intersection Observer - Lazy loading de elementos
 */

import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook para detectar quando elemento entra na viewport
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, boolean] {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = false,
  } = options;

  const elementRef = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Verificar se IntersectionObserver está disponível
    if (!('IntersectionObserver' in window)) {
      // Fallback: considerar visível imediatamente
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsIntersecting(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [elementRef, isIntersecting];
}

/**
 * Hook para lazy loading de múltiplos elementos
 */
export function useMultipleIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  count: number,
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>[], boolean[]] {
  const refs = useRef<RefObject<T>[]>(
    Array.from({ length: count }, () => ({ current: null } as RefObject<T>))
  );
  const [visibility, setVisibility] = useState<boolean[]>(
    new Array(count).fill(false)
  );

  useEffect(() => {
    const elements = refs.current.map((ref) => ref.current).filter(Boolean) as T[];
    if (elements.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      setVisibility(new Array(count).fill(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = elements.indexOf(entry.target as T);
          if (index !== -1) {
            setVisibility((prev) => {
              const newVisibility = [...prev];
              newVisibility[index] = entry.isIntersecting;
              return newVisibility;
            });

            if (options.triggerOnce && entry.isIntersecting) {
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '50px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [count, options.threshold, options.rootMargin, options.triggerOnce]);

  return [refs.current, visibility];
}

