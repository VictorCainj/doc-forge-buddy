import { memo, useState, useEffect } from 'react';
import {
  BarChart3,
  Database,
  Clock,
  TrendingUp,
  Zap,
  Brain,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCacheStats, clearAICache } from '@/utils/aiCache';
import { useToast } from '@/hooks/use-toast';

interface ChatStatsProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

const ChatStats = memo(({ isVisible = false, onToggle }: ChatStatsProps) => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    const updateStats = () => {
      try {
        const cacheStats = getCacheStats();
        setStats(cacheStats);
      } catch {
        // console.error('Erro ao obter estatísticas do cache:', error);
      }
    };

    updateStats();

    if (isVisible) {
      const interval = setInterval(updateStats, 30000); // Atualizar a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const handleClearCache = () => {
    try {
      clearAICache();
      setStats(null);
      toast({
        title: 'Cache limpo',
        description: 'O cache da IA foi limpo com sucesso.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar o cache.',
        variant: 'destructive',
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!isVisible) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Estatísticas do Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
                title="Fechar estatísticas"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Estatísticas do Cache */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Cache</span>
              </div>
              {stats ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Entradas:</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.totalEntries}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Taxa de Hit:</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        stats.hitRate > 0.7
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : stats.hitRate > 0.4
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {Math.round(stats.hitRate * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Memória:</span>
                    <Badge variant="outline" className="text-xs">
                      {formatBytes(stats.memoryUsage)}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Carregando...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Histórico</span>
              </div>
              {stats ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Mais antigo:</span>
                    <span className="text-muted-foreground">
                      {formatDate(stats.oldestEntry)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Mais recente:</span>
                    <span className="text-muted-foreground">
                      {formatDate(stats.newestEntry)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Idade:</span>
                    <span className="text-muted-foreground">
                      {stats.oldestEntry
                        ? Math.round(
                            (Date.now() - stats.oldestEntry.getTime()) /
                              (1000 * 60 * 60)
                          ) + 'h'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Carregando...
                </div>
              )}
            </div>
          </div>

          {/* Indicadores de Performance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-green-50 rounded border">
                <Zap className="h-3 w-3 mx-auto text-green-600" />
                <div className="text-xs text-green-700 mt-1">Cache Ativo</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded border">
                <Brain className="h-3 w-3 mx-auto text-blue-600" />
                <div className="text-xs text-blue-700 mt-1">IA Otimizada</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded border">
                <Bot className="h-3 w-3 mx-auto text-purple-600" />
                <div className="text-xs text-purple-700 mt-1">Retry Auto</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="flex-1"
            >
              Limpar Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Implementar refresh das estatísticas
                const cacheStats = getCacheStats();
                setStats(cacheStats);
              }}
              className="flex-1"
            >
              Atualizar
            </Button>
          </div>

          {/* Dicas de Otimização */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="font-medium">💡 Dicas:</div>
            <div>• Cache reduz tempo de resposta em até 90%</div>
            <div>• Taxa de hit acima de 70% é excelente</div>
            <div>• Cache é limpo automaticamente após 24h</div>
          </div>
        </CardContent>
      )}
    </Card>
  );
});

ChatStats.displayName = 'ChatStats';

export default ChatStats;
