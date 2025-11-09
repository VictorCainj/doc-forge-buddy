#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DependencyAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.srcPath = path.join(projectPath, 'src');
    this.files = new Map();
    this.dependencies = [];
    this.circularDeps = [];
    this.componentStats = new Map();
  }

  async analyze() {
    console.log('🔍 Iniciando análise de dependências...');
    
    // 1. Coletar todos os arquivos TypeScript/JavaScript
    await this.collectFiles();
    console.log(`📁 Coletados ${this.files.size} arquivos`);
    
    // 2. Parsear cada arquivo
    await this.parseFiles();
    console.log('📝 Parseados todos os arquivos');
    
    // 3. Resolver dependências
    this.resolveDependencies();
    console.log('🔗 Resolvidas dependências');
    
    // 4. Detectar dependências circulares
    this.findCircularDependencies();
    console.log(`🔄 Encontradas ${this.circularDeps.length} dependências circulares`);
    
    // 5. Calcular estatísticas
    this.calculateStats();
    console.log('📊 Calculadas estatísticas');
    
    // 6. Gerar relatório
    this.generateReport();
    console.log('📋 Relatório gerado');
  }

  async collectFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    const walkDir = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        // Pular node_modules e outros diretórios desnecessários
        if (item.startsWith('.') || 
            item === 'node_modules' || 
            item === 'dist' || 
            item === 'build' ||
            item === 'coverage') {
          continue;
        }

        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath, relativePath);
        } else if (extensions.includes(path.extname(item))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const normalizedPath = this.normalizePath(relativePath);
          this.files.set(normalizedPath, {
            path: normalizedPath,
            content,
            imports: [],
            exports: [],
            symbols: {}
          });
        }
      }
    };

    walkDir(this.srcPath);
  }

  normalizePath(p) {
    return p.replace(/\\/g, '/');
  }

  async parseFiles() {
    for (const [filePath, fileInfo] of this.files) {
      this.parseFile(fileInfo);
    }
  }

  parseFile(fileInfo) {
    const lines = fileInfo.content.split('\n');
    
    for (const line of lines) {
      this.parseLine(line, fileInfo);
    }
  }

  parseLine(line, fileInfo) {
    // Parsear imports
    const importMatch = line.match(/import\s+(?:{([^}]+)}|([^,\s]+))\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const symbolsStr = importMatch[1] || importMatch[2] || '';
      const modulePath = importMatch[3];
      const symbols = symbolsStr ? symbolsStr.split(',').map(s => s.trim()) : [];
      
      const resolvedModule = this.resolveModulePath(modulePath, fileInfo.path);
      
      const importInfo = {
        from: fileInfo.path,
        module: resolvedModule || modulePath,
        symbols: symbols,
        isDefault: !importMatch[1], // Se não tem {}, é default import
        isNamespace: symbols.some(s => s.includes('*')),
        isDynamic: false
      };
      
      fileInfo.imports.push(importInfo);
      
      // Adicionar símbolos ao escopo do arquivo
      symbols.forEach(symbol => {
        if (symbol !== '*' && symbol !== 'default') {
          fileInfo.symbols[symbol] = true;
        }
      });
    }
    
    // Parsear dynamic imports
    const dynamicImportMatch = line.match(/import\(['"]([^'"]+)['"]\)/);
    if (dynamicImportMatch) {
      const modulePath = dynamicImportMatch[1];
      const resolvedModule = this.resolveModulePath(modulePath, fileInfo.path);
      
      const importInfo = {
        from: fileInfo.path,
        module: resolvedModule || modulePath,
        symbols: ['*'],
        isDefault: false,
        isNamespace: true,
        isDynamic: true
      };
      
      fileInfo.imports.push(importInfo);
    }
    
    // Parsear exports
    const exportMatch = line.match(/export\s+(?:{([^}]+)}|default|function|class|interface|type)/);
    if (exportMatch) {
      if (exportMatch[1]) {
        // Named exports
        const symbols = exportMatch[1].split(',').map(s => s.trim());
        symbols.forEach(symbol => {
          fileInfo.exports.push(symbol);
          fileInfo.symbols[symbol] = true;
        });
      } else {
        // Default export
        const nameMatch = line.match(/export\s+(?:default\s+)?(?:function|class|interface|type)\s+(\w+)/);
        if (nameMatch) {
          const name = nameMatch[1];
          fileInfo.exports.push(name);
          fileInfo.symbols[name] = true;
        }
      }
    }
  }

  resolveModulePath(modulePath, currentFilePath) {
    // Se for um alias @/, resolver para src/
    if (modulePath.startsWith('@/')) {
      const relative = modulePath.substring(2);
      const resolved = path.join(this.srcPath, relative);
      
      // Tentar diferentes extensões
      const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
      for (const ext of extensions) {
        const fullPath = resolved + ext;
        const normalized = this.normalizePath(path.relative(this.srcPath, fullPath));
        if (this.files.has(normalized)) {
          return normalized;
        }
      }
    }
    
    // Se for um caminho relativo
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      const currentDir = path.dirname(currentFilePath);
      const resolved = path.normalize(path.join(currentDir, modulePath));
      
      // Tentar diferentes extensões
      const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
      for (const ext of extensions) {
        const fullPath = resolved + ext;
        const normalized = this.normalizePath(path.relative(this.srcPath, fullPath));
        if (this.files.has(normalized)) {
          return normalized;
        }
      }
    }
    
    return null;
  }

  resolveDependencies() {
    this.dependencies = [];
    
    for (const [filePath, fileInfo] of this.files) {
      for (const importInfo of fileInfo.imports) {
        if (importInfo.module && this.files.has(importInfo.module)) {
          const dep = {
            from: filePath,
            to: importInfo.module,
            symbols: importInfo.symbols
          };
          this.dependencies.push(dep);
        }
      }
    }
  }

  findCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];

    const dfs = (node) => {
      if (recursionStack.has(node)) {
        // Encontrou um ciclo
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          this.circularDeps.push({
            cycle: [...path.slice(cycleStart), node]
          });
        }
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      // Encontrar dependências de saída
      const outgoing = this.dependencies
        .filter(dep => dep.from === node)
        .map(dep => dep.to);

      for (const neighbor of outgoing) {
        dfs(neighbor);
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const filePath of this.files.keys()) {
      if (!visited.has(filePath)) {
        dfs(filePath);
      }
    }
  }

  calculateStats() {
    for (const [filePath, fileInfo] of this.files) {
      const dependencies = this.dependencies.filter(dep => dep.from === filePath);
      const dependents = this.dependencies.filter(dep => dep.to === filePath);
      
      const type = this.classifyFile(filePath);
      
      this.componentStats.set(filePath, {
        file: filePath,
        dependencies: dependencies.length,
        dependents: dependents.length,
        type
      });
    }
  }

  classifyFile(filePath) {
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    if (pathParts.includes('pages')) return 'page';
    if (pathParts.includes('features')) return 'feature';
    if (pathParts.includes('components')) return 'component';
    if (pathParts.includes('hooks')) return 'hook';
    if (pathParts.includes('utils')) return 'util';
    if (pathParts.includes('types')) return 'type';
    if (fileName.startsWith('types.') || fileName.includes('types')) return 'type';
    
    return 'other';
  }

  generateReport() {
    const reportPath = path.join(this.projectPath, 'docs', 'analise_dependencias.md');
    
    const report = this.buildReport();
    
    fs.writeFileSync(reportPath, report, 'utf-8');
  }

  buildReport() {
    const topCoupled = Array.from(this.componentStats.entries())
      .sort((a, b) => b[1].dependencies - a[1].dependencies)
      .slice(0, 10);

    const lazyLoadCandidates = Array.from(this.componentStats.entries())
      .filter(([_, info]) => info.type === 'page' || info.type === 'feature')
      .filter(([_, info]) => info.dependencies > 5)
      .sort((a, b) => b[1].dependencies - a[1].dependencies);

    const statsByType = this.getStatsByType();
    const unusedImports = this.findUnusedImports();

    return `# Análise de Dependências - Doc Forge Buddy

## Resumo Executivo

- **Total de arquivos analisados:** ${this.files.size}
- **Total de dependências encontradas:** ${this.dependencies.length}
- **Dependências circulares:** ${this.circularDeps.length}
- **Arquivos com imports não utilizados:** ${unusedImports.length}

## 1. Dependências Circulares

${this.circularDeps.length > 0 ? 
  this.circularDeps.map((dep, index) => 
    `### Ciclo ${index + 1}\n` +
    dep.cycle.map(file => `- \`${file}\``).join('\n') +
    '\n'
  ).join('\n') : 
  '✅ Nenhuma dependência circular detectada!'
}

