# Guia de Testes E2E

Este guia descreve como escrever, executar e manter testes end-to-end (E2E) no projeto.

## Visão Geral

Os testes E2E são executados com **Playwright** e garantem que os fluxos críticos da aplicação funcionem corretamente.

## Estrutura de Testes

```
e2e/
├── auth.spec.ts        # Testes de autenticação
├── vistoria.spec.ts    # Testes de vistoria
└── documents.spec.ts   # Testes de geração de documentos
```

## Executando Testes

### Desenvolvimento

```bash
# Executar todos os testes em modo headless
npm run test:e2e

# Executar testes com interface gráfica
npm run test:e2e:ui

# Executar testes em modo headed (ver navegador)
npm run test:e2e:headed
```

### Debug

```bash
# Executar um teste específico
npx playwright test e2e/auth.spec.ts

# Executar em modo debug
npx playwright test --debug

# Executar com DevTools
npx playwright test --ui
```

## Escrevendo Testes

### Estrutura Básica

```typescript
import { test, expect } from '@playwright/test';

test.describe('Nome do Módulo', () => {
  test.beforeEach(async ({ page }) => {
    // Setup antes de cada teste
  });

  test('deve fazer algo', async ({ page }) => {
    // Arrange
    await page.goto('/caminho');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('.resultado')).toBeVisible();
  });
});
```

### Best Practices

1. **Isolar testes**: Cada teste deve ser independente
2. **Limpar estado**: Usar `beforeEach` para garantir estado limpo
3. **Aguardar carregamento**: Sempre usar `waitForLoadState` após navegação
4. **Seletor robusto**: Preferir seletores semanticos (role, text)
5. **Evitar timeouts fixos**: Usar `waitFor*` em vez de `setTimeout`

### Exemplos Comuns

#### Login

```typescript
test('deve fazer login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await expect(page).toHaveURL('/');
});
```

#### Formulários

```typescript
test('deve preencher formulário', async ({ page }) => {
  await page.goto('/formulario');
  await page.fill('input[name="nome"]', 'João Silva');
  await page.fill('input[name="email"]', 'joao@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('.sucesso')).toBeVisible();
});
```

#### Upload de Arquivos

```typescript
test('deve fazer upload de arquivo', async ({ page }) => {
  await page.goto('/upload');
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('path/to/file.jpg');
  await page.click('button:has-text("Enviar")');
  await expect(page.locator('.upload-success')).toBeVisible();
});
```

## Debugging

### Screenshots

```typescript
test('debug', async ({ page }) => {
  await page.goto('/pagina');
  await page.screenshot({ path: 'debug.png' });
});
```

### Vídeos

Os vídeos são automaticamente gravados para testes que falham. Podem ser encontrados em `test-results/`.

### Logs

```typescript
// Logs do console do navegador
page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

// Logs de requisições
page.on('request', request => console.log('REQUEST:', request.url()));
```

## CI/CD

Os testes E2E são executados automaticamente em cada PR através do workflow `.github/workflows/e2e.yml`.

### Executar Localmente (Modo CI)

```bash
# Instalar dependências do Playwright
npx playwright install --with-deps

# Executar testes
npm run test:e2e
```

## Troubleshooting

### Erro: "Element not found"

- Verificar se o elemento está visível
- Adicionar `await page.waitForSelector()` se necessário
- Verificar se o caminho está correto

### Erro: "Timeout"

- Verificar se a ação está realmente acontecendo
- Aumentar timeout se necessário: `{ timeout: 30000 }`
- Verificar se há loading spinner ou animações

### Testes Lentos

- Reduzir `waitForTimeout` quando possível
- Usar `waitForURL` em vez de `waitForTimeout`
- Evitar múltiplas navegações desnecessárias

## Cobertura

Atualmente temos:
- ✅ Testes de autenticação (5 testes)
- ✅ Testes de vistoria (8 testes)
- ✅ Testes de documentos (4 testes)
- **Total: 17 testes E2E**

## Manutenção

### Atualizar Seletores

Se a UI mudar, atualize os seletores nos testes correspondentes.

### Adicionar Novos Testes

1. Identifique o fluxo crítico a ser testado
2. Crie ou edite o arquivo `.spec.ts` apropriado
3. Siga a estrutura básica mostrada acima
4. Execute localmente para validar
5. Commit e push para CI

### Remover Testes Obsoletos

Se uma funcionalidade for removida, remova também os testes relacionados.

## Recursos

- [Documentação Playwright](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
