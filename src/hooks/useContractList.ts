/**
 * Hook para gerenciar lista de contratos, paginação e busca
 * Extrai responsabilidades do componente Contratos
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useOptimizedData } from './useOptimizedData';
import { useOptimizedSearch } from './useOptimizedSearch';
import { Contract } from '@/types/contract';

export interface UseContractListReturn {
  // Dados
  contracts: Contract[];
  filteredContracts: Contract[];
  displayedContracts: Contract[];
  
  // Estados de carregamento
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  
  // Paginação
  currentPage: number;
  contractsPerPage: number;
  
  // Busca
  searchResults: Contract[];
  hasSearched: boolean;
  isSearching: boolean;
  
  // Ações
  loadMore: () => Promise<void>;
  performSearch: (query: string) => void;
  clearSearch: () => void;
  setCurrentPage: (page: number) => void;
}

export const useContractList = (): UseContractListReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsPerPage] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);

  // Dados principais (sem busca)
  const {
    data: contracts,
    loading,
    hasMore,
    loadMore: loadMoreData,
  } = useOptimizedData({
    documentType: 'all',
    limit: 6,
  });

  // Sistema de busca otimizado
  const {
    results: searchResults,
    isLoading: isSearching,
    hasSearched,
    performSearch: performSearchInternal,
    clearSearch: clearSearchInternal,
  } = useOptimizedSearch({
    documentType: 'all',
    searchFields: ['numeroContrato', 'nomeLocatario', 'enderecoImovel'],
    debounceMs: 300,
    maxResults: 100,
  });

  // Usar resultados da busca otimizada ou dados normais
  const filteredContracts = useMemo(() => {
    if (hasSearched && searchResults.length > 0) {
      return searchResults;
    }
    return contracts;
  }, [hasSearched, searchResults, contracts]);

  // Paginação dos contratos filtrados com useMemo
  const displayedContracts = useMemo(() => {
    if (hasSearched) {
      // Em modo de busca, exibir todos os resultados
      return filteredContracts;
    }
    const startIndex = (currentPage - 1) * contractsPerPage;
    const endIndex = startIndex + contractsPerPage;
    return filteredContracts.slice(0, endIndex);
  }, [filteredContracts, currentPage, contractsPerPage, hasSearched]);

  // Resetar página quando buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [hasSearched]);

  // Carregar automaticamente páginas adicionais durante a busca
  useEffect(() => {
    if (!hasSearched) return;
    if (hasMore && !loading) {
      loadMoreData();
    }
  }, [hasSearched, hasMore, loading, loadMoreData]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      await loadMoreData();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao carregar mais contratos:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadMoreData]);

  const performSearch = useCallback((query: string) => {
    performSearchInternal(query);
  }, [performSearchInternal]);

  const clearSearch = useCallback(() => {
    clearSearchInternal();
  }, [clearSearchInternal]);

  return {
    contracts,
    filteredContracts,
    displayedContracts,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    contractsPerPage,
    searchResults,
    hasSearched,
    isSearching,
    loadMore,
    performSearch,
    clearSearch,
    setCurrentPage,
  };
};
