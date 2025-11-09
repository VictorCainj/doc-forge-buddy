# Guia de Migração: ContractService

## Visão Geral

Este guia mostra como migrar gradualmente do sistema atual de contratos (usando `contractsService.ts` e chamadas diretas à API) para o novo `ContractService` com arquitetura em camadas.

## Estrutura Atual vs Nova Estrutura

### ❌ Sistema Atual (Legacy)
```
src/
├── services/contractsService.ts     # Service simples com API calls
├── hooks/useContractsQuery.ts      # Hook com Supabase direto
├── pages/Contratos.tsx             # Componente com lógica misturada
└── features/contracts/hooks/        # Hooks específicos
```

### ✅ Novo Sistema (ContractService)
```
src/
├── services/
│   ├── contracts/
│   │   ├── contract-service.interface.ts    # Interface do service
│   │   ├── contract.service.ts              # Implementação do service
│   │   ├── contract.repository.ts           # Repository com Supabase
│   │   └── contract-service-adapter.ts      # Adaptador para compatibilidade
│   ├── core/                                # Infraestrutura base
│   ├── events/                              # Event-driven architecture
│   ├── notifications/                       # Sistema de notificações
│   └── validation/                          # Validação centralizada
├── hooks/
│   └── useContractsQueryNew.ts              # Novos hooks com ContractService
├── examples/
│   └── ContractServiceMigration.tsx         # Exemplo de migração
└── docs/
    └── CONTRACT_SERVICE_MIGRATION_GUIDE.md  # Este guia
```

## Estratégia de Migração

### Fase 1: Preparação (Sem quebras)
1. **Adicionar o novo service** sem modificar código existente
2. **Criar adaptadores** para manter compatibilidade
3. **Testar em paralelo** com funcionalidades específicas

### Fase 2: Migração Gradual
1. **Substituir imports** nos componentes
2. **Atualizar hooks** para usar o novo service
3. **Adicionar novas funcionalidades** gradualmente

### Fase 3: Limpeza
1. **Remover código legado** após migração completa
2. **Otimizar imports** e dependências
3. **Documentar novas funcionalidades**

## Passo a Passo da Migração

### Passo 1: Atualizar Imports

**Antes:**
```typescript
// services/contractsService.ts
import { useContracts, useCreateContract } from '@/services/contractsService';

// hooks/useContractsQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
```

**Depois:**
```typescript
// Novo arquivo: hooks/useContractsQueryNew.ts
import { 
  useContracts, 
  useCreateContract, 
  useUpdateContract, 
  useDeleteContract,
  useRenewContract,
  useTerminateContract,
  useContractStats
} from '@/hooks/useContractsQueryNew';

import { contractServiceAdapter } from '@/services/contracts/contract-service-adapter';
```

### Passo 2: Substituir Hooks Básicos

**Antes:**
```typescript
// pages/Contratos.tsx
const useContractReducer = () => {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // ... 20+ useState
};

const performSearch = async (term: string) => {
  setIsLoading(true);
  // Lógica complexa de busca
  setIsLoading(false);
};
```

**Depois:**
```typescript
// Novo: hooks/useContractsQueryNew.ts
export function useContracts(filters: LegacyContractFilters = {}) {
  return useQuery({
    queryKey: ['contracts', 'list', filters],
    queryFn: () => contractServiceAdapter.getContracts(filters),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
  });
}
```

**Uso no componente:**
```typescript
// pages/Contratos.tsx
const { data: contractsResponse, isLoading } = useContracts(filters);
const contracts = contractsResponse?.contracts || [];
```

### Passo 3: Atualizar Mutations

**Antes:**
```typescript
// hooks/useContractsQuery.ts
const createMutation = useMutation({
  mutationFn: async (contract: any) => {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contract)
      .select()
      .single();
    if (error) throw error;
    return (data as unknown) as Contract;
  },
  // ... lógica de optimistic update
});
```

**Depois:**
```typescript
// Novo: hooks/useContractsQueryNew.ts
export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contract: Omit<LegacyContract, 'id' | 'createdAt' | 'updatedAt'>) =>
      contractServiceAdapter.createContract(contract),
    
    onMutate: async (newContract) => {
      // Optimistic update mais robusto
      await queryClient.cancelQueries({ queryKey: ['contracts'] });
      // ... resto da lógica
    },
  });
}
```

### Passo 4: Adicionar Novas Funcionalidades

**Adicionar renovações:**
```typescript
// pages/Contratos.tsx
const renewContract = useRenewContract();

const handleRenewContract = async (contractId: string, newEndDate: string) => {
  try {
    await renewContract.mutateAsync({
      id: contractId,
      renewalData: {
        newEndDate,
        renewalReason: 'Renovação automática',
        updatedTerms: {
          valorAluguel: 2500,
          dataVencimento: '10'
        }
      }
    });
  } catch (error) {
    showError('Erro ao renovar contrato');
  }
};
```

