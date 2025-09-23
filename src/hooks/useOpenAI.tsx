import { useState } from 'react';
import {
  correctTextWithAI,
  improveTextWithAI,
  analyzeContractsWithAI,
} from '@/utils/openai';
import { Contract } from './useContractAnalysis';
import { CompleteContractData } from './useCompleteContractData';

interface UseOpenAIReturn {
  correctText: (text: string) => Promise<string>;
  improveText: (text: string) => Promise<string>;
  analyzeContracts: (
    query: string,
    contracts: Contract[],
    completeContracts?: CompleteContractData[]
  ) => Promise<string>;
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

  const analyzeContracts = async (
    query: string,
    contracts: Contract[],
    completeContracts?: CompleteContractData[]
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('useOpenAI: Chamando analyzeContractsWithAI...');
      const analysis = await analyzeContractsWithAI(
        query,
        contracts,
        completeContracts
      );
      console.log(
        'useOpenAI: Resposta recebida:',
        analysis.substring(0, 100) + '...'
      );
      return analysis;
    } catch (err) {
      console.error('useOpenAI: Erro capturado:', err);
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
    analyzeContracts,
    isLoading,
    error,
  };
};
