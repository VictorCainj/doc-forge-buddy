# Guia de Monitoramento

Este guia descreve o sistema de monitoramento implementado no projeto.

## Visão Geral

O projeto utiliza múltiplas ferramentas para monitorar performance, erros e disponibilidade:

- **Sentry**: Error tracking e performance monitoring
- **Lighthouse CI**: Testes de performance automáticos
- **Codecov**: Cobertura de código

## Sentry

### Configuração

O Sentry está configurado em `src/lib/sentry.ts` e é inicializado em `src/main.tsx`.

```typescript
import { initSentry } from '@/lib/sentry';

// Inicializar na aplicação
initSentry();
```

### O que é Monitorado

#### Automaticamente
- ✅ Erros não tratados (unhandled errors)
- ✅ Rejeições de promises (unhandled promise rejections)
- ✅ Erros capturados pelo ErrorBoundary
- ✅ Performance transactions
- ✅ Session Replay (em produção)

#### Manualmente

```typescript
import { captureException, captureMessage, setUser } from '@/lib/sentry';

// Capturar exceção
try {
  riskyOperation();
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// Capturar mensagem
captureMessage('Algo importante aconteceu', 'info');

// Definir usuário
setUser({ id: '123', email: 'user@example.com' });
```

### Ambientes

- **Desenvolvimento**: Sentry não envia dados (apenas logs no console)
- **Produção**: Sentry envia todos os erros e métricas

### Acessar Dashboard

1. Acesse [sentry.io](https://sentry.io)
2. Faça login
3. Selecione o projeto "Doc Forge Buddy"
4. Explore erros, performance e session replays

### Configurar Alertas

1. Vá em Settings > Projects > Doc Forge Buddy > Alerts
2. Configure regras (ex: mais de 10 erros em 5 minutos)
3. Adicione canais de notificação (email, Slack, etc)

## Lighthouse CI

### Configuração

O Lighthouse CI está configurado em `.lighthouserc.js` e executa automaticamente em PRs.

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173'],
      startServerCommand: 'npm run preview',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // ...
      },
    },
  },
};
```

### Executar Localmente

```bash
# Build da aplicação
npm run build

# Executar Lighthouse CI
npm run lighthouse
```

### Métricas Monitoradas

- **Performance**: Tempo de carregamento, FCP, LCP, TTI, TBT
- **Accessibility**: Conformidade com WCAG
- **Best Practices**: Boas práticas web
- **SEO**: Otimização para motores de busca

### Thresholds

Atualmente configurados:
- Performance: ≥ 0.85 (85%)
- Accessibility: ≥ 0.9 (90%)
- Best Practices: ≥ 0.9 (90%)
- SEO: ≥ 0.9 (90%)

## Codecov

### Cobertura Atual

A cobertura de código é monitorada via Codecov e exibida no README.

### Verificar Cobertura Local

```bash
# Executar testes com cobertura
npm run test:coverage

# Verificar relatório
# Abra coverage/index.html no navegador
```

### Thresholds

Configurado em `vitest.config.ts`:
- Statements: ≥ 70%
- Branches: ≥ 70%
- Functions: ≥ 70%
- Lines: ≥ 70%

## Logs

### Estrutura de Logs

```typescript
import { logger } from '@/utils/logger';

// Diferentes níveis
logger.debug('Informação de debug');
logger.info('Informação geral');
logger.warn('Aviso');
logger.error('Erro');
```

### Logs no Console

Em desenvolvimento, os logs são exibidos no console com cores:
- 🔵 Debug
- 🟢 Info
- 🟡 Warn
- 🔴 Error

## Performance Monitoring

### Web Vitals

As Web Vitals são monitoradas automaticamente:

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)

### Custom Performance Marks

```typescript
// Medir tempo de operação
performance.mark('operation-start');
// ... operação
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');
```

## Troubleshooting

### Erros não aparecem no Sentry

1. Verificar se `VITE_SENTRY_DSN` está configurado
2. Verificar se está em modo produção
3. Verificar console do navegador

### Lighthouse CI falha

1. Verificar se o build está funcionando
2. Verificar se o servidor está acessível
3. Verificar logs do GitHub Actions

### Codecov não atualiza

1. Verificar se `CODECOV_TOKEN` está configurado
2. Verificar se os testes estão passando
3. Verificar logs do GitHub Actions

## Dashboards

### Resumo

| Ferramenta | Status | Link |
|------------|--------|------|
| Sentry | ✅ Ativo | [sentry.io](https://sentry.io) |
| Lighthouse CI | ✅ Ativo | GitHub Actions |
| Codecov | ✅ Ativo | [codecov.io](https://codecov.io) |

## Próximos Passos

- [ ] Implementar APM (Application Performance Monitoring)
- [ ] Configurar alertas proativos
- [ ] Implementar custom metrics
- [ ] Dashboard unificado de monitoramento

## Recursos

- [Sentry Docs](https://docs.sentry.io/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Codecov](https://docs.codecov.com/)
- [Web Vitals](https://web.dev/vitals/)
