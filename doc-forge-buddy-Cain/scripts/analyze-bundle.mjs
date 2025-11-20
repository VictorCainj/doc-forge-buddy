import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Analisar bundle atual
function analyzeBundle() {
  const distPath = './dist/assets';
  
  console.log('🔍 Análise Detalhada do Bundle\n');
  console.log('='.repeat(60));
  
  try {
    const files = readdirSync(distPath)
      .filter(file => file.endsWith('.js') || file.endsWith('.css'))
      .map(file => {
        const filePath = join(distPath, file);
        const stats = statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(1),
          type: file.endsWith('.js') ? 'JS' : 'CSS'
        };
      })
      .sort((a, b) => b.size - a.size);
    
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    
    console.log('📊 Top 20 Maiores Arquivos:');
    console.log('-'.repeat(60));
    files.slice(0, 20).forEach((file, index) => {
      totalSize += file.size;
      if (file.type === 'JS') jsSize += file.size;
      else cssSize += file.size;
      
      console.log(
        `${String(index + 1).padStart(2, ' ')}. ${file.name.padEnd(35)} ` +
        `${file.sizeKB.padStart(8)} KB ${file.type}`
      );
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 RESUMO DO BUNDLE:');
    console.log('-'.repeat(60));
    console.log(`📦 Tamanho total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🟨 JavaScript: ${(jsSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🟦 CSS: ${(cssSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Arquivos: ${files.length}`);
    
    // Análise por categorias
    console.log('\n🏷️  ANÁLISE POR CATEGORIAS:');
    console.log('-'.repeat(60));
    
    const categories = {
      'vendor': files.filter(f => f.name.includes('vendor-')),
      'pages': files.filter(f => f.name.match(/^[A-Z][a-zA-Z]+-[a-zA-Z0-9]+\.js$/)),
      'components': files.filter(f => f.name.includes('-') && !f.name.includes('vendor-')),
      'utils': files.filter(f => f.name.includes('use') || f.name.includes('helper')),
      'styles': files.filter(f => f.name.endsWith('.css'))
    };
    
    Object.entries(categories).forEach(([name, categoryFiles]) => {
      if (categoryFiles.length > 0) {
        const categorySize = categoryFiles.reduce((sum, f) => sum + f.size, 0);
        const percentage = (categorySize / totalSize * 100).toFixed(1);
        console.log(`${name.padEnd(12)}: ${categoryFiles.length} arquivos, ${(categorySize / 1024).toFixed(1)} KB (${percentage}%)`);
      }
    });
    
    // Oportunidades de otimização
    console.log('\n🎯 OPORTUNIDADES DE OTIMIZAÇÃO:');
    console.log('-'.repeat(60));
    
    const largeFiles = files.filter(f => f.size > 100 * 1024);
    console.log(`📋 ${largeFiles.length} arquivos > 100KB:`);
    largeFiles.forEach(file => {
      console.log(`   • ${file.name}: ${file.sizeKB} KB`);
    });
    
    const veryLargeFiles = files.filter(f => f.size > 500 * 1024);
    if (veryLargeFiles.length > 0) {
      console.log(`\n🚨 ${veryLargeFiles.length} arquivos > 500KB (CRÍTICO):`);
      veryLargeFiles.forEach(file => {
        console.log(`   • ${file.name}: ${file.sizeKB} KB`);
        console.log(`     💡 Sugestão: Implementar lazy loading`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao analisar bundle:', error.message);
  }
}

analyzeBundle();