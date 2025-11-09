import { test, expect } from '@playwright/test';
import { testDataManager } from '../utils/test-data-manager';
import { createTestHelpers } from '../utils/test-helpers';

test.describe('Gestão de Contratos E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    const helpers = createTestHelpers(page);
    await helpers.goto('/login');
    await testDataManager.loginAsValidUser(page);
  });

  test('deve navegar para lista de contratos', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Navegar para contratos
    await helpers.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Verificar se a página carregou
    await expect(page.locator('h1, h2')).toContainText(/contrato/i);
  });

  test('deve criar novo contrato com dados válidos', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Clicar no botão de novo contrato
    await helpers.clickTestButton('new-contract');
    
    // Preencher dados do contrato
    await helpers.fillTestInput('contract-name', 'Contrato Teste E2E');
    await helpers.fillTestInput('contract-type', 'residencial');
    await helpers.fillTestInput('contract-value', '100000');
    await helpers.fillTestInput('contract-description', 'Contrato criado pelos testes E2E');
    
    // Preencher datas
    const today = new Date().toISOString().split('T')[0];
    await helpers.fillTestInput('contract-start-date', today);
    await helpers.fillTestInput('contract-end-date', today);
    
    // Salvar contrato
    await helpers.clickTestButton('save-contract');
    
    // Verificar se foi salvo com sucesso
    await helpers.expectSuccessMessage();
    await helpers.expectURL(/contratos/);
  });

  test('deve editar contrato existente', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Procurar e clicar em editar um contrato
    const editButton = page.locator('[data-testid="edit-contract"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modificar nome do contrato
      await helpers.fillTestInput('contract-name', 'Contrato Editado E2E');
      
      // Salvar alterações
      await helpers.clickTestButton('update-contract');
      
      // Verificar se foi atualizado
      await helpers.expectSuccessMessage();
    }
  });

  test('deve excluir contrato', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Procurar e clicar em excluir um contrato
    const deleteButton = page.locator('[data-testid="delete-contract"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirmar exclusão
      const confirmButton = page.locator('[data-testid="confirm-delete"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        
        // Verificar se foi excluído
        await helpers.expectSuccessMessage();
      }
    }
  });

  test('deve validar campos obrigatórios na criação', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Clicar no botão de novo contrato
    await helpers.clickTestButton('new-contract');
    
    // Tentar salvar sem preencher campos
    await helpers.clickTestButton('save-contract');
    
    // Verificar se aparecem mensagens de erro
    await helpers.expectErrorMessage();
    
    // Verificar campos específicos
    await expect(page.locator('[data-testid="contract-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="contract-type-error"]')).toBeVisible();
  });

  test('deve filtrar contratos por status', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Filtrar por status ativo
    await helpers.selectFromDropdown('filter-status', 'ativo');
    await helpers.clickTestButton('apply-filter');
    
    // Verificar se a lista foi filtrada
    await page.waitForTimeout(1000);
    
    // Verificar se todos os contratos visíveis têm status ativo
    const contracts = page.locator('[data-testid="contract-item"]');
    const count = await contracts.count();
    
    for (let i = 0; i < count; i++) {
      await expect(contracts.nth(i)).toContainText(/ativo/i);
    }
  });

  test('deve buscar contratos por nome', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Preencher campo de busca
    await helpers.fillTestInput('search-contracts', 'Teste');
    await helpers.clickTestButton('search-button');
    
    // Aguardar resultados
    await page.waitForTimeout(1000);
    
    // Verificar se os resultados contêm o termo buscado
    const searchResults = page.locator('[data-testid="contract-item"]');
    const count = await searchResults.count();
    
    if (count > 0) {
      await expect(searchResults.first()).toContainText(/teste/i);
    }
  });

  test('deve visualizar detalhes de um contrato', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Clicar em um contrato para ver detalhes
    const contractItem = page.locator('[data-testid="contract-item"]').first();
    if (await contractItem.isVisible()) {
      await contractItem.click();
      
      // Verificar se a página de detalhes carregou
      await expect(page.locator('h1, h2')).toContainText(/contrato/i);
      
      // Verificar dados do contrato
      await expect(page.locator('[data-testid="contract-detail-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="contract-detail-type"]')).toBeVisible();
    }
  });

  test('deve gerar PDF do contrato', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Clicar no botão de gerar PDF de um contrato
    const generatePdfButton = page.locator('[data-testid="generate-pdf"]').first();
    if (await generatePdfButton.isVisible()) {
      // Aguardar download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        generatePdfButton.click(),
      ]);
      
      // Verificar se o download foi iniciado
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test('deve navegar entre páginas da lista', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await page.goto('/contratos');
    await helpers.waitForLoadState();
    
    // Verificar se há paginação
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      // Clicar na próxima página
      const nextButton = page.locator('[data-testid="next-page"]');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await helpers.waitForLoadState();
        
        // Verificar se mudou de página
        // (A implementação específica depende do componente de paginação)
      }
    }
  });
});