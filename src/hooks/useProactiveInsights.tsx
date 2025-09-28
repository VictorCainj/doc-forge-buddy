import { useState, useEffect, useCallback } from 'react';
import { CompleteContractData } from './useCompleteContractData';
import { useAIMemory } from './useAIMemory';
import { useAdvancedAnalytics } from './useAdvancedAnalytics';

export interface ProactiveAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionable: boolean;
  action?: string;
  data?: Record<string, unknown>;
  createdAt: Date;
  expiresAt?: Date;
  dismissed: boolean;
  category: 'contract' | 'performance' | 'opportunity' | 'risk' | 'system';
}

export interface InsightRecommendation {
  id: string;
  type: 'optimization' | 'strategy' | 'action' | 'analysis';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
  data: Record<string, unknown>;
  confidence: number;
}

export interface PredictiveInsight {
  id: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  factors: string[];
  recommendations: string[];
  impact: 'positive' | 'negative' | 'neutral';
}

interface UseProactiveInsightsReturn {
  alerts: ProactiveAlert[];
  recommendations: InsightRecommendation[];
  predictions: PredictiveInsight[];
  isLoading: boolean;
  error: string | null;
  refreshInsights: () => Promise<void>;
  dismissAlert: (alertId: string) => void;
  executeRecommendation: (recommendationId: string) => Promise<void>;
  getPersonalizedInsights: () => Promise<ProactiveAlert[]>;
  generatePredictiveAnalysis: () => Promise<PredictiveInsight[]>;
  exportInsights: () => string;
}

