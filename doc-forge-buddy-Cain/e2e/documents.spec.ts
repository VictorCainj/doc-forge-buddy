import { test, expect } from '@playwright/test';
import { testDataManager } from '../utils/test-data-manager';
import { createTestHelpers } from '../utils/test-helpers';

test.describe('Documentos E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Login antes de cada teste
    await testDataManager.loginAsValidUser(page);
  });

  test('deve navegar para página de documentos', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();
    
    // Verificar se a página carregou
    await helpers.expectTestElementVisible('document-generator-title');
  });

  test('deve selecionar template de documento', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();

    // Selecionar template usando data-testid
    const templateSelect = page.locator('[data-testid="template-select"]');
    if (await templateSelect.isVisible()) {
      await templateSelect.click();
      
      // Selecionar primeira opção
      const firstOption = page.locator('[data-testid="template-option"]:first-child');
      if (await firstOption.isVisible()) {
        await firstOption.click();
        
        // Verificar se template foi selecionado
        await helpers.expectTestElementVisible('selected-template-name');
      }
    }
  });

  test('deve preencher dados do documento', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();

    // Preencher campos usando data-testids específicos
    await helpers.fillTestInput('document-title', 'Documento Teste E2E');
    await helpers.fillTestInput('document-content', 'Conteúdo de teste para validação E2E');
    await helpers.fillTestInput('document-author', 'Teste E2E');
    
    // Verificar se campos foram preenchidos
    const titleValue = await page.locator('[data-testid="document-title"]').inputValue();
    expect(titleValue).toBe('Documento Teste E2E');
  });

  test('deve gerar PDF do documento', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();

    // Preencher dados mínimos necessários
    await helpers.fillTestInput('document-title', 'PDF Teste E2E');
    
    // Clicar em gerar PDF
    const generateButton = page.locator('[data-testid="generate-pdf-button"]');
    if (await generateButton.isVisible()) {
      // Aguardar download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        generateButton.click(),
      ]);

      // Verificar se o PDF foi gerado
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test('deve fazer download do documento', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();

    // Preencher dados
    await helpers.fillTestInput('document-title', 'Download Teste E2E');

    // Clicar em download
    const downloadButton = page.locator('[data-testid="download-button"]');
    if (await downloadButton.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadButton.click(),
      ]);

      // Verificar que o download foi iniciado
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();

    // Tentar gerar sem preencher campos obrigatórios
    await helpers.clickTestButton('generate-pdf-button');

    // Verificar se aparecem erros de validação
    await expect(page.locator('[data-testid="document-title-error"]')).toBeVisible();
  });

  test('deve alterar template do documento', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();

    // Selecionar primeiro template
    await helpers.selectFromDropdown('template-select', 'contrato');
    
    // Verificar se template foi alterado
    await helpers.expectTestElementVisible('template-contrato-fields');
    
    // Selecionar segundo template
    await helpers.selectFromDropdown('template-select', 'laudo');
    
    // Verificar se campos mudaram
    await helpers.expectTestElementVisible('template-laudo-fields');
  });

  test('deve preview do documento', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();

    // Preencher dados básicos
    await helpers.fillTestInput('document-title', 'Preview Teste E2E');
    
    // Clicar em preview
    const previewButton = page.locator('[data-testid="preview-button"]');
    if (await previewButton.isVisible()) {
      await previewButton.click();
      
      // Verificar se modal de preview abriu
      await helpers.expectTestElementVisible('document-preview-modal');
      await helpers.expectTestElementVisible('preview-content');
    }
  });

  test('deve salvar rascunho do documento', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/gerar-documento');
    await helpers.waitForLoadState();

    // Preencher dados
    await helpers.fillTestInput('document-title', 'Rascunho Teste E2E');
    await helpers.fillTestInput('document-content', 'Conteúdo do rascunho');
    
    // Salvar como rascunho
    const saveDraftButton = page.locator('[data-testid="save-draft-button"]');
    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click();
      
      // Verificar sucesso
      await helpers.expectSuccessMessage();
    }
  });

  test('deve listar documentos salvos', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/documentos');
    await helpers.waitForLoadState();
    
    // Verificar se a lista carregou
    await helpers.expectTestElementVisible('documents-list');
    
    // Verificar se há documentos ou mensagem de lista vazia
    const documentsItems = page.locator('[data-testid="document-item"]');
    const count = await documentsItems.count();
    
    if (count > 0) {
      // Verificar primeiro item
      await expect(documentsItems.first()).toBeVisible();
    } else {
      // Verificar mensagem de lista vazia
      await helpers.expectTestElementVisible('empty-documents-message');
    }
  });
});
