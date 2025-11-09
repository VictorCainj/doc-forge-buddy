# 🚀 Instruções: Code Splitting Avançado

## 🎯 Visão Geral

O sistema de **Code Splitting Avançado** foi implementado com smart loading baseado em comportamento do usuário. A aplicação agora carrega apenas o código necessário, quando necessário, otimizando drasticamente a performance.

## 🏃‍♂️ Como Usar

### 1. Executar a Aplicação

```bash
# Development
npm run dev

# Production Build
npm run build

# Análise de Bundle
node scripts/analyzeBundle.mjs
```

### 2. Usar Smart Loading nos Componentes

#### Import Básico
```typescript
import { useSmartImport } from '@/hooks/useSmartImport';

function DocumentGenerator() {
  const { component: DocLib, loading } = useSmartImport({
    type: 'docs',
    preload: true
  });

  if (loading) return <LoadingSpinner />;
  if (!DocLib) return <ErrorMessage />;

  return <DocGenerator library={DocLib} />;
}
```

#### Import Baseado em Comportamento
```typescript
import { useSmartFeatureLoading } from '@/hooks/useBehaviorBasedLoading';

function SmartChart() {
  const { component, usageScore } = useSmartFeatureLoading('charts');
  
  return (
    <div>
      {component ? (
        <ChartComponent data={data} />
      ) : (
        <p>Score: {Math.round(usageScore * 100)}%</p>
      )}
    </div>
  );
}
```

#### Marcação para Smart Loading
```tsx
<div data-feature="charts" data-smart-import="charts">
  <ChartComponent />
</div>
```

## 📊 Monitorar Performance

### DevTools
1. Abra **Network Tab**
2. Filtre por **JS** 
3. Observe chunks sendo carregados
4. Verifique tamanhos (alvo: 50-200KB)

### Console Logs
```javascript
// Ativar logs de debug
localStorage.setItem('debug', 'true');

// Ver métricas
console.log('Bundle Metrics:', getPrefetchMetrics());
```

### Script de Análise
```bash
# Analisar bundle após build
npm run build && node scripts/analyzeBundle.mjs
```

## 🎛️ Configurações

### Ajustar Thresholds
```typescript
// src/hooks/useBehaviorBasedLoading.ts
const LOADING_THRESHOLDS = {
  docs: { viewThreshold: 0.3, interactionThreshold: 2 },
  charts: { viewThreshold: 0.4, interactionThreshold: 3 },
  // Ajustar conforme necessário
};
```

### Configurar Vite
```typescript
// vite.config.ts - manualChunks
manualChunks: (id) => {
  // Adicionar novas categorias de chunks
  if (id.includes('nova-biblioteca')) {
    return 'vendor-nova-biblioteca';
  }
}
```

### Service Worker Cache
```typescript
// src/service-worker.ts - Ajustar estratégias de cache
registerRoute(
  ({ url }) => url.pathname.includes('/minha-api/'),
  new NetworkFirst({ 
    cacheName: 'minha-api-cache',
    networkTimeoutSeconds: 5 
  })
);
```

## 🧪 Testar Funcionalidades

### 1. Testar Smart Loading
- Acesse diferentes páginas
- Observe console para logs de prefetch
- Verifique se bibliotecas carregam sob demanda

### 2. Testar Performance
- Network tab: verificar tamanhos de chunks
- Performance tab: medir LCP, TTI
- Lighthouse: verificar Core Web Vitals

### 3. Testar Offline
- Desconectar internet
- Tentar navegar entre páginas
- Verificar se service worker funciona

## 🔧 Debugging

### Problemas Comuns

#### Chunk não carrega
```typescript
// Verificar se está registrado no manualChunks
console.log('Checking chunk registration...');

// Testar import manual
import('@/lib/smartImports/documentLibs').then(module => {
  console.log('Module loaded:', module);
});
```

#### Performance ruim
```typescript
// Verificar metrics
const metrics = getPrefetchMetrics();
console.log('Prefetch metrics:', metrics);

// Verificar user behavior
const behavior = JSON.parse(localStorage.getItem('docforge_user_preferences') || '{}');
console.log('User behavior:', behavior);
```

#### Service Worker não funciona
```javascript
// No console do navegador
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('SW registrations:', registrations);
});

// Atualizar SW
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.update();
});
```

## 📈 Métricas de Sucesso

### Targets Alvo
- **Bundle inicial**: < 200KB
- **TTI (Time to Interactive)**: < 2.5s
- **LCP (Largest Contentful Paint)**: < 2.0s
- **Cache hit rate**: > 80%
- **Chunks carregados**: < 10 initially

### Como Verificar
```bash
# Script de análise
node scripts/analyzeBundle.mjs

# Lighthouse (Chrome DevTools)
# Performance tab

# Web Vitals
# Gtmetrix, PageSpeed Insights
```

## 🎨 Personalização

### Adicionar Nova Feature
1. **Criar módulo de import**
   ```typescript
   // src/lib/smartImports/novaFeatureLibs.ts
   export const novaFeatureLibs = {
     default: async function() {
       const Module = await import('nova-biblioteca');
       return { Module: Module.default };
     }
   };
   ```

2. **Registrar no hook**
   ```typescript
   // src/hooks/useSmartImport.ts
   const IMPORT_CONFIGS: Record<ImportType, () => Promise<any>> = {
     // ...
     novaFeature: () => import('@/lib/smartImports/novaFeatureLibs'),
   };
   ```

3. **Configurar chunk no Vite**
   ```typescript
   // vite.config.ts
   if (id.includes('nova-biblioteca')) {
     return 'vendor-nova-feature';
   }
   ```

### Customizar Comportamento
```typescript
// src/hooks/useBehaviorBasedLoading.ts
const CUSTOM_THRESHOLDS = {
  novaFeature: { 
    viewThreshold: 0.2, 
    interactionThreshold: 1,
    preloadOnIdle: true,
    priority: 'high'
  },
};
```

## 📚 Recursos Adicionais

### Documentação
- `CODE_SPLITTING_IMPLEMENTATION.md` - Documentação completa
- `SUMARIO_CODE_SPLITTING.md` - Resumo executivo
- Vite.js docs - [vitejs.dev](https://vitejs.dev)
- React.lazy docs - [react.dev](https://react.dev)

### Componentes de Exemplo
- `src/components/demo/SmartLoadingDemo.tsx` - Demo interativo
- Ver examples no código para diferentes casos de uso

### Scripts Úteis
```bash
# Análise completa
npm run build && node scripts/analyzeBundle.mjs

# Dev com análise
npm run dev & node scripts/analyzeBundle.mjs

# Deploy com análise
npm run build:analyze && npm run deploy
```

## 🆘 Suporte

### Logs Úteis
```javascript
// Ativar debug completo
localStorage.setItem('docforge_debug', 'true');

// Verificar estado do sistema
console.log('Smart Loading Status:', {
  chunks: getPrefetchMetrics(),
  behavior: getUserBehavior(),
  cache: getCacheStatus()
});
```

### Verificar Implementação
- ✅ Prefetch funcionando
- ✅ Chunks sendo gerados
- ✅ Service worker ativo
- ✅ Cache strategies aplicadas
- ✅ Métricas sendo coletadas

---

*Para mais informações, consulte a documentação completa em `CODE_SPLITTING_IMPLEMENTATION.md`*