import OpenAI from 'openai';
import { log } from './logger';
import type { UserPatterns } from '@/hooks/useAIMemory';

const openai = new OpenAI({
  apiKey:
    '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',
  dangerouslyAllowBrowser: true,
});

export interface PersonalityProfile {
  communicationStyle: 'direct' | 'elaborate' | 'casual' | 'formal';
  vocabulary: 'simple' | 'moderate' | 'advanced' | 'technical';
  sentenceComplexity: 'short' | 'medium' | 'long';
  emotionalTone: 'enthusiastic' | 'neutral' | 'reserved' | 'professional';
  preferredPhrasing: string[];
}

export interface ToneAnalysis {
  formality: number; // 0-1
  enthusiasm: number; // 0-1
  directness: number; // 0-1
  technical: number; // 0-1
  suggestions: string[];
}

/**
 * Analisa o estilo de comunicação do usuário baseado em suas mensagens
 */
export async function analyzeUserCommunicationStyle(
  userMessages: string[]
): Promise<PersonalityProfile> {
  try {
    log.debug('Analisando estilo de comunicação', {
      messageCount: userMessages.length,
    });

    if (userMessages.length < 5) {
      // Não há mensagens suficientes para análise precisa
      return getDefaultProfile();
    }

    const sampledMessages = userMessages.slice(-20).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analise o estilo de comunicação do usuário baseado em suas mensagens.

Identifique:
1. Estilo de comunicação (direct, elaborate, casual, formal)
2. Nível de vocabulário (simple, moderate, advanced, technical)
3. Complexidade das frases (short, medium, long)
4. Tom emocional (enthusiastic, neutral, reserved, professional)
5. Frases ou expressões preferidas (até 5)

Responda em JSON:
{
  "communicationStyle": "casual",
  "vocabulary": "moderate",
  "sentenceComplexity": "medium",
  "emotionalTone": "enthusiastic",
  "preferredPhrasing": ["olá", "por favor", "obrigado"]
}`,
        },
        {
          role: 'user',
          content: `Mensagens do usuário:\n${sampledMessages}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    log.debug('Perfil de personalidade analisado', result);

    return {
      communicationStyle: result.communicationStyle || 'casual',
      vocabulary: result.vocabulary || 'moderate',
      sentenceComplexity: result.sentenceComplexity || 'medium',
      emotionalTone: result.emotionalTone || 'neutral',
      preferredPhrasing: result.preferredPhrasing || [],
    };
  } catch (error) {
    log.error('Erro ao analisar estilo de comunicação', error);
    return getDefaultProfile();
  }
}

/**
 * Perfil padrão quando não há dados suficientes
 */
function getDefaultProfile(): PersonalityProfile {
  return {
    communicationStyle: 'casual',
    vocabulary: 'moderate',
    sentenceComplexity: 'medium',
    emotionalTone: 'neutral',
    preferredPhrasing: [],
  };
}

/**
 * Analisa o tom de uma mensagem específica
 */
export async function analyzeTone(message: string): Promise<ToneAnalysis> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analise o tom da mensagem em uma escala de 0 a 1:
- formality: quão formal é (0=muito casual, 1=muito formal)
- enthusiasm: nível de entusiasmo (0=apático, 1=muito entusiasmado)
- directness: quão direto (0=indireto, 1=muito direto)
- technical: nível técnico (0=leigo, 1=muito técnico)

Forneça sugestões de como responder no mesmo tom.

Responda em JSON:
{
  "formality": 0.5,
  "enthusiasm": 0.7,
  "directness": 0.6,
  "technical": 0.3,
  "suggestions": ["use linguagem casual", "seja entusiasmado"]
}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return {
      formality: result.formality || 0.5,
      enthusiasm: result.enthusiasm || 0.5,
      directness: result.directness || 0.5,
      technical: result.technical || 0.5,
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    log.error('Erro ao analisar tom', error);
    return {
      formality: 0.5,
      enthusiasm: 0.5,
      directness: 0.5,
      technical: 0.5,
      suggestions: [],
    };
  }
}

/**
 * Adapta o tom da resposta da IA ao estilo do usuário
 */
export function adaptResponseTone(
  aiResponse: string,
  userProfile: PersonalityProfile
): string {
  // Esta é uma adaptação simplificada
  // Em produção, isso seria feito via prompt engineering na API

  let adapted = aiResponse;

  // Ajustar formalidade
  if (userProfile.communicationStyle === 'casual') {
    adapted = adapted.replace(/Prezado\(a\)/g, 'Olá');
    adapted = adapted.replace(/Cordialmente/g, 'Abraços');
  }

  // Ajustar entusiasmo
  if (userProfile.emotionalTone === 'enthusiastic') {
    adapted = adapted.replace(/\.$/gm, '!');
  }

  return adapted;
}

/**
 * Extrai padrões de uso de um usuário
 */
export function extractUsagePatterns(
  userMessages: Array<{ content: string; timestamp: Date }>
): Partial<UserPatterns> {
  // Análise de horários de uso
  const hours = userMessages.map((m) => m.timestamp.getHours());
  const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;

  const workingHours = {
    start: `${Math.floor(avgHour - 4)}:00`,
    end: `${Math.floor(avgHour + 4)}:00`,
    timezone: 'America/Sao_Paulo',
  };

  // Frequência de uso
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const usageFrequency = {
    daily: userMessages.filter((m) => m.timestamp > oneDayAgo).length,
    weekly: userMessages.filter((m) => m.timestamp > oneWeekAgo).length,
    monthly: userMessages.filter((m) => m.timestamp > oneMonthAgo).length,
  };

  return {
    workingHours,
    usageFrequency,
    commonQuestions: [],
    preferredFeatures: [],
  };
}
