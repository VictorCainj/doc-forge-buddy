import { useState } from 'react';
import { correctTextWithAI, improveTextWithAI } from '@/utils/openai';

interface UseOpenAIReturn {
  correctText: (text: string) => Promise<string>;
  improveText: (text: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export const useOpenAI = (): UseOpenAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const correctText = async (text: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const correctedText = await correctTextWithAI(text);
      return correctedText;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const improveText = async (text: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const improvedText = await improveTextWithAI(text);
      return improvedText;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    correctText,
    improveText,
    isLoading,
    error,
  };
};
