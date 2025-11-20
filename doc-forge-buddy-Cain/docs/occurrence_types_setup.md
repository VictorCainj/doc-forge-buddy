# Configuração de Tipos de Ocorrência

Este documento descreve como configurar o sistema de tipos de ocorrência gerenciáveis pelo administrador.

## Tabela no Banco de Dados

Execute o seguinte SQL no Supabase para criar a tabela `occurrence_types`:

```sql
-- Criar tabela de tipos de ocorrência
CREATE TABLE IF NOT EXISTS occurrence_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_occurrence_types_is_active ON occurrence_types(is_active);
CREATE INDEX IF NOT EXISTS idx_occurrence_types_name ON occurrence_types(name);

-- Habilitar RLS (Row Level Security)
ALTER TABLE occurrence_types ENABLE ROW LEVEL SECURITY;

-- Política para leitura: todos os usuários autenticados podem ver tipos ativos
CREATE POLICY "Usuários autenticados podem ver tipos ativos"
  ON occurrence_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Política para leitura completa: apenas admins podem ver todos os tipos
CREATE POLICY "Admins podem ver todos os tipos"
  ON occurrence_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política para inserção: apenas admins podem criar tipos
CREATE POLICY "Apenas admins podem criar tipos"
  ON occurrence_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política para atualização: apenas admins podem atualizar tipos
CREATE POLICY "Apenas admins podem atualizar tipos"
  ON occurrence_types
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política para exclusão: apenas admins podem deletar tipos
CREATE POLICY "Apenas admins podem deletar tipos"
  ON occurrence_types
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_occurrence_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_occurrence_types_updated_at
  BEFORE UPDATE ON occurrence_types
  FOR EACH ROW
  EXECUTE FUNCTION update_occurrence_types_updated_at();
```

## Inserir Tipos Iniciais (Opcional)

Você pode inserir alguns tipos iniciais:

```sql
INSERT INTO occurrence_types (name, description, is_active) VALUES
  ('Negociação - Aditivo', 'Ocorrências relacionadas a aditivos contratuais', true),
  ('Negociação - Alteração de Valor', 'Ocorrências relacionadas a alterações de valores', true),
  ('Negociação - Suspensão', 'Ocorrências relacionadas a suspensões contratuais', true),
  ('Negociação - Rescisão', 'Ocorrências relacionadas a rescisões contratuais', true),
  ('Informação Importante - Notificação', 'Notificações importantes sobre o contrato', true),
  ('Informação Importante - Vistoria', 'Informações sobre vistorias realizadas', true),
  ('Informação Importante - Multa', 'Ocorrências relacionadas a multas', true);
```

## Funcionalidades Implementadas

1. **Página Admin**: Nova seção "Tipos de Ocorrência" na página de administração
2. **Gerenciamento CRUD**: Criar, editar, ativar/desativar e deletar tipos
3. **Integração com Ocorrências**: O componente de ocorrências agora usa os tipos do banco de dados
4. **Compatibilidade**: Mantém compatibilidade com ocorrências antigas que usavam tipos fixos

## Como Usar

1. Execute o SQL acima no Supabase SQL Editor
2. Acesse a página Admin
3. Clique em "Tipos de Ocorrência"
4. Crie novos tipos conforme necessário
5. Os tipos criados aparecerão automaticamente no formulário de ocorrências
