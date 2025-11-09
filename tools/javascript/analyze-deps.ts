#!/usr/bin/env node

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  path: string;
  content: string;
  imports: ImportInfo[];
  exports: string[];
  symbols: { [key: string]: boolean };
}

interface ImportInfo {
  from: string;
  module: string;
  symbols: string[];
  isDefault: boolean;
  isNamespace: boolean;
  isDynamic: boolean;
}

interface Dependency {
  from: string;
  to: string;
  symbols: string[];
}

interface CircularDependency {
  cycle: string[];
}

interface ComponentInfo {
  file: string;
  dependencies: number;
  dependents: number;
  type: 'page' | 'feature' | 'component' | 'hook' | 'util' | 'type' | 'other';
}

class DependencyAnalyzer {
  private projectPath: string;
  private srcPath: string;
  private files: Map<string, FileInfo> = new Map();
  private dependencies: Dependency[] = [];
  private circularDeps: CircularDependency[] = [];
  private componentStats: Map<string, ComponentInfo> = new Map();

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.srcPath = path.join(projectPath, 'src');
  }

  async analyze(): Promise<void> {
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

  private async collectFiles(): Promise<void> {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    const walkDir = (dir: string, basePath: string = ''): void => {
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

  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/');
  }

  private async parseFiles(): Promise<void> {
    for (const [filePath, fileInfo] of this.files) {
      const sourceFile = ts.createSourceFile(
        filePath,
        fileInfo.content,
        ts.ScriptTarget.Latest,
        true
      );

      this.parseSourceFile(sourceFile, filePath);
    }
  }

  private parseSourceFile(node: ts.SourceFile, filePath: string): void {
    const fileInfo = this.files.get(filePath)!;

    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node)) {
        this.parseImport(node, fileInfo);
      } else if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
        this.parseExport(node, fileInfo);
      } else if (ts.isFunctionDeclaration(node) || 
                 ts.isClassDeclaration(node) ||
                 ts.isInterfaceDeclaration(node) ||
                 ts.isTypeAliasDeclaration(node)) {
        this.parseExportable(node, fileInfo);
      } else if (ts.isVariableStatement(node)) {
        this.parseExportable(node, fileInfo);
      }

      ts.forEachChild(node, visit);
    };

    visit(node);
  }

  private parseImport(node: ts.ImportDeclaration, fileInfo: FileInfo): void {
    const moduleSpecifier = node.moduleSpecifier;
    
    if (!ts.isStringLiteral(moduleSpecifier)) return;

    const modulePath = moduleSpecifier.text;
    const importClause = node.importClause;
    
    const symbols: string[] = [];
    let isDefault = false;
    let isNamespace = false;

    if (importClause) {
      if (importClause.name) {
        symbols.push(importClause.name.text);
        isDefault = true;
      }
      
      if (importClause.namedBindings) {
        if (ts.isNamespaceImport(importClause.namedBindings)) {
          symbols.push(importClause.namedBindings.name.text);
          isNamespace = true;
        } else if (ts.isNamedImports(importClause.namedBindings)) {
          importClause.namedBindings.elements.forEach(element => {
            symbols.push(element.name.text);
          });
        }
      }
    }

    const resolvedModule = this.resolveModulePath(modulePath, fileInfo.path);
    
    const importInfo: ImportInfo = {
      from: fileInfo.path,
      module: resolvedModule || modulePath,
      symbols,
      isDefault,
      isNamespace,
      isDynamic: false
    };

    fileInfo.imports.push(importInfo);

    // Adicionar símbolos ao escopo do arquivo
    symbols.forEach(symbol => {
      if (symbol !== '*') {
        fileInfo.symbols[symbol] = true;
      }
    });
  }

  private resolveModulePath(modulePath: string, currentFilePath: string): string | null {
    // Se for um alias @/, resolver para src/
    if (modulePath.startsWith('@/')) {
      const relative = modulePath.substring(2); // Remove @/
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

  private parseExport(node: ts.ExportDeclaration | ts.ExportAssignment, fileInfo: FileInfo): void {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        node.exportClause.elements.forEach(element => {
          fileInfo.exports.push(element.name.text);
          fileInfo.symbols[element.name.text] = true;
        });
      }
    } else if (ts.isExportAssignment(node)) {
      if (node.expression) {
        if (ts.isIdentifier(node.expression)) {
          fileInfo.exports.push(node.expression.text);
          fileInfo.symbols[node.expression.text] = true;
        }
      }
    }
  }

  private parseExportable(node: ts.Node, fileInfo: FileInfo): void {
    let name = '';
    
    if (ts.isFunctionDeclaration(node) || 
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node)) {
      if (node.name) {
        name = node.name.text;
      }
    } else if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (ts.isIdentifier(decl.name)) {
          name = decl.name.text;
          fileInfo.exports.push(name);
          fileInfo.symbols[name] = true;
        }
      });
    }
    
    if (name) {
      fileInfo.exports.push(name);
      fileInfo.symbols[name] = true;
    }
  }

  private resolveDependencies(): void {
    this.dependencies = [];
    
    for (const [filePath, fileInfo] of this.files) {
      for (const importInfo of fileInfo.imports) {
        if (importInfo.module && this.files.has(importInfo.module)) {
          const dep: Dependency = {
            from: filePath,
            to: importInfo.module,
            symbols: importInfo.symbols
          };
          this.dependencies.push(dep);
        }
      }
    }
  }

  private findCircularDependencies(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
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

  private calculateStats(): void {
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

  private classifyFile(filePath: string): 'page' | 'feature' | 'component' | 'hook' | 'util' | 'type' | 'other' {
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

  private generateReport(): void {
    const reportPath = path.join(this.projectPath, 'docs', 'analise_dependencias.md');
    
    const report = this.buildReport();
    
    fs.writeFileSync(reportPath, report, 'utf-8');
  }

  private buildReport(): string {
    const topCoupled = Array.from(this.componentStats.entries())
      .sort((a, b) => b[1].dependencies - a[1].dependencies)
      .slice(0, 10);

    const lazyLoadCandidates = Array.from(this.componentStats.entries())
      .filter(([_, info]) => info.type === 'page' || info.type === 'feature')
      .filter(([_, info]) => info.dependencies > 5) // Componentes com muitas dependências
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

---
*Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;
  }

  private getStatsByType(): { [key: string]: { count: number; avgDependencies: number; avgDependents: number } } {
    const stats: { [key: string]: { count: number; dependencies: number; dependents: number } } = {};

    for (const [_, info] of this.componentStats) {
      if (!stats[info.type]) {
        stats[info.type] = { count: 0, dependencies: 0, dependents: 0 };
      }
      stats[info.type].count++;
      stats[info.type].dependencies += info.dependencies;
      stats[info.type].dependents += info.dependents;
    }

    const result: { [key: string]: { count: number; avgDependencies: number; avgDependents: number } } = {};
    
    for (const [type, data] of Object.entries(stats)) {
      result[type] = {
        count: data.count,
        avgDependencies: data.dependencies / data.count,
        avgDependents: data.dependents / data.count
      };
    }

    return result;
  }

  private findUnusedImports(): Array<{ file: string; unused: string[] }> {
    const unused: Array<{ file: string; unused: string[] }> = [];

    for (const [filePath, fileInfo] of this.files) {
      const unusedImports: string[] = [];

      for (const importInfo of fileInfo.imports) {
        for (const symbol of importInfo.symbols) {
          if (symbol !== '*' && !fileInfo.content.includes(symbol)) {
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

  private getTopCouplingRecommendations(): string {
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