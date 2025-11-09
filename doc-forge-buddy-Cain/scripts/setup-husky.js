#!/usr/bin/env node

/**
 * Configurador de Husky para o projeto
 * Configura automaticamente todos os hooks necessários
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    log(`🔄 ${description}...`, colors.cyan);
    execSync(command, { stdio: 'pipe' });
    log(`✅ ${description} concluído!`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} falhou: ${error.message}`, colors.red);
    return false;
  }
}

function checkHusky() {
  const huskyPath = path.join(__dirname, '..', '.husky');
  
  if (!fs.existsSync(huskyPath)) {
    log('📁 Criando diretório .husky...', colors.yellow);
    fs.mkdirSync(huskyPath, { recursive: true });
  }

  const hooks = ['pre-commit', 'commit-msg', 'pre-push', 'post-merge'];
  const missingHooks = [];

  hooks.forEach(hook => {
    const hookPath = path.join(huskyPath, hook);
    if (!fs.existsSync(hookPath)) {
      missingHooks.push(hook);
    }
  });

  if (missingHooks.length > 0) {
    log(`📋 Hooks ausentes: ${missingHooks.join(', ')}`, colors.yellow);
    return false;
  }

  log('✅ Todos os hooks Husky estão presentes!', colors.green);
  return true;
}

function setupGitHooks() {
  const gitHooksPath = path.join(__dirname, '..', '.git', 'hooks');
  
  if (fs.existsSync(gitHooksPath)) {
    const hooks = ['pre-commit', 'commit-msg', 'pre-push', 'post-merge'];
    
    hooks.forEach(hook => {
      const huskyHook = path.join(__dirname, '..', '.husky', hook);
      const gitHook = path.join(gitHooksPath, hook);
      
      if (fs.existsSync(huskyHook)) {
        try {
          // Copiar hook do Husky para .git/hooks
          fs.copyFileSync(huskyHook, gitHook);
          // Dar permissão de execução (Linux/Mac)
          try {
            execSync(`chmod +x "${gitHook}"`);
          } catch (chmodError) {
            // Ignorar erros de chmod no Windows
          }
          log(`✅ Hook ${hook} configurado no Git`, colors.green);
        } catch (copyError) {
          log(`⚠️  Não foi possível configurar hook ${hook}: ${copyError.message}`, colors.yellow);
        }
      }
    });
  } else {
    log('⚠️  Repositório Git não encontrado ou não inicializado', colors.yellow);
  }
}

function verifyDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json não encontrado!', colors.red);
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const devDeps = packageJson.devDependencies || {};
  
  const requiredDeps = {
    'husky': '^9.0.0',
    'lint-staged': '^16.0.0',
    'eslint': '^9.0.0',
    'prettier': '^3.0.0',
    'typescript': '^5.0.0',
    '@commitlint/cli': '^20.0.0',
    '@commitlint/config-conventional': '^20.0.0',
  };

  let allDepsPresent = true;
  
  Object.entries(requiredDeps).forEach(([dep, version]) => {
    if (!devDeps[dep]) {
      log(`❌ Dependência ausente: ${dep} (versão ${version})`, colors.red);
      allDepsPresent = false;
    } else {
      log(`✅ ${dep} instalado`, colors.green);
    }
  });

  return allDepsPresent;
}

function showStatus() {
  log('📊 Status do Sistema de Qualidade', colors.magenta);
  log('==================================', colors.magenta);
  
  // Verificar hooks
  checkHusky();
  
  // Verificar dependências
  verifyDependencies();
  
  // Verificar configuração lint-staged
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson['lint-staged']) {
    log('✅ lint-staged configurado', colors.green);
  } else {
    log('❌ lint-staged não configurado', colors.red);
  }
  
  // Verificar commitlint
  const commitlintConfigPath = path.join(__dirname, '..', 'commitlint.config.js');
  if (fs.existsSync(commitlintConfigPath)) {
    log('✅ commitlint configurado', colors.green);
  } else {
    log('❌ commitlint não configurado', colors.red);
  }
}

function testHooks() {
  log('🧪 Testando hooks do Husky...', colors.cyan);
  
  // Testar pre-commit
  try {
    execSync('npx husky run pre-commit', { stdio: 'pipe' });
    log('✅ Pre-commit hook funcionando', colors.green);
  } catch (error) {
    log('❌ Pre-commit hook com problemas', colors.red);
  }
  
  // Testar commit message validation
  const testCommitMsg = 'feat: test commit message validation';
  const tempFile = path.join(__dirname, '..', '.git', 'COMMIT_EDITMSG.tmp');
  
  try {
    fs.writeFileSync(tempFile, testCommitMsg);
    execSync(`node "${path.join(__dirname, 'validate-commit-msg.js')}" "${tempFile}"`, { stdio: 'pipe' });
    log('✅ Commit message validation funcionando', colors.green);
    fs.unlinkSync(tempFile);
  } catch (error) {
    log('❌ Commit message validation com problemas', colors.red);
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isCheckMode = args.includes('--check');
  
  if (isCheckMode) {
    log('🔍 Modo de Verificação - Status dos Hooks', colors.magenta);
    log('==========================================', colors.magenta);
    showStatus();
    return;
  }
  
  log('🚀 Configurador de Husky - Sistema de Qualidade', colors.magenta);
  log('=============================================', colors.magenta);
  
  // Verificar se está no diretório correto
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ Execute este script no diretório raiz do projeto', colors.red);
    process.exit(1);
  }
  
  // Verificar dependências
  if (!verifyDependencies()) {
    log('❌ Instale as dependências necessárias primeiro: npm install', colors.red);
    process.exit(1);
  }
  
  // Configurar Husky
  if (!checkHusky()) {
    log('📋 Execute a configuração manual dos hooks', colors.yellow);
  }
  
  // Setup Git hooks
  setupGitHooks();
  
  // Testar hooks
  testHooks();
  
  // Mostrar status
  showStatus();
  
  log('');
  log('🎉 Configuração do Husky concluída!', colors.green);
  log('');
  log('📖 Próximos passos:', colors.blue);
  log('1. Execute: npm run validate:quality-gates');
  log('2. Teste um commit: git commit -m "feat: test setup"');
  log('3. Consulte a documentação em docs/SETUP_GUIDE.md');
  log('');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`❌ Erro inesperado: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { checkHusky, verifyDependencies, testHooks };