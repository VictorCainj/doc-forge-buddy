<!-- d5a1b07b-f369-4ffd-8271-1e82bb429ef0 05d9fccf-060c-4ef0-9c13-ee0b9ea5382f -->
# Plano: Desenvolvimento de Página de Administrador

## 1. Database: Criar Tabela de Profiles e Roles

**Arquivo:** `supabase/migrations/create_profiles_and_roles.sql`

Criar migração com:

- Enum `user_role` com valores: `admin`, `user`
- Tabela `profiles` com campos: id, user_id (FK para auth.users), email, full_name, role, is_active, created_at, updated_at
- RLS policies para admin gerenciar usuários e usuários visualizarem próprio perfil
- Trigger para criar profile automaticamente ao criar usuário
- Função para atualizar updated_at

## 2. TypeScript Types

**Arquivo:** `src/types/admin.ts` (criar novo)

Criar tipos:

- `UserRole`: enum com 'admin' | 'user'
- `UserProfile`: interface com todos os campos do profile
- `MassEditOperation`: interface para operações em massa
- `BulkUpdatePayload`: interface para payload de atualização massiva

## 3. Atualizar Types do Supabase

**Arquivo:** `src/integrations/supabase/types.ts`

Adicionar tabela `profiles` ao tipo `Database` com Row, Insert e Update types.

## 4. Hooks de Gerenciamento de Usuários

**Arquivo:** `src/hooks/useUserManagement.ts` (criar novo)

Hooks personalizados:

- `useUserProfile()`: obter profile do usuário logado
- `useUsersList()`: listar todos os usuários (admin only)
- `useCreateUser()`: criar novo usuário
- `useUpdateUser()`: atualizar usuário
- `useToggleUserStatus()`: ativar/desativar usuário

## 5. Hook de Edição Massiva

**Arquivo:** `src/hooks/useBulkEdit.ts` (criar novo)

Hook genérico para edições massivas:

- Suportar contratos, prestadores, vistorias, documentos
- Seleção múltipla de itens
- Aplicar mudanças em lote
- Tratamento de erros e rollback

## 6. Atualizar useAuth com Role

**Arquivo:** `src/hooks/useAuth.tsx`

Modificações:

- Adicionar `profile` e `isAdmin` ao contexto
- Carregar profile junto com sessão
- Expor `isAdmin` para verificação de permissões

## 7. Componentes de Admin - Gestão de Usuários

**Arquivo:** `src/components/admin/UserManagement.tsx` (criar novo)

Componente principal com:

- Tabela de usuários com filtros
- Ações: criar, editar, ativar/desativar
- Badges para roles (Admin/Usuário)
- Paginação

**Arquivo:** `src/components/admin/UserFormDialog.tsx` (criar novo)

Dialog para criar/editar usuário:

- Campos: email, nome completo, cargo, status
- Validação de formulário
- Feedback de sucesso/erro

## 8. Componentes de Admin - Edição Massiva

**Arquivo:** `src/components/admin/BulkEditPanel.tsx` (criar novo)

Painel de edição massiva:

- Seleção de entidade (contratos, prestadores, etc)
- Checkboxes para seleção múltipla
- Formulário com campos comuns
- Aplicar mudanças em massa
- Barra de progresso

## 9. Página de Administrador

**Arquivo:** `src/pages/Admin.tsx` (criar novo)

Layout da página:

- Tabs: "Gestão de Usuários" e "Edição Massiva"
- Estatísticas do sistema (total usuários, contratos, etc)
- Cards com métricas
- Integração dos componentes criados

## 10. Proteção de Rotas Admin

**Arquivo:** `src/components/AdminRoute.tsx` (criar novo)

Componente similar ao ProtectedRoute:

- Verificar se usuário está autenticado
- Verificar se usuário é admin
- Redirecionar para /contratos se não autorizado
- Mostrar mensagem de "Acesso negado"

## 11. Atualizar Sidebar

**Arquivo:** `src/components/Sidebar.tsx`

Adicionar:

- Item de menu "Administrador" (ícone: Settings)
- Mostrar apenas para usuários admin
- Exibir role real do usuário no profile (não hardcoded)

## 12. Atualizar App Routes

**Arquivo:** `src/App.tsx`

Adicionar:

- Importar página Admin (lazy load)
- Rota `/admin` protegida com AdminRoute
- Aplicar Layout à página

## 13. Utilitários de Permissão

**Arquivo:** `src/utils/permissions.ts` (criar novo)

Funções auxiliares:

- `isAdmin(profile)`: verificar se é admin
- `canManageUsers(profile)`: verificar permissão
- `canBulkEdit(profile)`: verificar permissão para edição massiva

## Entidades Suportadas para Edição Massiva

- **Contratos**: atualizar status, datas, proprietário
- **Prestadores**: atualizar especialidade, status
- **Vistorias**: atualizar status, classificações
- **Documentos salvos**: atualizar tipo, status

### To-dos

- [ ] Criar migração Supabase com tabela profiles, roles e RLS policies
- [ ] Criar tipos TypeScript para admin, profiles e edição massiva
- [ ] Atualizar src/integrations/supabase/types.ts com tabela profiles
- [ ] Criar hooks useUserManagement e useBulkEdit
- [ ] Atualizar useAuth para incluir profile e isAdmin
- [ ] Criar componentes UserManagement e UserFormDialog
- [ ] Criar componente BulkEditPanel para edição massiva
- [ ] Criar página Admin.tsx com tabs e estatísticas
- [ ] Criar componente AdminRoute para proteção de rotas
- [ ] Atualizar Sidebar com item Administrador (somente para admin)
- [ ] Adicionar rota /admin ao App.tsx
- [ ] Criar utilitários de permissão em utils/permissions.ts