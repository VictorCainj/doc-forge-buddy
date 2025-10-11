import { log } from './logger';
import type { UserPreferences } from '@/hooks/useAIMemory';
import type { FeedbackData } from './chatMetrics';

export interface LearningEvent {
  timestamp: Date;
  messageId: string;
  userMessage: string;
  aiResponse: string;
  feedback: FeedbackData;
  adjustments: string[];
}

export interface LearningInsight {
  pattern: string;
  confidence: number;
  occurrences: number;
  suggestion: string;
}

/**
 * Sistema de aprendizado contínuo baseado em feedback
 */
export class ContinuousLearningSystem {
  private learningHistory: LearningEvent[] = [];
  private readonly MAX_HISTORY = 1000;

  /**
   * Registra um evento de aprendizado
   */
  recordLearningEvent(
    messageId: string,
    userMessage: string,
    aiResponse: string,
    feedback: FeedbackData
  ): void {
    const adjustments = this.analyzeAndSuggestAdjustments(
      feedback,
      userMessage,
      aiResponse
    );

    const event: LearningEvent = {
      timestamp: new Date(),
      messageId,
      userMessage,
      aiResponse,
      feedback,
      adjustments,
    };

    this.learningHistory.push(event);

    // Limitar histórico
    if (this.learningHistory.length > this.MAX_HISTORY) {
      this.learningHistory.shift();
    }

    log.debug('Evento de aprendizado registrado', {
      messageId,
      rating: feedback.rating,
      adjustments: adjustments.length,
    });
  }

  /**
   * Analisa feedback e sugere ajustes
   */
  private analyzeAndSuggestAdjustments(
    feedback: FeedbackData,
    userMessage: string,
    aiResponse: string
  ): string[] {
    const adjustments: string[] = [];

    // Análise baseada no tipo de feedback
    switch (feedback.feedbackType) {
      case 'unhelpful':
        adjustments.push('Melhorar relevância das respostas');
        if (aiResponse.length < 100) {
          adjustments.push('Fornecer respostas mais detalhadas');
        }
        break;

      case 'incorrect':
        adjustments.push('Verificar fatos antes de responder');
        adjustments.push('Aumentar confiança mínima para afirmações');
        break;

      case 'incomplete':
        adjustments.push('Fornecer respostas mais completas');
        adjustments.push('Perguntar se usuário precisa de mais detalhes');
        break;

      case 'excellent':
        adjustments.push('Manter este estilo de resposta');
        break;
    }

    // Análise baseada na avaliação
    if (feedback.rating <= 2) {
      adjustments.push('Revisar abordagem geral');

      // Analisar comprimento
      if (aiResponse.length > 1000) {
        adjustments.push('Respostas mais concisas podem ser melhor');
      } else if (aiResponse.length < 50) {
        adjustments.push('Respostas muito curtas podem ser inadequadas');
      }
    }

    return adjustments;
  }

  /**
   * Extrai insights de aprendizado do histórico
   */
  extractInsights(): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Analisar padrões de feedback negativo
    const negativeFeedback = this.learningHistory.filter(
      (e) => e.feedback.rating <= 2
    );

    if (negativeFeedback.length > 0) {
      // Identificar problemas comuns
      const issueTypes = new Map<string, number>();

      negativeFeedback.forEach((event) => {
        issueTypes.set(
          event.feedback.feedbackType,
          (issueTypes.get(event.feedback.feedbackType) || 0) + 1
        );
      });

      issueTypes.forEach((count, type) => {
        if (count >= 3) {
          insights.push({
            pattern: `Feedback negativo: ${type}`,
            confidence: Math.min(count / 10, 1),
            occurrences: count,
            suggestion: this.getSuggestionForIssue(type),
          });
        }
      });
    }

    // Analisar padrões de feedback positivo
    const positiveFeedback = this.learningHistory.filter(
      (e) => e.feedback.rating >= 4
    );

    if (positiveFeedback.length >= 5) {
      insights.push({
        pattern: 'Respostas bem-sucedidas',
        confidence: 0.8,
        occurrences: positiveFeedback.length,
        suggestion: 'Manter padrões atuais de resposta',
      });
    }

