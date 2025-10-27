# Padrões de Teste - Doc Forge Buddy

Este documento descreve os padrões e práticas recomendadas para escrever testes no projeto.

## Estrutura de Testes

### Organização de Arquivos

```
src/
├── __tests__/
│   ├── hooks/
│   │   ├── useAuth.test.tsx
│   │   ├── useContractData.test.tsx
│   │   └── useDocumentGeneration.test.tsx
│   ├── services/
│   │   └── ImageService.test.ts
│   └── utils/
│       └── dateHelpers.test.ts
```

### Convenções de Nomenclatura

- **Arquivo de teste:** `[nome-arquivo].test.ts` ou `[nome-arquivo].test.tsx`
- **Sufixo:** `.test.ts` para utilitários e serviços, `.test.tsx` para hooks e componentes
- **Localização:** Mesmo nível do arquivo testado ou em pasta `__tests__`

## Estrutura Padrão de um Teste

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mocks
vi.mock('@/integrations/supabase/client');

describe('NomeDaFunçãoOuHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurações adicionais (ex: vi.useFakeTimers())
  });

  afterEach(() => {
    // Limpeza (ex: vi.useRealTimers())
  });

  describe('grupoDeTestes', () => {
    it('deve descrever o comportamento esperado', () => {
      // Arrange
      const mockData = { /* ... */ };
      
      // Act
      const result = functionToTest(mockData);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

## Padrões de Mock

### Mock do Supabase

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Uso em testes
const mockData = { id: '1', nome: 'Teste' };

vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    }),
  }),
} as any);
```

### Mock Completo para Operações Delete/Update

```typescript
// ✅ Correto - Cadeia completa de métodos
vi.mocked(supabase.from).mockReturnValue({
  delete: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      // retorna a Promise de delete
    }),
  }),
} as any);

// ❌ Incorreto - Falta eq()
vi.mocked(supabase.from).mockReturnValue({
  delete: vi.fn().mockReturnValue(mockDelete),
} as any);
```

### Mock de Router (React Router)

```typescript
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});
```

### Mock de Utilitários

```typescript
vi.mock('@/utils/dateHelpers', () => ({
  DateHelpers: {
    getCurrentDateBrazilian: vi.fn(() => '01/01/2024'),
  },
}));
```

## Testando Hooks

### Estrutura Básica

```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('useCustomHook', () => {
  it('deve retornar estado inicial correto', () => {
    const { result } = renderHook(() => useCustomHook());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve executar ação assíncrona', async () => {
    const { result } = renderHook(() => useCustomHook());
    
    // Aguardar loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

### Testando Erros

```typescript
it('deve capturar e setar erro corretamente', async () => {
  // Mock erro
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Test error' },
        }),
      }),
    }),
  } as any);

  const { result } = renderHook(() => useCustomHook());
  
  await waitFor(() => {
    expect(result.current.error).toBeTruthy();
  });
});
```

## Testando Timers

### Usando Fake Timers

```typescript
describe('Teste com setTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve executar após timeout', async () => {
    const { result } = renderHook(() => useCustomHook());
    
    // Trigger ação com setTimeout
    result.current.delayedAction();
    
    // Avançar timers
    vi.advanceTimersByTime(1000);
    
    expect(result.current.completed).toBe(true);
  });
});
```

## Testando Componentes

### Renderização Básica

```typescript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

it('deve renderizar corretamente', () => {
  render(
    <BrowserRouter>
      <MyComponent />
    </BrowserRouter>
  );
  
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Interações de Usuário

```typescript
import userEvent from '@testing-library/user-event';

it('deve responder a cliques', async () => {
  const user = userEvent.setup();
  
  render(<ButtonComponent />);
  
  const button = screen.getByRole('button');
  await user.click(button);
  
  expect(screen.getByText('Clicked!')).toBeInTheDocument();
});
```

## Assertions Comuns

### Valores Primitivos

```typescript
expect(result).toBe(expected);           // ===
expect(result).toEqual(expected);        // Deep equality
expect(result).toBeDefined();
expect(result).toBeNull();
expect(result).toBeTruthy();
expect(result).toBeFalsy();
```

### Arrays e Objetos

```typescript
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(object).toHaveProperty('key');
expect(object).toEqual({ key: 'value' });
```

### Funções

```typescript
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledTimes(2);
expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFunction).toHaveReturnedWith('value');
```

### Strings

```typescript
expect(string).toContain('substring');
expect(string).toMatch(/regex/);
expect(string).toHaveLength(10);
```

## Boas Práticas

### 1. Organizar por Comportamento

```typescript
// ✅ Bom - Agrupa por funcionalidade
describe('fetchContractById', () => {
  describe('quando sucesso', () => {
    it('deve retornar contrato válido');
    it('deve processar form_data como string');
  });
  
  describe('quando erro', () => {
    it('deve retornar null');
    it('deve setar error corretamente');
  });
});

// ❌ Ruim - Mistura funcionalidades
describe('useContractData', () => {
  it('teste 1');
  it('teste 2');
  it('teste 3');
});
```

### 2. Nomes Descritivos

```typescript
// ✅ Bom
it('deve deletar contrato quando ID válido', () => {});
it('deve lançar erro ao deletar contrato inexistente', () => {});

// ❌ Ruim
it('teste 1', () => {});
it('deve funcionar', () => {});
```

### 3. Isolamento de Testes

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Sempre limpar mocks
});

afterEach(() => {
  vi.useRealTimers(); // Restaurar timers reais
});
```

### 4. Mock de Dependências Externas

```typescript
// ✅ Sempre mockar dependências externas
vi.mock('@/integrations/supabase/client');
vi.mock('react-router-dom');
vi.mock('@/utils/dateHelpers');
```

### 5. Testar Comportamento, Não Implementação

```typescript
// ✅ Bom - Testa comportamento
it('deve atualizar estado de loading durante requisição', async () => {
  const { result } = renderHook(() => useHook());
  
  expect(result.current.loading).toBe(false);
  
  const promise = result.current.fetch();
  expect(result.current.loading).toBe(true);
  
  await promise;
  expect(result.current.loading).toBe(false);
});

// ❌ Ruim - Testa implementação
it('deve chamar setLoading(true) e setLoading(false)', () => {});
```

## Checklist de Qualidade

Antes de considerar um teste completo:

- [ ] Todos os cenários principais estão cobertos
- [ ] Casos de erro estão cobertos
- [ ] Mocks estão completos e corretos
- [ ] Testes são independentes e isolados
- [ ] Nomes descritivos que explicam o comportamento
- [ ] Usa `waitFor()` para operações assíncronas
- [ ] Limpa mocks e timers após cada teste
- [ ] Não depende de ordem de execução

## Exemplos Completos

Consulte os seguintes arquivos para exemplos práticos:

- `src/__tests__/hooks/useContractData.test.tsx` - Exemplo completo de teste de hook
- `src/services/__tests__/ImageService.test.ts` - Exemplo de teste de serviço
- `src/__tests__/hooks/useDocumentGeneration.test.tsx` - Exemplo com timers

---

**Última Atualização:** 27/01/2025
