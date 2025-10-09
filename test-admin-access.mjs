import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://agzutoonsruttqbjnclo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnenV0b29uc3J1dHRxYmpuY2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzA3OTIsImV4cCI6MjA3MjYwNjc5Mn0.jhhSy3qXsvlwFqoVVNDXGSYSgfs-Et_F2_ZAgqtAdj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdminAccess() {
  console.log('🧪 Testando acesso de administrador...');
  
  try {
    // 1. Verificar se consegue acessar o perfil
    console.log('👤 Verificando perfil do Cain...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'cainbrasil23@gmail.com')
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      console.log('Código do erro:', profileError.code);
      return;
    }
    
    console.log('✅ Perfil encontrado:', {
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
      is_active: profile.is_active
    });
    
    // 2. Verificar se é admin
    if (profile.role === 'admin') {
      console.log('🎉 Usuário é ADMINISTRADOR!');
      console.log('✅ Deve ter acesso ao menu "Administrador" na sidebar');
      console.log('✅ Deve poder acessar /admin');
    } else {
      console.log('⚠️ Usuário NÃO é administrador. Role atual:', profile.role);
    }
    
    // 3. Verificar se está ativo
    if (profile.is_active) {
      console.log('✅ Usuário está ATIVO');
    } else {
      console.log('❌ Usuário está INATIVO');
    }
    
    // 4. Testar contagem de usuários (funcionalidade de admin)
    console.log('📊 Testando funcionalidades de admin...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) {
      console.log('⚠️ Não foi possível contar usuários:', usersError.message);
    } else {
      console.log('✅ Conseguiu acessar contagem de usuários:', users);
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse: http://localhost:8081');
    console.log('2. Faça login com: cainbrasil23@gmail.com');
    console.log('3. Verifique se aparece "Administrador" na sidebar');
    console.log('4. Clique em "Administrador" para acessar o painel');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAdminAccess();