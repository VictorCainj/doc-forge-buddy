#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

console.log('🎯 Executando validação completa de Quality Gates...\n');

const checks = [
  {
    name: 'Lint Check',
    command: 'npm run lint',
    critical: true,
    description: 'Validando ESLint e code style'
  },
  {
    name: 'Type Check',
    command: 'npm run type-check',
    critical: true,
    description: 'Validando TypeScript compilation'
  },
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    critical: true,
    description: 'Executando testes unitários'
  },
  {
    name: 'Coverage Validation',
    command: 'npm run coverage:threshold',
    critical: true,
    description: 'Validando thresholds de coverage'
  },
  {
    name: 'Security Audit',
    command: 'npm run security:audit',
    critical: false,
    description: 'Verificando vulnerabilidades'
  }
];

let failedChecks = [];
let passedChecks = [];

function runCheck(check) {
  console.log(`🔍 ${check.description}...`);
  
  try {
    const startTime = Date.now();
    execSync(check.command, { stdio: 'inherit' });
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${check.name} passou (${Math.round(duration / 1000)}s)\n`);
    passedChecks.push({ ...check, duration });
    return true;
  } catch (error) {
    const status = check.critical ? '❌' : '⚠️';
    console.log(`${status} ${check.name} falhou (CRITICAL: ${check.critical})\n`);
    failedChecks.push({ ...check, error: error.message });
    return false;
  }
}

async function runAllChecks() {
  console.log('=' .repeat(60));
  console.log('🏃 INICIANDO QUALITY GATES VALIDATION');
  console.log('=' .repeat(60));
  console.log(`🕐 Started at: ${new Date().toLocaleString()}\n`);

  // Verificar se node_modules existe
  if (!existsSync('node_modules')) {
    console.error('❌ node_modules não encontrado. Execute: npm install');
    process.exit(1);
  }

  // Executar cada check sequencialmente
  for (const check of checks) {
    const success = runCheck(check);
    
    // Se um check crítico falhar, continuar mas marcar como falha
    if (!success && check.critical) {
      console.log(`⚠️ Check crítico falhou: ${check.name}`);
      console.log('Continuando com outros checks...\n');
    }
  }

  // Resumo final
  console.log('=' .repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('=' .repeat(60));

  console.log(`\n✅ Checks Passaram (${passedChecks.length}/${checks.length}):`);
  passedChecks.forEach(check => {
    console.log(`  • ${check.name} (${Math.round(check.duration / 1000)}s)`);
  });

  if (failedChecks.length > 0) {
    console.log(`\n❌ Checks Falharam (${failedChecks.length}/${checks.length}):`);
    failedChecks.forEach(check => {
      const criticality = check.critical ? 'CRITICAL' : 'WARNING';
      console.log(`  • ${check.name} [${criticality}]`);
    });
  }

  // Verificar coverage especificamente
  if (existsSync('coverage/coverage-summary.json')) {
    console.log('\n📊 COVERAGE SUMMARY:');
    try {
      const coverageData = JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json', 'utf8'));
      const { total } = coverageData;
      
      console.log(`  📝 Statements: ${total.statements.pct}%`);
      console.log(`  🌳 Branches: ${total.branches.pct}%`);
      console.log(`  ⚙️  Functions: ${total.functions.pct}%`);
      console.log(`  📈 Lines: ${total.lines.pct}%`);
      
      const allAbove80 = ['statements', 'branches', 'functions', 'lines']
        .every(metric => total[metric].pct >= 80);
      
      if (allAbove80) {
        console.log('  🎯 Global coverage: 80%+ em todas métricas ✅');
      } else {
        console.log('  ⚠️  Global coverage: Abaixo de 80% em alguma métrica');
      }
    } catch (error) {
      console.log('  ⚠️  Erro ao ler coverage summary');
    }
  }

  // Decision final
  const criticalFailures = failedChecks.filter(check => check.critical);
  const hasCriticalFailures = criticalFailures.length > 0;

  console.log('\n' + '=' .repeat(60));
  if (hasCriticalFailures) {
    console.log('❌ QUALITY GATES FALHARAM');
    console.log(`\n🔴 ${criticalFailures.length} checks críticos falharam:`);
    criticalFailures.forEach(check => {
      console.log(`   • ${check.name}`);
    });
    console.log('\n📋 Ações necessárias:');
    console.log('  1. Corrija os erros de lint/TypeScript');
    console.log('  2. Adicione testes para coverage insuficiente');
    console.log('  3. Resolva vulnerabilidades de segurança');
    console.log('  4. Execute novamente: npm run quality-gates');
    process.exit(1);
  } else {
    console.log('✅ QUALITY GATES PASSARAM');
    console.log('\n🎯 Todos os checks críticos passaram!');
    
    if (failedChecks.length > 0) {
      console.log(`⚠️ ${failedChecks.length} warnings encontrados (não críticos)`);
    }
    
    console.log('\n🚀 Pronto para deploy/production!');
    console.log('📊 Execute: npm run coverage:reports para relatórios detalhados');
  }
}

runAllChecks().catch(error => {
  console.error('💥 Erro inesperado durante validation:', error.message);
  process.exit(1);
});