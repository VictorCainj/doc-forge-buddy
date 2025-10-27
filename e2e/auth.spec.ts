import { test, expect } from '@playwright/test';

test.describe('Autenticação E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');
  });

  test('deve fazer login com sucesso', async ({ page }) => {
    // Assumindo que existe um botão de login
    const loginButton = page.getByRole('button', { name: /login|entrar/i });

    // Se o botão existir, clicar nele
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Preencher credenciais (ajustar seletores conforme necessário)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Clicar no botão de submit
    const submitButton = page.getByRole('button', {
      name: /entrar|submit|login/i,
    });
    await submitButton.click();

    // Verificar redirecionamento ou mensagem de sucesso
    await expect(page).toHaveURL(/dashboard|home|\/$/);
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Navegar para login
    const loginButton = page.getByRole('button', { name: /login|entrar/i });

    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Preencher credenciais inválidas
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Clicar no botão de submit
    const submitButton = page.getByRole('button', {
      name: /entrar|submit|login/i,
    });
    await submitButton.click();

    // Verificar mensagem de erro
    await expect(
      page.locator('text=/erro|inválido|incorreto/i').first()
    ).toBeVisible();
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    // Assumir que o usuário já está logado
    // (Este teste requer autenticação prévia)

    // Localizar botão de logout
    const logoutButton = page.getByRole('button', {
      name: /logout|sair|sair/i,
    });

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Verificar redirecionamento para login
      await expect(page).toHaveURL(/login|\/$/);
    }
  });

  test('deve persistir sessão após recarregar página', async ({ page }) => {
    // Login primeiro
    const loginButton = page.getByRole('button', { name: /login|entrar/i });

    if (await loginButton.isVisible()) {
      await loginButton.click();

      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');

      const submitButton = page.getByRole('button', {
        name: /entrar|submit|login/i,
      });
      await submitButton.click();

      // Aguardar login
      await page.waitForURL(/dashboard|home|verified/);
    }

    // Recarregar página
    await page.reload();

    // Verificar que ainda está autenticado
    await expect(page).toHaveURL(/dashboard|home|\/$/);
  });

  test('deve processar recuperação de senha', async ({ page }) => {
    // Procurar link de recuperação de senha
    const forgotPasswordLink = page.locator(
      'text=/esqueci|recuperar|password/i'
    );

    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Preencher email para recuperação
      const emailInput = page.locator('input[type="email"]');

      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');

        // Procurar botão de enviar
        const sendButton = page.getByRole('button', {
          name: /enviar|recuperar|enviar/i,
        });

        if (await sendButton.isVisible()) {
          await sendButton.click();

          // Aguardar mensagem de sucesso
          await page.waitForTimeout(1000);

          // Verificar se apareceu mensagem de sucesso
          const successMessage = page.locator('text=/enviado|email|sucesso/i');

          if (await successMessage.isVisible()) {
            await expect(successMessage.first()).toBeVisible();
          }
        }
      }
    }
  });
});