**Adicionar terminação:**
```typescript
// pages/Contratos.tsx
const terminateContract = useTerminateContract();

const handleTerminateContract = async (contractId: string, reason: string) => {
  try {
    await terminateContract.mutateAsync({
      id: contractId,
      terminationData: {
        terminationDate: new Date().toISOString(),
        reason,
        terminationType: 'mutual',
        propertyCondition: 'good',
        returnDate: '2024-12-31'
      }
    });
  } catch (error) {
    showError('Erro ao terminar contrato');
  }
};
```

**Adicionar métricas:**
```typescript
// pages/Contratos.tsx
const { data: stats } = useContractStats();

return (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
      <div className="text-sm text-neutral-600">Total de Contratos</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-green-600">{stats?.completionRate || 0}%</div>
      <div className="text-sm text-neutral-600">Taxa de Conclusão</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-purple-600">{stats?.recentActivity?.created || 0}</div>
      <div className="text-sm text-neutral-600">Criados Recentemente</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-red-600">{stats?.recentActivity?.terminated || 0}</div>
      <div className="text-sm text-neutral-600">Terminados</div>
    </div>
  </div>
);
```

### Passo 5: Atualizar UI com Novos Botões

**Antes:**
```typescript
// Lista de contratos sem ações avançadas
<div className="contract-list">
  {contracts.map(contract => (
    <div key={contract.id}>
      <h3>{contract.title}</h3>
      <p>Status: {contract.status}</p>
      <button onClick={() => generateDocument(contract.id)}>
        Gerar Documento
      </button>
    </div>
  ))}
</div>
```

**Depois:**
```typescript
// Lista com funcionalidades do ContractService
<div className="contract-list">
  {contracts.map(contract => (
    <div key={contract.id} className="border rounded-lg p-4">
      <h3>{contract.title}</h3>
      <p>Status: {contract.status}</p>
      <div className="flex gap-2 mt-3">
        <button 
          onClick={() => handleRenewContract(contract.id, '2025-12-31')}
          disabled={renewContract.isPending}
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm"
        >
          Renovar
        </button>
        <button 
          onClick={() => handleTerminateContract(contract.id, 'Rescisão')}
          disabled={terminateContract.isPending}
          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Terminar
        </button>
        <button onClick={() => generateDocument(contract.id)}>
          Gerar Documento
        </button>
      </div>
    </div>
  ))}
</div>
```

## Exemplo Completo de Migração

### Arquivo: `pages/Contratos.tsx`

```typescript
// === IMPORTS ATUALIZADOS ===
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus } from '@/utils/iconMapper';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useStandardToast } from '@/utils/toastHelpers';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { useDebouncedCallback } from '@/utils/core/debounce';

// === NOVOS HOOKS COM CONTRACT SERVICE ===
import { 
  useContracts, 
  useCreateContract, 
  useUpdateContract, 
  useDeleteContract,
  useRenewContract,
  useTerminateContract,
  useContractStats,
  useInvalidateContracts
} from '@/hooks/useContractsQueryNew';

import { LegacyContract, LegacyContractFilters } from '@/services/contracts/contract-service-adapter';

// === COMPONENTE MIGRADO ===
const Contratos = () => {
  const navigate = useNavigate();
  const { showError } = useStandardToast();
  const { profile, user } = useAuth();

  // Estados locais
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [filters, setFilters] = useState<LegacyContractFilters>({});

  // === HOOKS COM CONTRACT SERVICE ===
  const { data: contractsResponse, isLoading, error, refetch } = useContracts(filters);
  const { data: stats } = useContractStats();
  
  // Mutations
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const renewContract = useRenewContract();
  const terminateContract = useTerminateContract();
  
  const { invalidateAllContracts } = useInvalidateContracts();

  // Dados convertidos
  const contracts = contractsResponse?.contracts || [];
  const totalCount = contractsResponse?.total || 0;

  // === NOVAS FUNÇÕES DE NEGÓCIO ===
  const handleRenewContract = async (contractId: string, newEndDate: string) => {
    try {
      await renewContract.mutateAsync({
        id: contractId,
        renewalData: {
          newEndDate,
          renewalReason: 'Renovação automática'
        }
      });
    } catch (error) {
      showError('Erro ao renovar contrato');
    }
  };

  const handleTerminateContract = async (contractId: string, reason: string) => {
    try {
      await terminateContract.mutateAsync({
        id: contractId,
        terminationData: {
          terminationDate: new Date().toISOString(),
          reason,
          terminationType: 'mutual'
        }
      });
    } catch (error) {
      showError('Erro ao terminar contrato');
    }
  };

  const handleRefresh = () => {
    refetch();
    invalidateAllContracts();
  };

  // === RENDER ===
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white relative">
        <div className="relative z-10">
          {/* Header com botão de refresh */}
          <div className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="icon-container w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                      Contratos
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 font-medium truncate">
                      Gerencie todos os contratos de locação
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* NOVO: Botão de refresh */}
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {isLoading ? 'Carregando...' : 'Atualizar'}
                  </button>

                  <Link to="/cadastrar-contrato" className="flex-shrink-0">
                    <button className="inline-flex items-center gap-2 px-6 py-3 h-12 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg hover:shadow-xl">
                      <Plus className="h-5 w-5" />
                      <span className="hidden sm:inline">Novo Contrato</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* Estatísticas com dados do ContractService */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-neutral-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
                    <div className="text-sm text-neutral-600">Taxa de Conclusão</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.recentActivity.created}</div>
                    <div className="text-sm text-neutral-600">Criados Recentemente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.recentActivity.terminated}</div>
                    <div className="text-sm text-neutral-600">Terminados</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-neutral-500">Carregando estatísticas...</div>
              )}
            </div>

            {/* Lista com novas funcionalidades */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-lg font-semibold mb-4">Contratos ({totalCount})</h3>
              {isLoading ? (
                <div className="text-center text-neutral-500">Carregando contratos...</div>
              ) : error ? (
                <div className="text-center text-red-500">Erro ao carregar contratos</div>
              ) : contracts.length === 0 ? (
                <div className="text-center text-neutral-500">Nenhum contrato encontrado</div>
              ) : (
                <div className="space-y-4">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{contract.contractNumber}</h4>
                          <p className="text-sm text-neutral-600">{contract.clientName}</p>
                          <p className="text-sm text-neutral-500">{contract.property}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                            contract.status === 'active' ? 'bg-green-100 text-green-800' :
                            contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {contract.status}
                          </span>
                        </div>
                        
                        {/* NOVAS AÇÕES DO CONTRACT SERVICE */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRenewContract(contract.id, '2025-12-31')}
                            disabled={renewContract.isPending}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                          >
                            Renovar
                          </button>
                          <button
                            onClick={() => handleTerminateContract(contract.id, 'Rescisão por mútuo acordo')}
                            disabled={terminateContract.isPending}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                          >
                            Terminar
                          </button>
                          <button
                            onClick={() => deleteContract.mutate(contract.id)}
                            disabled={deleteContract.isPending}
                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                          >
                            Deletar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Contratos;
```

