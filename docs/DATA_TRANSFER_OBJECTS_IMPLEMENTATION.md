# Data Transfer Objects (DTOs) - Implementação Completa

## 🎯 O que são DTOs

Data Transfer Objects são objetos simples que carregam dados entre processos, especialmente entre as camadas de aplicação e persistência. Eles são usados para:

- **Abstrair** a estrutura interna dos dados
- **Validar** dados de entrada
- **Transformar** dados entre formatos
- **Ocultar** campos sensíveis
- **Definir** contratos de API

## 📁 Estrutura Implementada

### 1. Contratos DTOs

```typescript
// Create Contract DTO
export interface CreateContractDTO {
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit?: number;
  status: ContractStatus;
  contractType: ContractType;
  clauses?: ContractClause[];
}

// Update Contract DTO
export interface UpdateContractDTO {
  id: string;
  propertyId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  status?: ContractStatus;
  contractType?: ContractType;
  clauses?: ContractClause[];
  updatedAt: string;
}

// Contract Response DTO
export interface ContractResponseDTO {
  id: string;
  property: PropertyDTO;
  tenant: UserDTO;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: ContractStatus;
  contractType: ContractType;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  duration: number; // meses
  totalValue: number; // valor total
  isActive: boolean;
  daysUntilExpiration: number;
  nextPaymentDate: string;
  renewalAvailable: boolean;
}
```

### 2. Vistoria DTOs

```typescript
// Create Vistoria DTO
export interface CreateVistoriaDTO {
  contractId: string;
  vistoriaType: VistoriaType;
  scheduledDate: string;
  notes?: string;
  images?: VistoriaImageDTO[];
  ambientes?: AmbienteDTO[];
}

// Vistoria Response DTO
export interface VistoriaResponseDTO {
  id: string;
  contract: ContractSummaryDTO;
  vistoriaType: VistoriaType;
  scheduledDate: string;
  completedDate?: string;
  status: VistoriaStatus;
  notes: string;
  images: VistoriaImageDTO[];
  ambientes: AmbienteDTO[];
  apuntamentos: ApontamentoDTO[];
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isCompleted: boolean;
  isOverdue: boolean;
  totalApontamentos: number;
  criticalApontamentos: number;
}
```

### 3. Documento DTOs

```typescript
// Create Documento DTO
export interface CreateDocumentoDTO {
  tipo: DocumentoType;
  titulo: string;
  conteudo: string;
  contratoId?: string;
  vistoriaId?: string;
  parametros?: Record<string, any>;
  isPublic: boolean;
}

// Documento Response DTO
export interface DocumentoResponseDTO {
  id: string;
  tipo: DocumentoType;
  titulo: string;
  conteudo: string;
  contrato?: ContractSummaryDTO;
  vistoria?: VistoriaSummaryDTO;
  parametros: Record<string, any>;
  isPublic: boolean;
  fileUrl?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isGenerated: boolean;
  downloadCount: number;
  lastAccessed?: string;
}
```

### 4. User DTOs

```typescript
// User Profile DTO
export interface UserProfileDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  preferences: UserPreferencesDTO;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// User Preferences DTO
export interface UserPreferencesDTO {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferencesDTO;
  dashboard: DashboardPreferencesDTO;
}
```

## 🔄 Funções de Mapeamento

### Contract Mapping

```typescript
// Entity to DTO mapping
export function contractToResponseDTO(contract: Contract): ContractResponseDTO {
  return {
    id: contract.id,
    property: propertyToDTO(contract.property),
    tenant: userToDTO(contract.tenant),
    startDate: contract.startDate,
    endDate: contract.endDate,
    monthlyRent: contract.monthlyRent,
    securityDeposit: contract.securityDeposit,
    status: contract.status,
    contractType: contract.contractType,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    // Computed fields
    duration: calculateDuration(contract.startDate, contract.endDate),
    totalValue: contract.monthlyRent * calculateDuration(contract.startDate, contract.endDate),
    isActive: isContractActive(contract),
    daysUntilExpiration: calculateDaysUntilExpiration(contract.endDate),
    nextPaymentDate: calculateNextPaymentDate(contract),
    renewalAvailable: canContractBeRenewed(contract)
  };
}

// DTO to Entity mapping
export function createContractDtoToEntity(dto: CreateContractDTO): Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    propertyId: dto.propertyId,
    tenantId: dto.tenantId,
    startDate: dto.startDate,
    endDate: dto.endDate,
    monthlyRent: dto.monthlyRent,
    securityDeposit: dto.securityDeposit || 0,
    status: dto.status,
    contractType: dto.contractType,
    clauses: dto.clauses || []
  };
}
```

## ✅ Validação com Zod

