# 🏗️ Repository Pattern Implementation - Doc Forge Buddy

Implementação completa do padrão Repository para abstração de dados no projeto Doc Forge Buddy, providing uma camada padronizada para acesso a dados com Supabase.

## 📦 Estrutura Implementada

### 🎯 Arquivos Criados

```
src/repositories/
├── interfaces/
│   └── IRepository.ts           # Interface base com operações CRUD genéricas
├── errors/
│   └── RepositoryError.ts       # Sistema de erro customizado com tipos específicos
├── logging/
│   └── RepositoryLogger.ts      # Sistema de logging e monitoramento de performance
├── BaseRepository.ts            # Classe base com implementações comuns
├── ContractRepository.ts        # Repository específico para contratos
├── UserRepository.ts            # Repository específico para usuários
├── VistoriaRepository.ts        # Repository específico para vistorias
├── DocumentRepository.ts        # Repository específico para documentos
├── NotificationRepository.ts    # Repository específico para notificações
├── RepositoryFactory.ts         # Factory pattern para criação de repositories
├── index.ts                     # Exportações principais
├── examples/
│   └── RepositoryExamples.ts    # Exemplos completos de uso
└── __tests__/
    └── RepositoryPattern.test.ts # Testes básicos do sistema

# Documentação
REPOSITORY_PATTERN_IMPLEMENTATION.md  # Guia completo de implementação
```

## ✨ Funcionalidades Implementadas

### 1. **Interface Base IRepository<T, ID>**
- Operações CRUD básicas: `findById`, `findMany`, `create`, `update`, `delete`, `count`, `exists`
- Operações avançadas: `findManyPaginated`, `findWithConditions`, `bulkOperation`, `transaction`
- Tipagem forte com TypeScript generics

### 2. **Sistema de Erros Personalizado**
- `RepositoryError` com tipos específicos: `NOT_FOUND`, `VALIDATION_ERROR`, `CONNECTION_ERROR`, etc.
- Métodos factory para cada tipo de erro
- Conversão automática de erros desconhecidos
- Logging automático de erros

### 3. **Sistema de Logging e Performance**
- `RepositoryLogger` com singleton pattern
- Métricas de tempo de execução
- Contadores de operações
- Relatórios de performance
- Filtros por entidade, operação, usuário

### 4. **BaseRepository**
- Implementação de todas as operações comuns
- Validação automática de dados
- Tratamento de erros padronizado
- Logging automático de queries
- Suporte a transações básicas

### 5. **Repositories Específicos**

#### **ContractRepository**
```typescript
// Buscas especializadas
findByStatus(status)
findByDocumentType(type)
findByLocatario(nome)
findByEndereco(endereco)
findWithVencimentoProximo(dias)
findByDateRange(start, end)

// Operações especiais
duplicate(id, newTitle)
getStats()
findWithFilters(filters)
exportContracts(filters)
```

#### **UserRepository**
```typescript
// Buscas especializadas
findByEmail(email)
findByRole(role)
findActiveUsers()
searchUsers(searchTerm)

// Operações especiais
activateUser(id)
deactivateUser(id)
changeUserRole(id, role)
addExperience(id, amount)
getStats()
```

#### **VistoriaRepository**
```typescript
// Buscas especializadas
findByType(tipo)
findByContract(contractId)
findByDate(dataVistoria)
findWithApontamentos(vistoriaId)

// Operações especiais
addApontamento(vistoriaId, apontamento)
removeApontamento(vistoriaId, apontamentoId)
duplicate(vistoriaId, newTitle)
completeVistoria(vistoriaId)
```

#### **DocumentRepository**
```typescript
// Buscas especializadas
findByType(documentType)
findByContract(contractId)
findPublicDocuments()
searchDocuments(searchTerm)

// Operações especiais
publishDocument(id)
archiveDocument(id)
addFile(id, fileUrl, fileName, fileSize)
duplicate(id, newTitle)
```

#### **NotificationRepository**
```typescript
// Buscas especializadas
findByUser(userId)
findPending()
findSent()
findFailed()
findScheduled()

// Operações especiais
markAsRead(id)
markAllAsRead(userId)
retry(id)
createSystemNotification(title, message, type)
```

