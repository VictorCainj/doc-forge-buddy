import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Users,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useOptimizedData';
import { DashboardPrintButton } from '@/components/PrintButton';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import { useState } from 'react';

const Index = () => {
  useAuth();
  const { contracts, metrics, loading, refetch } = useDashboardData();
  const [useEnhancedDashboard, setUseEnhancedDashboard] = useState(true);

  // Usar dados otimizados do hook
  const {
    totalContracts,
    currentMonthContracts,
    growthPercentage,
    expiredContracts,
    upcomingContracts,
    chartData,
  } = metrics;

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Se o dashboard otimizado estiver ativo, renderizar o novo componente
  if (useEnhancedDashboard) {
    return <EnhancedDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-gray-300">
                  Visão geral dos contratos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseEnhancedDashboard(!useEnhancedDashboard)}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                {useEnhancedDashboard ? (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-2" />
                    Dashboard Clássico
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-4 w-4 mr-2" />
                    Dashboard Otimizado
                  </>
                )}
              </Button>
              <DashboardPrintButton
                data={metrics}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total de Contratos
                  </p>
                  <p className="text-3xl font-bold">{totalContracts}</p>
                  <p className="text-blue-100 text-sm">
                    {currentMonthContracts} este mês
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">
                    Próximos do Vencimento
                  </p>
                  <p className="text-3xl font-bold">
                    {upcomingContracts.length}
                  </p>
                  <p className="text-yellow-100 text-sm">vencendo em 7 dias</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Expirados</p>
                  <p className="text-3xl font-bold">
                    {expiredContracts.length}
                  </p>
                  <p className="text-red-100 text-sm">precisam de atenção</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    Contratos por Data
                  </p>
                  <p className="text-3xl font-bold">
                    {
                      contracts.filter((c) => c.form_data.dataTerminoRescisao)
                        .length
                    }
                  </p>
                  <p className="text-orange-100 text-sm">desocupação</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Gráfico Principal - Comparativo Mensal */}
          <div>
            <Card className="shadow-lg border-0 bg-slate-800 border-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-white">
                        Comparativo Mensal de Contratos
                      </CardTitle>
                      <p className="text-sm text-gray-300 mt-1">
                        Últimos 12 meses - Tendência de crescimento
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={`${growthPercentage >= 0 ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}
                    >
                      {growthPercentage >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {growthPercentage > 0 ? '+' : ''}
                      {growthPercentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Gráfico de Barras */}
                  <div className="flex items-end justify-between h-64 px-4 bg-slate-700 rounded-lg py-4">
                    {chartData.map((data, index) => {
                      const height = Math.max(
                        (data.value / maxValue) * 200,
                        16
                      );
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center flex-1 group"
                        >
                          <div className="relative w-full flex justify-center">
                            <div
                              className={`w-8 rounded-t-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
                                data.value > 0
                                  ? 'bg-gradient-to-t from-blue-500 to-blue-600 shadow-md hover:shadow-lg'
                                  : 'bg-slate-500'
                              }`}
                              style={{ height: `${height}px` }}
                              title={`${data.fullMonth}: ${data.value} contrato${data.value !== 1 ? 's' : ''}`}
                            >
                              {data.value > 0 && (
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  {data.value} contrato
                                  {data.value !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-300 mt-3 font-medium text-center">
                            {data.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legenda e Estatísticas */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                        <span className="text-sm text-gray-300">Contratos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                        <span className="text-sm text-gray-300">Sem dados</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        Total:{' '}
                        <span className="font-semibold text-white">
                          {totalContracts}
                        </span>{' '}
                        contratos
                      </p>
                      <p className="text-sm text-gray-300">
                        Média mensal:{' '}
                        <span className="font-semibold text-white">
                          {(totalContracts / 12).toFixed(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
