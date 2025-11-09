/**
 * Script de Teste e Validação de Content Security Policy (CSP)
 * Automatiza testes de violações e validação de configuração
 */

import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

interface CSPTestResult {
  test: string;
  passed: boolean;
  blocked: boolean;
  message: string;
  violation?: {
    directive: string;
    blockedURI: string;
    documentURI: string;
  };
}

interface ValidationResult {
  cspHeader: string;
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  testResults: CSPTestResult[];
}

// Testes automatizados de CSP
const cspTests = [
  {
    name: 'Script inline blocking',
    description: 'Testa se scripts inline são bloqueados',
    test: async (page: any) => {
      try {
        await page.evaluate(() => {
          const script = document.createElement('script');
          script.innerHTML = 'window.cspTestInline = "executed";';
          document.head.appendChild(script);
        });
        return { passed: false, blocked: false, message: 'Script inline não foi bloqueado' };
      } catch (error) {
        return { passed: true, blocked: true, message: 'Script inline foi bloqueado corretamente' };
      }
    }
  },
  {
    name: 'External script blocking',
    description: 'Testa se scripts externos não confiáveis são bloqueados',
    test: async (page: any) => {
      try {
        await page.evaluate(() => {
          const script = document.createElement('script');
          script.src = 'https://evil.com/malicious.js';
          document.head.appendChild(script);
        });
        return { passed: false, blocked: false, message: 'Script externo não foi bloqueado' };
      } catch (error) {
        return { passed: true, blocked: true, message: 'Script externo foi bloqueado corretamente' };
      }
    }
  },
  {
    name: 'Iframe blocking',
    description: 'Testa se iframes são bloqueados',
    test: async (page: any) => {
      try {
        await page.evaluate(() => {
          const iframe = document.createElement('iframe');
          iframe.src = 'https://evil.com';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        });
        return { passed: false, blocked: false, message: 'Iframe não foi bloqueado' };
      } catch (error) {
        return { passed: true, blocked: true, message: 'Iframe foi bloqueado corretamente' };
      }
    }
  },
  {
    name: 'Object/embed blocking',
    description: 'Testa se objects e embeds são bloqueados',
    test: async (page: any) => {
      try {
        await page.evaluate(() => {
          const object = document.createElement('object');
          object.data = 'malicious.swf';
          object.style.display = 'none';
          document.body.appendChild(object);
        });
        return { passed: false, blocked: false, message: 'Object não foi bloqueado' };
      } catch (error) {
        return { passed: true, blocked: true, message: 'Object foi bloqueado corretamente' };
      }
    }
  },
  {
    name: 'Data URI allowance',
    description: 'Testa se data URIs são permitidos quando configurados',
    test: async (page: any) => {
      try {
        await page.evaluate(() => {
          const img = document.createElement('img');
          img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text>Test</text></svg>';
          document.body.appendChild(img);
        });
        return { passed: true, blocked: false, message: 'Data URI foi permitido (esperado)' };
      } catch (error) {
        return { passed: false, blocked: true, message: 'Data URI foi bloqueado (pode não ser configurado)' };
      }
    }
  }
];

// Validação de configuração CSP
function validateCSPConfig(cspHeader: string): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const cspLower = cspHeader.toLowerCase();

  // Verificações de segurança críticas
  if (cspLower.includes("'unsafe-inline'") && cspLower.includes("script-src")) {
    warnings.push("❌ CRÍTICO: 'unsafe-inline' em script-src permite XSS");
    recommendations.push("Use nonces ou hashes para scripts inline");
  }

  if (cspLower.includes("'unsafe-eval'")) {
    warnings.push("❌ ALTO: 'unsafe-eval' permite execução dinâmica de código");
    recommendations.push("Evite eval(), new Function() e similares");
  }

  if (!cspLower.includes("object-src 'none'")) {
    warnings.push("⚠️ MÉDIO: Recomenda-se object-src 'none'");
    recommendations.push("Bloqueie objetos flash e PDF para prevenir ataques legacy");
  }

  if (!cspLower.includes("frame-ancestors")) {
    warnings.push("⚠️ MÉDIO: Recomenda-se frame-ancestors para prevenção de clickjacking");
    recommendations.push("Defina frame-ancestors 'self' ou lista específica de domínios");
  }

  if (cspLower.includes("*")) {
    warnings.push("⚠️ BAIXO: Uso de * (curinga) pode ser muito permissivo");
    recommendations.push("Use domínios específicos ao invés de *");
  }

  // Verificações de configuração adequada
  if (!cspLower.includes("default-src")) {
    warnings.push("❌ CRÍTICO: Falta default-src directive");
    recommendations.push("Sempre defina default-src como fallback");
  }

  if (!cspLower.includes("connect-src")) {
    warnings.push("⚠️ MÉDIO: Falta connect-src directive");
    recommendations.push("Defina connect-src para controlar requisições AJAX/WebSocket");
  }

  return {
    isValid: warnings.filter(w => w.startsWith('❌')).length === 0,
    warnings,
    recommendations
  };
}

