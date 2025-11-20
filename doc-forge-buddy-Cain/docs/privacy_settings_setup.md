# Configuração de Privacidade e Anonimização

Este documento descreve como configurar o sistema de privacidade e anonimização de dados pessoais.

## Tabela no Banco de Dados

Execute o seguinte SQL no Supabase para criar a tabela `privacy_settings`:

```sql
-- Criar tabela de configurações de privacidade
CREATE TABLE IF NOT EXISTS privacy_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  anonymize_personal_data BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_privacy_settings_id ON privacy_settings(id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- Política para leitura: todos os usuários autenticados podem ver configurações
CREATE POLICY "Usuários autenticados podem ver configurações de privacidade"
  ON privacy_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para atualização: apenas admins podem atualizar configurações
CREATE POLICY "Apenas admins podem atualizar configurações de privacidade"
  ON privacy_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política para inserção: apenas admins podem criar configurações
CREATE POLICY "Apenas admins podem criar configurações de privacidade"
  ON privacy_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_privacy_settings_updated_at();

-- Inserir configuração padrão (desativada)
INSERT INTO privacy_settings (id, anonymize_personal_data)
VALUES ('default', false)
ON CONFLICT (id) DO NOTHING;
```

## Funcionalidades Implementadas

1. **Página Admin**: Nova seção "Privacidade e Anonimização" na página de administração
2. **Anonimização Automática**: Quando ativada, anonimiza automaticamente:
   - Nomes completos → Primeiro nome + inicial do sobrenome
   - Endereços completos → Apenas cidade e estado
   - Documentos (CPF, RG) → Últimos dígitos apenas
   - Telefones → Últimos dígitos apenas
   - Emails → Primeira letra + domínio

3. **Aplicação Universal**: A anonimização é aplicada em:
   - Cards de contratos
   - Listas de contratos
   - Documentos gerados
   - Todas as visualizações do sistema

4. **Visibilidade Admin**: Administradores sempre veem os dados completos, mesmo com a privacidade ativada

## Como Usar

1. Execute o SQL acima no Supabase SQL Editor
2. Acesse a página Admin
3. Clique em "Privacidade e Anonimização"
4. Ative ou desative o modo de privacidade conforme necessário
5. Quando ativado, todos os dados pessoais serão automaticamente anonimizados para usuários não-admin

## Exemplos de Anonimização

- **Nome**: "João Silva Santos" → "João S."
- **Endereço**: "Rua das Flores, 123, Centro, São Paulo - SP" → "São Paulo - SP"
- **CPF**: "123.456.789-00" → "***.***.***-00"
- **Telefone**: "(11) 98765-4321" → "(**) *****-21"
- **Email**: "joao.silva@example.com" → "j***@example.com"

