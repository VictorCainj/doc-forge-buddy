# Services Layer - Documentação

Esta documentação descreve a implementação da camada de services para lógica de negócio da aplicação.

## 📋 Visão Geral

A camada de services implementa uma arquitetura robusta para lógica de negócio, incluindo:

- **Service interfaces padronizadas** para operações CRUD
- **ContractService especializado** para gestão de contratos
- **Injeção de dependências** com ServiceContainer
- **Event-driven architecture** com EventBus
- **Validação centralizada** com ValidationService
- **Sistema de notificações** com NotificationService
- **Decorators** para cross-cutting concerns
- **Transações e métricas** integradas

## 🏗️ Estrutura

```
src/services/
├── core/
│   ├── interfaces.ts          # Interfaces base dos services
│   ├── base-service.ts        # Implementação base dos services
│   ├── service-container.ts   # Container de injeção de dependências
│   └── service-decorators.ts  # Decorators para cross-cutting concerns
├── contracts/
│   ├── contract-service.interface.ts  # Interface específica do ContractService
│   ├── contract.service.ts            # Implementação do ContractService
│   └── contract.repository.ts         # Repository para acesso a dados
├── notifications/
│   └── notification.service.ts        # Serviço de notificações
├── validation/
│   └── validation.service.ts          # Serviço de validação
├── events/
│   └── event-bus.ts                   # Sistema de eventos
├── examples/
│   └── usage-examples.ts             # Exemplos de uso
└── index.ts                           # Exportações principais
```

## 🚀 Início Rápido

### Uso Básico

```typescript
import { createContractService } from '@/services';

const contractService = createContractService();

// Criar contrato
const contrato = await contractService.create({
  title: 'Contrato de Locação',
  form_data: {
    numeroContrato: 'LOC-2024-001',
    nomeLocatario: 'João da Silva',
    enderecoImovel: 'Rua das Flores, 123',
    dataFirmamentoContrato: '2024-01-01',
    dataTerminoRescisao: '2024-12-31'
  },
  document_type: 'Termo do Locador',
  content: 'Conteúdo do contrato...'
});
```

### Com Container de Dependências

```typescript
import { ServiceContainer, ServiceContainerFactory } from '@/services';

const container = ServiceContainerFactory.createDefault();
const contractService = container.get('ContractService');
const notificationService = container.get('NotificationService');

// Usar services
const contrato = await contractService.create({ /* ... */ });
await notificationService.notifyContractCreated(contrato);
```

## 📚 Interfaces Principais

### IService<T, CreateDTO, UpdateDTO>

Interface base para todos os services:

```typescript
interface IService<T, CreateDTO, UpdateDTO> {
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<T | null>;
  findMany(filters?: SearchFilters, options?: PaginationOptions): Promise<T[]>;
  findManyPaginated(filters?: SearchFilters, options?: PaginationOptions): Promise<PaginatedResult<T>>;
  exists(id: string): Promise<boolean>;
  count(filters?: SearchFilters): Promise<number>;
}
```

### IContractService

Interface específica para contratos:

```typescript
interface IContractService extends IService<Contract, CreateContractData, UpdateContractData> {
  // Renovação
  renewContract(id: string, renewalData: ContractRenewalData): Promise<Contract>;
  canRenewContract(id: string): Promise<{ canRenew: boolean; reason?: string }>;
  
  // Terminação
  terminateContract(id: string, terminationData: ContractTerminationData): Promise<Contract>;
  canTerminateContract(id: string): Promise<{ canTerminate: boolean; reason?: string }>;
  
  // Métricas
  calculateContractMetrics(contractId: string): Promise<ContractMetrics>;
  calculateGlobalMetrics(filters?: ContractFilters): Promise<ContractCalculationResult>;
  
  // Buscas avançadas
  searchContracts(searchQuery: string, filters?: ContractFilters): Promise<PaginatedResult<Contract>>;
  findRelatedContracts(contractId: string, relationshipType: 'client' | 'property'): Promise<Contract[]>;
}
```

## 🔧 BaseService

A classe `BaseService` implementa funcionalidades comuns:

- ✅ Validação de dados
- ✅ Emissão de eventos
- ✅ Transações
- ✅ Métricas de performance
- ✅ Tratamento de erros
- ✅ Logging
- ✅ Retry automático

```typescript
abstract class BaseService<T, CreateDTO, UpdateDTO> implements 
  IService<T, CreateDTO, UpdateDTO>,
  IValidatableService<T, CreateDTO, UpdateDTO>,
  IEventSourcedService<T, CreateDTO, UpdateDTO>,
  ITransactionalService<T, CreateDTO, UpdateDTO> {
  
  // Implementa todas as operações CRUD automaticamente
  // Serviços específicos só precisam implementar métodos do_*
}
```

## 🎯 ContractService

O `ContractService` implementa toda a lógica de negócio específica de contratos:

### Operações de Renovação

