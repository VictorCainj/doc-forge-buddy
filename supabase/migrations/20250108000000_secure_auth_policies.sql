-- Migration para implementar políticas de segurança baseadas em autenticação
-- Esta migration substitui as políticas permissivas por políticas seguras baseadas em usuário

-- Primeiro, vamos remover as políticas existentes que permitem acesso total
DROP POLICY IF EXISTS "Allow read access to contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow insert access to contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow update access to contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow delete access to contracts" ON public.contracts;

-- Remover políticas da tabela saved_terms se existirem
DROP POLICY IF EXISTS "Allow read access to saved_terms" ON public.saved_terms;
DROP POLICY IF EXISTS "Allow insert access to saved_terms" ON public.saved_terms;
DROP POLICY IF EXISTS "Allow update access to saved_terms" ON public.saved_terms;
DROP POLICY IF EXISTS "Allow delete access to saved_terms" ON public.saved_terms;

-- Adicionar coluna user_id nas tabelas se não existir
-- Para contracts
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Para saved_terms
ALTER TABLE public.saved_terms 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_terms_user_id ON public.saved_terms(user_id);

-- Políticas seguras para contracts
-- Usuários só podem ver seus próprios contratos
CREATE POLICY "Users can view own contracts" 
ON public.contracts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Usuários só podem inserir contratos para si mesmos
CREATE POLICY "Users can insert own contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Usuários só podem atualizar seus próprios contratos
CREATE POLICY "Users can update own contracts" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários só podem deletar seus próprios contratos
CREATE POLICY "Users can delete own contracts" 
ON public.contracts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas seguras para saved_terms
-- Usuários só podem ver seus próprios termos salvos
CREATE POLICY "Users can view own saved terms" 
ON public.saved_terms 
FOR SELECT 
USING (auth.uid() = user_id);

-- Usuários só podem inserir termos salvos para si mesmos
CREATE POLICY "Users can insert own saved terms" 
ON public.saved_terms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Usuários só podem atualizar seus próprios termos salvos
CREATE POLICY "Users can update own saved terms" 
ON public.saved_terms 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários só podem deletar seus próprios termos salvos
CREATE POLICY "Users can delete own saved terms" 
ON public.saved_terms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Função para atualizar automaticamente o user_id em inserts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para definir automaticamente o user_id
CREATE TRIGGER set_user_id_contracts
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_user_id_saved_terms
  BEFORE INSERT ON public.saved_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentários para documentação
COMMENT ON POLICY "Users can view own contracts" ON public.contracts IS 'Permite que usuários vejam apenas seus próprios contratos';
COMMENT ON POLICY "Users can insert own contracts" ON public.contracts IS 'Permite que usuários criem contratos apenas para si mesmos';
COMMENT ON POLICY "Users can update own contracts" ON public.contracts IS 'Permite que usuários atualizem apenas seus próprios contratos';
COMMENT ON POLICY "Users can delete own contracts" ON public.contracts IS 'Permite que usuários deletem apenas seus próprios contratos';

COMMENT ON POLICY "Users can view own saved terms" ON public.saved_terms IS 'Permite que usuários vejam apenas seus próprios termos salvos';
COMMENT ON POLICY "Users can insert own saved terms" ON public.saved_terms IS 'Permite que usuários criem termos salvos apenas para si mesmos';
COMMENT ON POLICY "Users can update own saved terms" ON public.saved_terms IS 'Permite que usuários atualizem apenas seus próprios termos salvos';
COMMENT ON POLICY "Users can delete own saved terms" ON public.saved_terms IS 'Permite que usuários deletem apenas seus próprios termos salvos';
