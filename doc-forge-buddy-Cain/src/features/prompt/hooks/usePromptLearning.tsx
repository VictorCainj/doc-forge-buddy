/**
 * Hooks para Sistema de Aprendizado Inteligente de Prompts
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { log } from '@/utils/logger';

// Tipos para o sistema de aprendizado
export interface LearningEvent {
  id?: string;
  userId?: string;
  sessionId: string;
  actionType: 'prompt_created' | 'prompt_used' | 'feedback_given' | 'template_applied';
  promptOriginal?: string;
  promptEnhanced?: string;
  contextData?: Record<string, any>;
  effectivenessScore?: number;
  completionRate?: number;
  timeSpent?: number;
  userSatisfaction?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface PromptPattern {
  id: string;
  patternType: 'context_pattern' | 'user_preference' | 'effectiveness_pattern';
  patternData: Record<string, any>;
  frequency: number;
  effectivenessScore: number;
  userSegment: 'beginner' | 'intermediate' | 'advanced';
  confidenceLevel: number;
  isActive: boolean;
  createdAt: string;
}

export interface EffectivenessAnalysis {
  overall: number;
  breakdown: {
    userSatisfaction: number;
    completionRate: number;
    timeEfficiency: number;
    contextRelevance: number;
  };
  grade: 'Excelente' | 'Muito Bom' | 'Bom' | 'Regular' | 'Precisa Melhorar';
  recommendations: string[];
}

export interface PersonalizedRecommendations {
  promptImprovements: string[];
  templateSuggestions: string[];
  bestPractices: string[];
  skillDevelopment: string[];
  personalizedTips: string[];
}

export interface UserAnalytics {
  totalPrompts: number;
  averageEffectiveness: number;
  averageCompletionRate: number;
  averageSatisfaction: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

export interface LearningPattern {
  mostUsedCategories: Record<string, number>;
  effectivenessTrends: Array<{ date: string; score: number }>;
  commonImprovements: Record<string, number>;
  timePatterns: Record<string, number>;
  userSatisfactionTrend: Array<{ date: string; satisfaction: number }>;
}

/**
 * Hook principal para o sistema de aprendizado
 */