```typescript
// Renovar contrato
const contratoRenovado = await contractService.renewContract(contractId, {
  newEndDate: '2025-01-01',
  renewalReason: 'Renovação anual',
  updatedTerms: {
    observacao: 'Observações atualizadas'
  }
});

// Verificar se pode renovar
const { canRenew, reason } = await contractService.canRenewContract(contractId);
```

### Operações de Terminação

```typescript
// Terminar contrato
const contratoTerminado = await contractService.terminateContract(contractId, {
  terminationDate: '2024-06-01',
  reason: 'Rescisão por descumprimento',
  terminationType: 'breach',
  propertyCondition: 'good',
  damagesAmount: 0
});
```

### Métricas e Analytics

```typescript
// Calcular métricas globais
const metricas = await contractService.calculateGlobalMetrics({
  status: 'active',
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
});

// Gerar relatório
const relatorio = await contractService.generateReport('analytics', filtros);
```

### Buscas Avançadas

```typescript
// Busca textual
const resultados = await contractService.searchContracts('João Silva', {
  status: 'active',
  dateRange: { start: '2024-01-01', end: '2024-12-31' }
});

// Contratos relacionados
const relacionados = await contractService.findRelatedContracts(
  contractId, 
  'client' // ou 'property', 'documentType'
);
```

## 📢 EventBus

Sistema de eventos para comunicação entre services:

```typescript
import { CONTRACT_EVENTS } from '@/services';

const eventBus = createEventBus();

// Registrar listener
eventBus.on(CONTRACT_EVENTS.CREATED, (event) => {
  console.log('Contrato criado:', event);
});

// Em eventos
await eventBus.emit({
  type: CONTRACT_EVENTS.RENEWED,
  contractId: '123',
  data: { newEndDate: '2025-01-01' }
});
```

### Eventos Disponíveis

```typescript
const CONTRACT_EVENTS = {
  CREATED: 'contract.created',
  UPDATED: 'contract.updated',
  DELETED: 'contract.deleted',
  RENEWED: 'contract.renewed',
  TERMINATED: 'contract.terminated',
  STATUS_CHANGED: 'contract.statusChanged',
  EXPIRING: 'contract.expiring',
  EXPIRED: 'contract.expired',
  FORM_DATA_UPDATED: 'contract.formDataUpdated',
  DOCUMENT_GENERATED: 'document.generated',
  FAVORITE_ADDED: 'contract.favoriteAdded',
  FAVORITE_REMOVED: 'contract.favoriteRemoved',
  TAG_ADDED: 'contract.tagAdded',
  TAG_REMOVED: 'contract.tagRemoved'
};
```

## ✅ ValidationService

Serviço para validação centralizada:

```typescript
const validationService = createValidationService();

// Validar dados de contrato
const resultado = validationService.validateContractFormData(formData);

if (!resultado.isValid) {
  console.log('Erros:', resultado.errors);
  console.log('Avisos:', resultado.warnings);
  console.log('Sugestões:', resultado.suggestions);
}

// Validar renovação
const renovacaoValida = validationService.validateContractRenewal(
  dadosAtuais,
  { newEndDate: '2025-01-01' }
);
```

## 📧 NotificationService

Sistema de notificações multi-canal:

```typescript
const notificationService = createNotificationService();

// Notificações automáticas (usadas pelos services)
await notificationService.notifyContractCreated(contract);
await notificationService.notifyContractRenewed(contract);
await notificationService.notifyContractTerminated(contract, terminationData);

// Notificação customizada
await notificationService.sendCustom({
  type: 'custom.event',
  title: 'Evento Personalizado',
  message: 'Mensagem do evento',
  priority: 'high',
  channels: ['email', 'webhook']
});
```

## 🎨 Decorators

Decorators para cross-cutting concerns:

```typescript
@Loggable({ level: 'info', includeArgs: true })
@Cacheable({ ttl: 300000 })
@Retryable({ attempts: 3, delay: 1000 })
@Monitorable({ trackPerformance: true })
@Validatable({ validateInput: true })
@RateLimited({ maxRequests: 10, windowMs: 60000 })
@Secure({ requireAuth: true })
class MeuService {
  async minhaOperacao(dados: any): Promise<any> {
    // Lógica da operação
  }
}
```

## 🔄 Transações

Suporte a transações automáticas:

```typescript
const resultado = await contractService.executeInTransaction(async () => {
  const contrato1 = await contractService.create(dados1);
  const contrato2 = await contractService.create(dados2);
  const relacionado = await contractService.update(contrato1.id, { /* ... */ });
  
  return { contrato1, contrato2, relacionado };
});
// Transaction é comittada automaticamente
// Em caso de erro, é rollback automático
```

## 📊 Métricas

Coleta automática de métricas:

```typescript
const contractService = createContractService();

// Métricas são coletadas automaticamente
await contractService.create(dados);
await contractService.findMany();

// Acessar métricas
const metricas = contractService.getMetrics();
const tempoMedio = contractService.getAverageExecutionTime('create');
const taxaErro = contractService.getErrorRate();
```

## 🔌 Integração com React

Hooks para uso em componentes React:

