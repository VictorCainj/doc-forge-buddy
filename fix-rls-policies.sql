-- Script para corrigir as RLS policies que estão causando recursão infinita

-- 1. Primeiro, remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 2. Criar políticas simples e não recursivas
-- Policy: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Permitir inserção de perfis (para novos usuários)
CREATE POLICY "Allow profile creation" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 3. Verificar se o perfil do Cain existe
SELECT 
  id,
  user_id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM profiles 
WHERE email = 'cainbrasil23@gmail.com';

-- 4. Se não existir, criar o perfil
INSERT INTO public.profiles (user_id, email, role, full_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'cainbrasil23@gmail.com'),
  'cainbrasil23@gmail.com',
  'admin',
  'Cain'
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  full_name = 'Cain';

-- 5. Verificar resultado final
SELECT 
  id,
  user_id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM profiles 
WHERE email = 'cainbrasil23@gmail.com';