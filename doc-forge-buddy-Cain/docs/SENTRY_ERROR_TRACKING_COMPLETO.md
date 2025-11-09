# Sistema Completo de Error Tracking com Sentry

Este documento descreve o sistema completo de error tracking implementado, que inclui monitoring robusto, analytics, alerting e integração com performance.

## 📋 Visão Geral

O sistema implementa:

1. **Sentry Configuration** - Configuração avançada com filtering de dados sensíveis
2. **Error Boundaries Hierárquicos** - Global, Route-level e Feature-specific
3. **Custom Error Tracking** - API errors, User actions, Performance issues, Memory leaks
4. **Error Categorization** - JavaScript, API, Network, Validation, Performance, etc.
5. **Alerting e Notifications** - Slack, Email, Dashboard, Webhook, Teams
6. **Error Analytics** - Frequência, Impacto do usuário, Tendências, Resolução
7. **Performance Integration** - Web Vitals, Trace propagation, Session replay

## 🚀 Implementação

### 1. Configuração Base

O sistema está integrado no `AppProviders` e ativa automaticamente:

```typescript
// Em src/providers/AppProviders.tsx
<ErrorMonitoringProvider>
  <QueryClientProvider client={queryClient}>
    <AppStoreProvider>
      {/* ... outros providers */}
    </AppStoreProvider>
  </QueryClientProvider>
  <ErrorMonitoringStatus /> {/* Indicador visual em dev */}
</ErrorMonitoringProvider>
```

### 2. Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Sentry Configuration
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=your-project
VITE_SENTRY_AUTH_TOKEN=your-auth-token

# Alerting Configuration
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
VITE_ALERT_WEBHOOK_URL=https://your-webhook.com/alerts
VITE_TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
VITE_EMAIL_ALERT_ENABLED=false
VITE_EMAIL_ALERT_TO=alerts@company.com
```

### 3. Uso Básico

#### Tracking de Erros

```typescript
import { trackError, trackApiError, trackValidationError } from '@/lib/errorTracking';

// Erro simples
try {
  riskyOperation();
} catch (error) {
  trackError(error, {
    category: 'javascript',
    severity: 'high',
    source: 'component',
    userAction: 'button_click',
    additionalData: { userId: '123' }
  });
}

// API Error
trackApiError('/api/users', 'GET', 500, 1200, error);

// Validation Error
trackValidationError('email', userInput, 'invalid_format');
```

#### Performance Monitoring

```typescript
import { trackPerformance, trackUserInteraction } from '@/lib/performanceIntegration';

// Metric personalizada
trackPerformance({
  name: 'CUSTOM_METRIC',
  value: 150,
  unit: 'ms',
  timestamp: new Date(),
  tags: { operation: 'data_processing' }
});

// User interaction
trackUserInteraction('click', 'submit_button');
```

#### Error Boundaries

```typescript
// Global Boundary
<GlobalErrorBoundary>
  <App />
</GlobalErrorBoundary>

// Route Boundary
<RouteErrorBoundary routeName="Dashboard" allowRecovery={true}>
  <Dashboard />
</RouteErrorBoundary>

// Feature Boundary
<FeatureErrorBoundary 
  featureName="UserStats" 
  compact={true}
  allowRecovery={true}
>
  <UserStatistics />
</FeatureErrorBoundary>
```

## 📊 Dashboard de Monitoring

Acesse o dashboard em `/monitoring` (ou crie uma rota):

```typescript
import { ErrorMonitoringDashboard } from '@/components/monitoring/ErrorMonitoringDashboard';

function MonitoringPage() {
  return <ErrorMonitoringDashboard />;
}
```

### Funcionalidades do Dashboard:

- **Métricas em Tempo Real**: Total de erros, taxa de erro, erros críticos
- **Análise de Categorias**: Top categorias de erro com tendências
- **Performance Metrics**: Web Vitals, tempo de resposta, uso de memória
- **User Sessions**: Sessões ativas, interações, erros por sessão
- **Trend Analysis**: Análise de 1d/7d/30d com insights
- **Active Alerts**: Alertas em tempo real com resolução

## 🚨 Sistema de Alertas

### Configuração de Thresholds

```typescript
const ALERT_THRESHOLDS = {
  critical: 1,    // 1 erro crítico
  high: 10,       // 10 erros altos
  medium: 50,     // 50 erros médios
  low: 200,       // 200 erros baixos
  error_rate: 5,  // 5% taxa de erro
  response_time: 5000, // 5s tempo de resposta
  memory_usage: 85,    // 85% uso de memória
};
```

### Canais de Notificação

1. **Slack**: Via webhook para canal específico
2. **Email**: Para equipe técnica
3. **Dashboard**: Notificações em tempo real
4. **Webhook**: Integração com sistemas externos
5. **Teams**: Notificações no Microsoft Teams

## 📈 Analytics Avançados

### Métricas Disponíveis

- **Error Rate**: Erros por hora
- **MTTR**: Mean Time To Resolution
- **User Impact Score**: Score de 0-100 baseado no impacto
- **Resolution Rate**: Percentual de erros resolvidos
- **Trend Analysis**: Análise de tendências com insights

### Relatórios

```typescript
import { exportAnalyticsReport, getTrendAnalysis } from '@/lib/errorAnalytics';

