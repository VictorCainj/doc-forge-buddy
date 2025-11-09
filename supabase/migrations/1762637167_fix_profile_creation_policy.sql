-- Migration: fix_profile_creation_policy
-- Created at: 1762637167


-- Remover a política antiga que pode estar causando o problema
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Criar nova política que permite criação de perfis tanto pelo trigger quanto por usuários
CREATE POLICY "Allow profile creation for trigger and users" 
ON profiles 
FOR INSERT 
TO public, authenticated
WITH CHECK (true);

-- Garantir que o trigger possa inserir mesmo com RLS habilitado
-- Já está usando SECURITY DEFINER que deveria funcionar
;