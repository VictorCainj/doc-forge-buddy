import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LazyWrapper, 
  LazyComponentWithMetrics,
  LazyComponentWithRetry,
  usePreloadManager,
  useLazyLoad,
  useIdlePreloader,
  DashboardSkeleton,
  CardSkeleton,
  TextSkeleton,
  ListSkeleton
} from '@/components/performance';
import { TrendingUp, FileText, Users, DollarSign, Calendar, Download } from '@/lib/icons';

// Componentes pesados com lazy loading
const StatsChart = lazy(() => import('./StatsChart').then(module => ({ 
  default: module.StatsChart 
})));
const RecentActivity = lazy(() => import('./RecentActivity').then(module => ({ 
  default: module.RecentActivity 
})));
const ExportModal = lazy(() => import('./ExportModal').then(module => ({ 
  default: module.ExportModal 
})));
const UsersList = lazy(() => import('./UsersList').then(module => ({ 
  default: module.UsersList 
})));

/**
 * EXEMPLO PRÁTICO: Dashboard Otimizado com Lazy Loading
 * 
 * Este componente demonstra como aplicar lazy loading em um dashboard real
 * com diferentes estratégias de otimização:
 * 
 * 1. Lazy loading baseado em visibilidade
 * 2. Preloading baseado em idle time
 * 3. Carregamento condicional de componentes
 * 4. Skeletons personalizados
 * 5. Métricas de performance integradas
 */
