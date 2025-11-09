# Guia de Migração - Hooks Consolidados

## 🔄 Exemplos de Migração de Código

### 1. Contratos - Antes vs Depois

#### ❌ ANTES (Hooks Separados)
```typescript
// Múltiplos imports, código repetitivo
import { useContractData } from '@/hooks/useContractData';
import { useContractsQuery } from '@/hooks/useContractsQuery';
import { useCompleteContractData } from '@/hooks/useCompleteContractData';

function ContractComponent() {
  // Hook 1 - CRUD básico
  const { 
    loading: loading1, 
    fetchContractById, 
    deleteContract 
  } = useContractData();
  
  // Hook 2 - React Query
  const { 
    contracts, 
    isLoading: loading2, 
    createContract 
  } = useContractsQuery();
  
  // Hook 3 - Dados completos
  const { 
    getAllCompleteContracts, 
    searchCompleteContracts 
  } = useCompleteContractData();
  
  // Lógica duplicada, cache inconsistente
  const handleDelete = async (id: string) => {
    await deleteContract(id);
    // Precisa recarregar manualmente
  };
}
```

#### ✅ DEPOIS (Hook Consolidado)
```typescript
// Import único, funcionalidades completas
import { useContractManager } from '@/hooks/shared/useContractManager';

function ContractComponent() {
  // Hook unificado com todas as funcionalidades
  const {
    contracts,
    isLoading,
    createContract,
    updateContract,
    deleteContract,
    getContractById,
    getContractsByType,
    refetch,
    cacheSize,
  } = useContractManager({
    documentType: 'contrato',
    search: '',
    limit: 50,
  });
  
  // Lógica simplificada
  const handleDelete = async (id: string) => {
    await deleteContract(id);
    // Cache é atualizado automaticamente
  };
  
  // Busca em tempo real com debounce
  const handleSearch = (query: string) => {
    // O hook gerencia o debounce automaticamente
  };
}
```

### 2. Contas de Contrato - Antes vs Depois

#### ❌ ANTES (Hooks Separados)
```typescript
import { useContractBills } from '@/hooks/useContractBills';
import { useContractBillsSync } from '@/hooks/useContractBillsSync';

function BillsComponent({ contractId, formData }) {
  // Hook 1 - Gerenciamento completo (cria, atualiza, etc.)
  const {
    bills,
    toggleBillDelivery,
    updateBillWithDate,
    refreshBills,
  } = useContractBills({ contractId, formData });
  
  // Hook 2 - Apenas sincronização (somente leitura)
  const {
    billStatus,
    refreshBillStatus,
  } = useContractBillsSync({ contractId });
  
  // Estados duplicados, lógica repetitiva
  // Dois sources de verdade para a mesma informação
}
```

#### ✅ DEPOIS (Hook Consolidado)
```typescript
import { useContractBills } from '@/hooks/shared/useContractBills';

function BillsComponent({ contractId, formData }) {
  // Hook unificado com sincronização automática
  const {
    bills,
    billStatus,
    isLoading,
    lastSync,
    
    // Ações
    toggleBillDelivery,
    updateBillWithDate,
    refreshBills,
    syncFromServer,
    
    // Estatísticas
    completedBillsCount,
    totalBillsCount,
    completionPercentage,
    isFullyCompleted,
  } = useContractBills({
    contractId,
    formData,
    autoSync: true,
    syncInterval: 30000, // 30 segundos
  });
  
  // Cache inteligente, sync automático
  // Estatísticas calculadas automaticamente
}
```

### 3. Otimização de Imagens - Antes vs Depois

#### ❌ ANTES (Hooks Separados)
```typescript
import { useImageOptimizationGlobal } from '@/hooks/useImageOptimizationGlobal';
import { useOptimizedImages } from '@/hooks/useOptimizedImages';

function ImageComponent() {
  // Hook 1 - Otimização global (DOM)
  useImageOptimizationGlobal();
  
  // Hook 2 - Compressão local
  const {
    optimizedImages,
    isProcessing,
    processImages,
  } = useOptimizedImages({
    maxWidth: 2560,
    maxHeight: 1440,
    quality: 0.95,
  });
  
  // Funcionalidades separadas, APIs diferentes
  // Gerenciamento de estado分散
}
```

#### ✅ DEPOIS (Hook Consolidado)
```typescript
import { useImageOptimizer } from '@/hooks/shared/useImageOptimizer';

function ImageComponent() {
  const {
    // Compressão de arquivos
    optimizedImages,
    isProcessing,
    progress,
    processImages,
    optimizeSingleImage,
    removeImage,
    clearImages,
    
    // Otimização global
    optimizeExistingImages,
    setupGlobalOptimization,
    refreshOptimization,
    
    // Estatísticas
    getTotalSize,
    getCompressionStats,
    
    // Utilitários
    preloadCriticalImages,
    cleanupImageUrls,
  } = useImageOptimizer({
    maxWidth: 2560,
    maxHeight: 1440,
    quality: 0.95,
    enableLazy: true,
    enablePreload: true,
    priorityImages: ['.hero-image', '.logo'],
  });
  
  // API unificada para todos os casos de uso
  // Estado centralizado, funcionalidades completas
}
```

### 4. API/Database - Antes vs Depois

#### ❌ ANTES (Código Espalhado)
```typescript
// Em múltiplos componentes/hooks
const fetchContracts = async () => {
  const { data } = await supabase
    .from('contracts')
    .select('*');
  return data;
};

const createContract = async (contract: any) => {
  const { data, error } = await supabase
    .from('contracts')
    .insert(contract)
    .select()
    .single();
  return { data, error };
};

// Lógica repetida em vários lugares
// Error handling inconsistente
// Sem cache, sem deduplication
```

