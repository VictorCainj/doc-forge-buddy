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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { validateContractsList, type Contract } from '@/utils/dataValidator';
import { dbLogger } from '@/utils/logger';

const Index = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar contratos do Supabase
  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      // Buscar contratos do usuário atual
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Usar validação robusta para processar os dados
      const contractsData = validateContractsList(data || []);
      setContracts(contractsData);
    } catch (error) {
      dbLogger.error('Erro ao carregar contratos:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para converter data DD/MM/AAAA para objeto Date
  const parseBrazilianDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexado
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  // Gerar dados do gráfico comparativo mensal (últimos 12 meses)
  const generateMonthlyChartData = () => {
    const months: Array<{ name: string; index: number; year: number }> = [];
    const now = new Date();

    // Gerar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: date.toLocaleDateString('pt-BR', { month: 'short' }),
        index: date.getMonth(),
        year: date.getFullYear(),
      });
    }

    return months.map((month) => {
      const contractsInMonth = contracts.filter((contract) => {
        const contractDate = new Date(contract.created_at);
        return (
          contractDate.getMonth() === month.index &&
          contractDate.getFullYear() === month.year
        );
      });

      return {
        month: month.name,
        value: contractsInMonth.length,
        fullMonth: new Date(month.year, month.index, 1).toLocaleDateString(
          'pt-BR',
          { month: 'long', year: 'numeric' }
        ),
      };
    });
  };

  // Obter contratos ordenados por data de desocupação (mais recente para mais antiga)
  const getContractsOrderedByVacationDate = () => {
    return contracts
      .filter((contract) => contract.form_data.dataTerminoRescisao)
      .map((contract) => ({
        ...contract,
        vacationDate: parseBrazilianDate(
          contract.form_data.dataTerminoRescisao
        ),
      }))
      .filter((contract) => contract.vacationDate)
      .sort((a, b) => {
        if (!a.vacationDate || !b.vacationDate) return 0;
        return b.vacationDate.getTime() - a.vacationDate.getTime();
      });
  };

  const chartData = generateMonthlyChartData();
  const orderedContracts = getContractsOrderedByVacationDate();
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Calcular métricas
  const totalContracts = contracts.length;
  const currentMonthContracts = chartData[chartData.length - 1]?.value || 0;
  const previousMonthContracts = chartData[chartData.length - 2]?.value || 0;
  const growthPercentage =
    previousMonthContracts > 0
      ? ((currentMonthContracts - previousMonthContracts) /
          previousMonthContracts) *
        100
      : 0;

  const contractsWithVacationDate = contracts.filter(
    (c) => c.form_data.dataTerminoRescisao
  );
  const expiredContracts = contractsWithVacationDate.filter((contract) => {
    const vacationDate = parseBrazilianDate(
      contract.form_data.dataTerminoRescisao
    );
    return vacationDate && vacationDate < new Date();
  });

  const upcomingContracts = contractsWithVacationDate.filter((contract) => {
    const vacationDate = parseBrazilianDate(
      contract.form_data.dataTerminoRescisao
    );
    if (!vacationDate) return false;
    const daysUntilVacation = Math.ceil(
      (vacationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilVacation >= 0 && daysUntilVacation <= 7;
  });

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
                onClick={fetchContracts}
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
                    {orderedContracts.length}
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
