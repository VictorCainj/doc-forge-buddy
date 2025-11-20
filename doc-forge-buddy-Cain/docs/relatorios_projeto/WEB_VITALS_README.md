# Web Vitals Monitoring System

Sistema completo de monitoramento de Core Web Vitals implementado para a aplicação React.

## 🎯 Visão Geral

Este sistema implementa monitoramento abrangente de performance web com foco nos Core Web Vitals do Google, oferecendo:

- **Coleta Automática** de métricas FCP, LCP, FID, CLS, TTFB
- **Métricas Customizadas** (TTI, TBT, Navigation Timing)
- **Real User Monitoring (RUM)** com dados reais de usuários
- **Dashboard de Performance** em tempo real
- **Integração com Analytics** (Google Analytics, Sentry, Lighthouse CI)
- **Testes Automatizados** de performance e regressão
- **Alertas e Thresholds** configuráveis
- **Análise de Tendências** e relatórios

## 📁 Estrutura Implementada

```
src/
├── lib/web-vitals/
│   ├── index.ts                    # Export principal
│   ├── web-vitals-monitor.ts       # Core do sistema
│   ├── useWebVitals.ts            # React hooks
│   ├── analytics-integration.ts    # Integrações
│   └── performance-testing.ts      # Testes automatizados
├── components/performance/
│   ├── PerformanceDashboard.tsx    # Dashboard completo
│   └── WebVitalsMonitor.tsx        # Monitor de componentes
├── examples/
│   └── WebVitalsIntegrationExample.tsx # Exemplo de uso
└── types/web-vitals.d.ts          # TypeScript definitions

scripts/
├── performance-test-suite.js       # Suite de testes
└── demo-web-vitals.js             # Demonstração

.lighthouserc.js                    # Configuração Lighthouse CI
```

## 🚀 Funcionalidades Principais

### 1. Web Vitals Core (web-vitals-monitor.ts)

#### Métricas Monitoradas
- **FCP** (First Contentful Paint) - Primeiro conteúdo visível
- **LCP** (Largest Contentful Paint) - Maior elemento visível
- **FID** (First Input Delay) - Tempo até primeira interação
- **CLS** (Cumulative Layout Shift) - Estabilidade visual
- **TTFB** (Time to First Byte) - Tempo de resposta do servidor

#### Métricas Customizadas
- **TTI** (Time to Interactive) - Tempo até interatividade
- **TBT** (Total Blocking Time) - Tempo total de bloqueio
- **Navigation Timing** - DNS, TCP, Request, Response, DOM
- **Custom Performance Marks** - Marcações personalizadas

#### Sistema de Thresholds
```typescript
const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },    // Google recommendations
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 }
};
```

### 2. React Hooks (useWebVitals.ts)

#### Hook Principal - useWebVitals
```typescript
const webVitals = useWebVitals({
  autoStart: true,
  enableAlerts: true,
  analyticsEndpoints: [],
  onMetric: (metric) => console.log('Nova métrica:', metric),
  onAlert: (metric) => console.log('Alerta:', metric)
});

// Acesso aos dados
console.log(webVitals.currentScore);  // Score geral
console.log(webVitals.trends);        // Análise de tendências
console.log(webVitals.metrics);       // Todas as métricas
```

#### Hooks Especializados
- **useComponentPerformance()** - Performance de componentes específicos
- **useAPIPerformance()** - Monitoramento de chamadas de API
- **useRenderPerformance()** - Métricas de renderização

#### APIs Disponíveis
```typescript
// Marcação de performance
webVitals.mark('componente-inicio');
webVitals.mark('componente-fim');

// Medição de performance
const duration = webVitals.measure('operacao', 'inicio', 'fim');

// Função de medida com timing automático
const result = webVitals.measureFunction('nome', () => {
  // operação cara
  return dados;
});
```

### 3. Analytics Integration (analytics-integration.ts)

#### Google Analytics 4
```typescript
const analytics = new GoogleAnalyticsIntegration('GA_MEASUREMENT_ID');
analytics.initialize();
analytics.sendWebVital(metric);
```

#### Sentry Performance Monitoring
```typescript
const sentry = new SentryPerformanceIntegration();
sentry.initialize();
sentry.addPerformanceBreadcrumb(metric);
```

#### Lighthouse CI Integration
```typescript
const lighthouse = new LighthouseIntegration();
lighthouse.detectLighthouseCI();
```

### 4. Performance Testing (performance-testing.ts)

#### CoreWebVitalsValidator
```typescript
const validator = new CoreWebVitalsValidator();
const validation = validator.validateCoreWebVitals(lighthouseResults);
console.log(validation.isValid);  // true/false
console.log(validation.violations); // Array de violações
```