// Gerar relatório
const report = exportAnalyticsReport();

// Análise de tendências
const analysis7d = getTrendAnalysis('7d');
```

## 🔧 Configuração Avançada

### Personalização de Filtering

```typescript
// Em sentry.config.ts
beforeSend: (event, hint) => {
  // Filtrar dados sensíveis
  if (event.user) {
    delete event.user.email;
  }
  
  // Filtrar erros benignos
  if (event.exception) {
    const message = hint.originalException?.message;
    if (message?.includes('Navigation cancelled')) {
      return null;
    }
  }
  
  return event;
}
```

### Custom Error Categories

```typescript
// Adicionar novos padrões de categorização
const ERROR_PATTERNS = {
  custom_category: [
    /Your custom error pattern/i,
  ],
};
```

## 🛠️ Desenvolvimento e Debug

### Status Indicator

Em desenvolvimento, um indicador aparece no canto inferior direito mostrando:
- Status do sistema (healthy/warning/error)
- Contadores de erros, alertas e métricas
- Link para dashboard

### Logs Detalhados

```typescript
// Os logs incluem contexto rico
log.error('🔴 Error caught:', {
  category: 'api',
  severity: 'high',
  component: 'UserForm',
  userId: '123',
  sessionId: 'abc',
  errorId: 'err_456',
});
```

### Teste de Erros

```typescript
// Forçar erro para teste
if (import.meta.env.DEV) {
  setTimeout(() => {
    throw new Error('Test error for Sentry');
  }, 5000);
}
```

## 🔍 Monitoring de Performance

### Web Vitals Automáticos

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)

### Resource Monitoring

- Slow resources (>1s)
- Memory usage
- Network errors
- JavaScript errors

### Session Tracking

- User sessions automatically tracked
- Page views and interactions
- Error impact per session
- Device and performance info

## 📱 Integração com React

### Hook Personalizado

```typescript
function useMyComponent() {
  const { trackError, trackPerformance } = useErrorMonitoringInComponent('MyComponent');
  
  const myFunction = async () => {
    const start = performance.now();
    try {
      // Your logic
    } catch (error) {
      trackError(error, { userAction: 'my_action' });
    } finally {
      trackPerformance('my_function', performance.now() - start);
    }
  };
  
  return { myFunction };
}
```

### Error Boundaries Hierárquicos

1. **Global**: Captura erros não tratados da aplicação
2. **Route**: Captura erros de páginas específicas
3. **Feature**: Captura erros de componentes específicos

Cada nível tem estratégias de recovery diferentes.

## 🚀 Deploy e Produção

### Checklist de Produção

- [ ] Configurar DSN do Sentry
- [ ] Configurar webhooks de alerting
- [ ] Definir thresholds de alertas
- [ ] Testar error boundaries
- [ ] Verificar performance monitoring
- [ ] Configurar dashboards

### Métricas de Sucesso

- **Error Rate**: < 1% da taxa de erro
- **MTTR**: < 30 minutos tempo médio de resolução
- **User Impact**: < 50 score de impacto
- **Availability**: > 99.9% uptime

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erros não aparecem no Sentry**
   - Verificar DSN e credenciais
   - Verificar se está em produção
   - Verificar CORS settings

2. **Performance metrics não funcionam**
   - Verificar se PerformanceObserver é suportado
   - Verificar se não há bloqueadores

3. **Alertas não são enviados**
   - Verificar configuração de webhooks
   - Verificar thresholds
   - Verificar cooldown settings

### Debug Avançado

```typescript
// Ativar debug em desenvolvimento
if (import.meta.env.DEV) {
  (window as any).Sentry?.init({
    debug: true,
  });
}
```

## 📚 Recursos Adicionais

### Arquivos Principais

- `src/lib/sentry.config.ts` - Configuração do Sentry
- `src/lib/errorTracking.ts` - Sistema de tracking
- `src/lib/alerting.ts` - Sistema de alertas
- `src/lib/errorAnalytics.ts` - Analytics avançado
- `src/lib/performanceIntegration.ts` - Performance monitoring
- `src/providers/ErrorMonitoringProvider.tsx` - Provider principal
- `src/components/monitoring/ErrorMonitoringDashboard.tsx` - Dashboard

### Exemplos de Uso

Ver `src/examples/ErrorTrackingExamples.tsx` para exemplos completos de uso.

---

## 🎯 Conclusão

Este sistema fornece um monitoring completo e robusto para aplicações React, com:

- ✅ **Error Tracking** completo e categorizado
- ✅ **Performance Monitoring** automatizado
- ✅ **Alerting** em tempo real
- ✅ **Analytics** avançados
- ✅ **Dashboard** de monitoramento
- ✅ **Error Boundaries** hierárquicos
- ✅ **User Action Tracking**
- ✅ **Memory Leak Detection**
- ✅ **Session Replay** e context enrichment

O sistema é configurado para funcionar automaticamente e pode ser expandido conforme necessário.