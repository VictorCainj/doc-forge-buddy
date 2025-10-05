/**
 * Hook otimizado para filtros complexos
 * Usa useMemo e debounce para melhorar performance
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

export interface FilterOptions {
  searchFields: string[];
  debounceMs?: number;
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export interface UseOptimizedFiltersReturn<T> {
  searchTerm: string;
  filteredItems: T[];
  setSearchTerm: (term: string) => void;
  addFilter: (key: string, value: unknown) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  isFiltering: boolean;
  resultsCount: number;
}

export const useOptimizedFilters = <T extends Record<string, unknown>>(
  items: T[],
  options: FilterOptions
): UseOptimizedFiltersReturn<T> => {
  const {
    searchFields,
    debounceMs = 300,
    caseSensitive = false,
    exactMatch = false,
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [isFiltering, setIsFiltering] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();

  // ✅ Debounce do termo de busca
  useEffect(() => {
    setIsFiltering(true);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsFiltering(false);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, debounceMs]);

  // ✅ Função de busca otimizada e memoizada
  const searchFunction = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return () => true;

    const searchValue = caseSensitive 
      ? debouncedSearchTerm.trim() 
      : debouncedSearchTerm.trim().toLowerCase();

    return (item: T): boolean => {
      return searchFields.some(field => {
        const fieldValue = getNestedValue(item, field);
        if (!fieldValue) return false;

        const stringValue = String(fieldValue);
        const compareValue = caseSensitive ? stringValue : stringValue.toLowerCase();

        return exactMatch 
          ? compareValue === searchValue
          : compareValue.includes(searchValue);
      });
    };
  }, [debouncedSearchTerm, searchFields, caseSensitive, exactMatch]);

  // ✅ Função de filtros adicionais memoizada
  const filterFunction = useMemo(() => {
    const filterEntries = Object.entries(filters);
    if (filterEntries.length === 0) return () => true;

    return (item: T): boolean => {
      return filterEntries.every(([key, value]) => {
        if (value === null || value === undefined || value === 'all') return true;
        
        const itemValue = getNestedValue(item, key);
        
        // Filtros especiais
        if (key.endsWith('_length')) {
          const arrayField = key.replace('_length', '');
          const arrayValue = getNestedValue(item, arrayField);
          return Array.isArray(arrayValue) && 
            (value === 'with' ? arrayValue.length > 0 : arrayValue.length === 0);
        }
        
        // Filtro de data
        if (key.includes('date') || key.includes('Date')) {
          return compareDates(itemValue, value);
        }
        
        // Filtro padrão
        return itemValue === value;
      });
    };
  }, [filters]);

  // ✅ Itens filtrados memoizados
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let result = items;

    // Aplicar busca por texto
    if (debouncedSearchTerm.trim()) {
      result = result.filter(searchFunction);
    }

    // Aplicar filtros adicionais
    result = result.filter(filterFunction);

    return result;
  }, [items, searchFunction, filterFunction, debouncedSearchTerm]);

  // ✅ Callbacks otimizados
  const addFilter = useCallback((key: string, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    filteredItems,
    setSearchTerm,
    addFilter,
    removeFilter,
    clearFilters,
    isFiltering,
    resultsCount: filteredItems.length,
  };
};

// ✅ Função utilitária para acessar valores aninhados
const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return null;
  }, obj as unknown);
};

// ✅ Função utilitária para comparar datas
const compareDates = (itemDate: unknown, filterValue: unknown): boolean => {
  if (!itemDate || !filterValue) return false;
  
  const itemDateObj = new Date(itemDate as string | number | Date);
  const filterDateObj = new Date(filterValue as string | number | Date);
  
  // Comparar apenas a data (ignorar horário)
  return itemDateObj.toDateString() === filterDateObj.toDateString();
};
