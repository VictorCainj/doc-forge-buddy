# Repository Pattern Implementation

## 📋 Visão Geral

Implementação completa do padrão Repository para abstração de dados no projeto Doc Forge Buddy, providing uma camada padronizada para acesso a dados com o Supabase.

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/repositories/
├── interfaces/           # Interfaces base
│   └── IRepository.ts
├── errors/              # Tratamento de erros customizado
│   └── RepositoryError.ts
├── logging/             # Sistema de logging e monitoramento
│   └── RepositoryLogger.ts
├── BaseRepository.ts    # Classe base com implementações comuns
├── ContractRepository.ts
├── UserRepository.ts
├── VistoriaRepository.ts
├── DocumentRepository.ts
├── NotificationRepository.ts
├── RepositoryFactory.ts # Factory pattern para criação
├── index.ts            # Exportações principais
└── examples/           # Exemplos de uso
    └── RepositoryExamples.ts
```

## 🚀 Funcionalidades Implementadas

### 1. Interface Base IRepository<T, ID>

```typescript
interface IRepository<T extends BaseEntity, ID = string> {
  // Operações CRUD básicas
  findById(id: ID): Promise<T | null>;
  findMany(filters?: Partial<T>): Promise<T[]>;
  findManyPaginated(filters?, page?, limit?): Promise<{data, total, page, totalPages}>;
  create(data): Promise<T>;
  update(id, data): Promise<T>;
  delete(id): Promise<void>;
  count(filters?): Promise<number>;
  exists(id): Promise<boolean>;
  
  // Operações avançadas
  findWithConditions(conditions, orderBy?, limit?): Promise<T[]>;
  bulkOperation(operation, data): Promise<{success, failed}>;
  transaction<R>(operations): Promise<R[]>;
}
```

### 2. Sistema de Erros Personalizado

```typescript
export class RepositoryError extends Error {
  // Tipos de erro específicos
  NOT_FOUND
  VALIDATION_ERROR
  CONNECTION_ERROR
  PERMISSION_ERROR
  UNIQUE_CONSTRAINT
  FOREIGN_KEY_CONSTRAINT
  TRANSACTION_ERROR
  BULK_OPERATION_ERROR
  
  // Métodos factory para cada tipo
  static notFound(entity, id): RepositoryError
  static validation(message, originalError?, entity?): RepositoryError
  static connection(message, originalError?, entity?): RepositoryError
  // ... outros métodos
}
```

### 3. Sistema de Logging e Performance

```typescript
class RepositoryLogger {
  // Log queries com métricas
  logQuery(level, entity, operation, query, startTime, parameters?, result?, error?)
  
  // Métricas de performance
  getPerformanceStats(entity?, operation?)
  generatePerformanceReport()
  
  // Filtros e consultas
  getLogs(filters?)
  getMetrics(filters?)
}
```

### 4. BaseRepository

Implementa operações comuns:
- Validação de dados
- Tratamento de erros padronizado
- Logging automático
- Transações básicas
- Cache de resultados

### 5. Repositories Específicos

#### ContractRepository
- `findByStatus(status)`
- `findByDocumentType(type)`
- `findByLocatario(nome)`
- `findByEndereco(endereco)`
- `findWithVencimentoProximo(dias)`
- `duplicate(id, newTitle)`
- `getStats()`

#### UserRepository
- `findByEmail(email)`
- `findByRole(role)`
- `findActiveUsers()`
- `activateUser(id)`
- `addExperience(id, amount)`
- `getStats()`

#### VistoriaRepository
- `findByType(tipo)`
- `findByContract(contractId)`
- `findWithApontamentos(vistoriaId)`
- `addApontamento(vistoriaId, apontamento)`
- `duplicate(vistoriaId, newTitle)`
- `getStats()`

#### DocumentRepository
- `findByType(documentType)`
- `findByContract(contractId)`
- `publishDocument(id)`
- `addFile(id, fileUrl, fileName, fileSize)`
- `duplicate(id, newTitle)`
- `getStats()`

#### NotificationRepository
- `findByUser(userId)`
- `findByType(type)`
- `findPending()`
- `markAsRead(id)`
- `markAllAsRead(userId)`
- `retry(id)`
- `getStats()`

### 6. Factory Pattern

```typescript
class RepositoryFactory {
  static get<T>(type: RepositoryType, userId?): T
  static configure(config: RepositoryFactoryConfig)
  static clearCache()
  static healthCheck()
  static createContext(userId?)
}
```

## 💡 Como Usar

### Configuração Inicial

```typescript
import { configureRepositories, enableRepositoryLogging } from '@/repositories';

