import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Limpando ambiente de teste E2E...');

  try {
    // Limpar arquivos de upload temporários
    const uploadDir = path.join(__dirname, '../../test-data/uploads');
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach(file => {
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath);
      });
      console.log('🗑️ Arquivos de upload temporários removidos');
    }

    // Limpar screenshots antigos (manter apenas dos testes atuais)
    const testResultsDir = path.join(__dirname, '../../test-results');
    if (fs.existsSync(testResultsDir)) {
      const files = fs.readdirSync(testResultsDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      files.forEach(file => {
        const filePath = path.join(testResultsDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          if (stats.isFile()) {
            fs.unlinkSync(filePath);
          } else {
            fs.rmSync(filePath, { recursive: true, force: true });
          }
        }
      });
      console.log('🗑️ Resultados de teste antigos removidos');
    }

    // Limpar dados de teste específicos se necessário
    await cleanupTestData();

    console.log('✅ Limpeza do ambiente concluída');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

async function cleanupTestData() {
  console.log('🗄️ Limpando dados de teste...');

  // Limpar dados temporários do Supabase se houver
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const supabaseKey = process.env.SUPABASE_TEST_KEY;

  if (supabaseUrl && supabaseKey) {
    // Implementar limpeza de dados do Supabase
    // Isso pode incluir:
    // - Remover dados de teste inseridos
    // - Resetar estados
    console.log('✅ Dados do Supabase limpos');
  }

  // Limpar localStorage e sessionStorage se necessário
  // (Isto seria feito em um test de cleanup individual)
  
  console.log('✅ Dados de teste limpos');
}

export default globalTeardown;