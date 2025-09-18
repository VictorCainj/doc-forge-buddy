# Como Aplicar as Migrações do Banco de Dados

## Opção 1: Instalar Supabase CLI

```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# Ou usar npx
npx supabase db push
```

## Opção 2: Aplicar Manualmente no Dashboard do Supabase

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Vá para o seu projeto
3. Navegue para "SQL Editor"
4. Execute o seguinte SQL:

```sql
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
```

## Opção 3: Usar o Script do Package.json

Adicione este script ao seu `package.json`:

```json
{
  "scripts": {
    "db:push": "npx supabase db push",
    "db:reset": "npx supabase db reset"
  }
}
```

Depois execute:

```bash
npm run db:push
```