export const usePromptLearning = () => {
  const [sessionId] = useState(() => crypto.randomUUID());

  // Mutação para análise de padrões
  const analyzePatternsMutation = useMutation({
    mutationFn: async ({
      promptData,
      contextData
    }: {
      promptData: {
        original: string;
        enhanced: string;
        context: any;
      };
      contextData: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('prompt-learning', {
        body: {
          action: 'analyze_pattern',
          sessionId,
          promptData,
          contextData
        }
      });

      if (error) throw error;
      return data?.data;
    },
    onError: (error: Error) => {
      log.error('Erro ao analisar padrões:', error);
      toast.error('Erro ao analisar padrões do prompt');
    }
  });

  // Mutação para calcular eficácia
  const calculateEffectivenessMutation = useMutation({
    mutationFn: async ({
      promptData,
      feedbackData
    }: {
      promptData: any;
      feedbackData: {
        userSatisfaction: number;
        completionRate: number;
        timeSpent: number;
        context: any;
      };
    }) => {
      const { data, error } = await supabase.functions.invoke('prompt-learning', {
        body: {
          action: 'calculate_effectiveness',
          sessionId,
          promptData,
          feedbackData
        }
      });

      if (error) throw error;
      return data?.data as EffectivenessAnalysis;
    },
    onError: (error: Error) => {
      log.error('Erro ao calcular eficácia:', error);
      toast.error('Erro ao calcular score de eficácia');
    }
  });

  // Mutação para registrar evento de aprendizado
  const logLearningEventMutation = useMutation({
    mutationFn: async (event: LearningEvent) => {
      const { data, error } = await supabase.functions.invoke('prompt-learning', {
        body: {
          action: 'log_learning_event',
          sessionId,
          promptData: {
            actionType: event.actionType,
            original: event.promptOriginal,
            enhanced: event.promptEnhanced,
            effectivenessScore: event.effectivenessScore,
            completionRate: event.completionRate,
            timeSpent: event.timeSpent,
            userSatisfaction: event.userSatisfaction,
            tags: event.tags,
            metadata: event.metadata
          },
          contextData: event.contextData,
          userId: event.userId
        }
      });

      if (error) throw error;
      return data?.data;
    },
    onError: (error: Error) => {
      log.error('Erro ao registrar evento de aprendizado:', error);
    }
  });

  // Query para recomendações personalizadas
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['prompt-recommendations'],
    queryFn: async (): Promise<PersonalizedRecommendations> => {
      const { data, error } = await supabase.functions.invoke('prompt-learning', {
        body: {
          action: 'generate_recommendations'
        }
      });

      if (error) throw error;
      return data?.data;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 60000 // Considerar válido por 1 minuto
  });

  // Query para padrões identificados
  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['prompt-patterns'],
    queryFn: async (): Promise<PromptPattern[]> => {
      const { data, error } = await supabase
        .from('prompt_patterns')
        .select('*')
        .eq('is_active', true)
        .order('effectiveness_score', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000 // Atualizar a cada minuto
  });

  // Função para registrar evento rapidamente
  const logEvent = useCallback(async (eventData: Omit<LearningEvent, 'sessionId'>) => {
    await logLearningEventMutation.mutateAsync({
      ...eventData,
      sessionId
    });
  }, [sessionId, logLearningEventMutation]);

  // Função para analisar prompt
  const analyzePrompt = useCallback(async (
    original: string,
    enhanced: string,
    context: any
  ) => {
    return await analyzePatternsMutation.mutateAsync({
      promptData: { original, enhanced, context },
      contextData: {}
    });
  }, [analyzePatternsMutation]);

  // Função para calcular eficácia
  const calculateEffectiveness = useCallback(async (
    promptData: any,
    feedback: {
      userSatisfaction: number;
      completionRate: number;
      timeSpent: number;
      context: any;
    }
  ) => {
    return await calculateEffectivenessMutation.mutateAsync({
      promptData,
      feedbackData: feedback
    });
  }, [calculateEffectivenessMutation]);

  return {
    // Estado das mutações
    isAnalyzing: analyzePatternsMutation.isPending,
    isCalculating: calculateEffectivenessMutation.isPending,
    isLogging: logLearningEventMutation.isPending,

    // Dados
    recommendations,
    patterns,

    // Funções
    logEvent,
    analyzePrompt,
    calculateEffectiveness,

    // Estados de carregamento
    isRecommendationsLoading: recommendationsLoading,
    isPatternsLoading: patternsLoading
  };
};

/**
 * Hook para analytics de prompts
 */
export const usePromptAnalytics = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    end: new Date().toISOString().split('T')[0] // hoje
  });

  // Query para heatmap de eficácia
  const { data: heatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ['prompt-heatmap', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('prompt-analytics', {
        body: {
          action: 'generate_heatmap',
          dateRange
        }
      });

      if (error) throw error;
      return data?.data;
    },
    enabled: dateRange.start && dateRange.end
  });

  // Query para comparação com benchmarks
  const { data: benchmarkComparison, isLoading: benchmarkLoading } = useQuery({
    queryKey: ['prompt-benchmarks', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('prompt-analytics', {
        body: {
          action: 'get_benchmark_comparison',
          dateRange
        }
      });

      if (error) throw error;
      return data?.data;
    },
    enabled: dateRange.start && dateRange.end
  });

  // Query para análise de tendências
  const { data: trendAnalysis, isLoading: trendLoading } = useQuery({
    queryKey: ['prompt-trends', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('prompt-analytics', {
        body: {
          action: 'get_trend_analysis',
          dateRange
        }
      });

      if (error) throw error;
      return data?.data;
    },
    enabled: dateRange.start && dateRange.end
  });

  // Query para performance de prompts
  const { data: promptPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['prompt-performance', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('prompt-analytics', {
        body: {
          action: 'get_prompt_performance',
          dateRange
        }
      });

      if (error) throw error;
      return data?.data;
    },
    enabled: dateRange.start && dateRange.end
  });

  // Query para dashboard completo
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['prompt-dashboard', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('prompt-analytics', {
        body: {
          action: 'get_analytics_dashboard',
          dateRange
        }
      });

      if (error) throw error;
      return data?.data;
    },
    enabled: dateRange.start && dateRange.end
  });

  // Mutação para gerar relatório
  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const { data, error } = await supabase.functions.invoke('prompt-analytics', {
        body: {
          action: 'generate_report',
          dateRange,
          reportType
        }
      });

      if (error) throw error;
      return data?.data;
    },
    onSuccess: (data) => {
      toast.success('Relatório gerado com sucesso!');
      return data;
    },
    onError: (error: Error) => {
      log.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    }
  });

  const generateReport = useCallback((reportType: string) => {
    generateReportMutation.mutate(reportType);
  }, [generateReportMutation]);

  const updateDateRange = useCallback((newRange: { start: string; end: string }) => {
    setDateRange(newRange);
  }, []);

  return {
    // Estado
    dateRange,
    
    // Dados
    heatmap,
    benchmarkComparison,
    trendAnalysis,
    promptPerformance,
    dashboard,

    // Funções
    generateReport,
    updateDateRange,

    // Estados de carregamento
    isHeatmapLoading: heatmapLoading,
    isBenchmarkLoading: benchmarkLoading,
    isTrendLoading: trendLoading,
    isPerformanceLoading: performanceLoading,
    isDashboardLoading: dashboardLoading,
    isGeneratingReport: generateReportMutation.isPending
  };
};

