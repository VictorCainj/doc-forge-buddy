import { test, expect } from '@playwright/test';
import { testDataManager } from '../utils/test-data-manager';
import { createTestHelpers } from '../utils/test-helpers';

test.describe('Autenticação E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    const helpers = createTestHelpers(page);
    await helpers.goto('/');
  });

  test('deve fazer login com sucesso', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Navegar para login se necessário
    const loginButton = page.locator('[data-testid="login-button"]');
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Aguardar página de login
    await helpers.waitForURL(/login/);
    await helpers.waitForLoadState();

    // Preencher credenciais usando data-testids
    await helpers.fillTestInput('email-input', testDataManager.getValidUser().email);
    await helpers.fillTestInput('password-input', testDataManager.getValidUser().password);

    // Clicar no botão de login
    await helpers.clickTestButton('login-button');

    // Verificar redirecionamento
    await helpers.expectURL(/dashboard|home|\/$/);
    await helpers.expectSuccessMessage();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Navegar para login
    const loginButton = page.locator('[data-testid="login-button"]');
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    await helpers.waitForURL(/login/);
    await helpers.waitForLoadState();

    // Preencher credenciais inválidas
    await helpers.fillTestInput('email-input', testDataManager.getInvalidUser().email);
    await helpers.fillTestInput('password-input', testDataManager.getInvalidUser().password);

    // Clicar no botão de submit
    await helpers.clickTestButton('login-button');

    // Verificar mensagem de erro
    await helpers.expectErrorMessage();
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Login primeiro
    await testDataManager.loginAsValidUser(page);

    // Localizar e clicar no botão de logout
    const logoutButton = page.locator('[data-testid="logout-button"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Verificar redirecionamento para login
      await helpers.expectURL(/login|\/$/);
      await helpers.expectSuccessMessage();
    }
  });

  test('deve persistir sessão após recarregar página', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Login
    await testDataManager.loginAsValidUser(page);
    await helpers.expectURL(/dashboard|home/);

    // Recarregar página
    await page.reload();
    await helpers.waitForLoadState();

    // Verificar que ainda está autenticado
    await helpers.expectURL(/dashboard|home|\/$/);
  });

  test('deve processar recuperação de senha', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Navegar para login
    await helpers.goto('/login');
    await helpers.waitForLoadState();

    // Procurar link de recuperação de senha
    const forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Aguardar redirecionamento para página de recuperação
      await helpers.waitForURL(/recuperar|forgot-password/);

      // Preencher email para recuperação
      await helpers.fillTestInput('email-input', testDataManager.getValidUser().email);

      // Clicar no botão de enviar
      await helpers.clickTestButton('send-recovery-email');

      // Verificar mensagem de sucesso
      await helpers.expectSuccessMessage();
      await expect(page.locator('[data-testid="recovery-success-message"]')).toBeVisible();
    }
  });

  test('deve validar campos obrigatórios no login', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/login');
    await helpers.waitForLoadState();

    // Tentar fazer login sem preencher campos
    await helpers.clickTestButton('login-button');

    // Verificar validações
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('deve navegar entre login e registro', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/login');
    await helpers.waitForLoadState();

    // Clicar no link de registro
    const registerLink = page.locator('[data-testid="register-link"]');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await helpers.expectURL(/registro|register|cadastro/);
    }
  });

  test('deve lidar com erro de rede durante login', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.goto('/login');
    await helpers.waitForLoadState();

    // Preencher dados
    await helpers.fillTestInput('email-input', testDataManager.getValidUser().email);
    await helpers.fillTestInput('password-input', testDataManager.getValidUser().password);

    // Simular erro de rede (interceptar request)
    await page.route('**/auth/login', route => {
      route.abort('internetdisconnected');
    });

    // Tentar fazer login
    await helpers.clickTestButton('login-button');

    // Verificar mensagem de erro de rede
    await helpers.expectErrorMessage();
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
  });
});
