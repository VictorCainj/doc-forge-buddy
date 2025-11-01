// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { log } from './logger';

export interface MetricData {
  name: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface FeedbackData {
  messageId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType: 'helpful' | 'unhelpful' | 'incorrect' | 'incomplete' | 'excellent';
  comment?: string;
}

export interface ChatStats {
  avgResponseTime: number;
  avgRating: number;
  totalMessages: number;
  totalSessions: number;
  satisfactionRate: number;
  commonIssues: string[];
}

/**
 * Registra uma métrica do chat
 */
export async function recordMetric(
  sessionId: string,
  metricData: MetricData
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('chat_metrics')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        metric_name: metricData.name,
        metric_value: metricData.value,
        metadata: metricData.metadata || {},
      });

    if (error) throw error;

    log.debug('Métrica registrada', { name: metricData.name, value: metricData.value });
  } catch (error) {
    log.error('Erro ao registrar métrica', error);
  }
}

/**
 * Registra feedback de uma mensagem
 */
export async function submitFeedback(feedback: FeedbackData): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('chat_feedback')
      .insert({
        message_id: feedback.messageId,
        user_id: user.id,
        rating: feedback.rating,
        feedback_type: feedback.feedbackType,
        comment: feedback.comment || null,
      });

    if (error) throw error;

    log.debug('Feedback registrado', { messageId: feedback.messageId, rating: feedback.rating });
    return true;
  } catch (error) {
    log.error('Erro ao registrar feedback', error);
    return false;
  }
}

/**
 * Obtém estatísticas do chat do usuário
 */
export async function getChatStats(): Promise<ChatStats | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Buscar métricas de tempo de resposta
    const { data: responseTimeMetrics } = await supabase
      .from('chat_metrics')
      .select('metric_value')
      .eq('user_id', user.id)
      .eq('metric_name', 'response_time');

    const avgResponseTime = responseTimeMetrics && responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + Number(m.metric_value), 0) / responseTimeMetrics.length
      : 0;

    // Buscar estatísticas de feedback usando a função RPC
    const { data: feedbackStats } = await supabase
      .rpc('get_user_satisfaction_stats', { user_id_param: user.id });

    const avgRating = feedbackStats?.[0]?.avg_rating || 0;
    const totalFeedback = feedbackStats?.[0]?.total_feedback || 0;
    const positiveFeedback = feedbackStats?.[0]?.positive_feedback || 0;

    const satisfactionRate = totalFeedback > 0 
      ? (Number(positiveFeedback) / Number(totalFeedback)) * 100 
      : 0;

    // Contar mensagens e sessões
    const { count: totalMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .in('session_id', 
        supabase.from('chat_sessions').select('id').eq('user_id', user.id)
      );

    const { count: totalSessions } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Identificar problemas comuns do feedback negativo
    const { data: negativeFeedback } = await supabase
      .from('chat_feedback')
      .select('feedback_type')
      .eq('user_id', user.id)
      .lte('rating', 2);

    const commonIssues = negativeFeedback
      ? Array.from(new Set(negativeFeedback.map(f => f.feedback_type)))
      : [];

    return {
      avgResponseTime,
      avgRating: Number(avgRating),
      totalMessages: totalMessages || 0,
      totalSessions: totalSessions || 0,
      satisfactionRate,
      commonIssues,
    };
  } catch (error) {
    log.error('Erro ao obter estatísticas', error);
    return null;
  }
}

/**
 * Registra tempo de resposta
 */
export async function recordResponseTime(
  sessionId: string,
  responseTimeMs: number
): Promise<void> {
  await recordMetric(sessionId, {
    name: 'response_time',
    value: responseTimeMs,
    metadata: { unit: 'milliseconds' },
  });
}

/**
 * Registra tokens usados
 */
export async function recordTokenUsage(
  sessionId: string,
  tokens: number,
  model: string
): Promise<void> {
  await recordMetric(sessionId, {
    name: 'tokens_used',
    value: tokens,
    metadata: { model },
  });
}
