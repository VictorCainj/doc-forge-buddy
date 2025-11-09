# Data Transfer Objects (DTOs) - Guia de Implementação

## Visão Geral

Os Data Transfer Objects (DTOs) são padrões de projeto usados para transferir dados entre processos, neste caso, entre diferentes camadas da aplicação. Eles fornecem uma comunicação segura e tipada entre as camadas, evitando vazamento de dados sensíveis e garantindo consistência.

## Estrutura Implementada

### 📁 Arquivos Criados

1. **`/src/types/dto/contract.dto.ts`** - DTOs para contratos
2. **`/src/types/dto/property.dto.ts`** - DTOs para propriedades  
3. **`/src/types/dto/user.dto.ts`** - DTOs para usuários
4. **`/src/types/dto/index.ts`** - Índice e utilitários genéricos
5. **`/src/types/dto/dto.test.ts`** - Testes abrangentes

## Principais Características

### ✅ Vantagens dos DTOs Implementados

1. **Type Safety**: TypeScript completo com inferência de tipos
2. **Validação Runtime**: Schemas Zod para validação de dados
3. **Segurança**: Sanitização automática de campos sensíveis
4. **Performance**: Transformações otimizadas e memoização
5. **Flexibilidade**: Mapping bidirecional entre entidades e DTOs
6. **Testabilidade**: Testes unitários e de integração completos

### 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controller    │────│  Service Layer  │────│   Repository    │
└─────────────────┘    └─────────────────┘    └─────────────────�
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DTO Layer     │────│  Entity Layer   │────│  Database       │
│   (API Input)   │    │  (Business)     │    │  (Raw Data)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ DTO Validation  │────│  Type Guards    │────│ Data Mapping    │
│ & Sanitization  │    │  & Assertions   │    │ & Transforms    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Uso Prático

### 1. Contratos

```typescript
import { 
  CreateContractDTO, 
  ContractResponseDTO,
  validateCreateContract,
  contractToResponseDTO 
} from '@/types/dto';

// Criando um contrato
const createContractData: CreateContractDTO = {
  propertyId: '123e4567-e89b-12d3-a456-426614174000',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T23:59:59.999Z',
  monthlyRent: 2500,
  status: 'active'
};

// Validação automática
const validatedData = validateCreateContract(createContractData);

// Service layer
async function createContract(data: CreateContractInput) {
  // Dados já validados e tipados
  const contract = await contractRepository.create(data);
  return contractToResponseDTO(contract);
}
```

### 2. Propriedades

```typescript
import {
  CreatePropertyDTO,
  PropertyResponseDTO,
  validateCreateProperty,
  propertyToResponseDTO,
  formatFullAddress
} from '@/types/dto';

// Criando uma propriedade
const createPropertyData: CreatePropertyDTO = {
  address: 'Rua das Flores, 123',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  type: 'apartment',
  area: 85,
  furnished: false,
  parkingSpaces: 1,
  ownerId: '123e4567-e89b-12d3-a456-426614174001',
  isActive: true
};

// Validação e formatação
const validatedProperty = validateCreateProperty(createPropertyData);
const propertyDTO = propertyToResponseDTO(validatedProperty);
const formattedAddress = formatFullAddress(propertyDTO);
```

### 3. Usuários

```typescript
import {
  CreateUserDTO,
  UserResponseDTO,
  validateCreateUser,
  userToResponseDTO,
  hasPermission,
  sanitizeUserData
} from '@/types/dto';

// Criando um usuário
const createUserData: CreateUserDTO = {
  email: 'usuario@exemplo.com',
  password: 'SenhaSegura123!',
  fullName: 'João da Silva',
  role: 'user',
  isActive: true
};

// Validação e sanitização
const validatedUser = validateCreateUser(createUserData);
const userDTO = userToResponseDTO(validatedUser);

// Verificação de permissões
if (hasPermission(userDTO, 'admin_access')) {
  // Usuário tem acesso
}

// Sanitização para contexto público
const publicData = sanitizeUserData(userDTO);
```

## Utilitários Avançados

### TransformUtils

```typescript
import { TransformUtils } from '@/types/dto';

// Transformação em lote
const contracts = await contractRepository.findAll();
const contractDTOs = TransformUtils.entitiesToDTOs(contracts, contractMapper);

// Paginação
const paginated = TransformUtils.paginateDTOs(
  contracts, 
  contractMapper, 
  page: 1, 
  pageSize: 10
);

// Filtros
const activeContracts = TransformUtils.filterAndMapDTOs(
  contracts,
  contractMapper,
  (contract) => contract.status === 'active'
);
```

### ValidationUtils

```typescript
import { ValidationUtils } from '@/types/dto';

// Sanitização por contexto
const publicUser = ValidationUtils.sanitizeByContext(
  userData, 
  'public',
  {
    email: (email) => email.replace(/@.*/, '@hidden.com')
  }
);

const internalUser = ValidationUtils.sanitizeByContext(
  userData, 
  'internal'
);
```

### TypeGuardUtils

```typescript
import { TypeGuardUtils } from '@/types/dto';

// Validação de tipos
if (TypeGuardUtils.isValidDTO(contractData, isContractDTO)) {
  // Dados são válidos
}

// Asserção de tipos
TypeGuardUtils.assertDTO(contractData, isContractDTO, 'Invalid contract data');
```

## Validação de Dados

### Schemas Zod

Todos os DTOs possuem schemas de validação Zod:

