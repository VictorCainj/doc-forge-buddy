# React Query Otimizado - Guia de Implementação

## 📋 Visão Geral

Este documento descreve a implementação completa do React Query otimizado para melhor performance, caching inteligente e monitoramento avançado.

## 🏗️ Arquitetura

### 1. Configuração do QueryClient

**Arquivo:** `src/lib/queryClient.ts`

#### Características:
- Configuração por ambiente (dev/prod/test)
- Cache timeouts otimizados
- Estratégia de retry inteligente
- Error handling centralizado
- Interceptores para monitoramento

#### Configurações por Ambiente:
```typescript
// Desenvolvimento
staleTime: 30 * 1000    // 30 segundos
gcTime: 5 * 60 * 1000   // 5 minutos
retry: 1                // 1 retry

// Produção
staleTime: 5 * 60 * 1000    // 5 minutos
gcTime: 10 * 60 * 1000      // 10 minutos
retry: 2                    // 2 retries
refetchInterval: 5 * 60 * 1000 // 5 minutos
```

### 2. Cache Management

**Arquivo:** `src/lib/queryCache.ts`

#### Estratégias de Cache:
```typescript
// Cache de curta duração (dados em tempo real)
realtime: {
  staleTime: 30 * 1000,  // 30 segundos
  gcTime: 5 * 60 * 1000, // 5 minutos
}

// Cache de média duração (dados que mudam ocasionalmente)
medium: {
  staleTime: 5 * 60 * 1000,  // 5 minutos
  gcTime: 30 * 60 * 1000,    // 30 minutos
}

// Cache de longa duração (dados estáticos)
long: {
  staleTime: 30 * 60 * 1000,  // 30 minutos
  gcTime: 2 * 60 * 60 * 1000, // 2 horas
}
```

#### Configurações por Entidade:
- **Contracts**: Cache medium com prioridade alta
- **Users**: Cache medium com refetch otimizado
- **Vistorias**: Cache medium para dados dinâmicos
- **Analytics**: Cache realtime para dados em tempo real

### 3. Error Handling

**Arquivo:** `src/lib/errorHandler.ts`

#### Características:
- Tratamento centralizado de erros
- Notificações inteligentes para o usuário
- Retry strategies baseadas no tipo de erro
- Rollback automático de optimistic updates
- Integração com Sentry para monitoramento

#### Estratégias de Retry:
```typescript
// Erro de rede - retry com backoff exponencial
network: retry(3, delay: 1000 * 2^attempt)

// Erro 5xx - retry agressivo
serverError: retry(5, delay: 2000 * attempt)

// Erro 4xx - não retry
clientError: noRetry()
```

### 4. Performance Monitoring

**Arquivo:** `src/lib/queryMonitor.ts`

#### Métricas Capturadas:
- Tempo médio de query
- Taxa de hit de cache
- Queries lentas (>2s)
- Taxa de erro
- Utilização de cache
- Estatísticas por página

#### Alertas Automáticos:
- Taxa de hit < 70%
- Mais de 20 queries stale
- Error rate > 10%

## 🎯 Custom Hooks

### 1. useOptimizedQuery

```typescript
// Hook base otimizado
const { data, isLoading, isError, refetch, clearCache, isStale } = useOptimizedQuery(
  ['contracts', contractId],
  () => api.getContract(contractId),
  {
    // Configurações customizadas
    enabled: !!contractId,
    staleTime: 5 * 60 * 1000
  }
);
```

### 2. useOptimizedSelectQuery

```typescript
// Para dados derivados
const { data: filteredContracts } = useOptimizedSelectQuery(
  ['contracts', 'list', filters],
  () => api.getContracts(filters),
  (contracts) => contracts.filter(c => c.status === 'active')
);
```

### 3. useOptimisticMutation

```typescript
// Mutations com optimistic updates
const { mutate, isPending } = useOptimisticMutation(
  api.createContract,
  (variables, currentData) => ({
    ...currentData,
    contracts: [newContract, ...currentData.contracts]
  }),
  ['contracts', 'list']
);
```

### 4. usePrefetch

```typescript
// Prefetch inteligente
const { prefetchQuery, prefetchOnHover } = usePrefetch();

// Prefetch na hover
<Link 
  to="/contracts" 
  onMouseEnter={prefetchOnHover(['contracts'], () => api.getContracts())}
>
  Ver Contratos
</Link>
```

## 🔧 Performance Optimizations

### 1. Select para Dados Filtrados
```typescript
// Evita re-render desnecessário
const { data: activeContracts } = useOptimizedSelectQuery(
  ['contracts'],
  api.getContracts,
  (allContracts) => allContracts.filter(c => c.status === 'active')
);
```

### 2. Paginação Infinita
```typescript
// Para listas grandes
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
  ['contracts', 'infinite'],
  ({ pageParam = 1 }) => api.getContracts({ page: pageParam }),
  {
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined
  }
);
```

### 3. Prefetch de Rotas
```typescript
// Prefetch antes da navegação
const router = useRouter();
router.prefetch('/contracts');
```

### 4. Offline Support
```typescript
// Queries funcionam offline
const { data } = useOptimizedQuery(
  ['offline', 'data'],
  fetchData,
  {
    networkMode: 'offline', // Permite queries offline
    retry: false,           // Sem retry offline
  }
);
```

