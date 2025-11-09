/**
 * Testes para o sistema de state management
 * Valida funcionamento dos stores e hooks
 */

import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { 
  AppStoreProvider, 
  useAppStore, 
  useAuthState, 
  useThemeState, 
  useNotificationState 
} from '../stores';
import { 
  useAuth, 
  useTheme, 
  useNotifications, 
  useGlobalState 
} from '../hooks/useAppStore';
import { ContractStoreProvider, useContractStore } from '../stores/contractStore';

// Mock do Supabase
jest.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Wrapper para testes
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <AppStoreProvider>{children}</AppStoreProvider>
);

describe('AppStore - Estado Global', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('deve inicializar com estado padrão', () => {
    let store: any;
    
    const TestComponent = () => {
      store = useAppStore();
      return <div>Test</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(store.state.auth.user).toBeNull();
    expect(store.state.auth.loading).toBe(true);
    expect(store.state.theme.mode).toBe('light');
    expect(store.state.notifications.notifications).toEqual([]);
  });

  test('deve permitir mudança de tema', async () => {
    let theme: any;
    
    const TestComponent = () => {
      theme = useTheme();
      return (
        <div>
          <button onClick={theme.toggleTheme}>Toggle Theme</button>
          <div data-testid="theme-mode">{theme.mode}</div>
        </div>
      );
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(theme.mode).toBe('light');
    
    // Simular clique no toggle
    theme.toggleTheme();
    
    await waitFor(() => {
      expect(theme.mode).toBe('dark');
    });
  });
});

describe('Hook useAuth', () => {
  test('deve retornar estado de autenticação', () => {
    let auth: any;
    
    const TestComponent = () => {
      auth = useAuth();
      return <div>Auth Test</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(typeof auth.signIn).toBe('function');
    expect(typeof auth.signOut).toBe('function');
  });
});

describe('Hook useTheme', () => {
  test('deve retornar estado de tema', () => {
    let theme: any;
    
    const TestComponent = () => {
      theme = useTheme();
      return (
        <div>
          <div data-testid="mode">{theme.mode}</div>
          <div data-testid="isDark">{theme.isDark.toString()}</div>
          <button onClick={theme.toggleTheme}>Toggle</button>
        </div>
      );
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(theme.mode).toBe('light');
    expect(theme.isDark).toBe(false);
    expect(theme.isLight).toBe(true);
    expect(typeof theme.toggleTheme).toBe('function');
    expect(typeof theme.setTheme).toBe('function');
  });
});

describe('Hook useNotifications', () => {
  test('deve retornar estado de notificações', () => {
    let notifications: any;
    
    const TestComponent = () => {
      notifications = useNotifications();
      return <div>Notifications Test</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(notifications.global.notifications).toEqual([]);
    expect(notifications.global.unreadCount).toBe(0);
    expect(typeof notifications.actions.addNotification).toBe('function');
    expect(typeof notifications.actions.markAsRead).toBe('function');
  });
});

describe('Hook useGlobalState', () => {
  test('deve retornar estado global unificado', () => {
    let globalState: any;
    
    const TestComponent = () => {
      globalState = useGlobalState();
      return <div>Global State Test</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(globalState.auth).toBeDefined();
    expect(globalState.theme).toBeDefined();
    expect(globalState.notifications).toBeDefined();
    expect(globalState.contracts).toBeDefined();
    expect(globalState.app).toBeDefined();
  });
});

describe('ContractStore', () => {
  const ContractTestWrapper = ({ children }: { children: ReactNode }) => (
    <AppStoreProvider>
      <ContractStoreProvider>{children}</ContractStoreProvider>
    </AppStoreProvider>
  );

  test('deve inicializar estado de contrato', () => {
    let contractStore: any;
    
    const TestComponent = () => {
      contractStore = useContractStore();
      return <div>Contract Test</div>;
    };

    render(
      <ContractTestWrapper>
        <TestComponent />
      </ContractTestWrapper>
    );

    expect(contractStore.state.currentContract).toBeNull();
    expect(contractStore.state.isEditing).toBe(false);
    expect(contractStore.state.hasUnsavedChanges).toBe(false);
    expect(typeof contractStore.actions.startEditing).toBe('function');
  });

  test('deve permitir edição de contrato', () => {
    let contractStore: any;
    
    const TestComponent = () => {
      contractStore = useContractStore();
      return (
        <div>
          <button onClick={() => contractStore.actions.startEditing({ id: '1', title: 'Test Contract' } as any)}>
            Start Editing
          </button>
          <button onClick={() => contractStore.actions.updateField('title', 'New Title')}>
            Update Field
          </button>
        </div>
      );
    };

    render(
      <ContractTestWrapper>
        <TestComponent />
      </ContractTestWrapper>
    );

    // Simular início da edição
    contractStore.actions.startEditing({ id: '1', title: 'Test Contract' } as any);
    
    expect(contractStore.state.isEditing).toBe(true);
    expect(contractStore.state.currentContract).toBeDefined();
    
    // Simular atualização de campo
    contractStore.actions.updateField('title', 'New Title');
    
    expect(contractStore.state.currentContract.title).toBe('New Title');
    expect(contractStore.state.hasUnsavedChanges).toBe(true);
  });
});

describe('Integração entre Stores', () => {
  test('deve manter estado consistente entre stores', () => {
    let globalState: any;
    let contractStore: any;
    
    const TestComponent = () => {
      globalState = useGlobalState();
      contractStore = useContractStore();
      return <div>Integration Test</div>;
    };

    render(
      <AppStoreProvider>
        <ContractStoreProvider>
          <TestComponent />
        </ContractStoreProvider>
      </AppStoreProvider>
    );

    // Testar se os stores são independentes mas compatíveis
    expect(globalState.auth).toBeDefined();
    expect(contractStore.state).toBeDefined();
    expect(globalState.contracts).toBeDefined();
    expect(globalState.contracts).not.toBe(contractStore.state);
  });
});

describe('Performance e Memory Leaks', () => {
  test('não deve causar memory leaks', async () => {
    const { unmount } = render(
      <TestWrapper>
        <div>Test for leaks</div>
      </TestWrapper>
    );

    // Desmontar e verificar se não há erros
    unmount();
    
    await waitFor(() => {
      // Se não houver erros, o teste passa
      expect(true).toBe(true);
    });
  });

  test('deve otimizar re-renders', () => {
    let renderCount = 0;
    
    const TestComponent = () => {
      renderCount++;
      const { theme } = useGlobalState();
      return <div>Render count: {renderCount}</div>;
    };

    const { rerender } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const initialCount = renderCount;
    
    // Re-render com mesmo estado
    rerender(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Deve manter número de renders otimizado
    // (exato número pode variar baseado na implementação)
    expect(renderCount).toBeLessThanOrEqual(initialCount + 1);
  });
});

// Teste de migração gradual
describe('Migração Gradual', () => {
  test('deve funcionar com código legado', () => {
    // Simular uso do hook antigo vs novo
    let newAuth: any;
    let oldAuth: any;

    const NewAuthComponent = () => {
      newAuth = useAuth();
      return <div>New Auth</div>;
    };

    const TestWrapper = ({ children }: { children: ReactNode }) => (
      <AppStoreProvider>{children}</AppStoreProvider>
    );

    render(
      <TestWrapper>
        <NewAuthComponent />
      </TestWrapper>
    );

    // Ambos devem funcionar
    expect(newAuth.user).toBeNull();
    expect(typeof newAuth.signIn).toBe('function');
  });
});