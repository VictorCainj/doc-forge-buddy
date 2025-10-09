import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configurações do Supabase
const SUPABASE_URL = 'https://agzutoonsruttqbjnclo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnenV0b29uc3J1dHRxYmpuY2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzA3OTIsImV4cCI6MjA3MjYwNjc5Mn0.jhhSy3qXsvlwFqoVVNDXGSYSgfs-Et_F2_ZAgqtAdj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixAdminProfile() {
  console.log('🔧 Iniciando correção do perfil de administrador...');
  
  try {
    // 1. Verificar se a tabela profiles existe
    console.log('📋 Verificando tabela profiles...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
    
    if (tableError) {
      console.log('❌ Erro ao verificar tabelas:', tableError.message);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('❌ Tabela profiles não existe. Execute a migração primeiro.');
      return;
    }
    
    console.log('✅ Tabela profiles encontrada');
    
    // 2. Verificar se o usuário existe na tabela profiles
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
      console.log('❌ Perfil não encontrado. Criando perfil...');
      
      // Buscar user_id do auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser.user) {
        console.log('❌ Usuário não autenticado. Faça login primeiro.');
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
      
      // 3. Atualizar role para admin se necessário
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
    
    // 4. Verificar RLS policies
    console.log('🔒 Verificando políticas RLS...');
    
    // Listar políticas existentes
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'profiles' })
      .select();
    
    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas:', policiesError.message);
    } else {
      console.log('📋 Políticas encontradas:', policies);
    }
    
    console.log('🎉 Correção concluída! Faça logout e login novamente.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  fixAdminProfile();
}

export { fixAdminProfile };