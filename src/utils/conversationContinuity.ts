import OpenAI from 'openai';
import { log } from './logger';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true,
});

export interface ConversationSummary {
  sessionId: string;
  mainTopics: string[];
  keyPoints: string[];
  pendingQuestions: string[];
  emotionalTone: string;
  summary: string;
  messageCount: number;
  createdAt: Date;
}

export interface ContinuityContext {
  shouldContinue: boolean;
  resumePrompt: string;
  previousContext: string;
}

/**
 * Gera um resumo executivo da conversa
 */
export async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>,
  sessionId: string
): Promise<ConversationSummary> {
  try {
    log.debug('Gerando resumo da conversa', { sessionId, messageCount: messages.length });

    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em analisar conversas e gerar resumos executivos.

Analise a conversa e forneça um resumo estruturado contendo:
1. Principais tópicos discutidos
2. Pontos-chave importantes
3. Perguntas ou assuntos pendentes
4. Tom emocional geral (neutro, positivo, frustrado, etc.)
5. Resumo narrativo em 2-3 frases

Responda em JSON válido:
{
  "mainTopics": ["tópico1", "tópico2"],
  "keyPoints": ["ponto1", "ponto2"],
  "pendingQuestions": ["pergunta1"],
  "emotionalTone": "neutro",
  "summary": "Resumo narrativo aqui"
}`,
        },
        {
          role: 'user',
          content: `Conversa:\n${conversationText}\n\nGere o resumo estruturado.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    const summary: ConversationSummary = {
      sessionId,
      mainTopics: result.mainTopics || [],
      keyPoints: result.keyPoints || [],
      pendingQuestions: result.pendingQuestions || [],
      emotionalTone: result.emotionalTone || 'neutro',
      summary: result.summary || 'Sem resumo disponível',
      messageCount: messages.length,
      createdAt: new Date(),
    };

    log.debug('Resumo gerado com sucesso', { sessionId });

    return summary;
  } catch (error) {
    log.error('Erro ao gerar resumo', error);
    
    // Fallback: resumo simples
    return {
      sessionId,
      mainTopics: ['Conversa geral'],
      keyPoints: [],
      pendingQuestions: [],
      emotionalTone: 'neutro',
      summary: `Conversa com ${messages.length} mensagens`,
      messageCount: messages.length,
      createdAt: new Date(),
    };
  }
}

/**
 * Determina se deve oferecer continuidade da conversa
 */
export function shouldOfferContinuity(
  summary: ConversationSummary,
  timeSinceLastMessage: number // em minutos
): boolean {
  // Oferecer continuidade se:
  // 1. Há perguntas pendentes
  // 2. A conversa foi longa (>10 mensagens)
  // 3. Foi recente (<60 minutos)

  const hasUnfinishedBusiness = summary.pendingQuestions.length > 0;
  const wasSubstantial = summary.messageCount >= 10;
  const wasRecent = timeSinceLastMessage < 60;

  return (hasUnfinishedBusiness || wasSubstantial) && wasRecent;
}

/**
 * Gera contexto para retomar a conversa
 */
export function generateResumeContext(summary: ConversationSummary): ContinuityContext {
  const shouldContinue = summary.pendingQuestions.length > 0 || summary.messageCount >= 10;

  let resumePrompt = '';
  let previousContext = '';

  if (shouldContinue) {
    // Criar prompt de retomada
    resumePrompt = `Bem-vindo de volta! Na nossa última conversa sobre ${summary.mainTopics.join(', ')}, `;
    
    if (summary.pendingQuestions.length > 0) {
      resumePrompt += `você tinha perguntado: "${summary.pendingQuestions[0]}". Gostaria de continuar?`;
    } else {
      resumePrompt += `discutimos ${summary.keyPoints.slice(0, 2).join(' e ')}. Gostaria de continuar de onde paramos?`;
    }

    // Criar contexto prévio
    previousContext = `Resumo da conversa anterior:\n${summary.summary}\n\nTópicos: ${summary.mainTopics.join(', ')}\nPontos-chave: ${summary.keyPoints.join('; ')}`;
  }

  return {
    shouldContinue,
    resumePrompt,
    previousContext,
  };
}

/**
 * Armazena resumo em localStorage
 */
export function saveSummaryToStorage(summary: ConversationSummary): void {
  try {
    const key = `conversation_summary_${summary.sessionId}`;
    localStorage.setItem(key, JSON.stringify(summary));
    log.debug('Resumo salvo no storage', { sessionId: summary.sessionId });
  } catch (error) {
    log.error('Erro ao salvar resumo', error);
  }
}

/**
 * Recupera resumo do localStorage
 */
export function loadSummaryFromStorage(sessionId: string): ConversationSummary | null {
  try {
    const key = `conversation_summary_${sessionId}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;

    const summary = JSON.parse(data);
    summary.createdAt = new Date(summary.createdAt);
    
    return summary;
  } catch (error) {
    log.error('Erro ao carregar resumo', error);
    return null;
  }
}
