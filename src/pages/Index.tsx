import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
import { Users, CheckSquare, AlertTriangle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { validateContractsList, type Contract } from '@/utils/dataValidator';
import { dbLogger } from '@/utils/logger';

const Index = () => {
  const navigate = useNavigate();
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

  // Função para calcular dias entre duas datas
  const calculateDaysDifference = (startDate: Date, endDate: Date): number => {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calcular métricas baseadas nos dados reais
  const calculateMetrics = () => {
    const totalContracts = contracts.length;
    const now = new Date();

    // Contratos do mês atual
    const currentMonthContracts = contracts.filter((contract) => {
      const contractDate = new Date(contract.created_at);
      return (
        contractDate.getMonth() === now.getMonth() &&
        contractDate.getFullYear() === now.getFullYear()
      );
    });

    // Contratos ativos (todos os contratos cadastrados)
    const activeContracts = contracts; // Todos os contratos são considerados ativos

    // Contratos expirados (baseado nas datas de rescisão ou contrato)
    const expiredContracts = contracts.filter((contract) => {
      // Tentar usar dataTerminoRescisao primeiro, depois dataTermino como fallback
      const terminoDate =
        parseBrazilianDate(contract.form_data.dataTerminoRescisao) ||
        parseBrazilianDate(contract.form_data.dataTermino);
      return terminoDate && terminoDate < now;
    });

    // Contratos próximos do vencimento (próximos 7 dias)
    const upcomingContracts = contracts.filter((contract) => {
      const terminoDate =
        parseBrazilianDate(contract.form_data.dataTerminoRescisao) ||
        parseBrazilianDate(contract.form_data.dataTermino);
      if (!terminoDate) return false;
      const daysUntilExpiry = Math.ceil(
        (terminoDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });

    return {
      totalContracts,
      currentMonthContracts: currentMonthContracts.length,
      activeContracts: activeContracts.length,
      expiredContracts: expiredContracts.length,
      upcomingContracts: upcomingContracts.length,
    };
  };

  const metrics = calculateMetrics();

  // Dados dos cards de métricas baseados em dados reais
  const metricsCards = [
    {
      title: 'Total de Contratos',
      value: metrics.totalContracts.toString(),
      change: `${metrics.currentMonthContracts} este mês`,
      changeType: 'positive',
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Contratos Ativos',
      value: metrics.activeContracts.toString(),
      change: 'cadastrados no sistema',
      changeType: 'neutral',
      icon: CheckSquare,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Próximos do Vencimento',
      value: metrics.upcomingContracts.toString(),
      change: 'vencendo em 7 dias',
      changeType: metrics.upcomingContracts > 0 ? 'negative' : 'positive',
      icon: Calendar,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Expirados',
      value: metrics.expiredContracts.toString(),
      change: 'precisam de atenção',
      changeType: metrics.expiredContracts > 0 ? 'negative' : 'positive',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  // Gerar dados do gráfico baseados nos contratos reais (últimos 6 meses)
  const generateChartData = () => {
    const months = [];
    const now = new Date();

    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: date.toLocaleDateString('pt-BR', { month: 'short' }),
        index: date.getMonth(),
        year: date.getFullYear(),
      });
    }

    return months.map((month) => {
      const contractsInMonth = contracts.filter((contract) => {
        // Usar data de início da rescisão se disponível, senão usar data de criação
        const rescisaoDate = parseBrazilianDate(
          contract.form_data.dataInicioRescisao
        );
        const contractDate = rescisaoDate || new Date(contract.created_at);

        return (
          contractDate.getMonth() === month.index &&
          contractDate.getFullYear() === month.year
        );
      });

      return {
        month: month.name,
        value: contractsInMonth.length,
      };
    });
  };

  const chartData = generateChartData();
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Debug: verificar dados do gráfico
  dbLogger.debug('Chart data:', chartData);
  dbLogger.debug('Max value:', maxValue);

  // Calcular desocupações que ultrapassaram 30 dias
  const getRescisoesExpiradas = () => {
    const now = new Date();
    return contracts.filter((contract) => {
      const terminoDate = parseBrazilianDate(
        contract.form_data.dataTerminoRescisao
      );
      if (!terminoDate) return false;
      return terminoDate < now;
    });
  };

  // Calcular desocupações próximas do vencimento (próximos 7 dias)
  const getRescisoesProximasVencimento = () => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return contracts.filter((contract) => {
      const terminoDate = parseBrazilianDate(
        contract.form_data.dataTerminoRescisao
      );
      if (!terminoDate) return false;
      return terminoDate >= now && terminoDate <= sevenDaysFromNow;
    });
  };

  const rescisoesExpiradas = getRescisoesExpiradas();
  const rescisoesProximasVencimento = getRescisoesProximasVencimento();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-4 lg:p-6">
        {/* Header Compacto */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              {loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Carregando dados...
                </p>
              )}
            </div>
            {!loading && contracts.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {contracts.length} contrato{contracts.length !== 1 ? 's' : ''}{' '}
                  cadastrado{contracts.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {metrics.activeContracts} ativo
                  {metrics.activeContracts !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {!loading && contracts.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Bem-vindo ao seu Dashboard!
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Você ainda não possui contratos cadastrados.</p>
                    <p className="mt-1">
                      <button
                        onClick={() => navigate('/cadastrar-contrato')}
                        className="font-medium underline hover:text-blue-600"
                      >
                        Cadastre seu primeiro contrato
                      </button>{' '}
                      para começar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cards de Métricas Compactos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metricsCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card
                key={index}
                className={`${card.bgColor} border-0 shadow-sm`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {card.change}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${card.iconColor.replace('text-', 'bg-').replace('-600', '-100')}`}
                    >
                      <IconComponent className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gráfico Compacto */}
        <Card className="bg-white border border-gray-200 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Rescisões por Mês (Últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Gráfico de barras compacto */}
              <div className="flex items-end space-x-2 h-32">
                {chartData.map((data, index) => {
                  // Garantir altura mínima de 8px para barras visíveis
                  const height =
                    data.value > 0
                      ? Math.max((data.value / maxValue) * 100, 8)
                      : 8;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className={`w-full rounded-t-sm relative group ${
                          data.value > 0 ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                        style={{ height: `${height}px` }}
                      >
                        {data.value > 0 && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {data.value}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-2 font-medium">
                        {data.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas de Desocupações */}
        {(rescisoesExpiradas.length > 0 ||
          rescisoesProximasVencimento.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Desocupações Expiradas */}
            {rescisoesExpiradas.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <h3 className="font-medium text-red-800">Expiradas</h3>
                    </div>
                    <span className="text-lg font-bold text-red-700">
                      {rescisoesExpiradas.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {rescisoesExpiradas.slice(0, 3).map((contract) => {
                      const terminoDate = parseBrazilianDate(
                        contract.form_data.dataTerminoRescisao
                      );
                      const daysOverdue = terminoDate
                        ? calculateDaysDifference(terminoDate, new Date())
                        : 0;
                      return (
                        <div
                          key={contract.id}
                          className="text-xs text-red-700 bg-white p-2 rounded border border-red-200"
                        >
                          <div className="font-medium">
                            {contract.form_data.numeroContrato || 'N/A'}
                          </div>
                          <div className="text-red-600">
                            {daysOverdue} dias em atraso
                          </div>
                        </div>
                      );
                    })}
                    {rescisoesExpiradas.length > 3 && (
                      <div className="text-xs text-red-600 text-center">
                        +{rescisoesExpiradas.length - 3} mais
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Desocupações Próximas do Vencimento */}
            {rescisoesProximasVencimento.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-yellow-600" />
                      <h3 className="font-medium text-yellow-800">
                        Próximas do Vencimento
                      </h3>
                    </div>
                    <span className="text-lg font-bold text-yellow-700">
                      {rescisoesProximasVencimento.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {rescisoesProximasVencimento.slice(0, 3).map((contract) => {
                      const terminoDate = parseBrazilianDate(
                        contract.form_data.dataTerminoRescisao
                      );
                      const daysUntilDue = terminoDate
                        ? calculateDaysDifference(new Date(), terminoDate)
                        : 0;
                      return (
                        <div
                          key={contract.id}
                          className="text-xs text-yellow-700 bg-white p-2 rounded border border-yellow-200"
                        >
                          <div className="font-medium">
                            {contract.form_data.numeroContrato || 'N/A'}
                          </div>
                          <div className="text-yellow-600">
                            Vence em {daysUntilDue} dias
                          </div>
                        </div>
                      );
                    })}
                    {rescisoesProximasVencimento.length > 3 && (
                      <div className="text-xs text-yellow-600 text-center">
                        +{rescisoesProximasVencimento.length - 3} mais
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Lista de Contratos */}
        {contracts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  Contratos Recentes
                </CardTitle>
                <button
                  onClick={() => navigate('/contratos')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver todos
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contracts.slice(0, 5).map((contract) => {
                  // const inicioDate = parseBrazilianDate(
                  //   contract.form_data.dataInicioRescisao
                  // );
                  const terminoDate = parseBrazilianDate(
                    contract.form_data.dataTerminoRescisao
                  );
                  const isExpired = terminoDate && terminoDate < new Date();
                  const isNearExpiry =
                    terminoDate &&
                    terminoDate > new Date() &&
                    calculateDaysDifference(new Date(), terminoDate) <= 7;

                  return (
                    <div
                      key={contract.id}
                      className={`p-3 rounded-lg border ${
                        isExpired
                          ? 'bg-red-50 border-red-200'
                          : isNearExpiry
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {contract.form_data.numeroContrato || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {contract.form_data.nomeLocatario || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {contract.form_data.enderecoImovel || 'N/A'}
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          {isExpired && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Expirada
                            </span>
                          )}
                          {isNearExpiry && !isExpired && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Calendar className="h-3 w-3 mr-1" />
                              Próxima
                            </span>
                          )}
                          {!isExpired && !isNearExpiry && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {contracts.length > 5 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => navigate('/contratos')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver mais {contracts.length - 5} contrato
                      {contracts.length - 5 !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
