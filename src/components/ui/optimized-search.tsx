import React, { useState, useCallback, useMemo } from 'react';
import { X } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface OptimizedSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
  showResultsCount?: boolean;
  resultsCount?: number;
  isLoading?: boolean;
}

export const OptimizedSearch: React.FC<OptimizedSearchProps> = ({
  onSearch,
  placeholder = 'Buscar contratos...',
  className = '',
  showResultsCount = true,
  resultsCount = 0,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      await onSearch(searchTerm.trim());
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, onSearch]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    onSearch('');
  }, [onSearch]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const hasResults = useMemo(() => resultsCount > 0, [resultsCount]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="pr-10"
          disabled={isLoading}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Button
        onClick={handleSearch}
        disabled={!searchTerm.trim() || isLoading || isSearching}
        className="px-4"
      >
        {isSearching ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Buscando...</span>
          </div>
        ) : (
          'Buscar'
        )}
      </Button>

      {showResultsCount && hasResults && (
        <Badge variant="secondary" className="ml-2">
          {resultsCount} resultado{resultsCount !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
};

export default OptimizedSearch;