## 📊 Monitoramento

### 1. Métricas em Tempo Real
```typescript
const { subscribe } = usePerformanceSubscription();
subscribe((metrics) => {
  if (metrics.hitRate < 70) {
    console.warn('Cache hit rate baixo');
  }
});
```

### 2. Analytics
- Google Analytics integration
- Sentry error tracking
- Performance budgets
- Cache hit rates

### 3. Debug Tools
```typescript
// Estatísticas detalhadas em dev
if (import.meta.env.DEV) {
  const stats = queryMonitor.getDetailedMetrics();
  console.table(stats.recentQueries);
}
```

## 🏢 Exemplos de Implementação

### 1. Serviço de Contratos
**Arquivo:** `src/services/contractsService.ts`

Demonstração completa de:
- Queries otimizadas por entidade
- Mutations com optimistic updates
- Prefetching inteligente
- Cache invalidation patterns

### 2. Hook de Gerenciamento
**Arquivo:** `src/hooks/examples/useContractsManagement.ts`

Hook completo demonstrando:
- Estado management
- Performance monitoring
- Offline support
- Cache management

### 3. Componente de Demo
**Arquivo:** `src/components/examples/OptimizedQueryDemo.tsx`

Interface visual mostrando:
- Status de queries
- Performance metrics
- Cache statistics
- Interações em tempo real

## 🔄 Cache Invalidation

### 1. Por Padrão
```typescript
// Invalidar todas as queries que contenham 'contract'
invalidateByPattern(/^contract/);
```

### 2. Por Entidade
```typescript
// Invalidar todas as queries relacionadas a contratos
invalidateEntity('contracts');
```

### 3. Otimistic Updates
```typescript
// Update otimista com rollback automático
updateOptimistically(queryKey, (oldData) => newData);

// Em caso de erro, rollback automático
```

## 🎛️ Configurações Avançadas

### 1. Configuração do Provider
```tsx
// AppProviders.tsx
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>
```

### 2. Configurações Específicas
```typescript
// Por tipo de query
const config = {
  contracts: { staleTime: 5 * 60 * 1000 },
  analytics: { staleTime: 30 * 1000, refetchInterval: 60 * 1000 },
  users: { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: true }
};
```

### 3. Error Boundaries
```typescript
// Error handling com recovery
const { error, isError, errorReset } = useQuery(...);

if (isError) {
  return (
    <ErrorRetry 
      error={error} 
      onRetry={errorReset} 
    />
  );
}
```

## 📈 Métricas de Performance

### 1. Cache Hit Rate
- **Meta**: > 80%
- **Monitoramento**: Tempo real
- **Alerta**: < 70%

### 2. Query Response Time
- **Meta**: < 200ms (média)
- **Slow Query Alert**: > 2000ms
- **Monitoramento**: Por tipo de query

### 3. Error Rate
- **Meta**: < 1%
- **Alerta**: > 10%
- **Tracking**: Por tipo de erro

### 4. Memory Usage
- **Cache Size**: Monitorado
- **GC Time**: Configurável por ambiente
- **Max Queries**: Limitado para evitar memory leaks

## 🛠️ Utilitários

### 1. Query Utils
```typescript
// Access a query data
const data = getQueryData(['contracts', 'id']);

// Manually set data
setQueryData(['contracts', 'id'], newData);

// Prefetch manually
prefetchQuery(['contracts', 'id'], fetchContract);
```

### 2. Cache Utils
```typescript
// Clear cache by pattern
clearEntityCache('contracts');

// Keep only critical queries
keepOnlyCritical();

// Get cache statistics
getCacheStats();
```

## 📚 Boas Práticas

### 1. Query Keys
```typescript
// ✅ Bom
['contracts', 'list', { status: 'active', page: 1 }]

// ❌ Ruim
['getContracts']
```

### 2. Error Handling
```typescript
// ✅ Use error boundaries
const { error, isError } = useQuery(queryKey, queryFn, {
  retry: (failureCount, error) => {
    if (error.status === 404) return false;
    return failureCount < 3;
  }
});

// ❌ Não ignore todos os erros
```

### 3. Performance
```typescript
// ✅ Use select para dados filtrados
const { data: filtered } = useQuery(key, fetcher, {
  select: (data) => data.filter(item => item.active)
});

// ❌ Não filtre no componente
```

### 4. Prefetching
```typescript
// ✅ Prefetch com priority
prefetchQuery(key, fetcher, { priority: 'high' });

// ❌ Não prefetch tudo sempre
```

## 🔮 Próximos Passos

1. **Integração com Redux** (se necessário para estado global)
2. **Server-Side Rendering** (SSR) support
3. **Real-time subscriptions** (WebSockets)
4. **Advanced caching strategies** (stale-while-revalidate)
5. **Performance profiling** automatizado
6. **Bundle size optimization** para queries grandes

## 📝 Changelog

### v1.0.0 - Implementação Inicial
- ✅ QueryClient otimizado
- ✅ Custom hooks
- ✅ Error handling
- ✅ Performance monitoring
- ✅ Cache management
- ✅ Example implementation
- ✅ Documentation completa

---

*Esta implementação oferece performance otimizada, caching inteligente e monitoramento avançado para o React Query.*