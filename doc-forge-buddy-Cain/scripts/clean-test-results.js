#!/usr/bin/env node

/**
 * Script para limpar resultados de testes E2E
 * Executar com: node scripts/clean-test-results.js
 */

const fs = require('fs');
const path = require('path');

const dirsToClean = [
  path.join(__dirname, '../test-results'),
  path.join(__dirname, '../playwright-report'),
  path.join(__dirname, '../test-data/uploads'),
  path.join(__dirname, '../.lighthouseci'),
];

function cleanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`📂 Diretório não existe: ${dirPath}`);
    return;
  }

  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      console.log(`⚠️ Não é um diretório: ${dirPath}`);
      return;
    }

    const files = fs.readdirSync(dirPath);
    let deletedCount = 0;

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          deletedCount++;
        } else if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          deletedCount++;
        }
      } catch (error) {
        console.log(`❌ Erro ao remover ${filePath}:`, error.message);
      }
    });

    console.log(`🗑️ ${dirPath}: ${deletedCount} itens removidos`);
  } catch (error) {
    console.error(`❌ Erro ao limpar ${dirPath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Limpando resultados de testes E2E...\n');

  let totalCleaned = 0;

  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      const beforeCount = fs.readdirSync(dir).length;
      cleanDirectory(dir);
      totalCleaned += beforeCount;
    } else {
      console.log(`📂 Diretório não encontrado: ${dir}`);
    }
  });

  console.log(`\n✅ Limpeza concluída! Total de itens removidos: ${totalCleaned}`);

  // Verificar se há logs antigos do Playwright
  const playwrightCacheDir = path.join(__dirname, '../node_modules/.cache/ms-playwright');
  if (fs.existsSync(playwrightCacheDir)) {
    console.log('\nCache do Playwright encontrado em:');
    console.log(`   ${playwrightCacheDir}`);
    console.log('Para limpar cache do Playwright: npx playwright install --force');
  }
}

// Executar script
if (require.main === module) {
  main();
}