# 🛠️ Setup do Painel Admin - README

## ⚠️ IMPORTANTE: Leia Antes de Usar

O painel admin requer que você **execute as migrations SQL** no Supabase antes de funcionar.

---

## 🚀 Quick Start (3 minutos)

### Opção 1: Via Supabase Studio (Recomendado)

1. **Acesse:** [https://app.supabase.com](https://app.supabase.com) → Seu Projeto → SQL Editor

2. **Execute cada migration na ordem:**
   - `supabase/migrations/20250109_create_audit_system.sql`
   - `supabase/migrations/20250109_add_2fa_support.sql`
   - `supabase/migrations/20250109_create_permissions_system.sql`

3. **Recarregue** sua aplicação (F5)

✅ **Pronto!** Acesse `/admin`

---

### Opção 2: Via CLI (Mais Rápido)

```bash
npx supabase db push
```

---

## 🎯 O Que as Migrations Fazem?

### Migration 1: Sistema de Auditoria

- ✅ Cria tabela `audit_logs`
- ✅ Cria 4 triggers automáticos
- ✅ Cria funções `log_audit_event`, `get_audit_logs`, `get_audit_stats`

### Migration 2: Segurança Avançada

- ✅ Cria suporte para 2FA
- ✅ Cria gerenciamento de sessões
- ✅ Cria controle de tentativas de login
- ✅ Cria histórico de senhas

### Migration 3: Permissões Granulares

- ✅ Cria sistema de permissões (38+ permissões)
- ✅ Cria roles customizadas
- ✅ Cria funções `user_has_permission`, `get_user_permissions`

---

## 📊 Recursos do Painel

### 5 Abas Principais:

1. **👥 Usuários** - Gerenciar usuários e roles
2. **✏️ Edição em Massa** - Editar múltiplos registros
3. **🔍 Auditoria** (NOVO) - Logs completos de ações
4. **📊 Relatórios** (NOVO) - Relatórios administrativos
5. **🗂️ Integridade** (NOVO) - Verificar integridade de dados

---

## 🐛 Problemas Comuns

### ❌ Erro: "404 Not Found" ou "Function not found"

**Causa:** Migrations não aplicadas

**Solução:** Veja `SOLUCAO_RAPIDA.md` ou `PASSO_A_PASSO_APLICAR_MIGRATIONS.md`

---

### ❌ Erro: "Permission denied"

**Solução:**

```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
```

---

### ❌ Erro: "Relation already exists"

**Solução:** Normal se você já executou antes. Continue com as próximas migrations.

---

## 📋 Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar tabelas (deve retornar 7)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'audit_logs', 'user_sessions', 'login_attempts',
  'password_history', 'permissions', 'role_permissions',
  'user_permissions'
);

-- Verificar funções (deve retornar 11+)
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%audit%'
OR routine_name LIKE '%permission%'
OR routine_name LIKE '%session%';

-- Verificar permissões (deve retornar 38+)
SELECT COUNT(*) FROM public.permissions;
```

**Resultado esperado:**

- ✅ 7 tabelas
- ✅ 11+ funções
- ✅ 38+ permissões

---

## 📚 Documentação Completa

| Arquivo                                   | Descrição                 |
| ----------------------------------------- | ------------------------- |
| `SOLUCAO_RAPIDA.md`                       | Solução em 3 passos       |
| `PASSO_A_PASSO_APLICAR_MIGRATIONS.md`     | Guia detalhado com prints |
| `CORRIGIR_ERRO_RPC.md`                    | Solução de problemas      |
| `verificar_instalacao.sql`                | Script de verificação     |
| `FORTALECIMENTO_PAINEL_ADMIN_COMPLETO.md` | Documentação técnica      |
| `GUIA_INICIO_RAPIDO_ADMIN.md`             | Manual de uso             |

---

## 🔐 Configurar Usuário Admin

Após aplicar as migrations:

```sql
-- Atualizar seu usuário para admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';

-- Verificar
SELECT email, role, is_active FROM public.profiles
WHERE email = 'seu-email@exemplo.com';
```

---

## ✅ Checklist de Setup

- [ ] Executei as 3 migrations no Supabase
- [ ] Executei o script de verificação
- [ ] Todas as verificações passaram (✅)
- [ ] Configurei meu usuário como admin
- [ ] Recarreguei a aplicação (F5)
- [ ] Acessei `/admin` com sucesso
- [ ] Testei a aba Auditoria
- [ ] Testei a aba Relatórios
- [ ] Testei a aba Integridade

---

## 🎉 Tudo Pronto!

Agora você tem acesso a:

- ✅ **Auditoria completa** - Rastreamento de todas as ações
- ✅ **Relatórios** - Análises do sistema
- ✅ **Segurança avançada** - 2FA, sessões, senhas robustas
- ✅ **Validação** - CPF, CNPJ, telefone, email
- ✅ **Integridade** - Verificação automática de dados
- ✅ **Permissões** - Controle granular de acesso

---

## 📞 Precisa de Ajuda?

1. Consulte `SOLUCAO_RAPIDA.md` para problemas comuns
2. Veja `CORRIGIR_ERRO_RPC.md` para erros específicos
3. Execute `verificar_instalacao.sql` para diagnóstico

---

## 📈 Estatísticas da Implementação

- **7 tabelas** criadas
- **11+ funções RPC** implementadas
- **4 triggers** automáticos
- **38+ permissões** configuradas
- **~2.500 linhas** de código TypeScript
- **~900 linhas** de SQL

---

**Desenvolvido com excelência técnica** 🚀  
**Versão:** 2.0  
**Data:** 09 de Janeiro de 2025
