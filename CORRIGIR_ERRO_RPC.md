# 🔧 Correção de Erros RPC - Funções Não Encontradas

## ❌ Erro Identificado

```
POST https://...supabase.co/rest/v1/rpc/get_audit_logs 404 (Not Found)
Could not find the function public.log_audit_event in the schema cache
```

## 🎯 Causa do Problema

As **migrations SQL não foram aplicadas** no banco de dados do Supabase. As funções RPC necessárias ainda não existem no banco.

---

## ✅ Solução: Aplicar as Migrations

### Opção 1: Via Supabase Studio (Recomendado para iniciantes)

#### Passo 1: Acessar o SQL Editor

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query** (Nova Consulta)

#### Passo 2: Executar Migration 1 - Sistema de Auditoria

1. Abra o arquivo `supabase/migrations/20250109_create_audit_system.sql`
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a conclusão (deve aparecer "Success")

#### Passo 3: Executar Migration 2 - 2FA e Sessões

1. Abra o arquivo `supabase/migrations/20250109_add_2fa_support.sql`
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde a conclusão

#### Passo 4: Executar Migration 3 - Sistema de Permissões

1. Abra o arquivo `supabase/migrations/20250109_create_permissions_system.sql`
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde a conclusão

---

### Opção 2: Via Supabase CLI (Recomendado para desenvolvedores)

```bash
# Na raiz do projeto
npx supabase db push

# OU, se você tem o Supabase CLI instalado globalmente
supabase db push
```

---

### Opção 3: Via psql (Avançado)

```bash
# Conectar ao banco
psql -h db.XXXXX.supabase.co -U postgres -d postgres

# Executar cada migration
\i supabase/migrations/20250109_create_audit_system.sql
\i supabase/migrations/20250109_add_2fa_support.sql
\i supabase/migrations/20250109_create_permissions_system.sql

# Sair
\q
```

---

## 🔍 Verificar se as Migrations Foram Aplicadas

Execute este script no SQL Editor para verificar:

```sql
-- ==================================================================
-- SCRIPT DE VERIFICAÇÃO - Painel Admin
-- ==================================================================

-- 1. Verificar tabelas criadas
SELECT
  'Tabelas' as tipo,
  COUNT(*) as total,
  string_agg(table_name, ', ') as itens
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

-- 2. Verificar funções RPC criadas
SELECT
  'Funções RPC' as tipo,
  COUNT(*) as total,
  string_agg(routine_name, ', ') as itens
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_audit_event',
  'get_audit_logs',
  'get_audit_stats',
  'user_has_permission',
  'get_user_permissions',
  'create_user_session',
  'get_user_active_sessions'
);

-- 3. Verificar triggers de auditoria
SELECT
  'Triggers' as tipo,
  COUNT(*) as total,
  string_agg(trigger_name, ', ') as itens
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%audit%';

-- 4. Verificar permissões inseridas
SELECT
  'Permissões' as tipo,
  COUNT(*) as total,
  'Ver detalhes abaixo' as itens
FROM public.permissions;

-- 5. Detalhes das permissões por módulo
SELECT
  module,
  COUNT(*) as total_permissions
FROM public.permissions
GROUP BY module
ORDER BY module;

-- 6. Verificar permissões do admin
SELECT
  'Permissões Admin' as tipo,
  COUNT(*) as total,
  'Todas as permissões ativas' as itens
FROM public.role_permissions
WHERE role = 'admin';

-- ==================================================================
-- RESULTADO ESPERADO:
--
-- Tabelas: 7 tabelas
-- Funções RPC: 7+ funções
-- Triggers: 4 triggers (audit_*_changes)
-- Permissões: 38+ permissões
-- Permissões por módulo: 9 módulos
-- Permissões Admin: 38+ permissões
-- ==================================================================
```

### Resultado Esperado:

```
✅ Tabelas: 7 criadas
✅ Funções RPC: 7+ criadas
✅ Triggers: 4 criados
✅ Permissões: 38+ inseridas
✅ Permissões Admin: 38+ atribuídas
```

---

## 🧪 Testar as Funções

Após aplicar as migrations, teste se as funções funcionam:

```sql
-- Teste 1: Verificar se log_audit_event existe
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'log_audit_event';
-- Deve retornar 1 linha

-- Teste 2: Verificar se get_audit_logs existe
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'get_audit_logs';
-- Deve retornar 1 linha

-- Teste 3: Buscar logs de auditoria (pode retornar vazio se não há logs ainda)
SELECT * FROM public.get_audit_logs(
  NULL, -- user_id
  NULL, -- action
  NULL, -- entity_type
  NULL, -- start_date
  NULL, -- end_date
  10,   -- limit
  0     -- offset
);

-- Teste 4: Verificar permissões do seu usuário
SELECT * FROM public.get_user_permissions(auth.uid());
-- Deve retornar suas permissões
```

---

## 🚀 Após Aplicar as Migrations

1. **Recarregue a página** do painel admin (F5)
2. Acesse a aba **Auditoria** - deve funcionar agora
3. Acesse a aba **Relatórios** - deve funcionar agora
4. Acesse a aba **Integridade** - deve funcionar agora

---

## ⚠️ Problemas Comuns

### Erro: "permission denied for schema public"

**Solução:**

```sql
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
```

### Erro: "relation already exists"

**Solução:** Algumas tabelas já existem. Execute apenas as partes que faltam ou use `IF NOT EXISTS`.

### Erro: "type already exists"

**Solução:** Os tipos ENUM já existem. Pule a criação dos tipos e continue com as tabelas.

---

## 📝 Ordem Correta de Execução

**IMPORTANTE:** Execute as migrations na ordem:

1. ✅ `20250109_create_audit_system.sql` (PRIMEIRO)
2. ✅ `20250109_add_2fa_support.sql` (SEGUNDO)
3. ✅ `20250109_create_permissions_system.sql` (TERCEIRO)

---

## 🔄 Se Precisar Reverter (Cuidado!)

```sql
-- ⚠️ APENAS EM CASO DE ERRO CRÍTICO
-- Isso apaga TUDO relacionado às novas funcionalidades

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.login_attempts CASCADE;
DROP TABLE IF EXISTS public.password_history CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.user_permissions CASCADE;

DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS system_module CASCADE;
DROP TYPE IF EXISTS permission_action CASCADE;

DROP FUNCTION IF EXISTS public.log_audit_event CASCADE;
DROP FUNCTION IF EXISTS public.get_audit_logs CASCADE;
DROP FUNCTION IF EXISTS public.get_audit_stats CASCADE;
DROP FUNCTION IF EXISTS public.user_has_permission CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions CASCADE;

-- Depois re-execute as migrations do zero
```

---

## ✅ Checklist Final

Após aplicar as migrations, verifique:

- [ ] Tabelas criadas (7 tabelas)
- [ ] Funções RPC criadas (7+ funções)
- [ ] Triggers ativos (4 triggers)
- [ ] Permissões inseridas (38+ permissões)
- [ ] Permissões do admin atribuídas
- [ ] Página admin recarregada
- [ ] Aba Auditoria funcionando
- [ ] Aba Relatórios funcionando
- [ ] Aba Integridade funcionando

---

## 📞 Ainda com Problemas?

Se após seguir todos os passos ainda houver erros:

1. Copie a mensagem de erro completa
2. Execute o script de verificação acima
3. Compartilhe os resultados para análise

---

**Versão:** 1.0  
**Última Atualização:** 09 de Janeiro de 2025
