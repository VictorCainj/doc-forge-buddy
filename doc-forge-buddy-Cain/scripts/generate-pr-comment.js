#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

console.log('📝 Gerando comentário de PR com coverage...\n');

try {
  // Caminho para o arquivo de coverage
  const coveragePath = resolve('coverage/coverage-summary.json');
  
  if (!existsSync(coveragePath)) {
    console.log('⚠️ Arquivo de coverage não encontrado');
    console.log('Execute: npm run test:coverage');
    process.exit(1);
  }

  const coverageData = JSON.parse(readFileSync(coveragePath, 'utf8'));
  const { total } = coverageData;

  // Gerar badge de status
  const getStatusBadge = (value, threshold = 80) => {
    if (value >= threshold) return '✅ PASS';
    if (value >= threshold * 0.9) return '⚠️ WARN';
    return '❌ FAIL';
  };

  // Gerar relatório de coverage para PR
  const prComment = `## 📊 Coverage Report

### 🎯 Resumo de Quality Gates

| Métrica | Coverage | Status |
|---------|----------|---------|
| **Statements** | ${total.statements.pct}% | ${getStatusBadge(total.statements.pct)} |
| **Branches** | ${total.branches.pct}% | ${getStatusBadge(total.branches.pct)} |
| **Functions** | ${total.functions.pct}% | ${getStatusBadge(total.functions.pct)} |
| **Lines** | ${total.lines.pct}% | ${getStatusBadge(total.lines.pct)} |

### 📈 Visualização

\`\`\`
Statements   ████████████████ ${total.statements.pct}%\nBranches     ████████████████ ${total.branches.pct}%\nFunctions    ████████████████ ${total.functions.pct}%\nLines        ████████████████ ${total.lines.pct}%\n\`\`\`

### 🔍 Detalhes por Arquivo

${Object.entries(coverageData)
  .filter(([key]) => key !== 'total')
  .sort((a, b) => b[1].statements.pct - a[1].statements.pct)
  .slice(0, 10) // Top 10 arquivos
  .map(([file, data]) => {
    const fileName = file.split('/').pop() || file;
    const coverage = Math.round(data.statements.pct);
    const status = coverage >= 90 ? '🟢' : coverage >= 80 ? '🟡' : '🔴';
    return `${status} **${fileName}**: ${coverage}% (${data.statements.covered}/${data.statements.total} statements)`;
  })
  .join('\n')}

### 📋 Quality Gate Status

**${total.statements.pct >= 80 && total.branches.pct >= 80 ? '🎯' : '⚠️'} ${total.statements.pct >= 80 && total.branches.pct >= 80 ? 'APROVADO' : 'REPROVADO'}**

${total.statements.pct >= 80 && total.branches.pct >= 80 ? 
  '✅ Todos os quality gates passaram. Este PR está pronto para merge.' : 
  '❌ Quality gates falharam. Cobertura insuficiente para produção.'
}

### 🔗 Links Úteis

- [📊 Detailed Coverage Report](${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY || 'user/repo'}/actions/runs/${process.env.GITHUB_RUN_ID || 'latest'})
- [📈 Codecov Dashboard](https://codecov.io/gh/${process.env.GITHUB_REPOSITORY || 'user/repo'})
- [🛠️ GitHub Actions](${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY || 'user/repo'}/actions)

---
*Comentário gerado automaticamente em ${new Date().toLocaleString()}*

<!-- coverage-summary -->
`;

  // Salvar o comentário em um arquivo para uso no workflow
  const commentFile = join('coverage', 'pr-comment.md');
  writeFileSync(commentFile, prComment);

  console.log('✅ Comentário de PR gerado!');
  console.log(`\n📝 Resumo: Coverage total: ${total.statements.pct}%`);
  console.log(`🎯 Status: ${total.statements.pct >= 80 ? 'APROVADO' : 'REPROVADO'}`);
  console.log(`📁 Arquivo salvo em: ${commentFile}`);

  // Se estiver rodando no CI, imprimir o comentário
  if (process.env.GITHUB_ACTIONS) {
    console.log('\n📤 Comentário para PR:');
    console.log('='.repeat(50));
    console.log(prComment);
    console.log('='.repeat(50));
  }

} catch (error) {
  console.error('❌ Erro ao gerar comentário de PR:', error.message);
  process.exit(1);
}