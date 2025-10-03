import { useState, useEffect, useCallback } from 'react';
import { analyzeTextAdvanced } from '@/utils/advancedTextAnalysis';
import { log } from '@/utils/logger';
import { useLocalStorage } from './useLocalStorage';

export interface AIMemory {
  userId: string;
  preferences: UserPreferences;
  patterns: UserPatterns;
  knowledge: KnowledgeBase;
  context: ConversationContext;
  lastUpdated: Date;
}

export interface UserPreferences {
  language: 'pt-BR' | 'en' | 'es';
  formality: 'formal' | 'informal' | 'neutral';
  verbosity: 'concise' | 'detailed' | 'comprehensive';
  responseStyle: 'analytical' | 'conversational' | 'technical';
  favoriteTopics: string[];
  avoidedTopics: string[];
}

export interface UserPatterns {
  commonQuestions: Array<{
    question: string;
    frequency: number;
    lastAsked: Date;
    preferredAnswers: string[];
  }>;
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  usageFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  preferredFeatures: string[];
}

export interface KnowledgeBase {
  contractInsights: Array<{
    insight: string;
    confidence: number;
    source: string;
    createdAt: Date;
  }>;
  documentTemplates: Array<{
    templateId: string;
    usageCount: number;
    successRate: number;
    userFeedback: number;
  }>;
  contextualFacts: Array<{
    fact: string;
    context: string;
    relevance: number;
    verified: boolean;
  }>;
}

export interface ConversationContext {
  currentTopic: string;
  recentTopics: string[];
  sessionGoals: string[];
  pendingActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    completed: boolean;
  }>;
  emotionalState: 'positive' | 'neutral' | 'negative' | 'stressed';
}

interface UseAIMemoryReturn {
  memory: AIMemory | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  learnFromInteraction: (
    question: string,
    answer: string,
    feedback?: number
  ) => Promise<void>;
  getPersonalizedResponse: (
    question: string,
    context: Record<string, unknown>
  ) => Promise<string>;
  getContextualSuggestions: (currentInput: string) => Promise<string[]>;
  rememberInsight: (
    insight: string,
    confidence: number,
    source: string
  ) => void;
  getRelevantInsights: (query: string) => string[];
  updateEmotionalState: (state: ConversationContext['emotionalState']) => void;
  addPendingAction: (
    action: string,
    priority: 'low' | 'medium' | 'high',
    dueDate?: Date
  ) => void;
  completePendingAction: (actionId: string) => void;
  getMemoryInsights: () => {
    personalityProfile: string;
    usagePatterns: string[];
    recommendations: string[];
  };
}

const MEMORY_STORAGE_KEY = 'ai-memory-data';

