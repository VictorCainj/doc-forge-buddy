import React, { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter } from '@/utils/iconMapper';
import OptimizedSearch from '@/components/ui/optimized-search';

interface ContractFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  onClearFilters: () => void;
  totalResults?: number;
  isSearching?: boolean;
  onSearch?: (term: string) => void;
}

/**
 * Componente de filtros para contratos
 * Memoizado para evitar re-renders desnecessários
 */
export const ContractFilters = memo<ContractFiltersProps>(({
  searchTerm,
  onSearchChange,
  statusFilter = 'all',
  onStatusChange,
  onClearFilters,
  totalResults,
  isSearching,
  onSearch,
}) => {
  const hasActiveFilters = searchTerm || (statusFilter && statusFilter !== 'all');
  
  return (
    <div className="space-y-4">
      {/* Busca Otimizada */}
      <div className="flex gap-3">
        <div className="flex-1">
          <OptimizedSearch
            placeholder="Buscar por número, locatário ou endereço..."
            onSearch={onSearch || onSearchChange}
            isLoading={isSearching}
            className="w-full"
          />
        </div>
        
        {/* Filtro de Status */}
        {onStatusChange && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px] h-12 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-neutral-700 font-medium">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-neutral-200">
              <SelectItem value="all" className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer">Todos</SelectItem>
              <SelectItem value="active" className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer">Ativos</SelectItem>
              <SelectItem value="pending" className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer">Pendentes</SelectItem>
              <SelectItem value="expired" className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer">Expirados</SelectItem>
              <SelectItem value="cancelled" className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {/* Limpar Filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            title="Limpar filtros"
            className="h-12 px-4 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all duration-200 font-medium"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Resultados */}
      {totalResults !== undefined && totalResults > 0 && (
        <div className="text-sm text-muted-foreground">
          {totalResults} {totalResults === 1 ? 'contrato encontrado' : 'contratos encontrados'}
        </div>
      )}
    </div>
  );
});

ContractFilters.displayName = 'ContractFilters';
