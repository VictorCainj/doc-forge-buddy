# 🚀 Guia de Performance

## 📊 Visão Geral

Este documento descreve as otimizações de performance implementadas no Doc Forge Buddy.

## 🎯 Objetivos de Performance

### Métricas Alvo
- **Lighthouse Score**: > 90
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB gzip

## 🔧 Otimizações Implementadas

### 1. Code Splitting

#### Bundle Optimization
- Chunks dinâmicos para bibliotecas grandes
- Separação de vendor, UI, PDF, charts, etc.
- Lazy loading de rotas

```typescript
// vite.config.ts
manualChunks: (id) => {
  if (id.includes('react') || id.includes('react-dom')) return 'vendor';
  if (id.includes('@radix-ui')) return 'ui';
  if (id.includes('jspdf')) return 'pdf-core';
  // ... mais chunks
}
```

#### Route-based Code Splitting
```typescript
const AnaliseVistoria = lazy(() => import('./pages/AnaliseVistoria'));
const Contratos = lazy(() => import('./pages/Contratos'));
```

### 2. React.memo e Memoização

#### Component Memoization
```typescript
const UserRow = React.memo<Props>(({ user }) => {
  // Componente otimizado
});
```

#### Custom Hooks para Memoização
- `useMemoizedCallback`: Para event handlers
- `useComputed`: Para valores computados
- `useDebounce`: Para campos de busca

```typescript
import { useMemoizedCallback, useDebounce } from '@/components/optimization';

const debouncedSearch = useDebounce(searchTerm, 300);
const handleClick = useMemoizedCallback(() => {
  // lógica
}, [deps]);
```

### 3. Virtualização

#### Listas Virtualizadas
- Implementação com `react-window`
- Renderiza apenas itens visíveis
- Scroll infinito para grandes datasets

```typescript
<VirtualizedList
  items={contracts}
  itemHeight={120}
  containerHeight={600}
  renderItem={(item) => <ContractCard contract={item} />}
/>
```

### 4. Bundle Analysis

#### Análise de Bundle
```bash
npm run analyze
```

#### Chunks Principais
- `vendor` (React, React DOM): ~45KB gzip
- `pdf-core` (jspdf, html2canvas): ~209KB gzip
- `ui` (Radix UI): ~31KB gzip
- `supabase`: ~32KB gzip

### 5. Otimizações de Imagens

#### Lazy Loading
```typescript
<img loading="lazy" src={src} alt={alt} />
```

#### Formatação e Compressão
- WebP quando suportado
- Compressão automática via Supabase Storage

### 6. Otimizações de Build

#### Terser Configuration
```typescript
minify: 'terser',
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true,
  },
}
```

#### Dependencies Optimization
```typescript
optimizeDeps: {
  include: ['react', 'react-dom', '@supabase/supabase-js'],
}
```

## 📈 Monitoramento

### Lighthouse CI
Configurado para rodar em CI/CD:
```yaml
# .github/workflows/ci.yml
- name: Lighthouse CI
  run: npm run lighthouse
```

### Web Vitals
```typescript
// src/utils/performance.ts
export function reportWebVitals(metric) {
  console.log(metric);
  // Enviar para analytics
}
```

### Bundle Size Tracking
Monitoramento automático via GitHub Actions:
- Alerta se bundle exceder limites
- Histórico de tamanhos

## 🎨 Best Practices

### 1. Evitar Re-renders Desnecessários
```typescript
// ❌ Ruim
const Component = () => {
  const data = expensiveFunction();
  return <div>{data}</div>;
};

// ✅ Bom
const Component = () => {
  const data = useMemo(() => expensiveFunction(), []);
  return <div>{data}</div>;
};
```

### 2. Memoizar Event Handlers
```typescript
// ❌ Ruim
<button onClick={() => handleClick(id)}>Click</button>

// ✅ Bom
const handleClick = useMemoizedCallback(() => {
  handleClick(id);
}, [id]);

<button onClick={handleClick}>Click</button>
```

### 3. Code Splitting Estratégico
```typescript
// ❌ Ruim - Carrega tudo
import HeavyComponent from './HeavyComponent';

// ✅ Bom - Lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 4. Virtualização para Listas
```typescript
// ❌ Ruim - Renderiza tudo
{items.map(item => <ItemCard item={item} />)}

// ✅ Bom - Renderiza visíveis
<VirtualizedList items={items} renderItem={ItemCard} />
```

## 📊 Métricas Atuais

### Bundle Analysis
- **Total**: ~2.5MB (não gzip)
- **Gzip**: ~650KB
- **Chunks**: 50+ arquivos

### Performance
- **FCP**: ~1.2s
- **TTI**: ~2.5s
- **Lighthouse**: 85-92

### Otimizações Pendentes
- [ ] Implementar Service Worker
- [ ] PWA completo
- [ ] Prefetching de rotas
- [ ] Image optimization automatizada

## 🔍 Debugging Performance

### React DevTools Profiler
```typescript
// Adicionar profiling
import { Profiler } from 'react';

<Profiler id="ComponentName" onRender={onRenderCallback}>
  <Component />
</Profiler>
```

### Performance Monitoring
```typescript
// src/utils/performance.ts
export function measurePerformance(name: string, fn: () => void) {
  performance.mark(`${name}-start`);
  fn();
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);
}
```

## 📚 Referências

- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [React Window](https://github.com/bvaughn/react-window)

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0
