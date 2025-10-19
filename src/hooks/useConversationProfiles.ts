/**
 * Hook para gerenciar perfis de comunicação conversacional
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  ConversationProfile,
} from '@/types/conversationProfile';
import { analyzeMessageContext } from '@/utils/sentimentAnalysis';
import { log } from '@/utils/logger';

interface UseConversationProfilesReturn {
  profiles: ConversationProfile[];
  activeProfile: ConversationProfile | null;
  isLoading: boolean;
  error: string | null;
  createProfile: (
    personId: string,
    personName: string,
    personType: 'locador' | 'locatario',
    contractId?: string
  ) => Promise<ConversationProfile>;
  updateProfile: (
    personId: string,
    updates: Partial<ConversationProfile>
  ) => Promise<void>;
  getProfile: (personId: string) => ConversationProfile | null;
  setActiveProfile: (personId: string | null) => void;
  learnFromMessage: (
    personId: string,
    message: string,
    userResponse?: string,
    feedback?: 'positive' | 'negative'
  ) => Promise<void>;
  getPreferredTone: (personId: string) => string;
  analyzeConversationPatterns: (personId: string) => {
    commonEmotions: Array<{ emotion: string; frequency: number }>;
    formalityTrend: 'increasing' | 'decreasing' | 'stable';
    averageResponseTime: number;
    preferredTopics: string[];
  };
  suggestResponseImprovements: (personId: string) => string[];
}

const PROFILES_STORAGE_KEY = 'conversation-profiles';
const ACTIVE_PROFILE_KEY = 'active-conversation-profile';

export const useConversationProfiles = (): UseConversationProfilesReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Usar localStorage para gerenciar perfis
  const [profiles, setProfiles] = useLocalStorage<ConversationProfile[]>(
    PROFILES_STORAGE_KEY,
    [],
    {
      deserialize: (value: string) => {
        const parsed = JSON.parse(value);
        return parsed.map((profile: any) => ({
          ...profile,
          emotionalHistory: profile.emotionalHistory.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
          lastInteraction: new Date(profile.lastInteraction),
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt),
        }));
      },
      onError: (err) => {
        setError('Erro ao carregar perfis de conversação');
        log.error('Erro no localStorage dos perfis:', err);
      },
    }
  );

  // Carregar perfil ativo
  useEffect(() => {
    const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (savedActiveId && profiles.some((p) => p.personId === savedActiveId)) {
      setActiveProfileId(savedActiveId);
    }
    setIsLoading(false);
  }, [profiles]);

  // Criar novo perfil
  const createProfile = useCallback(
    async (
      personId: string,
      personName: string,
      personType: 'locador' | 'locatario',
      contractId?: string
    ): Promise<ConversationProfile> => {
      const newProfile: ConversationProfile = {
        personId,
        personName,
        personType,
        contractId,
        communicationStyle: {
          formality: 'neutral',
          typicalTone: 'professional',
          vocabularyLevel: 'intermediate',
        },
        emotionalHistory: [],
        messagePatterns: {
          commonQuestions: [],
          typicalGreetings: [],
          responsePreferences: [],
        },
        lastInteraction: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setProfiles((prev) => {
        const existing = prev.find((p) => p.personId === personId);
        if (existing) {
          log.warn('Perfil já existe para personId:', personId);
          return prev;
        }
        return [...prev, newProfile];
      });

      log.info('Novo perfil criado:', newProfile);
      return newProfile;
    },
    [setProfiles]
  );

  // Atualizar perfil
  const updateProfile = useCallback(
    async (
      personId: string,
      updates: Partial<ConversationProfile>
    ): Promise<void> => {
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.personId === personId
            ? { ...profile, ...updates, updatedAt: new Date() }
            : profile
        )
      );
      log.debug('Perfil atualizado:', personId, updates);
    },
    [setProfiles]
  );

  // Obter perfil específico
  const getProfile = useCallback(
    (personId: string): ConversationProfile | null => {
      return profiles.find((p) => p.personId === personId) || null;
    },
    [profiles]
  );

  // Definir perfil ativo
  const setActiveProfile = useCallback((personId: string | null) => {
    setActiveProfileId(personId);
    if (personId) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, personId);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
    log.debug('Perfil ativo alterado:', personId);
  }, []);

  // Aprender com mensagem
  const learnFromMessage = useCallback(
    async (
      personId: string,
      message: string,
      userResponse?: string,
      feedback?: 'positive' | 'negative'
    ): Promise<void> => {
      try {
        const analysis = await analyzeMessageContext(message);
        const profile = getProfile(personId);

        if (!profile) {
          log.warn('Perfil não encontrado para aprender:', personId);
          return;
        }

        // Adicionar à história emocional
        const emotionalEntry = {
          message,
          detectedEmotion: analysis.emotion,
          timestamp: new Date(),
        };

        // Atualizar padrões de comunicação
        const updatedPatterns = { ...profile.messagePatterns };

        // Adicionar perguntas comuns se for uma pergunta
        if (analysis.intent === 'question') {
          const questionWords = message
            .toLowerCase()
            .match(/\b(que|qual|como|quando|onde|porque|quanto|quem)\b/i);
          if (questionWords) {
            const question = message.trim();
            if (!updatedPatterns.commonQuestions.includes(question)) {
              updatedPatterns.commonQuestions.push(question);
              // Manter apenas as 10 perguntas mais recentes
              updatedPatterns.commonQuestions =
                updatedPatterns.commonQuestions.slice(-10);
            }
          }
        }

        // Adicionar saudações típicas
        if (analysis.intent === 'greeting') {
          const greeting = message.trim();
          if (!updatedPatterns.typicalGreetings.includes(greeting)) {
            updatedPatterns.typicalGreetings.push(greeting);
            updatedPatterns.typicalGreetings =
              updatedPatterns.typicalGreetings.slice(-5);
          }
        }

        // Adicionar preferências de resposta se houver feedback
        if (userResponse && feedback === 'positive') {
          if (!updatedPatterns.responsePreferences.includes(userResponse)) {
            updatedPatterns.responsePreferences.push(userResponse);
            updatedPatterns.responsePreferences =
              updatedPatterns.responsePreferences.slice(-10);
          }
        }

        // Atualizar estilo de comunicação baseado na análise
        const updatedStyle = { ...profile.communicationStyle };

        // Ajustar formalidade baseado no histórico
        const recentEmotions = profile.emotionalHistory.slice(-5);
        const formalityScores = recentEmotions.map((_e) => {
          // Simular análise de formalidade baseada no padrão
          return profile.communicationStyle.formality === 'formal'
            ? 1
            : profile.communicationStyle.formality === 'informal'
              ? -1
              : 0;
        });

        const avgFormalityScore =
          formalityScores.length > 0
            ? formalityScores.reduce((a, b) => a + b, 0) /
              formalityScores.length
            : 0;

        if (avgFormalityScore > 0.3) {
          updatedStyle.formality = 'formal';
        } else if (avgFormalityScore < -0.3) {
          updatedStyle.formality = 'informal';
        } else {
          updatedStyle.formality = 'neutral';
        }

        // Atualizar tom típico baseado na emoção mais comum
        const emotionCounts = profile.emotionalHistory.reduce(
          (acc, e) => {
            acc[e.detectedEmotion] = (acc[e.detectedEmotion] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const mostCommonEmotion = Object.entries(emotionCounts).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0];

        if (mostCommonEmotion) {
          switch (mostCommonEmotion) {
            case 'frustrated':
            case 'concerned':
              updatedStyle.typicalTone = 'empathetic';
              break;
            case 'positive':
            case 'grateful':
              updatedStyle.typicalTone = 'friendly';
              break;
            case 'urgent':
              updatedStyle.typicalTone = 'direct';
              break;
            default:
              updatedStyle.typicalTone = 'professional';
          }
        }

        // Atualizar perfil
        await updateProfile(personId, {
          emotionalHistory: [
            ...profile.emotionalHistory.slice(-19),
            emotionalEntry,
          ], // Manter últimas 20
          messagePatterns: updatedPatterns,
          communicationStyle: updatedStyle,
          lastInteraction: new Date(),
        });

        log.debug('Aprendizado aplicado ao perfil:', personId, analysis);
      } catch (err) {
        log.error('Erro ao aprender com mensagem:', err);
        setError('Erro ao atualizar perfil conversacional');
      }
    },
    [getProfile, updateProfile]
  );

  // Obter tom preferido
  const getPreferredTone = useCallback(
    (personId: string): string => {
      const profile = getProfile(personId);
      if (!profile) return 'professional';

      const recentEmotions = profile.emotionalHistory.slice(-3);
      if (recentEmotions.length === 0)
        return profile.communicationStyle.typicalTone;

      const recentEmotion =
        recentEmotions[recentEmotions.length - 1].detectedEmotion;

      switch (recentEmotion) {
        case 'frustrated':
        case 'concerned':
          return 'empathetic';
        case 'positive':
        case 'grateful':
          return 'friendly';
        case 'urgent':
          return 'direct';
        default:
          return profile.communicationStyle.typicalTone;
      }
    },
    [getProfile]
  );

  // Analisar padrões de conversação
  const analyzeConversationPatterns = useCallback(
    (personId: string) => {
      const profile = getProfile(personId);
      if (!profile) {
        return {
          commonEmotions: [],
          formalityTrend: 'stable' as const,
          averageResponseTime: 0,
          preferredTopics: [],
        };
      }

      // Emoções mais comuns
      const emotionCounts = profile.emotionalHistory.reduce(
        (acc, e) => {
          acc[e.detectedEmotion] = (acc[e.detectedEmotion] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const commonEmotions = Object.entries(emotionCounts)
        .map(([emotion, frequency]) => ({ emotion, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      // Tendência de formalidade
      const recentEmotions = profile.emotionalHistory.slice(-5);
      const olderEmotions = profile.emotionalHistory.slice(-10, -5);

      let formalityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentEmotions.length >= 3 && olderEmotions.length >= 3) {
        const recentFormal = recentEmotions.filter(
          (e) => e.detectedEmotion !== 'informal'
        ).length;
        const olderFormal = olderEmotions.filter(
          (e) => e.detectedEmotion !== 'informal'
        ).length;

        if (recentFormal > olderFormal) {
          formalityTrend = 'increasing';
        } else if (recentFormal < olderFormal) {
          formalityTrend = 'decreasing';
        }
      }

      // Tempo médio de resposta (simulado)
      const averageResponseTime =
        profile.emotionalHistory.length > 0
          ? Math.max(1, Math.min(24, profile.emotionalHistory.length * 2))
          : 0;

      // Tópicos preferidos (baseado nas perguntas comuns)
      const preferredTopics = profile.messagePatterns.commonQuestions
        .map((q) => q.toLowerCase())
        .filter(
          (q) =>
            q.includes('contrato') ||
            q.includes('vistoria') ||
            q.includes('pintura')
        )
        .slice(0, 3);

      return {
        commonEmotions,
        formalityTrend,
        averageResponseTime,
        preferredTopics,
      };
    },
    [getProfile]
  );

  // Sugerir melhorias de resposta
  const suggestResponseImprovements = useCallback(
    (personId: string): string[] => {
      const profile = getProfile(personId);
      if (!profile) return [];

      const suggestions: string[] = [];
      const patterns = analyzeConversationPatterns(personId);

      // Sugestões baseadas em emoções comuns
      if (
        patterns.commonEmotions.some(
          (e) => e.emotion === 'frustrated' && e.frequency > 2
        )
      ) {
        suggestions.push('Considere ser mais empático nas respostas');
      }

      if (
        patterns.commonEmotions.some(
          (e) => e.emotion === 'urgent' && e.frequency > 1
        )
      ) {
        suggestions.push('Priorize respostas mais rápidas');
      }

      // Sugestões baseadas em formalidade
      if (patterns.formalityTrend === 'increasing') {
        suggestions.push('Mantenha tom mais formal');
      } else if (patterns.formalityTrend === 'decreasing') {
        suggestions.push('Adote tom mais informal');
      }

      // Sugestões baseadas em tópicos
      if (patterns.preferredTopics.includes('vistoria')) {
        suggestions.push('Prepare informações sobre vistorias');
      }

      if (patterns.preferredTopics.includes('contrato')) {
        suggestions.push('Tenha dados do contrato à mão');
      }

      return suggestions;
    },
    [getProfile, analyzeConversationPatterns]
  );

  const activeProfile = activeProfileId ? getProfile(activeProfileId) : null;

  return {
    profiles,
    activeProfile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    getProfile,
    setActiveProfile,
    learnFromMessage,
    getPreferredTone,
    analyzeConversationPatterns,
    suggestResponseImprovements,
  };
};
