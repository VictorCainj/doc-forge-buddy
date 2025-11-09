import { readFileSync } from 'fs';

// Analisar uso real de dependencies
function analyzeDependencies() {
  console.log('🔍 Análise de Dependencies - Uso Real\n');
  console.log('='.repeat(70));
  
  // Ler package.json
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Bibliotecas críticas para análise
  const criticalLibs = {
    'docx': { size: '600KB', usage: [], critical: true, suggestion: 'Implementar lazy loading' },
    'html2pdf.js': { size: '400KB', usage: [], critical: true, suggestion: 'Carregar apenas na página de documento' },
    'html2canvas': { size: '250KB', usage: [], critical: true, suggestion: 'Lazy load para screenshots' },
    'jspdf': { size: '300KB', usage: [], critical: true, suggestion: 'Considerar unificar com html2pdf' },
    'exceljs': { size: '500KB', usage: [], critical: true, suggestion: 'Exportação under demand' },
    'openai': { size: '400KB', usage: [], critical: true, suggestion: 'Usar API proxy server' },
    'chart.js': { size: '250KB', usage: [], critical: true, suggestion: 'Lazy load para gráficos' },
    'framer-motion': { size: '150KB', usage: [], critical: false, suggestion: 'Remover do bundle global' },
    'react-markdown': { size: '150KB', usage: [], critical: false, suggestion: 'Lazy load para preview' },
    'date-fns': { size: '35KB', usage: [], critical: false, suggestion: 'Tree-shaking de funções específicas' },
    'lucide-react': { size: '400KB', usage: [], critical: false, suggestion: 'Importar apenas ícones necessários' }
  };
  
  // Analisar arquivos de código
  const fs = require('fs');
  const path = require('path');
  
  function analyzeDirectory(dir, files = []) {
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          analyzeDirectory(fullPath, files);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js')) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Ignorar diretórios inacessíveis
    }
    return files;
  }
  
  const codeFiles = analyzeDirectory('./src');
  
  // Contar uso das libraries
  codeFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      Object.keys(criticalLibs).forEach(lib => {
        if (content.includes(`'${lib}'`) || 
            content.includes(`"${lib}"`) || 
            content.includes(`from '${lib}'`) ||
            content.includes(`from "${lib}"`)) {
          criticalLibs[lib].usage.push(path.relative('./src', file));
        }
      });
    } catch (error) {
      // Ignorar arquivos ilegíveis
    }
  });
  
  // Exibir análise
  Object.entries(criticalLibs).forEach(([lib, info]) => {
    console.log(`\n📦 ${lib.padEnd(15)} | ${info.size.padEnd(8)} | ${info.usage.length} usos`);
    console.log(`   💾 Tamanho: ${info.size}`);
    console.log(`   🎯 Crítico: ${info.critical ? 'SIM' : 'NÃO'}`);
    console.log(`   💡 Sugestão: ${info.suggestion}`);
    
    if (info.usage.length > 0) {
      const uniqueFiles = [...new Set(info.usage)];
      console.log(`   📁 Arquivos (${uniqueFiles.length}):`);
      uniqueFiles.slice(0, 5).forEach(file => {
        console.log(`      • ${file}`);
      });
      if (uniqueFiles.length > 5) {
        console.log(`      ... e mais ${uniqueFiles.length - 5} arquivo(s)`);
      }
    }
  });
  
  // Resumo de otimização
  console.log('\n' + '='.repeat(70));
  console.log('🎯 RESUMO DE OTIMIZAÇÃO:');
  console.log('-'.repeat(70));
  
  const criticalCount = Object.values(criticalLibs).filter(lib => lib.critical).length;
  const nonCriticalCount = Object.values(criticalLibs).filter(lib => !lib.critical).length;
  const highImpactLibs = Object.values(criticalLibs).filter(lib => lib.usage.length < 10);
  
  console.log(`📊 Total libraries analisadas: ${Object.keys(criticalLibs).length}`);
  console.log(`🔴 Libraries críticas: ${criticalCount}`);
  console.log(`🟡 Libraries não-críticas: ${nonCriticalCount}`);
  console.log(`🎯 Libraries com baixo uso (< 10 arquivos): ${highImpactLibs.length}`);
  
  console.log('\n💰 IMPACTO FINANCEIRO:');
  const potentialSavings = 4.38 * 0.4; // 40% de redução estimada
  console.log(`📦 Bundle atual: 4.38 MB`);
  console.log(`🎯 Bundle otimizado: ${(4.38 - potentialSavings).toFixed(2)} MB`);
  console.log(`💾 Redução estimada: ${potentialSavings.toFixed(2)} MB (40%)`);
  console.log(`💰 Economia de bandwidth: ~${(potentialSavings * 1000).toFixed(0)} KB por carregamento`);
}

analyzeDependencies();