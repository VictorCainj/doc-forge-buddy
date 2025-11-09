import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseFontSizeAdjustmentReturn {
  fontSize: number;
  increaseFont: () => void;
  decreaseFont: () => void;
  checkAndAdjustFontSize: (content: string, currentFontSize: number) => number;
}

/**
 * Hook para gerenciar ajuste de tamanho de fonte do documento
 */
export const useFontSizeAdjustment = (
  initialSize: number = 14
): UseFontSizeAdjustmentReturn => {
  const [fontSize, setFontSize] = useState(initialSize);
  const { toast } = useToast();

  const increaseFont = useCallback(() => {
    if (fontSize < 20) {
      setFontSize(fontSize + 1);
      toast({
        title: 'Fonte aumentada',
        description: `O tamanho da fonte foi aumentado para ${fontSize + 1}px.`,
      });
    } else {
      toast({
        title: 'Já no tamanho máximo',
        description: 'O documento já está no tamanho máximo de fonte (20px).',
      });
    }
  }, [fontSize, toast]);

  const decreaseFont = useCallback(() => {
    if (fontSize > 10) {
      setFontSize(fontSize - 1);
      toast({
        title: 'Fonte reduzida',
        description: `O tamanho da fonte foi reduzido para ${fontSize - 1}px.`,
      });
    } else {
      toast({
        title: 'Já no tamanho mínimo',
        description: 'O documento já está no tamanho mínimo de fonte (10px).',
      });
    }
  }, [fontSize, toast]);

  const checkAndAdjustFontSize = useCallback(
    (content: string, currentFontSize: number): number => {
      // Criar um elemento temporário para medir o conteúdo
      const tempElement = document.createElement('div');
      tempElement.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 794px;
      font-family: Arial, sans-serif;
      font-size: ${currentFontSize}px;
      line-height: 1.4;
      padding: 20px;
      box-sizing: border-box;
      overflow: hidden;
    `;
      tempElement.innerHTML = content;
      document.body.appendChild(tempElement);

      const contentHeight = tempElement.offsetHeight;
      const maxHeight = 1050; // Altura máxima de uma página A4 (297mm - margens) em pixels

      document.body.removeChild(tempElement);

      // Se exceder uma página, reduzir a fonte
      if (contentHeight > maxHeight && currentFontSize > 10) {
        const newFontSize = Math.max(10, currentFontSize - 1);
        setFontSize(newFontSize);
        return newFontSize;
      }

      return currentFontSize;
    },
    []
  );

  return {
    fontSize,
    increaseFont,
    decreaseFont,
    checkAndAdjustFontSize,
  };
};