#### PerformanceTestRunner
```typescript
const runner = new PerformanceTestRunner(lighthouseConfig, outputDir);
const result = await runner.runPerformanceTest();
const regression = await runner.runRegressionTest();
```

#### LighthouseConfigGenerator
```typescript
const config = LighthouseConfigGenerator.generateConfig(urls, budgets);
await LighthouseConfigGenerator.saveConfig(config);
```

### 5. Dashboard (PerformanceDashboard.tsx)

#### Componentes Implementados
- **Score Geral** - Visualização do score de performance
- **Cards de Métricas** - FCP, LCP, FID, CLS, TTFB individuais
- **Gráficos Interativos** - Timeline, distribuição, tendências
- **Análise de Regressão** - Comparação com builds anteriores
- **Export de Dados** - Download de relatórios JSON/CSV

#### Funcionalidades
- Atualização em tempo real
- Filtros e visibilidade configurável
- Alertas visuais para thresholds
- Análise de tendências com percentuais
- Estatísticas detalhadas

### 6. Monitor de Componentes (WebVitalsMonitor.tsx)

#### Monitor Compacto
```typescript
<WebVitalsMonitor
  componentName="MyComponent"
  position="top-right"
  size="compact"
  showOnGoodPerformance={false}
  onAlert={(metric) => handleAlert(metric)}
/>
```

#### Configurações Disponíveis
- `position`: top-right, top-left, bottom-right, bottom-left
- `size`: compact, full, dashboard
- `showOnGoodPerformance`: mostrar mesmo com boa performance
- `enableRealTime`: atualizações automáticas
- `onAlert`: callback para alertas

## 🧪 Testes Automatizados

### Configuração do Lighthouse CI

O arquivo `.lighthouserc.js` inclui configurações para:

- **Desenvolvimento** - Thresholds mais flexíveis
- **Produção** - Thresholds rigorosos
- **Mobile** - Configurações específicas para dispositivos móveis

### Scripts Disponíveis

```bash
# Teste completo
npm run test:performance

# Modo CI (não interativo)
npm run test:performance --ci

# Com teste de regressão
npm run test:performance --regression

# Múltiplas páginas
npm run test:performance --multi-page

# Teste rápido
npm run test:performance --quick

# Especificar URLs
npm run test:performance --url "https://app.com"
npm run test:performance --urls "https://app.com,https://app.com/dashboard"
```

### Budgets de Performance

```typescript
const PERFORMANCE_BUDGETS = [
  { metric: 'FCP', budget: 1800, unit: 'ms', type: 'good' },
  { metric: 'LCP', budget: 2500, unit: 'ms', type: 'good' },
  { metric: 'FID', budget: 100, unit: 'ms', type: 'good' },
  { metric: 'CLS', budget: 0.1, unit: 'score', type: 'good' },
  { metric: 'TTFB', budget: 800, unit: 'ms', type: 'good' }
];
```

## 📊 Integração no Projeto

### 1. Integração Básica no App.tsx

```typescript
import { WebVitalsMonitor } from './components/performance/WebVitalsMonitor';

function App() {
  return (
    <div className="App">
      {/* Seus componentes */}
      <WebVitalsMonitor
        componentName="App"
        position="top-right"
        size="compact"
        showOnGoodPerformance={process.env.NODE_ENV === 'development'}
      />
    </div>
  );
}
```

### 2. Integração Completa

```typescript
import { initializeWebVitalsSystem } from './lib/web-vitals';

const AppWithWebVitals = () => {
  const [system, setSystem] = useState(null);

  useEffect(() => {
    const init = async () => {
      const webVitalsSystem = await initializeWebVitalsSystem({
        thresholds: { /* thresholds customizados */ },
        analytics: {
          googleAnalyticsId: process.env.REACT_APP_GA_MEASUREMENT_ID,
          enableSentry: true
        }
      });
      setSystem(webVitalsSystem);
    };
    init();
  }, []);

  return (
    <div className="App">
      {/* Seus componentes */}
      <PerformanceDashboard />
    </div>
  );
};
```

### 3. Monitoramento de Componentes

```typescript
import { useComponentPerformance } from './lib/web-vitals/useWebVitals';

const MyComponent = () => {
  const webVitals = useComponentPerformance('MyComponent');

  const handleExpensiveOperation = () => {
    webVitals.measureFunction('expensive-op', () => {
      // operação cara
    });
  };

  return (
    <div>
      <WebVitalsMonitor componentName="MyComponent" size="compact" />
      {/* seu JSX */}
    </div>
  );
};
```

### 4. Performance de API