/**
 * Hook para aprendizado automático baseado em feedback
 */
export const useAdaptiveLearning = () => {
  const { logEvent, calculateEffectiveness } = usePromptLearning();

  // Sistema de feedback automático
  const provideFeedback = useCallback(async (
    promptId: string,
    originalPrompt: string,
    enhancedPrompt: string,
    context: any,
    result: any,
    timeSpent: number
  ) => {
    try {
      // Análise automática do resultado
      const effectiveness = analyzeResultQuality(result);
      const satisfaction = inferSatisfaction(result, effectiveness);
      const completionRate = assessCompletion(result);

      // Registrar evento de feedback
      await logEvent({
        actionType: 'feedback_given',
        promptOriginal: originalPrompt,
        promptEnhanced: enhancedPrompt,
        contextData: { promptId, result, timeSpent },
        effectivenessScore: effectiveness,
        completionRate,
        userSatisfaction: satisfaction,
        timeSpent,
        tags: extractTags(enhancedPrompt, context)
      });

      // Calcular eficácia detalhada
      const detailedAnalysis = await calculateEffectiveness(
        { original: originalPrompt, enhanced: enhancedPrompt, context },
        {
          userSatisfaction: satisfaction,
          completionRate,
          timeSpent,
          context
        }
      );

      return detailedAnalysis;
    } catch (error) {
      log.error('Erro no aprendizado adaptativo:', error);
      return null;
    }
  }, [logEvent, calculateEffectiveness]);

  // Sistema de recomendação em tempo real
  const getRealTimeRecommendations = useCallback(async (
    currentPrompt: string,
    context: any
  ) => {
    // Buscar padrões similares no histórico
    const similarPatterns = await findSimilarPatterns(currentPrompt, context);
    
    // Gerar recomendações baseadas nos padrões
    const recommendations = await generateRealTimeRecommendations(
      currentPrompt,
      similarPatterns,
      context
    );

    return recommendations;
  }, []);

  return {
    provideFeedback,
    getRealTimeRecommendations
  };
};

// Funções auxiliares

function analyzeResultQuality(result: any): number {
  // Algoritmo simplificado para analisar qualidade do resultado
  let score = 0.5; // Score base

  // Critérios de qualidade
  if (result && typeof result === 'object') {
    // Verificar completude
    if (result.completeness === 'high') score += 0.2;
    else if (result.completeness === 'medium') score += 0.1;

    // Verificar relevância
    if (result.relevance === 'high') score += 0.2;
    else if (result.relevance === 'medium') score += 0.1;

    // Verificar clareza
    if (result.clarity === 'high') score += 0.1;
  }

  return Math.min(Math.max(score, 0), 1);
}

