import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckSquare, Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface Contract {
  id: string;
  title: string;
  form_data: Record<string, string>;
  created_at: string;
  document_type: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar contratos do Supabase
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contractsData: Contract[] = (data || []).map((row) => ({
        ...row,
        form_data:
          typeof row.form_data === 'string'
            ? JSON.parse(row.form_data)
            : (row.form_data as Record<string, string>) || {},
      }));

      setContracts(contractsData);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas baseadas nos dados reais
  const calculateMetrics = () => {
    const totalContracts = contracts.length;

    // Calcular média mensal (contratos criados nos últimos 12 meses)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const contractsLastYear = contracts.filter(
      (contract) => new Date(contract.created_at) >= twelveMonthsAgo
    );

    const monthlyAverage = Math.round(contractsLastYear.length / 12);

    // Calcular variação anual
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const currentYearContracts = contracts.filter(
      (contract) => new Date(contract.created_at).getFullYear() === currentYear
    );

    const lastYearContracts = contracts.filter(
      (contract) => new Date(contract.created_at).getFullYear() === lastYear
    );

    const annualVariation =
      lastYearContracts.length > 0
        ? ((currentYearContracts.length - lastYearContracts.length) /
            lastYearContracts.length) *
          100
        : 0;

    // Calcular taxa atual (contratos do mês atual vs mês anterior)
    const currentMonth = new Date().getMonth();
    const currentYearForMonth = new Date().getFullYear();

    const currentMonthContracts = contracts.filter((contract) => {
      const contractDate = new Date(contract.created_at);
      return (
        contractDate.getMonth() === currentMonth &&
        contractDate.getFullYear() === currentYearForMonth
      );
    });

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear =
      currentMonth === 0 ? currentYearForMonth - 1 : currentYearForMonth;

    const previousMonthContracts = contracts.filter((contract) => {
      const contractDate = new Date(contract.created_at);
      return (
        contractDate.getMonth() === previousMonth &&
        contractDate.getFullYear() === previousMonthYear
      );
    });

    const monthlyVariation =
      previousMonthContracts.length > 0
        ? ((currentMonthContracts.length - previousMonthContracts.length) /
            previousMonthContracts.length) *
          100
        : 0;

    return {
      totalContracts,
      monthlyAverage,
      annualVariation,
      monthlyVariation,
      currentMonthContracts: currentMonthContracts.length,
      previousMonthContracts: previousMonthContracts.length,
    };
  };

  const metrics = calculateMetrics();

  // Dados dos cards de métricas baseados em dados reais
  const metricsCards = [
    {
      title: 'Total de Contratos',
      value: metrics.totalContracts.toString(),
      change: `${metrics.currentMonthContracts} contratos este mês`,
      changeType: 'positive',
      icon: Users,
      iconColor: 'text-blue-600',
    },
    {
      title: 'Média Mensal',
      value: metrics.monthlyAverage.toString(),
      change: `últimos 12 meses`,
      changeType: 'neutral',
      icon: CheckSquare,
      iconColor: 'text-green-600',
    },
    {
      title: 'Variação Anual',
      value: `${metrics.annualVariation >= 0 ? '+' : ''}${metrics.annualVariation.toFixed(1)}%`,
      change: 'em relação ao ano anterior',
      changeType: metrics.annualVariation >= 0 ? 'positive' : 'negative',
      icon: Zap,
      iconColor: 'text-yellow-600',
    },
    {
      title: 'Taxa Mensal',
      value: `${metrics.monthlyVariation >= 0 ? '+' : ''}${metrics.monthlyVariation.toFixed(1)}%`,
      change: 'em relação ao mês anterior',
      changeType: metrics.monthlyVariation >= 0 ? 'positive' : 'negative',
      icon: TrendingUp,
      iconColor: 'text-red-600',
    },
  ];

  // Gerar dados do gráfico baseados nos contratos reais
  const generateChartData = () => {
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const contractsInMonth = contracts.filter((contract) => {
        const contractDate = new Date(contract.created_at);
        return (
          contractDate.getMonth() === index &&
          contractDate.getFullYear() === currentYear
        );
      });

      return {
        month,
        value: contractsInMonth.length,
      };
    });
  };

  const chartData = generateChartData();
  const maxValue = Math.max(...chartData.map((d) => d.value), 1); // Evitar divisão por zero

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Principal
          </h1>
          {loading && (
            <p className="text-sm text-gray-500">Carregando dados...</p>
          )}
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricsCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card key={index} className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-2 rounded-lg ${card.iconColor.replace('text-', 'bg-').replace('-600', '-100')}`}
                    >
                      <IconComponent className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      {card.title}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    <p
                      className={`text-sm ${
                        card.changeType === 'positive'
                          ? 'text-green-600'
                          : card.changeType === 'negative'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {card.change}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gráfico de Barras */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Contratos por Mês ({new Date().getFullYear()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Eixo Y */}
              <div className="flex items-end space-x-2 h-64">
                {/* Labels do eixo Y */}
                <div className="flex flex-col justify-between h-full text-sm text-gray-500 pr-2">
                  <span>250k</span>
                  <span>195k</span>
                  <span>130k</span>
                  <span>65k</span>
                  <span>0k</span>
                </div>

                {/* Barras do gráfico */}
                <div className="flex-1 flex items-end space-x-1">
                  {chartData.map((data, index) => {
                    const height = (data.value / maxValue) * 100;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className="bg-blue-600 w-full rounded-t"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                        <span className="text-xs text-gray-500 mt-2">
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legenda */}
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-sm text-gray-600">Contratos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
