/**
 * Componente de filtros de contratos
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OptimizedSearch from '@/components/ui/optimized-search';
import { Star, Tag } from '@/utils/iconMapper';
import { ContractFilters as ContractFiltersType } from '../types';

interface ContractFiltersProps {
  filters: ContractFiltersType;
  onFilterChange: <K extends keyof ContractFiltersType>(key: K, value: ContractFiltersType[K]) => void;
  onSearch: (term: string) => void;
  onClearSearch: () => void;
  onClearAllFilters: () => void;
  isSearching: boolean;
  hasSearched: boolean;
  searchResults: number;
  isLoading: boolean;
  allTags: any[];
  availableYears: number[];
  meses: string[];
  isExporting: boolean;
  displayedContracts: any[];
  onExportToExcel: () => Promise<void>;
}

export const ContractFilters: React.FC<ContractFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch,
  onClearSearch,
  onClearAllFilters,
  isSearching,
  hasSearched,
  searchResults,
  isLoading,
  allTags,
  availableYears,
  meses,
  isExporting,
  displayedContracts,
  onExportToExcel,
}) => {
  const hasActiveFilters = filters.selectedMonth || filters.selectedYear || 
                          filters.showFavoritesOnly || filters.selectedTagFilter;

  return (
    <div className="space-y-2">
      {/* Campo de Busca */}
      <div className="flex-shrink-0">
        <OptimizedSearch
          onSearch={onSearch}
          placeholder="Buscar contratos..."
          showResultsCount={true}
          resultsCount={searchResults}
          isLoading={isSearching}
          className="w-full"
        />
      </div>

      {/* Filtros em Grid Responsivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {/* Filtro de Favoritos */}
        <Button
          variant={filters.showFavoritesOnly ? "default" : "ghost"}
          size="sm"
          onClick={() => onFilterChange('showFavoritesOnly', !filters.showFavoritesOnly)}
          className={`h-9 bg-white rounded-lg border border-neutral-300 transition-all duration-200 font-medium text-xs sm:text-sm ${
            filters.showFavoritesOnly
              ? 'border-amber-300/50 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-white/20 hover:border-white/30 text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
          aria-label={filters.showFavoritesOnly ? 'Mostrar todos os contratos' : 'Mostrar apenas favoritos'}
        >
          <Star className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${filters.showFavoritesOnly ? 'fill-current' : ''} sm:mr-1.5`} />
          <span className="hidden sm:inline">Favoritos</span>
        </Button>

        {/* Filtro de Tags */}
        {allTags.length > 0 && (
          <Select value={filters.selectedTagFilter} onValueChange={(value) => onFilterChange('selectedTagFilter', value)}>
            <SelectTrigger 
              className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-neutral-700 font-medium text-xs sm:text-sm"
              aria-label="Filtrar por tag"
            >
              <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
              <SelectValue placeholder="Tags" className="text-xs sm:text-sm" />
            </SelectTrigger>
            <SelectContent className="bg-white border-neutral-200">
              <SelectItem 
                value="" 
                className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer text-sm"
              >
                Todas as tags
              </SelectItem>
              {allTags.map((tag) => (
                <SelectItem
                  key={tag.id}
                  value={tag.tag_name}
                  className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer flex items-center gap-2 text-sm"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.tag_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filtro de Mês */}
        <Select
          value={filters.selectedMonth}
          onValueChange={(value) => onFilterChange('selectedMonth', value)}
        >
          <SelectTrigger 
            className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-neutral-700 font-medium text-xs sm:text-sm"
            aria-label="Selecione o mês"
          >
            <SelectValue placeholder="Mês" className="text-xs sm:text-sm" />
          </SelectTrigger>
          <SelectContent className="bg-white border-neutral-200">
            {meses.map((mes, index) => (
              <SelectItem
                key={index}
                value={(index + 1).toString()}
                className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer text-sm"
              >
                {mes}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Ano */}
        <Select
          value={filters.selectedYear}
          onValueChange={(value) => onFilterChange('selectedYear', value)}
        >
          <SelectTrigger 
            className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-neutral-700 font-medium text-xs sm:text-sm"
            aria-label="Selecione o ano"
          >
            <SelectValue placeholder="Ano" className="text-xs sm:text-sm" />
          </SelectTrigger>
          <SelectContent className="bg-white border-neutral-200">
            {availableYears.map((year) => (
              <SelectItem 
                key={year} 
                value={year.toString()} 
                className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer text-sm"
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAllFilters}
            className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all duration-200 font-medium text-xs sm:text-sm col-span-2 lg:col-span-1"
            aria-label="Limpar todos os filtros"
          >
            <span className="hidden sm:inline">Limpar</span>
            <span className="sm:hidden">Limpar</span>
          </Button>
        )}

        {/* Botão Limpar Busca */}
        {hasSearched && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all duration-300 font-medium text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Limpar Busca</span>
            <span className="sm:hidden">Busca</span>
          </Button>
        )}

        {/* Botão Exportar Excel */}
        {displayedContracts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportToExcel}
            disabled={isExporting || displayedContracts.length === 0}
            className="h-9 bg-white rounded-lg border border-success-300 hover:border-success-400 text-success-700 hover:text-success-800 hover:bg-success-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm col-span-2 lg:col-span-1"
            title={`Exportar ${displayedContracts.length} contrato(s) para Excel`}
          >
            {isExporting ? (
              <div className="flex items-center gap-1.5">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent"></div>
                <span className="hidden sm:inline text-xs">Exportando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline text-xs">Exportar</span>
              </div>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};