    return insights;
  }

  /**
   * Sugere ajustes baseados em tipo de problema
   */
  private getSuggestionForIssue(issueType: string): string {
    const suggestions: Record<string, string> = {
      unhelpful: 'Melhorar relevância contextual das respostas',
      incorrect: 'Implementar verificação de fatos mais rigorosa',
      incomplete: 'Fornecer respostas mais completas e estruturadas',
    };

    return suggestions[issueType] || 'Melhorar qualidade geral das respostas';
  }

  /**
   * Ajusta preferências do usuário baseado em aprendizado
   */
  adjustUserPreferences(
    _currentPreferences: UserPreferences
  ): Partial<UserPreferences> {
    const _insights = this.extractInsights();
    const adjustments: Partial<UserPreferences> = {};

    // Analisar feedback sobre verbosidade
    const tooVerboseCount = this.learningHistory.filter(
      (e) =>
        e.feedback.comment?.toLowerCase().includes('muito longo') ||
        e.feedback.comment?.toLowerCase().includes('prolixo')
    ).length;

    const tooConciseCount = this.learningHistory.filter(
      (e) =>
        e.feedback.comment?.toLowerCase().includes('muito curto') ||
        e.feedback.comment?.toLowerCase().includes('incompleto')
    ).length;

    if (tooVerboseCount > tooConciseCount && tooVerboseCount >= 3) {
      adjustments.verbosity = 'concise';
      log.debug('Ajustando verbosidade para conciso baseado em feedback');
    } else if (tooConciseCount > tooVerboseCount && tooConciseCount >= 3) {
      adjustments.verbosity = 'detailed';
      log.debug('Ajustando verbosidade para detalhado baseado em feedback');
    }

    // Analisar feedback sobre formalidade
    const tooCasualCount = this.learningHistory.filter(
      (e) =>
        e.feedback.comment?.toLowerCase().includes('informal') ||
        e.feedback.comment?.toLowerCase().includes('casual')
    ).length;

    const tooFormalCount = this.learningHistory.filter(
      (e) =>
        e.feedback.comment?.toLowerCase().includes('muito formal') ||
        e.feedback.comment?.toLowerCase().includes('engessado')
    ).length;

    if (tooCasualCount >= 3) {
      adjustments.formality = 'formal';
      log.debug('Ajustando formalidade para formal baseado em feedback');
    } else if (tooFormalCount >= 3) {
      adjustments.formality = 'informal';
      log.debug('Ajustando formalidade para informal baseado em feedback');
    }

    return adjustments;
  }

  /**
   * Obtém estatísticas de aprendizado
   */
  getStats(): {
    totalEvents: number;
    positiveRatio: number;
    negativeRatio: number;
    mostCommonIssue: string | null;
    learningRate: number; // % de melhoria ao longo do tempo
  } {
    const total = this.learningHistory.length;

    if (total === 0) {
      return {
        totalEvents: 0,
        positiveRatio: 0,
        negativeRatio: 0,
        mostCommonIssue: null,
        learningRate: 0,
      };
    }

    const positive = this.learningHistory.filter(
      (e) => e.feedback.rating >= 4
    ).length;
    const negative = this.learningHistory.filter(
      (e) => e.feedback.rating <= 2
    ).length;

    // Calcular taxa de melhoria
    const recentEvents = this.learningHistory.slice(-50);
    const olderEvents = this.learningHistory.slice(0, 50);

    const recentPositiveRatio =
      recentEvents.filter((e) => e.feedback.rating >= 4).length /
      recentEvents.length;
    const olderPositiveRatio =
      olderEvents.length > 0
        ? olderEvents.filter((e) => e.feedback.rating >= 4).length /
          olderEvents.length
        : 0;

    const learningRate =
      olderPositiveRatio > 0
        ? ((recentPositiveRatio - olderPositiveRatio) / olderPositiveRatio) *
          100
        : 0;

    // Encontrar problema mais comum
    const issues = new Map<string, number>();
    this.learningHistory
      .filter((e) => e.feedback.rating <= 2)
      .forEach((e) => {
        issues.set(
          e.feedback.feedbackType,
          (issues.get(e.feedback.feedbackType) || 0) + 1
        );
      });

    let mostCommonIssue: string | null = null;
    let maxCount = 0;
    issues.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonIssue = type;
      }
    });

    return {
      totalEvents: total,
      positiveRatio: positive / total,
      negativeRatio: negative / total,
      mostCommonIssue,
      learningRate,
    };
  }

  /**
   * Limpa histórico
   */
  clearHistory(): void {
    this.learningHistory = [];
    log.debug('Histórico de aprendizado limpo');
  }

  /**
   * Exporta histórico
   */
  export(): LearningEvent[] {
    return [...this.learningHistory];
  }

  /**
   * Importa histórico
   */
  import(events: LearningEvent[]): void {
    this.learningHistory = events.map((e) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));
    log.debug('Histórico de aprendizado importado', { events: events.length });
  }
}

// Instância global
export const learningSystem = new ContinuousLearningSystem();
