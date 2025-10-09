# Guia do Sistema de Administração

## Visão Geral

O Sistema de Administração foi implementado com sucesso no DocForge Buddy, permitindo gestão completa de usuários e edição em massa de dados.

## Estrutura Implementada

### 1. Database (Supabase)

**Migração:** `supabase/migrations/20250109_create_profiles_and_roles.sql`

- **Tabela `profiles`**: Armazena informações dos usuários
  - `id`: UUID
  - `user_id`: Referência para auth.users
  - `email`: Email do usuário
  - `full_name`: Nome completo
  - `role`: Cargo (admin | user)
  - `is_active`: Status ativo/inativo
  - `created_at`, `updated_at`: Timestamps

- **RLS Policies**:
  - Usuários podem visualizar e editar seu próprio perfil
  - Admins têm acesso total a todos os perfis

- **Trigger Automático**: Cria profile automaticamente ao criar usuário

### 2. Tipos TypeScript

**Arquivo:** `src/types/admin.ts`

- `UserRole`: 'admin' | 'user'
- `UserProfile`: Interface completa do perfil
- `CreateUserPayload`: Dados para criar usuário
- `UpdateUserPayload`: Dados para atualizar usuário
- `EntityType`: Tipos de entidades para edição em massa
- `BulkUpdatePayload`: Payload de atualização em massa
- `SystemStats`: Estatísticas do sistema

### 3. Hooks Customizados

#### useUserManagement (`src/hooks/useUserManagement.ts`)

- `useUserProfile(userId)`: Obter perfil de usuário
- `useUsersList(filters)`: Listar usuários com filtros
- `useCreateUser()`: Criar novo usuário
- `useUpdateUser()`: Atualizar usuário
- `useToggleUserStatus()`: Ativar/desativar usuário

#### useBulkEdit (`src/hooks/useBulkEdit.ts`)

- `useBulkEdit()`: Gerenciar seleção de itens
- `useBulkUpdate()`: Executar atualização em massa
- `useBulkDelete()`: Deletar múltiplos itens

### 4. Autenticação Atualizada

**Arquivo:** `src/hooks/useAuth.tsx`

Adicionado ao contexto:

- `profile`: Perfil completo do usuário
- `isAdmin`: Boolean indicando se é admin

### 5. Componentes de Admin

#### UserManagement (`src/components/admin/UserManagement.tsx`)

- Tabela de usuários com filtros
- Busca por email/nome
- Filtro por cargo e status
- Ações: criar, editar, ativar/desativar

#### UserFormDialog (`src/components/admin/UserFormDialog.tsx`)

- Dialog para criar/editar usuários
- Validação de formulário
- Campos: email, senha, nome, cargo, status

#### BulkEditPanel (`src/components/admin/BulkEditPanel.tsx`)

- Seleção de entidade (contratos, prestadores, vistorias, documentos)
- Seleção múltipla de itens
- Formulário para campos comuns
- Aplicação de mudanças em massa

### 6. Página de Administração

**Arquivo:** `src/pages/Admin.tsx`

- Cards com estatísticas do sistema
- Tabs: "Gestão de Usuários" e "Edição em Massa"
- Layout responsivo e moderno

### 7. Proteção de Rotas

**Arquivo:** `src/components/AdminRoute.tsx`

- Verifica autenticação
- Verifica se usuário é admin
- Mostra mensagem de acesso negado para não-admins

### 8. Sidebar Atualizada

**Arquivo:** `src/components/Sidebar.tsx`

- Item "Administrador" visível apenas para admins
- Exibe role real do usuário (não hardcoded)
- Exibe nome completo quando disponível

## Como Usar

### Instalação de Dependências

```bash
npm install
```

Isso instalará a nova dependência `@radix-ui/react-switch` automaticamente.

### Executar Migração do Banco de Dados

1. Certifique-se de ter o Supabase CLI instalado
2. Execute a migração:

```bash
supabase db push
```

Ou aplique manualmente via dashboard do Supabase:

- Acesse seu projeto no Supabase
- Vá em SQL Editor
- Execute o conteúdo de `supabase/migrations/20250109_create_profiles_and_roles.sql`

