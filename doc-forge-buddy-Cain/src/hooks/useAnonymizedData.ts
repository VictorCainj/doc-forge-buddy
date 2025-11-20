import { useMemo } from 'react';
import { usePrivacyMode } from './usePrivacyMode';
import {
  anonymizeName,
  anonymizeNamesList,
  anonymizeAddress,
  anonymizeContractData,
} from '@/utils/privacyUtils';

/**
 * Hook para obter dados anonimizados quando o modo de privacidade está ativo
 */
export function useAnonymizedData() {
  const { isPrivacyModeActive } = usePrivacyMode();

  const anonymize = useMemo(
    () => ({
      name: (name: string | null | undefined) =>
        isPrivacyModeActive ? anonymizeName(name) : name || '',
      namesList: (names: string | null | undefined) =>
        isPrivacyModeActive ? anonymizeNamesList(names) : names || '',
      address: (address: string | null | undefined) =>
        isPrivacyModeActive ? anonymizeAddress(address) : address || '',
      contractData: (data: Record<string, any>) =>
        isPrivacyModeActive ? anonymizeContractData(data) : data,
    }),
    [isPrivacyModeActive]
  );

  return {
    anonymize,
    isPrivacyModeActive,
  };
}

