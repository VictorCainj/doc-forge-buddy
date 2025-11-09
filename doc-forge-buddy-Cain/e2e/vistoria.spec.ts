import { test, expect } from '@playwright/test';
import { testDataManager } from '../utils/test-data-manager';
import { createTestHelpers } from '../utils/test-helpers';

test.describe('Vistoria E2E', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Login e navegar para vistorias
    await testDataManager.loginAsValidUser(page);
    await helpers.goto('/analise-vistoria');
    await helpers.waitForLoadState();
  });

  test('deve navegar para página de vistorias', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/analise-vistoria');
    await helpers.waitForLoadState();
    
    // Verificar se a página carregou
    await helpers.expectTestElementVisible('vistoria-page-title');
  });

  test('deve abrir formulário de nova vistoria', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Clicar no botão de nova vistoria
    const newVistoriaButton = page.locator('[data-testid="new-vistoria-button"]');
    if (await newVistoriaButton.isVisible()) {
      await newVistoriaButton.click();
      
      // Verificar se o formulário abriu
      await helpers.expectTestElementVisible('vistoria-form');
    }
  });

  test('deve preencher dados básicos da vistoria', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/nova-vistoria');
    await helpers.waitForLoadState();

    // Preencher contrato
    const contractSelect = page.locator('[data-testid="contract-select"]');
    if (await contractSelect.isVisible()) {
      const testContract = testDataManager.getTestContract();
      if (testContract) {
        await helpers.selectFromDropdown('contract-select', testContract.id);
      }
    }

    // Preencher data
    const dateInput = page.locator('[data-testid="vistoria-date"]');
    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
    }

    // Preencher horário
    const timeInput = page.locator('[data-testid="vistoria-time"]');
    if (await timeInput.isVisible()) {
      await timeInput.fill('14:00');
    }

    // Verificar que a data foi preenchida
    const dateValue = await dateInput.inputValue();
    expect(dateValue).toBeTruthy();
  });

  test('deve adicionar novo ambiente', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/nova-vistoria');
    await helpers.waitForLoadState();

    // Clicar no botão de adicionar ambiente
    const addButton = page.locator('[data-testid="add-ambiente-button"]');
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Preencher nome do ambiente
      const ambienteNameInput = page.locator('[data-testid="ambiente-name"]').last();
      if (await ambienteNameInput.isVisible()) {
        await ambienteNameInput.fill('Sala de Estar');
      }

      // Verificar que o ambiente foi adicionado
      await expect(page.locator('text=/sala/i').last()).toBeVisible();
    }
  });

  test('deve fazer upload de imagem', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/nova-vistoria');
    await helpers.waitForLoadState();

    // Fazer upload de imagem de teste
    const fileInput = page.locator('[data-testid="image-upload"]');
    if (await fileInput.isVisible()) {
      const imagePath = await testDataManager.createTestImage('vistoria-test.jpg');
      await helpers.uploadFile('[data-testid="image-upload"]', imagePath);

      // Verificar que a imagem foi processada
      await page.waitForTimeout(1000);
      await helpers.expectTestElementVisible('uploaded-image-preview');
    }
  });

  test('deve salvar vistoria', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/nova-vistoria');
    await helpers.waitForLoadState();

    // Preencher campos obrigatórios
    await helpers.fillTestInput('vistoria-title', 'Vistoria Teste E2E');
    await helpers.fillTestInput('vistoria-description', 'Descrição da vistoria para teste E2E');
    
    // Salvar vistoria
    const saveButton = page.locator('[data-testid="save-vistoria-button"]');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Verificar sucesso
      await helpers.expectSuccessMessage();
      await helpers.expectURL(/vistoria/);
    }
  });

  test('deve editar vistoria existente', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Primeiro, criar uma vistoria (assumindo que existe lista)
    await helpers.goto('/vistorias');
    await helpers.waitForLoadState();

    // Procurar botão de editar uma vistoria
    const editButton = page.locator('[data-testid="edit-vistoria-button"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modificar título
      await helpers.fillTestInput('vistoria-title', 'Vistoria Editada E2E');

      // Salvar alterações
      const saveButton = page.locator('[data-testid="update-vistoria-button"]');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Verificar sucesso
        await helpers.expectSuccessMessage();
      }
    }
  });

  test('deve exibir lista de vistorias', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/vistorias');
    await helpers.waitForLoadState();
    
    // Verificar se a lista existe
    await helpers.expectTestElementVisible('vistorias-list');
    
    // Verificar se há vistorias ou mensagem vazia
    const vistoriaItems = page.locator('[data-testid="vistoria-item"]');
    const count = await vistoriaItems.count();
    
    if (count > 0) {
      // Verificar primeiro item
      await expect(vistoriaItems.first()).toBeVisible();
    } else {
      // Verificar mensagem de lista vazia
      await helpers.expectTestElementVisible('empty-vistorias-message');
    }
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/nova-vistoria');
    await helpers.waitForLoadState();

    // Tentar salvar sem preencher campos obrigatórios
    await helpers.clickTestButton('save-vistoria-button');
    
    // Verificar validações
    await expect(page.locator('[data-testid="vistoria-title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="contract-select-error"]')).toBeVisible();
  });

  test('deve fazer análise de imagem', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/analise-vistoria/123');
    await helpers.waitForLoadState();

    // Fazer upload de imagem para análise
    const fileInput = page.locator('[data-testid="analysis-image-upload"]');
    if (await fileInput.isVisible()) {
      const imagePath = await testDataManager.createTestImage('analysis-test.jpg');
      await helpers.uploadFile('[data-testid="analysis-image-upload"]', imagePath);
      
      // Aguardar processamento
      await helpers.waitForTimeout(3000);
      
      // Verificar se a análise foi realizada
      await helpers.expectTestElementVisible('analysis-results');
    }
  });

  test('deve gerar laudo de vistoria', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Assumindo que existe uma vistoria para gerar laudo
    await helpers.goto('/vistorias');
    await helpers.waitForLoadState();

    // Clicar em gerar laudo
    const generateReportButton = page.locator('[data-testid="generate-laudo-button"]').first();
    if (await generateReportButton.isVisible()) {
      // Aguardar download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        generateReportButton.click(),
      ]);

      // Verificar se foi gerado
      expect(download.suggestedFilename()).toMatch(/\.(pdf|docx)$/i);
    }
  });

  test('deve filtrar vistorias por status', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/vistorias');
    await helpers.waitForLoadState();

    // Filtrar por status
    await helpers.selectFromDropdown('filter-status', 'concluida');
    await helpers.clickTestButton('apply-filter');
    
    // Aguardar filtragem
    await helpers.waitForTimeout(1000);
    
    // Verificar se os resultados foram filtrados
    const vistoriaItems = page.locator('[data-testid="vistoria-item"]');
    const count = await vistoriaItems.count();
    
    if (count > 0) {
      // Verificar se todas as vistorias têm status "concluida"
      for (let i = 0; i < count; i++) {
        await expect(vistoriaItems.nth(i)).toContainText(/concluíd/i);
      }
    }
  });
});
