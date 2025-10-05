# 🧪 Fase 3 - Qualidade e Testes

**Status:** Iniciando 🟡  
**Início:** 05/10/2025  
**Estimativa:** 2 semanas  
**Objetivo:** Estabelecer base sólida de testes e qualidade

---

## 🎯 OBJETIVOS DA FASE 3

### **Metas:**
- ✅ Setup completo de testes (Vitest + Testing Library)
- ✅ 80%+ cobertura de testes
- ✅ Testes unitários para todos os hooks
- ✅ Testes de componentes críticos
- ✅ Accessibility audit (WCAG AA)
- ✅ Error tracking (opcional: Sentry)
- ✅ Performance monitoring

---

## 📦 FERRAMENTAS A IMPLEMENTAR

### **1. Vitest** 🧪
Framework de testes moderno e rápido (compatível com Vite)

```json
// package.json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### **2. Testing Library** 🎭
Testes focados no comportamento do usuário

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0"
  }
}
```

### **3. Axe-core** ♿
Testes automatizados de acessibilidade

```json
{
  "devDependencies": {
    "@axe-core/react": "^4.8.0",
    "axe-playwright": "^1.2.0"
  }
}
```

---

## 🛠️ SETUP INICIAL

### **Passo 1: Instalar Dependências**

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @axe-core/react
npm install -D jsdom
```

### **Passo 2: Configurar Vitest**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### **Passo 3: Setup de Testes**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});
```

### **Passo 4: Configurar Scripts**

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

---

## ✅ TESTES A IMPLEMENTAR

### **1. Testes de Hooks**

#### **useContractReducer.test.ts**
```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContractReducer } from '@/features/contracts/hooks/useContractReducer';

describe('useContractReducer', () => {
  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useContractReducer());
    
    expect(result.current.state.contracts).toEqual([]);
    expect(result.current.state.modals.agendamento).toBe(false);
    expect(result.current.state.loading.fetch).toBe(false);
  });
  
  it('deve adicionar contratos', () => {
    const { result } = renderHook(() => useContractReducer());
    
    const mockContracts = [
      { id: '1', title: 'Contrato 1', form_data: {} },
      { id: '2', title: 'Contrato 2', form_data: {} },
    ];
    
    act(() => {
      result.current.actions.setContracts(mockContracts);
    });
    
    expect(result.current.state.contracts).toHaveLength(2);
    expect(result.current.state.contracts[0].id).toBe('1');
  });
  
  it('deve abrir e fechar modais', () => {
    const { result } = renderHook(() => useContractReducer());
    
    act(() => {
      result.current.actions.openModal('agendamento');
    });
    
    expect(result.current.state.modals.agendamento).toBe(true);
    
    act(() => {
      result.current.actions.closeModal('agendamento');
    });
    
    expect(result.current.state.modals.agendamento).toBe(false);
  });
  
  it('deve atualizar form data', () => {
    const { result } = renderHook(() => useContractReducer());
    
    act(() => {
      result.current.actions.setFormData('dataVistoria', '2024-10-15');
    });
    
    expect(result.current.state.formData.dataVistoria).toBe('2024-10-15');
  });
  
  it('deve resetar estado', () => {
    const { result } = renderHook(() => useContractReducer());
    
    act(() => {
      result.current.actions.setContracts([{ id: '1' }]);
      result.current.actions.openModal('agendamento');
    });
    
    act(() => {
      result.current.actions.reset();
    });
    
    expect(result.current.state.contracts).toEqual([]);
    expect(result.current.state.modals.agendamento).toBe(false);
  });
});
```

#### **useContractActions.test.ts**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContractActions } from '@/features/contracts/hooks/useContractActions';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: {}, error: null })) })) })),
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useContractActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('deve deletar contrato com sucesso', async () => {
    const { result } = renderHook(() => useContractActions());
    
    const success = await result.current.deleteContract('123');
    
    expect(success).toBe(true);
  });
  
  it('deve exportar contratos para CSV', async () => {
    const { result } = renderHook(() => useContractActions());
    
    const mockContracts = [
      { id: '1', form_data: { numeroContrato: '001', nomeLocatario: 'João' } },
    ];
    
    // Mock createElement e click
    const mockLink = { click: vi.fn(), setAttribute: vi.fn(), style: {} };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    
    await result.current.exportContracts(mockContracts);
    
    expect(mockLink.click).toHaveBeenCalled();
  });
});
```

---

### **2. Testes de Componentes**

#### **ContractStats.test.tsx**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContractStats } from '@/features/contracts/components/ContractStats';

describe('ContractStats', () => {
  const mockContracts = [
    { id: '1', status: 'active', form_data: {} },
    { id: '2', status: 'active', form_data: {} },
    { id: '3', status: 'pending', form_data: {} },
  ];
  
  it('deve renderizar cards de estatísticas', () => {
    render(<ContractStats contracts={mockContracts} />);
    
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Ativos')).toBeInTheDocument();
    expect(screen.getByText('Pendentes')).toBeInTheDocument();
  });
  
  it('deve calcular métricas corretamente', () => {
    render(<ContractStats contracts={mockContracts} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total
    expect(screen.getByText('2')).toBeInTheDocument(); // Ativos
    expect(screen.getByText('1')).toBeInTheDocument(); // Pendentes
  });
  
  it('deve mostrar loading state', () => {
    render(<ContractStats contracts={[]} isLoading={true} />);
    
    const loadingCards = screen.getAllByRole('generic');
    expect(loadingCards.length).toBeGreaterThan(0);
  });
});
```