### 6. **Factory Pattern RepositoryFactory**
```typescript
// Configuração
configure(config: RepositoryFactoryConfig)

// Criação de repositories
get<T>(type: RepositoryType, userId?): T
createContext(userId?): RepositoryContext

// Monitoramento
healthCheck(): Promise<HealthReport>
getStats(): FactoryStats
clearCache(): void

// Contexto com conveniência
const context = createRepositoryContext(userId);
const { contract, user, vistoria } = context.getAll();
```

### 7. **Sistema de Cache**
- Cache de instances de repositories
- Configuração de timeout
- Limpeza automática
- Cache hit/miss tracking

## 🚀 Como Usar

### Configuração Inicial

```typescript
import { configureRepositories, enableRepositoryLogging } from '@/repositories';

// Configurar factory
configureRepositories({
  enableLogging: true,
  enablePerformanceMonitoring: true,
  defaultUserId: 'user-id',
  cacheEnabled: true,
  cacheTimeout: 300000 // 5 minutos
});

// Habilitar logging
enableRepositoryLogging(true);
```

### Uso Básico

```typescript
import { getContractRepository, getUserRepository } from '@/repositories';

const contractRepo = getContractRepository(userId);
const userRepo = getUserRepository(userId);

// Buscar contrato
const contract = await contractRepo.findById('contract-123');

// Criar usuário
const newUser = await userRepo.create({
  email: 'user@example.com',
  full_name: 'João Silva',
  role: 'user'
});
```

### Uso Avançado

```typescript
import { createRepositoryContext } from '@/repositories';

const context = createRepositoryContext(userId);
const { contract, user, vistoria, document, notification } = context.getAll();

// Buscas complexas
const contracts = await contract.findWithConditions([
  { column: 'status', operator: 'eq', value: 'active' },
  { column: 'created_at', operator: 'gte', value: '2024-01-01' }
], { column: 'created_at', ascending: false }, 50);

// Operações em lote
const result = await contract.bulkOperation('create', [
  { title: 'Contrato 1', data1 },
  { title: 'Contrato 2', data2 }
]);

// Transações
const result = await contract.transaction([
  () => userRepo.create(userData),
  (createdUser) => contractRepo.create({...contractData, userId: createdUser.id})
]);
```

### Integração com React

```typescript
import { useState, useEffect } from 'react';
import { getContractRepository } from '@/repositories';

export const useContracts = (userId: string) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const contractRepo = getContractRepository(userId);
        const data = await contractRepo.findManyPaginated({}, 1, 20);
        setContracts(data.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [userId]);

  return { contracts, loading, error, refetch: () => fetchContracts() };
};
```

## 📊 Monitoramento e Métricas

### Estatísticas Disponíveis

```typescript
import { repositoryLogger, RepositoryFactory } from '@/repositories';

// Estatísticas do factory
const factoryStats = RepositoryFactory.getStats();
console.log('Repository instances:', factoryStats.totalRepositories);
console.log('Cached repositories:', factoryStats.cachedRepositories);

// Health check
const health = await RepositoryFactory.healthCheck();
console.log('System health:', health.overall);

// Performance metrics
const performance = repositoryLogger.getPerformanceStats('Contract', 'findById');
console.log('Average query time:', performance.average, 'ms');
console.log('Total queries:', performance.total);

// Relatório completo
repositoryLogger.generatePerformanceReport();
```

### Logs Disponíveis

```typescript
// Filtrar logs por critérios
const errorLogs = repositoryLogger.getLogs({
  level: 'ERROR',
  entity: 'Contract',
  fromDate: '2024-01-01T00:00:00.000Z'
});

const userQueries = repositoryLogger.getLogs({
  entity: 'User',
  userId: 'user-123'
});
```

## 🧪 Testes

### Testes Unitários

```typescript
import { describe, it, expect } from 'vitest';
import { getContractRepository, RepositoryFactory } from '@/repositories';

describe('ContractRepository', () => {
  it('should find contract by ID', async () => {
    const contractRepo = getContractRepository('test-user');
    const contract = await contractRepo.findById('contract-123');
    
    expect(contract).toBeDefined();
    expect(contract.id).toBe('contract-123');
  });
});
```

