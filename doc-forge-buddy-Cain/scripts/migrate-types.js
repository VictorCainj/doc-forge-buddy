#!/usr/bin/env node

/**
 * Script de migração para tipos consolidados
 * Automatiza a migração de imports antigos para novos tipos compartilhados
 */

const fs = require('fs');
const path = require('path');

// Mapeamento de imports antigos para novos
const importMappings = {
  // Audit imports
  "@/types/business/audit": "@/types/shared/audit",
  "@/types/domain/audit": "@/types/shared/audit",
  
  // User/Profile imports  
  "@/types/business/admin": "@/types/shared/user",
  "@/types/domain/auth": "@/types/shared/user",
  
  // Contract imports
  "@/types/domain/contract": "@/types/shared/contract",
  
  // Vistoria imports
  "@/types/business/vistoria": "@/types/shared/vistoria",
  "@/types/business/vistoria.extended": "@/types/shared/vistoria",
  
  // Business domain imports
  "@/types/business": "@/types/shared",
  "@/types/domain": "@/types/shared"
};

// Tipos específicos que podem ser importados diretamente do shared
const directTypeImports = [
  'AuditLog',
  'AuditAction', 
  'AuditLogFilters',
  'UserProfile',
  'UserRole',
  'UserSession',
  'AuthError',
  'LoginError',
  'Contract',
  'ContractFormData',
  'DocumentType',
  'VistoriaType',
  'VistoriaAnalise',
  'ApontamentoVistoria',
  'DadosVistoria'
];

/**
 * Encontra arquivos TypeScript/JavaScript no projeto
 */
function findTypeScriptFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Pula node_modules e outros diretórios desnecessários
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

/**
 * Migra imports em um arquivo
 */
function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Substitui imports antigos
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      const oldImportRegex = new RegExp(`from ['"]${oldImport}['"]`, 'g');
      const newContent = content.replace(oldImportRegex, `from '${newImport}'`);
      
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`✅ Migrado import em: ${filePath.replace(process.cwd() + '/', '')}`);
      }
    }
    
    // Migra imports específicos de tipos
    for (const typeName of directTypeImports) {
      // Padrão: import { TypeName } from '@/types/business/...'
      const specificImportRegex = new RegExp(
        `import\\s*\\{\\s*${typeName}\\s*\\}\\s*from\\s*['"]@/types/(?:business|domain)/[^'"]*['"]`,
        'g'
      );
      
      const newContent = content.replace(
        specificImportRegex,
        `import { ${typeName} } from '@/types/shared'`
      );
      
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`✅ Migrado import específico ${typeName} em: ${filePath.replace(process.cwd() + '/', '')}`);
      }
    }
    
    // Salva arquivo se houve mudanças
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao migrar ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Gera relatório de migração
 */
function generateMigrationReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: results.totalFiles,
    migratedFiles: results.migratedFiles,
    errors: results.errors,
    summary: {
      success: results.migratedFiles,
      failed: results.errors.length,
      skipped: results.totalFiles - results.migratedFiles - results.errors.length
    }
  };
  
  const reportPath = path.join(process.cwd(), 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 RELATÓRIO DE MIGRAÇÃO');
  console.log('========================');
  console.log(`Total de arquivos analisados: ${results.totalFiles}`);
  console.log(`Arquivos migrados com sucesso: ${results.migratedFiles}`);
  console.log(`Arquivos com erro: ${results.errors.length}`);
  console.log(`Arquivos ignorados: ${results.totalFiles - results.migratedFiles - results.errors.length}`);
  console.log(`\nRelatório detalhado salvo em: ${reportPath}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    results.errors.forEach(error => {
      console.log(`  - ${error.file}: ${error.error}`);
    });
  }
}

/**
 * Função principal
 */
function main() {
  const projectRoot = process.cwd();
  const srcPath = path.join(projectRoot, 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Diretório src não encontrado. Execute este script na raiz do projeto.');
    process.exit(1);
  }
  
  console.log('🔄 Iniciando migração de tipos consolidados...');
  console.log(`Analisando arquivos em: ${srcPath}\n`);
  
  const files = findTypeScriptFiles(srcPath);
  const results = {
    totalFiles: files.length,
    migratedFiles: 0,
    errors: []
  };
  
  // Processa cada arquivo
  files.forEach(file => {
    try {
      if (migrateFile(file)) {
        results.migratedFiles++;
      }
    } catch (error) {
      results.errors.push({
        file: file.replace(projectRoot + '/', ''),
        error: error.message
      });
    }
  });
  
  // Gera relatório
  generateMigrationReport(results);
  
  console.log('\n✨ Migração concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Revisar os arquivos migrados para garantir que estão corretos');
  console.log('2. Executar type checking: npm run type-check');
  console.log('3. Testar a aplicação: npm run test');
  console.log('4. Verificar se há warnings de TypeScript');
  console.log('5. Considerar remover arquivos de tipos antigos quando todos os imports forem migrados');
}

// Executa migração se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  findTypeScriptFiles,
  migrateFile,
  importMappings,
  directTypeImports
};