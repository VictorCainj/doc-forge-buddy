# ⚡ Solução Rápida - Erro RPC 404

## 🚨 Você está vendo este erro?

```
POST https://...supabase.co/rest/v1/rpc/get_audit_logs 404 (Not Found)
Could not find the function public.log_audit_event
```

---

## ✅ Solução em 3 Passos

### 1️⃣ Acesse o Supabase Studio

👉 [https://app.supabase.com](https://app.supabase.com) → Seu Projeto → **SQL Editor**

---

### 2️⃣ Execute as 3 Migrations

**📄 Migration 1:** Copie o conteúdo de `supabase/migrations/20250109_create_audit_system.sql`

- Cole no SQL Editor
- Clique em **RUN** ✅

**📄 Migration 2:** Copie o conteúdo de `supabase/migrations/20250109_add_2fa_support.sql`

- Cole no SQL Editor (nova query)
- Clique em **RUN** ✅

**📄 Migration 3:** Copie o conteúdo de `supabase/migrations/20250109_create_permissions_system.sql`

- Cole no SQL Editor (nova query)
- Clique em **RUN** ✅

---

### 3️⃣ Recarregue a Página

- Volte para sua aplicação
- Pressione **F5** para recarregar
- Pronto! ✨

---

## 🔍 Verificar se Funcionou

Execute no SQL Editor:

```sql
-- Deve retornar 7 tabelas
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'audit_logs', 'user_sessions', 'login_attempts',
  'password_history', 'permissions', 'role_permissions',
  'user_permissions'
);

-- Deve retornar 11+ funções
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_audit_event', 'get_audit_logs', 'get_audit_stats',
  'user_has_permission', 'get_user_permissions'
);
```

**Resultado esperado:**

- Primeira query: `7`
- Segunda query: `11` ou mais

---

## 📚 Guias Completos

Se precisar de mais detalhes:

1. **Passo a passo com prints:** `PASSO_A_PASSO_APLICAR_MIGRATIONS.md`
2. **Solução de problemas:** `CORRIGIR_ERRO_RPC.md`
3. **Script de verificação:** `verificar_instalacao.sql`

---

## 💡 Dica Rápida

**Via CLI (se preferir):**

```bash
cd seu-projeto
npx supabase db push
```

---

**Problema resolvido?** Volte ao painel admin e aproveite! 🎉