### Teste de Integração

```typescript
import { createRepositoryContext } from '@/repositories';

const testIntegration = async () => {
  const context = createRepositoryContext('test-user');
  const { contract, user } = context.getAll();
  
  // Criar usuário e contrato associado
  const newUser = await user.create({ email: 'test@example.com' });
  const newContract = await contract.create({
    title: 'Test Contract',
    document_type: 'Termo do Locador',
    form_data: { nomeLocatario: newUser.full_name }
  });
  
  expect(newUser.id).toBeDefined();
  expect(newContract.id).toBeDefined();
};
```

## 🔄 Migração de Código Existente

### Antes (acesso direto ao Supabase)

```typescript
const { data, error } = await supabase
  .from('contracts')
  .select('*')
  .eq('id', contractId);

if (error) throw new Error(error.message);
return data;
```

### Depois (usando Repository)

```typescript
const contractRepo = getContractRepository(userId);
return await contractRepo.findById(contractId);
```

### Benefícios da Migração

✅ **Interface padronizada** para todas as entidades  
✅ **Tratamento de erros consistente**  
✅ **Logging automático** de todas as operações  
✅ **Cache built-in** para melhor performance  
✅ **Validações centralizadas**  
✅ **Facilidade de teste** com mocking  
✅ **Documentação automática** via TypeScript  

## 🎯 Principais Benefícios

### 1. **Abstração Completa**
- Isolamento da camada de dados
- Interface unificada para todas as entidades
- Facilita mudanças na estrutura do banco

### 2. **Robustez**
- Validação automática de dados
- Tratamento consistente de erros
- Retry logic para operações falhadas
- Audit trail via logging

### 3. **Performance**
- Cache inteligente de instances
- Monitoring de query performance
- Otimização de queries complexas
- Paginação eficiente

### 4. **Manutenibilidade**
- Código centralizado e reutilizável
- Testes mais fáceis de implementar
- Documentação automática
- Extensibilidade simplificada

### 5. **Developer Experience**
- Tipagem forte com TypeScript
- Intellisense completo
- Autocomplete de métodos
- IDE integration

## 📈 Métricas Coletadas

- **Tempo de execução** de cada query
- **Número de operações** por tipo
- **Taxa de erro** por repository
- **Cache hit rate** (quando habilitado)
- **Memory usage** de repositories

## 🛡️ Segurança

- Validação de entrada em todos os métodos
- Sanitização automática de dados
- Controle de acesso baseado em userId
- Rate limiting através de configuração
- Audit trail completo

## 🚀 Próximos Passos

### Melhorias Planejadas

1. **Cache distribuído** com Redis
2. **Queries otimizadas** com índices automáticos
3. **Real-time subscriptions** para mudanças
4. **Event sourcing** com audit trail
5. **GraphQL integration** sobre repositories
6. **Microservices pattern** para distribuição

### Extensões Possíveis

1. **Repositories para outras entidades** (Prestadores, Empresas)
2. **Repository pattern para APIs externas**
3. **CQRS pattern** para leitura/escrita
4. **Event-driven architecture** com repositories
5. **Multi-tenant support** nativo

## 🎉 Conclusão

O **Repository Pattern Implementation** está completo e pronto para uso em produção! 

### O que foi entregue:

✅ **Interface base completa** com todas as operações CRUD  
✅ **5 repositories específicos** totalmente funcionais  
✅ **Sistema de erros customizado** com tipos específicos  
✅ **Logging e monitoramento** automático  
✅ **Factory pattern** para criação centralizada  
✅ **Sistema de cache** inteligente  
✅ **Exemplos completos** de uso  
✅ **Testes básicos** implementados  
✅ **Documentação detalhada** com guia de migração  
✅ **Integração React** demonstrada  

O sistema oferece uma **abstração robusta e flexível** para acesso a dados, melhorando significativamente a **qualidade do código**, **facilidade de manutenção** e **experiência do desenvolvedor**.

**Status: ✅ IMPLEMENTAÇÃO COMPLETA E PRONTO PARA PRODUÇÃO**