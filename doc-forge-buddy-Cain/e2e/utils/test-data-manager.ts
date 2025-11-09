import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export interface TestContract {
  id: string;
  name: string;
  type: 'residencial' | 'comercial' | 'industrial';
  value: number;
  status: 'ativo' | 'pendente' | 'concluido';
}

export interface TestData {
  users: {
    valid: TestUser;
    invalid: TestUser;
  };
  contracts: TestContract[];
}

export class TestDataManager {
  private data: TestData;

  constructor() {
    this.data = this.loadTestData();
  }

  private loadTestData(): TestData {
    const dataPath = path.join(__dirname, '../../test-data');
    
    try {
      const usersData = JSON.parse(
        fs.readFileSync(path.join(dataPath, 'users.json'), 'utf-8')
      );
      const contractsData = JSON.parse(
        fs.readFileSync(path.join(dataPath, 'contracts.json'), 'utf-8')
      );

      return {
        users: usersData,
        contracts: contractsData,
      };
    } catch (error) {
      console.log('📊 Usando dados de teste padrão');
      return this.getDefaultData();
    }
  }

  private getDefaultData(): TestData {
    return {
      users: {
        valid: {
          email: 'teste.e2e@example.com',
          password: 'Teste123!',
          name: 'Usuário Teste E2E',
        },
        invalid: {
          email: 'invalid@email.com',
          password: 'wrongpassword',
        },
      },
      contracts: [
        {
          id: 'test-contract-1',
          name: 'Contrato de Teste E2E 1',
          type: 'residencial',
          value: 100000,
          status: 'ativo',
        },
      ],
    };
  }

  getValidUser(): TestUser {
    return this.data.users.valid;
  }

  getInvalidUser(): TestUser {
    return this.data.users.invalid;
  }

  getTestContracts(): TestContract[] {
    return this.data.contracts;
  }

  getTestContract(id?: string): TestContract | undefined {
    if (id) {
      return this.data.contracts.find(c => c.id === id);
    }
    return this.data.contracts[0];
  }

  // Métodos de autenticação
  async loginAsValidUser(page: Page): Promise<void> {
    const user = this.getValidUser();
    await this.login(page, user.email, user.password);
  }

  async login(page: Page, email: string, password: string): Promise<void> {
    // Navegar para página de login
    await page.goto('/login');

    // Preencher email
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);

    // Clicar no botão de login
    await page.click('[data-testid="login-button"]');

    // Aguardar redirecionamento
    await page.waitForURL(/dashboard|home|\/$/, { timeout: 10000 });
  }

  async logout(page: Page): Promise<void> {
    // Procurar botão de logout
    const logoutButton = page.locator('[data-testid="logout-button"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/login|\/$/);
    }
  }

  // Métodos para upload de arquivos
  async createTestImage(filename: string): Promise<string> {
    const uploadDir = path.join(__dirname, '../../test-data/uploads');
    const filePath = path.join(uploadDir, filename);

    // Criar um arquivo de imagem fake para testes
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    fs.writeFileSync(filePath, imageBuffer);
    return filePath;
  }

  async uploadTestImage(page: Page, fileInputSelector: string, filename: string): Promise<void> {
    const filePath = await this.createTestImage(filename);
    await page.setInputFiles(fileInputSelector, filePath);
  }
}

// Instância global do gerenciador de dados de teste
export const testDataManager = new TestDataManager();