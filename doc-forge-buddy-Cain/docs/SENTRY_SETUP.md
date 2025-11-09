# Configuração do Sentry

Este documento descreve como configurar o Sentry para error tracking no projeto.

## Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```env
# Sentry DSN (necessário para error tracking)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Configurações opcionais para upload de source maps
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=doc-forge-buddy
VITE_SENTRY_AUTH_TOKEN=your-auth-token
```

## Como Obter as Credenciais

### 1. DSN (Data Source Name)
1. Acesse [sentry.io](https://sentry.io)
2. Crie uma conta ou faça login
3. Crie um novo projeto
4. Copie o DSN da página de configurações

### 2. Auth Token (apenas para source maps)
1. Vá em Settings > Account > API > Auth Tokens
2. Crie um novo token com permissões `project:releases`
3. Copie o token

### 3. Organização e Projeto
- Org: Nome da sua organização no Sentry
- Project: Nome do projeto criado

## O que o Sentry Captura

### Automaticamente
- ✅ Erros não tratados (unhandled errors)
- ✅ Rejeições de promises (unhandled promise rejections)
- ✅ Erros capturados pelo ErrorBoundary
- ✅ Session Replay (para debugging)

### Manualmente
Use as funções exportadas de `@/lib/sentry`:

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

## Performance

O Sentry inclui performance monitoring integrado:
- Traces de transações
- Performance metrics automáticas
- Breadcrumbs de navegação

## Desenvolvimento vs Produção

### Desenvolvimento
- Sentry **não** envia dados
- Apenas logs no console
- Ideal para desenvolvimento local

### Produção
- Sentry **envia** todos os erros e métricas
- Source maps são enviados para debugging
- Session Replay ativado

## Troubleshooting

### Erros não aparecem no Sentry
1. Verifique se `VITE_SENTRY_DSN` está configurado
2. Verifique se você está em modo produção
3. Verifique o console do navegador para erros de conexão

### Source maps não funcionam
1. Verifique as variáveis de ambiente de Sentry
2. Execute `npm run build` para gerar os source maps
3. Verifique o console do build para erros

## Integração com Error Boundary

O `ErrorBoundary` já está configurado para enviar erros ao Sentry automaticamente em produção.

## Teste Local

Para testar o Sentry localmente (apenas em produção):

```bash
# Build de produção
npm run build

# Servir localmente
npm run preview
```

Acesse a aplicação e cause um erro intencionalmente. O erro será enviado ao Sentry.

## Alertas

Configure alertas no Sentry:
1. Vá em Settings > Projects > [Seu Projeto] > Alerts
2. Configure regras de alerta (ex: mais de 10 erros em 5 minutos)
3. Adicione canais de notificação (email, Slack, etc)

## Custo

O Sentry oferece:
- **Free tier**: 5,000 eventos/mês
- **Team tier**: $26/mês para projetos pequenos
- Verifique [preços atuais](https://sentry.io/pricing/)
