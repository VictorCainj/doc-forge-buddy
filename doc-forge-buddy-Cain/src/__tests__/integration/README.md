# Testes de Integração - API e Backend

Este diretório contém os testes de integração para toda a camada de dados, APIs e integrações do sistema.

## 📁 Estrutura

```
src/__tests__/integration/
├── README.md                    # Este arquivo
├── setup.ts                     # Configuração global dos testes
├── api/                         # Testes de integração com APIs
│   └── integration.test.tsx
├── supabase/                    # Testes de integração com Supabase
│   └── contracts.integration.test.tsx
├── hooks/                       # Testes de integração com hooks
│   └── integration.test.tsx
├── mocks/                       # Mocks customizados
│   └── custom-mocks.ts
├── msw/                         # Mock Service Worker
│   ├── node.ts                  # MSW para ambiente Node.js
│   ├── browser.ts               # MSW para ambiente navegador
│   └── handlers.ts              # Handlers das APIs mockadas
└── utils/                       # Utilitários para testes
    ├── test-utils.tsx           # Utilitários para renderização
    ├── supabase-mocks.ts        # Mocks do Supabase
    ├── response-validators.ts   # Validadores de resposta
    └── test-data-generators.ts  # Geradores de dados de teste
```

## 🚀 Configuração e Execução

### Dependências Instaladas

```bash
# MSW para mock de APIs
pnpm add -D msw@2.2.14

# Faker para geração de dados de teste
pnpm add -D @faker-js/faker@8.4.1
```

### Scripts de Teste

```bash
# Executar todos os testes de integração
npm run test:integration

# Executar testes de integração em modo watch
npm run test:integration:watch

# Executar testes de integração com coverage
npm run test:integration:coverage

# Executar apenas um arquivo específico
npx vitest run src/__tests__/integration/api/integration.test.tsx
```

### Configuração do Vitest

O arquivo `vitest.integration.config.ts` configura especificamente o ambiente de testes de integração:

- **Timeout**: 10 segundos para testes de integração
- **Environment**: jsdom com setup específico
- **Coverage**: Configuração separada com thresholds menores
- **Pool**: Threads para isolamento

## 🔧 Componentes Principais

### 1. MSW (Mock Service Worker)

O MSW é configurado para interceptar requisições HTTP e fornecer respostas mockadas.

```typescript
// src/__tests__/integration/msw/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET /api/contracts - Listar contratos
  http.get('/api/contracts', ({ request }) => {
    // Lógica de mock da resposta
    return HttpResponse.json({
      contracts: mockContracts,
      total: mockContracts.length,
    });
  }),
];
```

### 2. Mocks do Supabase

Mocks específicos para integração com Supabase, incluindo auth e database.

```typescript
// src/__tests__/integration/utils/supabase-mocks.ts
export const configureSupabaseResponse = {
  authSuccess: (user) => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user } },
      error: null,
    });
  },
};
```

### 3. Validadores de Resposta

Garantem que as respostas das APIs estão no formato correto.

```typescript
// src/__tests__/integration/utils/response-validators.ts
export const validateContract = (contract: any): contract is ContractValidation => {
  // Validações rigorosas de estrutura e tipos
  return true;
};
```

### 4. Geradores de Dados

Utilizam Faker para gerar dados realistas para testes.

```typescript
// src/__tests__/integration/utils/test-data-generators.ts
export const generateContract = (overrides: Partial<any> = {}): any => {
  return {
    id: faker.string.uuid(),
    contractNumber: `CON-${faker.number.int()}-${faker.number.int()}`,
    clientName: faker.person.fullName(),
    // ... outros campos
  };
};
```

## 📋 Categorias de Teste

### 1. Testes de Integração com APIs

**Arquivo**: `src/__tests__/integration/api/integration.test.tsx`

- ✅ Busca de contratos com filtros
- ✅ Criação, atualização e exclusão
- ✅ Tratamento de erros (404, 500, timeout)
- ✅ Comportamento de cache
- ✅ Paginação
- ✅ Rate limiting

```typescript
describe('Contracts API Integration', () => {
  it('deve buscar lista de contratos com sucesso', async () => {
    const { result } = renderHookWithProviders(
      () => useContracts({ status: 'active' }),
      { queryWrapper: true }
    );
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    
    expectValidContractsList(result.current.data);
  });
});
```