// Executar testes automatizados
async function runCSPAutomaticTests(url: string = 'http://localhost:3000'): Promise<CSPTestResult[]> {
  console.log('🧪 Executando testes automatizados de CSP...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results: CSPTestResult[] = [];
  
  try {
    // Navegar para a página
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Coleta de violações CSP
    const violations: any[] = [];
    page.on('securitypolicyviolation', (violation) => {
      violations.push(violation);
    });

    // Executar cada teste
    for (const test of cspTests) {
      console.log(`  🔍 Testando: ${test.name}`);
      
      try {
        const result = await test.test(page);
        const testResult: CSPTestResult = {
          test: test.name,
          ...result,
          violation: violations[violations.length - 1] ? {
            directive: violations[violations.length - 1].violatedDirective,
            blockedURI: violations[violations.length - 1].blockedURI,
            documentURI: violations[violations.length - 1].documentURI
          } : undefined
        };
        
        results.push(testResult);
        console.log(`    ${result.passed ? '✅' : '❌'} ${result.message}`);
      } catch (error) {
        results.push({
          test: test.name,
          passed: false,
          blocked: false,
          message: `Erro no teste: ${error}`
        });
        console.log(`    ❌ Erro: ${error}`);
      }
    }

  } catch (error) {
    console.error('Erro durante os testes:', error);
  } finally {
    await browser.close();
  }

  return results;
}

// Obter configuração CSP ativa
async function getActiveCSPConfig(url: string = 'http://localhost:3000'): Promise<string | null> {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Tentar obter CSP de múltiplas fontes
    const cspMeta = await page.$eval('meta[http-equiv="Content-Security-Policy"]', 
      (el: any) => el.getAttribute('content'));
    
    if (cspMeta) {
      await browser.close();
      return cspMeta;
    }
    
    // Verificar headers de resposta
    const response = await page.goto(url);
    const cspHeader = response?.headers()['content-security-policy'];
    
    await browser.close();
    return cspHeader || null;
  } catch (error) {
    console.error('Erro ao obter configuração CSP:', error);
    return null;
  }
}

// Gerar relatório completo
async function generateCSPReport(url: string = 'http://localhost:3000'): Promise<ValidationResult> {
  console.log('📊 Gerando relatório completo de CSP...');
  
  const cspConfig = await getActiveCSPConfig(url);
  const validation = cspConfig ? validateCSPConfig(cspConfig) : {
    isValid: false,
    warnings: ['Não foi possível obter configuração CSP'],
    recommendations: ['Verifique se o CSP está sendo aplicado corretamente']
  };
  const testResults = await runCSPAutomaticTests(url);
  
  const report: ValidationResult = {
    cspHeader: cspConfig || 'N/A',
    ...validation,
    testResults
  };

  return report;
}

// Salvar relatório
function saveReport(report: ValidationResult, filename: string = 'csp-report.json') {
  const reportPath = path.join(process.cwd(), filename);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Relatório salvo em: ${reportPath}`);
}

// Função principal
async function main() {
  const url = process.argv[2] || 'http://localhost:3000';
  const outputFile = process.argv[3] || 'csp-validation-report.json';
  
  console.log(`🎯 Testando CSP em: ${url}`);
  console.log('=' .repeat(50));
  
  try {
    const report = await generateCSPReport(url);
    
    // Exibir resumo
    console.log('\n📋 RESUMO DO RELATÓRIO:');
    console.log('=' .repeat(30));
    console.log(`Status: ${report.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    console.log(`Avisos: ${report.warnings.length}`);
    console.log(`Testes: ${report.testResults.filter(t => t.passed).length}/${report.testResults.length} passaram`);
    
    // Exibir avisos
    if (report.warnings.length > 0) {
      console.log('\n⚠️  AVISOS:');
      report.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    // Exibir recomendações
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      report.recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    // Exibir resultados dos testes
    console.log('\n🧪 RESULTADOS DOS TESTES:');
    report.testResults.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`  ${status} ${test.test}: ${test.message}`);
    });
    
    // Salvar relatório
    saveReport(report, outputFile);
    
    // Código de saída baseado no resultado
    process.exit(report.isValid ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export {
  runCSPAutomaticTests,
  getActiveCSPConfig,
  validateCSPConfig,
  generateCSPReport,
  cspTests
};