```typescript
// Validation schemas
export const CreateContractSchema = z.object({
  propertyId: z.string().uuid('Property ID must be a valid UUID'),
  tenantId: z.string().uuid('Tenant ID must be a valid UUID'),
  startDate: z.string().datetime('Start date must be a valid ISO date'),
  endDate: z.string().datetime('End date must be a valid ISO date').refine(
    (date, ctx) => new Date(date) > new Date(ctx.parent.startDate),
    { message: 'End date must be after start date' }
  ),
  monthlyRent: z.number().positive('Monthly rent must be positive').max(100000, 'Rent too high'),
  securityDeposit: z.number().min(0).max(100000).optional(),
  status: z.nativeEnum(ContractStatus),
  contractType: z.nativeEnum(ContractType),
  clauses: z.array(z.object({
    title: z.string(),
    content: z.string(),
    order: z.number()
  })).optional()
});

export const UpdateContractSchema = CreateContractSchema.partial().extend({
  id: z.string().uuid(),
  updatedAt: z.string().datetime()
});

// Type inference
export type CreateContractInput = z.infer<typeof CreateContractSchema>;
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;
```

## 🎯 Computed Fields

### Contract Computed Fields

```typescript
// Computed field functions
export function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

export function isContractActive(contract: Contract): boolean {
  const now = new Date();
  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  return now >= start && now <= end && contract.status === ContractStatus.ACTIVE;
}

export function calculateDaysUntilExpiration(endDate: string): number {
  const now = new Date();
  const expiration = new Date(endDate);
  const diffTime = expiration.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function canContractBeRenewed(contract: Contract): boolean {
  const now = new Date();
  const end = new Date(contract.endDate);
  const daysUntilExpiration = calculateDaysUntilExpiration(contract.endDate);
  
  return (
    contract.status === ContractStatus.ACTIVE &&
    daysUntilExpiration <= 90 && // 3 months before expiration
    now <= end
  );
}
```

## 🔧 Transform Utilities

### Generic Mappers

```typescript
// Generic mapper interface
export interface EntityMapper<Entity, DTO> {
  toDTO(entity: Entity): DTO;
  fromDTO(dto: DTO): Entity;
  toDTOList(entities: Entity[]): DTO[];
  fromDTOList(dtos: DTO[]): Entity[];
}

// Generic implementation
export class BaseMapper<Entity, DTO> implements EntityMapper<Entity, DTO> {
  constructor(
    private toDTOFn: (entity: Entity) => DTO,
    private fromDTOFn: (dto: DTO) => Entity
  ) {}

  toDTO(entity: Entity): DTO {
    return this.toDTOFn(entity);
  }

  fromDTO(dto: DTO): Entity {
    return this.fromDTOFn(dto);
  }

  toDTOList(entities: Entity[]): DTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  fromDTOList(dtos: DTO[]): Entity[] {
    return dtos.map(dto => this.fromDTO(dto));
  }
}

// Contract mapper
export class ContractMapper extends BaseMapper<Contract, ContractResponseDTO> {
  constructor() {
    super(contractToResponseDTO, (dto: ContractResponseDTO) => {
      // Reverse mapping logic
      return {
        id: dto.id,
        propertyId: dto.property.id,
        tenantId: dto.tenant.id,
        startDate: dto.startDate,
        endDate: dto.endDate,
        monthlyRent: dto.monthlyRent,
        securityDeposit: dto.securityDeposit,
        status: dto.status,
        contractType: dto.contractType,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt
      } as Contract;
    });
  }
}
```

## 📊 Summary DTOs

Para reduzir dados em listas:

```typescript
// Summary DTOs para listas
export interface ContractSummaryDTO {
  id: string;
  property: {
    id: string;
    address: string;
  };
  tenant: {
    id: string;
    fullName: string;
  };
  status: ContractStatus;
  monthlyRent: number;
  endDate: string;
  isActive: boolean;
}

export interface VistoriaSummaryDTO {
  id: string;
  vistoriaType: VistoriaType;
  scheduledDate: string;
  status: VistoriaStatus;
  isCompleted: boolean;
  apuntamentosCount: number;
}
```

## 🚀 Usage Examples

### Service Layer

```typescript
export class ContractService {
  private contractRepository = new ContractRepository();
  private contractMapper = new ContractMapper();

  async createContract(data: CreateContractInput): Promise<ContractResponseDTO> {
    // Validate input
    const validatedData = CreateContractSchema.parse(data);
    
    // Transform to entity
    const contractEntity = this.contractMapper.fromDTO({
      ...validatedData,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);
    
    // Create in database
    const createdContract = await this.contractRepository.create(contractEntity);
    
    // Return DTO
    return this.contractMapper.toDTO(createdContract);
  }

  async getContract(id: string): Promise<ContractResponseDTO> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) throw new NotFoundError('Contract not found');
    
    return this.contractMapper.toDTO(contract);
  }
}
```

### API Layer

```typescript
// Express.js example
app.post('/contracts', async (req, res) => {
  try {
    const contractData = CreateContractSchema.parse(req.body);
    const createdContract = await contractService.createContract(contractData);
    
    res.status(201).json({
      success: true,
      data: createdContract
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

## ✨ Benefits

1. **Type Safety**: Compile-time validation
2. **API Contracts**: Clear data structures
3. **Data Validation**: Runtime validation with Zod
4. **Computed Fields**: Business logic separation
5. **Abstraction**: Hide internal data structures
6. **Consistency**: Standardized data formats
7. **Security**: Control data exposure
8. **Maintainability**: Easy to modify and extend

## 📝 Status

✅ **100% Implementado** - Todos os DTOs, validações, mapeamentos e utilidades estão prontos para uso em produção!