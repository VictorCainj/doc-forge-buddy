import React, { useState, useCallback, useRef } from 'react';
import { useOptimizedData } from './useOptimizedData';

interface SearchResult {
  id: string;
  title: string;
  form_data: Record<string, string>;
  created_at: string;
  document_type: string;
  updated_at: string;
}

interface UseOptimizedSearchOptions {
  documentType?: string;
  searchFields?: string[];
  debounceMs?: number;
  maxResults?: number;
}

interface UseOptimizedSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
  performSearch: (term: string) => Promise<void>;
  clearSearch: () => void;
}

/**
 * Hook otimizado para busca com cache, debounce e paginação
 */
export const useOptimizedSearch = (
  options: UseOptimizedSearchOptions = {}
): UseOptimizedSearchReturn => {
  const {
    documentType = 'contrato',
    searchFields = ['numeroContrato', 'nomeLocatario', 'enderecoImovel'],
    debounceMs = 300,
    maxResults = 100,
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Cache para resultados de busca
  const searchCache = useRef<Map<string, SearchResult[]>>(new Map());
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // Hook para carregar todos os dados necessários para busca
  const { data: allData, loading: dataLoading } = useOptimizedData({
    documentType,
    limit: 1000, // Carregar mais dados para busca abrangente
  });

  /**
   * Função de busca otimizada com cache
   */
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setTotalResults(0);
      setHasSearched(false);
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `${term.toLowerCase()}-${documentType}`;
    const cachedResults = searchCache.current.get(cacheKey);
    if (cachedResults) {
      setResults(cachedResults.slice(0, maxResults));
      setTotalResults(cachedResults.length);
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Busca local nos dados já carregados (mais rápido)
      const searchLower = term.toLowerCase();
      const searchResults = allData.filter((contract) => {
        return searchFields.some((field) => {
          const value = contract.form_data[field];
          return value && value.toLowerCase().includes(searchLower);
        });
      });

      // Ordenar por relevância (exato primeiro, depois parcial)
      const sortedResults = searchResults.sort((a, b) => {
        const aRelevance = searchFields.reduce((score, field) => {
          const value = a.form_data[field]?.toLowerCase() || '';
          if (value === searchLower) return score + 10;
          if (value.includes(searchLower)) return score + 5;
          return score;
        }, 0);

        const bRelevance = searchFields.reduce((score, field) => {
          const value = b.form_data[field]?.toLowerCase() || '';
          if (value === searchLower) return score + 10;
          if (value.includes(searchLower)) return score + 5;
          return score;
        }, 0);

        return bRelevance - aRelevance;
      });

      // Armazenar no cache
      searchCache.current.set(cacheKey, sortedResults as SearchResult[]);

      setResults(sortedResults.slice(0, maxResults) as SearchResult[]);
      setTotalResults(sortedResults.length);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro na busca:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [allData, searchFields, maxResults, documentType]);

  /**
   * Função de busca com debounce
   */
  const debouncedSearch = useCallback((term: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch(term);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  /**
   * Função para limpar busca
   */
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setTotalResults(0);
    setHasSearched(false);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }, []);

  /**
   * Função para definir termo de busca com debounce automático
   */
  const setSearchTermWithDebounce = useCallback((term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      debouncedSearch(term);
    } else {
      clearSearch();
    }
  }, [debouncedSearch, clearSearch]);

  /**
   * Função para busca imediata (sem debounce)
   */
  const performImmediateSearch = useCallback((term: string) => {
    setSearchTerm(term);
    performSearch(term);
  }, [performSearch]);

  // Limpar timeout ao desmontar
  const cleanup = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }, []);

  // Cleanup no unmount
  React.useEffect(() => cleanup, [cleanup]);

  return {
    searchTerm,
    setSearchTerm: setSearchTermWithDebounce,
    results,
    isLoading: isLoading || dataLoading,
    hasSearched,
    totalResults,
    performSearch: async (term: string) => { performImmediateSearch(term); },
    clearSearch,
  };
};

export default useOptimizedSearch;