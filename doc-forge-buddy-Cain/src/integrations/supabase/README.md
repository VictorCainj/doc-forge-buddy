# Sistema de Otimização de Queries Supabase

Sistema completo de otimização de queries do Supabase com cache inteligente, performance monitoring e batch operations.

## 🚀 Funcionalidades

### 1. Query Builder Otimizado
- **Cache automático** com múltiplas estratégias
- **Otimização de colunas** (evita SELECT *)
- **Hints de índice** automáticos
- **Paginação eficiente** com keyset pagination
- **Analytics integrado** para performance tracking
- **Retry inteligente** com backoff exponencial

### 2. Sistema de Cache Multicamadas
- **Memory Cache** com LRU eviction
- **Redis Cache** para dados compartilhados
- **LocalStorage Cache** para dados persistentes
- **Cache Híbrido** com sincronização automática
- **Compressão** de dados grandes
- **Invalidação inteligente** por padrão

### 3. Batch Operations
- **Bulk inserts/updates/deletes** otimizados
- **Transações** com rollback automático
- **Processamento paralelo** com limites configuráveis
- **Progress tracking** em tempo real
- **Validação de dados** automática
- **Cache invalidation** seletiva

### 4. Performance Monitoring
- **Query analytics** com métricas detalhadas
- **Detecção de queries lentas** automática
- **Cache performance** dashboard
- **Alertas** de performance
- **Otimizações sugeridas** baseadas em padrões
- **Relatórios** de performance

## 📦 Instalação

O sistema está integrado no projeto. Para usar:

```typescript
import { useOptimizedSupabase, supabaseOptimizationConfig } from '@/integrations/supabase';
```

## 🎯 Uso Básico

### Query Simples Otimizada

```typescript
const { createQuery } = useOptimizedSupabase();

// Query com cache automático
const contracts = await createQuery('contracts')
  .select(['id', 'status', 'user_id', 'created_at'])
  .eq('status', 'active')
  .order('created_at', false)
  .limit(10)
  .withCache('hybrid')
  .execute();

console.log(contracts);
```

### Query Complexa com JOIN

```typescript
const vistorias = await createQuery('vistorias')
  .select(['id', 'status', 'contract_id'])
  .join('contracts', 'vistorias.contract_id = contracts.id', 'inner')
  .eq('contracts.status', 'active')
  .paginate(1, 20)
  .withAnalytics(true)
  .execute();
```

### Batch Operations

```typescript
const { batch } = useOptimizedSupabase();

// Inserir múltiplos registros
const operation = await batch.batchInsert('contracts', [
  { user_id: '123', status: 'active', title: 'Contrato 1' },
  { user_id: '456', status: 'active', title: 'Contrato 2' }
], {
  chunkSize: 100,
  useTransaction: true,
  clearCache: true
});

// Monitorar progresso
const progress = batch.getOperationProgress(operation.id);
console.log(`Progresso: ${progress.progress}%`);
```

### Cache Management

```typescript
const { cache } = useOptimizedSupabase();

// Obter dados do cache
const data = await cache.get('contracts:123', 'hybrid');

// Salvar no cache
await cache.set('contracts:123', contractData, 300000); // 5 min

// Limpar cache por padrão
await cache.clear('contracts:*');

// Estatísticas de cache
const stats = cache.getStats('hybrid');
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

## 🔧 Configuração Avançada

### Configurar Sistema Completo

```typescript
import { 
  configureSupabaseOptimization,
  supabaseOptimizationConfig,
  resetSupabaseOptimization
} from '@/integrations/supabase';

// Configurar parâmetros globais
configureSupabaseOptimization({
  cache: {
    defaultStrategy: 'hybrid',
    ttl: 10 * 60 * 1000, // 10 minutos
    maxSize: {
      memory: 1000 * 1024 * 1024, // 1GB
      redis: 2048 * 1024 * 1024   // 2GB
    }
  },
  batch: {
    defaultChunkSize: 200,
    maxParallelOperations: 10,
    useTransactions: true
  },
  analytics: {
    slowQueryThreshold: 500, // 500ms
    alertThresholds: {
      hitRate: 0.8,
      errorRate: 0.02
    }
  }
});
```

### Cache Híbrido Personalizado

```typescript
import { getCacheManager, type CacheConfig } from '@/integrations/supabase';

const customConfig: Partial<CacheConfig> = {
  memory: {
    maxSize: 200, // 200MB
    maxAge: 10 * 60 * 1000, // 10 minutos
    cleanupInterval: 60000  // 1 minuto
  },
  redis: {
    host: 'redis.internal',
    port: 6379,
    ttl: 30 * 60 * 1000 // 30 minutos
  },
  hybrid: {
    l1Cache: 'memory',
    l2Cache: 'redis',
    syncInterval: 5000 // 5 segundos
  }
};

const cache = getCacheManager(customConfig);
```

## 📊 Monitoring e Analytics

### Dashboard de Performance

```typescript
const { utils } = useOptimizedSupabase();

// Estatísticas de performance das queries
const perfStats = utils.getPerformanceStats({
  start: Date.now() - (24 * 60 * 60 * 1000), // 24 horas
  end: Date.now()
});

