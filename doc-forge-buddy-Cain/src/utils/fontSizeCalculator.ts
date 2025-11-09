/**
 * Utilitário para cálculo seguro de tamanho de fonte
 * Evita memory leaks criando e removendo elementos DOM temporários
 */

/**
 * Calcula o tamanho ótimo de fonte para o conteúdo
 * @param content Conteúdo HTML a ser medido
 * @param fontSize Tamanho inicial da fonte
 * @returns Tamanho ótimo da fonte
 */
export const calculateOptimalFontSize = (
  content: string,
  fontSize: number
): number => {
  const tempElement = document.createElement('div');

  try {
    tempElement.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 794px;
      font-family: Arial, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.4;
      padding: 20px;
      box-sizing: border-box;
      overflow: hidden;
    `;
    tempElement.innerHTML = content;
    document.body.appendChild(tempElement);

    const contentHeight = tempElement.offsetHeight;
    const maxHeight = 1050; // Altura máxima de uma página A4

    // Se exceder uma página, reduzir a fonte
    if (contentHeight > maxHeight && fontSize > 10) {
      const newFontSize = Math.max(10, fontSize - 1);
      return newFontSize;
    }

    return fontSize;
  } finally {
    // Garantir que o elemento seja sempre removido
    if (document.body.contains(tempElement)) {
      document.body.removeChild(tempElement);
    }
  }
};

/**
 * Hook para gerenciar timeout com cleanup automático
 * @param callback Função a ser executada
 * @param delay Delay em milissegundos
 * @returns Função para cancelar o timeout
 */
export const useTimeoutWithCleanup = (
  callback: () => void,
  delay: number
): (() => void) => {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const cancelTimeout = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    timeoutRef.current = setTimeout(callback, delay);

    return cancelTimeout;
  }, [callback, delay, cancelTimeout]);

  return cancelTimeout;
};

// Import React para os hooks
import React from 'react';
