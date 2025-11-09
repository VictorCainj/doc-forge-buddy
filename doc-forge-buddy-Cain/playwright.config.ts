import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // URL base para os testes
  baseURL: 'http://localhost:5173',
  
  // Configuração de timeout
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Retries para flaky tests
  retries: process.env.CI ? 2 : 0,
  
  // Executar testes em paralelo
  workers: process.env.CI ? 4 : undefined,
  
  // Test runner
  testDir: './e2e',
  
  // Test files
  fullyParallel: true,
  
  // Forçar retries em specs específicos se necessário
  forbidOnly: !!process.env.CI,
  
  // Configurações de tracing e screenshots
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list']
  ],

  // Global setup
  globalSetup: require.resolve('./e2e/setup/global-setup.ts'),
  
  // Global teardown  
  globalTeardown: require.resolve('./e2e/setup/global-teardown.ts'),

  // Projects para diferentes browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        // Permissões adicionais se necessário
        permissions: ['notifications'],
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    // Projeto mobile
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    // Projeto tablet
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
  ],

  // Configurações de output
  outputDir: 'test-results/',
  
  // Configurações de dependências web
  webServer: {
    command: 'npm run preview',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Configurações de email para notificações
  use: {
    // Base URL
    baseURL: 'http://localhost:5173',
    
    // Screenshot
    screenshot: 'only-on-failure',
    
    // Vídeo
    video: 'retain-on-failure',
    
    // Traces
    trace: 'retain-on-failure',
    
    // Navegação
    navigationTimeout: 30000,
    
    // Context options
    contextOptions: {
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 720 },
    },

    // Headers globais se necessário
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR',
    },
  },
});