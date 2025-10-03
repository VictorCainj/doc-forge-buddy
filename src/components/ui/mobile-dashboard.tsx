import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/ui/metric-card';
import {
  Users,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  X,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDashboardProps {
  metrics: Record<string, unknown>;
  chartData: Record<string, unknown>;
  alerts: unknown[];
  recommendations: unknown[];
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
}

export const MobileDashboard = ({
  metrics,
  chartData,
  alerts,
  recommendations,
  loading,
  onRefresh,
  onExport,
}: MobileDashboardProps) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'charts' | 'alerts' | 'recommendations'
  >('overview');
  const [_expandedMetric, _setExpandedMetric] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'charts', label: 'Gráficos', icon: TrendingUp },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'recommendations', label: 'Recomendações', icon: FileCheck },
  ];

  const getRiskColor = (count: number) => {
    if (count === 0) return 'success';
    if (count <= 2) return 'warning';
    return 'error';
  };

  const getPerformanceStatus = (value: number, target: number) => {
    if (value >= target) return 'success';
    if (value >= target * 0.8) return 'warning';
    return 'error';
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Métricas Principais */}
      <div className="space-y-3">
        <MetricCard
          title="Taxa de Ocupação"
          value={`${(metrics.occupancyRate as number).toFixed(1)}%`}
          subtitle={`${((metrics.contractsAtRisk as Record<string, unknown>)?.expiring7Days as number) || 0} contratos ativos`}
          icon={Users}
          status={getPerformanceStatus(metrics.occupancyRate as number, 90)}
          trend={{
            value: 5.2,
            period: 'vs mês anterior',
          }}
          className="text-sm"
        />

        <MetricCard
          title="Receita Mensal"
          value={`R$ ${(metrics.monthlyRevenue as number).toLocaleString('pt-BR')}`}
          subtitle="Projeção baseada em contratos ativos"
          icon={DollarSign}
          status="success"
          trend={{
            value: 12.8,
            period: 'vs mês anterior',
          }}
          className="text-sm"
        />

        <MetricCard
          title="Contratos em Risco"
          value={
            (((metrics.contractsAtRisk as Record<string, unknown>)
              ?.expiring7Days as number) || 0) +
            (((metrics.contractsAtRisk as Record<string, unknown>)
              ?.expiring15Days as number) || 0)
          }
          subtitle={`${((metrics.contractsAtRisk as Record<string, unknown>)?.expiring7Days as number) || 0} em 7 dias, ${((metrics.contractsAtRisk as Record<string, unknown>)?.expiring15Days as number) || 0} em 15 dias`}
          icon={AlertTriangle}
          status={getRiskColor(
            ((metrics.contractsAtRisk as Record<string, unknown>)
              ?.expiring7Days as number) || 0
          )}
          className="text-sm"
        />

        <MetricCard
          title="Documentação"
          value={`${metrics.documentationPerformance?.percentage.toFixed(1) || 0}%`}
          subtitle={`${metrics.documentationPerformance?.complete || 0} completos`}
          icon={FileCheck}
          status={getPerformanceStatus(
            metrics.documentationPerformance?.percentage || 0,
            80
          )}
          className="text-sm"
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Tempo Médio</p>
              <p className="text-lg font-bold">
                {metrics.averageProcessingTime?.toFixed(1) || 0} dias
              </p>
            </div>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Satisfação</p>
              <p className="text-lg font-bold">
                {metrics.customerSatisfaction?.toFixed(1) || 0}/5
              </p>
            </div>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderCharts = () => (
    <div className="space-y-4">
      {/* Gráfico de Tendência */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tendência Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Gráfico interativo</p>
              <p className="text-xs">Toque para expandir</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição Geográfica */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Distribuição Geográfica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {chartData?.geographicData
              ?.slice(0, 5)
              .map((item: Record<string, unknown>, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">
                    {item.location as string}
                  </span>
                  <Badge variant="secondary">{item.count as number}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-3">
      {alerts.length > 0 ? (
        alerts.slice(0, 5).map((alert: Record<string, unknown>) => (
          <Card key={alert.id as string} className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800">
                    {alert.title as string}
                  </h4>
                  <p className="text-sm text-red-600 mt-1">
                    {alert.description as string}
                  </p>
                  <Badge variant="destructive" className="mt-2">
                    {alert.priority as string}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhum alerta crítico</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-3">
      {recommendations.length > 0 ? (
        recommendations.slice(0, 5).map((recommendation) => (
          <Card key={recommendation.id}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium">{recommendation.title}</h4>
                <p className="text-sm text-gray-600">
                  {recommendation.description}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    Impacto: {recommendation.impact}
                  </Badge>
                  <Badge variant="outline">
                    Esforço: {recommendation.effort}
                  </Badge>
                </div>
                <Button size="sm" className="w-full mt-2">
                  Executar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma recomendação disponível</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'charts':
        return renderCharts();
      case 'alerts':
        return renderAlerts();
      case 'recommendations':
        return renderRecommendations();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile */}
      <div className="professional-header sticky top-0 z-50">
        <div className="px-4 py-3 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-8 w-8 p-0 bg-card/50 border-border text-foreground hover:bg-accent/50 backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8 p-0 bg-card/50 border-border text-foreground hover:bg-accent/50 backdrop-blur-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | 'overview'
                      | 'charts'
                      | 'alerts'
                      | 'recommendations'
                  )
                }
                className={cn(
                  'flex-1 flex items-center justify-center space-x-1 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">{renderContent()}</div>

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          size="lg"
          className="rounded-full shadow-glow bg-primary hover:bg-primary/90"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-lg p-4 max-h-96 overflow-y-auto border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="text-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Período
                </label>
                <select className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground">
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Status
                </label>
                <div className="mt-1 space-y-2">
                  {['Ativo', 'Expirando', 'Expirado'].map((status) => (
                    <label key={status} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-foreground">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