## 2. Componentes Mais Acoplados (Top 10)

${topCoupled.map(([file, info], index) => 
  `### ${index + 1}. \`${file}\`\n` +
  `- **Tipo:** ${info.type}\n` +
  `- **Dependências:** ${info.dependencies}\n` +
  `- **Dependentes:** ${info.dependents}\n`
).join('\n')}

## 3. Estatísticas por Tipo de Componente

${Object.entries(statsByType).map(([type, stats]) => 
  `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n` +
  `- **Quantidade:** ${stats.count}\n` +
  `- **Dependências médias:** ${stats.avgDependencies.toFixed(1)}\n` +
  `- **Dependentes médios:** ${stats.avgDependents.toFixed(1)}\n`
).join('\n')}

## 4. Imports Não Utilizados

${unusedImports.length > 0 ? 
  unusedImports.map(item => 
    `### \`${item.file}\`\n` +
    `**Imports não utilizados:**\n` +
    item.unused.map(imp => `- \`${imp}\``).join('\n') +
    '\n'
  ).join('\n') : 
  '✅ Nenhum import não utilizado detectado!'
}

## 5. Candidatos a Lazy Loading

${lazyLoadCandidates.map(([file, info], index) => 
  `### ${index + 1}. \`${file}\`\n` +
  `- **Tipo:** ${info.type}\n` +
  `- **Dependências:** ${info.dependencies} (ideal para lazy loading)\n` +
  `- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting\n`
).join('\n')}