#### **ContractFilters.test.tsx**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractFilters } from '@/features/contracts/components/ContractFilters';

describe('ContractFilters', () => {
  const mockProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    onClearFilters: vi.fn(),
    totalResults: 10,
  };
  
  it('deve renderizar campo de busca', () => {
    render(<ContractFilters {...mockProps} />);
    
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  });
  
  it('deve chamar onSearchChange ao digitar', async () => {
    const user = userEvent.setup();
    render(<ContractFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await user.type(searchInput, 'teste');
    
    expect(mockProps.onSearchChange).toHaveBeenCalled();
  });
  
  it('deve mostrar total de resultados', () => {
    render(<ContractFilters {...mockProps} />);
    
    expect(screen.getByText('10 contratos encontrados')).toBeInTheDocument();
  });
  
  it('deve mostrar botão de limpar quando há filtros', () => {
    render(<ContractFilters {...mockProps} searchTerm="teste" />);
    
    const clearButton = screen.getByRole('button', { name: /limpar/i });
    expect(clearButton).toBeInTheDocument();
  });
});
```

---

### **3. Testes de Integração**

```typescript
// src/test/integration/Contratos.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Contratos from '@/pages/Contratos';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('Contratos Page Integration', () => {
  it('deve renderizar página completa', async () => {
    render(<Contratos />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Contratos')).toBeInTheDocument();
    });
  });
  
  it('deve mostrar stats e filtros', async () => {
    render(<Contratos />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
    });
  });
});
```

---

## ♿ ACCESSIBILITY AUDIT

### **Setup Axe-core**

```typescript
// src/test/accessibility.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ContractStats } from '@/features/contracts/components/ContractStats';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('ContractStats não deve ter violações', async () => {
    const { container } = render(<ContractStats contracts={[]} />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
});
```

### **Checklist WCAG AA**

- [ ] Contraste de cores >= 4.5:1
- [ ] Navegação por teclado funcional
- [ ] Labels em todos os inputs
- [ ] Alt text em imagens
- [ ] ARIA labels quando necessário
- [ ] Focus visível
- [ ] Sem text muito pequeno (< 12px)
- [ ] Heading hierarchy correta

---

## 📊 MÉTRICAS DE SUCESSO

### **Cobertura de Testes**

| Categoria | Meta | Atual | Status |
|-----------|------|-------|--------|
| **Statements** | 80% | 0% | ⏳ |
| **Branches** | 75% | 0% | ⏳ |
| **Functions** | 80% | 0% | ⏳ |
| **Lines** | 80% | 0% | ⏳ |

### **Accessibility**

| Critério | Meta | Status |
|----------|------|--------|
| **WCAG A** | 100% | ⏳ |
| **WCAG AA** | 100% | ⏳ |
| **WCAG AAA** | 80% | ⏳ |

---

## 🎯 ROADMAP FASE 3

### **Semana 1**
- [x] Documentação criada
- [ ] Setup Vitest + Testing Library
- [ ] Testes para useContractReducer
- [ ] Testes para useContractActions
- [ ] Testes para ContractStats
- [ ] Testes para ContractFilters

### **Semana 2**
- [ ] Testes de integração
- [ ] Accessibility audit
- [ ] Correções de acessibilidade
- [ ] Performance monitoring setup
- [ ] Documentação final

---

## 💡 BOAS PRÁTICAS

### **1. Testar Comportamento, Não Implementação**
```typescript
// ✅ BOM
expect(screen.getByRole('button', { name: /deletar/i })).toBeInTheDocument();

// ❌ EVITAR
expect(component.state.showModal).toBe(true);
```

### **2. Usar Data-Testid Apenas Quando Necessário**
```typescript
// ✅ BOM (usar roles e labels)
screen.getByRole('button', { name: /salvar/i });

// ⚠️ OK (quando não há alternativa)
screen.getByTestId('submit-button');
```

### **3. Mock Apenas o Necessário**
```typescript
// ✅ BOM (mock específico)
vi.mock('@/integrations/supabase/client');

// ❌ EVITAR (mock tudo)
vi.mock('react');
```

---

**Próximo:** Implementar setup e primeiros testes!

---

**Status:** 🟡 Iniciando  
**Última atualização:** 05/10/2025 16:30  
**Versão:** 1.0.0