console.log('Performance Stats:', {
  totalQueries: perfStats.totalQueries,
  averageDuration: perfStats.averageDuration,
  cacheHitRate: perfStats.cacheHitRate,
  errorRate: perfStats.errorRate,
  slowestQueries: perfStats.slowestQueries
});
```

### Dashboard de Cache

```typescript
const cacheDashboard = utils.getCacheDashboard();

console.log('Cache Overview:', {
  totalRequests: cacheDashboard.overview.totalRequests,
  hitRate: cacheDashboard.overview.hitRate,
  avgResponseTime: cacheDashboard.overview.avgResponseTime,
  efficiency: cacheDashboard.overview.cacheEfficiency
});
```

### Detectar e Corrigir Problemas

```typescript
// Detectar queries lentas
const slowQueries = perfStats.slowestQueries;
slowQueries.forEach(query => {
  console.log(`Query lenta: ${query.query}`);
  console.log(`Duração: ${query.duration}ms`);
  console.log(`Sugestões: ${query.suggestions}`);
});

// Cache performance alerts
const cacheAlerts = utils.getCacheDashboard().recentAlerts;
cacheAlerts.forEach(alert => {
  console.log(`Alerta ${alert.level}: ${alert.message}`);
});
```

## ⚡ Otimizações Implementadas

### 1. Query Optimization
- ✅ **SELECT * avoidance** - Colunas específicas por padrão
- ✅ **Index hints** - Automáticos baseados em padrões
- ✅ **JOIN optimization** - Heurísticas para tipos de JOIN
- ✅ **WHERE clause optimization** - Index-aware conditions
- ✅ **ORDER BY optimization** - Index usage guidance
- ✅ **Pagination optimization** - Keyset pagination para grandes datasets

### 2. Cache Optimization
- ✅ **Multi-layer cache** - Memory + Redis + LocalStorage
- ✅ **LRU eviction** - Memory cache com LRU
- ✅ **Intelligent invalidation** - Por padrão e time-based
- ✅ **Compression** - Para dados grandes
- ✅ **Hybrid synchronization** - L1/L2 cache sync
- ✅ **Prefetching** - Cache warming para dados frequentes

### 3. Batch Operations
- ✅ **Chunked processing** - Divide em chunks otimizados
- ✅ **Parallel execution** - Com limites configuráveis
- ✅ **Transaction support** - Rollback automático
- ✅ **Progress tracking** - Real-time updates
- ✅ **Data validation** - Schema validation
- ✅ **Error recovery** - Retry com backoff

### 4. Analytics & Monitoring
- ✅ **Query performance tracking** - Duration, success rate, etc.
- ✅ **Cache hit rate monitoring** - Por estratégia
- ✅ **Slow query detection** - Threshold-based
- ✅ **Performance alerts** - Automatic notifications
- ✅ **Optimization suggestions** - AI-driven recommendations
- ✅ **Real-time dashboards** - Live metrics

## 🏗️ Arquitetura

```
src/integrations/supabase/
├── index.ts                    # Export principal
├── client.ts                   # Cliente Supabase base
├── types.ts                    # Tipos gerados
├── query-builder.ts            # Query builder otimizado
├── cache/                      # Sistema de cache
│   ├── cache-manager.ts        # Gerenciador principal
│   ├── memory-cache.ts         # Cache em memória
│   ├── redis-cache.ts          # Cache Redis
│   └── local-storage-cache.ts  # Cache LocalStorage
├── performance/                # Otimizações
│   └── query-optimizer.ts      # Otimizador de queries
├── operations/                 # Operações em lote
│   └── batch-operations.ts     # Batch operations manager
└── monitoring/                 # Analytics
    ├── query-analytics.ts      # Analytics de queries
    └── cache-analytics.ts      # Analytics de cache
