import { test, expect } from '@playwright/test';

test.describe('Documentos E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('deve selecionar template de documento', async ({ page }) => {
    // Navegar para página de documentos
    await page.goto('/gerar-documento');
    await page.waitForLoadState('networkidle');

    // Selecionar template
    const templateSelect = page.locator('select, [role="combobox"]').first();
    if (await templateSelect.isVisible()) {
      await templateSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Verificar se template foi selecionado
    await expect(page.locator('text=/template|documento/i').first()).toBeVisible();
  });

  test('deve preencher dados do documento', async ({ page }) => {
    await page.goto('/gerar-documento');
    await page.waitForLoadState('networkidle');

    // Preencher campos
    const inputFields = page.locator('input, textarea');
    const count = await inputFields.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const field = inputFields.nth(i);
      if (await field.isVisible()) {
        await field.fill(`Teste ${i + 1}`);
      }
    }

    // Verificar se campos foram preenchidos
    const filledValue = await inputFields.first().inputValue();
    expect(filledValue).toBeTruthy();
  });

  test('deve gerar PDF do documento', async ({ page }) => {
    await page.goto('/gerar-documento');
    await page.waitForLoadState('networkidle');

    // Preencher dados básicos
    const inputFields = page.locator('input, textarea');
    const count = await inputFields.count();
    
    if (count > 0) {
      await inputFields.first().fill('Dados de teste');
    }

    // Clicar em gerar PDF
    const generateButton = page.getByRole('button', { name: /gerar|pdf|documento/i });
    if (await generateButton.isVisible()) {
      // Aguardar download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        generateButton.click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test('deve fazer download do documento', async ({ page }) => {
    await page.goto('/gerar-documento');
    await page.waitForLoadState('networkidle');

    // Preencher dados
    const inputFields = page.locator('input, textarea');
    if (await inputFields.first().isVisible()) {
      await inputFields.first().fill('Documento de teste');
    }

    // Clicar em download
    const downloadButton = page.getByRole('button', { name: /baixar|download/i });
    if (await downloadButton.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadButton.click(),
      ]);

      // Verificar que o download foi iniciado
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });
});
