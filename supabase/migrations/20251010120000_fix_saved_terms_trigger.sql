-- Remover trigger de auditoria problemático da tabela saved_terms
-- O trigger estava tentando acessar o campo 'email' que não existe nesta tabela

-- Verificar se existe trigger de auditoria
DO $$
BEGIN
  -- Remover trigger se existir
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'audit_saved_terms_changes'
  ) THEN
    DROP TRIGGER IF EXISTS audit_saved_terms_changes ON saved_terms;
    RAISE NOTICE 'Trigger audit_saved_terms_changes removido de saved_terms';
  END IF;

  -- Remover outros possíveis triggers de auditoria
  DROP TRIGGER IF EXISTS audit_trigger ON saved_terms;
  DROP TRIGGER IF EXISTS saved_terms_audit ON saved_terms;
  DROP TRIGGER IF EXISTS saved_terms_audit_trigger ON saved_terms;
END $$;

-- Adicionar comentário na tabela
COMMENT ON TABLE saved_terms IS 'Tabela de termos e contratos salvos - trigger de auditoria removido devido a conflito com estrutura da tabela';

