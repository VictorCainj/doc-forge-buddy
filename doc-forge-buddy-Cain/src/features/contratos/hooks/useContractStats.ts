/**
 * Hook para estatísticas de contratos
 */

import { useMemo } from 'react';
import { Contract } from '@/types/contract';
import { ContractStats } from '../types';
import { useContractFavorites } from '@/hooks/useContractFavorites';
import { useContractTags } from '@/hooks/useContractTags';

export interface UseContractStatsProps {
  contracts: Contract[];
  displayedContracts: Contract[];
}

export const useContractStats = ({ contracts, displayedContracts }: UseContractStatsProps): ContractStats => {
  const { isFavorite } = useContractFavorites();
  const { getContractTags } = useContractTags();

  return useMemo(() => {
    const favoriteContracts = contracts.filter(contract => isFavorite(contract.id)).length;
    const contractsWithTags = contracts.filter(contract => {
      const tags = getContractTags(contract.id);
      return tags && tags.length > 0;
    }).length;

    return {
      totalContracts: contracts.length,
      displayedContracts: displayedContracts.length,
      favoriteContracts,
      contractsWithTags,
    };
  }, [contracts, displayedContracts, isFavorite, getContractTags]);
};