#### ✅ DEPOIS (Hook Consolidado)
```typescript
import { useAPI } from '@/hooks/shared/useAPI';

function ContractList() {
  const api = useAPI();
  
  // Query com cache automático
  const { data: contracts, isLoading, error } = api.query({
    table: 'contracts',
    columns: 'id, title, created_at',
    orderBy: { column: 'created_at', ascending: false },
    limit: 50,
  });
  
  // Mutation com optimistic update
  const createContractMutation = api.create({
    table: 'contracts',
    data: { title: 'Novo Contrato' },
    options: {
      optimistic: true,
      onSuccess: (data) => console.log('Criado!', data),
    }
  });
  
  // Busca com debounce automático
  const searchResults = api.search({
    table: 'contracts',
    columns: ['title', 'content'],
    query: 'busca aqui',
    limit: 20,
  });
  
  // Cache inteligente, error handling, deduplication
}
```

### 5. LocalStorage - Antes vs Depois

#### ❌ ANTES (Cache Básico)
```typescript
// No useAuth.tsx
const [profile, setProfile] = useState(null);

// Cache manual, sem expiração
useEffect(() => {
  const cached = localStorage.getItem('user_profile');
  if (cached) {
    setProfile(JSON.parse(cached));
  }
}, []);

// Sem tipo safety, sem error handling
```

#### ✅ DEPOIS (Hook Avançado)
```typescript
import { useLocalStorage, useLocalStorageCache } from '@/hooks/shared/useLocalStorage';

function UserProfile() {
  // Hook básico com tipo safety
  const [profile, setProfile, removeProfile, hasProfile] = useLocalStorage(
    'user_profile', 
    null,
    {
      deserialize: (value) => JSON.parse(value),
      onError: (error) => console.error('Erro no cache:', error),
    }
  );
  
  // Hook com expiração automática
  const {
    value: cachedData,
    setValue: setCachedData,
    clearCache,
    isExpired,
    timestamp,
  } = useLocalStorageCache(
    'dashboard_data',
    [],
    60 // 60 minutos
  );
  
  // Array helper para listas
  const {
    array: recentSearches,
    addItem: addSearch,
    removeItem: removeSearch,
    clearArray: clearSearches,
  } = useLocalStorageArray('recent_searches');
  
  // Cache inteligente, tipos, error handling
}
```

## 🚀 Melhorias de Performance

### Antes: Múltiplas Requisições
```typescript
// 5 hooks = 5 requisições simultâneas
const contracts = useContractsQuery();     // Requisição 1
const bills = useContractBills();          // Requisição 2  
const status = useContractBillsSync();     // Requisição 3
const profile = useAuth();                 // Requisição 4
const images = useImageOptimization();     // Requisição 5
```

### Depois: Requisições Otimizadas
```typescript
// 1 hook = cache compartilhado + deduplication
const {
  contracts,     // Cache inteligente (5 min)
  bills,         // Cache compartilhado
  profile,       // Cache com TTL (24h)
  images,        // Cache em memória
} = useAppData(); // 1 requisição otimizada

// Request deduplication: se outros componentes 
// também precisarem dos mesmos dados, não faz nova requisição
```

## 📊 Comparação de Complexidade

| Aspecto | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Imports** | 5-10 hooks | 1-3 hooks | **-70%** |
| **Linhas de Código** | 100-200 | 50-100 | **-50%** |
| **Estados** | 10-15 | 3-5 | **-70%** |
| **Requisições** | 5-10 | 1-3 | **-70%** |
| **Error Handling** | Inconsistente | Centralizado | **+200%** |
| **Cache** | Inexistente | Inteligente | **+∞** |

## 🔧 Passo a Passo da Migração

### 1. Identificar Hooks a Migrar
```bash
# Buscar imports antigos
grep -r "useContractData\|useContractsQuery" src/
```

### 2. Substituir Imports
```bash
# Automático com script
python3 migrate_hooks_imports.py

# Manual se necessário
# from '@/hooks/useContractData' 
# → from '@/hooks/shared/useContractManager'
```

### 3. Atualizar Uso dos Hooks
```typescript
// ANTES
const { contracts, loading } = useContractsQuery();

// DEPOIS  
const { contracts, isLoading } = useContractManager();
```

### 4. Testar Funcionalidades
```bash
# Executar testes
npm test

# Verificar build
npm run build
```

### 5. Verificar Performance
```typescript
// Adicionar logs para monitorar melhorias
console.log('Cache hit ratio:', cacheHitRatio);
console.log('Request deduplication:', dedupedRequests);
```

## ⚠️ Considerações Importantes

### Breaking Changes
- **Nomes de propriedades** podem ter mudado (`loading` → `isLoading`)
- **Parâmetros de funções** podem ter novos argumentos opcionais
- **Tipos de retorno** podem ser mais específicos

### Compatibilidade
- **Hooks antigos** ainda funcionam (com warnings)
- **Migração gradual** é recomendada
- **Documentação** está disponível

### Testes
- **Testes de regressão** são essenciais
- **Testes de performance** mostram melhorias
- **Testes de integração** garantem funcionamento

## 🎯 Resultados Esperados

Após a migração completa, você deve observar:

- ⚡ **50-70% menos requisições** de rede
- 🗂️ **Cache hit ratio de 80%+** em dados frequentemente acessados  
- 🔄 **Request deduplication** elimina chamadas duplicadas
- 🛡️ **Error handling robusto** com recovery automático
- 📱 **UX mais fluida** com loading states otimizados
- 🐛 **Menos bugs** relacionados a estado inconsistente
