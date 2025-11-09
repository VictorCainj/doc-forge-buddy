#!/usr/bin/env node

/**
 * Ferramenta CLI para análise automática de memoization
 * Detecta oportunidades de otimização em componentes React
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MemoizationAnalyzer {
  constructor(options = {}) {
    this.options = {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      excludePatterns: [
        'node_modules',
        'dist',
        'build',
        '.next',
        '.git',
        'coverage',
        'test-data'
      ],
      minRenderCount: 5,
      maxRenderTime: 16,
      outputFormat: 'console', // 'console', 'json', 'html'
      ...options
    };
    this.analysisResults = new Map();
    this.summary = {
      totalFiles: 0,
      filesAnalyzed: 0,
      opportunitiesFound: 0,
      totalComponents: 0,
      memoizedComponents: 0,
      overallScore: 0
    };
  }

  /**
   * Analisa todos os arquivos no diretório
   */
  async analyzeDirectory(dirPath) {
    console.log(`🔍 Analisando diretório: ${dirPath}`);
    
    const files = this.getAllFiles(dirPath);
    this.summary.totalFiles = files.length;
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
    
    this.generateReport();
    return this.summary;
  }

  /**
   * Obtém todos os arquivos relevantes
   */
  getAllFiles(dirPath, relativePath = '') {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const entryRelativePath = path.join(relativePath, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Verificar se deve excluir
          if (!this.shouldExclude(entry)) {
            files.push(...this.getAllFiles(fullPath, entryRelativePath));
          }
        } else if (this.isRelevantFile(entry)) {
          files.push({
            path: fullPath,
            relativePath: entryRelativePath,
            content: fs.readFileSync(fullPath, 'utf8'),
            ext: path.extname(entry)
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao ler diretório ${dirPath}: ${error.message}`);
    }
    
    return files;
  }

  /**
   * Verifica se deve excluir o diretório/arquivo
   */
  shouldExclude(name) {
    return this.options.excludePatterns.some(pattern => {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        return new RegExp(pattern.slice(1, -1)).test(name);
      }
      return name.includes(pattern);
    });
  }

  /**
   * Verifica se é arquivo relevante
   */
  isRelevantFile(filename) {
    return this.options.extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Analisa um arquivo individual
   */
  async analyzeFile(file) {
    this.summary.filesAnalyzed++;
    
    try {
      const result = this.analyzeFileContent(file.content, file.path, file.relativePath);
      this.analysisResults.set(file.path, result);
      
      // Atualizar summary
      this.summary.totalComponents += result.components.length;
      this.summary.memoizedComponents += result.memoizedComponents;
      this.summary.opportunitiesFound += result.opportunities.length;
      
      // Log progress
      if (this.summary.filesAnalyzed % 10 === 0) {
        console.log(`📊 Analisados ${this.summary.filesAnalyzed} arquivos...`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao analisar ${file.path}:`, error.message);
    }
  }

  /**
   * Analisa o conteúdo do arquivo
   */
  analyzeFileContent(content, filePath, relativePath) {
    const lines = content.split('\n');
    const analysis = {
      filePath,
      relativePath,
      components: [],
      opportunities: [],
      issues: [],
      suggestions: [],
      score: 100,
      metrics: {
        totalComponents: 0,
        memoizedComponents: 0,
        inlineFunctions: 0,
        objectCreations: 0,
        arrayCreations: 0,
        complexProps: 0
      }
    };

    // Detectar componentes
    const componentPattern = /(?:const\s+(\w+)\s*=\s*(?:memo\(|forwardRef\()|function\s+(\w+)\s*\(|export\s+(?:default\s+)?(?:const\s+)?(\w+)\s*=)/g;
    let match;

    while ((match = componentPattern.exec(content)) !== null) {
      const componentName = match[1] || match[2] || match[3];
      const componentStartLine = lines.findIndex((line, index) => index >= match.index && line.includes(componentName));
      const componentAnalysis = this.analyzeComponent(content, componentName, componentStartLine);
      
      analysis.components.push(componentAnalysis);
      analysis.metrics.totalComponents++;
      
      if (componentAnalysis.isMemoized) {
        analysis.metrics.memoizedComponents++;
      } else {
        // Adicionar oportunidades se não for memoizado
        analysis.opportunities.push(...componentAnalysis.opportunities);
      }
    }

    // Métricas gerais do arquivo
    analysis.metrics.inlineFunctions = this.countInlineFunctions(content);
    analysis.metrics.objectCreations = this.countObjectCreations(content);
    analysis.metrics.arrayCreations = this.countArrayCreations(content);

    // Calcular score
    analysis.score = this.calculateFileScore(analysis);

    return analysis;
  }

  /**
   * Analisa um componente específico
   */
  analyzeComponent(content, componentName, startLine) {
    const lines = content.split('\n');
    const component = {
      name: componentName,
      startLine,
      isMemoized: false,
      opportunities: [],
      issues: [],
      complexity: 'low',
      performance: 'good',
      suggestions: []
    };

    // Verificar se é memoizado
    if (content.includes(`${componentName} = memo`) || 
        content.includes(`${componentName} = React.memo`) ||
        content.includes(`React.memo(${componentName}`)) {
      component.isMemoized = true;
    }

    // Analizar o corpo do componente
    const componentBody = this.extractComponentBody(content, componentName);
    
    if (!component.isMemoized) {
      // Detectar oportunidades de memoization
      
      // 1. Funções inline
      const inlineFunctions = this.findInlineFunctions(componentBody);
      if (inlineFunctions.length > 0) {
        component.opportunities.push({
          type: 'useCallback',
          severity: 'medium',
          description: `${inlineFunctions.length} funções inline detectadas`,
          impact: 'Re-criação de funções a cada render',
          solution: 'Wrap functions with useCallback',
          location: componentName,
          code: inlineFunctions[0]
        });
        component.issues.push(`Funcionalidades inline podem causar re-renders`);
      }

      // 2. Objetos criados
      const objects = this.findObjectCreations(componentBody);
      if (objects.length > 2) {
        component.opportunities.push({
          type: 'useMemo',
          severity: 'medium',
          description: `${objects.length} objetos criados a cada render`,
          impact: 'Re-criação desnecessária de objetos',
          solution: 'Wrap complex objects with useMemo',
          location: componentName,
          code: objects[0]
        });
        component.issues.push(`Criação de objetos pode ser otimizada`);
      }

      // 3. Arrays criados
      const arrays = this.findArrayCreations(componentBody);
      if (arrays.length > 1) {
        component.opportunities.push({
          type: 'useMemo',
          severity: 'low',
          description: `${arrays.length} arrays criados a cada render`,
          impact: 'Re-criação desnecessária de arrays',
          solution: 'Wrap arrays with useMemo',
          location: componentName,
          code: arrays[0]
        });
      }

      // 4. Props complexas
      const complexProps = this.findComplexProps(componentBody);
      if (complexProps.length > 0) {
        component.opportunities.push({
          type: 'React.memo',
          severity: 'high',
          description: `Props complexas detectadas`,
          impact: 'Re-renders desnecessários',
          solution: 'Use React.memo com custom comparison',
          location: componentName,
          code: complexProps[0]
        });
        component.issues.push(`Props complexas podem causar re-renders`);
      }

      // Calcular complexidade
      if (component.opportunities.length > 3) {
        component.complexity = 'high';
        component.performance = 'poor';
      } else if (component.opportunities.length > 1) {
        component.complexity = 'medium';
        component.performance = 'fair';
      }

      // Gerar sugestões específicas
      component.suggestions = this.generateSuggestions(component);
    }

    return component;
  }

  /**
   * Extrai o corpo do componente
   */
  extractComponentBody(content, componentName) {
    const lines = content.split('\n');
    const startIndex = lines.findIndex(line => line.includes(componentName));
    if (startIndex === -1) return '';

    // Encontrar início do componente
    let braceCount = 0;
    let inComponent = false;
    let componentBody = '';

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('=') || line.includes('function')) {
        inComponent = true;
        continue;
      }

      if (inComponent) {
        componentBody += line + '\n';
        
        // Contar chaves
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        
        // Se chegamos ao final do componente
        if (braceCount === 0 && line.includes('}')) {
          break;
        }
      }
    }

    return componentBody;
  }

  /**
   * Encontra funções inline
   */
  findInlineFunctions(content) {
    const patterns = [
      /const\s+(\w+)\s*=\s*\(\s*\)\s*=>/g,
      /const\s+(\w+)\s*=\s*function\s*\(/g,
      /const\s+(\w+)\s*=\s*\(\s*.*\s*\)\s*=>/g
    ];
    
    const functions = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push(match[0]);
      }
    }
    
    return functions;
  }

  /**
   * Encontra criações de objetos
   */
  findObjectCreations(content) {
    const pattern = /{\s*[^}]*:\s*[^}]*\s*}/g;
    const matches = [];
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      // Filtrar objetos muito simples
      if (match[0].length > 20) {
        matches.push(match[0]);
      }
    }
    
    return matches;
  }

  /**
   * Encontra criações de arrays
   */
  findArrayCreations(content) {
    const pattern = /\[\s*[^\]]*\s*]/g;
    const matches = [];
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      // Filtrar arrays muito simples
      if (match[0].length > 10) {
        matches.push(match[0]);
      }
    }
    
    return matches;
  }

  /**
   * Encontra props complexas
   */
  findComplexProps(content) {
    const patterns = [
      /{(\w+):\s*{[^}]*}}/g, // Objetos aninhados
      /{(\w+):\s*\[[^\]]*\]/g, // Arrays
      /{(\w+):\s*\w+\([^)]*\)/g // Funções
    ];
    
    const matches = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        matches.push(match[0]);
      }
    }
    
    return matches;
  }

  /**
   * Conta funções inline
   */
  countInlineFunctions(content) {
    const patterns = [
      /const\s+\w+\s*=\s*\(\s*\)\s*=>/g,
      /const\s+\w+\s*=\s*function\s*\(/g
    ];
    
    let count = 0;
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    }
    
    return count;
  }

  /**
   * Conta criações de objetos
   */
  countObjectCreations(content) {
    const pattern = /{\s*[^}]*:\s*[^}]*\s*}/g;
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Conta criações de arrays
   */
  countArrayCreations(content) {
    const pattern = /\[\s*[^\]]*\s*]/g;
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Calcula score do arquivo
   */
  calculateFileScore(analysis) {
    let score = 100;
    
    // Penalizar por oportunidades não implementadas
    score -= analysis.opportunities.length * 5;
    
    // Penalizar por componentes não memoizados
    const unmemoizedCount = analysis.components.length - analysis.metrics.memoizedComponents;
    score -= unmemoizedCount * 10;
    
    // Penalizar por complexidade
    const complexComponents = analysis.components.filter(c => c.complexity === 'high');
    score -= complexComponents.length * 15;
    
    return Math.max(0, score);
  }

  /**
   * Gera sugestões específicas
   */
  generateSuggestions(component) {
    const suggestions = [];
    
    if (component.opportunities.length > 0) {
      suggestions.push(`Implementar React.memo para ${component.name}`);
    }
    
    const callbackOps = component.opportunities.filter(o => o.type === 'useCallback');
    if (callbackOps.length > 0) {
      suggestions.push(`Usar useCallback para ${callbackOps.length} funções`);
    }
    
    const memoOps = component.opportunities.filter(o => o.type === 'useMemo');
    if (memoOps.length > 0) {
      suggestions.push(`Usar useMemo para ${memoOps.length} objetos/arrays`);
    }
    
    return suggestions;
  }

  /**
   * Gera relatório final
   */
  generateReport() {
    console.log('\n📊 RELATÓRIO DE MEMOIZATION\n');
    console.log('═'.repeat(50));
    
    console.log(`📁 Total de arquivos: ${this.summary.totalFiles}`);
    console.log(`✅ Arquivos analisados: ${this.summary.filesAnalyzed}`);
    console.log(`🔧 Componentes encontrados: ${this.summary.totalComponents}`);
    console.log(`⚡ Componentes memoizados: ${this.summary.memoizedComponents}`);
    console.log(`🎯 Oportunidades encontradas: ${this.summary.opportunitiesFound}`);
    
    // Calcular score geral
    if (this.summary.totalComponents > 0) {
      this.summary.overallScore = (this.summary.memoizedComponents / this.summary.totalComponents) * 100;
      console.log(`📈 Score geral: ${this.summary.overallScore.toFixed(1)}%`);
    }
    
    // Mostrar arquivos com mais oportunidades
    const topOpportunities = Array.from(this.analysisResults.entries())
      .filter(([_, result]) => result.opportunities.length > 0)
      .sort((a, b) => b[1].opportunities.length - a[1].opportunities.length)
      .slice(0, 5);
    
    if (topOpportunities.length > 0) {
      console.log('\n🔍 ARQUIVOS COM MAIS OPORTUNIDADES:');
      topOpportunities.forEach(([path, result]) => {
        const relativePath = path.split('/').slice(-2).join('/');
        console.log(`  📄 ${relativePath}: ${result.opportunities.length} oportunidades`);
      });
    }
    
    // Recomendações gerais
    console.log('\n💡 RECOMENDAÇÕES GERAIS:');
    
    if (this.summary.overallScore < 70) {
      console.log('  • Priorizar memoization de componentes críticos');
    }
    if (this.summary.opportunitiesFound > 20) {
      console.log('  • Implementar auto-memoization tooling');
    }
    if (this.summary.totalComponents > 50) {
      console.log('  • Considerar component architecture review');
    }
    
    // Top oportunidades por tipo
    const opportunityTypes = {};
    for (const result of this.analysisResults.values()) {
      for (const opp of result.opportunities) {
        opportunityTypes[opp.type] = (opportunityTypes[opp.type] || 0) + 1;
      }
    }
    
    if (Object.keys(opportunityTypes).length > 0) {
      console.log('\n🎯 OPORTUNIDADES POR TIPO:');
      Object.entries(opportunityTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`  • ${type}: ${count} oportunidades`);
        });
    }
    
    console.log('\n' + '═'.repeat(50));
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const directory = args[0] || '.';
  const format = args[1] || 'console';
  
  console.log('🚀 Iniciando análise de memoization...');
  
  const analyzer = new MemoizationAnalyzer({
    outputFormat: format
  });
  
  analyzer.analyzeDirectory(directory)
    .then(() => {
      console.log('\n✅ Análise concluída!');
    })
    .catch(error => {
      console.error('❌ Erro durante análise:', error);
      process.exit(1);
    });
}

module.exports = MemoizationAnalyzer;