```

## 🔍 Casos de Uso

### 1. Dashboard com Dados Otimizados

```typescript
const loadDashboard = async (userId: string) => {
  const { cache, createQuery } = useOptimizedSupabase();
  
  // Verificar cache primeiro
  const cached = await cache.get(`dashboard:${userId}`, 'hybrid');
  if (cached) return cached;
  
  // Queries otimizadas
  const [contracts, vistorias, stats] = await Promise.all([
    createQuery('contracts')
      .select(['id', 'status', 'created_at'])
      .eq('user_id', userId)
      .order('created_at', false)
      .limit(10)
      .execute(),
    
    createQuery('vistorias')
      .select(['id', 'status', 'contract_id'])
      .eq('user_id', userId)
      .eq('status', 'pending')
      .execute(),
    
    // Query complexa com agregação
    createQuery('contracts')
      .select('status')
      .eq('user_id', userId)
      .count()
  ]);
  
  const dashboardData = {
    contracts,
    pendingVistorias: vistorias,
    stats
  };
  
  // Salvar no cache
  await cache.set(`dashboard:${userId}`, dashboardData, 5 * 60 * 1000);
  
  return dashboardData;
};
```

### 2. Importação de Dados em Lote

```typescript
const importContracts = async (contractsData: any[]) => {
  const { batch } = useOptimizedSupabase();
  
  const operation = await batch.batchInsert('contracts', contractsData, {
    chunkSize: 50,              // Chunks menores para melhor controle
    parallelLimit: 3,           // Máximo 3 operações paralelas
    useTransaction: true,       // Transação para integridade
    validateData: true,         // Validar dados
    clearCache: true,           // Invalidar cache após conclusão
    retryAttempts: 3           // Retry em caso de erro
  });
  
  // Monitorar progresso
  const checkProgress = setInterval(() => {
    const progress = batch.getOperationProgress(operation.id);
    if (progress) {
      console.log(`Progresso: ${progress.progress.toFixed(1)}%`);
      console.log(`Items processados: ${progress.current}/${progress.total}`);
      
      if (progress.status === 'completed') {
        clearInterval(checkProgress);
        console.log('Importação concluída!');
        console.log('Resultado:', operation.result);
      }
    }
  }, 1000);
  
  return operation;
};
```

### 3. Real-time Updates com Cache

```typescript
const useContractRealtime = (contractId: string) => {
  const { createQuery, cache } = useOptimizedSupabase();
  
  const [contract, setContract] = useState(null);
  
  useEffect(() => {
    const loadContract = async () => {
      // Tentar cache primeiro
      let data = await cache.get(`contract:${contractId}`, 'hybrid');
      
      if (!data) {
        // Query otimizada
        data = await createQuery('contracts')
          .select(['*'])
          .eq('id', contractId)
          .single();
        
        // Salvar no cache
        await cache.set(`contract:${contractId}`, data, 2 * 60 * 1000);
      }
      
      setContract(data);
    };
    
    loadContract();
    
    // Setup real-time subscription
    const subscription = supabase
      .channel(`contract:${contractId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contracts',
        filter: `id=eq.${contractId}`
      }, async (payload) => {
        // Invalidar cache
        await cache.delete(`contract:${contractId}`);
        
        // Recarregar dados
        const newData = await createQuery('contracts')
          .select(['*'])
          .eq('id', contractId)
          .single();
        
        setContract(newData);
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [contractId]);
  
  return contract;
};
```

## 📈 Métricas e Performance

### Benchmarks Esperados

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Tempo de query | 500ms | 150ms | 70% mais rápido |
| Cache hit rate | 0% | 85% | Cache efetivo |
| Throughput | 100 req/s | 500 req/s | 5x mais throughput |
| Memória usada | 2GB | 800MB | 60% redução |
| Erros de timeout | 5% | 0.5% | 90% redução |

### Monitoramento de Performance

O sistema monitora automaticamente:
- ⏱️ **Latência de queries** - Média, P95, P99
- 🎯 **Cache hit rate** - Por estratégia e global
- 📊 **Throughput** - Requests por segundo
- 🔄 **Erro rate** - Taxa de falhas
- 💾 **Usage de recursos** - CPU, memória, rede
- 🔍 **Slow queries** - Queries > threshold

## 🛠️ Troubleshooting

### Problemas Comuns

**1. Cache hit rate baixo**
```typescript
// Verificar configuração de TTL
const cache = getCacheManager();
const stats = cache.getStats('hybrid');
console.log('Hit rate:', stats.hitRate);

// Ajustar TTL se necessário
configureSupabaseOptimization({
  cache: {
    ttl: 10 * 60 * 1000 // Aumentar para 10 minutos
  }
});
```

**2. Queries lentas**
```typescript
// Verificar queries lentas
const perfStats = utils.getPerformanceStats();
console.log('Slow queries:', perfStats.slowestQueries);

// Aplicar otimizações sugeridas
perfStats.slowestQueries.forEach(query => {
  console.log('Suggestions:', query.suggestions);
});
```

**3. Memory leaks**
```typescript
// Limpar cache periodicamente
const cache = getCacheManager();
setInterval(() => {
  cache.clear('temp:*');
  cache.clear('session:*');
}, 30 * 60 * 1000); // A cada 30 minutos
```

**4. Batch operations falhas**
```typescript
// Verificar logs de erro
const activeOps = batch.getActiveOperations();
activeOps.forEach(op => {
  if (op.status === 'failed') {
    console.error('Operation failed:', op.error);
  }
});
```

## 🔒 Segurança

O sistema implementa:
- ✅ **RLS (Row Level Security)** compliance
- ✅ **Input validation** em todas as operações
- ✅ **SQL injection protection** via prepared statements
- ✅ **Rate limiting** em batch operations
- ✅ **Access control** por cache strategy
- ✅ **Audit logging** de todas as operações

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [React Query](https://tanstack.com/query/latest)
- [Redis Documentation](https://redis.io/documentation)

## 🤝 Contribuição

Para contribuir com o sistema:

1. **Performance Testing** - Adicione testes de performance
2. **New Cache Strategies** - Implemente novas estratégias de cache
3. **Query Optimizations** - Adicione novas otimizações
4. **Monitoring Improvements** - Melhore as métricas e alertas
5. **Documentation** - Melhore a documentação

---

**Desenvolvido com ❤️ para máxima performance**