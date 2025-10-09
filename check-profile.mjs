import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://agzutoonsruttqbjnclo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnenV0b29uc3J1dHRxYmpuY2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzA3OTIsImV4cCI6MjA3MjYwNjc5Mn0.jhhSy3qXsvlwFqoVVNDXGSYSgfs-Et_F2_ZAgqtAdj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkProfile() {
  console.log('🔍 Verificando estado do perfil de administrador...');
  
  try {
    // Verificar se a tabela profiles existe
    console.log('📋 Verificando tabela profiles...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'cainbrasil23@gmail.com')
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      console.log('Código do erro:', profileError.code);
      
      if (profileError.code === 'PGRST116') {
        console.log('📝 Perfil não encontrado. Precisa ser criado.');
      } else if (profileError.code === 'PGRST301') {
        console.log('🔒 Erro de RLS. As políticas estão bloqueando o acesso.');
      }
      
      return;
    }
    
    console.log('✅ Perfil encontrado:', profile);
    
    if (profile.role === 'admin') {
      console.log('🎉 Usuário já é administrador!');
    } else {
      console.log('⚠️ Usuário não é administrador. Role atual:', profile.role);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkProfile();