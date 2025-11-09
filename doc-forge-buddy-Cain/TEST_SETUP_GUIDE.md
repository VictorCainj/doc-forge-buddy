# 🧪 Sistema de Unit Tests com Vitest

Sistema completo de unit tests configurado com Vitest, preparado para produção com 80% de coverage mínimo.

## 📋 Estrutura do Projeto

```
src/
├── __tests__/              # Testes por categoria
│   ├── components/         # Testes de componentes
│   ├── hooks/             # Testes de hooks customizados
│   ├── pages/             # Testes de páginas
│   ├── utils/             # Testes de utilitários
│   ├── services/          # Testes de serviços
│   └── DemoTest.test.tsx  # Exemplo completo de testes
├── test/                  # Configurações e utilitários
│   ├── setup.ts           # Setup global dos testes
│   ├── utils/             # Utilitários de teste
│   │   └── test-utils.tsx # Helper functions e render
│   ├── mocks/             # MSW handlers
│   │   ├── handlers.ts    # API mock handlers
│   │   ├── server.ts      # Server-side MSW setup
│   │   └── browser.ts     # Browser MSW setup
│   ├── fixtures/          # Dados de teste
│   │   └── data.ts        # Mock data e fixtures
│   └── types/             # Tipos customizados
│       └── extend-expect.ts # Custom matchers
└── vitest.config.ts       # Configuração do Vitest
```

## 🚀 Scripts de Teste

```json
{
  "test": "vitest",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:ci": "vitest run --coverage",
  "test:unit": "vitest run",
  "coverage:report": "vitest --coverage && open coverage/index.html",
  "coverage:threshold": "vitest run --coverage && npm run validate-coverage",
  "validate-coverage": "node scripts/validate-coverage.js",
  "quality-gates": "npm run lint:fix && npm run type-check && npm run validate-coverage && npm run test:unit"
}
```

## 🎯 Configuração de Coverage

### Thresholds Globais
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Thresholds por Tipo
- **Components/UI**: 90%
- **Utils/Lib**: 85%

### Excluded Files
- `node_modules/`
- `src/test/`
- `src/stories/`
- `**/*.d.ts`
- `**/*.config.ts`
- `dist/`
- `.vercel/`
- `coverage/`
- `e2e/`
- `scripts/`
- `public/`

## 🛠️ Ferramentas Configuradas

### Testing Library
- `@testing-library/react` - Renderização de componentes
- `@testing-library/jest-dom` - Matchers customizados
- `@testing-library/user-event` - Simulação de eventos de usuário

### MSW (Mock Service Worker)
- `msw` - Interceptação de requisições HTTP
- Handlers para auth, contracts, documents, users
- Suporte para erros de rede, validação, etc.

### Vitest
- Environment: `jsdom`
- Coverage Provider: `v8`
- Reporters: `text`, `json`, `html`, `lcov`, `cobertura`
- Global setup configurado

### React Query Testing
- QueryClient configurado para testes
- Cache desabilitado para testes determinísticos
- Mock providers disponíveis

## 📝 Como Escrever Testes

### 1. Componente Básico

```typescript
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/utils/test-utils';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render correctly', () => {
    const { getByText } = renderWithProviders(
      <Button>Click me</Button>
    );
    
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    const { getByRole } = renderWithProviders(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    await user.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Hook Customizado

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth Hook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeDefined();
    expect(result.current.loading).toBe(false);
  });
});
```

### 3. Utilitários

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate, validateEmail } from '@/utils';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01');
    const result = formatDate(date);
    
    expect(result).toBe('01/01/2024');
  });
});

