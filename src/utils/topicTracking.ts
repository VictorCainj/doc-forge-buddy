import OpenAI from 'openai';
import { log } from './logger';

const openai = new OpenAI({
  apiKey:
    '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',
  dangerouslyAllowBrowser: true,
});

export interface Topic {
  id: string;
  name: string;
  startedAt: Date;
  lastMentioned: Date;
  messageCount: number;
  subtopics: string[];
  keyPoints: string[];
}

export interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  timestamp: Date;
  reason: 'natural' | 'user_initiated' | 'clarification' | 'tangent';
}

export interface TopicHierarchy {
  mainTopic: Topic;
  subTopics: Topic[];
  relatedTopics: string[];
}

/**
 * Extrai o tópico principal de uma mensagem
 */
export async function extractTopicFromMessage(
  message: string,
  conversationHistory?: string
): Promise<string> {
  try {
    log.debug('Extraindo tópico da mensagem');

    const context = conversationHistory
      ? `Contexto da conversa:\n${conversationHistory}\n\n`
      : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Identifique o tópico principal da mensagem do usuário em 2-4 palavras.
          
Exemplos:
- "Como faço para analisar contratos?" → "Análise de contratos"
- "Preciso gerar um relatório" → "Geração de relatórios"
- "Me fale sobre esse imóvel" → "Informações do imóvel"

Responda apenas com o nome do tópico, sem explicações.`,
        },
        {
          role: 'user',
          content: `${context}Mensagem atual: ${message}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 50,
    });

    const topic =
      completion.choices[0]?.message?.content?.trim() || 'Conversa geral';

    log.debug('Tópico extraído', { topic });

    return topic;
  } catch (error) {
    log.error('Erro ao extrair tópico', error);
    return 'Conversa geral';
  }
}

/**
 * Detecta mudança de tópico
 */
export function detectTopicChange(
  currentTopic: string,
  newTopic: string,
  threshold: number = 0.5
): boolean {
  // Comparação simples de similaridade de strings
  const similarity = calculateStringSimilarity(
    currentTopic.toLowerCase(),
    newTopic.toLowerCase()
  );

  return similarity < threshold;
}

/**
 * Calcula similaridade entre strings
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Gerenciador de tópicos
 */
export class TopicManager {
  private topics: Map<string, Topic> = new Map();
  private transitions: TopicTransition[] = [];
  private currentTopicId: string | null = null;

  /**
   * Atualiza ou cria um tópico
   */
  updateTopic(topicName: string, _messageContent?: string): string {
    const now = new Date();

    // Verificar se já existe um tópico similar
    let topicId = this.findSimilarTopic(topicName);

    if (topicId) {
      // Atualizar tópico existente
      const topic = this.topics.get(topicId)!;
      topic.lastMentioned = now;
      topic.messageCount++;

      // Detectar mudança de tópico
      if (this.currentTopicId && this.currentTopicId !== topicId) {
        this.transitions.push({
          fromTopic: this.currentTopicId,
          toTopic: topicId,
          timestamp: now,
          reason: 'natural',
        });
      }
    } else {
      // Criar novo tópico
      topicId = `topic_${Date.now()}`;
      this.topics.set(topicId, {
        id: topicId,
        name: topicName,
        startedAt: now,
        lastMentioned: now,
        messageCount: 1,
        subtopics: [],
        keyPoints: [],
      });

      if (this.currentTopicId) {
        this.transitions.push({
          fromTopic: this.currentTopicId,
          toTopic: topicId,
          timestamp: now,
          reason: 'user_initiated',
        });
      }
    }

    this.currentTopicId = topicId;
    return topicId;
  }

  /**
   * Encontra tópico similar existente
   */
  private findSimilarTopic(topicName: string): string | null {
    for (const [id, topic] of this.topics.entries()) {
      if (
        calculateStringSimilarity(
          topic.name.toLowerCase(),
          topicName.toLowerCase()
        ) > 0.6
      ) {
        return id;
      }
    }
    return null;
  }

  /**
   * Obtém tópico atual
   */
  getCurrentTopic(): Topic | null {
    if (!this.currentTopicId) return null;
    return this.topics.get(this.currentTopicId) || null;
  }

  /**
   * Obtém histórico de tópicos
   */
  getTopicHistory(limit: number = 10): Topic[] {
    return Array.from(this.topics.values())
      .sort((a, b) => b.lastMentioned.getTime() - a.lastMentioned.getTime())
      .slice(0, limit);
  }

  /**
   * Obtém transições de tópico
   */
  getTopicTransitions(limit: number = 5): TopicTransition[] {
    return this.transitions.slice(-limit);
  }

  /**
   * Adiciona ponto-chave a um tópico
   */
  addKeyPoint(topicId: string, keyPoint: string): void {
    const topic = this.topics.get(topicId);
    if (topic) {
      topic.keyPoints.push(keyPoint);
      if (topic.keyPoints.length > 10) {
        topic.keyPoints.shift();
      }
    }
  }

  /**
   * Limpa tópicos antigos (> 7 dias)
   */
  cleanOldTopics(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const [id, topic] of this.topics.entries()) {
      if (topic.lastMentioned < sevenDaysAgo) {
        this.topics.delete(id);
      }
    }

    log.debug('Tópicos antigos limpos', { remaining: this.topics.size });
  }
}

// Instância global
export const topicManager = new TopicManager();