## 6. Recomendações para Redução de Acoplamento

### Prioritárias
${this.getTopCouplingRecommendations()}

### Gerais
1. **Modularização:** Separar responsabilidades em módulos menores
2. **Dependency Injection:** Usar DI para reduzir acoplamento direto
3. **Event-driven Architecture:** Usar eventos para comunicação entre componentes
4. **Custom Hooks:** Extrair lógica de estado em hooks customizados
5. **Context API:** Usar Context para estado global ao invés de props drilling

## 7. Sugestões de Code Splitting

### Por Feature
- **Documentos:** \`/pages/documentos\`
- **Vistorias:** \`/pages/vistoria\`
- **Contratos:** \`/pages/contratos\`
- **Chat:** \`/pages/chat\`
- **Admin:** \`/pages/admin\`

### Por Componente
- **Componentes grandes (>100 linhas)**
- **Componentes com muitas dependências (>10)**
- **Bibliotecas de terceiros pesadas**

### Implementação Sugerida
\`\`\`typescript
// Lazy loading por rota
const Documentos = lazy(() => import('./pages/documentos'));
const Vistoria = lazy(() => import('./pages/vistoria'));

// Lazy loading por componente
const HeavyComponent = lazy(() => 
  import('./components/HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);
\`\`\`

## 8. Arquitetura Recomendada

\`\`\`
src/
├── features/          # Features isoladas
│   ├── documentos/    # Feature documentos
│   ├── vistoria/      # Feature vistoria
│   └── contratos/     # Feature contratos
├── shared/            # Código compartilhado
│   ├── components/    # Componentes reutilizáveis
│   ├── hooks/         # Hooks customizados
│   ├── utils/         # Utilitários
│   └── types/         # Tipos globais
├── pages/             # Páginas (lazy loaded)
└── app/               # Configuração da aplicação
\`\`\`

## 9. Análise de Dependências por Feature

### Documentos
- **Arquivos principais:** documents/, document-upload/
- **Dependências externas:** Supabase, docx, exceljs
- **Candidatos a lazy loading:** DocumentUpload, DocumentList

### Vistoria
- **Arquivos principais:** vistoria/, inspection/
- **Dependências externas:** Supabase, react-hook-form
- **Candidatos a lazy loading:** InspectionForm, InspectionList

### Contratos
- **Arquivos principais:** contracts/, contract/
- **Dependências externas:** Supabase
- **Candidatos a lazy loading:** ContractEditor, ContractViewer

### Chat
- **Arquivos principais:** chat/, messaging/
- **Dependências externas:** Supabase Realtime
- **Candidatos a lazy loading:** ChatRoom, MessageList

### Admin
- **Arquivos principais:** admin/, management/
- **Dependências externas:** Multiple UI libraries
- **Candidatos a lazy loading:** AdminPanel, UserManagement

## 10. Métricas de Acoplamento

### Níveis de Acoplamento
- **Baixo (1-5 deps):** ✅ Componentes bem modularizados
- **Médio (6-10 deps):** ⚠️  Aceptável, monitorar
- **Alto (11-15 deps):** 🔥  Requer refatoração
- **Crítico (>15 deps):** 🚨  Reestruturação urgente

### Componentes Críticos
${this.getCriticalComponents()}

---
*Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
  }

  getStatsByType() {
    const stats = {};

    for (const [_, info] of this.componentStats) {
      if (!stats[info.type]) {
        stats[info.type] = { count: 0, dependencies: 0, dependents: 0 };
      }
      stats[info.type].count++;
      stats[info.type].dependencies += info.dependencies;
      stats[info.type].dependents += info.dependents;
    }

    const result = {};
    
    for (const [type, data] of Object.entries(stats)) {
      result[type] = {
        count: data.count,
        avgDependencies: data.dependencies / data.count,
        avgDependents: data.dependents / data.count
      };
    }

    return result;
  }

  findUnusedImports() {
    const unused = [];

    for (const [filePath, fileInfo] of this.files) {
      const unusedImports = [];

      for (const importInfo of fileInfo.imports) {
        for (const symbol of importInfo.symbols) {
          if (symbol !== '*' && symbol !== 'default' && !fileInfo.content.includes(symbol)) {
            unusedImports.push(importInfo.module);
            break; // Apenas reportar o módulo uma vez
          }
        }
      }

      if (unusedImports.length > 0) {
        unused.push({ file: filePath, unused: unusedImports });
      }
    }

    return unused;
  }

  getTopCouplingRecommendations() {
    const highCoupling = Array.from(this.componentStats.entries())
      .filter(([_, info]) => info.dependencies > 15)
      .sort((a, b) => b[1].dependencies - a[1].dependencies)
      .slice(0, 5);

    if (highCoupling.length === 0) {
      return 'Nenhum componente com acoplamento excessivo detectado.';
    }

    return highCoupling.map(([file, info], index) => 
      `${index + 1}. **\`${file}\`** - ${info.dependencies} dependências\n` +
      `   - Extrair responsabilidades para módulos menores\n` +
      `   - Implementar interface para reduzir dependências diretas\n` +
      `   - Considerar lazy loading para reduzir acoplamento inicial`
    ).join('\n');
  }

  getCriticalComponents() {
    const critical = Array.from(this.componentStats.entries())
      .filter(([_, info]) => info.dependencies > 15)
      .sort((a, b) => b[1].dependencies - a[1].dependencies)
      .slice(0, 5);

    if (critical.length === 0) {
      return 'Nenhum componente em estado crítico detectado.';
    }

    return critical.map(([file, info], index) => 
      `${index + 1}. \`${file}\` - ${info.dependencies} dependências (CRÍTICO)`
    ).join('\n');
  }
}

// Executar análise
const projectPath = process.argv[2] || '/workspace/doc-forge-buddy-Cain';

if (!fs.existsSync(projectPath)) {
  console.error(`❌ Diretório do projeto não encontrado: ${projectPath}`);
  process.exit(1);
}

const analyzer = new DependencyAnalyzer(projectPath);

analyzer.analyze()
  .then(() => {
    console.log('✅ Análise de dependências concluída!');
    console.log('📋 Relatório salvo em: docs/analise_dependencias.md');
  })
  .catch(error => {
    console.error('❌ Erro durante a análise:', error);
    process.exit(1);
  });