export const useAIMemory = (userId: string = 'default'): UseAIMemoryReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Criar memória inicial
  const createInitialMemory = useCallback((): AIMemory => ({
    userId,
    preferences: {
      language: 'pt-BR',
      formality: 'neutral',
      verbosity: 'detailed',
      responseStyle: 'conversational',
      favoriteTopics: [],
      avoidedTopics: [],
    },
    patterns: {
      commonQuestions: [],
      workingHours: {
        start: '09:00',
        end: '18:00',
        timezone: 'America/Sao_Paulo',
      },
      usageFrequency: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
      preferredFeatures: [],
    },
    knowledge: {
      contractInsights: [],
      documentTemplates: [],
      contextualFacts: [],
    },
    context: {
      currentTopic: '',
      recentTopics: [],
      sessionGoals: [],
      pendingActions: [],
      emotionalState: 'neutral',
    },
    lastUpdated: new Date(),
  }), [userId]);

  // Usar o hook de localStorage para gerenciar a memória
  const [memory, setMemory] = useLocalStorage<AIMemory>(
    `${MEMORY_STORAGE_KEY}-${userId}`,
    createInitialMemory(),
    {
      deserialize: (value: string) => {
        const parsed = JSON.parse(value);
        return {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
        };
      },
      onError: (error) => {
        setError('Erro ao carregar memória da IA');
        log.error('Erro na memória da IA:', error);
      },
    }
  );

  // Inicializar loading
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Atualizar preferências do usuário
  const updatePreferences = useCallback(
    (newPreferences: Partial<UserPreferences>) => {
      if (!memory) return;

      const updatedMemory = {
        ...memory,
        preferences: { ...memory.preferences, ...newPreferences },
        lastUpdated: new Date(),
      };

      setMemory(updatedMemory);
    },
    [memory, setMemory]
  );

  // Aprender com interações
  const learnFromInteraction = useCallback(
    async (question: string, answer: string, feedback?: number) => {
      if (!memory) return;

      try {
        const analysis = await analyzeTextAdvanced(question);

        // Atualizar perguntas comuns
        if (!memory.patterns.commonQuestions) {
          memory.patterns.commonQuestions = [];
        }

        const existingQuestion = memory.patterns.commonQuestions.find(
          (q) => q.question.toLowerCase() === question.toLowerCase()
        );

        if (existingQuestion) {
          existingQuestion.frequency++;
          existingQuestion.lastAsked = new Date();
          if (feedback !== undefined && feedback > 0) {
            existingQuestion.preferredAnswers.push(answer);
          }
        } else {
          memory.patterns.commonQuestions.push({
            question,
            frequency: 1,
            lastAsked: new Date(),
            preferredAnswers:
              feedback !== undefined && feedback > 0 ? [answer] : [],
          });
        }

        // Atualizar tópicos favoritos baseados na análise
        if (analysis.keywords && analysis.keywords.length > 0) {
          if (!memory.preferences.favoriteTopics) {
            memory.preferences.favoriteTopics = [];
          }
          analysis.keywords.forEach((keyword) => {
            if (!memory.preferences.favoriteTopics.includes(keyword)) {
              memory.preferences.favoriteTopics.push(keyword);
            }
          });
        }

        // Atualizar frequência de uso
        if (!memory.patterns.usageFrequency) {
          memory.patterns.usageFrequency = { daily: 0, weekly: 0, monthly: 0 };
        }
        memory.patterns.usageFrequency.daily++;

        // Limitar histórico de perguntas comuns
        memory.patterns.commonQuestions = memory.patterns.commonQuestions
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 50);

        // Limitar tópicos favoritos
        if (memory.preferences.favoriteTopics) {
          memory.preferences.favoriteTopics =
            memory.preferences.favoriteTopics.slice(0, 20);
        }

        const updatedMemory = {
          ...memory,
          lastUpdated: new Date(),
        };

        setMemory(updatedMemory);
        setMemory(updatedMemory);
      } catch (error) {
        log.error('Erro ao aprender com interação:', error);
      }
    },
    [memory, setMemory]
  );

  // Obter insights relevantes
  const getRelevantInsights = useCallback(
    (query: string): string[] => {
      if (!memory || !memory.knowledge || !memory.knowledge.contractInsights)
        return [];

      try {
        const queryLower = query.toLowerCase();

        return memory.knowledge.contractInsights
          .filter(
            (insight) =>
              insight.insight.toLowerCase().includes(queryLower) ||
              queryLower.includes(insight.insight.toLowerCase())
          )
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3)
          .map((insight) => insight.insight);
      } catch (error) {
        log.error('Erro ao obter insights relevantes:', error);
        return [];
      }
    },
    [memory]
  );

  // Obter resposta personalizada
  const getPersonalizedResponse = useCallback(
    async (
      question: string,
      _context: Record<string, unknown>
    ): Promise<string> => {
      if (!memory) return question;

      try {
        const analysis = await analyzeTextAdvanced(question);

        // Verificar se há pergunta similar no histórico
        let similarQuestion = null;
        if (
          memory.patterns.commonQuestions &&
          memory.patterns.commonQuestions.length > 0
        ) {
          similarQuestion = memory.patterns.commonQuestions.find((q) => {
            const hasFirstKeyword =
              analysis.keywords &&
              analysis.keywords.length > 0 &&
              q.question
                .toLowerCase()
                .includes(analysis.keywords[0]?.toLowerCase() || '');
            const hasAnyKeyword =
              analysis.keywords &&
              analysis.keywords.some((keyword) =>
                q.question.toLowerCase().includes(keyword.toLowerCase())
              );
            return hasFirstKeyword || hasAnyKeyword;
          });
        }

        let personalizedResponse = question;

        // Adaptar resposta baseada nas preferências
        if (memory.preferences && memory.preferences.formality === 'formal') {
          personalizedResponse = `Prezado(a) usuário(a), ${personalizedResponse}`;
        } else if (
          memory.preferences &&
          memory.preferences.formality === 'informal'
        ) {
          personalizedResponse = `Oi! ${personalizedResponse}`;
        }

        // Adicionar contexto baseado no histórico
        if (
          similarQuestion &&
          similarQuestion.preferredAnswers &&
          similarQuestion.preferredAnswers.length > 0
        ) {
          const preferredAnswer = similarQuestion.preferredAnswers[0];
          personalizedResponse += `\n\nBaseado em suas perguntas anteriores, aqui está uma resposta mais detalhada: ${preferredAnswer}`;
        }

        // Adicionar insights relevantes
        const relevantInsights = getRelevantInsights(question);
        if (relevantInsights.length > 0) {
          personalizedResponse += `\n\n💡 Insights relevantes:\n${relevantInsights.join('\n')}`;
        }

        return personalizedResponse;
      } catch (error) {
        log.error('Erro ao gerar resposta personalizada:', error);
        return question;
      }
    },
    [memory, getRelevantInsights]
  );

  // Obter sugestões contextuais
  const getContextualSuggestions = useCallback(
    async (currentInput: string): Promise<string[]> => {
      if (!memory) return [];

      const suggestions: string[] = [];

      try {
        const analysis = await analyzeTextAdvanced(currentInput);

        // Sugestões baseadas em perguntas comuns
        if (
          memory.patterns.commonQuestions &&
          memory.patterns.commonQuestions.length > 0
        ) {
          const relatedQuestions = memory.patterns.commonQuestions
            .filter((q) => {
              const hasFirstKeyword =
                analysis.keywords &&
                analysis.keywords.length > 0 &&
                q.question
                  .toLowerCase()
                  .includes(analysis.keywords[0]?.toLowerCase() || '');
              const hasAnyKeyword =
                analysis.keywords &&
                analysis.keywords.some((keyword) =>
                  q.question.toLowerCase().includes(keyword.toLowerCase())
                );
              return hasFirstKeyword || hasAnyKeyword;
            })
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 3)
            .map((q) => q.question);

          suggestions.push(...relatedQuestions);
        }

        // Sugestões baseadas em tópicos favoritos
        if (
          memory.preferences.favoriteTopics &&
          memory.preferences.favoriteTopics.length > 0
        ) {
          const topicSuggestions = memory.preferences.favoriteTopics
            .filter(
              (topic) =>
                !currentInput.toLowerCase().includes(topic.toLowerCase())
            )
            .slice(0, 2)
            .map((topic) => `Me fale sobre ${topic}`);

          suggestions.push(...topicSuggestions);
        }

        // Sugestões baseadas no contexto atual
        if (memory.context && memory.context.currentTopic) {
          suggestions.push(
            `Continue falando sobre ${memory.context.currentTopic}`
          );
        }
      } catch (error) {
        log.error('Erro ao gerar sugestões contextuais:', error);
      }

      return suggestions;
    },
    [memory]
  );

  // Lembrar insights
  const rememberInsight = useCallback(
    (insight: string, confidence: number, source: string) => {
      if (!memory) return;

      try {
        // Inicializar knowledge se não existir
        if (!memory.knowledge) {
          memory.knowledge = {
            contractInsights: [],
            documentTemplates: [],
            contextualFacts: [],
          };
        }

        // Inicializar contractInsights se não existir
        if (!memory.knowledge.contractInsights) {
          memory.knowledge.contractInsights = [];
        }

        memory.knowledge.contractInsights.push({
          insight,
          confidence,
          source,
          createdAt: new Date(),
        });

        // Limitar número de insights
        memory.knowledge.contractInsights = memory.knowledge.contractInsights
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 100);

        const updatedMemory = {
          ...memory,
          lastUpdated: new Date(),
        };

        setMemory(updatedMemory);
        setMemory(updatedMemory);
      } catch (error) {
        log.error('Erro ao lembrar insight:', error);
      }
    },
    [memory, setMemory]
  );

  // Atualizar estado emocional
  const updateEmotionalState = useCallback(
    (state: ConversationContext['emotionalState']) => {
      if (!memory) return;

      try {
        // Inicializar context se não existir
        if (!memory.context) {
          memory.context = {
            currentTopic: '',
            recentTopics: [],
            sessionGoals: [],
            pendingActions: [],
            emotionalState: 'neutral',
          };
        }

        const updatedMemory = {
          ...memory,
          context: {
            ...memory.context,
            emotionalState: state,
          },
          lastUpdated: new Date(),
        };

        setMemory(updatedMemory);
        setMemory(updatedMemory);
      } catch (error) {
        log.error('Erro ao atualizar estado emocional:', error);
      }
    },
    [memory, setMemory]
  );

  // Adicionar ação pendente
  const addPendingAction = useCallback(
    (action: string, priority: 'low' | 'medium' | 'high', dueDate?: Date) => {
      if (!memory) return;

      try {
        if (!memory.context) {
          memory.context = {
            currentTopic: '',
            recentTopics: [],
            sessionGoals: [],
            pendingActions: [],
            emotionalState: 'neutral',
          };
        }

        if (!memory.context.pendingActions) {
          memory.context.pendingActions = [];
        }

        memory.context.pendingActions.push({
          action,
          priority,
          dueDate,
          completed: false,
        });

        const updatedMemory = {
          ...memory,
          lastUpdated: new Date(),
        };

        setMemory(updatedMemory);
        setMemory(updatedMemory);
      } catch (error) {
        log.error('Erro ao adicionar ação pendente:', error);
      }
    },
    [memory, setMemory]
  );

  // Completar ação pendente
  const completePendingAction = useCallback(
    (actionId: string) => {
      if (!memory) return;

      try {
        if (memory.context && memory.context.pendingActions) {
          const actionIndex = memory.context.pendingActions.findIndex(
            (a) => a.action === actionId
          );
          if (actionIndex !== -1) {
            memory.context.pendingActions[actionIndex].completed = true;
          }
        }

        const updatedMemory = {
          ...memory,
          lastUpdated: new Date(),
        };

        setMemory(updatedMemory);
        setMemory(updatedMemory);
      } catch (error) {
        log.error('Erro ao completar ação pendente:', error);
      }
    },
    [memory, setMemory]
  );

  // Obter insights da memória
  const getMemoryInsights = useCallback(() => {
    if (!memory)
      return {
        personalityProfile: '',
        usagePatterns: [],
        recommendations: [],
      };

    try {
      const personalityProfile = `
Perfil do Usuário:
- Estilo de comunicação: ${memory.preferences?.formality || 'neutral'}
- Nível de detalhamento: ${memory.preferences?.verbosity || 'detailed'}
- Tópicos de interesse: ${memory.preferences?.favoriteTopics?.join(', ') || 'Nenhum'}
- Frequência de uso: ${memory.patterns?.usageFrequency?.daily || 0} interações/dia
      `;

      const usagePatterns = [
        `Pergunta mais comum: "${memory.patterns?.commonQuestions?.[0]?.question || 'N/A'}"`,
        `Horário de uso preferido: ${memory.patterns?.workingHours?.start || '09:00'} - ${memory.patterns?.workingHours?.end || '18:00'}`,
        `Total de insights armazenados: ${memory.knowledge?.contractInsights?.length || 0}`,
        `Ações pendentes: ${memory.context?.pendingActions?.filter((a) => !a.completed).length || 0}`,
      ];

      const recommendations = [];

      if (memory.preferences?.favoriteTopics?.length > 5) {
        recommendations.push(
          'Considere focar em tópicos específicos para melhorar a precisão'
        );
      }

      if (
        memory.context?.pendingActions?.filter((a) => !a.completed).length > 5
      ) {
        recommendations.push(
          'Complete as ações pendentes para melhor organização'
        );
      }

      if ((memory.knowledge?.contractInsights?.length || 0) < 10) {
        recommendations.push(
          'Continue fazendo perguntas para enriquecer o conhecimento'
        );
      }

      return {
        personalityProfile,
        usagePatterns,
        recommendations,
      };
    } catch (error) {
      log.error('Erro ao obter insights da memória:', error);
      return {
        personalityProfile: 'Erro ao carregar perfil',
        usagePatterns: ['Erro ao carregar padrões de uso'],
        recommendations: ['Erro ao carregar recomendações'],
      };
    }
  }, [memory]);

  return {
    memory,
    isLoading,
    error,
    updatePreferences,
    learnFromInteraction,
    getPersonalizedResponse,
    getContextualSuggestions,
    rememberInsight,
    getRelevantInsights,
    updateEmotionalState,
    addPendingAction,
    completePendingAction,
    getMemoryInsights,
  };
};
