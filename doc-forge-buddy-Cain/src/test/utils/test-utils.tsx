import React, { PropsWithChildren, ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create a custom render function that includes all providers
interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

const AllTheProviders = ({ 
  children, 
  queryClient 
}: AllTheProvidersProps) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { 
    queryClient?: QueryClient;
    initialEntries?: string[];
  }
) => {
  const { queryClient, initialEntries, ...renderOptions } = options || {};
  
  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <AllTheProviders queryClient={queryClient}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { customRender as renderWithProviders };

// Mock data generators
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
};

export const mockContract = {
  id: '1',
  locatario: 'João Silva',
  locador: 'Maria Santos',
  valor: 1000,
  dataInicio: '2024-01-01',
  dataFim: '2024-12-31',
  status: 'ativo' as const,
};

export const mockAPIResponse = {
  success: true,
  data: null,
  message: 'Operation successful',
};

// Test IDs constants
export const TEST_IDS = {
  BUTTON: {
    PRIMARY: 'button-primary',
    SECONDARY: 'button-secondary',
    LOADING: 'button-loading',
  },
  INPUT: {
    TEXT: 'input-text',
    EMAIL: 'input-email',
    PASSWORD: 'input-password',
  },
  MODAL: {
    OVERLAY: 'modal-overlay',
    CONTENT: 'modal-content',
    CLOSE: 'modal-close-button',
  },
  FORM: {
    FIELD: 'form-field',
    ERROR: 'form-error',
    SUBMIT: 'form-submit',
  },
  CARD: {
    CONTAINER: 'card-container',
    HEADER: 'card-header',
    CONTENT: 'card-content',
  },
  TABLE: {
    CONTAINER: 'table-container',
    ROW: 'table-row',
    CELL: 'table-cell',
  },
} as const;

// Helper to create async delays in tests
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to create console spy
export const createConsoleSpy = () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  
  return { warnSpy, errorSpy, logSpy };
};

// Helper to clean up console spies
export const restoreConsoleSpies = (...spies: vi.SpyInstance[]) => {
  spies.forEach(spy => spy.mockRestore());
};

// Helper to mock localStorage
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

// Helper to mock sessionStorage
export const mockSessionStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

// Helper to create mock data
export const createMockData = {
  user: (overrides: Partial<typeof mockUser> = {}) => ({ ...mockUser, ...overrides }),
  contract: (overrides: Partial<typeof mockContract> = {}) => ({ ...mockContract, ...overrides }),
  apiResponse: (overrides: Partial<typeof mockAPIResponse> = {}) => ({ ...mockAPIResponse, ...overrides }),
};

// Helper to validate component accessibility
export const checkA11y = async (element: HTMLElement) => {
  // This would typically use axe-core for accessibility testing
  // For now, we'll just check if element is in the document
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

// Mock implementations for specific components
export const setupMocks = () => {
  // Mock do Supabase
  const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
  
  // Mock do logger
  const { log } = vi.mocked(require('@/utils/logger'));
  
  // Mock do useToast
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };
  
  vi.mocked(require('@/components/ui/use-toast')).useToast.mockReturnValue({ toast });
  
  return { supabase, log, toast };
};

// Mock dos componentes UI do Radix que são usados frequentemente
export const setupUIMocks = () => {
  // Mock do Dialog
  const Dialog = ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" data-open={open} onClick={() => onOpenChange && onOpenChange(!open)}>
      {children}
    </div>
  );

  // Mock do Button
  const Button = ({ children, className, onClick, disabled, ...props }: any) => (
    <button 
      data-testid="button" 
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );

  // Mock do Card
  const Card = ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  );

  // Mock do Input
  const Input = ({ className, ...props }: any) => (
    <input 
      data-testid="input" 
      className={className}
      {...props}
    />
  );

  return { Dialog, Button, Card, Input };
};