function inferSatisfaction(result: any, effectiveness: number): number {
  // Inferir satisfação baseado na qualidade do resultado
  if (effectiveness >= 0.8) return 5;
  if (effectiveness >= 0.6) return 4;
  if (effectiveness >= 0.4) return 3;
  if (effectiveness >= 0.2) return 2;
  return 1;
}

function assessCompletion(result: any): number {
  // Avaliar taxa de completude da tarefa
  if (result && typeof result === 'object') {
    if (result.isComplete === true) return 1.0;
    if (result.progress) return Math.min(result.progress / 100, 1.0);
  }
  return 0.5; // Valor padrão
}

function extractTags(prompt: string, context: any): string[] {
  const tags: string[] = [];

  // Extrair tags baseadas em palavras-chave
  const keywords = {
    'análise': ['analise', 'analisar', 'examinar', 'avaliar'],
    'criação': ['criar', 'gerar', 'produzir', 'construir'],
    'otimização': ['otimizar', 'melhorar', 'aperfeiçar'],
    'escrita': ['escrever', 'redigir', 'compor'],
    'programação': ['programar', 'codificar', 'desenvolver']
  };

  const promptLower = prompt.toLowerCase();
  
  Object.entries(keywords).forEach(([tag, words]) => {
    if (words.some(word => promptLower.includes(word))) {
      tags.push(tag);
    }
  });

  // Adicionar tags do contexto
  if (context?.category) tags.push(context.category);
  if (context?.type) tags.push(context.type);

  return [...new Set(tags)]; // Remover duplicatas
}

async function findSimilarPatterns(prompt: string, context: any) {
  // Buscar padrões similares no histórico do usuário
  const { data, error } = await supabase
    .from('prompt_learning_events')
    .select('*')
    .not('prompt_enhanced', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    log.error('Erro ao buscar padrões similares:', error);
    return [];
  }

  // Análise de similaridade (simplificada)
  const similar = (data || []).filter(event => {
    if (!event.prompt_enhanced) return false;
    
    const similarity = calculateSimilarity(prompt, event.prompt_enhanced);
    return similarity > 0.3; // Threshold de similaridade
  });

  return similar;
}

function calculateSimilarity(str1: string, str2: string): number {
  // Algoritmo simples de similaridade (Jaccard)
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

async function generateRealTimeRecommendations(
  currentPrompt: string,
  similarPatterns: any[],
  context: any
) {
  const recommendations: string[] = [];

  // Análise do prompt atual
  const currentLength = currentPrompt.length;
  const currentComplexity = analyzeComplexity(currentPrompt);

  // Recomendações baseadas em padrões similares
  if (similarPatterns.length > 0) {
    const avgEffectiveness = similarPatterns.reduce((sum, p) => 
      sum + (p.effectiveness_score || 0), 0
    ) / similarPatterns.length;

    if (avgEffectiveness > 0.8) {
      recommendations.push('Este tipo de prompt tem alta eficácia. Continue assim!');
    } else if (avgEffectiveness < 0.6) {
      recommendations.push('Considere adicionar mais contexto específico para melhorar a eficácia');
    }

    // Análise de estrutura
    const avgLength = similarPatterns.reduce((sum, p) => 
      sum + (p.prompt_enhanced?.length || 0), 0
    ) / similarPatterns.length;

    if (currentLength < avgLength * 0.8) {
      recommendations.push('Sujeitas similares tendem a ser mais detalhadas. Considere expandir');
    } else if (currentLength > avgLength * 1.2) {
      recommendations.push('Este prompt está mais longo que o usual. Pode estar muito detalhado');
    }
  }

  // Recomendações baseadas em análise de complexidade
  if (currentComplexity === 'low') {
    recommendations.push('Considere adicionar mais exemplos para aumentar a clareza');
  } else if (currentComplexity === 'high') {
    recommendations.push('Prompt complexo detectado. Verifique se todas as instruções são necessárias');
  }

  return recommendations;
}

function analyzeComplexity(prompt: string): 'low' | 'medium' | 'high' {
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = prompt.split(/\s+/).length / sentences.length;
  
  if (avgWordsPerSentence < 10) return 'low';
  if (avgWordsPerSentence < 20) return 'medium';
  return 'high';
}