```typescript
import { useContractService, useNotificationService } from '@/services';

function MeuComponente() {
  const contractService = useContractService();
  const notificationService = useNotificationService();

  const criarContrato = async (dados) => {
    try {
      const contrato = await contractService.create(dados, {
        onSuccess: (op, data) => {
          console.log('Sucesso:', op, data);
        },
        onError: (op, error) => {
          console.error('Erro:', op, error);
          notificationService.notifyError(error);
        }
      });
      
      return contrato;
    } catch (error) {
      console.error('Erro capturado:', error);
    }
  };

  return (
    // JSX do componente
  );
}
```

## 🛠️ Configuração

### Configuração do Container

```typescript
const container = new ServiceContainer({
  userId: 'user123',
  tenantId: 'tenant456',
  metadata: { /* metadados extras */ }
});

// Registrar services
container.registerSingleton('ContractService', createContractService, {
  dependsOn: ['EventBus', 'NotificationService']
});

container.registerSingleton('EventBus', createEventBus);
container.registerSingleton('NotificationService', createNotificationService);

// Inicializar
container.initialize();
```

### Configuração de Serviços

```typescript
const contractService = new ContractService();

// Configurar timeout e retry
contractService.config = {
  name: 'ContractService',
  version: '1.0.0',
  timeout: 30000,     // 30 segundos
  retryAttempts: 3,   // 3 tentativas
  enableMetrics: true,
  enableValidation: true,
  enableLogging: true
};
```

## 🧪 Testes

Exemplos de uso estão disponíveis em `examples/usage-examples.ts`. Para executar:

```typescript
import { executarTodosExemplos } from '@/services/examples/usage-examples';

executarTodosExemplos();
```

## 📖 Boas Práticas

### 1. Sempre usar callbacks para operações async
```typescript
await contractService.create(dados, {
  onSuccess: (op, data) => console.log('Sucesso!', op, data),
  onError: (op, error) => console.error('Erro!', op, error)
});
```

### 2. Validar dados antes de operations complexas
```typescript
const validacao = validationService.validateContractFormData(dados);
if (!validacao.isValid) {
  // Tratar erros de validação
  return;
}
```

### 3. Usar transações para operations multi-step
```typescript
await service.executeInTransaction(async () => {
  // Múltiplas operations que devem ser atômicas
});
```

### 4. Implementar event listeners para feedback
```typescript
eventBus.on(CONTRACT_EVENTS.RENEWED, async (event) => {
  // Atualizar UI, enviar notificações, etc.
});
```

### 5. Usar métricas para monitorar performance
```typescript
const metrics = service.getMetrics();
// Monitorar tempo médio, taxa de erro, etc.
```

## 🚨 Tratamento de Erros

### Tipos de Erro

- `ValidationErrorCollection` - Erros de validação
- `NotFoundError` - Entidade não encontrada
- `BusinessRuleError` - Violação de regra de negócio
- `TransactionError` - Erro em transação

### Estratégias

1. **Validation First** - Validar antes de operations
2. **Graceful Degradation** - Continuar com warnings
3. **Error Events** - Emitir eventos de erro
4. **Notification** - Notificar erros críticos
5. **Metrics** - Registrar métricas de erro

## 📈 Performance

### Otimizações Implementadas

- **Caching** - Cache automático de results
- **Pagination** - Busca paginada por padrão
- **Connection Pooling** - Pool de conexões DB
- **Async/Await** - Operações assíncronas
- **Batch Operations** - Operações em lote
- **Metrics Collection** - Monitoramento de performance

### Monitoring

```typescript
// Coleta de métricas
const metrics = service.getMetrics();

// Verificar performance
const avgTime = service.getAverageExecutionTime('create');
const errorRate = service.getErrorRate();

// Limpar métricas quando necessário
service.clearMetrics();
```

## 🔒 Segurança

### Validações de Segurança

- **Input Sanitization** - Sanitização automática
- **Authentication** - Requer autenticação
- **Authorization** - Verificar permissões
- **Rate Limiting** - Limite de requisições
- **Data Encryption** - Criptografia opcional

### Configuração de Segurança

```typescript
@Secure({ 
  requireAuth: true, 
  requireRole: ['admin', 'manager'],
  encryptData: true,
  sanitizeInput: true
})
class AdminService {
  // Métodos seguros
}
```

## 📚 Próximos Passos

1. **Implementar testes unitários** para todos os services
2. **Adicionar cache distribuído** (Redis)
3. **Implementar circuit breaker** para resiliência
4. **Adicionar monitoring** (Prometheus/Grafana)
5. **Implementar rate limiting** global
6. **Adicionar logging estruturado** (JSON logs)

## 🤝 Contribuindo

Para contribuir com a camada de services:

1. Seguir as interfaces existentes
2. Implementar testes para novos services
3. Documentar novos métodos e exemplos
4. Garantir que métricas sejam coletadas
5. Implementar validações adequadas
6. Adicionar event emission quando apropriado

---

Esta implementação fornece uma base sólida e extensível para toda a lógica de negócio da aplicação, seguindo as melhores práticas de arquitetura de software.