# Sistema de Performance Monitoring para React

## Visão Geral

Este sistema completo de performance monitoring oferece uma solução robusta para monitorar, analisar e otimizar a performance de aplicações React. O sistema integra múltiplas tecnologias e ferramentas para fornecer insights detalhados sobre a performance da aplicação.

## Características Principais

### 🚀 Performance Monitoring em Tempo Real
- **Core Web Vitals**: LCP, FID, CLS, FCP, TTFB
- **Render Performance**: Tempo de render, número de renders
- **Memory Monitoring**: Detecção de memory leaks
- **API Performance**: Monitoramento de calls de rede
- **Lifecycle Tracking**: Tempo de mount/unmount de componentes

### 🔍 React Profiler Integration
- Integração nativa com React DevTools Profiler
- HOCs para wrapping automático de componentes
- Métricas avançadas de renderização
- Detecção de renders desnecessários

### 📊 Dashboard Interativo
- Interface visual em tempo real
- Gráficos de performance
- Alertas automáticos
- Relatórios exportáveis
- Histórico de métricas

### 🛠️ Chrome DevTools Extension
- Plugin para Chrome DevTools
- Integração com React DevTools
- Coleta automática de métricas
- Interface popup para visualização

### 🎯 Custom Hooks
- `useRenderTime()` - Medição de tempo de render
- `useMemoryUsage()` - Monitoramento de memória
- `useComponentDidMount()` - Performance de lifecycle
- `useApiPerformance()` - Métricas de API
- `usePerformanceMonitor()` - Monitor principal

## Estrutura do Sistema

```
src/
├── hooks/performance/          # Custom hooks de performance
│   ├── useRenderTime.ts       # Hook para tempo de render
│   ├── useMemoryUsage.ts      # Hook para uso de memória
│   ├── useComponentDidMount.ts # Hook para lifecycle
│   ├── useApiPerformance.ts   # Hook para APIs
│   ├── usePerformanceMonitor.ts # Hook principal
│   └── index.ts               # Exportações
├── components/performance/     # Componentes de performance
│   ├── PerformanceDashboard.tsx # Dashboard principal
│   ├── ReactProfilerWrapper.tsx # Wrapper React Profiler
│   ├── PerformanceDemo.tsx    # Componente de demonstração
│   ├── chrome-devtools-extension.ts # Extensão Chrome
│   └── index.ts               # Exportações
└── utils/performance/          # Utilitários (se necessário)
```

## Como Usar

### 1. Instalação e Setup

```typescript
// Importe os hooks no seu componente
import { 
  useRenderTime,
  useMemoryUsage,
  usePerformanceMonitor,
  PerformanceDashboard,
  ReactProfilerWrapper
} from '@/components/performance';
```

### 2. Hook Básico de Render Time

```typescript
import React from 'react';
import { useRenderTime } from '@/hooks/performance';

const MyComponent: React.FC = () => {
  // Monitora tempo de render automaticamente
  const renderData = useRenderTime('MyComponent', {
    threshold: 16, // 16ms para 60fps
    onSlowRender: (data) => {
      console.log('Componente lento:', data);
    }
  });

  return (
    <div>
      <p>Tempo de render: {renderData.renderTime.toFixed(2)}ms</p>
      <p>Número de renders: {renderData.renderCount}</p>
    </div>
  );
};
```

### 3. Monitoring de Memória

```typescript
import { useMemoryUsage } from '@/hooks/performance';

const MemoryMonitoredComponent: React.FC = () => {
  const memoryData = useMemoryUsage({
    warningThreshold: 80, // 80% do heap limit
    onMemoryLeak: (data) => {
      console.warn('Memory leak detectado!', data);
    }
  });

  return (
    <div>
      <p>Memória usada: {memoryData?.usedMB?.toFixed(2)} MB</p>
      <p>Pressão: {memoryData?.memoryPressure}</p>
    </div>
  );
};
```

### 4. Performance Dashboard

