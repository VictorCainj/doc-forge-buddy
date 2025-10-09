-- Script definitivo para criar o perfil de administrador
-- Execute este SQL no Supabase SQL Editor

-- 1. Primeiro, vamos verificar se o usuário existe na tabela auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'cainbrasil23@gmail.com';

-- 2. Se não existir, vamos criar o usuário primeiro
-- (Isso pode não funcionar sem service role, então pode ser necessário criar manualmente)

-- 3. Criar o perfil na tabela profiles
-- Substitua 'SEU_USER_ID_AQUI' pelo ID que apareceu na consulta acima
INSERT INTO public.profiles (user_id, email, full_name, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'cainbrasil23@gmail.com'),
  'cainbrasil23@gmail.com',
  'Cain',
  'admin',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  full_name = 'Cain',
  is_active = true,
  updated_at = now();

-- 4. Verificar se foi criado corretamente
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

-- 5. Se ainda não funcionar, vamos criar manualmente
-- (Execute apenas se o INSERT acima não funcionar)

-- Primeiro, obtenha o user_id da consulta do auth.users
-- Depois execute este INSERT substituindo o user_id:

/*
INSERT INTO public.profiles (user_id, email, full_name, role, is_active)
VALUES (
  'COLE_O_USER_ID_AQUI',
  'cainbrasil23@gmail.com',
  'Cain',
  'admin',
  true
);
*/