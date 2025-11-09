#!/usr/bin/env node

/**
 * Validador de conventional commits
 * Verifica se a mensagem de commit segue o padrão conventional commits
 */

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
  white: '\x1b[37m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const COMMIT_TYPES = {
  feat: 'Nova funcionalidade',
  fix: 'Correção de bug',
  docs: 'Alteração na documentação',
  style: 'Alteração de formatação (não afeta lógica)',
  refactor: 'Refatoração de código',
  test: 'Adicionar ou alterar testes',
  chore: 'Alterações em build, dependências, etc.',
  ci: 'Alterações em CI/CD',
  perf: 'Melhoria de performance',
  build: 'Alterações no build',
  revert: 'Reverter commit anterior',
};

const CONVENTIONAL_COMMIT_REGEX = /^(feat|fix|docs|style|refactor|test|chore|ci|perf|build|revert)(\(.+\))?: .{1,50}/;

function validateCommitMessage(commitMessage) {
  // Verificar se a mensagem está vazia
  if (!commitMessage || commitMessage.trim().length === 0) {
    return {
      valid: false,
      error: 'Mensagem de commit não pode estar vazia',
    };
  }

  // Remover linhas vazias do início e fim
  const cleanMessage = commitMessage.trim();

  // Verificar se é um merge commit
  if (cleanMessage.startsWith('Merge ')) {
    return {
      valid: true,
      type: 'merge',
      message: 'Merge commit detectado',
    };
  }

  // Verificar se é um revert commit
  if (cleanMessage.startsWith('revert ')) {
    return {
      valid: true,
      type: 'revert',
      message: 'Revert commit detectado',
    };
  }

  // Verificar se segue conventional commits
  if (CONVENTIONAL_COMMIT_REGEX.test(cleanMessage)) {
    const match = cleanMessage.match(CONVENTIONAL_COMMIT_REGEX);
    const type = match[1];
    const scope = match[2] ? match[2].replace(/[()]/g, '') : null;
    
    return {
      valid: true,
      type: 'conventional',
      commitType: type,
      scope: scope,
      message: `Conventional commit válido: ${type}${scope ? `(${scope})` : ''}`,
    };
  }

  return {
    valid: false,
    error: 'Mensagem de commit não segue o padrão conventional commits',
  };
}

function showHelp() {
  log('📚 Guia de Conventional Commits', colors.magenta);
  log('==============================', colors.magenta);
  log('');
  log('Formato: <tipo>[escopo opcional]: <descrição>', colors.cyan);
  log('');
  log('📋 Tipos válidos:', colors.yellow);
  
  Object.entries(COMMIT_TYPES).forEach(([type, description]) => {
    log(`  ${type.padEnd(8)} - ${description}`);
  });
  
  log('');
  log('📝 Exemplos:', colors.yellow);
  log('  feat: add new user authentication');
  log('  fix(auth): resolve login issue');
  log('  docs: update API documentation');
  log('  refactor(api): simplify user service');
  log('  test(auth): add login integration tests');
  log('  chore(deps): update @supabase/supabase-js to v2.57.0');
  log('');
  log('💡 Dicas:', colors.green);
  log('  - Use imperativo na descrição (add, fix, update)');
  log('  - Limite a descrição a 50 caracteres');
  log('  - Não coloque ponto no final da descrição');
  log('  - Use escopo para especificar área afetada');
}

async function main() {
  const commitMsgFile = process.argv[2];
  
  if (!commitMsgFile) {
    log('❌ Uso: node validate-commit-msg.js <commit-msg-file>', colors.red);
    process.exit(1);
  }

  // Verificar se o arquivo existe
  if (!fs.existsSync(commitMsgFile)) {
    log(`❌ Arquivo não encontrado: ${commitMsgFile}`, colors.red);
    process.exit(1);
  }

  // Ler a mensagem de commit
  const commitMessage = fs.readFileSync(commitMsgFile, 'utf8');
  
  // Validar a mensagem
  const validation = validateCommitMessage(commitMessage);
  
  if (validation.valid) {
    log(`✅ ${validation.message}`, colors.green);
    process.exit(0);
  } else {
    log(`❌ ${validation.error}`, colors.red);
    log('');
    showHelp();
    
    if (commitMessage.trim()) {
      log(`📄 Mensagem atual: "${commitMessage.trim()}"`, colors.white);
    }
    
    process.exit(1);
  }
}

// Verificar se está sendo executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`❌ Erro inesperado: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { validateCommitMessage, COMMIT_TYPES };