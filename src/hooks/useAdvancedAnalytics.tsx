import { useState, useEffect, useCallback } from 'react';
import { CompleteContractData } from './useCompleteContractData';

export interface AnalyticsMetrics {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  recentContracts: number;
  averageContractDuration: number;
  topLocations: Array<{ location: string; count: number }>;
  monthlyTrends: Array<{ month: string; count: number }>;
  riskAssessment: {
    high: number;
    medium: number;
    low: number;
  };
  contractTypes: Array<{ type: string; count: number }>;
  performance: {
    responseTime: number;
    satisfaction: number;
    efficiency: number;
  };
}

export interface ContractInsight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: string;
  data?: any;
}

export interface TrendAnalysis {
  period: string;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  insights: string[];
  predictions: string[];
}

interface UseAdvancedAnalyticsReturn {
  metrics: AnalyticsMetrics | null;
  insights: ContractInsight[];
  trends: TrendAnalysis[];
  isLoading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
  getContractInsights: (contractId: string) => ContractInsight[];
  getPredictiveInsights: () => Promise<ContractInsight[]>;
  generateReport: (type: 'summary' | 'detailed' | 'executive') => string;
  exportAnalytics: () => string;
}

export const useAdvancedAnalytics = (
  contracts: CompleteContractData[]
): UseAdvancedAnalyticsReturn => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [insights, setInsights] = useState<ContractInsight[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular métricas básicas
  const calculateMetrics = useCallback((): AnalyticsMetrics => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Contratos ativos (não expirados)
    const activeContracts = contracts.filter((contract) => {
      const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
      return endDate > now;
    }).length;

    // Contratos expirando em 30 dias
    const expiringContracts = contracts.filter((contract) => {
      const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      return endDate > now && endDate <= thirtyDaysFromNow;
    }).length;

    // Contratos recentes (últimos 30 dias)
    const recentContracts = contracts.filter((contract) => {
      const createdDate = new Date(contract.created_at);
      return createdDate >= thirtyDaysAgo;
    }).length;

    // Duração média dos contratos
    const contractDurations = contracts
      .map((contract) => {
        const startDate = new Date(
          contract.form_data.dataInicioRescisao || contract.created_at
        );
        const endDate = new Date(contract.form_data.dataTerminoRescisao || now);
        return (
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      })
      .filter((duration) => duration > 0);

    const averageContractDuration =
      contractDurations.length > 0
        ? contractDurations.reduce((sum, duration) => sum + duration, 0) /
          contractDurations.length
        : 0;

    // Top localizações
    const locationCount: { [key: string]: number } = {};
    contracts.forEach((contract) => {
      const address = contract.form_data.enderecoImovel || '';
      if (address) {
        // Extrair bairro/cidade do endereço
        const parts = address.split(',');
        const location = parts.length > 1 ? parts[1].trim() : address;
        locationCount[location] = (locationCount[location] || 0) + 1;
      }
    });

    const topLocations = Object.entries(locationCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // Tendências mensais (últimos 6 meses)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      });

      const monthContracts = contracts.filter((contract) => {
        const contractDate = new Date(contract.created_at);
        return (
          contractDate.getMonth() === monthDate.getMonth() &&
          contractDate.getFullYear() === monthDate.getFullYear()
        );
      }).length;

      monthlyTrends.push({ month: monthName, count: monthContracts });
    }

    // Análise de risco
    const riskAssessment = {
      high: contracts.filter((contract) => {
        const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
        const daysUntilExpiry =
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry < 15;
      }).length,
      medium: contracts.filter((contract) => {
        const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
        const daysUntilExpiry =
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry >= 15 && daysUntilExpiry <= 30;
      }).length,
      low: contracts.filter((contract) => {
        const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
        const daysUntilExpiry =
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry > 30;
      }).length,
    };

    // Tipos de contrato (baseado em características)
    const contractTypes = [
      {
        type: 'Residencial',
        count: contracts.filter(
          (c) =>
            !c.form_data.enderecoImovel?.toLowerCase().includes('comercial')
        ).length,
      },
      {
        type: 'Comercial',
        count: contracts.filter((c) =>
          c.form_data.enderecoImovel?.toLowerCase().includes('comercial')
        ).length,
      },
      {
        type: 'Com Documentos',
        count: contracts.filter((c) => c.form_data.solicitarCND === 'sim')
          .length,
      },
      {
        type: 'Com Chaves',
        count: contracts.filter(
          (c) => c.form_data.incluirQuantidadeChaves === 'sim'
        ).length,
      },
    ];

    return {
      totalContracts: contracts.length,
      activeContracts,
      expiringContracts,
      recentContracts,
      averageContractDuration: Math.round(averageContractDuration),
      topLocations,
      monthlyTrends,
      riskAssessment,
      contractTypes,
      performance: {
        responseTime: 2.1, // Simulado
        satisfaction: 4.7,
        efficiency: 87,
      },
    };
  }, [contracts]);

  // Gerar insights automáticos
  const generateInsights = useCallback((): ContractInsight[] => {
    const insights: ContractInsight[] = [];
    const now = new Date();

    // Insights de contratos expirando
    const expiringSoon = contracts.filter((contract) => {
      const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
      const daysUntilExpiry =
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    });

    if (expiringSoon.length > 0) {
      insights.push({
        id: 'expiring_contracts',
        type: 'warning',
        title: `${expiringSoon.length} Contrato(s) Expirando em 7 Dias`,
        description: `${expiringSoon.length} contrato(s) expiram nos próximos 7 dias. Considere renovar ou preparar para desocupação.`,
        priority: 'high',
        actionable: true,
        action: 'Verificar contratos expirando',
        data: expiringSoon,
      });
    }

    // Insights de crescimento
    const lastMonth = contracts.filter((contract) => {
      const contractDate = new Date(contract.created_at);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return contractDate >= thirtyDaysAgo;
    }).length;

    const previousMonth = contracts.filter((contract) => {
      const contractDate = new Date(contract.created_at);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return contractDate >= sixtyDaysAgo && contractDate < thirtyDaysAgo;
    }).length;

    if (lastMonth > previousMonth) {
      const growth = ((lastMonth - previousMonth) / previousMonth) * 100;
      insights.push({
        id: 'growth_positive',
        type: 'success',
        title: `Crescimento de ${growth.toFixed(1)}% nos Contratos`,
        description: `Crescimento positivo de ${growth.toFixed(1)}% no número de contratos no último mês.`,
        priority: 'medium',
        actionable: false,
      });
    }

    // Insights de localização
    const locationCount: { [key: string]: number } = {};
    contracts.forEach((contract) => {
      const address = contract.form_data.enderecoImovel || '';
      if (address) {
        const parts = address.split(',');
        const location = parts.length > 1 ? parts[1].trim() : address;
        locationCount[location] = (locationCount[location] || 0) + 1;
      }
    });

    const topLocation = Object.entries(locationCount).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (topLocation && topLocation[1] > 3) {
      insights.push({
        id: 'top_location',
        type: 'info',
        title: `Concentração em ${topLocation[0]}`,
        description: `${topLocation[1]} contratos concentrados em ${topLocation[0]}. Considere estratégias específicas para esta região.`,
        priority: 'low',
        actionable: true,
        action: 'Analisar estratégia regional',
      });
    }

    // Insights de documentos
    const contractsWithDocuments = contracts.filter(
      (c) =>
        c.form_data.solicitarCND === 'sim' ||
        c.form_data.solicitarCondominio === 'sim'
    ).length;

    if (contractsWithDocuments > 0) {
      const percentage = (contractsWithDocuments / contracts.length) * 100;
      insights.push({
        id: 'document_compliance',
        type: 'info',
        title: `${percentage.toFixed(1)}% dos Contratos com Documentos`,
        description: `${contractsWithDocuments} de ${contracts.length} contratos requerem documentação adicional.`,
        priority: 'low',
        actionable: false,
      });
    }

    return insights;
  }, [contracts]);

  // Análise de tendências
  const analyzeTrends = useCallback((): TrendAnalysis[] => {
    const trends: TrendAnalysis[] = [];
    const now = new Date();

    // Tendência mensal
    const currentMonth = contracts.filter((contract) => {
      const contractDate = new Date(contract.created_at);
      return (
        contractDate.getMonth() === now.getMonth() &&
        contractDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const lastMonth = contracts.filter((contract) => {
      const contractDate = new Date(contract.created_at);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        contractDate.getMonth() === lastMonthDate.getMonth() &&
        contractDate.getFullYear() === lastMonthDate.getFullYear()
      );
    }).length;

    const growth =
      lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;

    trends.push({
      period: 'Mensal',
      growth,
      trend: growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable',
      insights: [
        growth > 0
          ? `Crescimento de ${growth.toFixed(1)}% em relação ao mês anterior`
          : growth < 0
            ? `Declínio de ${Math.abs(growth).toFixed(1)}% em relação ao mês anterior`
            : 'Estabilidade no número de contratos',
      ],
      predictions: [
        growth > 0
          ? 'Tendência de crescimento sustentada'
          : growth < 0
            ? 'Possível necessidade de estratégias de retenção'
            : 'Manter estratégias atuais',
      ],
    });

    return trends;
  }, [contracts]);

  // Atualizar analytics
  const refreshAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newMetrics = calculateMetrics();
      const newInsights = generateInsights();
      const newTrends = analyzeTrends();

      setMetrics(newMetrics);
      setInsights(newInsights);
      setTrends(newTrends);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao calcular analytics'
      );
    } finally {
      setIsLoading(false);
    }
  }, [calculateMetrics, generateInsights, analyzeTrends]);

  // Obter insights de contrato específico
  const getContractInsights = useCallback(
    (contractId: string): ContractInsight[] => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return [];

      const insights: ContractInsight[] = [];
      const now = new Date();

      // Verificar expiração
      const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
      const daysUntilExpiry =
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
        insights.push({
          id: `contract_${contractId}_expiry`,
          type: daysUntilExpiry <= 7 ? 'warning' : 'info',
          title: `Contrato Expira em ${Math.ceil(daysUntilExpiry)} Dias`,
          description: `Este contrato expira em ${Math.ceil(daysUntilExpiry)} dias. ${daysUntilExpiry <= 7 ? 'Ação imediata necessária.' : 'Considere preparar renovação ou desocupação.'}`,
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
          actionable: true,
          action: 'Preparar processo de renovação/desocupação',
        });
      }

      // Verificar documentação
      if (contract.form_data.solicitarCND === 'sim') {
        insights.push({
          id: `contract_${contractId}_documents`,
          type: 'info',
          title: 'Documentação Adicional Requerida',
          description:
            'Este contrato requer Certidão Negativa de Débitos (CND).',
          priority: 'low',
          actionable: true,
          action: 'Solicitar documentação',
        });
      }

      return insights;
    },
    [contracts]
  );

  // Insights preditivos
  const getPredictiveInsights = useCallback(async (): Promise<
    ContractInsight[]
  > => {
    const predictiveInsights: ContractInsight[] = [];

    // Análise de padrões sazonais
    const monthlyData: { [key: number]: number } = {};
    contracts.forEach((contract) => {
      const month = new Date(contract.created_at).getMonth();
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const currentMonth = new Date().getMonth();
    const avgMonthly =
      Object.values(monthlyData).reduce((sum, count) => sum + count, 0) / 12;

    if (monthlyData[currentMonth] < avgMonthly * 0.7) {
      predictiveInsights.push({
        id: 'seasonal_dip',
        type: 'info',
        title: 'Possível Baixa Sazonal',
        description: `Este mês está ${(((avgMonthly - monthlyData[currentMonth]) / avgMonthly) * 100).toFixed(1)}% abaixo da média. Considere estratégias de marketing.`,
        priority: 'medium',
        actionable: true,
        action: 'Implementar estratégias de captação',
      });
    }

    return predictiveInsights;
  }, [contracts]);

  // Gerar relatório
  const generateReport = useCallback(
    (type: 'summary' | 'detailed' | 'executive'): string => {
      if (!metrics) return '';

      const report = {
        summary: `
RELATÓRIO RESUMIDO - ${new Date().toLocaleDateString('pt-BR')}

📊 MÉTRICAS PRINCIPAIS:
• Total de Contratos: ${metrics.totalContracts}
• Contratos Ativos: ${metrics.activeContracts}
• Expirando em 30 dias: ${metrics.expiringContracts}
• Novos (30 dias): ${metrics.recentContracts}

⚠️ ALERTAS:
${insights
  .filter((i) => i.priority === 'high')
  .map((i) => `• ${i.title}`)
  .join('\n')}

📈 TENDÊNCIAS:
${trends.map((t) => `• ${t.period}: ${t.growth > 0 ? '+' : ''}${t.growth.toFixed(1)}%`).join('\n')}
      `,

        detailed: `
RELATÓRIO DETALHADO - ${new Date().toLocaleDateString('pt-BR')}

📊 MÉTRICAS COMPLETAS:
• Total de Contratos: ${metrics.totalContracts}
• Contratos Ativos: ${metrics.activeContracts}
• Contratos Expirando: ${metrics.expiringContracts}
• Contratos Recentes: ${metrics.recentContracts}
• Duração Média: ${metrics.averageContractDuration} dias

📍 TOP LOCALIZAÇÕES:
${metrics.topLocations.map((l) => `• ${l.location}: ${l.count} contratos`).join('\n')}

📈 TENDÊNCIAS MENS рух:
${metrics.monthlyTrends.map((t) => `• ${t.month}: ${t.count} contratos`).join('\n')}

⚠️ INSIGHTS E ALERTAS:
${insights.map((i) => `• [${i.type.toUpperCase()}] ${i.title}: ${i.description}`).join('\n')}
      `,

        executive: `
RELATÓRIO EXECUTIVO - ${new Date().toLocaleDateString('pt-BR')}

RESUMO EXECUTIVO:
O portfólio atual possui ${metrics.totalContracts} contratos ativos, com ${metrics.expiringContracts} expirando nos próximos 30 dias.

PRINCIPAIS INDICADORES:
• Taxa de Ocupação: ${((metrics.activeContracts / metrics.totalContracts) * 100).toFixed(1)}%
• Crescimento Mensal: ${trends[0]?.growth > 0 ? '+' : ''}${trends[0]?.growth.toFixed(1) || 0}%
• Eficiência Operacional: ${metrics.performance.efficiency}%

AÇÕES RECOMENDADAS:
${insights
  .filter((i) => i.actionable)
  .map((i) => `• ${i.action}`)
  .join('\n')}
      `,
      };

      return report[type];
    },
    [metrics, insights, trends]
  );

  // Exportar analytics
  const exportAnalytics = useCallback((): string => {
    return JSON.stringify(
      {
        metrics,
        insights,
        trends,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [metrics, insights, trends]);

  // Atualizar quando contratos mudarem
  useEffect(() => {
    if (contracts.length > 0) {
      refreshAnalytics();
    }
  }, [contracts, refreshAnalytics]);

  return {
    metrics,
    insights,
    trends,
    isLoading,
    error,
    refreshAnalytics,
    getContractInsights,
    getPredictiveInsights,
    generateReport,
    exportAnalytics,
  };
};
