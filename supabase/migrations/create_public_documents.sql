-- Criar tabela para documentos públicos
CREATE TABLE IF NOT EXISTS public_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  html_content TEXT NOT NULL,
  title TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_public_documents_created_by ON public_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_public_documents_created_at ON public_documents(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public_documents ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura pública (qualquer pessoa pode visualizar)
CREATE POLICY "Permitir leitura pública de documentos"
  ON public_documents
  FOR SELECT
  USING (true);

-- Política: Apenas usuários autenticados podem inserir
CREATE POLICY "Permitir inserção para usuários autenticados"
  ON public_documents
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Política: Apenas o criador pode atualizar
CREATE POLICY "Permitir atualização apenas pelo criador"
  ON public_documents
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Política: Apenas o criador pode deletar
CREATE POLICY "Permitir exclusão apenas pelo criador"
  ON public_documents
  FOR DELETE
  USING (auth.uid() = created_by);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_public_documents_updated_at
  BEFORE UPDATE ON public_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public_documents IS 'Armazena documentos HTML que podem ser visualizados publicamente através de um link';
COMMENT ON COLUMN public_documents.id IS 'ID único do documento (UUID)';
COMMENT ON COLUMN public_documents.html_content IS 'Conteúdo HTML completo do documento';
COMMENT ON COLUMN public_documents.title IS 'Título do documento para identificação';
COMMENT ON COLUMN public_documents.created_by IS 'ID do usuário que criou o documento';
COMMENT ON COLUMN public_documents.created_at IS 'Data e hora de criação do documento';
COMMENT ON COLUMN public_documents.updated_at IS 'Data e hora da última atualização';
