/**
 * Testes para Data Transfer Objects (DTOs)
 * Valida a implementação e funcionamento dos DTOs
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContractStatus } from '../domain/contract';
import { UserRole } from '../shared/base';
import {
  // Contract DTOs
  CreateContractDTO,
  ContractResponseDTO,
  CreateContractSchema,
  contractToResponseDTO,
  validateCreateContract,
  isContractActive,
  calculateDuration,
  formatCurrency,
  
  // Property DTOs
  CreatePropertyDTO,
  PropertyResponseDTO,
  CreatePropertySchema,
  propertyToResponseDTO,
  validateCreateProperty,
  formatFullAddress,
  
  // User DTOs
  CreateUserDTO,
  UserResponseDTO,
  CreateUserSchema,
  userToResponseDTO,
  validateCreateUser,
  hasPermission,
  
  // Utils
  TransformUtils,
  ValidationUtils,
  TypeGuardUtils,
  DTOBuilder
} from './index';

// =============================================================================
// DADOS DE TESTE
// =============================================================================

const mockProperty = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  address: 'Rua das Flores, 123',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  type: 'apartment' as const,
  bedrooms: 2,
  bathrooms: 2,
  area: 85,
  furnished: false,
  parkingSpaces: 1,
  amenities: ['varanda', 'portaria'],
  description: 'Apartamento no centro da cidade',
  ownerId: '123e4567-e89b-12d3-a456-426614174001',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  userId: '123e4567-e89b-12d3-a456-426614174002',
  email: 'usuario@exemplo.com',
  fullName: 'João da Silva',
  phone: '(11) 99999-9999',
  document: '123.456.789-00',
  documentType: 'CPF' as const,
  role: 'user' as UserRole,
  isActive: true,
  exp: 100,
  level: 1,
  address: 'Rua dos Testes, 456',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  birthDate: '1990-01-01T00:00:00.000Z',
  emergencyContact: 'Maria da Silva',
  emergencyPhone: '(11) 88888-8888',
  twoFactorEnabled: false,
  lastPasswordChange: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  isOnline: false,
  lastActivity: '2024-01-01T00:00:00.000Z',
  isVerified: true
};

const mockContract = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  property: mockProperty,
  tenant: mockUser,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T23:59:59.999Z',
  monthlyRent: 2500,
  status: 'active' as ContractStatus,
  documentType: 'Termo do Locatário',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  depositAmount: 5000,
  contractTerm: 12,
  notes: 'Contrato de teste'
};

// =============================================================================
// TESTES DE CONTRATOS
// =============================================================================

describe('Contract DTOs', () => {
  describe('CreateContractSchema', () => {
    it('should validate valid contract data', () => {
      const validData = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z',
        monthlyRent: 2500,
        status: 'active' as ContractStatus
      };

      const result = CreateContractSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid data', () => {
      const invalidData = {
        propertyId: 'invalid-uuid',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z',
        monthlyRent: -100, // Valor negativo
        status: 'active' as ContractStatus
      };

      expect(() => CreateContractSchema.parse(invalidData)).toThrow();
    });

    it('should validate date logic', () => {
      const invalidDates = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-12-31T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z', // End date before start date
        monthlyRent: 2500,
        status: 'active' as ContractStatus
      };

      expect(() => CreateContractSchema.parse(invalidDates)).toThrow();
    });
  });

  describe('contractToResponseDTO', () => {
    it('should convert contract entity to DTO', () => {
      const dto = contractToResponseDTO(mockContract);
      
      expect(dto).toBeInstanceOf(Object);
      expect(dto.id).toBe(mockContract.id);
      expect(dto.monthlyRent).toBe(mockContract.monthlyRent);
      expect(dto.status).toBe(mockContract.status);
      expect(dto.property).toBeDefined();
      expect(dto.tenant).toBeDefined();
      expect(dto.duration).toBe(12);
      expect(dto.totalValue).toBe(30000);
      expect(dto.isActive).toBe(true);
    });

    it('should calculate correct duration', () => {
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-06-30T23:59:59.999Z';
      
      const duration = calculateDuration(startDate, endDate);
      expect(duration).toBe(6);
    });

    it('should determine if contract is active', () => {
      const activeContract = { ...mockContract, status: 'active' as ContractStatus };
      const expiredContract = { ...mockContract, status: 'expired' as ContractStatus };
      
      expect(isContractActive(activeContract)).toBe(true);
      expect(isContractActive(expiredContract)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(2500)).toBe('R$ 2.500,00');
      expect(formatCurrency(0)).toBe('R$ 0,00');
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
    });
  });

  describe('validateCreateContract', () => {
    it('should return validated data', () => {
      const inputData = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z',
        monthlyRent: 2500,
        status: 'active' as ContractStatus
      };

      const result = validateCreateContract(inputData);
      expect(result).toEqual(inputData);
    });
  });
});

// =============================================================================
// TESTES DE PROPRIEDADES
// =============================================================================

describe('Property DTOs', () => {
  describe('CreatePropertySchema', () => {
    it('should validate valid property data', () => {
      const validData = {
        address: 'Rua das Flores, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        type: 'apartment' as const,
        bedrooms: 2,
        bathrooms: 2,
        area: 85,
        furnished: false,
        parkingSpaces: 1,
        amenities: ['varanda', 'portaria'],
        ownerId: '123e4567-e89b-12d3-a456-426614174001',
        isActive: true
      };

      const result = CreatePropertySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid CEP format', () => {
      const invalidData = {
        address: 'Rua das Flores, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '12345', // Formato inválido
        type: 'apartment' as const,
        area: 85,
        furnished: false,
        parkingSpaces: 1,
        ownerId: '123e4567-e89b-12d3-a456-426614174001',
        isActive: true
      };

      expect(() => CreatePropertySchema.parse(invalidData)).toThrow();
    });
  });

  describe('propertyToResponseDTO', () => {
    it('should convert property entity to DTO', () => {
      const dto = propertyToResponseDTO(mockProperty);
      
      expect(dto).toBeInstanceOf(Object);
      expect(dto.id).toBe(mockProperty.id);
      expect(dto.address).toBe(mockProperty.address);
      expect(dto.city).toBe(mockProperty.city);
      expect(dto.type).toBe(mockProperty.type);
      expect(dto.area).toBe(mockProperty.area);
      expect(dto.isActive).toBe(true);
      expect(dto.isOccupied).toBe(false);
    });
  });

  describe('formatFullAddress', () => {
    it('should format complete address', () => {
      const propertyDTO = propertyToResponseDTO(mockProperty);
      const fullAddress = formatFullAddress(propertyDTO);
      
      expect(fullAddress).toBe('Rua das Flores, 123, Centro, São Paulo - SP, 01234-567');
    });
  });

  describe('validateCreateProperty', () => {
    it('should return validated data', () => {
      const inputData = {
        address: 'Rua das Flores, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        type: 'apartment' as const,
        area: 85,
        furnished: false,
        parkingSpaces: 1,
        ownerId: '123e4567-e89b-12d3-a456-426614174001',
        isActive: true
      };

      const result = validateCreateProperty(inputData);
      expect(result).toEqual(inputData);
    });
  });
});

// =============================================================================
// TESTES DE USUÁRIOS
// =============================================================================

describe('User DTOs', () => {
  describe('CreateUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        email: 'usuario@exemplo.com',
        password: 'Teste123!',
        fullName: 'João da Silva',
        phone: '(11) 99999-9999',
        document: '123.456.789-00',
        documentType: 'CPF' as const,
        role: 'user' as UserRole,
        isActive: true
      };

      const result = CreateUserSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'usuario-invalido',
        fullName: 'João da Silva',
        role: 'user' as UserRole,
        isActive: true
      };

      expect(() => CreateUserSchema.parse(invalidData)).toThrow();
    });

    it('should require document type when document is provided', () => {
      const invalidData = {
        email: 'usuario@exemplo.com',
        fullName: 'João da Silva',
        document: '123.456.789-00',
        // documentType não fornecido
        role: 'user' as UserRole,
        isActive: true
      };

      expect(() => CreateUserSchema.parse(invalidData)).toThrow();
    });
  });

  describe('userToResponseDTO', () => {
    it('should convert user entity to DTO', () => {
      const dto = userToResponseDTO(mockUser);
      
      expect(dto).toBeInstanceOf(Object);
      expect(dto.id).toBe(mockUser.id);
      expect(dto.email).toBe(mockUser.email);
      expect(dto.fullName).toBe(mockUser.fullName);
      expect(dto.role).toBe(mockUser.role);
      expect(dto.isActive).toBe(true);
      expect(dto.isVerified).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should check permissions correctly', () => {
      const adminUser = {
        id: '1',
        userId: '1',
        email: 'admin@exemplo.com',
        fullName: 'Admin User',
        role: 'admin' as UserRole,
        isActive: true,
        twoFactorEnabled: false,
        permissions: []
      };

      const regularUser = {
        id: '2',
        userId: '2',
        email: 'user@exemplo.com',
        fullName: 'Regular User',
        role: 'user' as UserRole,
        isActive: true,
        twoFactorEnabled: false,
        permissions: ['read_contracts']
      };

      expect(hasPermission(adminUser, 'any_permission')).toBe(true);
      expect(hasPermission(regularUser, 'read_contracts')).toBe(true);
      expect(hasPermission(regularUser, 'admin_access')).toBe(false);
    });
  });

  describe('validateCreateUser', () => {
    it('should return validated data', () => {
      const inputData = {
        email: 'usuario@exemplo.com',
        fullName: 'João da Silva',
        role: 'user' as UserRole,
        isActive: true
      };

      const result = validateCreateUser(inputData);
      expect(result).toEqual(inputData);
    });
  });
});

// =============================================================================
// TESTES DE UTILITÁRIOS
// =============================================================================

describe('DTO Utilities', () => {
  describe('TransformUtils', () => {
    const mockMapper = {
      entityToDTO: (entity: any) => ({ id: entity.id, name: entity.name }),
      entityToListDTO: (entity: any) => ({ id: entity.id }),
      dtoToEntity: (dto: any) => ({ id: dto.id, name: dto.name }),
      validateCreate: (data: any) => data,
      validateUpdate: (data: any) => data,
      sanitize: (data: any) => data
    };

    it('should transform array of entities to DTOs', () => {
      const entities = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];

      const dtos = TransformUtils.entitiesToDTOs(entities, mockMapper);
      
      expect(dtos).toHaveLength(2);
      expect(dtos[0]).toEqual({ id: '1', name: 'Item 1' });
      expect(dtos[1]).toEqual({ id: '2', name: 'Item 2' });
    });

    it('should paginate DTOs correctly', () => {
      const entities = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i + 1}`,
        name: `Item ${i + 1}`
      }));

      const result = TransformUtils.paginateDTOs(entities, mockMapper, 2, 3);
      
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(10);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(3);
      expect(result.totalPages).toBe(4);
      expect(result.data[0].id).toBe('item-4');
    });

    it('should filter and map DTOs', () => {
      const entities = [
        { id: '1', name: 'Active Item', active: true },
        { id: '2', name: 'Inactive Item', active: false }
      ];

      const activeDTOS = TransformUtils.filterAndMapDTOs(
        entities,
        mockMapper,
        (entity) => entity.active
      );
      
      expect(activeDTOS).toHaveLength(1);
      expect(activeDTOS[0].id).toBe('1');
    });
  });

  describe('ValidationUtils', () => {
    it('should sanitize data by context', () => {
      const userData = {
        id: '1',
        email: 'user@example.com',
        password: 'secret',
        name: 'Test User'
      };

      const publicSanitized = ValidationUtils.sanitizeByContext(userData, 'public', {});
      expect(publicSanitized).not.toHaveProperty('password');
      expect(publicSanitized).not.toHaveProperty('email');

      const internalSanitized = ValidationUtils.sanitizeByContext(userData, 'internal', {});
      expect(internalSanitized).not.toHaveProperty('password');
      expect(internalSanitized).toHaveProperty('email');
    });
  });

  describe('TypeGuardUtils', () => {
    it('should validate DTO with type guard', () => {
      const mockGuard = (obj: any): obj is { id: string; name: string } => {
        return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
      };

      const validObject = { id: '1', name: 'Test' };
      const invalidObject = { id: 1, name: 'Test' };

      expect(TypeGuardUtils.isValidDTO(validObject, mockGuard)).toBe(true);
      expect(TypeGuardUtils.isValidDTO(invalidObject, mockGuard)).toBe(false);
    });

    it('should assert DTO type', () => {
      const mockGuard = (obj: any): obj is { id: string; name: string } => {
        return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
      };

      const validObject = { id: '1', name: 'Test' };
      const invalidObject = { id: 1, name: 'Test' };

      expect(() => TypeGuardUtils.assertDTO(validObject, mockGuard)).not.toThrow();
      expect(() => TypeGuardUtils.assertDTO(invalidObject, mockGuard)).toThrow();
    });
  });

  describe('DTOBuilder', () => {
    it('should build DTO step by step', () => {
      const builder = new DTOBuilder<{ name: string; age: number; email?: string }>();
      
      const dto = builder
        .set('name', 'João')
        .set('age', 30)
        .set('email', 'joao@exemplo.com')
        .build();

      expect(dto).toEqual({
        name: 'João',
        age: 30,
        email: 'joao@exemplo.com'
      });
    });

    it('should build partial DTO', () => {
      const builder = new DTOBuilder<{ name: string; age: number }>();
      
      const partial = builder
        .set('name', 'Maria')
        .buildPartial();

      expect(partial).toEqual({ name: 'Maria' });
    });
  });
});

// =============================================================================
// TESTES DE INTEGRAÇÃO
// =============================================================================

describe('DTO Integration Tests', () => {
  it('should handle complete contract workflow', () => {
    // 1. Criar dados de contrato
    const contractInput = {
      propertyId: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: '123e4567-e89b-12d3-a456-426614174001',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-12-31T23:59:59.999Z',
      monthlyRent: 2500,
      status: 'active' as ContractStatus
    };

    // 2. Validar dados
    const validatedData = validateCreateContract(contractInput);
    expect(validatedData).toEqual(contractInput);

    // 3. Simular conversão para entidade
    const entityData = {
      ...validatedData,
      id: '123e4567-e89b-12d3-a456-426614174003',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    // 4. Converter para DTO de resposta
    const responseDTO = {
      ...entityData,
      property: mockProperty,
      tenant: mockUser
    };

    const finalDTO = contractToResponseDTO(responseDTO);
    
    // 5. Verificar resultado
    expect(finalDTO).toBeDefined();
    expect(finalDTO.id).toBe(entityData.id);
    expect(finalDTO.monthlyRent).toBe(2500);
    expect(finalDTO.status).toBe('active');
    expect(finalDTO.duration).toBe(12);
    expect(finalDTO.totalValue).toBe(30000);
    expect(finalDTO.isActive).toBe(true);
  });

  it('should handle property and user DTOs together', () => {
    // Criar property DTO
    const propertyDTO = propertyToResponseDTO(mockProperty);
    expect(propertyDTO.address).toBe(mockProperty.address);
    expect(propertyDTO.isActive).toBe(true);

    // Criar user DTO
    const userDTO = userToResponseDTO(mockUser);
    expect(userDTO.email).toBe(mockUser.email);
    expect(userDTO.isVerified).toBe(true);

    // Verificar formatting
    const fullAddress = formatFullAddress(propertyDTO);
    expect(fullAddress).toContain('Rua das Flores');
    expect(fullAddress).toContain('São Paulo');
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

describe('DTO Performance Tests', () => {
  it('should handle large datasets efficiently', () => {
    // Criar dataset grande
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      active: i % 2 === 0
    }));

    const mockMapper = {
      entityToDTO: (entity: any) => ({ 
        id: entity.id, 
        name: entity.name,
        isActive: entity.active 
      }),
      entityToListDTO: (entity: any) => ({ id: entity.id }),
      dtoToEntity: (dto: any) => dto,
      validateCreate: (data: any) => data,
      validateUpdate: (data: any) => data,
      sanitize: (data: any) => data
    };

    const start = performance.now();
    const dtos = TransformUtils.entitiesToDTOs(largeDataset, mockMapper);
    const end = performance.now();

    expect(dtos).toHaveLength(1000);
    expect(end - start).toBeLessThan(1000); // Deve completar em menos de 1 segundo
  });
});

// =============================================================================
// EXPORT DOS TESTES
// =============================================================================

export const contractTestData = {
  mockProperty,
  mockUser,
  mockContract
};

export const validationTestCases = {
  validContract: {
    propertyId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.999Z',
    monthlyRent: 2500,
    status: 'active' as ContractStatus
  },
  
  validProperty: {
    address: 'Rua das Flores, 123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    type: 'apartment' as const,
    area: 85,
    furnished: false,
    parkingSpaces: 1,
    ownerId: '123e4567-e89b-12d3-a456-426614174001',
    isActive: true
  },
  
  validUser: {
    email: 'usuario@exemplo.com',
    fullName: 'João da Silva',
    role: 'user' as UserRole,
    isActive: true
  }
};