### 2. Testes de Integração com Supabase

**Arquivo**: `src/__tests__/integration/supabase/contracts.integration.test.tsx`

- ✅ Integração com auth
- ✅ Operações de database
- ✅ Tratamento de erros de conexão
- ✅ Estados de loading
- ✅ Cache behavior

```typescript
describe('Supabase Integration Tests', () => {
  it('deve buscar contratos com sucesso', async () => {
    const mockResponse = { contracts: [...], total: 2 };
    // Mock da resposta e assertions
    expect(result.current.data).toEqual(mockResponse);
  });
});
```

### 3. Testes de Integração com Hooks

**Arquivo**: `src/__tests__/integration/hooks/integration.test.tsx`

- ✅ Hooks de autenticação
- ✅ Hooks de dados
- ✅ Estados de loading e erro
- ✅ Otimistic updates
- ✅ Error recovery

```typescript
describe('Hook API Integration', () => {
  it('deve integrar com auth do Supabase corretamente', async () => {
    // Teste completo de fluxo de autenticação
    expect(result.current.user).toEqual(mockUser);
  });
});
```

## 🎯 Cenários de Teste

### Cenários de Sucesso
- ✅ Login/logout bem-sucedidos
- ✅ CRUD de contratos
- ✅ Busca com filtros
- ✅ Paginação
- ✅ Cache de dados

### Cenários de Erro
- ❌ Erro 404 (recurso não encontrado)
- ❌ Erro 500 (erro do servidor)
- ❌ Erro de rede
- ❌ Timeout de requisição
- ❌ Rate limiting
- ❌ Validação de dados

### Cenários de Performance
- ⏱️ Latência de rede
- 📦 Cache behavior
- 🔄 Retry logic
- 📊 Carga de dados

## 🛠️ Utilitários

### Renderização de Hooks
```typescript
// Utils para renderização com providers
const { result } = renderHookWithProviders(
  () => useContracts(filters),
  { queryWrapper: true, fullWrapper: true }
);
```

### Configuração de Mocks
```typescript
// Helpers para configurar cenários específicos
configureSupabaseResponse.authSuccess();
configureSupabaseResponse.databaseError('Connection failed');
```

### Geração de Dados
```typescript
// Geradores para diferentes cenários
const contract = generateContract({ status: 'pending' });
const user = generateUser({ role: 'admin' });
```

## 🔍 Coverage e Relatórios

### Cobertura
- **Target**: 75% para testes de integração
- **Relatórios**: HTML, JSON, LCOV
- **Exclusão**: Mocks, handlers, utils de teste

### Execução
```bash
# Coverage específico para integração
npm run test:integration:coverage

# Relatório HTML
open coverage/integration-report.html
```

## 🐛 Debugging

### Modo Debug
```typescript
// Habilitar logs detalhados
process.env.DEBUG_TESTS = 'true';

// Usar test.only para focar em um teste específico
it.only('deve fazer X', async () => {
  // teste específico
});
```

### Logs Úteis
- ✅ MSW logs (mock server)
- ✅ Fetch logs (requisições)
- ✅ React Query logs (cache)
- ✅ Supabase logs (auth/database)

## 🔄 CI/CD

### Integração com Pipeline
```yaml
# .github/workflows/test-integration.yml
- name: Run Integration Tests
  run: npm run test:integration:coverage
```

### Validação
- ✅ Coverage ≥ 75%
- ✅ Todos os testes passando
- ✅ Tempo de execução < 10min

## 📝 Boas Práticas

### 1. Isolamento de Testes
- ✅ Limpar mocks entre testes
- ✅ Resetar estado global
- ✅ Usar dados consistentes

### 2. Assertions Rigorosas
- ✅ Validar estrutura de dados
- ✅ Verificar tipos
- ✅ Confirmar estados de UI

### 3. Performance
- ✅ Timeouts apropriados
- ✅ Parallel execution
- ✅ Cleanup automático

### 4. Manutenibilidade
- ✅ Mocks reutilizáveis
- ✅ Utilitários compartilhados
- ✅ Documentação clara

## 🎉 Conclusão

Os testes de integração fornecem confiança na interação entre:
- **Frontend ↔ Backend APIs**
- **Hooks ↔ Supabase**
- **Componentes ↔ Estado Global**

**Garantindo qualidade e confiabilidade em toda a camada de dados.**