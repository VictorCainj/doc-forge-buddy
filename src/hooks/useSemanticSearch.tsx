import { useState, useCallback } from 'react';
import { searchSimilarMessages, getRelevantContext } from '@/utils/embeddingService';
import { searchKnowledge, getRAGContext } from '@/utils/knowledgeBase';
import { log } from '@/utils/logger';
import type { SimilarMessage } from '@/utils/embeddingService';
import type { RelevantKnowledge } from '@/utils/knowledgeBase';

interface UseSemanticSearchReturn {
  searchMessages: (query: string, options?: {
    maxResults?: number;
    minSimilarity?: number;
  }) => Promise<SimilarMessage[]>;
  
  searchKnowledgeBase: (query: string, options?: {
    maxResults?: number;
    minSimilarity?: number;
  }) => Promise<RelevantKnowledge[]>;
  
  getEnhancedContext: (query: string) => Promise<{
    messageContext: string;
    knowledgeContext: string;
    combinedContext: string;
  }>;
  
  isSearching: boolean;
  error: string | null;
}

export const useSemanticSearch = (): UseSemanticSearchReturn => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca mensagens similares
   */
  const searchMessages = useCallback(async (
    query: string,
    options: { maxResults?: number; minSimilarity?: number } = {}
  ): Promise<SimilarMessage[]> => {
    try {
      setIsSearching(true);
      setError(null);

      log.debug('Buscando mensagens similares', { query });

      const results = await searchSimilarMessages(query, {
        matchCount: options.maxResults || 10,
        matchThreshold: options.minSimilarity || 0.7,
      });

      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro na busca';
      setError(errorMsg);
      log.error('Erro ao buscar mensagens', err);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Busca na base de conhecimento
   */
  const searchKnowledgeBase = useCallback(async (
    query: string,
    options: { maxResults?: number; minSimilarity?: number } = {}
  ): Promise<RelevantKnowledge[]> => {
    try {
      setIsSearching(true);
      setError(null);

      log.debug('Buscando na base de conhecimento', { query });

      const results = await searchKnowledge(query, {
        limit: options.maxResults || 5,
        minSimilarity: options.minSimilarity || 0.7,
      });

      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro na busca';
      setError(errorMsg);
      log.error('Erro ao buscar conhecimento', err);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Obtém contexto enriquecido combinando mensagens e conhecimento
   */
  const getEnhancedContext = useCallback(async (query: string) => {
    try {
      setIsSearching(true);
      setError(null);

      log.debug('Obtendo contexto enriquecido', { query });

      // Buscar em paralelo
      const [messageContext, knowledgeContext] = await Promise.all([
        getRelevantContext(query, { maxMessages: 5, minSimilarity: 0.75 }),
        getRAGContext(query, 3),
      ]);

      // Combinar contextos
      const combinedContext = [
        knowledgeContext,
        messageContext,
      ].filter(Boolean).join('\n\n---\n\n');

      return {
        messageContext,
        knowledgeContext,
        combinedContext,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao obter contexto';
      setError(errorMsg);
      log.error('Erro ao obter contexto enriquecido', err);
      return {
        messageContext: '',
        knowledgeContext: '',
        combinedContext: '',
      };
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    searchMessages,
    searchKnowledgeBase,
    getEnhancedContext,
    isSearching,
    error,
  };
};
