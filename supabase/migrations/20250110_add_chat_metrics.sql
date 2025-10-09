-- Tabela para feedback das mensagens
CREATE TABLE chat_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT CHECK (feedback_type IN ('helpful', 'unhelpful', 'incorrect', 'incomplete', 'excellent')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para métricas do chat
CREATE TABLE chat_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX chat_feedback_message_id_idx ON chat_feedback(message_id);
CREATE INDEX chat_feedback_user_id_idx ON chat_feedback(user_id);
CREATE INDEX chat_feedback_created_at_idx ON chat_feedback(created_at DESC);

CREATE INDEX chat_metrics_session_id_idx ON chat_metrics(session_id);
CREATE INDEX chat_metrics_user_id_idx ON chat_metrics(user_id);
CREATE INDEX chat_metrics_metric_name_idx ON chat_metrics(metric_name);
CREATE INDEX chat_metrics_created_at_idx ON chat_metrics(created_at DESC);

-- Função para calcular estatísticas de satisfação
CREATE OR REPLACE FUNCTION get_user_satisfaction_stats(user_id_param uuid)
RETURNS TABLE (
  avg_rating numeric,
  total_feedback bigint,
  positive_feedback bigint,
  negative_feedback bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating), 2) as avg_rating,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE rating >= 4) as positive_feedback,
    COUNT(*) FILTER (WHERE rating <= 2) as negative_feedback
  FROM chat_feedback
  WHERE user_id = user_id_param;
END;
$$;

-- RLS Policies para chat_feedback
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON chat_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feedback"
  ON chat_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies para chat_metrics
ALTER TABLE chat_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
  ON chat_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own metrics"
  ON chat_metrics FOR INSERT
  WITH CHECK (user_id = auth.uid());
