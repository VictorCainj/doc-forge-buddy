-- ========================================
-- CORREÇÃO DO ERRO DE TRIGGER SAVED_TERMS
-- ========================================
-- Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute

-- 1. Remover todos os triggers problemáticos de saved_terms
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Listar e remover todos os triggers da tabela saved_terms
  FOR r IN (
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'saved_terms'
      AND NOT tgisinternal
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON saved_terms CASCADE', r.tgname);
    RAISE NOTICE 'Trigger % removido de saved_terms', r.tgname;
  END LOOP;
END $$;

-- 2. Verificar se foi bem-sucedido
SELECT 
  'Triggers removidos com sucesso!' as status,
  COUNT(*) as triggers_restantes
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'saved_terms'
  AND NOT tgisinternal;

-- 3. Confirmar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_terms'
ORDER BY ordinal_position;

