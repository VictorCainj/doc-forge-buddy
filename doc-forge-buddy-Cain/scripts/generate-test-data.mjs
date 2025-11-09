#!/usr/bin/env node

/**
 * Script para gerar dados de teste e arquivos falsos
 * Executar com: node scripts/generate-test-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretórios
const testDataDir = path.join(__dirname, '../test-data');
const fixturesDir = path.join(testDataDir, 'fixtures');
const uploadsDir = path.join(testDataDir, 'uploads');

// Criar diretórios se não existirem
function createDirectories() {
  [testDataDir, fixturesDir, uploadsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Criado diretório: ${dir}`);
    }
  });
}

// Gerar imagem PNG falsa para testes
function generateFakeImage(filename, width = 800, height = 600) {
  // PNG header minimal
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
  ]);
  
  const widthHex = Buffer.from([
    (width >> 24) & 0xFF,
    (width >> 16) & 0xFF,
    (width >> 8) & 0xFF,
    width & 0xFF
  ]);
  
  const heightHex = Buffer.from([
    (height >> 24) & 0xFF,
    (height >> 16) & 0xFF,
    (height >> 8) & 0xFF,
    height & 0xFF
  ]);
  
  const fakeImage = Buffer.concat([
    pngHeader,
    widthHex,
    heightHex,
    Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]) // bit depth, color type, etc.
  ]);
  
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, fakeImage);
  console.log(`🖼️ Gerada imagem: ${filename} (${width}x${height})`);
}

// Gerar PDF falso para testes
function generateFakePDF(filename) {
  const fakePDF = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Arquivo de Teste E2E) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000375 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
460
%%EOF`);
  
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, fakePDF);
  console.log(`📄 Gerado PDF: ${filename}`);
}

// Gerar JSON de dados de teste
function generateTestData() {
  const testData = {
    users: {
      valid: {
        email: 'teste.e2e@example.com',
        password: 'Teste123!',
        name: 'Usuário Teste E2E',
        cpf: '123.456.789-00',
        phone: '(11) 99999-9999',
      },
      invalid: {
        email: 'invalid@email.com',
        password: 'wrongpassword',
      }
    },
    contracts: [
      {
        id: 'test-contract-1',
        name: 'Contrato de Teste E2E 1',
        type: 'residencial',
        value: 100000,
        status: 'ativo',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        address: {
          street: 'Rua Teste, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        }
      },
      {
        id: 'test-contract-2',
        name: 'Contrato de Teste E2E 2',
        type: 'comercial',
        value: 250000,
        status: 'pendente',
        startDate: '2024-02-01',
        endDate: '2025-01-31',
        address: {
          street: 'Av. Comercial, 456',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '20000-000'
        }
      },
      {
        id: 'test-contract-3',
        name: 'Contrato de Teste E2E 3',
        type: 'industrial',
        value: 500000,
        status: 'concluido',
        startDate: '2023-06-01',
        endDate: '2024-05-31',
        address: {
          street: 'Rod. Industrial, 789',
          city: 'Belo Horizonte',
          state: 'MG',
          zipCode: '30000-000'
        }
      }
    ],
    vistorias: [
      {
        id: 'vistoria-test-1',
        contractId: 'test-contract-1',
        title: 'Vistoria Teste E2E 1',
        date: '2024-03-15',
        status: 'concluida',
        environments: [
          {
            name: 'Sala de Estar',
            area: 25.5,
            observations: 'Ambiente em bom estado'
          },
          {
            name: 'Cozinha',
            area: 12.0,
            observations: 'Necessita reparo na pia'
          }
        ]
      },
      {
        id: 'vistoria-test-2',
        contractId: 'test-contract-2',
        title: 'Vistoria Teste E2E 2',
        date: '2024-04-01',
        status: 'em_andamento',
        environments: [
          {
            name: 'Escritório',
            area: 30.0,
            observations: 'Ambiente climatizado'
          }
        ]
      }
    ],
    documents: [
      {
        id: 'doc-test-1',
        title: 'Documento Teste E2E 1',
        type: 'contrato',
        content: 'Conteúdo do documento de teste',
        createdAt: '2024-03-15T10:00:00Z'
      },
      {
        id: 'doc-test-2',
        title: 'Laudo de Vistoria Teste',
        type: 'laudo',
        content: 'Laudo técnico gerado pelos testes',
        createdAt: '2024-03-16T14:30:00Z'
      }
    ]
  };

  const dataPath = path.join(testDataDir, 'test-data.json');
  fs.writeFileSync(dataPath, JSON.stringify(testData, null, 2));
  console.log(`📊 Gerados dados de teste: test-data.json`);
}

// Gerar dados de formulário para autocomplete
function generateFormData() {
  const formData = {
    estados: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'],
    tiposContrato: ['residencial', 'comercial', 'industrial', 'rural'],
    statusContrato: ['ativo', 'pendente', 'concluido', 'cancelado'],
    tiposDocumento: ['contrato', 'laudo', 'relatorio', 'certidao'],
    ambientes: ['Sala de Estar', 'Cozinha', 'Quarto', 'Banheiro', 'Escritório', 'Garagem', 'Área de Serviço', 'Jardim', 'Varanda'],
    statusVistoria: ['agendada', 'em_andamento', 'concluida', 'cancelada'],
    problemas: ['vazamento', 'infestacao', 'estrutura', 'eletrica', 'hidraulica', 'pintura', 'pisos', 'portas', 'janelas']
  };

  const formDataPath = path.join(fixturesDir, 'form-data.json');
  fs.writeFileSync(formDataPath, JSON.stringify(formData, null, 2));
  console.log(`📋 Gerados dados de formulário: form-data.json`);
}

// Função principal
function main() {
  console.log('🚀 Gerando dados de teste para E2E...\n');

  try {
    createDirectories();
    console.log('');

    // Gerar arquivos de imagem
    generateFakeImage('vistoria-room.jpg', 1200, 800);
    generateFakeImage('vistoria-kitchen.jpg', 1000, 750);
    generateFakeImage('contract-signature.png', 600, 400);
    generateFakeImage('document-header.png', 800, 200);
    console.log('');

    // Gerar PDFs falsos
    generateFakePDF('contrato-teste.pdf');
    generateFakePDF('laudo-vistoria.pdf');
    generateFakePDF('relatorio-tecnico.pdf');
    console.log('');

    // Gerar dados JSON
    generateTestData();
    generateFormData();
    console.log('');

    console.log('✅ Dados de teste gerados com sucesso!');
    console.log(`📁 Localização: ${testDataDir}`);
    console.log(`   - Imagens: ${uploadsDir}`);
    console.log(`   - Dados: ${testDataDir}/test-data.json`);
    console.log(`   - Formulários: ${fixturesDir}/form-data.json`);

  } catch (error) {
    console.error('❌ Erro ao gerar dados de teste:', error);
    process.exit(1);
  }
}

// Executar script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  generateFakeImage,
  generateFakePDF,
  generateTestData,
  generateFormData
};