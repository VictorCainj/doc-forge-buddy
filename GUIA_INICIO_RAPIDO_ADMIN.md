# 🚀 Guia de Início Rápido - Painel Admin Fortalecido

## 📋 Pré-requisitos

- ✅ Supabase configurado
- ✅ Acesso ao banco de dados PostgreSQL
- ✅ Usuário admin criado no sistema
- ✅ Node.js e npm instalados
- ✅ Projeto rodando localmente

---

## 1️⃣ Aplicar Migrations do Banco de Dados

### Opção A: Usando Supabase CLI (Recomendado)

```bash
# Na raiz do projeto
npx supabase migration up
```

### Opção B: Manualmente via Supabase Studio

1. Acesse o Supabase Studio (https://app.supabase.com)
2. Navegue até seu projeto
3. Vá em **SQL Editor**
4. Execute os arquivos na ordem:

#### Migration 1: Sistema de Auditoria

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20250109_create_audit_system.sql
```

#### Migration 2: Suporte 2FA e Sessões

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20250109_add_2fa_support.sql
```

#### Migration 3: Sistema de Permissões

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20250109_create_permissions_system.sql
```

### Opção C: Via psql (Para usuários avançados)

```bash
# Conectar ao banco
psql -h db.xxxxx.supabase.co -U postgres -d postgres

# Executar migrations
\i supabase/migrations/20250109_create_audit_system.sql
\i supabase/migrations/20250109_add_2fa_support.sql
\i supabase/migrations/20250109_create_permissions_system.sql
```

---

## 2️⃣ Verificar Instalação

Execute no SQL Editor do Supabase:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name
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

-- Verificar permissões inseridas
SELECT COUNT(*) as total_permissions FROM public.permissions;
-- Deve retornar aproximadamente 38 permissões

-- Verificar permissões do admin
SELECT COUNT(*) as admin_permissions
FROM public.role_permissions
WHERE role = 'admin';
-- Deve retornar todas as permissões
```

---

## 3️⃣ Criar/Configurar Usuário Admin

### Se ainda não tem um usuário admin:

```sql
-- 1. Criar usuário via Supabase Auth (use o Studio ou API)
-- 2. Depois, atualizar o profile para admin:

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

### Verificar se você é admin:

```sql
SELECT id, email, full_name, role, is_active
FROM public.profiles
WHERE email = 'seu-email@exemplo.com';
```

---

## 4️⃣ Testar o Sistema

### 1. Acessar o Painel Admin

```
http://localhost:5173/admin
```

### 2. Verificar as Abas

Você deve ver 5 abas:

- ✅ Usuários
- ✅ Edição em Massa
- ✅ Auditoria (NOVO)
- ✅ Relatórios (NOVO)
- ✅ Integridade (NOVO)

### 3. Testar Auditoria

1. Acesse a aba "Auditoria"
2. Você verá logs automáticos de:
   - Criação de usuários
   - Modificações em contratos
   - Alterações em prestadores
   - Ações administrativas

3. Teste os filtros:
   - Filtrar por ação (CREATE, UPDATE, DELETE)
   - Filtrar por entidade
   - Filtrar por período

4. Clique em "Ver Detalhes" em um log
5. Tente exportar para CSV

### 4. Testar Relatórios

1. Acesse a aba "Relatórios"
2. Selecione "Relatório de Usuários"
3. Escolha "Este Mês"
4. Clique em "Gerar Relatório"
5. Veja as estatísticas
6. Exporte para CSV

### 5. Testar Verificação de Integridade

1. Acesse a aba "Integridade"
2. Clique em "Executar Verificação"
3. Aguarde a conclusão (5-10 segundos)
4. Veja os problemas encontrados (se houver)
5. Exporte o relatório

---

## 5️⃣ Funcionalidades Disponíveis

### 🔍 Sistema de Auditoria

**O que faz:**

- Registra TODAS as ações no sistema automaticamente
- Armazena dados antes e depois das alterações
- Captura IP e User Agent
- Permite filtrar e buscar logs

**Como usar:**

```typescript
// Registrar ação manualmente (opcional)
import { useLogAuditEvent } from '@/hooks/useAuditLog';

const logAudit = useLogAuditEvent();

await logAudit.mutateAsync({
  action: 'EXPORT',
  entity_type: 'contracts',
  metadata: { count: 100 },
});
```

### 📊 Sistema de Relatórios

**Relatórios disponíveis:**

- Usuários (atividade, crescimento, status)
- Contratos (total, por período)
- Prestadores (especialidades, cadastros)
- Auditoria (ações, eventos)

**Como usar:**

```typescript
import { ReportGenerator } from '@/features/reports/ReportGenerator';

const report = await ReportGenerator.generate({
  type: 'users',
  period: 'month',
  format: 'csv',
});
```

### 🔒 Sistema de Segurança

**Recursos:**

- Validação de senhas robusta (12+ caracteres)
- Verificação de senhas comprometidas
- Gerenciamento de sessões
- Histórico de senhas (últimas 5)
- Rate limiting preparado

**Como usar:**

```typescript
import { validatePassword } from '@/utils/passwordPolicy';

const result = validatePassword('MinhaSenh@123');
// result: { isValid: true, errors: [], strength: 'strong', score: 85 }
```

### ✅ Validação de Dados

**Validadores disponíveis:**

- CPF, CNPJ
- Telefone, CEP
- Email, URL
- Datas

**Como usar:**

```typescript
import { validateCPF, formatCPF } from '@/utils/dataValidation';

const result = validateCPF('12345678900');
if (result.isValid) {
  const formatted = formatCPF('12345678900'); // 123.456.789-00
}
```

### 🗂️ Verificação de Integridade

**O que verifica:**

- Usuários sem profile
- Contratos órfãos
- Prestadores órfãos
- Emails duplicados
- Dados inválidos

**Como usar:**

```typescript
import { runFullIntegrityCheck } from '@/utils/dataIntegrityChecker';

const report = await runFullIntegrityCheck();
console.log(`Problemas encontrados: ${report.totalIssues}`);
```

### 🔐 Sistema de Permissões

**Módulos disponíveis:**

- users, contracts, prestadores, vistorias
- documents, reports, audit
- settings, admin

**Ações disponíveis:**

- view, create, update, delete
- export, import, bulk_edit
- manage_permissions

**Como usar:**

```typescript
import { hasPermission } from '@/utils/permissions';

const canEdit = await hasPermission(userId, 'contracts', 'update');
if (canEdit) {
  // Permitir edição
}
```

---

## 6️⃣ Configurações Avançadas

### Alterar Período de Expiração de Senha

```sql
-- Atualizar política de senha (padrão: 90 dias)
-- Editar em src/utils/passwordPolicy.ts:
const DEFAULT_POLICY: PasswordPolicy = {
  maxAge: 90, // Altere aqui
  // ...
};
```

### Alterar Limite de Sessões Simultâneas

```sql
-- Editar a função create_user_session
-- Altere a variável v_max_sessions (padrão: 5)
CREATE OR REPLACE FUNCTION public.create_user_session(...)
DECLARE
  v_max_sessions INT := 10; -- Altere aqui
```

### Configurar Rate Limiting

```sql
-- Editar a função is_user_locked_out
-- Parâmetros padrão: 5 tentativas em 15 minutos
SELECT public.is_user_locked_out(
  'email@exemplo.com',
  5,  -- Máximo de tentativas
  15  -- Minutos de lockout
);
```

---

## 7️⃣ Solução de Problemas

### Problema: "RPC function not found"

**Solução:**

```sql
-- Verificar se as funções foram criadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%audit%';
```

### Problema: "Permission denied"

**Solução:**

```sql
-- Verificar RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('audit_logs', 'permissions');

-- Verificar se você é admin
SELECT role FROM public.profiles WHERE user_id = auth.uid();
```

### Problema: Auditoria não registra

**Solução:**

```sql
-- Verificar se os triggers estão ativos
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%audit%';
```

### Problema: Permissões não funcionam

**Solução:**

```sql
-- Reinserir permissões padrão
SELECT public.insert_default_permissions();
SELECT public.grant_all_permissions_to_admin();
SELECT public.grant_basic_permissions_to_user();
```

---

## 8️⃣ Comandos Úteis

### Limpar Dados de Teste

```sql
-- ⚠️ CUIDADO: Isso apaga todos os logs
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.user_sessions CASCADE;
TRUNCATE TABLE public.login_attempts CASCADE;
```

### Estatísticas do Sistema

```sql
-- Total de logs de auditoria
SELECT COUNT(*) FROM public.audit_logs;

-- Logs por ação
SELECT action, COUNT(*) as total
FROM public.audit_logs
GROUP BY action
ORDER BY total DESC;

-- Usuários mais ativos
SELECT
  p.email,
  COUNT(al.id) as actions_count
FROM public.audit_logs al
JOIN public.profiles p ON p.user_id = al.user_id
GROUP BY p.email
ORDER BY actions_count DESC
LIMIT 10;

-- Sessões ativas
SELECT COUNT(*) FROM public.user_sessions
WHERE is_active = true AND expires_at > now();
```

### Backup de Logs

```bash
# Exportar logs de auditoria
psql -h seu-host -U postgres -d postgres -c "COPY (SELECT * FROM public.audit_logs) TO STDOUT WITH CSV HEADER" > audit_backup.csv
```

---

## 9️⃣ Melhores Práticas

### 1. Segurança

- ✅ Sempre use senhas fortes (12+ caracteres)
- ✅ Revise os logs de auditoria semanalmente
- ✅ Execute verificação de integridade mensalmente
- ✅ Exporte logs críticos regularmente (backup)

### 2. Performance

- ✅ Limpe logs antigos periodicamente (após 1 ano)
- ✅ Monitore o tamanho da tabela audit_logs
- ✅ Use índices apropriadamente

### 3. Manutenção

- ✅ Gere relatórios mensais para análise
- ✅ Verifique integridade antes de grandes migrações
- ✅ Documente ações críticas no sistema

---

## 🎉 Pronto!

Seu painel de administração está fortalecido e pronto para uso!

### Recursos Implementados:

✅ Auditoria completa  
✅ Relatórios administrativos  
✅ Segurança avançada  
✅ Validação de dados  
✅ Verificação de integridade  
✅ Permissões granulares

### Próximos Passos Sugeridos:

1. Explore cada aba do painel
2. Gere seu primeiro relatório
3. Configure permissões para outros usuários
4. Implemente testes automatizados
5. Configure monitoramento e alertas

---

## 📞 Suporte

Em caso de dúvidas:

1. Consulte o arquivo `FORTALECIMENTO_PAINEL_ADMIN_COMPLETO.md`
2. Revise a documentação inline nos arquivos TypeScript
3. Verifique os comentários SQL nas migrations
4. Execute os comandos de diagnóstico desta

página

---

**Versão:** 2.0  
**Última Atualização:** 09 de Janeiro de 2025
