import { supabase } from '@/integrations/supabase/client';

/**
 * Utilitário para testar a conexão e permissões do Supabase
 */
export async function testSupabaseConnection() {
  console.log('🔍 === TESTE DE CONEXÃO SUPABASE ===\n');

  try {
    // 1. Verificar autenticação
    console.log('1️⃣ Verificando autenticação...');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
      return {
        success: false,
        error: 'Erro de autenticação',
        details: authError,
      };
    }

    if (!user) {
      console.error('❌ Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }

    console.log('✅ Usuário autenticado:', {
      id: user.id,
      email: user.email,
    });

    // 2. Verificar se consegue ler saved_terms
    console.log('\n2️⃣ Testando leitura de saved_terms...');
    const { data: readData, error: readError } = await supabase
      .from('saved_terms')
      .select('id, title, document_type')
      .limit(1);

    if (readError) {
      console.error('❌ Erro ao ler saved_terms:', readError);
      return {
        success: false,
        error: 'Erro ao ler tabela',
        details: readError,
      };
    }

    console.log(
      '✅ Leitura bem-sucedida. Registros encontrados:',
      readData?.length || 0
    );

    // 3. Testar insert mínimo
    console.log('\n3️⃣ Testando insert em saved_terms...');
    const testData = {
      title: `TESTE - ${new Date().toISOString()}`,
      content: JSON.stringify({ teste: true }),
      form_data: { teste: true },
      document_type: 'contrato',
      user_id: user.id,
    };

    console.log('📤 Dados do teste:', testData);

    const { data: insertData, error: insertError } = await supabase
      .from('saved_terms')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError);
      console.error('📋 Código do erro:', insertError.code);
      console.error('📋 Mensagem:', insertError.message);
      console.error('📋 Detalhes:', insertError.details);
      console.error('📋 Hint:', insertError.hint);
      return {
        success: false,
        error: 'Erro ao inserir',
        details: insertError,
        testData,
      };
    }

    console.log('✅ Insert bem-sucedido!', insertData);

    // 4. Limpar teste
    if (insertData?.id) {
      console.log('\n4️⃣ Limpando registro de teste...');
      await supabase.from('saved_terms').delete().eq('id', insertData.id);
      console.log('✅ Registro de teste removido');
    }

    console.log('\n✅ === TODOS OS TESTES PASSARAM ===\n');
    return {
      success: true,
      user,
      message: 'Conexão funcionando perfeitamente!',
    };
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return { success: false, error: 'Erro inesperado', details: error };
  }
}

/**
 * Executar teste pelo console do navegador:
 *
 * import('./src/utils/testSupabaseConnection.ts').then(module => {
 *   module.testSupabaseConnection().then(console.log);
 * });
 */
