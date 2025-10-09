# Instalação do Sistema de Administração

## Passo a Passo Rápido

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará automaticamente a nova dependência `@radix-ui/react-switch`.

### 2. Executar Migração do Banco de Dados

**Opção A - Usando Supabase CLI (Recomendado):**

```bash
supabase db push
```

**Opção B - Manualmente via Dashboard:**

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "SQL Editor"
4. Copie e cole o conteúdo de `supabase/migrations/20250109_create_profiles_and_roles.sql`
5. Clique em "Run"

### 3. Criar Primeiro Usuário Admin

Após executar a migração, crie o primeiro admin:

**Opção A - Se já tiver usuário cadastrado:**

```sql
-- Execute no SQL Editor do Supabase
UPDATE profiles
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

**Opção B - Criar novo usuário admin:**

```sql
-- 1. Criar usuário (ou use a interface do Supabase Auth)
-- 2. Depois execute:
UPDATE profiles
SET role = 'admin'
WHERE email = 'email-do-novo-admin@exemplo.com';
```

### 4. Reiniciar Aplicação

```bash
npm run dev
```

### 5. Acessar Página de Admin

1. Faça login com o usuário admin
2. O item "Administrador" aparecerá no menu lateral
3. Clique para acessar `/admin`

## Verificação

### Checklist de Instalação

- [ ] Dependências instaladas (`npm install`)
- [ ] Migração executada com sucesso
- [ ] Tabela `profiles` criada no Supabase
- [ ] Enum `user_role` criado
- [ ] Primeiro admin criado
- [ ] Login realizado com admin
- [ ] Item "Administrador" visível no menu
- [ ] Página `/admin` acessível
- [ ] Estatísticas carregando corretamente

### Verificar Tabela Profiles

Execute no SQL Editor:

```sql
SELECT * FROM profiles;
```

Você deve ver:

- Colunas: id, user_id, email, full_name, role, is_active, created_at, updated_at
- Pelo menos um registro com role = 'admin'

### Verificar RLS Policies

Execute no SQL Editor:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

Você deve ver 6 policies:

1. Users can view own profile
2. Users can update own profile
3. Admins can view all profiles
4. Admins can insert profiles
5. Admins can update all profiles
6. Admins can delete profiles

## Troubleshooting

### Erro: "relation profiles does not exist"

**Solução:** Migração não foi executada. Execute novamente o passo 2.

### Erro: "permission denied for table profiles"

**Solução:** RLS policies não foram criadas. Verifique se a migração completa foi executada.

### Profile não aparece após login

**Solução:**

1. Verifique se o profile foi criado:

```sql
SELECT * FROM profiles WHERE user_id = 'UUID-DO-USUARIO';
```

2. Se não existir, crie manualmente:

```sql
INSERT INTO profiles (user_id, email, role)
VALUES ('UUID-DO-USUARIO', 'email@exemplo.com', 'admin');
```

### Item "Administrador" não aparece no menu

**Soluções possíveis:**

1. Faça logout e login novamente
2. Limpe o cache do navegador
3. Verifique se o role está correto:

```sql
SELECT role FROM profiles WHERE email = 'seu-email@exemplo.com';
```

### Erro ao criar usuário: "Failed to create user"

**Verificar:**

1. Se você tem permissões de admin no Supabase
2. Se o email já não está cadastrado
3. Se a senha tem pelo menos 6 caracteres

## Comandos Úteis

### Listar todos os admins

```sql
SELECT email, full_name, is_active, created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
```

### Promover usuário a admin

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'email@exemplo.com';
```

### Rebaixar admin para usuário

```sql
UPDATE profiles
SET role = 'user'
WHERE email = 'email@exemplo.com';
```

### Desativar usuário

```sql
UPDATE profiles
SET is_active = false
WHERE email = 'email@exemplo.com';
```

### Reativar usuário

```sql
UPDATE profiles
SET is_active = true
WHERE email = 'email@exemplo.com';
```

### Ver estatísticas

```sql
SELECT
  COUNT(*) AS total_usuarios,
  COUNT(*) FILTER (WHERE role = 'admin') AS total_admins,
  COUNT(*) FILTER (WHERE role = 'user') AS total_users,
  COUNT(*) FILTER (WHERE is_active = true) AS usuarios_ativos,
  COUNT(*) FILTER (WHERE is_active = false) AS usuarios_inativos
FROM profiles;
```

## Arquivos Criados/Modificados

### Novos Arquivos

1. `supabase/migrations/20250109_create_profiles_and_roles.sql` - Migração do banco
2. `src/types/admin.ts` - Tipos TypeScript
3. `src/hooks/useUserManagement.ts` - Hook de gestão de usuários
4. `src/hooks/useBulkEdit.ts` - Hook de edição em massa
5. `src/utils/permissions.ts` - Funções de permissão
6. `src/components/admin/UserFormDialog.tsx` - Dialog de formulário
7. `src/components/admin/UserManagement.tsx` - Gestão de usuários
8. `src/components/admin/BulkEditPanel.tsx` - Painel de edição em massa
9. `src/pages/Admin.tsx` - Página principal de admin
10. `src/components/AdminRoute.tsx` - Proteção de rotas
11. `src/components/ui/switch.tsx` - Componente Switch
12. `ADMIN_SYSTEM_GUIDE.md` - Documentação completa
13. `INSTALACAO_SISTEMA_ADMIN.md` - Este arquivo

### Arquivos Modificados

1. `src/integrations/supabase/types.ts` - Adicionada tabela profiles
2. `src/hooks/useAuth.tsx` - Adicionado profile e isAdmin
3. `src/components/Sidebar.tsx` - Item admin e role dinâmico
4. `src/App.tsx` - Rota /admin adicionada
5. `package.json` - Dependência @radix-ui/react-switch

## Próximos Passos

Após instalação bem-sucedida:

1. Leia `ADMIN_SYSTEM_GUIDE.md` para entender o sistema completo
2. Crie outros usuários admin se necessário
3. Teste a criação de usuários normais
4. Experimente a edição em massa
5. Configure backups automáticos da tabela profiles

## Suporte

Se encontrar problemas:

1. Verifique o console do navegador para erros
2. Verifique os logs do Supabase
3. Revise este guia de instalação
4. Consulte a documentação completa em `ADMIN_SYSTEM_GUIDE.md`
