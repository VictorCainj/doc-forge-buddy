import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckSquare,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Bell,
  Settings,
  Download,
  Eye,
  Filter,
} from 'lucide-react';
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

  // Dados dos cards de métricas profissionais
  const metricsCards = [
    {
      title: 'Total de Contratos',
      value: metrics.totalContracts.toString(),
      change: `${metrics.currentMonthContracts} este mês`,
      changeType: 'positive',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-500/20',
      trend: '+12%',
      trendIcon: TrendingUp,
    },
    {
      title: 'Contratos Ativos',
      value: metrics.activeContracts.toString(),
      change: 'cadastrados no sistema',
      changeType: 'neutral',
      icon: CheckSquare,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-500/10 to-green-600/10',
      borderColor: 'border-green-500/20',
      trend: '+8%',
      trendIcon: TrendingUp,
    },
    {
      title: 'Próximos do Vencimento',
      value: metrics.upcomingContracts.toString(),
      change: 'vencendo em 7 dias',
      changeType: metrics.upcomingContracts > 0 ? 'negative' : 'positive',
      icon: Calendar,
      gradient: 'from-yellow-500 to-yellow-600',
      bgGradient: 'from-yellow-500/10 to-yellow-600/10',
      borderColor: 'border-yellow-500/20',
      trend: metrics.upcomingContracts > 0 ? 'Atenção' : 'OK',
      trendIcon: metrics.upcomingContracts > 0 ? AlertTriangle : CheckSquare,
    },
    {
      title: 'Expirados',
      value: metrics.expiredContracts.toString(),
      change: 'precisam de atenção',
      changeType: metrics.expiredContracts > 0 ? 'negative' : 'positive',
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-500/10 to-red-600/10',
      borderColor: 'border-red-500/20',
      trend: metrics.expiredContracts > 0 ? 'Urgente' : 'OK',
      trendIcon: metrics.expiredContracts > 0 ? AlertTriangle : CheckSquare,
    },
  ];

  // Gerar dados do gráfico baseados nos contratos reais (últimos 6 meses)
  const generateChartData = () => {
    const months: Array<{ name: string; index: number; year: number }> = [];
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
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <div className="professional-header">
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Dashboard Executivo
                </h1>
                <p className="text-white/80 text-lg">
                  Visão geral completa dos seus contratos e operações
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="status-indicator text-green-400">
                  <span className="text-sm font-medium">Sistema Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-white/90">
                <p className="text-sm">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-white/70">
                  Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {/* Status Cards Row */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Status do Sistema
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
            </div>
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

        {/* Professional Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricsCards.map((card, index) => {
            const IconComponent = card.icon;
            const TrendIcon = card.trendIcon;
            return (
              <Card
                key={index}
                className={`metric-card border ${card.borderColor} bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          card.changeType === 'positive'
                            ? 'default'
                            : card.changeType === 'negative'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        <TrendIcon className="h-3 w-3 mr-1" />
                        {card.trend}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {card.title}
                    </h3>
                    <p className="text-3xl font-bold text-foreground">
                      {card.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {card.change}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Advanced Analytics Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Análise de Rescisões
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Últimos 6 meses - Tendência de crescimento
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="text-green-600 bg-green-100"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15.2%
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Advanced Bar Chart */}
                <div className="flex items-end justify-between h-48 px-4">
                  {chartData.map((data, index) => {
                    const height = Math.max((data.value / maxValue) * 160, 16);
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1 group"
                      >
                        <div
                          className={`w-8 rounded-t-lg relative transition-all duration-300 hover:scale-105 ${
                            data.value > 0
                              ? 'bg-gradient-to-t from-primary to-primary/80 shadow-lg'
                              : 'bg-muted'
                          }`}
                          style={{ height: `${height}px` }}
                        >
                          {data.value > 0 && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              {data.value} contrato{data.value !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-3 font-medium">
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Legend */}
                <div className="flex items-center justify-center space-x-6 pt-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/80"></div>
                    <span className="text-sm text-muted-foreground">
                      Rescisões
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-muted"></div>
                    <span className="text-sm text-muted-foreground">
                      Sem dados
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Indicators */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Indicadores de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Eficiência
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">94%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Velocidade
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">2.1s</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Segurança
                    </span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    99.9%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Uptime
                  </span>
                  <span className="text-sm text-muted-foreground">30 dias</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                    style={{ width: '99.9%' }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Alerts Section */}
        {(rescisoesExpiradas.length > 0 ||
          rescisoesProximasVencimento.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Alertas e Notificações
              </h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Critical Alerts */}
              {rescisoesExpiradas.length > 0 && (
                <Card className="alert-card border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/5 to-red-500/10">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-red-500/20">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-red-800">
                            Contratos Expirados
                          </CardTitle>
                          <p className="text-sm text-red-600">
                            Requerem atenção imediata
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="destructive"
                        className="text-lg px-3 py-1"
                      >
                        {rescisoesExpiradas.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {rescisoesExpiradas.slice(0, 4).map((contract) => {
                        const terminoDate = parseBrazilianDate(
                          contract.form_data.dataTerminoRescisao
                        );
                        const daysOverdue = terminoDate
                          ? calculateDaysDifference(terminoDate, new Date())
                          : 0;
                        return (
                          <div
                            key={contract.id}
                            className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-red-200/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {contract.form_data.numeroContrato || 'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {contract.form_data.nomeLocatario || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="destructive" className="text-xs">
                                {daysOverdue} dias
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {rescisoesExpiradas.length > 4 && (
                        <div className="text-center py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Ver mais {rescisoesExpiradas.length - 4} contrato
                            {rescisoesExpiradas.length - 4 !== 1 ? 's' : ''}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warning Alerts */}
              {rescisoesProximasVencimento.length > 0 && (
                <Card className="alert-card border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-500/5 to-yellow-500/10">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-yellow-500/20">
                          <Calendar className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-yellow-800">
                            Próximos do Vencimento
                          </CardTitle>
                          <p className="text-sm text-yellow-600">
                            Vencimento em 7 dias
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-lg px-3 py-1 bg-yellow-100 text-yellow-800"
                      >
                        {rescisoesProximasVencimento.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {rescisoesProximasVencimento
                        .slice(0, 4)
                        .map((contract) => {
                          const terminoDate = parseBrazilianDate(
                            contract.form_data.dataTerminoRescisao
                          );
                          const daysUntilDue = terminoDate
                            ? calculateDaysDifference(new Date(), terminoDate)
                            : 0;
                          return (
                            <div
                              key={contract.id}
                              className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-yellow-200/50"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {contract.form_data.numeroContrato || 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {contract.form_data.nomeLocatario || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-yellow-100 text-yellow-800"
                                >
                                  {daysUntilDue} dias
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      {rescisoesProximasVencimento.length > 4 && (
                        <div className="text-center py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                          >
                            Ver mais {rescisoesProximasVencimento.length - 4}{' '}
                            contrato
                            {rescisoesProximasVencimento.length - 4 !== 1
                              ? 's'
                              : ''}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Professional Contracts Table */}
        {contracts.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Contratos Recentes
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Últimas atividades e status dos contratos
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/contratos')}
                  >
                    Ver Todos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="data-grid">
                <div className="data-grid-header px-6 py-3">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3">Contrato</div>
                    <div className="col-span-3">Locatário</div>
                    <div className="col-span-3">Endereço</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Ações</div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {contracts.slice(0, 5).map((contract) => {
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
                        className="data-grid-row px-6 py-4"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                            <p className="font-medium text-foreground">
                              {contract.form_data.numeroContrato || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Criado em{' '}
                              {new Date(contract.created_at).toLocaleDateString(
                                'pt-BR'
                              )}
                            </p>
                          </div>
                          <div className="col-span-3">
                            <p className="text-sm text-foreground truncate">
                              {contract.form_data.nomeLocatario || 'N/A'}
                            </p>
                          </div>
                          <div className="col-span-3">
                            <p className="text-sm text-muted-foreground truncate">
                              {contract.form_data.enderecoImovel || 'N/A'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            {isExpired && (
                              <Badge
                                variant="destructive"
                                className="inline-flex items-center"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expirado
                              </Badge>
                            )}
                            {isNearExpiry && !isExpired && (
                              <Badge
                                variant="secondary"
                                className="inline-flex items-center bg-yellow-100 text-yellow-800"
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Próximo
                              </Badge>
                            )}
                            {!isExpired && !isNearExpiry && (
                              <Badge
                                variant="default"
                                className="inline-flex items-center bg-green-100 text-green-800"
                              >
                                <CheckSquare className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            )}
                          </div>
                          <div className="col-span-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {contracts.length > 5 && (
                <div className="text-center py-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/contratos')}
                    className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Ver mais {contracts.length - 5} contrato
                    {contracts.length - 5 !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
