/**
 * Hook para navegação por teclado acessível
 * Implementa padrões de navegação WCAG
 */

import { useEffect, useCallback, useRef } from 'react';

export interface UseKeyboardNavigationOptions {
  /** Elementos que podem receber foco */
  focusableSelector?: string;
  /** Permitir navegação circular (volta ao início) */
  circular?: boolean;
  /** Teclas personalizadas para navegação */
  customKeys?: {
    next?: string[];
    previous?: string[];
    first?: string[];
    last?: string[];
  };
  /** Callback quando o foco muda */
  onFocusChange?: (element: HTMLElement, index: number) => void;
}

export interface UseKeyboardNavigationReturn {
  /** Referência para o container */
  containerRef: React.RefObject<HTMLElement>;
  /** Focar no primeiro elemento */
  focusFirst: () => void;
  /** Focar no último elemento */
  focusLast: () => void;
  /** Focar no próximo elemento */
  focusNext: () => void;
  /** Focar no elemento anterior */
  focusPrevious: () => void;
  /** Focar em um elemento específico por índice */
  focusIndex: (index: number) => void;
  /** Obter todos os elementos focáveis */
  getFocusableElements: () => HTMLElement[];
}

export const useKeyboardNavigation = (
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationReturn => {
  const {
    focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    circular = true,
    customKeys = {},
    onFocusChange,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const currentFocusIndex = useRef<number>(-1);

  // ✅ Teclas padrão para navegação
  const defaultKeys = {
    next: ['ArrowDown', 'ArrowRight'],
    previous: ['ArrowUp', 'ArrowLeft'],
    first: ['Home'],
    last: ['End'],
  };

  const keys = { ...defaultKeys, ...customKeys };

  // ✅ Obter elementos focáveis
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelector)
    ) as HTMLElement[];
    
    // Filtrar elementos visíveis e não desabilitados
    return elements.filter(element => {
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !element.hasAttribute('disabled') &&
        element.tabIndex !== -1
      );
    });
  }, [focusableSelector]);

  // ✅ Focar em um elemento específico
  const focusElement = useCallback((element: HTMLElement, index: number) => {
    element.focus();
    currentFocusIndex.current = index;
    onFocusChange?.(element, index);
  }, [onFocusChange]);

  // ✅ Focar no primeiro elemento
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      focusElement(elements[0], 0);
    }
  }, [getFocusableElements, focusElement]);

  // ✅ Focar no último elemento
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      const lastIndex = elements.length - 1;
      focusElement(elements[lastIndex], lastIndex);
    }
  }, [getFocusableElements, focusElement]);

  // ✅ Focar no próximo elemento
  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    let nextIndex = currentFocusIndex.current + 1;
    
    if (nextIndex >= elements.length) {
      nextIndex = circular ? 0 : elements.length - 1;
    }
    
    focusElement(elements[nextIndex], nextIndex);
  }, [getFocusableElements, focusElement, circular]);

  // ✅ Focar no elemento anterior
  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    let prevIndex = currentFocusIndex.current - 1;
    
    if (prevIndex < 0) {
      prevIndex = circular ? elements.length - 1 : 0;
    }
    
    focusElement(elements[prevIndex], prevIndex);
  }, [getFocusableElements, focusElement, circular]);

  // ✅ Focar em um índice específico
  const focusIndex = useCallback((index: number) => {
    const elements = getFocusableElements();
    if (index >= 0 && index < elements.length) {
      focusElement(elements[index], index);
    }
  }, [getFocusableElements, focusElement]);

  // ✅ Manipulador de eventos de teclado
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, altKey, metaKey } = event;
    
    // Ignorar se modificadores estão pressionados
    if (ctrlKey || altKey || metaKey) return;

    // Verificar se a tecla corresponde a uma ação
    if (keys.next.includes(key)) {
      event.preventDefault();
      focusNext();
    } else if (keys.previous.includes(key)) {
      event.preventDefault();
      focusPrevious();
    } else if (keys.first.includes(key)) {
      event.preventDefault();
      focusFirst();
    } else if (keys.last.includes(key)) {
      event.preventDefault();
      focusLast();
    }
  }, [keys, focusNext, focusPrevious, focusFirst, focusLast]);

  // ✅ Rastrear elemento atualmente focado
  const handleFocusIn = useCallback((event: FocusEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) return;
    
    const elements = getFocusableElements();
    const focusedElement = event.target as HTMLElement;
    const index = elements.indexOf(focusedElement);
    
    if (index !== -1) {
      currentFocusIndex.current = index;
      onFocusChange?.(focusedElement, index);
    }
  }, [getFocusableElements, onFocusChange]);

  // ✅ Configurar event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focusin', handleFocusIn);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusin', handleFocusIn);
    };
  }, [handleKeyDown, handleFocusIn]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusIndex,
    getFocusableElements,
  };
};
