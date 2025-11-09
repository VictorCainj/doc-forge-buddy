#!/usr/bin/env node

/**
 * Script de validação de qualidade para pre-commit hooks
 * Executa verificações de qualidade de código de forma rápida
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`🔍 ${description}...`, colors.cyan);
    execSync(command, { stdio: 'pipe' });
    log(`✅ ${description} executado com sucesso!`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} falhou!`, colors.red);
    return false;
  }
}

async function main() {
  log('🚀 Iniciando validações de qualidade...', colors.magenta);
  
  const startTime = Date.now();
  let hasErrors = false;

  // Verificar se os arquivos TypeScript/JavaScript têm erros de sintaxe
  if (!runCommand('npx tsc --noEmit', 'TypeScript type check')) {
    hasErrors = true;
  }

  // Verificar ESLint
  if (!runCommand('npm run lint', 'ESLint')) {
    hasErrors = true;
  }

  // Verificar Prettier (apenas verificar, não modificar)
  try {
    log('🔍 Verificando formatação Prettier...', colors.cyan);
    execSync('npx prettier --check .', { stdio: 'pipe' });
    log('✅ Formatação Prettier está correta!', colors.green);
  } catch (error) {
    log('❌ Formatação Prettier precisa ser corrigida!', colors.red);
    log('💡 Execute: npm run lint:fix', colors.yellow);
    hasErrors = true;
  }

  // Executar testes apenas se não há erros de lint/type check
  if (!hasErrors) {
    if (!runCommand('npm run test:unit', 'Testes unitários')) {
      hasErrors = true;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log(`⏱️  Tempo total: ${duration}s`, colors.blue);

  if (hasErrors) {
    log('❌ Validações falharam! Corrija os erros antes de fazer commit.', colors.red);
    process.exit(1);
  } else {
    log('🎉 Todas as validações passaram!', colors.green);
    process.exit(0);
  }
}

// Verificar se está sendo executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`❌ Erro inesperado: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { main, runCommand };