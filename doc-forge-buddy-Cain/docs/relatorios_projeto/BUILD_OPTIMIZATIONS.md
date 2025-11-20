# Otimizações de Build - Vite Config

## Melhorias Implementadas

### 1. **Code Splitting Otimizado**
- **chunkSizeWarningLimit**: Reduzido de 500kb para 300kb para melhor controle
- **Manual Chunks Agrupados por Frequência de Uso**:

  - **vendor-react** (crítico): React e React DOM
  - **vendor-core** (crítico): TanStack Query e React Router
  - **vendor-ui** (frequente): Radix UI e Lucide Icons
  - **vendor-supabase** (frequente): Supabase client
  - **vendor-docs** (pesado, lazy): PDF, docx, markdown
  - **vendor-forms** (moderado): React Hook Form, Zod, Sonner
  - **vendor-utils** (leve): date-fns, clsx, DOMPurify
  - **vendor-specialized** (ocasional): ExcelJS, OpenAI, Charts, Framer Motion

### 2. **Terser Options Melhoradas**
- **Otimizações de Compressão Avançadas**:
  - `reduce_funcs`, `reduce_vars`, `collapse_vars`
  - `collapse_single_use_vars`, `booleans_as_integers`
  - `object_spread`, `evaluate`, `conditionals`
- **Mangle Melhorado**:
  - `keep_private_props: false`, `toplevel: true`
- **Format Otimizado**:
  - `ascii_only: true`, `brace_style: 'collapse'`

### 3. **TreeShaking Otimizado**
- **moduleSideEffects: false** para melhor tree-shaking
- **manualDynamicImportShim: true** para imports dinâmicos
- **propertyReadSideEffects: false** para efeitos de leitura
- **tryCatchDeoptimization: false** para melhor performance

### 4. **ESBuild Enhancements**
- **minify: 'esbuild'** em produção para melhor performance
- **drop: ['console', 'debugger']** em produção
- **pureExternalModules: true** para redução de bundle
- **minify identifiers, syntax e whitespace** habilitadas em produção

### 5. **Scripts de Análise**
- `npm run analyze` - Análise básica de bundle
- `npm run analyze:dist` - Análise do dist gerado
- `npm run bundle-report` - Relatório em formato treemap
- `npm run build:analyze` - Build com análise habilitada
- `npm run build:analyze:report` - Build + análise + relatório
- `npm run build:performance` - Build otimizado para produção

### 6. **Estrutura de Chunks**
```
dist/
├── assets/
│   ├── vendor-react-[hash].js      (React core - carregado primeiro)
│   ├── vendor-core-[hash].js       (Router + Query - core app)
│   ├── vendor-ui-[hash].js         (UI components - usado frequentemente)
│   ├── vendor-supabase-[hash].js   (Data layer - usado frequentemente)
│   ├── vendor-docs-[hash].js       (PDF/Markdown - lazy loaded)
│   ├── vendor-forms-[hash].js      (Forms - lazy loaded quando necessário)
│   ├── vendor-utils-[hash].js      (Utilitários - small chunks)
│   └── vendor-specialized-[hash].js (Large libraries - lazy loaded)
```

## Performance Benefícios

### **Redução de Bundle**
- Code splitting inteligente baseado na frequência de uso
- Lazy loading para bibliotecas pesadas
- Tree-shaking mais agressivo

### **Carregamento Mais Rápido**
- Critical resources (React) carregados primeiro
- Non-critical resources carregados sob demanda
- Chunks menores para melhor caching

### **Otimização de Memória**
- Reduz uso de memória em dispositivos móveis
- Melhor gestão de estado em single-page apps
- Importação dinâmica para features não utilizadas imediatamente

## Comandos Úteis

```bash
# Build com análise detalhada
npm run build:analyze

# Ver relatório visual de chunks
npm run bundle-report

# Build otimizado para produção
npm run build:performance

# Análise completa (build + visualização)
npm run build:analyze:report
```

## Monitoramento

Use os scripts de análise para monitorar:
- Tamanho de chunks individuais
- Tempos de carregamento
- Eficiência do code splitting
- Oportunidades de otimização

### **Target Devices**
- **Desktop**: All features loaded on demand
- **Mobile**: Lazy loading aggressively optimized
- **Low-end devices**: Ultra-conservative chunking
