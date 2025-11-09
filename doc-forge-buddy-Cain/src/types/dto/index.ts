/**
 * Data Transfer Objects - Índice Principal
 * Comunicação segura entre camadas da aplicação
 */

// Exportações de Contratos
export {
  CreateContractDTO,
  UpdateContractDTO,
  ContractResponseDTO,
  ContractListItemDTO,
  PropertyDTO,
  UserDTO,
  CreateContractSchema,
  UpdateContractSchema,
  CreateContractInput,
  UpdateContractInput,
  propertyToDTO,
  userToDTO,
  contractToResponseDTO,
  contractToListItemDTO,
  dtoToContractEntity,
  validateCreateContract,
  validateUpdateContract,
  calculateDuration,
  isContractActive,
  formatCurrency,
  sanitizeContractData,
  isCreateContractDTO,
  isContractResponseDTO
} from './contract.dto';

// Exportações de Propriedades
export {
  CreatePropertyDTO,
  UpdatePropertyDTO,
  PropertyResponseDTO,
  PropertyListItemDTO,
  PropertySearchDTO,
  CreatePropertySchema,
  UpdatePropertySchema,
  PropertySearchSchema,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertySearchInput,
  propertyToResponseDTO,
  propertyToListItemDTO,
  dtoToPropertyEntity,
  validateCreateProperty,
  validateUpdateProperty,
  validatePropertySearch,
  formatFullAddress,
  formatArea,
  sanitizePropertyData,
  filterProperties,
  isCreatePropertyDTO,
  isPropertyResponseDTO
} from './property.dto';

// Exportações de Usuários
export {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
  UserListItemDTO,
  UserSearchDTO,
  PublicUserDTO,
  AuthUserDTO,
  UserStatsDTO,
  CreateUserSchema,
  UpdateUserSchema,
  UserSearchSchema,
  CreateUserInput,
  UpdateUserInput,
  UserSearchInput,
  userToResponseDTO,
  userToListItemDTO,
  userToPublicDTO,
  userToAuthDTO,
  dtoToUserEntity,
  validateCreateUser,
  validateUpdateUser,
  validateUserSearch,
  sanitizeUserData,
  formatFullName,
  hasPermission,
  calculateDaysSinceLastLogin,
  filterUsers,
  isCreateUserDTO,
  isUserResponseDTO
} from './user.dto';

// =============================================================================
// MAPEADORES GENÉRICOS E UTILITÁRIOS
// =============================================================================

import { z } from 'zod';

/**
 * Interface genérica para mappers
 */
export interface Mapper<Entity, DTO, CreateDTO, UpdateDTO> {
  entityToDTO: (entity: Entity) => DTO;
  entityToListDTO: (entity: Entity) => DTO;
  dtoToEntity: (dto: CreateDTO | UpdateDTO) => Entity;
  validateCreate: (data: unknown) => CreateDTO;
  validateUpdate: (data: unknown) => UpdateDTO;
  sanitize: (data: any) => Partial<DTO>;
}

/**
 * Mapper genérico para entidades
 */
export class GenericMapper<Entity, DTO, CreateDTO, UpdateDTO> implements Mapper<Entity, DTO, CreateDTO, UpdateDTO> {
  constructor(
    private entityToDTOFn: (entity: Entity) => DTO,
    private entityToListDTOFn: (entity: Entity) => DTO,
    private dtoToEntityFn: (dto: CreateDTO | UpdateDTO) => Entity,
    private createSchema: z.ZodSchema<CreateDTO>,
    private updateSchema: z.ZodSchema<UpdateDTO>,
    private sanitizeFn?: (data: any) => Partial<DTO>
  ) {}

  entityToDTO = (entity: Entity): DTO => {
    return this.entityToDTOFn(entity);
  };

  entityToListDTO = (entity: Entity): DTO => {
    return this.entityToListDTOFn(entity);
  };

  dtoToEntity = (dto: CreateDTO | UpdateDTO): Entity => {
    return this.dtoToEntityFn(dto);
  };

