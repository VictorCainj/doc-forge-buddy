import { supabase } from '@/integrations/supabase/client';

/**
 * Script para verificar e atualizar o perfil do usuário
 */
export async function checkAndFixUserProfile() {
  try {
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Erro ao obter usuário:', userError);
      return { success: false, error: 'Usuário não encontrado' };
    }

    console.log('✅ Usuário encontrado:', user.email);
    console.log('📋 User ID:', user.id);

    // Verificar se existe profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError);
      
      // Tentar criar profile
      console.log('🔧 Tentando criar profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          role: 'admin',
          full_name: user.email?.split('@')[0] || 'Admin',
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar profile:', createError);
        return { success: false, error: createError.message };
      }

      console.log('✅ Profile criado com sucesso:', newProfile);
      return { success: true, profile: newProfile, action: 'created' };
    }

    console.log('✅ Profile encontrado:', profile);
    console.log('👤 Nome:', profile.full_name);
    console.log('🔑 Role:', profile.role);

    // Se não for admin, atualizar
    if (profile.role !== 'admin') {
      console.log('🔧 Atualizando role para admin...');
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar profile:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('✅ Profile atualizado para admin:', updatedProfile);
      return { success: true, profile: updatedProfile, action: 'updated' };
    }

    return { success: true, profile, action: 'verified' };
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Verificar perfil do usuário atual (apenas leitura)
 */
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return {
      user,
      profile,
      isAdmin: profile?.role === 'admin',
    };
  } catch (error) {
    console.error('Erro ao verificar profile:', error);
    return null;
  }
}
