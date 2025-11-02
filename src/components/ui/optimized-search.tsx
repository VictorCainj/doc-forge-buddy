import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Search } from '@/utils/iconMapper';
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
  const [isFocused, setIsFocused] = useState(false);

  // Busca automática com debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      onSearch('');
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        await onSearch(searchTerm.trim());
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchTerm, onSearch]);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      onSearch('');
      return;
    }

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
    <div className={`relative ${className}`}>
      <div 
        className={`
          relative flex items-center gap-2
          glass-card-enhanced rounded-xl
          border transition-all duration-200
          ${isFocused 
            ? 'border-purple-400/50 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/20' 
            : 'border-white/20 hover:border-white/30'
          }
        `}
      >
        {/* Ícone de busca */}
        <div className="absolute left-4 z-10 pointer-events-none">
          <Search 
            className={`h-5 w-5 transition-colors duration-300 ${
              isFocused ? 'text-purple-500' : 'text-neutral-400'
            }`} 
          />
        </div>

        {/* Input */}
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            flex-1 pl-12 pr-12 h-12
            bg-transparent border-0
            focus-visible:ring-0 focus-visible:ring-offset-0
            placeholder:text-neutral-400
            text-neutral-700 font-medium
          `}
          disabled={isLoading}
        />

        {/* Botão de limpar */}
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-12 h-8 w-8 p-0 rounded-lg hover:bg-white/50 transition-all duration-200"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4 text-neutral-500" />
          </Button>
        )}

        {/* Indicador de busca */}
        {isSearching && (
          <div className="absolute right-12 flex items-center">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Badge de resultados */}
      {showResultsCount && hasResults && (
        <div className="absolute -top-2 -right-2 z-20">
          <Badge 
            className="
              bg-gradient-to-r from-purple-500 to-pink-500 
              text-white border-0 shadow-lg
              px-3 py-1 text-xs font-semibold
            "
          >
            {resultsCount} {resultsCount === 1 ? 'resultado' : 'resultados'}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default OptimizedSearch;
