#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Caminho do arquivo de coverage
const coverageFile = path.join(__dirname, '..', 'coverage', 'coverage-final.json');

// Thresholds definidos
const thresholds = {
  global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  components: { statements: 90, branches: 90, functions: 90, lines: 90 },
  utils: { statements: 85, branches: 85, functions: 85, lines: 85 }
};

// Função para obter coverage de um arquivo
function getFileCoverage(coverage) {
  return {
    statements: coverage.s,
    branches: coverage.b,
    functions: coverage.f,
    lines: coverage.l
  };
}

// Função para calcular percentage
function calculatePercentage(covered, total) {
  if (total === 0) return 100;
  return (covered / total) * 100;
}

// Função para obter summary de coverage
function getCoverageSummary(coverageData) {
  const summary = {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 }
  };

  Object.values(coverageData).forEach(file => {
    const fileCoverage = getFileCoverage(file);
    
    // Statements
    Object.values(fileCoverage.statements).forEach(covered => {
      if (covered > 0) summary.statements.covered++;
      summary.statements.total++;
    });

    // Branches
    Object.values(fileCoverage.branches).forEach(branch => {
      if (Array.isArray(branch)) {
        branch.forEach(b => {
          if (b > 0) summary.branches.covered++;
          summary.branches.total++;
        });
      }
    });

    // Functions
    Object.values(fileCoverage.functions).forEach(covered => {
      if (covered > 0) summary.functions.covered++;
      summary.functions.total++;
    });

    // Lines
    Object.values(fileCoverage.lines).forEach(covered => {
      if (covered > 0) summary.lines.covered++;
      summary.lines.total++;
    });
  });

  return summary;
}

// Função para validar thresholds
function validateThresholds(summary, pathPattern, type) {
  const threshold = thresholds[type];
  const results = [];

  const statementPct = calculatePercentage(summary.statements.covered, summary.statements.total);
  const branchPct = calculatePercentage(summary.branches.covered, summary.branches.total);
  const functionPct = calculatePercentage(summary.functions.covered, summary.functions.total);
  const linePct = calculatePercentage(summary.lines.covered, summary.lines.total);

  console.log(`\n=== ${type.toUpperCase()} Coverage (${pathPattern}) ===`);
  console.log(`Statements: ${statementPct.toFixed(2)}% (${summary.statements.covered}/${summary.statements.total}) - Min: ${threshold.statements}%`);
  console.log(`Branches: ${branchPct.toFixed(2)}% (${summary.branches.covered}/${summary.branches.total}) - Min: ${threshold.branches}%`);
  console.log(`Functions: ${functionPct.toFixed(2)}% (${summary.functions.covered}/${summary.functions.total}) - Min: ${threshold.functions}%`);
  console.log(`Lines: ${linePct.toFixed(2)}% (${summary.lines.covered}/${summary.lines.total}) - Min: ${threshold.lines}%`);

  const passed = 
    statementPct >= threshold.statements &&
    branchPct >= threshold.branches &&
    functionPct >= threshold.functions &&
    linePct >= threshold.lines;

  console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  return passed;
}

// Função principal
function main() {
  console.log('🔍 Validando Coverage Reports...\n');

  // Verificar se o arquivo de coverage existe
  if (!fs.existsSync(coverageFile)) {
    console.error('❌ Arquivo de coverage não encontrado:', coverageFile);
    console.error('Execute primeiro: npm run test:ci');
    process.exit(1);
  }

  try {
    // Ler dados de coverage
    const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));

    // Obter summary geral
    const globalSummary = getCoverageSummary(coverageData);
    const globalPassed = validateThresholds(globalSummary, 'global', 'global');

    // Coverage por categoria
    const files = Object.keys(coverageData);
    
    // Componentes
    const componentFiles = files.filter(file => file.includes('/components/'));
    if (componentFiles.length > 0) {
      const componentCoverage = {};
      componentFiles.forEach(file => {
        componentCoverage[file] = coverageData[file];
      });
      const componentSummary = getCoverageSummary(componentCoverage);
      validateThresholds(componentSummary, 'components', 'components');
    }

    // Utils
    const utilsFiles = files.filter(file => file.includes('/utils/'));
    if (utilsFiles.length > 0) {
      const utilsCoverage = {};
      utilsFiles.forEach(file => {
        utilsCoverage[file] = coverageData[file];
      });
      const utilsSummary = getCoverageSummary(utilsCoverage);
      validateThresholds(utilsSummary, 'utils', 'utils');
    }

    // Resultado final
    console.log('\n' + '='.repeat(50));
    if (globalPassed) {
      console.log('✅ QUALITY GATE PASSOU - Coverage atende aos thresholds');
      process.exit(0);
    } else {
      console.log('❌ QUALITY GATE FALHOU - Coverage abaixo dos thresholds');
      console.log('\n💡 Dicas:');
      console.log('1. Adicione mais testes para aumentar coverage');
      console.log('2. Execute: npm run test:coverage para ver relatório detalhado');
      console.log('3. Abra coverage/index.html para análise visual');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erro ao processar coverage:', error.message);
    process.exit(1);
  }
}

// Executar
main();