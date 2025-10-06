import React, { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
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
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {/* Limpar Filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearFilters}
            title="Limpar filtros"
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
