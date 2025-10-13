# Instruções para Migração do Banco de Dados - Sistema de Tarefas

## ⚠️ IMPORTANTE

Antes de usar o sistema de tarefas, você **DEVE** aplicar a migração do banco de dados para criar a tabela `tasks` e configurar as políticas de segurança.

---

## 📝 Arquivo de Migração

**Localização**: `supabase/migrations/20250113000001_create_tasks_table.sql`

Este arquivo contém:

- Criação do enum `task_status`
- Criação da tabela `tasks`
- Índices para performance
- Políticas de Row Level Security (RLS)
- Triggers automáticos

---

## 🚀 Como Aplicar a Migração

### Opção 1: Via Supabase CLI (Recomendado)

Se você tem o Supabase CLI instalado:

```bash
# 1. Fazer login no Supabase
supabase login

# 2. Conectar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# 3. Aplicar a migração
supabase db push
```

### Opção 2: Via Dashboard do Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase/migrations/20250113000001_create_tasks_table.sql`
6. Cole no editor SQL
7. Clique em **Run** ou pressione `Ctrl+Enter`

### Opção 3: Copiar e Executar Manualmente

Abra o arquivo `supabase/migrations/20250113000001_create_tasks_table.sql` e execute o SQL diretamente no seu banco de dados PostgreSQL.

---

## ✅ Verificar se a Migração foi Aplicada

### Via SQL Editor no Supabase

Execute esta query para verificar:

```sql
-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_name = 'tasks'
);

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'tasks';
```

Se tudo estiver correto, você verá:

- A tabela `tasks` existe
- 9 colunas (id, user_id, title, subtitle, description, status, created_at, updated_at, completed_at)
- 4 políticas RLS (SELECT, INSERT, UPDATE, DELETE)

---

## 🔍 Estrutura da Tabela

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status task_status NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

## 🔒 Políticas de Segurança (RLS)

O sistema implementa Row Level Security para garantir que:

1. **SELECT**: Usuários só podem ver suas próprias tarefas
2. **INSERT**: Usuários só podem criar tarefas para si mesmos
3. **UPDATE**: Usuários só podem atualizar suas próprias tarefas
4. **DELETE**: Usuários só podem excluir suas próprias tarefas

---

## 🤖 Triggers Automáticos

### 1. Atualização de `updated_at`

Sempre que uma tarefa é modificada, o campo `updated_at` é atualizado automaticamente.

### 2. Gerenciamento de `completed_at`

- Quando status muda para 'completed': `completed_at` recebe timestamp atual
- Quando status muda de 'completed' para outro: `completed_at` é limpo (NULL)

---

## 🐛 Troubleshooting

### Erro: "relation 'tasks' does not exist"

**Solução**: A migração não foi aplicada. Execute os passos acima.

### Erro: "type 'task_status' does not exist"

**Solução**: Execute a migração completa, que cria o enum primeiro.

### Erro: "permission denied for table tasks"

**Solução**: Verifique se as políticas RLS foram criadas corretamente.

### Tarefas de outros usuários aparecem

**Solução**: Verifique se RLS está habilitado:

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

### `completed_at` não é preenchido automaticamente

**Solução**: Verifique se o trigger foi criado:

```sql
SELECT tgname FROM pg_trigger WHERE tgrelid = 'tasks'::regclass;
```

---

## 📊 Testar a Migração

Após aplicar a migração, teste com estas queries:

```sql
-- 1. Inserir uma tarefa de teste
INSERT INTO tasks (user_id, title, subtitle, description, status)
VALUES (auth.uid(), 'Tarefa de Teste', 'Subtítulo', 'Descrição detalhada', 'not_started');

-- 2. Listar tarefas
SELECT * FROM tasks WHERE user_id = auth.uid();

-- 3. Atualizar status para concluída
UPDATE tasks
SET status = 'completed'
WHERE user_id = auth.uid()
AND title = 'Tarefa de Teste';

-- 4. Verificar se completed_at foi preenchido
SELECT id, title, status, completed_at
FROM tasks
WHERE user_id = auth.uid()
AND title = 'Tarefa de Teste';

-- 5. Limpar teste
DELETE FROM tasks WHERE user_id = auth.uid() AND title = 'Tarefa de Teste';
```

---

## 🔄 Rollback (Reverter Migração)

Se precisar reverter a migração:

```sql
-- ATENÇÃO: Isso apagará todas as tarefas!
DROP TABLE IF EXISTS tasks CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP FUNCTION IF EXISTS update_tasks_updated_at CASCADE;
```

---

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs de erro do Supabase
2. Confirme que você tem permissões adequadas
3. Verifique se não há conflitos de nomes de tabelas
4. Entre em contato com o administrador do sistema

---

## ✨ Próximos Passos

Após aplicar a migração com sucesso:

1. ✅ Reinicie o servidor de desenvolvimento
2. ✅ Faça login na aplicação
3. ✅ Acesse o menu "Tarefas"
4. ✅ Crie sua primeira tarefa
5. ✅ Teste a funcionalidade "Revisar com IA"
6. ✅ Gere um resumo do dia

---

**Data**: 13 de Outubro de 2025  
**Versão da Migração**: 20250113000001  
**Status**: Pronto para Aplicação