describe('validateEmail', () => {
  it('should validate email format', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
```

### 4. API Testing com MSW

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContracts } from '@/hooks/useContracts';

describe('useContracts', () => {
  it('should fetch contracts successfully', async () => {
    const { result } = renderHook(() => useContracts());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.contracts).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    // MSW already configured to return error for specific endpoints
    const { result } = renderHook(() => useContracts());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBeDefined();
  });
});
```

## 🔧 Utilitários Disponíveis

### renderWithProviders
Renderiza componentes com todos os providers necessários:
- React Query QueryClient
- React Router BrowserRouter
- Error Boundaries

```typescript
import { renderWithProviders } from '@/test/utils/test-utils';

const { getByTestId } = renderWithProviders(<MyComponent />);
```

### Test Data Generators

```typescript
import { createMockData } from '@/test/utils/test-utils';

const user = createMockData.user();
const contract = createMockData.contract({ valor: 2000 });
```

### MSW Handlers

```typescript
import { server } from '@/test/mocks/server';

// Mock custom API response
server.use(
  http.get('/api/contracts', () => {
    return HttpResponse.json({ contracts: [] });
  })
);
```

### Console Mocking

```typescript
import { createConsoleSpy, restoreConsoleSpies } from '@/test/utils/test-utils';

const { warnSpy, errorSpy } = createConsoleSpy();
// ... run test ...
restoreConsoleSpies(warnSpy, errorSpy);
```

### Storage Mocking

```typescript
import { mockLocalStorage, mockSessionStorage } from '@/test/utils/test-utils';

const localStorage = mockLocalStorage();
const sessionStorage = mockSessionStorage();
```

## 🎯 Best Practices

### 1. Estrutura de Teste
- **Arrange**: Setup do estado inicial
- **Act**: Executar a ação a ser testada
- **Assert**: Verificar o resultado

### 2. Naming Conventions
- Use `describe` para agrupar testes relacionados
- Use `it` com frases descritivas
- Evite nomes genéricos como "should work"

### 3. Isolamento
- Cada teste deve ser independente
- Use `beforeEach`/`afterEach` para setup/cleanup
- Evite estado compartilhado entre testes

### 4. Test IDs
- Use `data-testid` para elementos complexos
- Evite seletores baseados em classes/CSS
- Use constantes do `TEST_IDS`

### 5. Async Testing
- Use `waitFor` para verificar mudanças de estado
- Use `findBy*` queries para elementos que aparecem dinamicamente
- Configure timeouts apropriadamente

## 🚦 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run coverage:report
```

### Quality Gates
O pipeline inclui:
- Linting (`npm run lint`)
- Type checking (`npm run type-check`)
- Coverage validation (`npm run validate-coverage`)
- Unit tests (`npm run test:unit`)

## 📊 Coverage Reports

### HTML Report
```bash
npm run test:coverage
# Open coverage/index.html
```

### JSON Report
Localizado em: `coverage/coverage-final.json`

### LCOV Report
Para integração com CI/CD: `coverage/lcov.info`

## 🔍 Troubleshooting

### Comum Issues

1. **Element not found**
   - Use `waitFor` para elementos dinâmicos
   - Verifique se o componente está renderizando
   - Use `findBy*` queries quando apropriado

2. **MSW not intercepting requests**
   - Verifique se o setup está no `setup.ts`
   - Confirme que os handlers estão configurados
   - Use `server.resetHandlers()` entre testes

3. **React Query cache issues**
   - QueryClient é recriado para cada teste
   - Use `queryClient.clear()` se necessário
   - Configure `gcTime: 0` para testes determinísticos

4. **Type errors in tests**
   - Configure `skipLibCheck: true` no tsconfig
   - Use `as any` para tipos complexos temporariamente
   - Adicione tipos customizados quando necessário

### Performance Tips

- Use `test.only` durante desenvolvimento
- Configure `testTimeout` adequadamente
- Use `vi.mock` para módulos pesados
- Configure `coverage.exclude` para arquivos não testáveis

## 📚 Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [React Query Testing](https://tanstack.com/query/v4/docs/guides/testing)

## 🎉 Conclusão

Este sistema de testes está pronto para produção com:
- ✅ Configuração otimizada
- ✅ 80% coverage mínimo
- ✅ MSW para API mocking
- ✅ Testing Library completa
- ✅ Custom utilities
- ✅ CI/CD ready
- ✅ Performance monitoring
- ✅ Quality gates