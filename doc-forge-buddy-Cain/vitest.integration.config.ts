import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './src/__tests__/integration/setup.ts'
    ],
    css: true,
    // Configurações específicas para testes de integração
    testTimeout: 10000, // 10 segundos para testes de integração
    hookTimeout: 5000, // 5 segundos para hooks
    include: [
      'src/**/__tests__/integration/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules/',
      'src/**/__tests__/unit/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/e2e/**/*.{test,spec}.{ts,tsx}',
      'dist/',
      'coverage/',
      '.vercel/',
    ],
    // Configurações de cobertura para testes de integração
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 75, // Menor threshold para integração
          functions: 75,
          lines: 75,
          statements: 75
        },
        'src/**/integration/**': {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      },
      exclude: [
        'node_modules/',
        'src/test/**',
        'src/stories/**',
        'src/**/__tests__/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.js',
        'dist/',
        'coverage/',
        '.vercel/',
        '**/mocks/**',
        '**/handlers.ts',
      ]
    },
    // Configurações de reporters
    reporters: [
      'default',
      ['html', { 
        outputFile: 'coverage/integration-report.html' 
      }]
    ],
    // Pool de workers para testes paralelos
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        threads: 2, // Menor número para testes de integração
      }
    },
    // Habilitar debugging para testes de integração
    debug: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});