/**
 * Data Transfer Objects para Propriedades
 * Comunicação segura entre camadas da aplicação
 */

import { z } from 'zod';

// =============================================================================
// DTOs DE ENTRADA (CREATE/UPDATE)
// =============================================================================

/**
 * DTO para criação de propriedade
 */
export interface CreatePropertyDTO {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'apartment' | 'house' | 'commercial' | 'industrial';
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  furnished: boolean;
  parkingSpaces: number;
  amenities: string[];
  description?: string;
  ownerId: string;
  isActive: boolean;
}

/**
 * DTO para atualização de propriedade
 */
export interface UpdatePropertyDTO {
  id: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type?: 'apartment' | 'house' | 'commercial' | 'industrial';
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  furnished?: boolean;
  parkingSpaces?: number;
  amenities?: string[];
  description?: string;
  ownerId?: string;
  isActive?: boolean;
  updatedAt: string;
}

// =============================================================================
// DTOs DE RESPOSTA (READ)
// =============================================================================

/**
 * DTO de resposta de propriedade completo
 */
export interface PropertyResponseDTO {
  id: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'apartment' | 'house' | 'commercial' | 'industrial';
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  furnished: boolean;
  parkingSpaces: number;
  amenities: string[];
  description?: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Campos calculados
  isOccupied: boolean;
  currentTenantId?: string;
  monthlyRent?: number;
  contractEndDate?: string;
}

/**
 * DTO para listagem de propriedades
 */
export interface PropertyListItemDTO {
  id: string;
  address: string;
  neighborhood: string;
  city: string;
  type: 'apartment' | 'house' | 'commercial' | 'industrial';
  area: number;
  isOccupied: boolean;
  isActive: boolean;
  monthlyRent?: number;
  contractEndDate?: string;
  lastUpdate: string;
}

/**
 * DTO para busca de propriedades
 */
export interface PropertySearchDTO {
  query?: string;
  city?: string;
  state?: string;
  type?: 'apartment' | 'house' | 'commercial' | 'industrial';
  minArea?: number;
  maxArea?: number;
  furnished?: boolean;
  parkingSpaces?: number;
  amenities?: string[];
  isActive?: boolean;
  isOccupied?: boolean;
  minRent?: number;
  maxRent?: number;
}

// =============================================================================
// SCHEMAS DE VALIDAÇÃO ZOD
// =============================================================================

/**
 * Schema para criação de propriedade
 */
export const CreatePropertySchema = z.object({
  address: z.string()
    .min(1, 'Endereço é obrigatório')
    .max(200, 'Endereço não pode exceder 200 caracteres'),
  neighborhood: z.string()
    .min(1, 'Bairro é obrigatório')
    .max(100, 'Bairro não pode exceder 100 caracteres'),
  city: z.string()
    .min(1, 'Cidade é obrigatória')
    .max(100, 'Cidade não pode exceder 100 caracteres'),
  state: z.string()
    .min(2, 'Estado deve ter pelo menos 2 caracteres')
    .max(50, 'Estado não pode exceder 50 caracteres'),
  zipCode: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter o formato 00000-000'),
  type: z.enum(['apartment', 'house', 'commercial', 'industrial']),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  area: z.number()
    .positive('Área deve ser positiva')
    .max(10000, 'Área não pode exceder 10.000 m²'),
  furnished: z.boolean(),
  parkingSpaces: z.number().int().min(0).max(10),
  amenities: z.array(z.string()).default([]),
  description: z.string().max(1000, 'Descrição não pode exceder 1000 caracteres').optional(),
  ownerId: z.string().uuid('Owner ID deve ser um UUID válido'),
  isActive: z.boolean().default(true)
});

/**
 * Schema para atualização de propriedade
 */
export const UpdatePropertySchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
  address: z.string().min(1).max(200).optional(),
  neighborhood: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(2).max(50).optional(),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
  type: z.enum(['apartment', 'house', 'commercial', 'industrial']).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  area: z.number().positive().max(10000).optional(),
  furnished: z.boolean().optional(),
  parkingSpaces: z.number().int().min(0).max(10).optional(),
  amenities: z.array(z.string()).optional(),
  description: z.string().max(1000).optional(),
  ownerId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  updatedAt: z.string().datetime('Data de atualização deve ser uma data válida')
});

/**
 * Schema para busca de propriedades
 */
export const PropertySearchSchema = z.object({
  query: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  type: z.enum(['apartment', 'house', 'commercial', 'industrial']).optional(),
  minArea: z.number().positive().optional(),
  maxArea: z.number().positive().optional(),
  furnished: z.boolean().optional(),
  parkingSpaces: z.number().int().min(0).max(10).optional(),
  amenities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isOccupied: z.boolean().optional(),
  minRent: z.number().positive().optional(),
  maxRent: z.number().positive().optional()
});

// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================================================

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;
export type PropertySearchInput = z.infer<typeof PropertySearchSchema>;

// =============================================================================
// FUNÇÕES DE MAPEAMENTO
// =============================================================================

/**
 * Converte entidade de propriedade para DTO de resposta
 */
export function propertyToResponseDTO(property: any): PropertyResponseDTO {
  return {
    id: property.id,
    address: property.address,
    neighborhood: property.neighborhood,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
    type: property.type,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    furnished: property.furnished,
    parkingSpaces: property.parkingSpaces,
    amenities: property.amenities || [],
    description: property.description,
    ownerId: property.ownerId || property.owner_id,
    isActive: property.isActive !== false,
    createdAt: property.createdAt || property.created_at,
    updatedAt: property.updatedAt || property.updated_at,
    isOccupied: property.isOccupied || false,
    currentTenantId: property.currentTenantId,
    monthlyRent: property.monthlyRent,
    contractEndDate: property.contractEndDate
  };
}