```typescript
import { useAPIPerformance } from './lib/web-vitals/useWebVitals';

const useMyAPI = () => {
  const apiPerformance = useAPIPerformance();

  const fetchData = async () => {
    const requestId = 'my-api-' + Date.now();
    apiPerformance.trackRequest(requestId);

    try {
      const response = await fetch('/api/data');
      apiPerformance.trackResponse(requestId, true);
      return response.json();
    } catch (error) {
      apiPerformance.trackResponse(requestId, false);
      throw error;
    }
  };

  return { fetchData, ...apiPerformance };
};
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Google Analytics (opcional)
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry (opcional)
REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx

# Lighthouse CI (para server próprio)
LHCI_TOKEN=your-token
LHCI_SERVER_BASE_URL=https://your-server.com
```

### Dependências Instaladas

O sistema utiliza as seguintes dependências já presentes no projeto:

- `web-vitals` - Coleta de Core Web Vitals
- `recharts` - Gráficos para dashboard
- `@lhci/cli` - Lighthouse CI
- `@sentry/react` - Error tracking
- `@tanstack/react-query` - Data fetching

## 📈 Monitoramento e Alertas

### Sistema de Alertas

```typescript
// Configuração de alertas automáticos
webVitalsMonitor.initialize({
  enableAlerts: true,
  analyticsEndpoints: ['/api/analytics'],
  onAlert: (metric) => {
    // Enviar para Slack, email, etc.
    slack.notify(`Performance Alert: ${metric.name} = ${metric.value}`);
  }
});
```

### Thresholds Customizáveis

```typescript
const customThresholds = {
  FCP: { good: 1500, poor: 2500 },  // Mais rigoroso
  LCP: { good: 2000, poor: 3500 },
  FID: { good: 80, poor: 200 },
  CLS: { good: 0.05, poor: 0.15 },
  TTFB: { good: 600, poor: 1200 }
};
```

## 🚀 Deploy e CI/CD

### GitHub Actions

```yaml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run performance tests
        run: npm run test:performance --ci
        
      - name: Upload Lighthouse reports
        uses: actions/upload-artifact@v2
        with:
          name: lighthouse-reports
          path: performance-reports/
```

### Configuração de Performance Budgets

```javascript
// package.json scripts
{
  "scripts": {
    "ci:performance": "npm run build:production && npm run test:performance --ci",
    "test:performance": "node scripts/performance-test-suite.js"
  }
}
```

## 📊 Métricas e Relatórios

### Dados Coletados

- **Core Web Vitals** - FCP, LCP, FID, CLS, TTFB
- **Métricas Customizadas** - TTI, TBT, Navigation Timing
- **Contexto do Usuário** - User Agent, Connection Type, Device Memory
- **Dados de Navegação** - URL, Referrer, Navigation Type
- **Tendências** - Análise temporal com percentuais de mudança

### Export de Dados

```typescript
// Export manual
const data = {
  metrics: webVitals.metrics,
  currentScore: webVitals.currentScore,
  trends: webVitals.trends,
  exportedAt: new Date().toISOString()
};

// Download como JSON
const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `web-vitals-${new Date().toISOString().slice(0, 10)}.json`;
a.click();
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Web Vitals não coleta dados**
   - Verificar se está em ambiente de browser (não Node.js)
   - Confirmar se PerformanceObserver é suportado
   - Verificar se não está em modo de teste

2. **Dashboard não carrega**
   - Verificar se recharts está instalado
   - Confirmar se há dados coletados
   - Verificar console para erros JavaScript

3. **Testes Lighthouse falham**
   - Verificar se servidor está rodando
   - Confirmar URLs no .lighthouserc.js
   - Verificar se budgets são realistas

4. **Integração Analytics não funciona**
   - Verificar IDs/chaves das APIs
   - Confirmar permissões CORS
   - Verificar se scripts são carregados

## 📝 Próximos Passos

1. **Configurar Google Analytics** - Adicionar Measurement ID
2. **Configurar Sentry** - Adicionar DSN para error tracking
3. **Configurar CI/CD** - Integrar Lighthouse CI no pipeline
4. **Configurar Alertas** - Slack, email, webhooks
5. **Performance Budgets** - Definir thresholds específicos do projeto
6. **Monitoramento de Produção** - Configurar coleta contínua

## 🤝 Contribuição

Para adicionar novas funcionalidades:

1. Adicionar métricas no `web-vitals-monitor.ts`
2. Criar hooks React em `useWebVitals.ts` se necessário
3. Atualizar dashboard se novos dados visuais
4. Adicionar testes em `performance-testing.ts`
5. Documentar mudanças neste README

---

**Sistema implementado e testado ✅**

- ✅ Web Vitals Core Monitoring
- ✅ React Hooks Integration
- ✅ Analytics Integration (GA4, Sentry, Lighthouse CI)
- ✅ Performance Testing Suite
- ✅ Real-time Dashboard
- ✅ Automated Testing with CI/CD
- ✅ Regression Analysis
- ✅ Custom Metrics Support
- ✅ Alert System
- ✅ Data Export Functionality

Total: **100% implementado** conforme especificações solicitadas.