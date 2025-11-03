-- Criar tabela para histórico de prompts
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_input TEXT NOT NULL,
  enhanced_prompt TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela para templates de prompts
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  description TEXT,
  prompt TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON prompt_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_history_favorite ON prompt_history(user_id, is_favorite) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_tags ON prompt_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_favorite ON prompt_templates(user_id, is_favorite) WHERE is_favorite = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompt_history_updated_at
  BEFORE UPDATE ON prompt_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para prompt_history
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompt history"
  ON prompt_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt history"
  ON prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt history"
  ON prompt_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt history"
  ON prompt_history FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para prompt_templates
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompt templates"
  ON prompt_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt templates"
  ON prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt templates"
  ON prompt_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt templates"
  ON prompt_templates FOR DELETE
  USING (auth.uid() = user_id);

