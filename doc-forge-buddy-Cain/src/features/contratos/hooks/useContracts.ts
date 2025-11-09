/**
 * Hook para busca e carregamento de contratos
 */

import { useMemo } from 'react';
import { useOptimizedData } from '@/hooks/useOptimizedData';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { Contract } from '@/types/contract';
import { ContractFilters } from '../types';
import { createContractIndex, filterContractsByDate } from '@/utils/contractIndex';
import { useContractFavorites } from '@/hooks/useContractFavorites';
import { useContractTags } from '@/hooks/useContractTags';

export interface UseContractsReturn {
  contracts: Contract[];
  searchResults: Contract[];
  isLoading: boolean;
  isSearching: boolean;
  hasSearched: boolean;
  hasMore: boolean;
  totalCount: number;
  totalResults: number;
  displayedContracts: Contract[];
  contractIndex: Map<string, Contract>;
  performSearch: (term: string) => void;
  clearSearch: () => void;
  loadMore: () => Promise<void>;
  isFavorite: (id: string) => boolean;
  getContractTags: (id: string) => any[];
  favoritesSet: Set<string>;
  allTags: any[];
}

export const useContracts = (filters: ContractFilters): UseContractsReturn => {
  // Sistema de busca otimizado
  const {
    results: searchResults,
    isLoading: isSearching,
    hasSearched,
    totalResults,
    performSearch,
    clearSearch,
  } = useOptimizedSearch({
    documentType: 'contrato',
    searchFields: ['numeroContrato', 'nomeLocatario', 'enderecoImovel'],
    maxResults: 100,
  });

  // Hooks de favoritos e tags
  const { favoritesSet, isFavorite } = useContractFavorites();
  const { getAllTags, getContractTags } = useContractTags();
  const allTags = getAllTags();

  // Dados principais - quando há filtros de data, usar limite maior
  const hasDateFilters = filters.selectedMonth || filters.selectedYear;
  const {
    data: contracts,
    loading: isLoading,
    hasMore,
    loadMore,
    totalCount,
  } = useOptimizedData({
    documentType: 'contrato',
    limit: hasDateFilters ? 1000 : 6,
    placeholderData: (previousData) => previousData,
  });

  // Índice de contratos para busca rápida O(1)
  const contractIndex = useMemo(() => {
    return createContractIndex(contracts);
  }, [contracts]);

  // Contratos exibidos (filtro de mês/ano, busca, favoritos, tags ou paginação normal) - ULTRA OTIMIZADO
  const displayedContracts = useMemo(() => {
    let contractsToDisplay = contracts;

    // Aplicar filtro de busca primeiro
    if (hasSearched && searchResults.length > 0) {
      contractsToDisplay = searchResults;
    }

    // Aplicar filtro de favoritos
    if (filters.showFavoritesOnly) {
      contractsToDisplay = contractsToDisplay.filter((c) => isFavorite(c.id));
    }

    // Aplicar filtro de tags
    if (filters.selectedTagFilter) {
      contractsToDisplay = contractsToDisplay.filter((c) => {
        const contractTags = getContractTags(c.id);
        return contractTags.some((t) => t.tag_name.toLowerCase() === filters.selectedTagFilter.toLowerCase());
      });
    }

    // Aplicar filtro de mês e/ou ano usando índice (busca O(1))
    if (filters.selectedMonth || filters.selectedYear) {
      const month = filters.selectedMonth ? parseInt(filters.selectedMonth) : undefined;
      const year = filters.selectedYear ? parseInt(filters.selectedYear) : undefined;
      const filtered = filterContractsByDate(contractIndex, month, year);
      
      // Se há outros filtros, filtrar apenas os resultados já filtrados
      const filteredIds = new Set(filtered.map(c => c.id));
      contractsToDisplay = contractsToDisplay.filter(c => filteredIds.has(c.id));
    }

    // Early return para casos simples (sem filtros)
    if (!filters.selectedMonth && !filters.selectedYear && !hasSearched && !filters.showFavoritesOnly && !filters.selectedTagFilter) {
      return contracts;
    }

    return contractsToDisplay;
  }, [
    filters.selectedMonth,
    filters.selectedYear,
    hasSearched,
    searchResults,
    contracts,
    contractIndex,
    filters.showFavoritesOnly,
    filters.selectedTagFilter,
    isFavorite,
    getContractTags
  ]);

  return {
    contracts,
    searchResults,
    isLoading,
    isSearching,
    hasSearched,
    hasMore,
    totalCount,
    totalResults,
    displayedContracts,
    contractIndex,
    performSearch,
    clearSearch,
    loadMore,
    isFavorite,
    getContractTags,
    favoritesSet,
    allTags,
  };
};