-- Tabela para base de conhecimento com RAG
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  source_type TEXT CHECK (source_type IN ('document', 'contract', 'manual', 'note', 'other')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca vetorial
CREATE INDEX knowledge_entries_embedding_idx ON knowledge_entries 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices para filtros
CREATE INDEX knowledge_entries_user_id_idx ON knowledge_entries(user_id);
CREATE INDEX knowledge_entries_source_type_idx ON knowledge_entries(source_type);
CREATE INDEX knowledge_entries_created_at_idx ON knowledge_entries(created_at DESC);

-- Função para buscar conhecimento relevante
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id_filter uuid DEFAULT NULL,
  source_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  entry_id uuid,
  title text,
  content text,
  similarity float,
  source_type text,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ke.id as entry_id,
    ke.title,
    ke.content,
    1 - (ke.embedding <=> query_embedding) as similarity,
    ke.source_type,
    ke.metadata
  FROM knowledge_entries ke
  WHERE 
    1 - (ke.embedding <=> query_embedding) > match_threshold
    AND (user_id_filter IS NULL OR ke.user_id = user_id_filter)
    AND (source_type_filter IS NULL OR ke.source_type = source_type_filter)
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_knowledge_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_entry_timestamp
BEFORE UPDATE ON knowledge_entries
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_entry_timestamp();

-- RLS Policies
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge entries"
  ON knowledge_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own knowledge entries"
  ON knowledge_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own knowledge entries"
  ON knowledge_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own knowledge entries"
  ON knowledge_entries FOR DELETE
  USING (user_id = auth.uid());