```typescript
// Validação automática na entrada
const createData = CreateContractSchema.parse(request.body);

// Validação customizada
const customValidation = CreateContractSchema.refine(
  (data) => data.monthlyRent > 0,
  { message: 'Monthly rent must be positive', path: ['monthlyRent'] }
);
```

### Campos Calculados

Os DTOs automaticamente calculam campos derivados:

```typescript
const contractDTO = contractToResponseDTO(contract);
// Campos calculados automaticamente:
- duration: número de meses
- totalValue: valor total do contrato
- isActive: se o contrato está ativo
- daysRemaining: dias restantes
- overdueDays: dias de atraso
```

## Segurança

### Campos Sensíveis

Automáticamente removidos baseado no contexto:

```typescript
// Contextos disponíveis
type Context = 'public' | 'internal' | 'admin';

// Campos sempre removidos
const SENSITIVE_FIELDS = [
  'password',
  'twoFactorSecret',
  'twoFactorBackupCodes',
  'refreshToken',
  'sessionToken',
  'salt'
] as const;
```

### Validação de Permissões

```typescript
// Verificação de permissões
if (!hasPermission(user, 'create_contract')) {
  throw new ForbiddenError('Insufficient permissions');
}

// Verificação baseada em role
if (user.role === 'admin') {
  // Admin tem acesso total
}
```

## Performance

### Memoização

Transformações custosas são automaticamente memoizadas:

```typescript
const memoizedTransform = memoizeTransform(
  (contracts) => contracts.map(contractToResponseDTO),
  (contracts) => contracts.map(c => c.id).join(',')
);
```

### Otimizações

- **Transformações em lote**: Processa múltiplas entidades de uma vez
- **Lazy loading**: Carrega dados sob demanda
- **Caching**: Cache de transformações frequentes

## Integração com React Query

```typescript
// Query com DTOs
const { data: contracts } = useQuery({
  queryKey: ['contracts'],
  queryFn: async (): Promise<ContractResponseDTO[]> => {
    const response = await contractAPI.getContracts();
    return response.data.map(contractToResponseDTO);
  }
});

// Mutation com validação
const createContract = useMutation({
  mutationFn: async (data: CreateContractInput) => {
    const validatedData = validateCreateContract(data);
    return await contractAPI.createContract(validatedData);
  }
});
```

## Testes

### Testes Unitários

```typescript
import { describe, it, expect } from 'vitest';
import { 
  validateCreateContract, 
  contractToResponseDTO,
  formatCurrency 
} from '@/types/dto';

describe('Contract DTOs', () => {
  it('should validate and transform contract data', () => {
    const input = {
      propertyId: 'valid-uuid',
      tenantId: 'valid-uuid',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-12-31T23:59:59.999Z',
      monthlyRent: 2500,
      status: 'active'
    };

    const validated = validateCreateContract(input);
    const contract = { ...validated, id: 'contract-id' };
    const dto = contractToResponseDTO(contract);
    
    expect(dto.duration).toBe(12);
    expect(dto.totalValue).toBe(30000);
  });
});
```

## Boas Práticas

### ✅ Faça

- Use DTOs para comunicação entre camadas
- Valide dados na entrada
- Sanitize dados na saída
- Use type guards para verificação
- Documente schemas complexos
- Teste transformações

### ❌ Evite

- Expor entidades diretamente na API
- Enviar campos sensíveis sem sanitização
- Esquecer validação de entrada
- Misturar lógica de negócio em DTOs
- Usar any sem type guards

## Extensibilidade

### Adicionando Novos DTOs

1. Crie interface do DTO
2. Implemente schema Zod
3. Adicione funções de mapeamento
4. Configure type guards
5. Adicione testes
6. Exporte no índice

### Exemplo de Extensão

```typescript
// 1. Interface
export interface CreateVisitDTO {
  propertyId: string;
  visitorId: string;
  scheduledDate: string;
  purpose: string;
}

// 2. Schema
export const CreateVisitSchema = z.object({
  propertyId: z.string().uuid(),
  visitorId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  purpose: z.string().min(1).max(200)
});

// 3. Mapper
export function visitToResponseDTO(visit: any): VisitResponseDTO {
  return {
    id: visit.id,
    propertyId: visit.propertyId,
    visitorId: visit.visitorId,
    scheduledDate: visit.scheduledDate,
    purpose: visit.purpose,
    status: visit.status,
    createdAt: visit.createdAt
  };
}
```

## Monitoramento e Debug

### Logging de Transformações

```typescript
const contractDTO = contractToResponseDTO(contract);
// Log automático para debug
console.log('Contract transformed:', {
  id: contractDTO.id,
  duration: contractDTO.duration,
  transformations: ['property_to_dto', 'user_to_dto', 'calculations']
});
```

### Métricas de Performance

```typescript
// Timing de transformações
const start = performance.now();
const dtos = TransformUtils.entitiesToDTOs(entities, mapper);
const end = performance.now();
console.log(`Transformation took ${end - start}ms`);
```

## Conclusão

A implementação de DTOs fornece uma base sólida para comunicação segura entre camadas, com benefícios significativos em:

- **Segurança**: Proteção de dados sensíveis
- **Performance**: Otimizações automáticas
- **Manutenibilidade**: Código mais organizado e testável
- **Escalabilidade**: Fácil extensão e modificação
- **Desenvolvimento**: Type safety e autocompleção

Esta implementação serve como foundation para uma arquitetura robusta e escalável.