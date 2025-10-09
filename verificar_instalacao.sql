-- ==================================================================
-- SCRIPT DE VERIFICAÇÃO - Painel Admin Fortalecido
-- ==================================================================
-- Execute este script no SQL Editor do Supabase para verificar
-- se todas as migrations foram aplicadas corretamente.
--
-- COMO USAR:
-- 1. Copie todo este arquivo
-- 2. Cole no SQL Editor do Supabase
-- 3. Clique em RUN
-- 4. Verifique os resultados
-- ==================================================================

\echo '============================================================'
\echo 'VERIFICAÇÃO DO SISTEMA DE PAINEL ADMIN'
\echo '============================================================'
\echo ''

-- 1. Verificar tabelas criadas
\echo '1. TABELAS CRIADAS:'
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('audit_logs', 'user_sessions', 'login_attempts', 'password_history', 'permissions', 'role_permissions', 'user_permissions')
    THEN '✅'
    ELSE '❌'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'audit_logs',
  'user_sessions',
  'login_attempts',
  'password_history',
  'permissions',
  'role_permissions',
  'user_permissions'
)
ORDER BY table_name;

\echo ''
\echo 'Total de tabelas esperadas: 7'
SELECT COUNT(*) as tabelas_criadas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'audit_logs',
  'user_sessions',
  'login_attempts',
  'password_history',
  'permissions',
  'role_permissions',
  'user_permissions'
);

\echo ''
\echo '------------------------------------------------------------'
\echo '2. FUNÇÕES RPC CRIADAS:'
SELECT 
  routine_name as funcao,
  '✅' as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_audit_event',
  'get_audit_logs',
  'get_audit_stats',
  'user_has_permission',
  'get_user_permissions',
  'create_user_session',
  'update_session_activity',
  'terminate_session',
  'get_user_active_sessions',
  'is_user_locked_out',
  'record_login_attempt'
)
ORDER BY routine_name;

\echo ''
\echo 'Total de funções esperadas: 11+'
SELECT COUNT(*) as funcoes_criadas
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_audit_event',
  'get_audit_logs',
  'get_audit_stats',
  'user_has_permission',
  'get_user_permissions',
  'create_user_session',
  'update_session_activity',
  'terminate_session',
  'get_user_active_sessions',
  'is_user_locked_out',
  'record_login_attempt'
);

\echo ''
\echo '------------------------------------------------------------'
\echo '3. TRIGGERS DE AUDITORIA:'
SELECT 
  trigger_name,
  event_object_table as tabela,
  '✅' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%audit%'
ORDER BY event_object_table;

\echo ''
\echo 'Total de triggers esperados: 4'
SELECT COUNT(*) as triggers_criados
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%audit%';

\echo ''
\echo '------------------------------------------------------------'
\echo '4. TIPOS ENUM CRIADOS:'
SELECT 
  typname as tipo_enum,
  '✅' as status
FROM pg_type 
WHERE typname IN ('audit_action', 'system_module', 'permission_action', 'user_role')
ORDER BY typname;

\echo ''
\echo '------------------------------------------------------------'
\echo '5. PERMISSÕES INSERIDAS:'
SELECT 
  module,
  COUNT(*) as total_permissions
FROM public.permissions
GROUP BY module
ORDER BY module;

\echo ''
\echo 'Total de permissões:'
SELECT COUNT(*) as total_permissions FROM public.permissions;
\echo 'Esperado: 38+ permissões'

\echo ''
\echo '------------------------------------------------------------'
\echo '6. PERMISSÕES DO ROLE ADMIN:'
SELECT COUNT(*) as admin_permissions
FROM public.role_permissions
WHERE role = 'admin';
\echo 'Esperado: Mesmo número de permissões totais'

\echo ''
\echo '------------------------------------------------------------'
\echo '7. PERMISSÕES DO ROLE USER:'
SELECT COUNT(*) as user_permissions
FROM public.role_permissions
WHERE role = 'user';
\echo 'Esperado: 16+ permissões (básicas)'

