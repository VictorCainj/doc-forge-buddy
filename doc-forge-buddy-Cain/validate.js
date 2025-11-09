#!/usr/bin/env node

/**
 * Script Principal de Validação das Otimizações Vite
 * Executa validação completa de todas as otimizações implementadas
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 VALIDADOR DE OTIMIZAÇÕES VITE - DOC FORGE BUDDY');
console.log('====================================================\n');

async function runValidation() {
  try {
    console.log('📋 Iniciando validação completa das otimizações...\n');
    
    // 1. Instalar dependências se necessário
    console.log('1️⃣ Verificando dependências...');
    try {
      await execAsync('npm list @lhci/cli rollup-plugin-visualizer');
      console.log('✅ Dependências OK\n');
    } catch (error) {
      console.log('⚠️ Instalando dependências de desenvolvimento...');
      await execAsync('npm install --save-dev @lhci/cli rollup-plugin-visualizer cssnano');
      console.log('✅ Dependências instaladas\n');
    }
    
    // 2. Executar validação
    console.log('2️⃣ Executando validação das otimizações...');
    
    return new Promise((resolve, reject) => {
      const validate = spawn('node', ['scripts/validate-optimizations.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
      });
      
      validate.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Validação falhou com código ${code}`));
        }
      });
      
      validate.on('error', (error) => {
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro durante validação:', error.message);
    process.exit(1);
  }
}

// Executar validação
runValidation()
  .then(() => {
    console.log('\n🎉 Validação completa executada com sucesso!');
    console.log('\n📊 Para ver os resultados:');
    console.log('  • Relatório: cat dist/optimization-validation.json');
    console.log('  • Performance: cat dist/performance-report.md');
    console.log('  • Bundle Analysis: open dist/bundle-analysis.html');
    console.log('\n🚀 Projeto pronto para deploy em produção!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na validação:', error.message);
    console.log('\n🔧 Para corrigir problemas:');
    console.log('  1. Revise os erros acima');
    console.log('  2. Execute: npm run build:production');
    console.log('  3. Execute: node scripts/performance-monitor.js');
    console.log('  4. Consulte: PERFORMANCE_OPTIMIZATIONS.md');
    process.exit(1);
  });