import { Page, Locator, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  // Métodos para aguardar elementos
  async waitForElement(selector: string, timeout = 5000): Promise<Locator> {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  // Métodos para verificar se elementos estão visíveis
  async expectVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectHidden(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  // Métodos para preencher formulários
  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.selectOption(selector, value);
  }

  // Métodos para cliques
  async clickButton(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  // Métodos para upload de arquivos
  async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.page.setInputFiles(selector, filePath);
  }

  // Métodos para navegação
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  // Métodos para verificar URLs
  async expectURL(pattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  // Métodos para aguardar carregamento
  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  // Métodos para aguardar timeout específico
  async waitForTimeout(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  // Métodos para verificar conteúdo de texto
  async expectToContainText(selector: string, text: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async expectToHaveText(selector: string, text: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  // Métodos para dados de teste com data-testids
  async fillTestInput(fieldId: string, value: string): Promise<void> {
    await this.page.fill(`[data-testid="${fieldId}"]`, value);
  }

  async clickTestButton(buttonId: string): Promise<void> {
    await this.page.click(`[data-testid="${buttonId}"]`);
  }

  async expectTestElementVisible(elementId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="${elementId}"]`)).toBeVisible();
  }

  // Métodos para scroll e navegação
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  // Métodos para lidar com modais
  async closeModal(): Promise<void> {
    // Tentar ESC primeiro
    await this.page.keyboard.press('Escape');
    
    // Se não funcionou, tentar fechar clicando fora
    try {
      await this.page.click('body', { position: { x: 0, y: 0 } });
    } catch (e) {
      // Ignorar erro se não conseguir fechar
    }
  }

  // Métodos para lidar com dropdowns
  async selectFromDropdown(dropdownId: string, optionText: string): Promise<void> {
    await this.page.click(`[data-testid="${dropdownId}"]`);
    await this.page.click(`[data-testid="${dropdownId}"] [data-value="${optionText}"]`);
  }

  // Métodos para verificar alertas e notificações
  async expectSuccessMessage(): Promise<void> {
    await expect(this.page.locator('text=/sucesso|sucess|confirmado/i')).toBeVisible();
  }

  async expectErrorMessage(): Promise<void> {
    await expect(this.page.locator('text=/erro|error|falha|inválid/i')).toBeVisible();
  }

  // Métodos para screenshots
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  // Métodos para aguardar requests
  async waitForResponse(urlPattern: string): Promise<void> {
    await this.page.waitForResponse(urlPattern);
  }

  // Métodos para verificar console errors
  async getConsoleErrors(): Promise<string[]> {
    const messages: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        messages.push(msg.text());
      }
    });
    return messages;
  }
}

// Factory function para criar helpers
export function createTestHelpers(page: Page): TestHelpers {
  return new TestHelpers(page);
}