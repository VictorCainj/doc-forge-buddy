# Trace Viewer e Debug de Testes E2E

## 🔍 Trace Viewer

O Playwright oferece um Trace Viewer poderoso para debug de testes falhos.

### Como Usar

1. **Abrir Trace Viewer:**
   ```bash
   npx playwright show-trace trace.zip
   # ou
   npx playwright show-trace test-results/trace.zip
   ```

2. **Traces automáticos em falhas:**
   - Configure `trace: 'retain-on-failure'` no `playwright.config.ts`
   - Os traces são salvos automaticamente em `test-results/`

3. **Traces manuais:**
   ```typescript
   await page.context().tracing.start({ screenshots: true, snapshots: true });
   await page.context().tracing.stop({ path: 'trace.zip' });
   ```

### Visualização do Trace

O Trace Viewer mostra:
- 📸 Screenshots de cada ação
- 🎯 Timeline de eventos
- 🔍 Console logs
- 🌐 Network requests
- ⌨️ Keyboard events
- 🖱️ Mouse events

## 🐛 Debug de Testes

### 1. Modo Debug
```bash
# Debug com pause em cada step
npx playwright test --debug

# Debug arquivo específico
npx playwright test auth.spec.ts --debug
```

### 2. Codegen (Gerador de Testes)
```bash
# Gerar código de teste interativamente
npx playwright codegen http://localhost:5173

# Gerar com browser específico
npx playwright codegen --target=javascript -o test.js http://localhost:5173
```

### 3. Screenshots Manuais
```typescript
test('teste com screenshot manual', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'screenshot.png' }); // Sempre
  await page.screenshot({ path: 'step1.png' }); // Em steps específicos
  
  // Screenshot de elemento específico
  const element = page.locator('[data-testid="login-button"]');
  await element.screenshot({ path: 'login-button.png' });
});
```

## 📊 Análise de Performance

### Medir Tempos
```typescript
test('medir performance', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/contratos');
  await page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - startTime;
  console.log(`⏱️ Tempo de carregamento: ${loadTime}ms`);
  
  // Assertion de performance
  expect(loadTime).toBeLessThan(3000); // Máximo 3s
});
```

### Network Monitoring
```typescript
test('monitor network', async ({ page }) => {
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push(request.url());
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      timing: response.timing()
    });
  });
  
  await page.goto('/contratos');
  
  // Verificar requests específicos
  expect(requests).toContain('/api/contratos');
  
  // Verificar status codes
  const failedRequests = responses.filter(r => r.status >= 400);
  expect(failedRequests).toHaveLength(0);
});
```

## 🎯 Test Data Management

### Fixtures Personalizadas
```typescript
// e2e/fixtures/test-fixtures.ts
import { test as base, Page, BrowserContext } from '@playwright/test';
import { testDataManager } from '../utils/test-data-manager';

type TestFixtures = {
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
};

export const test = base.extend<TestFixtures>({
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    
    // Setup user session
    const page = await context.newPage();
    await testDataManager.loginAsValidUser(page);
    
    // Store auth state
    await context.storageState({ path: 'test-data/auth-state.json' });
    await page.close();
    
    await use(context);
    await context.close();
  },
  
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(page);
    await page.close();
  },
});
```

## 🚨 Troubleshooting Avançado

### 1. Elemento Instável
```typescript
// Espera mais robusta
test('elemento instável', async ({ page }) => {
  // Em vez de apenas .isVisible()
  await page.waitForSelector('[data-testid="dynamic-element"]', { 
    state: 'visible',
    timeout: 10000 
  });
  
  // Aguardar estabilidade
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="loading"]')
  );
});
```

### 2.等待 Seletores Complexos
```typescript
// Aguardar múltiplos seletores
test('seletores complexos', async ({ page }) => {
  await Promise.race([
    page.waitForSelector('[data-testid="success"]'),
    page.waitForSelector('[data-testid="error"]'),
  ]);
});
```

### 3. Intercept de Network
```typescript
test('mock de API', async ({ page }) => {
  // Interceptar request
  await page.route('/api/contratos', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'Mock Contract' }])
    });
  });
  
  await page.goto('/contratos');
  // ... testes
});
```

## 📈 Relatórios Customizados

### HTML Report Customizado
```typescript
// playwright-report/index.html (customização)
<!DOCTYPE html>
<html>
<head>
    <title>Relatório E2E - Doc Forge Buddy</title>
    <style>
        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }
        .status-pass { color: #22c55e; }
        .status-fail { color: #ef4444; }
        .status-skip { color: #f59e0b; }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>🧪 Relatório E2E - Doc Forge Buddy</h1>
        <p>Testes automatizados de fluxos críticos</p>
    </div>
    <!-- Conteúdo do Playwright será injetado aqui -->
</body>
</html>
```

### JSON Report Processing
```javascript
// scripts/process-test-results.js
const fs = require('fs');
const path = require('path');

function processResults() {
  const resultsPath = 'test-results/results.json';
  if (!fs.existsSync(resultsPath)) {
    console.log('❌ Arquivo de resultados não encontrado');
    return;
  }
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  
  const summary = {
    total: results.suites?.[0]?.specs?.length || 0,
    passed: results.suites?.[0]?.specs?.filter(s => s.ok).length || 0,
    failed: results.suites?.[0]?.specs?.filter(s => !s.ok).length || 0,
    duration: results.suites?.[0]?.specs?.reduce((acc, s) => acc + (s.ok ? s.ok.duration : 0), 0)
  };
  
  console.log('📊 Resumo dos Testes E2E:');
  console.log(`   Total: ${summary.total}`);
  console.log(`   ✅ Passaram: ${summary.passed}`);
  console.log(`   ❌ Falharam: ${summary.failed}`);
  console.log(`   ⏱️ Duração: ${(summary.duration / 1000).toFixed(2)}s`);
  
  return summary;
}

module.exports = { processResults };
```

## 🔧 Configurações Avançadas

### Timeouts Customizados
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // Timeout global
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  projects: [
    {
      name: 'slow-tests',
      use: { 
        ...devices['Desktop Chrome'],
        // Ajustar speeds para testes lentos
        launchOptions: {
          slowMo: 100, // 100ms entre ações
        }
      },
    },
  ],
});
```

### Environment-Specific Tests
```typescript
// Executar testes apenas em ambiente específico
test.describe('Testes de Produção', () => {
  test.skip(process.env.NODE_ENV !== 'production', 'Apenas em produção');
  
  test('verificar domínio de produção', async ({ page }) => {
    await page.goto('https://app.producao.com');
    // ...
  });
});
```

Este guia cobre as principais técnicas para debug e análise de testes E2E com Playwright!