  validateCreate = (data: unknown): CreateDTO => {
    return this.createSchema.parse(data);
  };

  validateUpdate = (data: unknown): UpdateDTO => {
    return this.updateSchema.parse(data);
  };

  sanitize = (data: any): Partial<DTO> => {
    return this.sanitizeFn ? this.sanitizeFn(data) : {};
  };
}

/**
 * Utilitários para transformation
 */
export class TransformUtils {
  /**
   * Transforma array de entidades em DTOs
   */
  static entitiesToDTOs<Entity, DTO>(
    entities: Entity[],
    mapper: Mapper<Entity, DTO, any, any>
  ): DTO[] {
    return entities.map(entity => mapper.entityToDTO(entity));
  }

  /**
   * Transforma array de entidades em DTOs de lista
   */
  static entitiesToListDTOs<Entity, DTO>(
    entities: Entity[],
    mapper: Mapper<Entity, DTO, any, any>
  ): DTO[] {
    return entities.map(entity => mapper.entityToListDTO(entity));
  }

  /**
   * Valida e transforma DTO para entidade
   */
  static dtoToEntity<Entity, CreateDTO, UpdateDTO>(
    dto: CreateDTO | UpdateDTO,
    mapper: Mapper<Entity, any, CreateDTO, UpdateDTO>
  ): Entity {
    return mapper.dtoToEntity(dto);
  }

  /**
   * Pagina resultados com DTOs
   */
  static paginateDTOs<Entity, DTO>(
    entities: Entity[],
    mapper: Mapper<Entity, DTO, any, any>,
    page: number,
    pageSize: number
  ): {
    data: DTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEntities = entities.slice(startIndex, endIndex);
    
    return {
      data: this.entitiesToDTOs(paginatedEntities, mapper),
      total: entities.length,
      page,
      pageSize,
      totalPages: Math.ceil(entities.length / pageSize)
    };
  }

  /**
   * Filtra e transforma entidades
   */
  static filterAndMapDTOs<Entity, DTO>(
    entities: Entity[],
    mapper: Mapper<Entity, DTO, any, any>,
    filterFn: (entity: Entity) => boolean
  ): DTO[] {
    const filteredEntities = entities.filter(filterFn);
    return this.entitiesToDTOs(filteredEntities, mapper);
  }

  /**
   * Ordena e transforma entidades
   */
  static sortAndMapDTOs<Entity, DTO>(
    entities: Entity[],
    mapper: Mapper<Entity, DTO, any, any>,
    sortFn: (a: Entity, b: Entity) => number
  ): DTO[] {
    const sortedEntities = [...entities].sort(sortFn);
    return this.entitiesToDTOs(sortedEntities, mapper);
  }
}

/**
 * Utilitários para validação
 */
export class ValidationUtils {
  /**
   * Valida dados com múltiplos schemas
   */
  static validateWithMultipleSchemas<T>(
    data: unknown,
    schemas: z.ZodSchema<T>[]
  ): T {
    for (const schema of schemas) {
      try {
        return schema.parse(data);
      } catch (error) {
        // Continua para o próximo schema
        continue;
      }
    }
    throw new Error('Dados não correspondem a nenhum schema válido');
  }

  /**
   * Valida DTO de forma condicional
   */
  static validateConditionally<T>(
    data: unknown,
    baseSchema: z.ZodSchema<T>,
    condition: (data: T) => boolean,
    conditionalSchema: z.ZodSchema<T>
  ): T {
    const baseData = baseSchema.parse(data);
    
    if (condition(baseData)) {
      return conditionalSchema.parse(data);
    }
    
    return baseData;
  }

