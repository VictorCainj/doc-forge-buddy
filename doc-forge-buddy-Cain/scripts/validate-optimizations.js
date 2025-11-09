#!/usr/bin/env node

/**
 * Script de Validação Final das Otimizações Vite
 * Executa teste completo de todas as otimizações implementadas
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ViteOptimizationsValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }
  
  /**
   * Executa validação completa
   */
  async runFullValidation() {
    console.log('🚀 Validando Otimizações Vite para Produção\n');
    console.log('='.repeat(60));
    
    try {
      // 1. Verificar arquivos de configuração
      await this.validateConfigFiles();
      
      // 2. Verificar dependências
      await this.validateDependencies();
      
      // 3. Verificar scripts
      await this.validateScripts();
      
      // 4. Testar build
      await this.testBuild();
      
      // 5. Validar performance
      await this.validatePerformance();
      
      // 6. Verificar outputs
      await this.validateOutputs();
      
      // 7. Gerar relatório final
      this.generateFinalReport();
      
      // 8. Exibir resumo
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Erro durante validação:', error.message);
      process.exit(1);
    }
  }
  
  /**
   * Verifica arquivos de configuração
   */
  async validateConfigFiles() {
    console.log('\n📋 Validando arquivos de configuração...');
    
    const requiredFiles = [
      'vite.config.ts',
      'lighthouserc.js',
      'cssnano.config.js',
      '.github/workflows/performance.yml',
      'scripts/performance-monitor.js',
      'scripts/core-web-vitals.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      
      if (fs.existsSync(filePath)) {
        this.addCheck('config-file', `✅ ${file}`, 'passed');
        console.log(`  ✅ ${file}`);
      } else {
        this.addCheck('config-file', `❌ ${file} - Missing`, 'failed');
        console.log(`  ❌ ${file} - Missing`);
      }
    }
  }
  
  /**
   * Verifica dependências necessárias
   */
  async validateDependencies() {
    console.log('\n📦 Validando dependências...');
    
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
      );
      
      const requiredDeps = [
        '@lhci/cli',
        'rollup-plugin-visualizer',
        'vite-plugin-pwa',
        'terser',
        'cssnano'
      ];
      
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      for (const dep of requiredDeps) {
        if (deps[dep]) {
          this.addCheck('dependency', `✅ ${dep} - ${deps[dep]}`, 'passed');
          console.log(`  ✅ ${dep} - ${deps[dep]}`);
        } else {
          this.addCheck('dependency', `⚠️ ${dep} - Not installed`, 'warning');
          console.log(`  ⚠️ ${dep} - Not installed`);
        }
      }
      
    } catch (error) {
      this.addCheck('dependency', `❌ Error reading package.json: ${error.message}`, 'failed');
      console.log(`  ❌ Error reading package.json: ${error.message}`);
    }
  }
  
  /**
   * Verifica scripts disponíveis
   */
  async validateScripts() {
    console.log('\n🔧 Validando scripts...');
    
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
      );
      
      const requiredScripts = [
        'build:production',
        'build:analyze',
        'test:performance',
        'test:lighthouse',
        'report:performance'
      ];
      
      const scripts = packageJson.scripts || {};
      
      for (const script of requiredScripts) {
        if (scripts[script]) {
          this.addCheck('script', `✅ ${script} - ${scripts[script]}`, 'passed');
          console.log(`  ✅ ${script} - ${scripts[script]}`);
        } else {
          this.addCheck('script', `❌ ${script} - Missing`, 'failed');
          console.log(`  ❌ ${script} - Missing`);
        }
      }
      
    } catch (error) {
      this.addCheck('script', `❌ Error reading package.json: ${error.message}`, 'failed');
      console.log(`  ❌ Error reading package.json: ${error.message}`);
    }
  }
  
  /**
   * Testa build de produção
   */
  async testBuild() {
    console.log('\n🏗️ Testando build de produção...');
    
    try {
      // Verificar se dist existe, limpar se necessário
      const distPath = path.join(__dirname, '..', 'dist');
      if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
      }
      
      // Executar build
      console.log('  📦 Executando npm run build:production...');
      const { stdout, stderr } = await execAsync('npm run build:production', {
        timeout: 120000 // 2 minutos timeout
      });
      
      if (fs.existsSync(distPath)) {
        this.addCheck('build', '✅ Build de produção executado com sucesso', 'passed');
        console.log('  ✅ Build de produção executado com sucesso');
        
        // Verificar estrutura do dist
        const assetsPath = path.join(distPath, 'assets');
        if (fs.existsSync(assetsPath)) {
          const files = fs.readdirSync(assetsPath);
          const jsFiles = files.filter(f => f.endsWith('.js'));
          const cssFiles = files.filter(f => f.endsWith('.css'));
          
          this.addCheck('build', `✅ Assets gerados: ${jsFiles.length} JS, ${cssFiles.length} CSS`, 'passed');
          console.log(`  ✅ Assets gerados: ${jsFiles.length} JS, ${cssFiles.length} CSS`);
          
          // Verificar chunk naming
          const hasHashedFiles = jsFiles.some(f => f.includes('-'));
          if (hasHashedFiles) {
            this.addCheck('build', '✅ Chunks com hash nomes detectados', 'passed');
            console.log('  ✅ Chunks com hash nomes detectados');
          }
        }
        
      } else {
        throw new Error('Diretório dist não foi criado');
      }
      
    } catch (error) {
      this.addCheck('build', `❌ Build falhou: ${error.message}`, 'failed');
      console.log(`  ❌ Build falhou: ${error.message}`);
    }
  }
  
  /**
   * Valida performance
   */
  async validatePerformance() {
    console.log('\n📊 Validando performance...');
    
    try {
      // Testar performance monitor
      console.log('  🔍 Executando performance monitor...');
      await execAsync('node scripts/performance-monitor.js', {
        timeout: 60000 // 1 minuto timeout
      });
      
      this.addCheck('performance', '✅ Performance monitor executado', 'passed');
      console.log('  ✅ Performance monitor executado');
      
      // Verificar se relatório foi gerado
      const reportPath = path.join(__dirname, '..', 'dist', 'performance-report.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        if (report.violations && report.violations.length === 0) {
          this.addCheck('performance', '✅ Performance budgets atendidos', 'passed');
          console.log('  ✅ Performance budgets atendidos');
        } else {
          this.addCheck('performance', `⚠️ ${report.violations?.length || 0} violations encontradas`, 'warning');
          console.log(`  ⚠️ ${report.violations?.length || 0} violations encontradas`);
        }
        
      } else {
        this.addCheck('performance', '❌ Relatório de performance não encontrado', 'failed');
        console.log('  ❌ Relatório de performance não encontrado');
      }
      
    } catch (error) {
      this.addCheck('performance', `⚠️ Performance monitor falhou: ${error.message}`, 'warning');
      console.log(`  ⚠️ Performance monitor falhou: ${error.message}`);
    }
  }
  
  /**
   * Verifica outputs gerados
   */
  async validateOutputs() {
    console.log('\n📄 Validando outputs...');
    
    const distPath = path.join(__dirname, '..', 'dist');
    
    if (!fs.existsSync(distPath)) {
      this.addCheck('outputs', '❌ Diretório dist não encontrado', 'failed');
      console.log('  ❌ Diretório dist não encontrado');
      return;
    }
    
    const expectedOutputs = [
      { name: 'index.html', path: path.join(distPath, 'index.html') },
      { name: 'PWA Manifest', path: path.join(distPath, 'manifest.webmanifest') },
      { name: 'Performance Report JSON', path: path.join(distPath, 'performance-report.json') },
      { name: 'Performance Report MD', path: path.join(distPath, 'performance-report.md') },
      { name: 'Bundle Analysis HTML', path: path.join(distPath, 'bundle-analysis.html') }
    ];
    
    for (const output of expectedOutputs) {
      if (fs.existsSync(output.path)) {
        const stats = fs.statSync(output.path);
        this.addCheck('output', `✅ ${output.name} (${this.formatSize(stats.size)})`, 'passed');
        console.log(`  ✅ ${output.name} (${this.formatSize(stats.size)})`);
      } else {
        this.addCheck('output', `⚠️ ${output.name} - Not found`, 'warning');
        console.log(`  ⚠️ ${output.name} - Not found`);
      }
    }
    
    // Verificar estrutura de assets
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const assets = fs.readdirSync(assetsPath);
      const hasImages = fs.existsSync(path.join(assetsPath, 'images'));
      const hasFonts = fs.existsSync(path.join(assetsPath, 'fonts'));
      
      if (hasImages) {
        this.addCheck('output', '✅ Diretório images encontrado', 'passed');
        console.log('  ✅ Diretório images encontrado');
      }
      
      if (hasFonts) {
        this.addCheck('output', '✅ Diretório fonts encontrado', 'passed');
        console.log('  ✅ Diretório fonts encontrado');
      }
    }
  }
  
  /**
   * Adiciona um check ao resultado
   */
  addCheck(category, message, status) {
    this.results.checks.push({
      category,
      message,
      status,
      timestamp: new Date().toISOString()
    });
    
    this.results.summary.total++;
    this.results.summary[status]++;
  }
  
  /**
   * Gera relatório final
   */
  generateFinalReport() {
    const reportPath = path.join(__dirname, '..', 'dist', 'optimization-validation.json');
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📊 Relatório salvo em: ${reportPath}`);
  }
  
  /**
   * Exibe resumo final
   */
  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMO DA VALIDAÇÃO');
    console.log('='.repeat(60));
    
    const { total, passed, failed, warnings } = this.results.summary;
    
    console.log(`\n📊 Total de Checks: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    
    // Status geral
    if (failed === 0) {
      console.log('\n🎉 Status Geral: SUCESSO');
      console.log('✅ Todas as otimizações Vite foram validadas com sucesso!');
      console.log('\n🚀 O projeto está pronto para produção com performance otimizada.');
    } else {
      console.log('\n⚠️ Status Geral: ATENÇÃO NECESSÁRIA');
      console.log(`❌ ${failed} falhas encontradas. Corrija os problemas antes de prosseguir.`);
    }
    
    // Próximos passos
    console.log('\n📝 Próximos Passos:');
    if (failed === 0) {
      console.log('  1. ✅ Deploy em produção');
      console.log('  2. 📊 Monitorar performance em produção');
      console.log('  3. 🔄 Configurar CI/CD para validação contínua');
      console.log('  4. 📱 Testar Core Web Vitals em dispositivos reais');
    } else {
      console.log('  1. 🔧 Corrigir falhas identificadas');
      console.log('  2. 🔄 Re-executar validação');
      console.log('  3. 📋 Revisar PERFORMANCE_OPTIMIZATIONS.md');
    }
    
    console.log('\n📚 Documentação: PERFORMANCE_OPTIMIZATIONS.md');
    console.log('📊 Relatórios: dist/performance-report.*');
    console.log('🔍 Bundle Analysis: dist/bundle-analysis.html');
    
    // Fechar com código de saída apropriado
    process.exit(failed === 0 ? 0 : 1);
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
}

// Executar se chamado diretamente
if (require.main === module) {
  const validator = new ViteOptimizationsValidator();
  validator.runFullValidation().catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });
}

module.exports = ViteOptimizationsValidator;