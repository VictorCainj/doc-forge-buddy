# 🚀 Otimizações Vite para Produção - Doc Forge Buddy

Este documento detalha todas as otimizações implementadas para o Vite no projeto Doc Forge Buddy, focando em máximo performance para produção.

## 📋 Índice

1. [Configurações de Build Otimizadas](#1-configurações-de-build-otimizadas)
2. [Performance Budgets](#2-performance-budgets)
3. [Otimização de Chunks](#3-otimização-de-chunks)
4. [Resource Hints](#4-resource-hints)
5. [Configurações de Cache](#5-configurações-de-cache)
6. [Monitoramento e Validação](#6-monitoramento-e-validação)
7. [Scripts de Performance](#7-scripts-de-performance)
8. [CI/CD Integration](#8-cicd-integration)
9. [Core Web Vitals](#9-core-web-vitals)
10. [Como Usar](#10-como-usar)

---

## 1. Configurações de Build Otimizadas

### Configurações Principais

```typescript
// vite.config.ts
build: {
  target: 'es2020',           // Target moderno para melhor tree-shaking
  minify: 'esbuild',          // Mais rápido que terser
  cssCodeSplit: true,         // CSS code splitting
  sourcemap: false,           // Sem sourcemap em produção
  reportCompressedSize: false, // Desabilita relatório de tamanho
  chunkSizeWarningLimit: 300,  // Alerta se chunk > 300KB
  
  rollupOptions: {
    treeshake: {
      moduleSideEffects: 'no-external',
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    }
  }
}
```

### Otimizações ESBuild

```typescript
esbuild: {
  target: 'es2020',
  legalComments: 'none',      // Remove comentários legais
  treeShaking: true,          // Tree shaking mais agressivo
  drop: ['console', 'debugger'], // Remove console.log em produção
  pure: ['console.log', 'console.info'],
}
```

---

## 2. Performance Budgets

### Budgets Definidos

| Métrica | Budget | Alerta | Violação |
|---------|--------|--------|----------|
| **Bundle Principal** | 1MB | 800KB | 1MB |
| **Chunks Individuais** | 200KB | 160KB | 200KB |
| **CSS Total** | 100KB | 80KB | 100KB |
| **Imagens Total** | 500KB | 400KB | 500KB |
| **Fontes Total** | 200KB | 160KB | 200KB |
| **Carregamento Inicial** | 2MB | 1.6MB | 2MB |

### Validação Automática

O sistema valida automaticamente os budgets durante o build:

```bash
npm run test:performance
# Output:
# ✅ All performance budgets met!
# ⚠️ Performance Budget: Chunk vendor-docs (250KB) exceeds limit (200KB)
```

---

## 3. Otimização de Chunks

### Estratégia de Chunking

Os chunks são organizados por função e frequência de uso:

#### Chunks Principais (Carregados Imediatamente)
- **`vendor-react`** (~45KB) - React e React DOM
- **`vendor-core`** (~80KB) - TanStack Query + React Router
- **`vendor-ui`** (~60KB) - Radix UI + Lucide Icons
- **`vendor-supabase`** (~50KB) - Supabase client
- **`vendor-forms`** (~40KB) - React Hook Form + Zod

#### Chunks Secundários (Lazy Load)
- **`vendor-docs`** (~180KB) - PDF/DOCX processing
- **`vendor-specialized`** (~150KB) - Charts, Sentry
- **`vendor-utils`** (~30KB) - Utilitários pequenos
- **`vendor-heavy`** (~200KB+) - Bibliotecas muito grandes

### Nomenclatura Otimizada

```typescript
chunkFileNames: 'assets/[name]-[hash].js'
entryFileNames: 'assets/[name]-[hash].js'
assetFileNames: (assetInfo) => {
  const ext = assetInfo.name?.split('.').pop();
  if (/png|jpe?g|svg|gif/i.test(ext)) {
    return 'assets/images/[name]-[hash].[ext]';
  }
  if (/woff2?|eot|ttf|otf/i.test(ext)) {
    return 'assets/fonts/[name]-[hash].[ext]';
  }
  return 'assets/[name]-[hash].[ext]';
}
```

---

## 4. Resource Hints

### Preload de Recursos Críticos

O sistema automaticamente adiciona `preload` para chunks críticos:

```html
<!-- Adicionado automaticamente -->
<link rel="preload" href="/assets/vendor-react-[hash].js" as="script" crossorigin>
<link rel="preload" href="/assets/vendor-core-[hash].js" as="script" crossorigin>
<link rel="preload" href="/assets/vendor-ui-[hash].js" as="script" crossorigin>
```

### Prefetch de Recursos Futuros

```html
<!-- Adicionado automaticamente -->
<link rel="prefetch" href="/assets/vendor-docs-[hash].js" as="script">
<link rel="prefetch" href="/assets/vendor-charts-[hash].js" as="script">
```

---

## 5. Configurações de Cache

### Workbox PWA Cache

```typescript
// PWA com estratégias de cache otimizadas
runtimeCaching: [
  // NETWORK FIRST - APIs dinâmicas
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-api-cache',
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 150, maxAgeSeconds: 600 }
    }
  },
  
  // CACHE FIRST - Imagens
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images-cache',
      expiration: { maxEntries: 120, maxAgeSeconds: 2592000 }
    }
  },
  
  // STALE WHILE REVALIDATE - Assets da aplicação
  {
    urlPattern: /\.(?:css|js)$/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'app-assets-cache',
      expiration: { maxEntries: 80, maxAgeSeconds: 1209600 }
    }
  }
]
```

---

## 6. Monitoramento e Validação

### Plugin de Performance Budget

Validação automática em tempo de build:

```typescript
function performanceBudget() {
  return {
    name: 'performance-budget',
    writeBundle() {
      // Analisa tamanhos dos chunks
      // Compara com budgets definidos
      // Gera alertas e relatórios
      // Salva performance-report.json
    }
  };
}
```

### Relatórios Gerados

- **`dist/performance-report.json`** - Relatório detalhado em JSON
- **`dist/performance-report.md`** - Relatório em Markdown
- **`dist/bundle-analysis.html`** - Visualização do bundle

---

## 7. Scripts de Performance

### Scripts Disponíveis

```bash
# Build e análise básica
npm run build:analyze          # Build com análise de bundle
npm run build:production       # Build otimizado para produção
npm run build:performance      # Build + validação de budgets

# Validação e monitoramento
npm run test:performance       # Valida performance budgets
npm run test:budgets          # Build + validação completa
npm run test:lighthouse        # Executa Lighthouse CI

# Relatórios
npm run report:performance     # Gera relatórios completos
npm run ci:performance         # CI/CD performance check
```

### Script de Performance Monitor

O script `scripts/performance-monitor.js`:

- ✅ Executa build de produção
- ✅ Analisa tamanhos de chunks
- ✅ Valida performance budgets
- ✅ Executa Lighthouse (se disponível)
- ✅ Gera relatórios detalhados
- ✅ Fornece recomendações de otimização
- ✅ Falha CI/CD se budgets violados

```javascript
// Uso programático
const PerformanceMonitor = require('./scripts/performance-monitor.js');
const monitor = new PerformanceMonitor();
await monitor.runFullAnalysis();
```

---

## 8. CI/CD Integration

### GitHub Actions Workflow

O workflow `.github/workflows/performance.yml` inclui:

1. **Performance Analysis** - Validação de budgets
2. **Lighthouse CI** - Core Web Vitals e scores
3. **Bundle Regression** - Detecção de aumentos de tamanho
4. **Performance Summary** - Relatório consolidado

### Configuração Lighthouse

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
      }
    }
  }
};
```

---

## 9. Core Web Vitals

### Métricas Monitoradas

| Métrica | Bom | Precisa Melhorar | Ruim |
|---------|-----|------------------|-----|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **TTFB** | ≤ 800ms | 800ms - 1800ms | > 1800ms |

### Validação Automática

```bash
npm run test:core-web-vitals
# Output:
# 🔍 Iniciando validação de Core Web Vitals...
# ✅ LCP: 1.2s (good)
# ⚠️ FID: 150ms (needs-improvement)
# ✅ CLS: 0.05 (good)
```

### Script de Core Web Vitals

```javascript
// scripts/core-web-vitals.js
const CoreWebVitalsValidator = require('./scripts/core-web-vitals.js');
const validator = new CoreWebVitalsValidator();
await validator.runValidation();
```

---

## 10. Como Usar

### Configuração Inicial

1. **Instale dependências**:
   ```bash
   npm install
   ```

2. **Configure variáveis de ambiente** (opcional):
   ```env
   VITE_SENTRY_ORG=your-org
   VITE_SENTRY_PROJECT=your-project
   VITE_SENTRY_AUTH_TOKEN=your-token
   PAGESPEED_API_KEY=your-api-key
   ```

3. **Configure CSSnano** (opcional):
   ```bash
   npm install cssnano cssnano-preset-advanced postcss-custom-properties
   ```

### Fluxo de Desenvolvimento

```bash
# 1. Desenvolvimento normal
npm run dev

# 2. Teste de performance em desenvolvimento
npm run test:performance

# 3. Build otimizado para produção
npm run build:production

# 4. Validação completa
npm run test:budgets

# 5. Lighthouse CI
npm run test:lighthouse

# 6. Relatório completo
npm run report:performance
```

### CI/CD Integration

1. **Adicione o workflow**:
   ```bash
   # O arquivo .github/workflows/performance.yml já está incluído
   ```

2. **Configure secrets** (GitHub):
   - `LHCI_GITHUB_APP_TOKEN` (opcional)
   - `PAGESPEED_API_KEY` (opcional)
   - `SLACK_WEBHOOK_URL` (opcional)

3. **O workflow executará**:
   - Em cada pull request
   - Em push para branches principais
   - Manualmente via workflow_dispatch

### Personalização de Budgets

Para ajustar os performance budgets, edite:

```typescript
// vite.config.ts
const BUDGETS = {
  mainBundle: 1 * 1024 * 1024,      // 1MB
  chunk: 200 * 1024,                // 200KB
  cssTotal: 100 * 1024,             // 100KB
  totalInitial: 2 * 1024 * 1024,    // 2MB
  imagesTotal: 500 * 1024,          // 500KB
  fontsTotal: 200 * 1024,           // 200KB
};
```

### Integração com Outras Ferramentas

#### Bundle Analyzer Externo

```bash
npm install -g vite-bundle-visualizer
npx vite-bundle-visualizer dist/assets/*.js --open
```

#### WebPageTest

Use os relatórios gerados para testes adicionais em:
- https://www.webpagetest.org/
- https://pagespeed.web.dev/

---

## 📊 Resultados Esperados

Com essas otimizações, você deve alcançar:

- **📦 Bundle Size**: Redução de 30-40% vs build padrão
- **⚡ FCP**: < 1.8s em conexões 3G
- **🎯 LCP**: < 2.5s para conteúdo principal
- **📱 FID**: < 100ms para interações
- **📏 CLS**: < 0.1 para estabilidade visual
- **🏆 Lighthouse Score**: > 90 em todas as categorias

## 🔧 Troubleshooting

### Common Issues

1. **Build falhando por violation de budget**:
   ```bash
   # Aumente temporariamente os budgets ou otimize código
   npm run build:analyze
   # Analise dist/bundle-analysis.html
   ```

2. **Lighthouse score baixo**:
   ```bash
   # Teste localmente
   npm run preview
   npm run test:lighthouse
   ```

3. **Chunks muito grandes**:
   ```bash
   # Verifique chunk distribution
   npm run build:analyze
   # Ajuste manualChunks no vite.config.ts
   ```

### Logs e Debugging

```bash
# Verbose mode
DEBUG=vite:* npm run build

# Bundle analysis detalhado
npm run build:analyze
open dist/bundle-analysis.html

# Performance report
cat dist/performance-report.json | jq
```

## 📚 Recursos Adicionais

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals](https://web.dev/vitals/)
- [Bundle Size Analysis](https://www.npmjs.com/package/webpack-bundle-analyzer)

---

## 🎯 Próximos Passos

1. **Implementar code splitting** nos componentes principais
2. **Adicionar lazy loading** para rotas
3. **Otimizar imagens** com formatos modernos
4. **Configurar CDN** para assets estáticos
5. **Monitoramento contínuo** em produção

---

**Status**: ✅ Production Ready  
**Última Atualização**: 2025-11-09  
**Versão**: 1.0.0