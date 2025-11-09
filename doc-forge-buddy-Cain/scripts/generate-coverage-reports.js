#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

console.log('📊 Gerando relatórios de coverage avançados...\n');

try {
  const coveragePath = resolve('coverage/coverage-summary.json');
  
  if (!existsSync(coveragePath)) {
    console.log('⚠️ Executando testes com coverage...');
    execSync('npm run test:coverage', { stdio: 'inherit' });
  }

  const coverageData = JSON.parse(readFileSync(coveragePath, 'utf8'));
  const { total } = coverageData;

  // Gerar relatório em markdown
  const generateMarkdownReport = () => {
    const report = `# 📊 Relatório de Coverage - ${new Date().toLocaleDateString()}

## 🎯 Resumo Geral

| Métrica | Coverage | Status |
|---------|----------|---------|
| Statements | ${total.statements.pct}% | ${total.statements.pct >= 80 ? '✅' : '❌'} |
| Branches | ${total.branches.pct}% | ${total.branches.pct >= 80 ? '✅' : '❌'} |
| Functions | ${total.functions.pct}% | ${total.functions.pct >= 80 ? '✅' : '❌'} |
| Lines | ${total.lines.pct}% | ${total.lines.pct >= 80 ? '✅' : '❌'} |

## 📈 Qualidade do Código

### 🟢 Cobertura por Arquivo

${Object.entries(coverageData)
  .filter(([key]) => key !== 'total')
  .map(([file, data]) => {
    const fileName = file.split('/').pop();
    const coverage = Math.round(data.statements.pct);
    const status = coverage >= 90 ? '🟢' : coverage >= 80 ? '🟡' : '🔴';
    return `**${status} ${fileName}**: ${coverage}% (${data.statements.covered}/${data.statements.total} statements)`;
  })
  .join('\n')}

## 🔍 Análise de Trends

\`\`\`
📈 Statements:  ${total.statements.pct}%
🌳 Branches:    ${total.branches.pct}%
⚙️  Functions:   ${total.functions.pct}%
📝 Lines:       ${total.lines.pct}%
\`\`\`

## 📋 Recomendações

${total.statements.pct < 80 ? '⚠️ **Coverage baixo**: Adicione mais testes unitários' : '✅ Coverage adequado para produção'}

${total.branches.pct < 80 ? '⚠️ **Branches baixos**: Adicione testes para cenários de borda' : '✅ Boa cobertura de branches'}

### 🎯 Próximos Passos

1. ${total.statements.pct < 90 ? 'Aumentar coverage para 90%' : 'Manter coverage > 90%'}
2. ${total.branches.pct < 90 ? 'Melhorar cobertura de branches' : 'Continuar monitorando branches'}
3. Revisar arquivos com coverage < 80%

---
*Gerado automaticamente em ${new Date().toLocaleString()}*
`;

    return report;
  };

  // Gerar relatório em JSON estruturado
  const generateJSONReport = () => {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        project: 'doc-forge-buddy-Cain'
      },
      summary: {
        overall: {
          statements: total.statements.pct,
          branches: total.branches.pct,
          functions: total.functions.pct,
          lines: total.lines.pct,
          passRate: total.statements.pct >= 80 ? 'PASS' : 'FAIL'
        },
        thresholds: {
          required: {
            global: 80,
            components: 90
          },
          current: {
            global: Math.min(
              total.statements.pct,
              total.branches.pct,
              total.functions.pct,
              total.lines.pct
            )
          }
        }
      },
      files: Object.entries(coverageData)
        .filter(([key]) => key !== 'total')
        .map(([file, data]) => ({
          path: file,
          coverage: {
            statements: data.statements.pct,
            branches: data.branches.pct,
            functions: data.functions.pct,
            lines: data.lines.pct
          },
          status: data.statements.pct >= 80 ? 'GOOD' : 'NEEDS_WORK'
        }))
    };
  };

  // Gerar relatório HTML básico
  const generateHTMLReport = () => {
    const reportHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Coverage Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .bad { color: #dc3545; }
        .status { font-size: 1.2em; }
        .progress-bar { width: 100%; height: 10px; background: #e9ecef; border-radius: 5px; margin-top: 10px; }
        .progress-fill { height: 100%; border-radius: 5px; transition: width 0.3s; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Coverage Dashboard</h1>
            <p>Atualizado em ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <h3>Statements</h3>
                <div class="metric-value ${total.statements.pct >= 80 ? 'good' : 'bad'}">${total.statements.pct}%</div>
                <div class="status">${total.statements.pct >= 80 ? '✅ Aprovado' : '❌ Reprovado'}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${total.statements.pct}%; background: ${total.statements.pct >= 80 ? '#28a745' : '#dc3545'};"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Branches</h3>
                <div class="metric-value ${total.branches.pct >= 80 ? 'good' : 'bad'}">${total.branches.pct}%</div>
                <div class="status">${total.branches.pct >= 80 ? '✅ Aprovado' : '❌ Reprovado'}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${total.branches.pct}%; background: ${total.branches.pct >= 80 ? '#28a745' : '#dc3545'};"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Functions</h3>
                <div class="metric-value ${total.functions.pct >= 80 ? 'good' : 'bad'}">${total.functions.pct}%</div>
                <div class="status">${total.functions.pct >= 80 ? '✅ Aprovado' : '❌ Reprovado'}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${total.functions.pct}%; background: ${total.functions.pct >= 80 ? '#28a745' : '#dc3545'};"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Lines</h3>
                <div class="metric-value ${total.lines.pct >= 80 ? 'good' : 'bad'}">${total.lines.pct}%</div>
                <div class="status">${total.lines.pct >= 80 ? '✅ Aprovado' : '❌ Reprovado'}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${total.lines.pct}%; background: ${total.lines.pct >= 80 ? '#28a745' : '#dc3545'};"></div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <p><strong>Overall Status:</strong> ${total.statements.pct >= 80 ? '🎯 PASS - Ready for Production' : '⚠️ FAIL - Needs Improvement'}</p>
            <a href="coverage/index.html" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">📊 Detailed Coverage Report</a>
        </div>
    </div>
</body>
</html>`;
    
    return reportHtml;
  };

  // Criar diretório de relatórios se não existir
  const reportsDir = resolve('coverage/reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  // Gerar e salvar relatórios
  const markdownReport = generateMarkdownReport();
  const jsonReport = generateJSONReport();
  const htmlReport = generateHTMLReport();

  writeFileSync(join(reportsDir, 'coverage-report.md'), markdownReport);
  writeFileSync(join(reportsDir, 'coverage-dashboard.json'), JSON.stringify(jsonReport, null, 2));
  writeFileSync(join(reportsDir, 'coverage-dashboard.html'), htmlReport);

  console.log('✅ Relatórios gerados com sucesso!');
  console.log('\n📁 Arquivos criados:');
  console.log('  • coverage/reports/coverage-report.md');
  console.log('  • coverage/reports/coverage-dashboard.json');
  console.log('  • coverage/reports/coverage-dashboard.html');
  console.log('  • coverage/index.html (Vitest original)');
  
  console.log('\n🎯 Coverage Summary:');
  console.log(`  📊 Statements: ${total.statements.pct}%`);
  console.log(`  🌳 Branches: ${total.branches.pct}%`);
  console.log(`  ⚙️  Functions: ${total.functions.pct}%`);
  console.log(`  📝 Lines: ${total.lines.pct}%`);

} catch (error) {
  console.error('❌ Erro ao gerar relatórios:', error.message);
  process.exit(1);
}