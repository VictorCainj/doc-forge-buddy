#!/usr/bin/env node

/**
 * Script de análise de bundle para code splitting avançado
 * Analisa chunks gerados, tamanhos, tempos de carregamento e métricas de performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BundleAnalyzer {
  constructor() {
    this.distPath = path.join(__dirname, '..', 'dist');
    this.reportPath = path.join(__dirname, '..', 'bundle-analysis-report.json');
    this.analysisResults = {
      timestamp: new Date().toISOString(),
      chunks: [],
      totals: {},
      optimizations: [],
      recommendations: [],
      compliance: {
        targetSizes: {
          'vendor-react': 50000,    // 50KB
          'vendor-ui': 100000,      // 100KB
          'vendor-router': 30000,   // 30KB
          'vendor-docs': 200000,    // 200KB
          'vendor-pdf': 150000,     // 150KB
          'vendor-charts': 180000,  // 180KB
          'vendor-ai': 120000,      // 120KB
          'vendor-animation': 100000, // 100KB
          'vendor-forms': 80000,    // 80KB
          'vendor-utils': 50000,    // 50KB
        }
      }
    };
  }

  // Análise principal
  async analyze() {
    console.log('🔍 Analisando bundle de code splitting...\n');

    try {
      // Verificar se o diretório dist existe
      if (!fs.existsSync(this.distPath)) {
        throw new Error('Diretório dist não encontrado. Execute o build primeiro.');
      }

      // Analisar chunks JavaScript
      await this.analyzeChunks();

      // Calcular métricas
      this.calculateMetrics();

      // Verificar compliance com targets
      this.checkCompliance();

      // Gerar recomendações
      this.generateRecommendations();

      // Gerar relatório
      await this.generateReport();

      // Exibir resultados
      this.displayResults();

    } catch (error) {
      console.error('❌ Erro na análise:', error.message);
      process.exit(1);
    }
  }

  // Analisar chunks no diretório dist/assets
  async analyzeChunks() {
    const assetsPath = path.join(this.distPath, 'assets');
    
    if (!fs.existsSync(assetsPath)) {
      throw new Error('Diretório assets não encontrado. Execute o build primeiro.');
    }

    const files = fs.readdirSync(assetsPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    console.log(`📦 Encontrados ${jsFiles.length} chunks JavaScript\n`);

    for (const file of jsFiles) {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      
      // Identificar tipo de chunk
      const chunkType = this.identifyChunkType(file);
      
      // Análise de conteúdo (básica)
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = this.analyzeChunkContent(file, content, stats.size);

      this.analysisResults.chunks.push({
        filename: file,
        path: filePath,
        size: stats.size,
        compressedSize: this.estimateCompressedSize(content),
        type: chunkType,
        ...analysis
      });

      console.log(`  📄 ${file} (${this.formatSize(stats.size)}) [${chunkType}]`);
    }
  }

  // Identificar tipo de chunk baseado no nome
  identifyChunkType(filename) {
    const types = {
      'vendor-react': /vendor-react/,
      'vendor-ui': /vendor-ui/,
      'vendor-router': /vendor-router/,
      'vendor-data': /vendor-(data|core)/,
      'vendor-docs': /vendor-docs/,
      'vendor-pdf': /vendor-pdf/,
      'vendor-charts': /vendor-charts/,
      'vendor-admin': /vendor-admin/,
      'vendor-ai': /vendor-ai/,
      'vendor-animation': /vendor-animation/,
      'vendor-forms': /vendor-forms/,
      'vendor-utils': /vendor-utils/,
      'vendor-specialized': /vendor-specialized/,
      'vendor-markdown': /vendor-markdown/,
      'vendor-deps': /vendor-deps/,
    };

    for (const [type, pattern] of Object.entries(types)) {
      if (pattern.test(filename)) {
        return type;
      }
    }

    // Chunks por rota
    if (filename.includes('-') && !filename.startsWith('vendor-')) {
      return 'route-chunk';
    }

    return 'main-chunk';
  }

  // Analisar conteúdo do chunk
  analyzeChunkContent(filename, content, size) {
    const analysis = {
      imports: [],
      dependencies: [],
      codeSplit: false,
      treeShakeable: false,
      potentialIssues: []
    };

    // Detectar imports dinâmicos
    const dynamicImports = content.match(/import\(/g);
    if (dynamicImports && dynamicImports.length > 0) {
      analysis.codeSplit = true;
      analysis.dynamicImports = dynamicImports.length;
    }

    // Detectar imports estáticos (análise básica)
    const staticImports = content.match(/import.*from/g);
    if (staticImports) {
      analysis.staticImports = staticImports.length;
    }

    // Detectar possíveis dependências grandes
    const largeDeps = [
      'react', 'react-dom', 'chart.js', 'docx', 'exceljs', 
      'html2pdf', 'openai', 'framer-motion', '@supabase'
    ];

    analysis.dependencies = largeDeps.filter(dep => content.includes(dep));

    // Verificar se pode ser tree-shaken
    analysis.treeShakeable = content.includes('export') && !content.includes('eval(');

    // Detectar potenciais problemas
    if (size > 300000) { // > 300KB
      analysis.potentialIssues.push('Chunk muito grande - pode impactar LCP');
    }
    
    if (analysis.dependencies.length > 5) {
      analysis.potentialIssues.push('Muitas dependências - revisar bundling');
    }

    return analysis;
  }

  // Estimar tamanho comprimido (gzip)
  estimateCompressedSize(content) {
    // Estimativa simples baseada no conteúdo
    const baseSize = content.length;
    const compressionRatio = 0.3; // Aproximadamente 70% de redução para gzip
    
    return Math.round(baseSize * compressionRatio);
  }

  // Calcular métricas agregadas
  calculateMetrics() {
    const chunks = this.analysisResults.chunks;
    
    this.analysisResults.totals = {
      totalChunks: chunks.length,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      totalCompressed: chunks.reduce((sum, chunk) => sum + chunk.compressedSize, 0),
      averageSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0) / chunks.length,
      codeSplitChunks: chunks.filter(c => c.codeSplit).length,
      routeChunks: chunks.filter(c => c.type === 'route-chunk').length,
      vendorChunks: chunks.filter(c => c.type.startsWith('vendor-')).length
    };

    // Calcular percentis
    const sizes = chunks.map(c => c.size).sort((a, b) => a - b);
    this.analysisResults.percentiles = {
      p50: sizes[Math.floor(sizes.length * 0.5)] || 0,
      p90: sizes[Math.floor(sizes.length * 0.9)] || 0,
      p95: sizes[Math.floor(sizes.length * 0.95)] || 0,
      p99: sizes[Math.floor(sizes.length * 0.99)] || 0,
    };
  }

  // Verificar compliance com targets
  checkCompliance() {
    const compliance = this.analysisResults.compliance;
    const chunks = this.analysisResults.chunks;
    const targets = compliance.targetSizes;

    compliance.results = {};
    compliance.passed = 0;
    compliance.failed = 0;

    for (const [type, targetSize] of Object.entries(targets)) {
      const matchingChunks = chunks.filter(c => c.type === type);
      
      if (matchingChunks.length === 0) {
        compliance.results[type] = {
          status: 'missing',
          message: `Chunk ${type} não encontrado`
        };
        compliance.failed++;
        continue;
      }

      const largestChunk = Math.max(...matchingChunks.map(c => c.size));
      const passed = largestChunk <= targetSize;

      compliance.results[type] = {
        status: passed ? 'pass' : 'fail',
        actualSize: largestChunk,
        targetSize: targetSize,
        difference: largestChunk - targetSize,
        message: passed 
          ? `Dentro do target (${this.formatSize(largestChunk)} ≤ ${this.formatSize(targetSize)})`
          : `Excede target (${this.formatSize(largestChunk)} > ${this.formatSize(targetSize)})`
      };

      if (passed) {
        compliance.passed++;
      } else {
        compliance.failed++;
      }
    }
  }

  // Gerar recomendações de otimização
  generateRecommendations() {
    const recommendations = [];
    const chunks = this.analysisResults.chunks;
    const totals = this.analysisResults.totals;

    // Recomendações baseadas em tamanho
    const oversizedChunks = chunks.filter(c => c.size > 250000);
    if (oversizedChunks.length > 0) {
      recommendations.push({
        type: 'size',
        priority: 'high',
        message: `Encontrados ${oversizedChunks.length} chunks maiores que 250KB`,
        action: 'Considerar dividir em chunks menores ou revisar dependências',
        chunks: oversizedChunks.map(c => c.filename)
      });
    }

    // Recomendações baseadas em número de chunks
    if (totals.totalChunks > 50) {
      recommendations.push({
        type: 'count',
        priority: 'medium',
        message: `Muitos chunks (${totals.totalChunks}) podem impactar performance`,
        action: 'Consolidar chunks pequenos ou ajustar estratégia de splitting',
      });
    }

    // Recomendações baseadas em dependências
    const heavyDepsChunks = chunks.filter(c => c.dependencies.length > 5);
    if (heavyDepsChunks.length > 0) {
      recommendations.push({
        type: 'dependencies',
        priority: 'medium',
        message: `${heavyDepsChunks.length} chunks com muitas dependências`,
        action: 'Revisar bundling de dependências ou considerar dynamic imports',
        chunks: heavyDepsChunks.map(c => c.filename)
      });
    }

    // Recomendações baseadas em compression
    const poorlyCompressedChunks = chunks.filter(c => {
      const compressionRatio = c.compressedSize / c.size;
      return compressionRatio > 0.4; // Menos de 60% de compressão
    });

    if (poorlyCompressedChunks.length > 0) {
      recommendations.push({
        type: 'compression',
        priority: 'low',
        message: `${poorlyCompressedChunks.length} chunks com compressão inferior a 60%`,
        action: 'Revisar código ou verificar se há dados inline',
        chunks: poorlyCompressedChunks.map(c => c.filename)
      });
    }

    this.analysisResults.recommendations = recommendations;
  }

  // Gerar relatório em JSON
  async generateReport() {
    fs.writeFileSync(
      this.reportPath, 
      JSON.stringify(this.analysisResults, null, 2)
    );
    
    console.log(`\n📄 Relatório salvo em: ${this.reportPath}`);
  }

  // Exibir resultados no console
  displayResults() {
    const { totals, compliance, percentiles, recommendations } = this.analysisResults;

    console.log('\n📊 === ANÁLISE DE BUNDLE ===\n');

    // Totais
    console.log('📈 Totais:');
    console.log(`  Total de chunks: ${totals.totalChunks}`);
    console.log(`  Tamanho total: ${this.formatSize(totals.totalSize)}`);
    console.log(`  Tamanho comprimido: ${this.formatSize(totals.totalCompressed)}`);
    console.log(`  Tamanho médio: ${this.formatSize(totals.averageSize)}`);
    console.log(`  Chunks com code split: ${totals.codeSplitChunks}`);
    console.log(`  Chunks de vendor: ${totals.vendorChunks}`);

    // Percentis
    console.log('\n📊 Distribuição de Tamanhos:');
    console.log(`  P50: ${this.formatSize(percentiles.p50)}`);
    console.log(`  P90: ${this.formatSize(percentiles.p90)}`);
    console.log(`  P95: ${this.formatSize(percentiles.p95)}`);
    console.log(`  P99: ${this.formatSize(percentiles.p99)}`);

    // Compliance
    console.log('\n✅ Compliance com Targets:');
    console.log(`  Passou: ${compliance.passed}`);
    console.log(`  Falhou: ${compliance.failed}`);
    console.log(`  Taxa de sucesso: ${Math.round((compliance.passed / (compliance.passed + compliance.failed)) * 100)}%`);

    // Detalhes de compliance
    for (const [type, result] of Object.entries(compliance.results)) {
      const icon = result.status === 'pass' ? '✅' : 
                   result.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${icon} ${type}: ${result.message}`);
    }

    // Recomendações
    if (recommendations.length > 0) {
      console.log('\n💡 Recomendações:');
      recommendations.forEach((rec, index) => {
        const icon = rec.priority === 'high' ? '🚨' : 
                     rec.priority === 'medium' ? '⚠️' : '💭';
        console.log(`  ${icon} ${index + 1}. ${rec.message}`);
        console.log(`     Ação: ${rec.action}`);
        if (rec.chunks) {
          console.log(`     Chunks: ${rec.chunks.join(', ')}`);
        }
      });
    } else {
      console.log('\n✨ Nenhuma recomendação - bundle otimizado!');
    }

    console.log('\n🎯 === FIM DA ANÁLISE ===\n');
  }

  // Formatar tamanho em bytes
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Executar análise
const analyzer = new BundleAnalyzer();
analyzer.analyze().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});