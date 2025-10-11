import OpenAI from 'openai';
import { log } from './logger';

const openai = new OpenAI({
  apiKey:
    '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',
  dangerouslyAllowBrowser: true,
});

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MessageSummary {
  originalCount: number;
  summaryText: string;
  keyPoints: string[];
  timestamp: Date;
}

export interface ContextWindow {
  recentMessages: Message[];
  summaries: MessageSummary[];
  totalMessagesProcessed: number;
}

/**
 * Gerenciador de contexto inteligente com sumarização progressiva
 */
export class ContextManager {
  private context: ContextWindow = {
    recentMessages: [],
    summaries: [],
    totalMessagesProcessed: 0,
  };

  private readonly MAX_RECENT_MESSAGES = 20;
  private readonly SUMMARIZE_THRESHOLD = 40;
  private readonly MAX_SUMMARIES = 5;

  async addMessage(role: 'user' | 'assistant', content: string): Promise<void> {
    const message: Message = {
      role,
      content,
      timestamp: new Date(),
    };

    this.context.recentMessages.push(message);
    this.context.totalMessagesProcessed++;

    if (this.context.recentMessages.length >= this.SUMMARIZE_THRESHOLD) {
      await this.summarizeOldMessages();
    }

    log.debug('Mensagem adicionada ao contexto', {
      role,
      totalMessages: this.context.recentMessages.length,
    });
  }

  private async summarizeOldMessages(): Promise<void> {
    try {
      log.debug('Iniciando sumarização de mensagens antigas');

      const toSummarize = this.context.recentMessages.splice(
        0,
        Math.floor(this.context.recentMessages.length / 2)
      );

      if (toSummarize.length === 0) return;

      const conversationText = toSummarize
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Crie um sumário conciso desta conversa, incluindo um parágrafo resumindo o conteúdo e uma lista de 3-5 pontos-chave principais. Responda em JSON com formato: {"summary": "texto", "keyPoints": ["ponto 1", "ponto 2"]}',
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
        temperature: 0.3,
      });

      const result = JSON.parse(
        completion.choices[0]?.message?.content || '{}'
      );

      const summary: MessageSummary = {
        originalCount: toSummarize.length,
        summaryText: result.summary || 'Conversa sobre vários tópicos',
        keyPoints: result.keyPoints || [],
        timestamp: new Date(),
      };

      this.context.summaries.push(summary);

      if (this.context.summaries.length > this.MAX_SUMMARIES) {
        this.context.summaries.shift();
      }

      log.debug('Mensagens sumarizadas', {
        summarized: toSummarize.length,
        remaining: this.context.recentMessages.length,
      });
    } catch (error) {
      log.error('Erro ao sumarizar mensagens', error);
    }
  }

  getFormattedContext(_includeSystem: boolean = true): string {
    const parts: string[] = [];

    if (this.context.summaries.length > 0) {
      const summariesText = this.context.summaries
        .map((s, idx) => {
          const points = s.keyPoints.map((p) => `  • ${p}`).join('\n');
          return `=== Resumo ${idx + 1} (${s.originalCount} mensagens) ===\n${s.summaryText}\n\nPontos-chave:\n${points}`;
        })
        .join('\n\n');

      parts.push(`[CONTEXTO ANTERIOR - Resumido]\n${summariesText}`);
    }

    if (this.context.recentMessages.length > 0) {
      const recentText = this.context.recentMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      parts.push(`[CONVERSA RECENTE]\n${recentText}`);
    }

    return parts.join('\n\n---\n\n');
  }

  getRecentMessages(count?: number): Message[] {
    const messages = this.context.recentMessages;
    return count ? messages.slice(-count) : messages;
  }

  getSummaries(): MessageSummary[] {
    return this.context.summaries;
  }

  getStats(): {
    recentMessageCount: number;
    summaryCount: number;
    totalProcessed: number;
    effectiveContextSize: number;
  } {
    const effectiveContextSize =
      this.context.recentMessages.length +
      this.context.summaries.reduce((sum, s) => sum + s.originalCount, 0);

    return {
      recentMessageCount: this.context.recentMessages.length,
      summaryCount: this.context.summaries.length,
      totalProcessed: this.context.totalMessagesProcessed,
      effectiveContextSize,
    };
  }

  clear(): void {
    this.context = {
      recentMessages: [],
      summaries: [],
      totalMessagesProcessed: 0,
    };
    log.debug('Contexto limpo');
  }

  exportContext(): ContextWindow {
    return { ...this.context };
  }

  importContext(contextData: ContextWindow): void {
    this.context = {
      ...contextData,
      recentMessages: contextData.recentMessages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
      summaries: contextData.summaries.map((s) => ({
        ...s,
        timestamp: new Date(s.timestamp),
      })),
    };
    log.debug('Contexto importado', {
      messages: this.context.recentMessages.length,
      summaries: this.context.summaries.length,
    });
  }

  shouldSummarize(): boolean {
    return this.context.recentMessages.length >= this.SUMMARIZE_THRESHOLD;
  }

  async forceSummarize(): Promise<void> {
    if (this.context.recentMessages.length > 0) {
      await this.summarizeOldMessages();
    }
  }
}

export const globalContextManager = new ContextManager();
