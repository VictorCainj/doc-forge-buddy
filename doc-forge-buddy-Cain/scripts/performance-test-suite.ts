/**
 * Script de testes automatizados de performance
 * Executa Lighthouse CI, validação de Core Web Vitals e testes de regressão
 */

import { PerformanceTestRunner, LighthouseConfigGenerator, DEFAULT_PERFORMANCE_BUDGETS } from '../lib/web-vitals/performance-testing';

interface TestConfig {
  urls: string[];
  budgets?: typeof DEFAULT_PERFORMANCE_BUDGETS;
  outputDir?: string;
  ci?: boolean;
  regression?: boolean;
  multiPage?: boolean;
}

interface TestResult {
  success: boolean;
  url?: string;
  score: number;
  violations: Array<{
    metric: string;
    value: number;
    threshold: 'good' | 'poor';
    rating: 'good' | 'needs-improvement' | 'poor';
  }>;
  reportPath: string;
  details?: any;
}

class PerformanceTestSuite {
  private runner: PerformanceTestRunner;
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
    const lighthouseConfig = LighthouseConfigGenerator.generateConfig(
      config.urls,
      config.budgets || DEFAULT_PERFORMANCE_BUDGETS
    );
    
    this.runner = new PerformanceTestRunner(
      lighthouseConfig,
      config.outputDir || './performance-reports'
    );
  }

  // Executar suite completa de testes
  async runFullSuite(): Promise<{
    results: TestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      averageScore: number;
      totalViolations: number;
    };
    regressionReport?: any;
  }> {
    console.log('🚀 Iniciando suite de testes de performance...');
    console.log(`📊 URLs para testar: ${this.config.urls.join(', ')}`);
    console.log(`📁 Relatórios serão salvos em: ${this.runner['outputDir']}`);
    console.log('');

    const results: TestResult[] = [];
    let totalScore = 0;
    let totalViolations = 0;

    // Teste principal
    if (this.config.multiPage) {
      console.log('📄 Executando testes em múltiplas páginas...');
      const multiPageResult = await this.runner.runMultiPageTest(this.config.urls);
      
      multiPageResult.totalResults.forEach((result, index) => {
        if (result.success !== false) {
          const validation = this.runner['validator'].validateCoreWebVitals(result.results);
          results.push({
            success: result.success,
            url: result.page,
            score: Math.round((result.results?.categories?.performance?.score || 0) * 100),
            violations: validation.violations,
            reportPath: result.reportPath || '',
            details: result.results
          });
          
          totalScore += results[results.length - 1].score;
          totalViolations += validation.violations.length;
        } else {
          results.push({
            success: false,
            url: result.page,
            score: 0,
            violations: [],
            reportPath: '',
            error: result.error
          });
        }
      });
    } else {
      console.log('🔍 Executando teste principal...');
      for (let i = 0; i < this.config.urls.length; i++) {
        const url = this.config.urls[i];
        console.log(`⏳ Testando ${url} (${i + 1}/${this.config.urls.length})...`);
        
        try {
          const result = await this.runner.runPerformanceTest();
          const score = Math.round((result.results?.categories?.performance?.score || 0) * 100);
          
          results.push({
            success: result.success,
            url,
            score,
            violations: result.violations,
            reportPath: result.reportPath,
            details: result.results
          });
          
          totalScore += score;
          totalViolations += result.violations.length;
          
          if (result.success) {
            console.log(`✅ ${url}: PASSOU (Score: ${score})`);
          } else {
            console.log(`❌ ${url}: FALHOU (Score: ${score})`);
            if (result.violations.length > 0) {
              result.violations.forEach(violation => {
                console.log(`   ⚠️  ${violation.metric}: ${violation.value} (${violation.rating})`);
              });
            }
          }
          
        } catch (error) {
          console.error(`💥 Erro ao testar ${url}:`, error);
          results.push({
            success: false,
            url,
            score: 0,
            violations: [],
            reportPath: '',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
        // Pausa entre testes
        if (i < this.config.urls.length - 1) {
          console.log('⏸️  Aguardando 3 segundos...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    // Teste de regressão se habilitado
    let regressionReport = null;
    if (this.config.regression) {
      console.log('📈 Executando teste de regressão...');
      try {
        const regression = await this.runner.runRegressionTest();
        regressionReport = regression;
        
        if (regression.hasRegressions) {
          console.log('⚠️  REGRESSÕES DETECTADAS!');
          console.log(`   📉 ${regression.changes.regressions.length} regressões`);
          regression.changes.regressions.forEach((reg: any) => {
            console.log(`   📊 ${reg.metric}: +${reg.percent.toFixed(1)}%`);
          });
        } else {
          console.log('✅ Nenhuma regressão detectada');
        }
        
        if (regression.changes.improvements.length > 0) {
          console.log(`📈 ${regression.changes.improvements.length} melhorias detectadas`);
          regression.changes.improvements.forEach((imp: any) => {
            console.log(`   📊 ${imp.metric}: -${imp.percent.toFixed(1)}%`);
          });
        }
        
      } catch (error) {
        console.error('💥 Erro no teste de regressão:', error);
      }
    }

    // Resumo final
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const averageScore = results.length > 0 ? totalScore / results.length : 0;

    console.log('');
    console.log('📊 RESUMO DOS TESTES:');
    console.log(`   Total: ${results.length}`);
    console.log(`   ✅ Passaram: ${passed}`);
    console.log(`   ❌ Falharam: ${failed}`);
    console.log(`   📈 Score médio: ${Math.round(averageScore)}/100`);
    console.log(`   ⚠️  Total de violações: ${totalViolations}`);

    if (regressionReport) {
      console.log('');
      console.log('📈 REGRESSÃO:');
      console.log(`   Status: ${regressionReport.report}`);
    }

    console.log('');
    console.log('📁 RELATÓRIOS GERADOS:');
    results.forEach(result => {
      if (result.reportPath) {
        console.log(`   📄 ${result.url}: ${result.reportPath}`);
      }
    });

    console.log('');
    console.log('🏁 Testes concluídos!');

    return {
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        averageScore: Math.round(averageScore),
        totalViolations
      },
      regressionReport
    };
  }

  // Teste rápido (apenas URL principal)
  async runQuickTest(): Promise<TestResult> {
    console.log('⚡ Executando teste rápido...');
    
    const mainUrl = this.config.urls[0];
    const result = await this.runner.runPerformanceTest();
    
    return {
      success: result.success,
      url: mainUrl,
      score: Math.round((result.results?.categories?.performance?.score || 0) * 100),
      violations: result.violations,
      reportPath: result.reportPath,
      details: result.results
    };
  }

  // Validar configurações
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.urls || this.config.urls.length === 0) {
      errors.push('URLs de teste são obrigatórias');
    }

    this.config.urls.forEach((url, index) => {
      try {
        new URL(url);
      } catch {
        errors.push(`URL ${index + 1} inválida: ${url}`);
      }
    });

    if (this.config.outputDir && typeof this.config.outputDir !== 'string') {
      errors.push('Output directory deve ser uma string');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Configuração via CLI
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    urls: ['http://localhost:3000'],
    budgets: DEFAULT_PERFORMANCE_BUDGETS,
    outputDir: './performance-reports',
    ci: false,
    regression: false,
    multiPage: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--url':
      case '-u':
        config.urls = [args[++i]];
        break;
        
      case '--urls':
        const urlsArg = args[++i];
        config.urls = urlsArg.split(',').map(url => url.trim());
        break;
        
      case '--output':
      case '-o':
        config.outputDir = args[++i];
        break;
        
      case '--ci':
        config.ci = true;
        break;
        
      case '--regression':
      case '-r':
        config.regression = true;
        break;
        
      case '--multi-page':
      case '-m':
        config.multiPage = true;
        break;
        
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        
      case '--quick':
      case '-q':
        config.urls = ['http://localhost:3000'];
        config.multiPage = false;
        config.regression = false;
        break;
    }
  }

  return config;
}

function printHelp() {
  console.log(`
🚀 Performance Test Suite

Uso:
  npm run test:performance [opções]

Opções:
  -u, --url <url>              URL para testar (padrão: http://localhost:3000)
  --urls <urls>                Múltiplas URLs separadas por vírgula
  -o, --output <dir>           Diretório de saída (padrão: ./performance-reports)
  --ci                         Modo CI (não interativo)
  -r, --regression             Executar teste de regressão
  -m, --multi-page             Testar múltiplas páginas
  -q, --quick                  Teste rápido (apenas URL principal)
  -h, --help                   Mostrar esta ajuda

Exemplos:
  npm run test:performance
  npm run test:performance --url https://minha-app.com
  npm run test:performance --urls "https://app1.com,https://app2.com" --regression
  npm run test:performance --ci --multi-page --regression
  `);
}

// Executar se chamado diretamente
if (require.main === module) {
  const config = parseArgs();
  const validation = new PerformanceTestSuite(config).validateConfig();
  
  if (!validation.valid) {
    console.error('❌ Configuração inválida:');
    validation.errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  const testSuite = new PerformanceTestSuite(config);
  
  (async () => {
    try {
      if (config.ci) {
        // Modo CI - não colorido, saída machine-readable
        const result = await testSuite.runFullSuite();
        
        // Sair com código de erro se falhou
        if (result.summary.failed > 0 || result.summary.averageScore < 80) {
          console.log('::error::Performance tests failed');
          process.exit(1);
        }
      } else {
        // Modo interativo
        const result = await testSuite.runFullSuite();
        
        // Código de saída baseado nos resultados
        if (result.summary.failed > 0) {
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    }
  })();
}

export { PerformanceTestSuite, parseArgs, printHelp };
export default PerformanceTestSuite;