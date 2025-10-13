# Como Adicionar o Campo Observação

## ⚠️ Situação

Você já aplicou a migração inicial e precisa apenas adicionar a coluna `observacao` à tabela existente.

## ✅ Solução Rápida

### Opção 1: Via Dashboard do Supabase (RECOMENDADO)

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole este SQL:

```sql
-- Adicionar coluna observacao à tabela tasks existente
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS observacao TEXT NOT NULL DEFAULT '';

-- Garantir que registros existentes tenham observacao vazia
UPDATE tasks SET observacao = '' WHERE observacao IS NULL;
```

6. Clique em **Run** ou pressione `Ctrl+Enter`
7. ✅ Pronto! O campo foi adicionado

### Opção 2: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# Aplicar apenas a nova migração
supabase db push supabase/migrations/20250113000002_add_observacao_to_tasks.sql
```

### Opção 3: Comando SQL Direto

Execute este comando no seu cliente PostgreSQL:

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS observacao TEXT NOT NULL DEFAULT '';
```

## 🔍 Verificar se Funcionou

Execute este SQL para confirmar:

```sql
-- Ver estrutura da tabela tasks
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

Você deve ver a coluna `observacao` do tipo `text` na lista.

## 📋 Estrutura Esperada da Tabela

Após aplicar a migração, sua tabela `tasks` deve ter:

| Coluna         | Tipo        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | NO       | gen_random_uuid() |
| user_id        | uuid        | NO       | -                 |
| title          | text        | NO       | -                 |
| subtitle       | text        | NO       | ''                |
| description    | text        | NO       | ''                |
| **observacao** | **text**    | **NO**   | **''**            |
| status         | task_status | NO       | 'not_started'     |
| created_at     | timestamptz | NO       | NOW()             |
| updated_at     | timestamptz | NO       | NOW()             |
| completed_at   | timestamptz | YES      | NULL              |

## ⚠️ Importante

- ✅ Use `ADD COLUMN IF NOT EXISTS` para evitar erros se já existir
- ✅ O `DEFAULT ''` garante que registros existentes funcionem
- ✅ Não é necessário recriar a tabela ou o enum
- ✅ Os registros existentes não serão afetados

## 🐛 Solução de Problemas

### Se o erro persistir:

1. **Verificar se a coluna já existe:**

   ```sql
   SELECT EXISTS (
     SELECT 1
     FROM information_schema.columns
     WHERE table_name = 'tasks'
     AND column_name = 'observacao'
   );
   ```

2. **Se retornar `true`:** A coluna já existe, não precisa fazer nada!

3. **Se retornar `false`:** Execute o ALTER TABLE novamente.

## 🚀 Depois de Aplicar

1. ✅ Recarregue a página da aplicação
2. ✅ Acesse `/tarefas`
3. ✅ Crie uma nova tarefa
4. ✅ Veja o campo "Observação" no formulário
5. ✅ Teste adicionar observações

---

**Arquivo da Migração:** `supabase/migrations/20250113000002_add_observacao_to_tasks.sql`  
**Status:** Pronto para aplicar  
**Impacto:** Zero - apenas adiciona uma coluna nova
