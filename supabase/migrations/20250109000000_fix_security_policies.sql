-- Migration para corrigir definitivamente as políticas de segurança
-- Esta migration remove as políticas permissivas e garante que apenas as seguras estejam ativas

-- Primeiro, vamos remover as políticas permissivas da migração 20250906124710
DROP POLICY IF EXISTS "Allow read access to saved_terms" ON public.saved_terms;
DROP POLICY IF EXISTS "Allow insert access to saved_terms" ON public.saved_terms;
DROP POLICY IF EXISTS "Allow update access to saved_terms" ON public.saved_terms;
DROP POLICY IF EXISTS "Allow delete access to saved_terms" ON public.saved_terms;

-- Garantir que as políticas seguras estejam ativas (caso não estejam)
CREATE POLICY "Users can view own saved terms" 
ON public.saved_terms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved terms" 
ON public.saved_terms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved terms" 
ON public.saved_terms 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved terms" 
ON public.saved_terms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON POLICY "Users can view own saved terms" ON public.saved_terms IS 'Permite que usuários vejam apenas seus próprios termos salvos';
COMMENT ON POLICY "Users can insert own saved terms" ON public.saved_terms IS 'Permite que usuários criem termos salvos apenas para si mesmos';
COMMENT ON POLICY "Users can update own saved terms" ON public.saved_terms IS 'Permite que usuários atualizem apenas seus próprios termos salvos';
COMMENT ON POLICY "Users can delete own saved terms" ON public.saved_terms IS 'Permite que usuários deletem apenas seus próprios termos salvos';