## Benefícios da Migração

### ✅ Para o Desenvolvedor
- **Separação de responsabilidades**: Repository, Service, Controller
- **Testabilidade**: Cada camada pode ser testada isoladamente
- **Reutilização**: Services podem ser usados em diferentes contextos
- **Manutenibilidade**: Código mais organizado e previsível

### ✅ Para o Usuário
- **Performance**: Cache inteligente e otimizações
- **Confiabilidade**: Retry automático e tratamento de erros
- **Funcionalidades**: Renovação, terminação e métricas avançadas
- **Notificações**: Feedback em tempo real das operações

### ✅ Para o Negócio
- **Escalabilidade**: Arquitetura preparada para crescimento
- **Monitoramento**: Logs e métricas integradas
- **Flexibilidade**: Facilidade para adicionar novos recursos
- **Robustez**: Tratamento completo de erros e edge cases

## Checklist de Migração

### Preparação
- [ ] Instalar dependências do novo service
- [ ] Configurar environment variables
- [ ] Testar em ambiente de desenvolvimento
- [ ] Backup do código atual

### Migração
- [ ] Criar adaptadores de compatibilidade
- [ ] Substituir imports nos componentes principais
- [ ] Atualizar hooks de React Query
- [ ] Testar funcionalidades básicas (CRUD)
- [ ] Adicionar novas funcionalidades (renovação, terminação)
- [ ] Implementar métricas e estatísticas
- [ ] Testar edge cases e tratamento de erros

### Pós-Migração
- [ ] Remover código legado
- [ ] Otimizar imports
- [ ] Atualizar documentação
- [ ] Treinar equipe nas novas funcionalidades
- [ ] Monitorar performance em produção

## Comandos Úteis

```bash
# Verificar se tudo está funcionando
npm run lint
npm run type-check
npm run test

# Verificar diferenças entre versão antiga e nova
git diff HEAD~1 HEAD -- src/services/contractsService.ts

# Verificar cobertura de testes
npm run test:coverage

# Executar migração em modo watch
npm run dev
```

## Suporte e Troubleshooting

### Problemas Comuns

1. **Erro de tipos**: Verificar se os tipos estão sendo importados corretamente
2. **Cache inválido**: Usar `invalidateAllContracts()` para limpar cache
3. **Performance**: Verificar se as queries estão sendo otimizadas
4. **Estados de loading**: Usar os estados dos mutations para feedback visual

### Recursos de Debug

```typescript
// Debug do ContractService
console.log('ContractService instance:', contractServiceAdapter.getContractService());

// Debug do cache
console.log('React Query cache:', queryClient.getQueryData(['contracts']));

// Debug de eventos
const eventBus = EventBus.getInstance();
eventBus.on('contract.*', (event) => {
  console.log('Contract event:', event);
});
```

Este guia deve ser seguido passo a passo, testando cada fase antes de prosseguir para a próxima. A migração gradual garante que não haja quebras no sistema e permite rollback caso necessário.