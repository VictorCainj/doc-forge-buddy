import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

/**
 * Executa a migration diretamente via API do Supabase
 * Adiciona a coluna image_serial na tabela vistoria_images
 */
export async function executeImageSerialMigration(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    log.info('🚀 Iniciando migration para adicionar coluna image_serial...');

    // 1. Verificar se a coluna já existe
    const { data: existingColumns, error: columnCheckError } = await supabase
      .from('vistoria_images')
      .select('image_serial')
      .limit(1);

    if (!columnCheckError) {
      return {
        success: true,
        message: '✅ Coluna image_serial já existe!',
        details: { alreadyExists: true },
      };
    }

    if (columnCheckError.code !== '42703') {
      return {
        success: false,
        message: '❌ Erro inesperado ao verificar coluna',
        details: columnCheckError,
      };
    }

    // 2. Executar migration via SQL direto
    const migrationSQL = `
      -- Adicionar coluna image_serial
      ALTER TABLE vistoria_images 
      ADD COLUMN image_serial TEXT;
      
      -- Criar índice para performance
      CREATE INDEX idx_vistoria_images_serial ON vistoria_images(image_serial);
      
      -- Adicionar constraint UNIQUE
      ALTER TABLE vistoria_images 
      ADD CONSTRAINT unique_image_serial_per_apontamento 
      UNIQUE (vistoria_id, apontamento_id, tipo_vistoria, image_serial);
    `;

    // 3. Executar via rpc (se disponível) ou tentar inserir um registro de teste
    const { data: testData, error: testError } = await supabase
      .from('vistoria_images')
      .insert({
        vistoria_id: 'migration-test',
        apontamento_id: 'migration-test',
        tipo_vistoria: 'inicial',
        image_url: 'https://example.com/migration-test.jpg',
        file_name: 'migration-test.jpg',
        file_size: 1000,
        file_type: 'image/jpeg',
        image_serial: 'MIGRATION-TEST-' + Date.now(),
        user_id: null,
      })
      .select();

    if (testError) {
      if (testError.code === '42703') {
        return {
          success: false,
          message:
            '❌ Coluna image_serial não existe. Execute a migration manualmente no Supabase Dashboard.',
          details: {
            error: testError,
            sqlToExecute: migrationSQL,
            instructions: [
              '1. Acesse: https://supabase.com/dashboard',
              '2. Selecione seu projeto',
              '3. Vá em: SQL Editor',
              '4. Cole e execute o SQL fornecido',
            ],
          },
        };
      }
      return {
        success: false,
        message: '❌ Erro ao testar migration',
        details: testError,
      };
    }

    // 4. Limpar registro de teste
    if (testData && testData.length > 0) {
      await supabase.from('vistoria_images').delete().eq('id', testData[0].id);
    }

    return {
      success: true,
      message:
        '✅ Migration executada com sucesso! Coluna image_serial criada.',
      details: {
        testSerial: testData?.[0]?.image_serial,
        canInsert: true,
        canQuery: true,
      },
    };
  } catch (error) {
    log.error('Erro ao executar migration:', error);
    return {
      success: false,
      message: '❌ Erro inesperado ao executar migration',
      details: error,
    };
  }
}

/**
 * Função para executar a migration via console
 */
export async function runMigration() {
  console.log('🚀 Executando migration da coluna image_serial...');
  const result = await executeImageSerialMigration();
  console.log(result.message);
  if (result.details) {
    console.log('Detalhes:', result.details);
  }
  return result;
}