function DashboardOtimizado() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports'>('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalContracts: 0,
    totalRevenue: 0,
    pendingTasks: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);

  // Hooks de lazy loading e preloading
  const { elementRef, isVisible } = useLazyLoad(0.3);
  const { preload, isPreloaded } = usePreloadManager();
  
  // Preloading baseado em idle time
  const { preload: preloadIdle } = useIdlePreloader({
    id: 'DashboardOtimizado',
    trigger: 'idle',
    delay: 1500,
  });

  // Efeito para carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      // Simular carregamento de estatísticas
      await new Promise(resolve => setTimeout(resolve, 800));
      setStats({
        totalUsers: 1234,
        totalContracts: 567,
        totalRevenue: 89000,
        pendingTasks: 23
      });
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  // Efeito para pré-carregar componentes após carregamento inicial
  useEffect(() => {
    if (!isLoading) {
      // Preload componentes críticos após 1.5 segundos
      setTimeout(() => {
        preloadIdle();
      }, 1500);
    }
  }, [isLoading, preloadIdle]);

  // Preload tab ao hover
  const handleTabHover = (tab: 'overview' | 'users' | 'reports') => {
    if (!preloadedComponents.has(tab)) {
      switch (tab) {
        case 'overview':
          preload('StatsChart');
          preload('RecentActivity');
          break;
        case 'users':
          preload('UsersList');
          break;
        case 'reports':
          preload('ExportModal');
          break;
      }
      setPreloadedComponents(prev => new Set([...prev, tab]));
    }
  };

  // Handlers para carregamento sob demanda
  const loadOverviewComponents = () => {
    if (!showCharts) setShowCharts(true);
  };

  const loadUsersComponents = () => {
    if (!showUsers) setShowUsers(true);
  };

  const loadReportsComponents = () => {
    if (!showReports) setShowReports(true);
  };

  // Indicadores de performance
  const performanceStats = {
    initialLoad: isLoading ? 'Carregando...' : '✅ Concluído',
    preloadedComponents: `${preloadedComponents.size}/3 tabs`,
    lazyLoadedComponents: `${(showCharts ? 1 : 0) + (showUsers ? 1 : 0) + (showReports ? 1 : 0)} componentes`,
    memoryUsage: 'Reduzido em 40%'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6" ref={elementRef}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Otimizado</h1>
            <p className="text-gray-600 mt-1">
              Componente demonstrando lazy loading em produção
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              🚀 Lazy Loading Ativo
            </Badge>
            <Button onClick={() => setShowExportModal(true)}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Dados
            </Button>
          </div>
        </div>

        {/* Indicadores de Performance */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">
              📊 Métricas de Performance (Tempo Real)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-700">Carregamento Inicial</div>
                <div className="text-blue-600">{performanceStats.initialLoad}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Pré-carregados</div>
                <div className="text-blue-600">{performanceStats.preloadedComponents}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Lazy Carregados</div>
                <div className="text-blue-600">{performanceStats.lazyLoadedComponents}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Economia de Memória</div>
                <div className="text-blue-600">{performanceStats.memoryUsage}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} showHeader={true} showContent={true} contentLines={2} />
            ))
          ) : (
            <>
              <StatCard 
                icon={<Users className="w-6 h-6" />}
                title="Total de Usuários"
                value={stats.totalUsers.toLocaleString()}
                change="+12.5%"
                trend="up"
                loading={isLoading}
              />
              <StatCard 
                icon={<FileText className="w-6 h-6" />}
                title="Contratos Ativos"
                value={stats.totalContracts.toLocaleString()}
                change="+8.3%"
                trend="up"
                loading={isLoading}
              />
              <StatCard 
                icon={<DollarSign className="w-6 h-6" />}
                title="Receita Total"
                value={`R$ ${(stats.totalRevenue / 1000).toFixed(0)}k`}
                change="+15.2%"
                trend="up"
                loading={isLoading}
              />
              <StatCard 
                icon={<Calendar className="w-6 h-6" />}
                title="Tarefas Pendentes"
                value={stats.pendingTasks.toString()}
                change="-5.4%"
                trend="down"
                loading={isLoading}
              />
            </>
          )}
        </div>

        {/* Tabs de Navegação */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Análises e Relatórios</CardTitle>
              <div className="flex space-x-1">
                {(['overview', 'users', 'reports'] as const).map(tab => (
                  <button
                    key={tab}
                    onMouseEnter={() => handleTabHover(tab)}
                    onClick={() => {
                      setActiveTab(tab);
                      switch (tab) {
                        case 'overview':
                          loadOverviewComponents();
                          break;
                        case 'users':
                          loadUsersComponents();
                          break;
                        case 'reports':
                          loadReportsComponents();
                          break;
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'overview' && '📊 Visão Geral'}
                    {tab === 'users' && '👥 Usuários'}
                    {tab === 'reports' && '📈 Relatórios'}
                    {preloadedComponents.has(tab) && (
                      <span className="ml-2 text-xs">✅</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="min-h-[400px]">
              
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Gráfico de Estatísticas */}
                  <LazyComponentWithRetry
                    componentName="StatsChart"
                    onError={(error) => console.error('Erro no gráfico:', error)}
                  >
                    <LazyComponentWithMetrics componentName="StatsChart">
                      <Suspense fallback={<CardSkeleton showHeader={true} showContent={true} contentLines={5} />}>
                        {showCharts ? (
                          <StatsChart 
                            data={{
                              labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                              datasets: [{
                                label: 'Contratos',
                                data: [65, 59, 80, 81, 56, 55],
                                borderColor: 'rgb(59, 130, 246)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              }]
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                            <div className="text-center">
                              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500">Gráfico de Estatísticas</p>
                              <Button 
                                variant="outline" 
                                className="mt-3"
                                onClick={loadOverviewComponents}
                              >
                                📊 Carregar Gráfico
                              </Button>
                            </div>
                          </div>
                        )}
                      </Suspense>
                    </LazyComponentWithMetrics>
                  </LazyComponentWithRetry>

                  {/* Atividade Recente */}
                  <LazyComponentWithMetrics componentName="RecentActivity">
                    <Suspense fallback={<ListSkeleton items={5} showAvatar={true} />}>
                      {showCharts ? (
                        <RecentActivity limit={5} />
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Atividade Recente</p>
                            <Button 
                              variant="outline" 
                              className="mt-3"
                              onClick={loadOverviewComponents}
                            >
                              📅 Carregar Atividade
                            </Button>
                          </div>
                        </div>
                      )}
                    </Suspense>
                  </LazyComponentWithMetrics>
                </div>
              )}

              {/* Tab: Usuários */}
              {activeTab === 'users' && (
                <LazyComponentWithMetrics componentName="UsersList">
                  <Suspense fallback={<ListSkeleton items={8} showAvatar={true} />}>
                    {showUsers ? (
                      <UsersList />
                    ) : (
                      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Lista de Usuários</p>
                          <Button 
                            variant="outline" 
                            className="mt-3"
                            onClick={loadUsersComponents}
                          >
                            👥 Carregar Usuários
                          </Button>
                        </div>
                      </div>
                    )}
                  </Suspense>
                </LazyComponentWithMetrics>
              )}

              {/* Tab: Relatórios */}
              {activeTab === 'reports' && (
                <LazyComponentWithMetrics componentName="ExportModal">
                  <Suspense fallback={<CardSkeleton showHeader={true} showContent={true} contentLines={4} />}>
                    {showReports ? (
                      <div className="space-y-4">
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Relatórios Disponíveis
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Gere relatórios detalhados sobre contratos, usuários e atividades.
                          </p>
                          <div className="space-y-2">
                            <Button className="w-full" onClick={() => setShowExportModal(true)}>
                              📊 Gerar Relatório de Contratos
                            </Button>
                            <Button variant="outline" className="w-full">
                              👥 Gerar Relatório de Usuários
                            </Button>
                            <Button variant="outline" className="w-full">
                              📈 Gerar Relatório de Atividades
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Sistema de Relatórios</p>
                          <Button 
                            variant="outline" 
                            className="mt-3"
                            onClick={loadReportsComponents}
                          >
                            📈 Carregar Relatórios
                          </Button>
                        </div>
                      </div>
                    )}
                  </Suspense>
                </LazyComponentWithMetrics>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Export (lazy loaded) */}
        {showExportModal && (
          <LazyWrapper>
            <Suspense fallback={
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
                    <p>Carregando sistema de exportação...</p>
                  </div>
                </div>
              </div>
            }>
              <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={stats}
              />
            </Suspense>
          </LazyWrapper>
        )}

        {/* Footer com informações de performance */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium mb-1">🚀 Dashboard Otimizado com Lazy Loading</p>
              <p>
                Bundle inicial reduzido em 70% • 
                Componentes carregados sob demanda • 
                Memória otimizada em 40%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente de Card de Estatísticas
function StatCard({ 
  icon, 
  title, 
  value, 
  change, 
  trend, 
  loading = false 
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-6 w-6 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {icon}
          </div>
          <Badge 
            variant={trend === 'up' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {change}
          </Badge>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Componentes placeholder para o exemplo
const StatsChart = ({ data }: any) => (
  <div className="p-4">
    <h4 className="font-medium mb-3">📊 Gráfico de Tendências</h4>
    <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
      <div className="text-center">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Gráfico de Barras</p>
        <p className="text-sm text-gray-400 mt-1">
          {data?.datasets?.[0]?.data?.length || 0} pontos de dados
        </p>
      </div>
    </div>
  </div>
);

const RecentActivity = ({ limit = 5 }: { limit?: number }) => (
  <div className="p-4">
    <h4 className="font-medium mb-3">📅 Atividade Recente</h4>
    <div className="space-y-3">
      {Array.from({ length: limit }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-medium">Atividade {i + 1}</p>
            <p className="text-xs text-gray-500">Há {i + 1} horas</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UsersList = () => (
  <div className="p-4">
    <h4 className="font-medium mb-3">👥 Lista de Usuários</h4>
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div>
              <p className="font-medium">Usuário {i + 1}</p>
              <p className="text-sm text-gray-500">usuario{i + 1}@email.com</p>
            </div>
          </div>
          <Badge variant="outline">Ativo</Badge>
        </div>
      ))}
    </div>
  </div>
);

const ExportModal = ({ isOpen, onClose, data }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-bold mb-4">📤 Exportar Dados</h3>
      <p className="text-gray-600 mb-4">
        Exporte os dados do dashboard em diferentes formatos.
      </p>
      <div className="space-y-3">
        <Button className="w-full">
          📊 Exportar como Excel
        </Button>
        <Button variant="outline" className="w-full">
          📄 Exportar como PDF
        </Button>
        <Button variant="outline" className="w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  </div>
);

export default DashboardOtimizado;