// Configurar factory
configureRepositories({
  enableLogging: true,
  enablePerformanceMonitoring: true,
  defaultUserId: 'user-id',
  cacheEnabled: true,
  cacheTimeout: 300000
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

### Uso com Contexto

```typescript
import { createRepositoryContext } from '@/repositories';

const context = createRepositoryContext(userId);
const { contract, user, vistoria } = context.getAll();

// Operação complexa
const contracts = await contract.findManyPaginated({}, 1, 20);
const vistorias = await vistoria.findByContract(contracts.data[0]?.id);
```

### Operações Avançadas

```typescript
// Buscas complexas
const contracts = await contractRepo.findWithConditions([
  { column: 'status', operator: 'eq', value: 'active' },
  { column: 'created_at', operator: 'gte', value: '2024-01-01' }
], { column: 'created_at', ascending: false }, 50);

// Operações em lote
const result = await contractRepo.bulkOperation('create', [
  { title: 'Contrato 1', data1 },
  { title: 'Contrato 2', data2 }
]);

// Transações
const result = await contractRepo.transaction([
  () => userRepo.create(userData),
  (createdUser) => contractRepo.create({...contractData, userId: createdUser.id})
]);
```

### Monitoramento

```typescript
import { repositoryLogger, RepositoryFactory } from '@/repositories';

// Estatísticas
const stats = RepositoryFactory.getStats();
console.log('Repository stats:', stats);

// Health check
const health = await RepositoryFactory.healthCheck();
console.log('System health:', health);

// Performance
const performance = repositoryLogger.getPerformanceStats('Contract', 'findById');
console.log('Performance metrics:', performance);

// Relatório completo
repositoryLogger.generatePerformanceReport();
```

## 🔧 Integração com React

### Hook Customizado

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
        const data = await contractRepo.findMany();
        setContracts(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [userId]);

  return { contracts, loading, error };
};
```

### Componente

```typescript
import React from 'react';
import { useContracts } from '@/hooks/useContracts';

const ContractList: React.FC = () => {
  const { contracts, loading, error } = useContracts(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {contracts.map(contract => (
        <div key={contract.id}>
          <h3>{contract.title}</h3>
          <p>Status: {contract.document_type}</p>
        </div>
      ))}
    </div>
  );
};
```

## 📊 Métricas e Performance

### Métricas Coletadas

- **Tempo de execução** de cada query
- **Número de operações** por tipo
- **Taxa de erro** por repository
- **Frequência de uso** de cada método
- **Cache hit rate** (quando habilitado)

### Relatórios Disponíveis

```typescript
// Relatório de performance por entity
repositoryLogger.getPerformanceStats('Contract');

// Relatório de performance por operação
repositoryLogger.getPerformanceStats('Contract', 'findById');

// Relatório completo
repositoryLogger.generatePerformanceReport();

// Estatísticas do factory
RepositoryFactory.getStats();
```

## 🛡️ Segurança e Validação

### Validações Implementadas

- **Validação de entrada** em todos os métodos create/update
- **Sanitização de dados** para prevenir SQL injection
- **Controle de acesso** baseado no userId
- **Rate limiting** através de configuração
- **Audit trail** via logging

### Tratamento de Erros

- **Erros específicos** para cada tipo de falha
- **Logging automático** de erros
- **Retry logic** para operações falhadas
- **Rollback automático** em transações

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

1. **Interface padronizada** para todas as entidades
2. **Tratamento de erros consistente**
3. **Logging automático** de todas as operações
4. **Cache built-in** para melhor performance
5. **Validações centralizadas**
6. **Facilidade de teste** com mocking
7. **Documentação automática** via TypeScript

## 📈 Próximos Passos

### Melhorias Planejadas

1. **Cache distribuído** com Redis
2. **Queries otimizadas** com índices
3. **Paginação eficiente** com cursors
4. **Polling real-time** para mudanças
5. **Agregações complexas** via SQL views
6. **Migrations automáticas** de schema
7. **Backup/restore** integrado
8. **Métricas avançadas** com Prometheus

### Extensões Possíveis

1. **Repositories para outras entidades** (Prestadores, Empresas)
2. **Repository pattern para APIs externas**
3. **Event sourcing** com audit trail
4. ** CQRS pattern** para leitura/escrita
5. **GraphQL integration** sobre repositories
6. **Microservices pattern** para distribuição

## 🎯 Conclusão

A implementação do Repository Pattern fornece:

- ✅ **Abstração completa** do acesso a dados
- ✅ **Interface consistente** para todas as entidades
- ✅ **Tratamento de erros** robusto e padronizado
- ✅ **Logging e monitoramento** automático
- ✅ **Performance otimizada** com cache
- ✅ **Facilidade de manutenção** e extensão
- ✅ **Integração perfeita** com React/TypeScript
- ✅ **Documentação completa** e exemplos

O sistema está pronto para uso em produção e pode ser facilmente extendido para novas entidades ou funcionalidades.