/**
 * Converte propriedade para item de lista
 */
export function propertyToListItemDTO(property: any): PropertyListItemDTO {
  return {
    id: property.id,
    address: property.address,
    neighborhood: property.neighborhood,
    city: property.city,
    type: property.type,
    area: property.area,
    isOccupied: property.isOccupied || false,
    isActive: property.isActive !== false,
    monthlyRent: property.monthlyRent,
    contractEndDate: property.contractEndDate,
    lastUpdate: property.updatedAt || property.updated_at || property.createdAt || property.created_at
  };
}

/**
 * Converte DTO para entidade
 */
export function dtoToPropertyEntity(dto: CreatePropertyInput | UpdatePropertyInput): any {
  return {
    ...dto,
    area: Number(dto.area),
    bedrooms: dto.bedrooms ? Number(dto.bedrooms) : undefined,
    bathrooms: dto.bathrooms ? Number(dto.bathrooms) : undefined,
    parkingSpaces: Number(dto.parkingSpaces)
  };
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Formata endereço completo
 */
export function formatFullAddress(property: PropertyResponseDTO): string {
  return `${property.address}, ${property.neighborhood}, ${property.city} - ${property.state}, ${property.zipCode}`;
}

/**
 * Formata área
 */
export function formatArea(area: number): string {
  return `${area} m²`;
}

/**
 * Valida e converte DTO de criação
 */
export function validateCreateProperty(data: unknown): CreatePropertyInput {
  return CreatePropertySchema.parse(data);
}

/**
 * Valida e converte DTO de atualização
 */
export function validateUpdateProperty(data: unknown): UpdatePropertyInput {
  return UpdatePropertySchema.parse(data);
}

/**
 * Valida e converte DTO de busca
 */
export function validatePropertySearch(data: unknown): PropertySearchInput {
  return PropertySearchSchema.parse(data);
}

/**
 * Sanitiza dados de propriedade
 */
export function sanitizePropertyData(property: any): Partial<PropertyResponseDTO> {
  const { ownerId, ...sanitized } = property;
  return sanitized;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Verifica se um objeto é um DTO de criação válido
 */
export function isCreatePropertyDTO(obj: any): obj is CreatePropertyDTO {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.address === 'string' &&
    typeof obj.city === 'string' &&
    typeof obj.state === 'string' &&
    typeof obj.zipCode === 'string' &&
    typeof obj.area === 'number' &&
    typeof obj.type === 'string'
  );
}

/**
 * Verifica se um objeto é um DTO de resposta válido
 */
export function isPropertyResponseDTO(obj: any): obj is PropertyResponseDTO {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.address === 'string' &&
    typeof obj.city === 'string' &&
    typeof obj.state === 'string' &&
    typeof obj.zipCode === 'string' &&
    typeof obj.area === 'number' &&
    typeof obj.type === 'string'
  );
}

/**
 * Filtra propriedades por critérios
 */
export function filterProperties(properties: PropertyResponseDTO[], criteria: PropertySearchInput): PropertyResponseDTO[] {
  return properties.filter(property => {
    if (criteria.query && !property.address.toLowerCase().includes(criteria.query.toLowerCase()) &&
        !property.neighborhood.toLowerCase().includes(criteria.query.toLowerCase()) &&
        !property.city.toLowerCase().includes(criteria.query.toLowerCase())) {
      return false;
    }
    
    if (criteria.city && property.city !== criteria.city) return false;
    if (criteria.state && property.state !== criteria.state) return false;
    if (criteria.type && property.type !== criteria.type) return false;
    if (criteria.minArea && property.area < criteria.minArea) return false;
    if (criteria.maxArea && property.area > criteria.maxArea) return false;
    if (criteria.furnished !== undefined && property.furnished !== criteria.furnished) return false;
    if (criteria.parkingSpaces && property.parkingSpaces < criteria.parkingSpaces) return false;
    if (criteria.isActive !== undefined && property.isActive !== criteria.isActive) return false;
    if (criteria.isOccupied !== undefined && property.isOccupied !== criteria.isOccupied) return false;
    if (criteria.minRent && (!property.monthlyRent || property.monthlyRent < criteria.minRent)) return false;
    if (criteria.maxRent && (!property.monthlyRent || property.monthlyRent > criteria.maxRent)) return false;
    
    if (criteria.amenities && criteria.amenities.length > 0) {
      const hasAllAmenities = criteria.amenities.every(amenity => 
        property.amenities.some(propAmenity => 
          propAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      );
      if (!hasAllAmenities) return false;
    }
    
    return true;
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Schemas
  CreatePropertySchema,
  UpdatePropertySchema,
  PropertySearchSchema,
  
  // Types
  
  // Mappers
  propertyToResponseDTO,
  propertyToListItemDTO,
  dtoToPropertyEntity,
  
  // Validators
  validateCreateProperty,
  validateUpdateProperty,
  validatePropertySearch,
  
  // Utilities
  formatFullAddress,
  formatArea,
  sanitizePropertyData,
  filterProperties,
  
  // Type Guards
  isCreatePropertyDTO,
  isPropertyResponseDTO
};