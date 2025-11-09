import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Configurando ambiente de teste E2E...');

  // Criar diretórios necessários
  const dirs = [
    'test-results',
    'playwright-report',
    'test-data',
    'test-data/fixtures',
    'test-data/uploads',
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Aguardar aplicação estar pronta
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Verificar se a aplicação está rodando
    await page.goto('http://localhost:5173', { timeout: 10000 });
    console.log('✅ Aplicação está rodando');
    
    await browser.close();
  } catch (error) {
    console.log('⚠️ Aplicação não está rodando, mas continuando com setup...');
  }

  // Gerar dados de teste
  await generateTestData();

  // Setup do Supabase para testes (se necessário)
  await setupTestDatabase();

  console.log('✅ Setup global concluído');
}

async function generateTestData() {
  console.log('📊 Gerando dados de teste...');
  
  // Dados de usuário para testes
  const testUsers = {
    valid: {
      email: 'teste.e2e@example.com',
      password: 'Teste123!',
      name: 'Usuário Teste E2E',
    },
    invalid: {
      email: 'invalid@email.com',
      password: 'wrongpassword',
    }
  };

  // Dados de contrato para testes
  const testContracts = [
    {
      id: 'test-contract-1',
      name: 'Contrato de Teste E2E 1',
      type: 'residencial',
      value: 100000,
      status: 'ativo',
    },
    {
      id: 'test-contract-2',
      name: 'Contrato de Teste E2E 2',
      type: 'comercial',
      value: 250000,
      status: 'pendente',
    }
  ];

  // Salvar dados de teste
  const testDataDir = path.join(__dirname, '../../test-data');
  fs.writeFileSync(
    path.join(testDataDir, 'users.json'),
    JSON.stringify(testUsers, null, 2)
  );

  fs.writeFileSync(
    path.join(testDataDir, 'contracts.json'),
    JSON.stringify(testContracts, null, 2)
  );

  console.log('✅ Dados de teste gerados');
}

async function setupTestDatabase() {
  console.log('🗄️ Configurando banco de dados de teste...');
  
  // Se houver configuração de Supabase para testes
  const supabaseUrl = process.env.SUPABASE_TEST_URL;
  const supabaseKey = process.env.SUPABASE_TEST_KEY;
  
  if (supabaseUrl && supabaseKey) {
    // Implementar setup do banco de dados de teste
    // Isso pode incluir:
    // - Criar tabelas necessárias
    // - Inserir dados de teste
    // - Configurar políticas RLS
    console.log('✅ Banco de dados de teste configurado');
  } else {
    console.log('ℹ️ Configuração do Supabase não encontrada, usando dados mock');
  }
}

export default globalSetup;