```typescript
import { PerformanceDashboard } from '@/components/performance';

const App: React.FC = () => {
  return (
    <div>
      {/* Sua aplicação */}
      
      {/* Dashboard de performance (modal/overlay) */}
      <PerformanceDashboard
        componentName="MyApp"
        showRealTimeData={true}
        autoRefresh={true}
        enableAlerts={true}
        position="overlay"
      />
    </div>
  );
};
```

### 5. React Profiler Integration

```typescript
import { ReactProfilerWrapper } from '@/components/performance';

const App: React.FC = () => {
  return (
    <ReactProfilerWrapper
      id="MyApp"
      enableAdvancedMetrics={true}
      threshold={20}
      onThresholdExceeded={(data) => {
        console.warn('Render lento detectado:', data);
      }}
    >
      {/* Sua aplicação será monitorada */}
      <MyApp />
    </ReactProfilerWrapper>
  );
};
```

### 6. HOCs para Monitoring Automático

```typescript
import { withRenderTime, withPerformanceMonitoring } from '@/hooks/performance';

const OriginalComponent: React.FC = () => {
  return <div>Conteúdo do componente</div>;
};

// Wrap com monitoring
const MonitoredComponent = withRenderTime(
  OriginalComponent,
  'OriginalComponent',
  { threshold: 15 }
);

// Ou com monitoring completo
const FullyMonitoredComponent = withPerformanceMonitoring(
  OriginalComponent,
  { 
    componentName: 'OriginalComponent',
    enableRenderTracking: true,
    enableMemoryTracking: true 
  }
);
```

### 7. API Performance Monitoring

```typescript
import { useApiPerformance } from '@/hooks/performance';

const ApiComponent: React.FC = () => {
  const { fetchWithMonitoring, stats } = useApiPerformance({
    slowThreshold: 1000, // 1 segundo
    onSlowCall: (data) => {
      console.warn('API lenta:', data.url, data.duration);
    }
  });

  const makeApiCall = async () => {
    const response = await fetchWithMonitoring('/api/data');
    return response.json();
  };

  return (
    <div>
      <p>Calls de API: {stats.totalCalls}</p>
      <p>Tempo médio: {stats.averageResponseTime.toFixed(0)}ms</p>
      <p>Taxa de erro: {stats.errorRate.toFixed(1)}%</p>
    </div>
  );
};
```

## Configurações Avançadas

### Thresholds de Performance

```typescript
const performanceConfig = {
  renderThreshold: 16,      // 16ms para 60fps
  mountThreshold: 100,      // 100ms para mount
  apiThreshold: 1000,       // 1s para API calls
  memoryWarning: 80,        // 80% do heap limit
  memoryCritical: 90        // 90% do heap limit
};
```

### Alerts Customizados

```typescript
const MyComponent: React.FC = () => {
  const performanceData = usePerformanceMonitor({
    componentName: 'MyComponent',
    onPerformanceIssue: (issue) => {
      // Enviar para analytics
      analytics.track('performance_issue', {
        type: issue.type,
        message: issue.message,
        component: issue.data.componentName
      });
      
      // Ou mostrar notificação
      showNotification(`Performance issue: ${issue.message}`);
    }
  });
  
  return <div>{/* Seu conteúdo */}</div>;
};
```

### Export de Dados

```typescript
const ExportPerformanceData: React.FC = () => {
  const performanceData = usePerformanceMonitor();
  
  const exportData = () => {
    const report = performanceData.getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
  };
  
  return <button onClick={exportData}>Export Report</button>;
};
```

## Chrome DevTools Extension

### Instalação

1. Compile a extensão:
```bash
# A extensão está em src/components/performance/chrome-devtools-extension.ts
# Você precisa criar os arquivos de extensão manualmente ou usar uma ferramenta de build
```

2. Carregue a extensão no Chrome:
   - Abra `chrome://extensions/`
   - Ative "Developer mode"
   - Clique em "Load unpacked"
   - Selecione a pasta da extensão

### Funcionalidades