export const useProactiveInsights = (
  contracts: CompleteContractData[]
): UseProactiveInsightsReturn => {
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [recommendations, setRecommendations] = useState<
    InsightRecommendation[]
  >([]);
  const [predictions, setPredictions] = useState<PredictiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { memory, rememberInsight } = useAIMemory();
  const { metrics, insights: _analyticsInsights } =
    useAdvancedAnalytics(contracts);

  // Gerar alertas proativos (apenas dados reais)
  const generateProactiveAlerts = useCallback((): ProactiveAlert[] => {
    const alerts: ProactiveAlert[] = [];
    const now = new Date();

    // Alertas de contratos expirando (dados reais)
    const expiringContracts = contracts.filter((contract) => {
      const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
      const daysUntilExpiry =
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    if (expiringContracts.length > 0) {
      const criticalExpiring = expiringContracts.filter((contract) => {
        const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
        const daysUntilExpiry =
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 7;
      });

      if (criticalExpiring.length > 0) {
        alerts.push({
          id: 'critical_expiring_contracts',
          type: 'error',
          priority: 'critical',
          title: `${criticalExpiring.length} Contrato(s) Expirando em 7 Dias`,
          description: `${criticalExpiring.length} contrato(s) expiram nos próximos 7 dias. Ação imediata necessária.`,
          actionable: true,
          action: 'Processar renovações ou desocupações imediatamente',
          data: criticalExpiring,
          createdAt: now,
          category: 'contract',
        });
      } else {
        alerts.push({
          id: 'expiring_contracts_warning',
          type: 'warning',
          priority: 'high',
          title: `${expiringContracts.length} Contrato(s) Expirando em 30 Dias`,
          description: `${expiringContracts.length} contrato(s) expiram nos próximos 30 dias. Considere iniciar o processo de renovação.`,
          actionable: true,
          action: 'Iniciar processo de renovação',
          data: expiringContracts,
          createdAt: now,
          category: 'contract',
        });
      }
    }

    // Alertas de performance (apenas dados reais)
    if (metrics) {
      const occupationRate =
        (metrics.activeContracts / metrics.totalContracts) * 100;

      if (occupationRate < 80) {
        alerts.push({
          id: 'low_occupation_rate',
          type: 'warning',
          priority: 'medium',
          title: 'Taxa de Ocupação Baixa',
          description: `Taxa de ocupação atual: ${occupationRate.toFixed(1)}%.`,
          actionable: true,
          action: 'Verificar contratos ativos',
          data: { occupationRate, targetRate: 90 },
          createdAt: now,
          category: 'performance',
        });
      }

      if (metrics.expiringContracts > metrics.totalContracts * 0.3) {
        alerts.push({
          id: 'high_expiry_rate',
          type: 'info',
          priority: 'medium',
          title: 'Alta Concentração de Contratos Expirando',
          description: `${((metrics.expiringContracts / metrics.totalContracts) * 100).toFixed(1)}% dos contratos expiram em 30 dias.`,
          actionable: true,
          action: 'Desenvolver estratégias de retenção',
          data: {
            expiryRate: metrics.expiringContracts / metrics.totalContracts,
          },
          createdAt: now,
          category: 'performance',
        });
      }
    }

    // Alertas de oportunidades (removidos - dados fictícios)
    // const highValueContracts = contracts.filter((contract) => {
    //   const address = contract.form_data.enderecoImovel || '';
    //   return (
    //     address.toLowerCase().includes('centro') ||
    //     address.toLowerCase().includes('comercial') ||
    //     address.toLowerCase().includes('shopping')
    //   );
    // });

    // Alertas baseados em padrões de uso
    if (memory) {
      const _recentTopics = memory.context.recentTopics;
      const commonQuestions = memory.patterns.commonQuestions;

      if (commonQuestions.length > 0) {
        const mostFrequentQuestion = commonQuestions.sort(
          (a, b) => b.frequency - a.frequency
        )[0];

        if (mostFrequentQuestion.frequency > 5) {
          alerts.push({
            id: 'frequent_question_pattern',
            type: 'info',
            priority: 'low',
            title: 'Padrão de Perguntas Frequentes',
            description: `"${mostFrequentQuestion.question}" é uma pergunta comum. Considere criar documentação ou FAQ.`,
            actionable: true,
            action: 'Criar documentação para pergunta frequente',
            data: {
              question: mostFrequentQuestion.question,
              frequency: mostFrequentQuestion.frequency,
            },
            createdAt: now,
            category: 'system',
          });
        }
      }
    }

    return alerts;
  }, [contracts, metrics, memory]);

  // Gerar recomendações inteligentes (apenas dados reais)
  const generateRecommendations = useCallback((): InsightRecommendation[] => {
    const recommendations: InsightRecommendation[] = [];

    if (!metrics) return recommendations;

    // Recomendação de estratégia de retenção (dados reais)
    if (metrics.expiringContracts > 0) {
      recommendations.push({
        id: 'retention_strategy',
        type: 'strategy',
        title: 'Estratégia de Retenção de Clientes',
        description:
          'Desenvolver programa de retenção para contratos próximos ao vencimento.',
        impact: 'high',
        effort: 'high',
        timeframe: 'medium',
        data: { expiringCount: metrics.expiringContracts },
        confidence: 0.8,
      });
    }

    // Recomendação de análise de mercado (dados reais)
    if (metrics.totalContracts > 10) {
      recommendations.push({
        id: 'market_analysis',
        type: 'analysis',
        title: 'Análise de Mercado Detalhada',
        description:
          'Realizar análise completa do mercado com base nos dados acumulados.',
        impact: 'medium',
        effort: 'low',
        timeframe: 'immediate',
        data: { contractCount: metrics.totalContracts },
        confidence: 0.95,
      });
    }

    // Recomendação de automação
    if (metrics.totalContracts > 20) {
      recommendations.push({
        id: 'automation_opportunity',
        type: 'optimization',
        title: 'Automatizar Processos Repetitivos',
        description:
          'Implementar automação para processos que se repetem frequentemente.',
        impact: 'high',
        effort: 'high',
        timeframe: 'long',
        data: { processCount: metrics.totalContracts },
        confidence: 0.7,
      });
    }

    return recommendations;
  }, [metrics]);

  // Gerar previsões (removidas - dados fictícios)
  const generatePredictiveInsights = useCallback((): PredictiveInsight[] => {
    const predictions: PredictiveInsight[] = [];

    // Previsões removidas - não temos dados reais suficientes
    // if (!metrics) return predictions;

    // const growthTrend = 0;
    // const expiryRisk = 0;

    return predictions;
  }, []);

  // Atualizar insights
  const refreshInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newAlerts = generateProactiveAlerts();
      const newRecommendations = generateRecommendations();
      const newPredictions = generatePredictiveInsights();

      setAlerts(newAlerts);
      setRecommendations(newRecommendations);
      setPredictions(newPredictions);

      // Salvar insights na memória da IA
      newAlerts.forEach((alert) => {
        if (alert.type === 'opportunity' || alert.priority === 'high') {
          rememberInsight(
            `${alert.title}: ${alert.description}`,
            0.8,
            'proactive_analysis'
          );
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar insights');
    } finally {
      setIsLoading(false);
    }
  }, [
    generateProactiveAlerts,
    generateRecommendations,
    generatePredictiveInsights,
    rememberInsight,
  ]);

  // Dispensar alerta
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      )
    );
  }, []);

  // Executar recomendação
  const executeRecommendation = useCallback(
    async (recommendationId: string) => {
      const recommendation = recommendations.find(
        (r) => r.id === recommendationId
      );
      if (!recommendation) return;

      // Simular execução da recomendação
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Remover da lista de recomendações
      setRecommendations((prev) =>
        prev.filter((r) => r.id !== recommendationId)
      );

      // Salvar na memória
      rememberInsight(
        `Recomendação executada: ${recommendation.title}`,
        1.0,
        'user_action'
      );
    },
    [recommendations, rememberInsight]
  );

  // Obter insights personalizados
  const getPersonalizedInsights = useCallback(async (): Promise<
    ProactiveAlert[]
  > => {
    if (!memory) return [];

    const personalizedAlerts: ProactiveAlert[] = [];

    // Insights baseados nas preferências do usuário
    if (memory.preferences.favoriteTopics.includes('análise')) {
      personalizedAlerts.push({
        id: 'personalized_analysis_offer',
        type: 'info',
        priority: 'low',
        title: 'Análise Personalizada Disponível',
        description:
          'Com base no seu interesse em análises, posso gerar um relatório detalhado dos seus contratos.',
        actionable: true,
        action: 'Gerar análise personalizada',
        createdAt: new Date(),
        category: 'opportunity',
      });
    }

    // Insights baseados no horário de trabalho
    const currentHour = new Date().getHours();
    const workStart = parseInt(
      memory.patterns.workingHours.start.split(':')[0]
    );
    const workEnd = parseInt(memory.patterns.workingHours.end.split(':')[0]);

    if (currentHour >= workStart && currentHour <= workEnd) {
      personalizedAlerts.push({
        id: 'work_hours_optimization',
        type: 'info',
        priority: 'low',
        title: 'Horário de Trabalho Otimizado',
        description:
          'Você está no seu horário de trabalho preferido. Este é um bom momento para tarefas importantes.',
        actionable: false,
        createdAt: new Date(),
        category: 'system',
      });
    }

    return personalizedAlerts;
  }, [memory]);

  // Gerar análise preditiva
  const generatePredictiveAnalysis = useCallback(async (): Promise<
    PredictiveInsight[]
  > => {
    return generatePredictiveInsights();
  }, [generatePredictiveInsights]);

  // Exportar insights
  const exportInsights = useCallback((): string => {
    return JSON.stringify(
      {
        alerts: alerts.filter((a) => !a.dismissed),
        recommendations,
        predictions,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [alerts, recommendations, predictions]);

  // Atualizar insights quando contratos mudarem
  useEffect(() => {
    if (contracts.length > 0) {
      refreshInsights();
    }
  }, [contracts, refreshInsights]);

  return {
    alerts: alerts.filter((a) => !a.dismissed),
    recommendations,
    predictions,
    isLoading,
    error,
    refreshInsights,
    dismissAlert,
    executeRecommendation,
    getPersonalizedInsights,
    generatePredictiveAnalysis,
    exportInsights,
  };
};
