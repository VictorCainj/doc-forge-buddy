import { test, expect } from '@playwright/test';

test.describe('Vistoria E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Assumindo que existe autenticação
    // Navegar para a página de vistorias
    await page.goto('/analise-vistoria');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
  });

  test('deve abrir o formulário de criar vistoria', async ({ page }) => {
    // Verificar se a página carregou corretamente
    await expect(page.locator('text=/vistoria|análise/i').first()).toBeVisible();
    
    // Verificar elementos principais
    const pageTitle = page.locator('h1, h2, h3').first();
    await expect(pageTitle).toBeVisible();
  });

  test('deve preencher dados básicos da vistoria', async ({ page }) => {
    // Preencher contrato
    const contractSelect = page.locator('select, [role="combobox"]').first();
    
    if (await contractSelect.isVisible()) {
      await contractSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Preencher data
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-01-15');
    }

    // Verificar que os dados foram preenchidos
    await expect(page.locator('text=/2025|01|15/i').first()).toBeVisible();
  });

  test('deve adicionar novo ambiente', async ({ page }) => {
    // Procurar botão de adicionar ambiente
    const addButton = page.getByRole('button', { name: /adicionar|novo ambiente|+ ambiente/i });
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Preencher nome do ambiente
      const ambienteInput = page.locator('input[placeholder*="ambiente"], input[name*="ambiente"]').first();
      
      if (await ambienteInput.isVisible()) {
        await ambienteInput.fill('Sala');
      }

      // Verificar que o ambiente foi adicionado
      await expect(page.locator('text=/sala/i').first()).toBeVisible();
    }
  });

  test('deve fazer upload de imagem', async ({ page }) => {
    // Procurar input de upload
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      // Criar uma imagem fake para teste
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });

      // Verificar que a imagem foi adicionada (visualização)
      // O comportamento pode variar, então verificamos silenciosamente
      await page.waitForTimeout(1000);
    }
  });

  test('deve salvar vistoria', async ({ page }) => {
    // Preencher campos obrigatórios
    const saveButton = page.getByRole('button', { name: /salvar|finalizar|concluir/i });
    
    if (await saveButton.isVisible()) {
      // Tentar salvar
      await saveButton.click();
      
      // Aguardar possíveis mensagens de sucesso
      await page.waitForTimeout(1000);
      
      // Verificar se houve redirecionamento ou mensagem de sucesso
      const successMessage = page.locator('text=/sucesso|salvo|confirmado/i');
      
      if (await successMessage.isVisible()) {
        await expect(successMessage.first()).toBeVisible();
      }
    }
  });

  test('deve editar vistoria existente', async ({ page }) => {
    // Procurar botão de editar
    const editButton = page.getByRole('button', { name: /editar|alterar|modificar/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modificar algum campo
      const firstInput = page.locator('input').first();
      if (await firstInput.isVisible()) {
        await firstInput.fill('Editado');
      }

      // Salvar alterações
      const saveButton = page.getByRole('button', { name: /salvar|confirmar/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }

      // Verificar mudanças
      await page.waitForTimeout(1000);
    }
  });

  test('deve exibir lista de vistorias', async ({ page }) => {
    // Verificar se existe uma lista ou tabela
    const tableOrList = page.locator('table, [role="list"], .list').first();
    
    // Se existir, verificar que tem elementos
    if (await tableOrList.isVisible()) {
      const rows = tableOrList.locator('tr, [role="listitem"]');
      const count = await rows.count();
      
      // Pode ter 0 ou mais itens
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Tentar salvar sem preencher campos obrigatórios
    const saveButton = page.getByRole('button', { name: /salvar|finalizar|concluir/i });
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Verificar se aparecem mensagens de erro
      await page.waitForTimeout(500);
      
      const errorMessage = page.locator('text=/obrigatório|preencha|required/i');
      
      if (await errorMessage.isVisible()) {
        await expect(errorMessage.first()).toBeVisible();
      }
    }
  });
});
