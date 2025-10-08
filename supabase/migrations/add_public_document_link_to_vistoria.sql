-- Adicionar campo contract_id na tabela public_documents se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_documents' 
    AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE public_documents 
    ADD COLUMN contract_id UUID REFERENCES saved_terms(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_public_documents_contract_id ON public_documents(contract_id);
  END IF;
END $$;

-- Adicionar campo public_document_id na tabela vistoria_analises
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vistoria_analises' 
    AND column_name = 'public_document_id'
  ) THEN
    ALTER TABLE vistoria_analises 
    ADD COLUMN public_document_id UUID REFERENCES public_documents(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_vistoria_analises_public_document_id ON vistoria_analises(public_document_id);
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN public_documents.contract_id IS 'ID do contrato relacionado ao documento público';
COMMENT ON COLUMN vistoria_analises.public_document_id IS 'ID do documento público gerado para esta análise de vistoria';
