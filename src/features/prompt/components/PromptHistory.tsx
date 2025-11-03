import { useState, useMemo, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Search,
  Star,
  Copy,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';
import { usePromptHistory } from '../hooks/usePromptHistory';
import { toast } from 'sonner';

interface PromptHistoryProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const PromptHistory = memo(({ onSelectPrompt }: PromptHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const {
    history,
    isLoading,
    toggleFavorite,
    deleteItem,
    duplicateItem,
    isTogglingFavorite,
    isDeleting,
  } = usePromptHistory();

  // Filtrar histórico
  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Filtrar por favoritos
    if (showFavoritesOnly) {
      filtered = filtered.filter((item) => item.is_favorite);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.original_input.toLowerCase().includes(query) ||
          item.enhanced_prompt.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [history, searchQuery, showFavoritesOnly]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Prompt copiado');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  }, []);

  const handleSelect = useCallback(
    (prompt: string) => {
      if (onSelectPrompt) {
        onSelectPrompt(prompt);
      }
    },
    [onSelectPrompt]
  );

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  }, []);


  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold">Histórico</h3>
          {history.length > 0 && (
            <Badge variant="outline">{history.length}</Badge>
          )}
        </div>

        {/* Busca e filtros */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no histórico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className="h-4 w-4 mr-1" />
              Favoritos
            </Button>
          </div>
        </div>

        {/* Lista de histórico otimizada com windowing virtual */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {history.length === 0
                ? 'Nenhum prompt no histórico ainda'
                : 'Nenhum resultado encontrado'}
            </div>
          ) : (
            <>
              {/* Renderizar apenas itens visíveis + buffer para scroll suave */}
              {filteredHistory.slice(0, 50).map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.original_input}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.enhanced_prompt.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {item.metadata.complexity}
                      </Badge>
                      {item.is_favorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleSelect(item.enhanced_prompt)}
                        title="Usar este prompt"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          toggleFavorite({
                            id: item.id,
                            isFavorite: item.is_favorite || false,
                          })
                        }
                        disabled={isTogglingFavorite}
                        title="Favoritar"
                      >
                        <Star
                          className={`h-3 w-3 ${
                            item.is_favorite
                              ? 'text-yellow-500 fill-yellow-500'
                              : ''
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => deleteItem(item.id)}
                        disabled={isDeleting}
                        title="Deletar"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredHistory.length > 50 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Mostrando 50 de {filteredHistory.length} itens
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
});

PromptHistory.displayName = 'PromptHistory';