### Criar Primeiro Admin

Após executar a migração, você precisa criar o primeiro usuário admin manualmente:

1. Acesse o SQL Editor do Supabase
2. Execute:

```sql
-- Primeiro, crie o usuário no auth (ou use usuário existente)
-- Depois, atualize o role para admin:

UPDATE profiles
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

### Acessar Página de Admin

1. Faça login com usuário admin
2. Acesse `/admin` ou clique em "Administrador" no menu lateral
3. Você verá:
   - Estatísticas do sistema
   - Gestão de usuários
   - Edição em massa

## Funcionalidades

### Gestão de Usuários

**Criar Novo Usuário:**

1. Clique em "Novo Usuário"
2. Preencha email, senha, nome e cargo
3. Clique em "Criar Usuário"

**Editar Usuário:**

1. Clique no ícone de edição ao lado do usuário
2. Atualize as informações
3. Clique em "Salvar Alterações"

**Ativar/Desativar Usuário:**

1. Clique no ícone de power ao lado do usuário
2. Confirme a ação

**Filtros Disponíveis:**

- Busca por email ou nome
- Filtro por cargo (Admin/Usuário)
- Filtro por status (Ativo/Inativo)

### Edição em Massa

**Como Usar:**

1. Selecione a entidade (Contratos, Prestadores, Vistorias, Documentos)
2. Marque os itens que deseja atualizar (ou clique em "Selecionar Todos")
3. Preencha os campos que deseja atualizar
4. Clique em "Aplicar Alterações"

**Entidades Suportadas:**

- **Contratos**: prazo_dias
- **Prestadores**: especialidade, telefone
- **Vistorias**: title
- **Documentos Salvos**: title, document_type

## Permissões

### Admin

- Criar, editar e desativar usuários
- Alterar cargos de usuários
- Realizar edições em massa
- Visualizar estatísticas do sistema
- Acesso a todas as funcionalidades

### Usuário

- Visualizar e editar próprio perfil
- Acesso às funcionalidades normais do sistema
- Sem acesso à página de administração

## Segurança

- **RLS (Row Level Security)**: Habilitado em todas as tabelas
- **Validação de Permissões**: Verificada no frontend e backend
- **Proteção de Rotas**: Apenas admins podem acessar /admin
- **Audit Trail**: Timestamps automáticos em created_at e updated_at

## Arquitetura

### Fluxo de Autenticação

1. Usuário faz login → `useAuth`
2. Session criada → Carregar profile
3. Profile carregado → Verificar isAdmin
4. Contexto atualizado → Componentes reagem

### Fluxo de Criação de Usuário

1. Admin preenche formulário
2. `useCreateUser` → Supabase Auth Admin API
3. Usuário criado em auth.users
4. Trigger automático cria profile
5. Query invalidada → Lista atualizada

### Fluxo de Edição em Massa

1. Admin seleciona entidade e itens
2. Preenche campos a atualizar
3. `useBulkUpdate` → Loop de atualizações
4. Cada item atualizado individualmente
5. Resultados agregados e exibidos
6. Queries invalidadas → Dados atualizados

## Troubleshooting

### Profile não carrega

- Verificar se migração foi executada
- Verificar se usuário tem registro na tabela profiles
- Executar trigger manualmente se necessário

### Acesso negado em /admin

- Verificar se usuário tem role 'admin' na tabela profiles
- Fazer logout e login novamente para recarregar profile

### Edição em massa não funciona

- Verificar RLS policies da tabela
- Verificar se admin tem permissões corretas
- Verificar console para erros específicos

## Próximos Passos Recomendados

1. **Logs de Auditoria**: Criar tabela para registrar ações dos admins
2. **Permissões Granulares**: Adicionar mais roles (gerente, supervisor, etc)
3. **Notificações**: Enviar email ao criar/desativar usuário
4. **Exportação**: Permitir exportar lista de usuários
5. **Dashboard Avançado**: Gráficos e métricas detalhadas

## Conclusão

O sistema de administração está completo e funcional, seguindo as melhores práticas de segurança e UX. Todos os componentes são reutilizáveis e escaláveis para futuras expansões.
