import { renderHook, RenderHookResult } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Configuração do QueryClient para testes
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Desabilitar retry em testes para ser mais previsível
        retry: false,
        // Timeout menor para testes
        staleTime: 0,
      },
      mutations: {
        // Desabilitar retry em mutações
        retry: false,
      },
    },
  });

// Wrapper para hooks que usam React Query
export const createQueryWrapper = () => {
  const testQueryClient = createTestQueryClient();
  
  return ({ children }: { children: ReactElement }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Wrapper completo com QueryClient e Router
export const createFullWrapper = () => {
  const testQueryClient = createTestQueryClient();
  
  return ({ children }: { children: ReactElement }) => (
    <BrowserRouter>
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Utilitários para renderizar hooks com diferentes configurações
export const renderHookWithProviders = <T,>(
  hookFn: () => T,
  options: {
    queryWrapper?: boolean;
    fullWrapper?: boolean;
    initialProps?: any;
  } = {}
): RenderHookResult<T, any> => {
  const { queryWrapper = true, fullWrapper = false, initialProps } = options;
  
  const wrapper = fullWrapper 
    ? createFullWrapper()
    : queryWrapper 
    ? createQueryWrapper()
    : undefined;
    
  return renderHook(hookFn, { 
    wrapper,
    initialProps,
  });
};

// Helper para aguardar mudanças em estado
export const waitForAsync = (ms: number = 100) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Helper para aguardar que uma condição seja atendida
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await waitForAsync(interval);
  }
  
  throw new Error(`Condição não atendida após ${timeout}ms`);
};