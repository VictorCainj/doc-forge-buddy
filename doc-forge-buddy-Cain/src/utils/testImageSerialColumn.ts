import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

/**
 * Script para testar se a coluna image_serial foi criada corretamente
 */
export async function testImageSerialColumn(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    log.info('🔍 Testando se a coluna image_serial existe...');

    // 1. Tentar fazer uma consulta simples na coluna
    const { data: _data, error } = await supabase
      .from('vistoria_images')
      .select('id, image_serial')
      .limit(1);

    if (error) {
      if (error.code === '42703') {
        return {
          success: false,
          message:
            '❌ Coluna image_serial NÃO existe. Execute a migration primeiro.',
          details: error,
        };
      }
      return {
        success: false,
        message: '❌ Erro ao testar coluna image_serial',
        details: error,
      };
    }

    // 2. Tentar inserir um registro de teste (será revertido)
    const testSerial = `TEST-${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('vistoria_images')
      .insert({
        vistoria_id: 'test-migration',
        apontamento_id: 'test-migration',
        tipo_vistoria: 'inicial',
        image_url: 'https://example.com/test.jpg',
        file_name: 'test.jpg',
        file_size: 1000,
        file_type: 'image/jpeg',
        image_serial: testSerial,
        user_id: null,
      })
      .select();

    if (insertError) {
      return {
        success: false,
        message: '❌ Erro ao inserir registro de teste',
        details: insertError,
      };
    }

    // 3. Limpar o registro de teste
    if (insertData && insertData.length > 0) {
      await supabase
        .from('vistoria_images')
        .delete()
        .eq('id', insertData[0].id);
    }

    return {
      success: true,
      message: '✅ Coluna image_serial existe e está funcionando corretamente!',
      details: {
        testSerial,
        canInsert: true,
        canQuery: true,
      },
    };
  } catch (error) {
    log.error('Erro ao testar coluna image_serial:', error);
    return {
      success: false,
      message: '❌ Erro inesperado ao testar coluna',
      details: error,
    };
  }
}

/**
 * Função para executar o teste via console
 */
export async function runImageSerialTest() {
  console.log('🧪 Iniciando teste da coluna image_serial...');
  const result = await testImageSerialColumn();
  console.log(result.message);
  if (result.details) {
    console.log('Detalhes:', result.details);
  }
  return result;
}