  /**
   * Sanitiza dados baseados no contexto
   */
  static sanitizeByContext<T extends object>(
    data: T,
    context: 'public' | 'internal' | 'admin',
    sanitizeRules: Record<string, (data: any) => any>
  ): Partial<T> {
    const sanitized = { ...data } as any;
    
    if (context === 'public') {
      delete (sanitized as any).password;
      delete (sanitized as any).twoFactorSecret;
      delete (sanitized as any).email;
    }
    
    if (context === 'internal') {
      delete (sanitized as any).password;
      delete (sanitized as any).twoFactorSecret;
    }
    
    // Aplicar regras específicas
    Object.entries(sanitizeRules).forEach(([field, rule]) => {
      if (field in sanitized) {
        (sanitized as any)[field] = rule((sanitized as any)[field]);
      }
    });
    
    return sanitized;
  }
}

/**
 * Utilitários para type safety
 */
export class TypeGuardUtils {
  /**
   * Verifica se objeto é DTO válido
   */
  static isValidDTO<T>(
    obj: any,
    guardFn: (obj: any) => obj is T
  ): obj is T {
    return guardFn(obj);
  }

  /**
   * Verifica se array contém apenas DTOs válidos
   */
  static isValidDTOArray<T>(
    array: any[],
    guardFn: (obj: any) => obj is T
  ): array is T[] {
    return Array.isArray(array) && array.every(item => guardFn(item));
  }

  /**
   * Asserção de tipo para DTO
   */
  static assertDTO<T>(
    obj: any,
    guardFn: (obj: any) => obj is T,
    errorMessage: string = 'Objeto não é um DTO válido'
  ): asserts obj is T {
    if (!guardFn(obj)) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Converte com validação de tipo
   */
  static safeConvert<T, U>(
    obj: T,
    convertFn: (obj: T) => U,
    guardFn: (obj: any) => obj is U
  ): U {
    const result = convertFn(obj);
    if (!guardFn(result)) {
      throw new Error('Conversão resulted in invalid type');
    }
    return result;
  }
}

/**
 * Builder para DTOs complexos
 */
export class DTOBuilder<T> {
  private data: Partial<T> = {};

  set<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  setAll(data: Partial<T>): this {
    this.data = { ...this.data, ...data };
    return this;
  }

  build(): T {
    return this.data as T;
  }

  buildPartial(): Partial<T> {
    return { ...this.data };
  }
}

/**
 * Função de composição para transformations
 */
export function composeTransformations<T>(
  ...transformations: Array<(data: T) => T>
): (data: T) => T {
  return (data: T) => {
    return transformations.reduce((acc, transform) => transform(acc), data);
  };
}

/**
 * Memoização para transformations custosas
 */
export function memoizeTransform<T, R>(
  transformFn: (input: T) => R,
  keyFn?: (input: T) => string
): (input: T) => R {
  const cache = new Map<string, R>();
  
  return (input: T) => {
    const key = keyFn ? keyFn(input) : JSON.stringify(input);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = transformFn(input);
    cache.set(key, result);
    return result;
  };
}

// =============================================================================
// CONSTANTES E TIPOS BASE
// =============================================================================

/**
 * Status comuns em DTOs
 */
export const COMMON_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;

/**
 * Tipos de usuário
 */
export const USER_TYPES = {
  ADMIN: 'admin',
  USER: 'user',
  LOCATARIO: 'locatario',
  LOCADOR: 'locador'
} as const;

/**
 * Tipos de propriedade
 */
export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  COMMERCIAL: 'commercial',
  INDUSTRIAL: 'industrial'
} as const;

/**
 * Campos sempre omitidos por segurança
 */
export const SENSITIVE_FIELDS = [
  'password',
  'twoFactorSecret',
  'twoFactorBackupCodes',
  'refreshToken',
  'sessionToken',
  'salt'
] as const;

export type SensitiveField = typeof SENSITIVE_FIELDS[number];

// =============================================================================
// EXPORT PADRÃO
// =============================================================================

export default {
  // Utils
  TransformUtils,
  ValidationUtils,
  TypeGuardUtils,
  DTOBuilder,
  composeTransformations,
  memoizeTransform,
  
  // Constants
  COMMON_STATUS,
  USER_TYPES,
  PROPERTY_TYPES,
  SENSITIVE_FIELDS
};