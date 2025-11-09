/**
 * Hook para gerenciamento de filtros de contratos
 */

import { useState, useCallback, useMemo } from 'react';
import { ContractFilters } from '../types';
import { useDebouncedCallback } from '@/utils/core/debounce';

export interface UseContractFiltersReturn {
  filters: ContractFilters;
  setFilter: <K extends keyof ContractFilters>(key: K, value: ContractFilters[K]) => void;
  setSelectedMonth: (month: string) => void;
  setSelectedYear: (year: string) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  setSelectedTagFilter: (tag: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  availableYears: number[];
  meses: string[];
}

export const useContractFilters = (): UseContractFiltersReturn => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');

  const filters: ContractFilters = {
    selectedMonth,
    selectedYear,
    showFavoritesOnly,
    selectedTagFilter,
  };

  // Debounce para filtros de data (evitar recálculos desnecessários)
  const debouncedSetMonth = useDebouncedCallback((month: string) => {
    setSelectedMonth(month);
  }, 300);

  const debouncedSetYear = useDebouncedCallback((year: string) => {
    setSelectedYear(year);
  }, 300);

  const setFilter = useCallback(<K extends keyof ContractFilters>(
    key: K,
    value: ContractFilters[K]
  ) => {
    if (key === 'selectedMonth') {
      setSelectedMonth(value as string);
    } else if (key === 'selectedYear') {
      setSelectedYear(value as string);
    } else if (key === 'showFavoritesOnly') {
      setShowFavoritesOnly(value as boolean);
    } else if (key === 'selectedTagFilter') {
      setSelectedTagFilter(value as string);
    }
  }, []);

  const setSelectedMonthDebounced = useCallback((month: string) => {
    debouncedSetMonth(month);
  }, [debouncedSetMonth]);

  const setSelectedYearDebounced = useCallback((year: string) => {
    debouncedSetYear(year);
  }, [debouncedSetYear]);

  const clearAllFilters = useCallback(() => {
    setSelectedMonth('');
    setSelectedYear('');
    setShowFavoritesOnly(false);
    setSelectedTagFilter('');
  }, []);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return selectedMonth || selectedYear || showFavoritesOnly || selectedTagFilter;
  }, [selectedMonth, selectedYear, showFavoritesOnly, selectedTagFilter]);

  // Gerar lista de anos (últimos 5 anos + próximos 2 anos)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years.reverse();
  }, []);

  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  return {
    filters,
    setFilter,
    setSelectedMonth: setSelectedMonthDebounced,
    setSelectedYear: setSelectedYearDebounced,
    setShowFavoritesOnly,
    setSelectedTagFilter,
    clearAllFilters,
    hasActiveFilters,
    availableYears,
    meses,
  };
};