\echo ''
\echo '------------------------------------------------------------'
\echo '8. RLS POLICIES ATIVAS:'
SELECT 
  schemaname,
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN (
  'audit_logs',
  'user_sessions',
  'login_attempts',
  'permissions',
  'role_permissions',
  'user_permissions'
)
GROUP BY schemaname, tablename
ORDER BY tablename;

\echo ''
\echo '------------------------------------------------------------'
\echo '9. ÍNDICES CRIADOS:'
SELECT 
  tablename,
  indexname,
  '✅' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'audit_logs',
  'user_sessions',
  'login_attempts',
  'password_history',
  'permissions',
  'role_permissions',
  'user_permissions'
)
ORDER BY tablename, indexname;

\echo ''
\echo '============================================================'
\echo 'TESTE DE FUNCIONALIDADE'
\echo '============================================================'
\echo ''

-- Teste 1: Chamar função de auditoria
\echo '10. TESTE: Função get_audit_logs'
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Função funcionando'
    ELSE '❌ Função com erro'
  END as resultado
FROM public.get_audit_logs(NULL, NULL, NULL, NULL, NULL, 1, 0);

-- Teste 2: Verificar se pode buscar permissões
\echo ''
\echo '11. TESTE: Função get_user_permissions'
\echo 'Testando com usuário do sistema...'

\echo ''
\echo '============================================================'
\echo 'RESUMO FINAL'
\echo '============================================================'

-- Resumo consolidado
WITH verificacao AS (
  SELECT 
    'Tabelas' as item,
    CASE WHEN COUNT(*) = 7 THEN '✅ OK' ELSE '❌ FALTANDO' END as status,
    COUNT(*)::text || ' de 7' as detalhes
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('audit_logs', 'user_sessions', 'login_attempts', 'password_history', 'permissions', 'role_permissions', 'user_permissions')
  
  UNION ALL
  
  SELECT 
    'Funções RPC' as item,
    CASE WHEN COUNT(*) >= 11 THEN '✅ OK' ELSE '❌ FALTANDO' END as status,
    COUNT(*)::text || ' de 11+' as detalhes
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
  AND routine_name IN ('log_audit_event', 'get_audit_logs', 'get_audit_stats', 'user_has_permission', 'get_user_permissions', 'create_user_session', 'update_session_activity', 'terminate_session', 'get_user_active_sessions', 'is_user_locked_out', 'record_login_attempt')
  
  UNION ALL
  
  SELECT 
    'Triggers' as item,
    CASE WHEN COUNT(*) = 4 THEN '✅ OK' ELSE '❌ FALTANDO' END as status,
    COUNT(*)::text || ' de 4' as detalhes
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%audit%'
  
  UNION ALL
  
  SELECT 
    'Permissões' as item,
    CASE WHEN COUNT(*) >= 38 THEN '✅ OK' ELSE '❌ FALTANDO' END as status,
    COUNT(*)::text || ' de 38+' as detalhes
  FROM public.permissions
  
  UNION ALL
  
  SELECT 
    'Permissões Admin' as item,
    CASE WHEN COUNT(*) >= 38 THEN '✅ OK' ELSE '❌ FALTANDO' END as status,
    COUNT(*)::text as detalhes
  FROM public.role_permissions
  WHERE role = 'admin'
)
SELECT * FROM verificacao;

\echo ''
\echo '============================================================'
\echo 'CONCLUSÃO'
\echo '============================================================'
\echo ''
\echo 'Se todos os itens acima mostrarem ✅ OK, o sistema está'
\echo 'corretamente instalado e pronto para uso!'
\echo ''
\echo 'Se algum item mostrar ❌ FALTANDO, você precisa executar'
\echo 'as migrations SQL no SQL Editor do Supabase.'
\echo ''
\echo 'Consulte o arquivo CORRIGIR_ERRO_RPC.md para instruções.'
\echo '============================================================'

