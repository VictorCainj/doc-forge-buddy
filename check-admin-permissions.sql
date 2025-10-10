-- ========================================
-- VERIFICAR PERMISSÕES DE ADMINISTRADOR
-- ========================================
-- Execute este script no SQL Editor do Supabase para verificar
-- se o administrador tem permissão para excluir contratos

-- 1. Verificar se o usuário atual é admin
SELECT 
  p.role,
  p.email,
  p.full_name,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Usuário é administrador'
    ELSE '❌ Usuário não é administrador'
  END as status_admin
FROM profiles p
WHERE p.user_id = auth.uid();

-- 2. Verificar políticas RLS da tabela saved_terms
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'saved_terms'
ORDER BY policyname;

-- 3. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS desabilitado'
  END as status_rls
FROM pg_tables 
WHERE tablename = 'saved_terms';

-- 4. Testar permissão de DELETE (se necessário, execute como admin)
-- IMPORTANTE: Execute apenas se você for administrador
SELECT 
  'Teste de permissão DELETE' as teste,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN '✅ Usuário tem permissão para testar DELETE'
    ELSE '❌ Usuário não tem permissão para testar DELETE'
  END as resultado;
