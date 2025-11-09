# 🎯 Quality Gates & Coverage System

## 📋 Overview

Este projeto implementa um sistema completo de **Quality Gates** e **Coverage Reports** para manter alta qualidade do código e garantir que apenas código de qualidade atinja a produção.

## 🚦 Quality Gates

### Cobertura Mínima
- **Global**: 80% (statements, functions, lines, branches)
- **Componentes**: 90% (statements, functions, lines)
- **Utilitários Críticos**: 95%

### Validações Automáticas
- ✅ **Unit Tests**: 100% pass rate
- ✅ **TypeScript**: 0 compilation errors  
- ✅ **ESLint**: 0 warnings/errors
- ✅ **Security**: 0 vulnerabilidades críticas
- ✅ **Bundle Size**: < 500KB gzipped

## 🛠️ Scripts Disponíveis

### Testes e Coverage
```bash
# Executar todos os testes
npm run test:all

# Testes com coverage
npm run test:coverage

# Validar thresholds de coverage
npm run coverage:threshold

# Gerar relatórios avançados
npm run coverage:reports

# Gerar comentário para PR
npm run coverage:pr-comment
```

### Quality Gates
```bash
# Validação completa (equivalente ao CI)
npm run quality-gates

# Validação rápida
npm run validate:quality-gates

# CI completo
npm run ci:full
```

### Desenvolvimento
```bash
# Testes em modo watch
npm run test:watch

# Interface de testes
npm run test:ui

# E2E tests
npm run test:e2e
```

## 📊 Relatórios de Coverage

### Formatos Disponíveis
- **HTML**: `coverage/index.html` - Relatório detalhado interativo
- **Dashboard**: `coverage/reports/coverage-dashboard.html` - Visão simplificada
- **JSON**: `coverage/coverage-summary.json` - Dados estruturados
- **Markdown**: `coverage/reports/coverage-report.md` - Resumo formatado

### Como Visualizar
```bash
# Abrir relatório HTML no navegador
npm run coverage:report

# Gerar todos os relatórios
npm run coverage:reports
```

## 🔧 Configuração

### Vitest Config
O arquivo `vitest.config.ts` contém:
- Provider: V8 (built-in)
- Reporters: text, json, html, lcov
- Thresholds customizados por diretório
- Exclusões para arquivos de teste

### Thresholds por Componente
```typescript
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
    lines: 90
  }
}
```

## 🚀 CI/CD Integration

### GitHub Actions
O workflow `.github/workflows/quality-gates.yml` executa:
1. **Lint Check** - ESLint e format
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Com coverage
4. **Coverage Validation** - Thresholds
5. **E2E Tests** - Playwright
6. **Security Audit** - npm audit
7. **Upload to Codecov** - Para tracking

### Pre-commit Hooks
Automáticamente executa:
- Lint e format no código
- Testes unitários em arquivos modificados
- TypeScript check

## 📈 Monitoramento

### PR Comments
Automatically adiciona comentários em PRs com:
- Coverage summary
- File breakdown
- Quality gate status
- Links para relatórios

### Codecov
- Dashboard com histórico
- Comparação de branches
- Alertas de coverage decrease
- Integration com PRs

### Slack Notifications
- Falhas de quality gates
- Success/failure do build
- Coverage alerts

## 🎯 Success Criteria

Um feature está pronto quando:
- ✅ Todos os quality gates passam
- ✅ Coverage dentro dos thresholds
- ✅ 100% dos testes passam
- ✅ Code review aprovado
- ✅ Performance budgets atendido
- ✅ Security scan limpo

## ⚠️ Troubleshooting

### Coverage Baixo
```bash
# Verificar arquivos com coverage baixo
npm run coverage:reports

# Executar testes em modo UI
npm run test:ui

# Adicionar testes específicos
# Ver: src/components/**/*.test.tsx
```

### Quality Gates Falhando
```bash
# Verificar o que está falhando
npm run validate:quality-gates

# Corrigir linting
npm run lint:fix

# Corrigir TypeScript
npm run type-check
```

### E2E Tests Falhando
```bash
# Executar E2E com UI
npm run test:e2e:ui

# Executar headless
npm run test:e2e:headed
```

## 📊 Coverage by Component

| Componente | Coverage Required | Estratégia |
|------------|------------------|------------|
| Utils Core | 95% | Testes unitários completos |
| UI Components | 90% | Testes de renderização + interação |
| Business Logic | 85% | Testes de funcionalidades |
| API Layer | 80% | Testes de integração |
| Config Files | 70% | Validação básica |

## 🔗 Links Úteis

- [📊 Coverage Dashboard](./coverage/reports/coverage-dashboard.html)
- [📈 Codecov](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO)
- [🛠️ GitHub Actions](./.github/workflows/quality-gates.yml)
- [📋 Quality Gates Config](./docs/QUALITY_GATES.md)

## 🤝 Contributing

### Before Submitting PR
1. Execute: `npm run quality-gates`
2. Adicione testes para novas features
3. Mantenha coverage > 80%
4. Resolva todos os linting errors

### Coverage Guidelines
- **Adicione testes** para funcionalidades novas
- **Teste cenários de borda** (edge cases)
- **Mocks estratégicos** para APIs externas
- **Testes de integração** para fluxos completos

---

*Sistema de Quality Gates implementado em ${new Date().toLocaleDateString()}*