import { useState } from 'react';
import {
  correctTextWithAI,
  improveTextWithAI,
  analyzeContractsWithAI,
  chatCompletionWithAI,
  generateImageWithAI,
  analyzeImageWithAI,
  transcribeAudioWithAI,
} from '@/utils/openai';
import { Contract } from './useContractAnalysis';
import { CompleteContractData } from './useCompleteContractData';
import { getCachedResponse, setCachedResponse } from '@/utils/aiCache';
import { log } from '@/utils/logger';

interface UseOpenAIReturn {
  correctText: (text: string) => Promise<string>;
  improveText: (text: string) => Promise<string>;
  analyzeContracts: (
    query: string,
    contracts: Contract[],
    completeContracts?: CompleteContractData[]
  ) => Promise<string>;
  chatCompletion: (prompt: string) => Promise<string>;
  generateImageFromPrompt: (prompt: string) => Promise<string>;
  analyzeImage: (imageBase64: string, userPrompt?: string) => Promise<string>;
  transcribeAudio: (audioFile: File) => Promise<string>;
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
      // Verificar cache primeiro
      const cachedResponse = getCachedResponse(text, 'normal');
      if (cachedResponse) {
        log.debug('Usando resposta em cache para correção de texto');
        return cachedResponse;
      }

      // Se não estiver no cache, fazer chamada para API
      const correctedText = await correctTextWithAI(text);
      
      // Salvar no cache
      setCachedResponse(text, correctedText, 'normal', 0.9, {
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini'
      });

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
      // Verificar cache primeiro
      const cachedResponse = getCachedResponse(text, 'intelligent');
      if (cachedResponse) {
        log.debug('Usando resposta em cache para melhoria de texto');
        return cachedResponse;
      }

      // Se não estiver no cache, fazer chamada para API
      const improvedText = await improveTextWithAI(text);
      
      // Salvar no cache
      setCachedResponse(text, improvedText, 'intelligent', 0.9, {
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini'
      });

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
      // Para análise de contratos, criar uma chave baseada na query e dados dos contratos
      const contractsHash = contracts.map(c => c.id).join(',');
      const cacheKey = `${query}:${contractsHash}`;
      
      // Verificar cache primeiro
      const cachedResponse = getCachedResponse(cacheKey, 'analysis');
      if (cachedResponse) {
        log.debug('Usando resposta em cache para análise de contratos');
        return cachedResponse;
      }

      // Se não estiver no cache, fazer chamada para API
      const analysis = await analyzeContractsWithAI(
        query,
        contracts,
        completeContracts
      );
      
      // Salvar no cache com menor confiança devido à natureza dinâmica dos dados
      setCachedResponse(cacheKey, analysis, 'analysis', 0.7, {
        timestamp: new Date().toISOString(),
        model: 'gpt-4o',
        contractCount: contracts.length,
        queryHash: cacheKey
      });

      return analysis;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const chatCompletion = async (prompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar cache primeiro
      const cachedResponse = getCachedResponse(prompt, 'conversational');
      if (cachedResponse) {
        log.debug('Usando resposta em cache para chat');
        return cachedResponse;
      }

      // Se não estiver no cache, fazer chamada para API
      const response = await chatCompletionWithAI(prompt);
      
      // Salvar no cache
      setCachedResponse(prompt, response, 'conversational', 0.85, {
        timestamp: new Date().toISOString(),
        model: 'gpt-4o'
      });

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Gerar imagem não usa cache devido à natureza única de cada geração
      const imageUrl = await generateImageWithAI(prompt);
      
      log.debug('Imagem gerada com sucesso');
      return imageUrl;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao gerar imagem';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeImage = async (imageBase64: string, userPrompt?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const analysis = await analyzeImageWithAI(imageBase64, userPrompt);
      
      log.debug('Imagem analisada com sucesso');
      return analysis;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao analisar imagem';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const transcribeAudio = async (audioFile: File): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const transcription = await transcribeAudioWithAI(audioFile);
      
      log.debug('Áudio transcrito com sucesso');
      return transcription;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao transcrever áudio';
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
    chatCompletion,
    generateImageFromPrompt,
    analyzeImage,
    transcribeAudio,
    isLoading,
    error,
  };
};
