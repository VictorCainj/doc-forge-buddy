import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Configurar mocks globais para testes de integração
beforeAll(() => {
  // Mock do fetch
  global.fetch = vi.fn();
  
  // Mock do localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });

  // Mock do console para suprimir logs em testes
  global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
});

afterEach(() => {
  // Limpar DOM após cada teste
  cleanup();
  
  // Limpar mocks
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup final
  vi.restoreAllMocks();
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch global para MSW
global.fetch = fetch;

// Configurações do Vitest para testes de integração
export const testConfig = {
  // Timeout para testes assíncronos
  asyncUtilTimeout: 5000,
  
  // Configurações de retry para testes flaky
  retry: 2,
  
  // Configurações de cobertura
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/**/*.d.ts',
      'src/__tests__/**',
      'src/test/**',
      'dist/',
      'coverage/',
    ],
  },
};