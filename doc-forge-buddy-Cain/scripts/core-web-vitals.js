/**
 * Validação de Core Web Vitals e Performance
 * Integração com Google PageSpeed Insights API
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CoreWebVitalsValidator {
  constructor() {
    this.config = {
      // Core Web Vitals thresholds
      coreWebVitals: {
        LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
        FID: { good: 100, poor: 300 },   // First Input Delay
        CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
        FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
        TTFB: { good: 800, poor: 1800 }, // Time to First Byte
      },
      
      // URLs para testar
      testUrls: [
        'http://localhost:4173',
        'http://localhost:4173/contratos',
        'http://localhost:4173/cadastrar-contrato',
        'http://localhost:4173/gerar-documento',
      ],
      
      // PageSpeed Insights API
      pagespeedApiKey: process.env.PAGESPEED_API_KEY,
      pagespeedUrl: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      coreWebVitals: {},
      pagespeedScores: {},
      recommendations: [],
      violations: [],
    };
  }
  
  /**
   * Executa validação completa dos Core Web Vitals
   */
  async runValidation() {
    console.log('🔍 Iniciando validação de Core Web Vitals...\n');
    
    try {
      // 1. Verificar se servidor local está rodando
      await this.checkLocalServer();
      
      // 2. Testar Core Web Vitals localmente
      await this.testCoreWebVitalsLocal();
      
      // 3. Testar com PageSpeed Insights (se API key disponível)
      if (this.config.pagespeedApiKey) {
        await this.testWithPageSpeedInsights();
      } else {
        console.log('⚠️ PageSpeed API key não disponível, pulando testes externos');
      }
      
      // 4. Gerar relatório
      this.generateReport();
      
      // 5. Verificar violations
      const hasViolations = this.checkViolations();
      
      if (hasViolations) {
        console.log('\n❌ Core Web Vitals não atendidos!');
        process.exit(1);
      } else {
        console.log('\n✅ Todos os Core Web Vitals atendidos!');
      }
      
    } catch (error) {
      console.error('❌ Erro durante validação:', error.message);
      process.exit(1);
    }
  }
  
  /**
   * Verifica se servidor local está rodando
   */
  async checkLocalServer() {
    console.log('🌐 Verificando servidor local...');
    
    try {
      const response = await fetch('http://localhost:4173');
      if (!response.ok) {
        throw new Error(`Servidor retornou status ${response.status}`);
      }
      console.log('✅ Servidor local detectado');
    } catch (error) {
      console.log('⚠️ Servidor local não detectado, iniciando servidor de preview...');
      
      // Iniciar servidor de preview
      await execAsync('npm run preview &');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verificar novamente
      try {
        const response = await fetch('http://localhost:4173');
        if (!response.ok) {
          throw new Error(`Servidor retornou status ${response.status}`);
        }
        console.log('✅ Servidor de preview iniciado');
      } catch (retryError) {
        throw new Error('Não foi possível iniciar servidor de preview');
      }
    }
  }
  
  /**
   * Testa Core Web Vitals localmente usando Lighthouse
   */
  async testCoreWebVitalsLocal() {
    console.log('🏃 Testando Core Web Vitals localmente...');
    
    for (const url of this.config.testUrls) {
      try {
        console.log(`\n📊 Testando: ${url}`);
        
        // Executar Lighthouse para cada URL
        const { stdout } = await execAsync(
          `lighthouse ${url} --output=json --chrome-flags="--headless --no-sandbox" --quiet`
        );
        
        const lighthouseResult = JSON.parse(stdout);
        const metrics = this.extractCoreWebVitals(lighthouseResult);
        
        this.results.coreWebVitals[url] = metrics;
        
        // Verificar cada métrica
        Object.entries(metrics).forEach(([metric, value]) => {
          this.checkCoreWebVital(metric, value, url);
        });
        
        console.log('✅ Teste concluído para', url);
        
      } catch (error) {
        console.warn(`⚠️ Erro ao testar ${url}:`, error.message);
      }
    }
  }
  
  /**
   * Extrai Core Web Vitals do resultado do Lighthouse
   */
  extractCoreWebVitals(lighthouseResult) {
    const audits = lighthouseResult.audits;
    
    return {
      LCP: audits['largest-contentful-paint']?.numericValue || 0,
      FID: audits['max-potential-fid']?.numericValue || 0,
      CLS: audits['cumulative-layout-shift']?.numericValue || 0,
      FCP: audits['first-contentful-paint']?.numericValue || 0,
      TTFB: audits['server-response-time']?.numericValue || 0,
      TTI: audits['interactive']?.numericValue || 0,
      TBT: audits['total-blocking-time']?.numericValue || 0,
    };
  }
  
  /**
   * Testa com PageSpeed Insights API
   */
  async testWithPageSpeedInsights() {
    console.log('🔍 Testando com PageSpeed Insights...');
    
    for (const url of this.config.testUrls) {
      try {
        const apiUrl = `${this.config.pagespeedUrl}?url=${encodeURIComponent(url)}&key=${this.config.pagespeedApiKey}&strategy=mobile`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`PageSpeed API retornou status ${response.status}`);
        }
        
        const data = await response.json();
        const scores = {
          performance: data.lighthouseResult?.categories?.performance?.score * 100 || 0,
          accessibility: data.lighthouseResult?.categories?.accessibility?.score * 100 || 0,
          bestPractices: data.lighthouseResult?.categories?.['best-practices']?.score * 100 || 0,
          seo: data.lighthouseResult?.categories?.seo?.score * 100 || 0,
        };
        
        this.results.pagespeedScores[url] = scores;
        
        console.log(`✅ PageSpeed scores para ${url}:`, scores);
        
      } catch (error) {
        console.warn(`⚠️ Erro no PageSpeed para ${url}:`, error.message);
      }
    }
  }
  
  /**
   * Verifica se um Core Web Vital atende aos thresholds
   */
  checkCoreWebVital(metric, value, url) {
    const thresholds = this.config.coreWebVitals[metric];
    if (!thresholds) return;
    
    let status, category;
    
    if (value <= thresholds.good) {
      status = 'good';
      category = 'pass';
    } else if (value <= thresholds.poor) {
      status = 'needs-improvement';
      category = 'warning';
    } else {
      status = 'poor';
      category = 'fail';
    }
    
    const result = {
      metric,
      value,
      status,
      category,
      threshold: thresholds
    };
    
    // Adicionar à URL correspondente
    if (!this.results.coreWebVitals[url].results) {
      this.results.coreWebVitals[url].results = [];
    }
    this.results.coreWebVitals[url].results.push(result);
    
    // Log do resultado
    const icon = status === 'good' ? '✅' : status === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${icon} ${metric}: ${this.formatValue(value)} (${status})`);
    
    // Verificar violations
    if (status === 'poor') {
      this.results.violations.push(`${url} - ${metric}: ${this.formatValue(value)} > ${this.formatValue(thresholds.poor)}`);
    }
  }
  
  /**
   * Verifica violations e gera recomendações
   */
  checkViolations() {
    if (this.results.violations.length === 0) return false;
    
    console.log('\n❌ CORE WEB VITALS VIOLATIONS:');
    this.results.violations.forEach(violation => {
      console.log(`   • ${violation}`);
    });
    
    // Gerar recomendações
    this.generateRecommendations();
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      this.results.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    return true;
  }
  
  /**
   * Gera recomendações baseadas nas violações
   */
  generateRecommendations() {
    const violations = this.results.violations;
    
    // Recomendações para LCP (Largest Contentful Paint)
    const lcpViolations = violations.filter(v => v.includes('LCP'));
    if (lcpViolations.length > 0) {
      this.results.recommendations.push(
        'LCP: Otimize imagens grandes, use compressão e formatos modernos (WebP)',
        'LCP: Implemente preloading para recursos críticos',
        'LCP: Minimize CSS e JavaScript render-blocking'
      );
    }
    
    // Recomendações para FID (First Input Delay)
    const fidViolations = violations.filter(v => v.includes('FID'));
    if (fidViolations.length > 0) {
      this.results.recommendations.push(
        'FID: Reduza JavaScript principal e use code splitting',
        'FID: Implemente lazy loading para código não crítico'
      );
    }
    
    // Recomendações para CLS (Cumulative Layout Shift)
    const clsViolations = violations.filter(v => v.includes('CLS'));
    if (clsViolations.length > 0) {
      this.results.recommendations.push(
        'CLS: Defina dimensões explícitas para imagens e elementos',
        'CLS: Evite inserir conteúdo acima de conteúdo existente',
        'CLS: Use fonts com font-display: swap'
      );
    }
    
    // Recomendações para FCP (First Contentful Paint)
    const fcpViolations = violations.filter(v => v.includes('FCP'));
    if (fcpViolations.length > 0) {
      this.results.recommendations.push(
        'FCP: Minimize CSS crítico e inline styles',
        'FCP: Otimize servidor e resposta'
      );
    }
    
    // Recomendações gerais
    this.results.recommendations.push(
      'Geral: Use CDN para assets estáticos',
      'Geral: Implemente cache adequado',
      'Geral: Otimize bundle size e use tree shaking'
    );
  }
  
  /**
   * Gera relatório final
   */
  generateReport() {
    const reportPath = path.join(__dirname, '..', 'dist', 'core-web-vitals-report.json');
    
    // Salvar relatório JSON
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Gerar relatório Markdown
    this.generateMarkdownReport();
    
    console.log(`\n📊 Relatório salvo em: ${reportPath}`);
  }
  
  /**
   * Gera relatório em Markdown
   */
  generateMarkdownReport() {
    const reportPath = path.join(__dirname, '..', 'dist', 'core-web-vitals-report.md');
    
    let markdown = `# Core Web Vitals Report\n\n`;
    markdown += `**Data:** ${this.results.timestamp}\n\n`;
    
    // Resumo por URL
    markdown += `## 📊 Resultados por URL\n\n`;
    
    Object.entries(this.results.coreWebVitals).forEach(([url, metrics]) => {
      markdown += `### ${url}\n\n`;
      markdown += `| Métrica | Valor | Status | Limite |\n`;
      markdown += `|---------|-------|--------|--------|\n`;
      
      if (metrics.results) {
        metrics.results.forEach(result => {
          const status = result.status === 'good' ? '✅' : 
                        result.status === 'needs-improvement' ? '⚠️' : '❌';
          markdown += `| ${result.metric} | ${this.formatValue(result.value)} | ${status} | ${this.formatValue(result.threshold.good)} |\n`;
        });
      }
      
      markdown += `\n`;
    });
    
    // PageSpeed Scores
    if (Object.keys(this.results.pagespeedScores).length > 0) {
      markdown += `## 🏃 PageSpeed Insights Scores\n\n`;
      
      Object.entries(this.results.pagespeedScores).forEach(([url, scores]) => {
        markdown += `### ${url}\n\n`;
        Object.entries(scores).forEach(([category, score]) => {
          const status = score >= 90 ? '✅' : score >= 50 ? '⚠️' : '❌';
          markdown += `- **${category}:** ${score.toFixed(1)} ${status}\n`;
        });
        markdown += `\n`;
      });
    }
    
    // Violations
    if (this.results.violations.length > 0) {
      markdown += `## ❌ Violations\n\n`;
      this.results.violations.forEach(violation => {
        markdown += `- ${violation}\n`;
      });
      markdown += `\n`;
    }
    
    // Recomendações
    if (this.results.recommendations.length > 0) {
      markdown += `## 💡 Recomendações\n\n`;
      this.results.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
    }
    
    fs.writeFileSync(reportPath, markdown);
  }
  
  /**
   * Formata valor baseado na métrica
   */
  formatValue(value) {
    if (value === 0) return '0';
    
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}s`;
    }
    
    return `${value.toFixed(0)}ms`;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const validator = new CoreWebVitalsValidator();
  validator.runValidation().catch(error => {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  });
}

module.exports = CoreWebVitalsValidator;