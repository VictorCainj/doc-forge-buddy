#!/usr/bin/env node

/**
 * Script de Monitoramento de Performance para Build de Produção
 * 
 * Funcionalidades:
 * - Validação de performance budgets
 * - Análise de bundle size
 * - Geração de relatórios de performance
 * - Alertas para CI/CD
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PerformanceMonitor {
  constructor() {
    this.config = {
      // Performance budgets definidos
      budgets: {
        mainBundle: 1 * 1024 * 1024,      // 1MB
        chunk: 200 * 1024,                // 200KB
        cssTotal: 100 * 1024,             // 100KB
        totalInitial: 2 * 1024 * 1024,    // 2MB
        imagesTotal: 500 * 1024,          // 500KB
        fontsTotal: 200 * 1024,           // 200KB
      },
      
      // Alertas de performance
      alerts: {
        warning: 0.8,  // 80% do budget
        critical: 1.0, // 100% do budget
      },
      
      // Lighthouse thresholds
      lighthouse: {
        performance: 90,
        accessibility: 90,
        bestPractices: 90,
        seo: 90,
      }
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      budgets: this.config.budgets,
      actual: {},
      violations: [],
      warnings: [],
      scores: {},
      recommendations: []
    };
  }
  
  /**
   * Executa análise completa de performance
   */
  async runFullAnalysis() {
    console.log('🚀 Iniciando análise de performance...\n');
    
    try {
      // 1. Build de produção
      await this.runProductionBuild();
      
      // 2. Análise de bundle
      await this.analyzeBundle();
      
      // 3. Análise de Lighthouse (se disponível)
      await this.runLighthouseAnalysis();
      
      // 4. Gerar relatório
      this.generateReport();
      
      // 5. Verificar violations
      const hasViolations = this.checkViolations();
      
      if (hasViolations) {
        console.log('\n❌ Performance budgets violados!');
        process.exit(1);
      } else {
        console.log('\n✅ Todos os performance budgets atendidos!');
      }
      
    } catch (error) {
      console.error('❌ Erro durante análise:', error.message);
      process.exit(1);
    }
  }
  
  /**
   * Executa build de produção
   */
  async runProductionBuild() {
    console.log('📦 Executando build de produção...');
    
    try {
      const { stdout, stderr } = await execAsync('npm run build');
      console.log('✅ Build concluído com sucesso');
      
      if (stderr) {
        console.warn('⚠️ Avisos durante build:', stderr);
      }
    } catch (error) {
      throw new Error(`Build falhou: ${error.message}`);
    }
  }
  
  /**
   * Analisa tamanho do bundle e chunks
   */
  analyzeBundle() {
    console.log('🔍 Analisando bundle...');
    
    const distPath = path.join(__dirname, '..', 'dist');
    
    if (!fs.existsSync(distPath)) {
      throw new Error('Diretório dist não encontrado');
    }
    
    this.analyzeAssets(distPath);
    this.analyzeChunks(distPath);
    this.analyzeCSS(distPath);
    this.analyzeImages(distPath);
    this.analyzeFonts(distPath);
    
    console.log('✅ Análise de bundle concluída');
  }
  
  /**
   * Analisa assets de forma recursiva
   */
  analyzeAssets(dir, basePath = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        this.analyzeAssets(fullPath, relativePath);
      } else {
        this.processAsset(relativePath, stats);
      }
    });
  }
  
  /**
   * Processa um asset individual
   */
  processAsset(relativePath, stats) {
    const size = stats.size;
    const ext = path.extname(relativePath).toLowerCase();
    
    // Contar por tipo
    if (ext === '.js') {
      this.results.actual.totalJS = (this.results.actual.totalJS || 0) + size;
      
      // Identificar chunk principal
      if (relativePath.includes('index') || relativePath.includes('main')) {
        this.results.actual.mainBundle = size;
      }
    }
    
    if (ext === '.css') {
      this.results.actual.totalCSS = (this.results.actual.totalCSS || 0) + size;
    }
    
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(ext)) {
      this.results.actual.totalImages = (this.results.actual.totalImages || 0) + size;
    }
    
    if (/\.(woff2?|ttf|otf|eot)$/.test(ext)) {
      this.results.actual.totalFonts = (this.results.actual.totalFonts || 0) + size;
    }
  }
  
  /**
   * Analisa chunks JavaScript
   */
  analyzeChunks(distPath) {
    const assetsPath = path.join(distPath, 'assets');
    
    if (!fs.existsSync(assetsPath)) return;
    
    const chunks = fs.readdirSync(assetsPath)
      .filter(f => f.endsWith('.js'))
      .map(f => {
        const filePath = path.join(assetsPath, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          size: stats.size,
          path: filePath
        };
      })
      .sort((a, b) => b.size - a.size);
    
    this.results.actual.chunks = chunks;
    
    // Verificar cada chunk
    chunks.forEach(chunk => {
      this.checkBudget('chunk', chunk.size, `Chunk ${chunk.name}`);
    });
  }
  
  /**
   * Analisa CSS total
   */
  analyzeCSS(distPath) {
    const assetsPath = path.join(distPath, 'assets');
    
    if (!fs.existsSync(assetsPath)) return;
    
    const cssFiles = fs.readdirSync(assetsPath)
      .filter(f => f.endsWith('.css'))
      .map(f => {
        const filePath = path.join(assetsPath, f);
        return fs.statSync(filePath).size;
      });
    
    const totalCSS = cssFiles.reduce((a, b) => a + b, 0);
    this.results.actual.cssTotal = totalCSS;
    
    this.checkBudget('cssTotal', totalCSS, 'Total CSS');
  }
  
  /**
   * Analisa imagens total
   */
  analyzeImages(distPath) {
    const imagesPath = path.join(distPath, 'assets', 'images');
    
    if (!fs.existsSync(imagesPath)) return;
    
    const imageFiles = fs.readdirSync(imagesPath)
      .map(f => {
        const filePath = path.join(imagesPath, f);
        return fs.statSync(filePath).size;
      });
    
    const totalImages = imageFiles.reduce((a, b) => a + b, 0);
    this.results.actual.totalImages = totalImages;
    
    this.checkBudget('imagesTotal', totalImages, 'Total de Imagens');
  }
  
  /**
   * Analisa fontes total
   */
  analyzeFonts(distPath) {
    const fontsPath = path.join(distPath, 'assets', 'fonts');
    
    if (!fs.existsSync(fontsPath)) return;
    
    const fontFiles = fs.readdirSync(fontsPath)
      .map(f => {
        const filePath = path.join(fontsPath, f);
        return fs.statSync(filePath).size;
      });
    
    const totalFonts = fontFiles.reduce((a, b) => a + b, 0);
    this.results.actual.totalFonts = totalFonts;
    
    this.checkBudget('fontsTotal', totalFonts, 'Total de Fontes');
  }
  
  /**
   * Executa análise de Lighthouse
   */
  async runLighthouseAnalysis() {
    console.log('🏃 Executando análise de Lighthouse...');
    
    try {
      // Verificar se lighthouse está disponível
      await execAsync('lighthouse --version');
      
      // Executar Lighthouse
      const { stdout } = await execAsync(
        'lighthouse http://localhost:4173 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless --no-sandbox"'
      );
      
      // Ler relatório
      if (fs.existsSync('./lighthouse-report.json')) {
        const report = JSON.parse(fs.readFileSync('./lighthouse-report.json', 'utf8'));
        
        this.results.scores = {
          performance: report.categories.performance.score * 100,
          accessibility: report.categories.accessibility.score * 100,
          bestPractices: report.categories['best-practices'].score * 100,
          seo: report.categories.seo.score * 100,
        };
        
        // Verificar scores
        Object.entries(this.results.scores).forEach(([metric, score]) => {
          const threshold = this.config.lighthouse[metric];
          if (score < threshold) {
            this.results.violations.push(`${metric}: ${score.toFixed(1)} < ${threshold}`);
          }
        });
        
        console.log('✅ Lighthouse analysis concluído');
      }
    } catch (error) {
      console.warn('⚠️ Lighthouse não disponível ou falhou:', error.message);
    }
  }
  
  /**
   * Verifica se um budget foi violado
   */
  checkBudget(budgetKey, actualSize, label) {
    const budget = this.config.budgets[budgetKey];
    const percentage = actualSize / budget;
    
    if (percentage > this.config.alerts.critical) {
      this.results.violations.push(`${label}: ${this.formatSize(actualSize)} > ${this.formatSize(budget)}`);
    } else if (percentage > this.config.alerts.warning) {
      this.results.warnings.push(`${label}: ${this.formatSize(actualSize)} (${(percentage * 100).toFixed(1)}% do budget)`);
    }
  }
  
  /**
   * Verifica violations e gera recomendações
   */
  checkViolations() {
    const hasViolations = this.results.violations.length > 0;
    
    if (hasViolations) {
      console.log('\n❌ VIOLAÇÕES ENCONTRADAS:');
      this.results.violations.forEach(violation => {
        console.log(`   • ${violation}`);
      });
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      this.results.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }
    
    // Gerar recomendações
    this.generateRecommendations();
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      this.results.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    return hasViolations;
  }
  
  /**
   * Gera recomendações baseadas na análise
   */
  generateRecommendations() {
    const actual = this.results.actual;
    const budgets = this.config.budgets;
    
    // Recomendações para chunks grandes
    if (actual.chunks) {
      const largeChunks = actual.chunks.filter(c => c.size > budgets.chunk);
      if (largeChunks.length > 0) {
        this.results.recommendations.push(
          `Chunks grandes detectados: ${largeChunks.map(c => c.name).join(', ')}. Considere implementar lazy loading.`
        );
      }
    }
    
    // Recomendações para CSS
    if (actual.cssTotal > budgets.cssTotal) {
      this.results.recommendations.push(
        'CSS total acima do budget. Considere usar CSS purging ou dividir em chunks menores.'
      );
    }
    
    // Recomendações para imagens
    if (actual.totalImages > budgets.imagesTotal) {
      this.results.recommendations.push(
        'Imagens muito grandes. Considere otimizar imagens ou usar formatos modernos (WebP).'
      );
    }
    
    // Recomendações para bundle principal
    if (actual.mainBundle > budgets.mainBundle) {
      this.results.recommendations.push(
        'Bundle principal muito grande. Considere mover código para chunks menores.'
      );
    }
    
    // Recomendações baseadas em scores do Lighthouse
    if (this.results.scores.performance < 90) {
      this.results.recommendations.push(
        'Score de performance baixo. Otimize imagens, use cache adequado e minimize render-blocking resources.'
      );
    }
  }
  
  /**
   * Gera relatório final
   */
  generateReport() {
    const reportPath = path.join(__dirname, '..', 'dist', 'performance-report.json');
    
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
    const reportPath = path.join(__dirname, '..', 'dist', 'performance-report.md');
    
    let markdown = `# Relatório de Performance\n\n`;
    markdown += `**Data:** ${this.results.timestamp}\n\n`;
    
    // Resumo dos budgets
    markdown += `## 📊 Performance Budgets\n\n`;
    markdown += `| Métrica | Budget | Real | Status |\n`;
    markdown += `|---------|--------|------|--------|\n`;
    
    Object.entries(this.config.budgets).forEach(([key, budget]) => {
      const actual = this.results.actual[this.formatBudgetKey(key)] || 0;
      const status = actual <= budget ? '✅' : '❌';
      const percentage = ((actual / budget) * 100).toFixed(1);
      
      markdown += `| ${this.formatMetricName(key)} | ${this.formatSize(budget)} | ${this.formatSize(actual)} (${percentage}%) | ${status} |\n`;
    });
    
    // Chunks detalhados
    if (this.results.actual.chunks && this.results.actual.chunks.length > 0) {
      markdown += `\n## 📦 Chunks Detalhados\n\n`;
      markdown += `| Chunk | Tamanho | Status |\n`;
      markdown += `|-------|---------|--------|\n`;
      
      this.results.actual.chunks.forEach(chunk => {
        const status = chunk.size <= this.config.budgets.chunk ? '✅' : '❌';
        markdown += `| ${chunk.name} | ${this.formatSize(chunk.size)} | ${status} |\n`;
      });
    }
    
    // Scores do Lighthouse
    if (Object.keys(this.results.scores).length > 0) {
      markdown += `\n## 🏃 Lighthouse Scores\n\n`;
      Object.entries(this.results.scores).forEach(([metric, score]) => {
        const status = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌';
        markdown += `- **${this.formatMetricName(metric)}:** ${score.toFixed(1)} ${status}\n`;
      });
    }
    
    // Violations
    if (this.results.violations.length > 0) {
      markdown += `\n## ❌ Violations\n\n`;
      this.results.violations.forEach(violation => {
        markdown += `- ${violation}\n`;
      });
    }
    
    // Recomendações
    if (this.results.recommendations.length > 0) {
      markdown += `\n## 💡 Recomendações\n\n`;
      this.results.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
    }
    
    fs.writeFileSync(reportPath, markdown);
  }
  
  /**
   * Formata tamanho de arquivo
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Formata nome da métrica
   */
  formatMetricName(key) {
    const names = {
      mainBundle: 'Bundle Principal',
      chunk: 'Chunk Individual',
      cssTotal: 'CSS Total',
      totalInitial: 'Carregamento Inicial',
      imagesTotal: 'Imagens Total',
      fontsTotal: 'Fontes Total'
    };
    
    return names[key] || key;
  }
  
  /**
   * Formata chave do budget
   */
  formatBudgetKey(key) {
    const mapping = {
      mainBundle: 'mainBundle',
      chunk: 'chunk',
      cssTotal: 'cssTotal',
      totalInitial: 'totalInitial',
      imagesTotal: 'totalImages',
      fontsTotal: 'totalFonts'
    };
    
    return mapping[key] || key;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.runFullAnalysis().catch(error => {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  });
}

module.exports = PerformanceMonitor;