- **Popup Interface**: Visualização rápida das métricas
- **Badge Indicator**: Contador de issues no ícone da extensão
- **Data Export**: Exportação de dados de performance
- **Real-time Monitoring**: Coleta automática de métricas

## Métricas Coletadas

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: Tempo de carregamento do maior elemento
- **FID (First Input Delay)**: Delay da primeira interação
- **CLS (Cumulative Layout Shift)**: Estabilidade visual
- **FCP (First Contentful Paint)**: Primeiro paint de conteúdo
- **TTFB (Time to First Byte)**: Tempo até o primeiro byte

### Performance de Componentes
- **Render Time**: Tempo de renderização
- **Mount Time**: Tempo de montagem
- **Update Count**: Número de atualizações
- **Lifecycle Phases**: Tempos de cada fase
- **Memory Usage**: Uso de memória

### API Performance
- **Response Time**: Tempo de resposta
- **Error Rate**: Taxa de erro
- **Throughput**: Chamadas por minuto
- **P50, P90, P99**: Percentis de performance

## Boas Práticas

### 1. Thresholds Apropriados
- Render: 16ms (60fps)
- Mount: 100ms
- API: 1000ms
- Memory warning: 80%

### 2. Monitoring Contextual
- Ative monitoring apenas em componentes críticos
- Desabilite em produção se não necessário
- Use thresholds adequados para cada tipo de componente

### 3. Performance Budgets
```typescript
const performanceBudgets = {
  renderTime: 16,        // ms
  mountTime: 100,        // ms
  apiResponse: 1000,     // ms
  memoryUsage: 100,      // MB
  errorRate: 5           // %
};
```

### 4. Continuous Integration
- Execute tests de performance em CI/CD
- Monitore regressões de performance
- Defina budgets e gates de qualidade

## Troubleshooting

### Problemas Comuns

1. **Performance Observer não suportado**
   - Verifique se o navegador suporta a API
   - Fallback para métodos alternativos

2. **Alta sobrecarga de performance**
   - Ajuste a frequência de sampling
   - Desabilite monitoring desnecessário

3. **Memory leaks no monitoring**
   - Limpe históricos periodicamente
   - Use thresholds para evitar coleta excessiva

### Debug Mode

```typescript
// Ative modo debug para logs detalhados
localStorage.setItem('perf_debug', 'true');
```

## Integração com Outras Ferramentas

### Sentry Integration
```typescript
import * as Sentry from '@sentry/react';

const performanceData = usePerformanceMonitor({
  onPerformanceIssue: (issue) => {
    Sentry.captureMessage('Performance Issue', {
      level: 'warning',
      extra: issue
    });
  }
});
```

### Analytics Integration
```typescript
const performanceData = usePerformanceMonitor({
  onPerformanceIssue: (issue) => {
    analytics.track('performance_degradation', {
      component: issue.data.componentName,
      type: issue.type,
      severity: 'high'
    });
  }
});
```

## Componentes de Demonstração

### PerformanceDemo Component

```typescript
import { PerformanceDemo } from '@/components/performance';

const App: React.FC = () => {
  return <PerformanceDemo />;
};
```

O componente `PerformanceDemo` fornece uma interface completa para testar e demonstrar todas as funcionalidades do sistema de performance monitoring.

## Conclusão

Este sistema de performance monitoring oferece uma solução completa para monitorar e otimizar a performance de aplicações React. Com hooks customizados, dashboard interativo, integração com React Profiler e extensão para Chrome DevTools, você tem todas as ferramentas necessárias para manter sua aplicação performática.

### Próximos Passos

1. **Integração em produção**: Adicione monitoring aos componentes críticos
2. **Customização**: Ajuste thresholds e configurações conforme sua aplicação
3. **Automação**: Configure CI/CD para monitorar regressões
4. **Team adoption**: Treine a equipe sobre as ferramentas e métricas

### Recursos Adicionais

- [React Profiler Documentation](https://react.dev/reference/react/Profiler)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [Core Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)