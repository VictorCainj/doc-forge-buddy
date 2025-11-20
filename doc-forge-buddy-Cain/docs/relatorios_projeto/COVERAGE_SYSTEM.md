# Sistema de Coverage Reports e Quality Gates

## Visão Geral

Este documento descreve o sistema completo de coverage reports e quality gates implementado no projeto Doc Forge Buddy.

## Configuração Implementada

### 1. Configuração do Vitest (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './src/test/setup.ts'
    ],
    css: false,
    exclude: [
      'node_modules/',
      'dist/',
      '.vercel/',
      'coverage/',
      '**/*.d.ts',
      '**/*.config.ts',
      '**/*.config.js',
      'src/stories/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/components/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/utils/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      exclude: [
        'node_modules/',
        'dist/',
        '.vercel/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.js',
        'src/test/**',
        'src/stories/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2. Scripts de Quality Gates (package.json)

```json
{
  "scripts": {
    "test:ci": "vitest run --coverage --reporter=verbose",
    "test:coverage": "vitest run --coverage",
    "quality-gates": "npm run test:ci && npm run validate-coverage && npm run lint",
    "validate-coverage": "node scripts/validate-coverage.js"
  }
}
```

### 3. Thresholds Configurados

| Área | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| **Global** | 80% | 80% | 80% | 80% |
| **Components** | 90% | 90% | 90% | 90% |
| **Utils** | 85% | 85% | 85% | 85% |

## Como Usar

### Executar Testes com Coverage

```bash
# Executar todos os testes com coverage
npm run test:ci

# Executar apenas coverage
npm run test:coverage

# Executar quality gates completo
npm run quality-gates
```

### Validação de Coverage

O sistema automaticamente valida se o coverage atinge os thresholds configurados:

1. **Global**: 80% para todas as métricas
2. **Components**: 90% (maior rigor para componentes UI)
3. **Utils**: 85% (rigor intermediário para utilitários)

### Relatórios Gerados

- **Console**: Resumo em tempo real
- **HTML**: `coverage/index.html` (relatório detalhado)
- **JSON**: `coverage/coverage-final.json` (para integração CI/CD)
- **LCOV**: `coverage/lcov.info` (para ferramentas de cobertura)

## Estrutura de Testes

### Localização dos Testes

- **Unitários**: `src/**/*.test.{ts,tsx}`
- **Integração**: `src/**/__tests__/integration/**/*.{ts,tsx}`
- **Componentes**: `src/components/**/__tests__/**/*.{tsx}`
- **Hooks**: `src/**/hooks/**/__tests__/**/*.{ts,tsx}`

### Setup de Testes

- **Arquivo principal**: `src/test/setup.ts`
- **Mocks**: Configurações para APIs do browser
- **Jsdom**: Ambiente de teste que simula o DOM

## Quality Gates

O script `quality-gates` executa sequencialmente:

1. **Testes + Coverage**: `npm run test:ci`
2. **Validação de Coverage**: `npm run validate-coverage`
3. **Linting**: `npm run lint`

## Problemas Conhecidos

### 1. Descoberta de Testes
- Alguns arquivos de teste podem não ser descobertos devido a padrões de exclusão
- Solução: Verificar configuração `exclude` no `vitest.config.ts`

### 2. Erros de Dependência
- 37+ erros de `webidl-conversions` podem afetar a execução
- Solução: Verificar versões compatíveis das dependências

### 3. Timeout em Testes
- Testes podem fazer timeout em ambientes com muitos erros
- Solução: Ajustar `testTimeout` se necessário

## Próximos Passos

1. **Resolver erros de webidl-conversions**: Verificar e atualizar dependências
2. **Otimizar descoberta de testes**: Ajustar padrões de include/exclude
3. **Implementar validação automatizada**: Script de validação de coverage
4. **Configurar CI/CD**: Integração com GitHub Actions ou similar

## Arquivos de Teste Identificados

```
src/test/simple.test.ts
src/__tests__/AppStore.test.ts
src/__tests__/components/DemoTest.test.tsx
src/__tests__/features/useDocumentFormState.test.ts
src/__tests__/features/useTermoLocatario.test.ts
src/__tests__/hooks/useAuth.test.tsx
src/__tests__/hooks/useContractData.test.tsx
src/__tests__/hooks/useDocumentGeneration.test.tsx
src/__tests__/integration/**/*.test.tsx
src/__tests__/utils/**/*.test.ts
src/components/__tests__/**/*.tsx
src/features/**/__tests__/**/*.test.tsx
```

## Conclusão

O sistema de coverage e quality gates está configurado e pronto para uso. Os thresholds estão definidos adequadamente:
- **Global**: 80% (acessível)
- **Components**: 90% (rigoroso para UI)
- **Utils**: 85% (equilibrado)

Com a resolução dos problemas de dependência, o sistema funcionará completamente.