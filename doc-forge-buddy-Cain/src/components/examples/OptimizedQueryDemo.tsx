// Componente de exemplo demonstrando React Query otimizado
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useContractsManagement, 
  useContractStats, 
  useContractSearch, 
  useCacheManagement, 
  useOfflineSupport 
} from '@/hooks/examples/useContractsManagement';
import { queryMonitor } from '@/lib/queryMonitor';
import { cacheManager } from '@/lib/queryCache';
import { usePrefetch } from '@/hooks/query';
import { Download, RefreshCw, Search, Wifi, WifiOff, Database, Clock, TrendingUp } from 'lucide-react';

interface OptimizedQueryDemoProps {
  className?: string;
}

export function OptimizedQueryDemo({ className = '' }: OptimizedQueryDemoProps) {
  // Hooks principais
  const contracts = useContractsManagement();
  const stats = useContractStats();
  const search = useContractSearch();
  const cache = useCacheManagement();
  const offline = useOfflineSupport();

  // Estados locais
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            React Query Otimizado - Demo
          </CardTitle>
          <CardDescription>
            Demonstração das otimizações de performance e caching inteligente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant={contracts.isLoading ? "secondary" : "default"}>
              {contracts.isLoading ? "Carregando..." : "Dados Carregados"}
            </Badge>
            <Badge variant={contracts.isStale ? "destructive" : "default"}>
              <Clock className="h-3 w-3 mr-1" />
              {contracts.isStale ? "Stale" : "Fresh"}
            </Badge>
            <Badge variant={offline.isOnline ? "default" : "destructive"}>
              {offline.isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {offline.isOnline ? "Online" : "Offline"}
            </Badge>
            <Badge variant="outline">
              <Database className="h-3 w-3 mr-1" />
              {cache.cacheStats.activeQueries} ativas
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Buscar Contratos</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite para buscar..."
                  value={search.searchTerm}
                  onChange={(e) => search.setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Search className="h-4 w-4 mt-2" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => contracts.updateFilters({ status: 'active' })}
                variant={contracts.filters.status === 'active' ? 'default' : 'outline'}
                size="sm"
              >
                Ativos
              </Button>
              <Button 
                onClick={() => contracts.updateFilters({ status: 'pending' })}
                variant={contracts.filters.status === 'pending' ? 'default' : 'outline'}
                size="sm"
              >
                Pendentes
              </Button>
              <Button 
                onClick={() => contracts.updateFilters({ status: '' })}
                variant={!contracts.filters.status ? 'default' : 'outline'}
                size="sm"
              >
                Todos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações de Cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={contracts.refetch} 
                size="sm"
                disabled={contracts.isRefetching}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${contracts.isRefetching ? 'animate-spin' : ''}`} />
                Refetch
              </Button>
              <Button 
                onClick={contracts.clearCache} 
                variant="outline" 
                size="sm"
              >
                Limpar Cache
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPerformance(!showPerformance)} 
                variant="outline" 
                size="sm"
              >
                {showPerformance ? 'Ocultar' : 'Mostrar'} Performance
              </Button>
              <Button 
                onClick={cache.clearAll} 
                variant="destructive" 
                size="sm"
              >
                Limpar Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Performance */}
      {showPerformance && (
        <PerformanceMetrics 
          contracts={contracts}
          stats={stats}
          cache={cache}
          monitor={queryMonitor}
        />
      )}

      {/* Lista de Contratos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos ({contracts.contracts?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar contratos: {contracts.error?.message}
              </AlertDescription>
            </Alert>
          )}

          {contracts.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.contracts?.contracts?.map((contract) => (
                <div 
                  key={contract.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedContract(contract.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{contract.contractNumber}</div>
                    <div className="text-sm text-gray-500">{contract.clientName}</div>
                    <div className="text-xs text-gray-400">{contract.property}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                      {contract.status}
                    </Badge>
                    <div className="text-sm font-medium">
                      R$ {contract.totalValue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Busca Results */}
      {search.results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Busca</CardTitle>
          </CardHeader>
          <CardContent>
            {search.isSearching ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="text-sm">
                {search.results.contracts?.length || 0} resultados encontrados
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total de Contratos" 
            value={stats.stats.total} 
            icon={<Database className="h-4 w-4" />}
          />
          <StatCard 
            title="Contratos Ativos" 
            value={stats.stats.active} 
            icon={<TrendingUp className="h-4 w-4" />}
            trend={+5}
          />
          <StatCard 
            title="Receita Total" 
            value={`R$ ${stats.stats.revenue?.toLocaleString() || 0}`} 
            icon={<Download className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Total de Queries</div>
              <div className="text-2xl">{cache.cacheStats.totalQueries}</div>
            </div>
            <div>
              <div className="font-medium">Queries Ativas</div>
              <div className="text-2xl">{cache.cacheStats.activeQueries}</div>
            </div>
            <div>
              <div className="font-medium">Queries Stale</div>
              <div className="text-2xl">{cache.cacheStats.staleQueries}</div>
            </div>
            <div>
              <div className="font-medium">Queries com Erro</div>
              <div className="text-2xl">{cache.cacheStats.errorQueries}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para métricas de performance
function PerformanceMetrics({ 
  contracts, 
  stats, 
  cache, 
  monitor 
}: {
  contracts: any;
  stats: any;
  cache: any;
  monitor: any;
}) {
  const [metrics, setMetrics] = useState(monitor.getDetailedMetrics());

  useState(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getDetailedMetrics());
    }, 2000);

    return () => clearInterval(interval);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium">Cache Performance</h4>
            <div className="text-sm space-y-1">
              <div>Hit Rate: {metrics.cache.hitRate.toFixed(1)}%</div>
              <div>Total Queries: {metrics.cache.totalQueries}</div>
              <div>Active Queries: {metrics.cache.activeQueries}</div>
              <div>Cache Size: {formatBytes(metrics.cache.cacheSize)}</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Query Performance</h4>
            <div className="text-sm space-y-1">
              <div>Avg Query Time: {metrics.performance.averageQueryTime.toFixed(0)}ms</div>
              <div>Error Rate: {metrics.performance.errorRate.toFixed(1)}%</div>
              <div>Cache Utilization: {metrics.performance.cacheUtilization.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para card de estatística
function StatCard({ 
  title, 
  value, 
  icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}% vs mês anterior
              </p>
            )}
          </div>
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Utilitário para formatar bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}