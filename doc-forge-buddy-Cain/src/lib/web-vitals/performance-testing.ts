/**
 * Sistema de testes automatizados de performance
 * Lighthouse CI, validação de Core Web Vitals, testes de regressão
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

// Configuração do Lighthouse CI
export interface LighthouseConfig {
  ci: {
    collect: {
      url: string[];
      numberOfRuns: number;
      settings?: {
        preset?: 'desktop' | 'mobile';
        formFactor?: 'desktop' | 'mobile' | 'auto';
        screenEmulation?: {
          mobile: boolean;
          disabled: boolean;
        };
        throttling?: {
          rttMs: number;
          throughputKbps: number;
          cpuSlowdownMultiplier: number;
        };
      };
    };
    assert: {
      assertions: {
        [key: string]: 'off' | 'error' | 'warn' | 'info' | number;
      };
      preset?: 'lighthouse:recommended' | 'lighthouse:all';
    };
    upload: {
      target: 'temporary-public-storage' | 'lhci' | 'filesystem';
      serverBaseUrl?: string;
      token?: string;
    };
  };
}

// Configuração padrão de budget de performance
export const DEFAULT_PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  'first-contentful-paint': [1000, 2000], // [good, poor]
  'largest-contentful-paint': [2500, 4000],
  'cumulative-layout-shift': [0.1, 0.25],
  'max-potential-fid': [100, 300],
  'total-blocking-time': [200, 600],
  'speed-index': [2300, 4500],
  
  // Other performance metrics
  'time-to-first-byte': [600, 1500],
  'interactive': [3800, 7300],
  'server-response-time': [200, 1000],
  'mainthread-tasks': [200, 600],
  'bootup-time': [500, 2000],
  
  // Resource budgets (in KB)
  'total-byte-weight': [500, 1000],
  'resource-summary:script': [170, 300],
  'resource-summary:image': [900, 1500],
  'resource-summary:font': [100, 200],
  'resource-summary:media': [0, 50],
  
  // Third party usage
  'third-party-summary': [500, 1000]
};

// Validador de Core Web Vitals
export class CoreWebVitalsValidator {
  private thresholds = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 }
  };

  // Validar se Core Web Vitals estão dentro dos thresholds
  validateCoreWebVitals(results: any): {
    isValid: boolean;
    violations: Array<{
      metric: string;
      value: number;
      threshold: 'good' | 'poor';
      rating: 'good' | 'needs-improvement' | 'poor';
    }>;
    score: number;
  } {
    const violations: Array<{
      metric: string;
      value: number;
      threshold: 'good' | 'poor';
      rating: 'good' | 'needs-improvement' | 'poor';
    }> = [];

    const metrics = {
      FCP: results.audits['first-contentful-paint']?.numericValue,
      LCP: results.audits['largest-contentful-paint']?.numericValue,
      FID: results.audits['max-potential-fid']?.numericValue,
      CLS: results.audits['cumulative-layout-shift']?.numericValue,
      TTFB: results.audits['server-response-time']?.numericValue
    };

    let totalScore = 0;
    let metricCount = 0;

    Object.entries(metrics).forEach(([metric, value]) => {
      if (value === undefined) return;

      const threshold = this.thresholds[metric as keyof typeof this.thresholds];
      if (!threshold) return;

      let rating: 'good' | 'needs-improvement' | 'poor';
      let actualThreshold: 'good' | 'poor';

      if (value <= threshold.good) {
        rating = 'good';
        actualThreshold = 'good';
        totalScore += 100;
      } else if (value <= threshold.poor) {
        rating = 'needs-improvement';
        actualThreshold = 'good'; // Considera como violação do bom threshold
        totalScore += 50;
      } else {
        rating = 'poor';
        actualThreshold = 'poor';
        totalScore += 0;
        violations.push({ metric, value, threshold: actualThreshold, rating });
      }

      metricCount++;
    });

    const averageScore = metricCount > 0 ? totalScore / metricCount : 0;

    return {
      isValid: violations.filter(v => v.threshold === 'poor').length === 0,
      violations,
      score: Math.round(averageScore)
    };
  }

  // Gerar relatório de regressão
  generateRegressionReport(currentResults: any, previousResults: any): {
    hasRegressions: boolean;
    improvements: Array<{ metric: string; change: number; percent: number }>;
    regressions: Array<{ metric: string; change: number; percent: number }>;
    summary: string;
  } {
    const metrics = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'max-potential-fid',
      'speed-index',
      'total-blocking-time'
    ];

    const improvements: Array<{ metric: string; change: number; percent: number }> = [];
    const regressions: Array<{ metric: string; change: number; percent: number }> = [];

    metrics.forEach(metric => {
      const current = currentResults.audits[metric]?.numericValue;
      const previous = previousResults.audits[metric]?.numericValue;

      if (current !== undefined && previous !== undefined) {
        const change = current - previous;
        const percent = (change / previous) * 100;

        // Threshold de 5% para considerar como regressão/melhoria
        if (Math.abs(percent) > 5) {
          if (change < 0) {
            improvements.push({ metric, change: Math.abs(change), percent: Math.abs(percent) });
          } else {
            regressions.push({ metric, change, percent });
          }
        }
      }
    });

    return {
      hasRegressions: regressions.length > 0,
      improvements,
      regressions,
      summary: `Performance ${regressions.length > 0 ? 'REGRESSION' : improvements.length > 0 ? 'IMPROVED' : 'STABLE'}: ` +
               `${regressions.length} regressões, ${improvements.length} melhorias`
    };
  }
}

// Executor de testes de performance
export class PerformanceTestRunner {
  private config: LighthouseConfig;
  private outputDir: string;
  private validator: CoreWebVitalsValidator;

  constructor(config: LighthouseConfig, outputDir: string = './performance-reports') {
    this.config = config;
    this.outputDir = outputDir;
    this.validator = new CoreWebVitalsValidator();
  }

  // Executar teste de performance
  async runPerformanceTest(): Promise<{
    success: boolean;
    results: any;
    reportPath: string;
    violations: any[];
  }> {
    try {
      // Criar diretório de saída
      if (!existsSync(this.outputDir)) {
        await mkdir(this.outputDir, { recursive: true });
      }

      // Executar Lighthouse CI
      const { stdout, stderr } = await execAsync('npx lhci autorun --config=.lighthouserc.js', {
        cwd: process.cwd(),
        timeout: 120000 // 2 minutos timeout
      });

      console.log('Lighthouse CI output:', stdout);
      if (stderr) {
        console.warn('Lighthouse CI warnings:', stderr);
      }

      // Carregar resultados
      const results = await this.loadLighthouseResults();
      
      // Validar Core Web Vitals
      const validation = this.validator.validateCoreWebVitals(results);
      
      // Gerar relatório
      const reportPath = await this.generateReport(results, validation);

      return {
        success: validation.isValid,
        results,
        reportPath,
        violations: validation.violations
      };

    } catch (error) {
      console.error('Performance test failed:', error);
      return {
        success: false,
        results: null,
        reportPath: '',
        violations: []
      };
    }
  }

  // Executar teste de regressão
  async runRegressionTest(): Promise<{
    hasRegressions: boolean;
    report: any;
    changes: any;
  }> {
    try {
      // Executar teste atual
      const currentResults = await this.runPerformanceTest();
      
      // Carregar resultados anteriores
      const previousResultsPath = join(this.outputDir, 'previous-results.json');
      let previousResults: any = null;

      if (existsSync(previousResultsPath)) {
        const previousData = await readFile(previousResultsPath, 'utf-8');
        previousResults = JSON.parse(previousData);
      }

      // Gerar relatório de regressão
      const report = this.validator.generateRegressionReport(
        currentResults.results,
        previousResults
      );

      // Salvar resultados atuais para próxima comparação
      await writeFile(
        previousResultsPath,
        JSON.stringify(currentResults.results, null, 2)
      );

      return {
        hasRegressions: report.hasRegressions,
        report: report.summary,
        changes: report
      };

    } catch (error) {
      console.error('Regression test failed:', error);
      return {
        hasRegressions: false,
        report: 'Failed to run regression test',
        changes: null
      };
    }
  }

  // Executar testes em múltiplas páginas
  async runMultiPageTest(pages: string[]): Promise<{
    totalResults: any[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      averageScore: number;
    };
  }> {
    const totalResults: any[] = [];
    let passed = 0;
    let totalScore = 0;

    for (const page of pages) {
      try {
        console.log(`Testing page: ${page}`);
        
        // Configurar URL temporariamente
        const originalUrls = this.config.ci.collect.url;
        this.config.ci.collect.url = [page];

        const result = await this.runPerformanceTest();
        totalResults.push({
          page,
          ...result
        });

        if (result.success) {
          passed++;
        }

        totalScore += this.getOverallScore(result.results);

        // Restaurar URLs originais
        this.config.ci.collect.url = originalUrls;

      } catch (error) {
        console.error(`Failed to test page ${page}:`, error);
        totalResults.push({
          page,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      totalResults,
      summary: {
        total: pages.length,
        passed,
        failed: pages.length - passed,
        averageScore: totalScore / pages.length
      }
    };
  }

  // Carregar resultados do Lighthouse
  private async loadLighthouseResults(): Promise<any> {
    const resultsPath = join(this.outputDir, 'lighthouseci-results.json');
    
    if (!existsSync(resultsPath)) {
      throw new Error('Lighthouse results file not found');
    }

    const data = await readFile(resultsPath, 'utf-8');
    return JSON.parse(data);
  }

  // Gerar relatório detalhado
  private async generateReport(results: any, validation: any): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(this.outputDir, `performance-report-${timestamp}.html`);

    const reportHtml = this.generateReportHtml(results, validation);
    await writeFile(reportPath, reportHtml, 'utf-8');

    return reportPath;
  }

  // Gerar HTML do relatório
  private generateReportHtml(results: any, validation: any): string {
    const performanceScore = Math.round((results.categories?.performance?.score || 0) * 100);
    const accessibilityScore = Math.round((results.categories?.accessibility?.score || 0) * 100);
    const bestPracticesScore = Math.round((results.categories?.['best-practices']?.score || 0) * 100);
    const seoScore = Math.round((results.categories?.seo?.score || 0) * 100);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Performance Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .scores { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .score { text-align: center; padding: 20px; border-radius: 8px; }
            .score.good { background: #10b981; color: white; }
            .score.warning { background: #f59e0b; color: white; }
            .score.poor { background: #ef4444; color: white; }
            .violations { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .metric { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Performance Report</h1>
            <p>Generated at: ${new Date().toLocaleString()}</p>
        </div>

        <div class="scores">
            <div class="score ${performanceScore >= 90 ? 'good' : performanceScore >= 50 ? 'warning' : 'poor'}">
                <h3>Performance</h3>
                <div style="font-size: 2em;">${performanceScore}</div>
            </div>
            <div class="score ${accessibilityScore >= 90 ? 'good' : accessibilityScore >= 50 ? 'warning' : 'poor'}">
                <h3>Accessibility</h3>
                <div style="font-size: 2em;">${accessibilityScore}</div>
            </div>
            <div class="score ${bestPracticesScore >= 90 ? 'good' : bestPracticesScore >= 50 ? 'warning' : 'poor'}">
                <h3>Best Practices</h3>
                <div style="font-size: 2em;">${bestPracticesScore}</div>
            </div>
            <div class="score ${seoScore >= 90 ? 'good' : seoScore >= 50 ? 'warning' : 'poor'}">
                <h3>SEO</h3>
                <div style="font-size: 2em;">${seoScore}</div>
            </div>
        </div>

        <h2>Core Web Vitals Validation</h2>
        <p>Status: ${validation.isValid ? '✅ All metrics within thresholds' : '❌ Performance issues found'}</p>
        <p>Score: ${validation.score}/100</p>

        ${validation.violations.length > 0 ? `
        <div class="violations">
            <h3>⚠️ Performance Violations</h3>
            ${validation.violations.map(v => `
                <div class="metric">
                    <strong>${v.metric}:</strong> ${v.value} (${v.rating})
                </div>
            `).join('')}
        </div>
        ` : ''}

        <h2>Detailed Metrics</h2>
        ${this.renderMetricsTable(results.audits)}
    </body>
    </html>
    `;
  }

  // Renderizar tabela de métricas
  private renderMetricsTable(audits: any): string {
    const metrics = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'max-potential-fid',
      'speed-index',
      'total-blocking-time',
      'server-response-time'
    ];

    return `
    <table border="1" style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Score</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            ${metrics.map(metric => {
              const audit = audits[metric];
              if (!audit) return '';
              
              const score = Math.round((audit.score || 0) * 100);
              const scoreClass = score >= 90 ? 'good' : score >= 50 ? 'warning' : 'poor';
              
              return `
              <tr>
                <td>${audit.title}</td>
                <td>${audit.displayValue || audit.numericValue}</td>
                <td style="color: ${scoreClass === 'good' ? 'green' : scoreClass === 'warning' ? 'orange' : 'red'}">${score}</td>
                <td>${audit.description}</td>
              </tr>
              `;
            }).join('')}
        </tbody>
    </table>
    `;
  }

  // Obter score geral
  private getOverallScore(results: any): number {
    return Math.round((results.categories?.performance?.score || 0) * 100);
  }
}

// Gerador de configuração do Lighthouse
export class LighthouseConfigGenerator {
  static generateConfig(urls: string[], budgets: Record<string, [number, number]> = DEFAULT_PERFORMANCE_BUDGETS): LighthouseConfig {
    return {
      ci: {
        collect: {
          url: urls,
          numberOfRuns: 3,
          settings: {
            preset: 'desktop',
            formFactor: 'desktop',
            screenEmulation: {
              mobile: false,
              disabled: true
            },
            throttling: {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1
            }
          }
        },
        assert: {
          assertions: {
            'categories:performance': ['warn', { minScore: 0.8 }],
            'categories:accessibility': ['warn', { minScore: 0.9 }],
            'categories:best-practices': ['warn', { minScore: 0.9 }],
            'categories:seo': ['warn', { minScore: 0.9 }],
            
            // Core Web Vitals
            'first-contentful-paint': ['error', { maxNumericValue: budgets['first-contentful-paint'][1] }],
            'largest-contentful-paint': ['error', { maxNumericValue: budgets['largest-contentful-paint'][1] }],
            'cumulative-layout-shift': ['error', { maxNumericValue: budgets['cumulative-layout-shift'][1] }],
            'max-potential-fid': ['error', { maxNumericValue: budgets['max-potential-fid'][1] }],
            'total-blocking-time': ['error', { maxNumericValue: budgets['total-blocking-time'][1] }],
            
            // Resource budgets
            'resource-summary:script': ['warn', { maxNumericValue: budgets['resource-summary:script'][1] * 1024 }],
            'resource-summary:image': ['warn', { maxNumericValue: budgets['resource-summary:image'][1] * 1024 }],
            'resource-summary:font': ['warn', { maxNumericValue: budgets['resource-summary:font'][1] * 1024 }]
          },
          preset: 'lighthouse:recommended'
        },
        upload: {
          target: 'temporary-public-storage'
        }
      }
    };
  }

  // Salvar configuração em arquivo
  static async saveConfig(config: LighthouseConfig, path: string = '.lighthouserc.js'): Promise<void> {
    const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
    await writeFile(path, configContent);
  }
}

export default {
  CoreWebVitalsValidator,
  PerformanceTestRunner,
  LighthouseConfigGenerator,
  DEFAULT_PERFORMANCE_BUDGETS
};