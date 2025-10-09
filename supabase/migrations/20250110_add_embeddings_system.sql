-- Habilitar extensão vector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para armazenar embeddings de mensagens do chat
CREATE TABLE chat_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca vetorial eficiente
CREATE INDEX chat_embeddings_vector_idx ON chat_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice para busca por message_id
CREATE INDEX chat_embeddings_message_id_idx ON chat_embeddings(message_id);

-- Função para buscar mensagens similares
CREATE OR REPLACE FUNCTION search_similar_messages(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  message_id uuid,
  content text,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id as message_id,
    cm.content,
    1 - (ce.embedding <=> query_embedding) as similarity,
    cm.created_at
  FROM chat_embeddings ce
  JOIN chat_messages cm ON ce.message_id = cm.id
  JOIN chat_sessions cs ON cm.session_id = cs.id
  WHERE 
    1 - (ce.embedding <=> query_embedding) > match_threshold
    AND (user_id_filter IS NULL OR cs.user_id = user_id_filter)
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS Policies
ALTER TABLE chat_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own embeddings"
  ON chat_embeddings FOR SELECT
  USING (
    message_id IN (
      SELECT cm.id FROM chat_messages cm
      JOIN chat_sessions cs ON cm.session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own embeddings"
  ON chat_embeddings FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT cm.id FROM chat_messages cm
      JOIN chat_sessions cs ON cm.session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );
