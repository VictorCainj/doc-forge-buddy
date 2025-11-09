# Performance Monitoring & Bundle Analysis Setup

Este documento descreve como o sistema de performance monitoring e bundle analysis foi configurado no projeto Doc Forge Buddy.

## 🎯 Visão Geral

O sistema implementa:
- **Core Web Vitals tracking** com web-vitals
- **Bundle analysis** com vite-bundle-visualizer e rollup-plugin-visualizer
- **Performance monitoring** integrado com Sentry
- **Monitor visual em desenvolvimento** para métricas em tempo real

## 📦 Dependências Adicionadas

```json
{
  "dependencies": {
    "web-vitals": "^4.2.4"
  },
  "devDependencies": {
    "rollup-plugin-visualizer": "^5.12.0",
    "vite-bundle-visualizer": "^1.3.0"
  }
}
```

## 🚀 Scripts de Bundle Analysis

### Scripts Disponíveis

```bash
# Análise básica de bundle
npm run analyze

# Análise após build
npm run analyze:dist

# Relatório em treemap
npm run bundle-report

# Análise detalhada (cria dist/bundle-analysis.html)
npm run build -- --mode analyze
```

## 📊 Core Web Vitals

### Métricas Monitoradas

| Métrica | Bom | Precisa Melhorar | Ruim | Descrição |
|---------|-----|------------------|------|-----------|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s | Largest Contentful Paint |
| **FID** | ≤ 100ms | 100ms - 300ms | > 300ms | First Input Delay |
| **INP** | ≤ 200ms | 200ms - 500ms | > 500ms | Interaction to Next Paint |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 | Cumulative Layout Shift |
| **FCP** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s | First Contentful Paint |
| **TTFB** | ≤ 800ms | 800ms - 1800ms | > 1800ms | Time to First Byte |

### Utilização

```typescript
import { 
  initPerformanceMonitoring,
  getPerformanceData,
  reportPerformanceData,
  performanceCollector 
} from '@/utils/performance';

// Inicializar (já feito no main.tsx)
initPerformanceMonitoring();

// Obter dados atuais
const data = getPerformanceData();
console.log(data.metrics);
console.log(data.summary);

// Reportar para console
reportPerformanceData('console');

// Reportar para Sentry (já configurado automaticamente)
reportPerformanceData('sentry');

// Monitorar mudanças
const unsubscribe = performanceCollector.subscribe((metric, rating) => {
  console.log(`${metric}: ${rating}`);
});
```

## 🔧 PerformanceMonitor Component

### Características

- **Visível apenas em desenvolvimento** por padrão
- **Interface visual** com Core Web Vitals em tempo real
- **Dois modos**: compacto e completo
- **Posicionamento configurável**: top-right, top-left, bottom-right, bottom-left
- **Tabbed interface**: Métricas e detalhes técnicos
- **Integração com Sentry**: Reporta problemas automaticamente

### Uso no Código

```tsx
import PerformanceMonitor from '@/components/PerformanceMonitor';

// Básico (apenas desenvolvimento)
<PerformanceMonitor />

// Configurado
<PerformanceMonitor 
  isDevelopment={process.env.NODE_ENV === 'development'}
  showOnGoodPerformance={true}
  position="top-right"
  size="compact"
/>
```

## 🛠️ Configuração Técnica

### main.tsx
```typescript
import { initPerformanceMonitoring, monitorBundleLoad } from './utils/performance';

// Inicializar Core Web Vitals
initPerformanceMonitoring();

// Monitor bundle loading (apenas desenvolvimento)
if (import.meta.env.DEV) {
  monitorBundleLoad();
}
```

### vite.config.ts
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    // Rollup visualizer para análise detalhada
    mode === 'analyze' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  // ... outras configurações
}));
```

## 📈 Integração com Sentry

### Breadcrumbs Automáticos
```typescript
// Métricas são reportadas automaticamente como breadcrumbs
Sentry.addBreadcrumb({
  category: 'performance',
  message: 'LCP: 2450ms (good)',
  level: 'info',
  data: { metric: 'LCP', value: 2450, rating: 'good' }
});
```

### Alertas Automáticos
```typescript
// Performance ruins são reportadas como warnings
Sentry.captureMessage(
  'Performance issue detected: LCP = 4200ms',
  'warning'
);
```

## 🔍 Análise de Bundle

### Relatórios Disponíveis

1. **Vite Bundle Visualizer**: Gráfico interativo de dependências
2. **Rollup Visualizer**: Análise detalhada de tamanho e gzip
3. **HTML Report**: `dist/bundle-analysis.html` (modo analyze)

### Interpretando Resultados

- **Chunks grandes (>300KB)**: Considere code splitting
- **Muitos chunks pequenos**: Considere bundling
- **Dependências não utilizadas**: Remover imports desnecessários

## 📊 Métricas de Performance

### Navigation Timing
```typescript
import { getNavigationTiming } from '@/utils/performance';

const timing = getNavigationTiming();
console.log({
  dns: timing.dns,
  tcp: timing.tcp,
  ttfb: timing.ttfb,
  dom: timing.dom,
  load: timing.load
});
```

### Custom Marks
```typescript
import { markPerformance } from '@/utils/performance';

// Marcar início de operação
markPerformance('operation-start');

// Marcar fim e medir
markPerformance('operation-end', 'operation-start');
```

## 🚨 Alertas e Monitoramento

### Configuração Automática
- **Performance ruim** → Sentry warning + console
- **Bundles grandes** → Sentry breadcrumb
- **Core Web Vitals** → Reporte automático ao Sentry

### Thresholds Configurados
```typescript
export const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
};
```

## 🔧 Troubleshooting

### PerformanceMonitor não aparece
- Verificar se `NODE_ENV === 'development'`
- Verificar se não há erros de console
- Verificar se os componentes UI estão disponíveis

### Métricas não aparecem
- Aguardar alguns segundos após carregamento
- Verificar se `web-vitals` está instalado
- Verificar se não há bloqueadores de anúncios

### Bundle analysis falhou
```bash
# Reinstalar dependências
npm install

# Verificar vite-bundle-visualizer
npm list vite-bundle-visualizer

# Rodar análise manualmente
npx vite-bundle-visualizer
```

## 📚 Referências

- [web-vitals](https://www.npmjs.com/package/web-vitals)
- [Core Web Vitals](https://web.dev/vitals/)
- [Sentry Performance](https://docs.sentry.io/performance/)
- [Vite Bundle Analysis](https://vitejs.dev/guide/migration.html#bundle-analysis)

---

**Configuração implementada em**: November 2025  
**Versão**: 1.0.0