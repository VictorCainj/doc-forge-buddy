import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configurações do Supabase
const SUPABASE_URL = 'https://agzutoonsruttqbjnclo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnenV0b29uc3J1dHRxYmpuY2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzA3OTIsImV4cCI6MjA3MjYwNjc5Mn0.jhhSy3qXsvlwFqoVVNDXGSYSgfs-Et_F2_ZAgqtAdj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixAdminProfile() {
  console.log('🔧 Corrigindo perfil de administrador...');
  
  try {
    // 1. Desabilitar RLS temporariamente para fazer as correções
    console.log('🔓 Desabilitando RLS temporariamente...');
    
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) {
      console.log('⚠️ Não foi possível desabilitar RLS via RPC:', disableError.message);
      console.log('📝 Você precisará executar manualmente no SQL Editor do Supabase:');
      console.log('   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;');
    } else {
      console.log('✅ RLS desabilitado temporariamente');
    }
    
    // 2. Verificar se o perfil existe
    console.log('👤 Verificando perfil do usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'cainbrasil23@gmail.com')
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }
    
    if (!profile) {
      console.log('📝 Perfil não encontrado. Criando perfil...');
      
      // Buscar user_id do auth.users (isso pode não funcionar sem service role)
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        console.log('❌ Não foi possível obter dados do usuário autenticado.');
        console.log('📝 Você precisará executar manualmente no SQL Editor:');
        console.log(`
-- Execute este SQL no Supabase SQL Editor:

-- 1. Desabilitar RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Criar/atualizar perfil do Cain
INSERT INTO public.profiles (user_id, email, role, full_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'cainbrasil23@gmail.com'),
  'cainbrasil23@gmail.com',
  'admin',
  'Cain'
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  full_name = 'Cain';

-- 3. Recriar políticas simples
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow profile creation" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 4. Verificar resultado
SELECT * FROM profiles WHERE email = 'cainbrasil23@gmail.com';
        `);
        return;
      }
      
      // Criar perfil
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: authUser.user.id,
          email: 'cainbrasil23@gmail.com',
          full_name: 'Cain',
          role: 'admin',
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Erro ao criar perfil:', createError.message);
        return;
      }
      
      console.log('✅ Perfil criado:', newProfile);
    } else {
      console.log('📋 Perfil encontrado:', profile);
      
      // Atualizar role para admin se necessário
      if (profile.role !== 'admin') {
        console.log('🔄 Atualizando role para admin...');
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('email', 'cainbrasil23@gmail.com')
          .select()
          .single();
        
        if (updateError) {
          console.log('❌ Erro ao atualizar perfil:', updateError.message);
          return;
        }
        
        console.log('✅ Perfil atualizado:', updatedProfile);
      } else {
        console.log('✅ Usuário já é administrador');
      }
    }
    
    // 3. Recriar políticas simples
    console.log('🔒 Recriando políticas RLS...');
    
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
        
        CREATE POLICY "Users can view own profile" ON public.profiles
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Allow profile creation" ON public.profiles
          FOR INSERT WITH CHECK (true);
      `
    });
    
    if (enableError) {
      console.log('⚠️ Não foi possível recriar políticas via RPC:', enableError.message);
    } else {
      console.log('✅ Políticas RLS recriadas');
    }
    
    console.log('🎉 Correção concluída! Faça logout e login novamente.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixAdminProfile();