-- Migration: create_prompt_learning_analytics_tables
-- Created at: 1762613781

-- Criar tabela para eventos de aprendizado
CREATE TABLE IF NOT EXISTS prompt_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'prompt_created', 'prompt_used', 'feedback_given', 'template_applied'
  prompt_original TEXT,
  prompt_enhanced TEXT,
  context_data JSONB DEFAULT '{}',
  effectiveness_score DECIMAL(3,2) DEFAULT 0.0, -- Score de 0-1 baseado no feedback
  completion_rate DECIMAL(3,2) DEFAULT 0.0, -- Taxa de completude da tarefa
  time_spent_seconds INTEGER DEFAULT 0, -- Tempo gasto em segundos
  user_satisfaction INTEGER, -- 1-5 scale
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela para analytics agregados
CREATE TABLE IF NOT EXISTS prompt_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_prompts_created INTEGER DEFAULT 0,
  total_prompts_used INTEGER DEFAULT 0,
  average_effectiveness DECIMAL(3,2) DEFAULT 0.0,
  average_completion_rate DECIMAL(3,2) DEFAULT 0.0,
  most_used_categories JSONB DEFAULT '{}', -- {category: count}
  most_effective_patterns JSONB DEFAULT '{}', -- {pattern: avg_effectiveness}
  improvement_suggestions TEXT[] DEFAULT '{}',
  benchmark_comparison JSONB DEFAULT '{}', -- Comparação com outros usuários
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela para padrões aprendidos
CREATE TABLE IF NOT EXISTS prompt_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(50) NOT NULL, -- 'context_pattern', 'user_preference', 'effectiveness_pattern'
  pattern_data JSONB NOT NULL,
  frequency INTEGER DEFAULT 1,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.0,
  user_segment VARCHAR(100), -- 'beginner', 'intermediate', 'advanced'
  confidence_level DECIMAL(3,2) DEFAULT 0.0, -- Quão confiante o sistema está neste padrão
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela para benchmarks
CREATE TABLE IF NOT EXISTS prompt_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  metric_name VARCHAR(100) NOT NULL, -- 'effectiveness', 'completion_rate', 'user_satisfaction'
  user_value DECIMAL(3,2),
  benchmark_value DECIMAL(3,2),
  percentile_rank INTEGER, -- 1-100
  comparison_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_learning_events_user_id ON prompt_learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_session_id ON prompt_learning_events(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_action_type ON prompt_learning_events(action_type);
CREATE INDEX IF NOT EXISTS idx_learning_events_created_at ON prompt_learning_events(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_events_effectiveness ON prompt_learning_events(effectiveness_score);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON prompt_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON prompt_analytics(date);

CREATE INDEX IF NOT EXISTS idx_patterns_type ON prompt_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_effectiveness ON prompt_patterns(effectiveness_score);

-- Triggers para updated_at
CREATE TRIGGER update_prompt_analytics_updated_at
  BEFORE UPDATE ON prompt_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_patterns_updated_at
  BEFORE UPDATE ON prompt_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE prompt_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_benchmarks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para prompt_learning_events
CREATE POLICY "Users can view their own learning events"
  ON prompt_learning_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning events"
  ON prompt_learning_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning events"
  ON prompt_learning_events FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para prompt_analytics
CREATE POLICY "Users can view their own analytics"
  ON prompt_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON prompt_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON prompt_analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para prompt_patterns (leitura pública, escrita restrita)
CREATE POLICY "Anyone can view active patterns"
  ON prompt_patterns FOR SELECT
  USING (is_active = true);

-- Políticas RLS para prompt_benchmarks (leitura pública)
CREATE POLICY "Anyone can view benchmarks"
  ON prompt_benchmarks FOR SELECT
  USING (true);;