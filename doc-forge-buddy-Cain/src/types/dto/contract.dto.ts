/**
 * Data Transfer Objects para Contratos
 * Comunicação segura entre camadas da aplicação
 */

import { z } from 'zod';

// Tipos de status
type ContractStatus = 'active' | 'expired' | 'pending' | 'cancelled';
type PersonType = 'locatario' | 'locador';

// =============================================================================
// DTOs DE ENTRADA (CREATE/UPDATE)
// =============================================================================

/**
 * DTO para criação de contrato
 */
export interface CreateContractDTO {
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: ContractStatus;
  // Campos opcionais para diferentes tipos de contrato
  documentType?: string;
  notes?: string;
  depositAmount?: number;
  contractTerm?: number; // meses
}

/**
 * DTO para atualização de contrato
 */
export interface UpdateContractDTO {
  id: string;
  propertyId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  status?: ContractStatus;
  documentType?: string;
  notes?: string;
  depositAmount?: number;
  contractTerm?: number;
  updatedAt: string;
}

// =============================================================================
// DTOs DE RESPOSTA (READ)
// =============================================================================

/**
 * DTO de propriedade
 */
export interface PropertyDTO {
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
  isActive: boolean;
}

/**
 * DTO de usuário (locatário/proprietário)
 */
export interface UserDTO {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  document?: string; // CPF/CNPJ
  documentType?: 'CPF' | 'CNPJ';
  role: 'locatario' | 'locador' | 'admin';
  isActive: boolean;
  createdAt: string;
}

/**
 * DTO de resposta de contrato completo
 */
export interface ContractResponseDTO {
  id: string;
  property: PropertyDTO;
  tenant: UserDTO;
  owner?: UserDTO; // Para contratos, pode ter proprietário
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: ContractStatus;
  documentType: string;
  createdAt: string;
  updatedAt: string;
  // Campos calculados
  duration: number; // meses
  totalValue: number; // valor total
  isActive: boolean;
  daysRemaining: number;
  overdueDays?: number;
  depositAmount?: number;
  contractTerm?: number;
  notes?: string;
}

/**
 * DTO para listagem de contratos
 */
export interface ContractListItemDTO {
  id: string;
  propertyAddress: string;
  tenantName: string;
  monthlyRent: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  isActive: boolean;
  daysRemaining: number;
  overdueDays?: number;
  lastUpdate: string;
}

// =============================================================================
// SCHEMAS DE VALIDAÇÃO ZOD
// =============================================================================

/**
 * Schema para criação de contrato
 */
export const CreateContractSchema = z.object({
  propertyId: z.string().uuid('Property ID deve ser um UUID válido'),
  tenantId: z.string().uuid('Tenant ID deve ser um UUID válido'),
  startDate: z.string().datetime('Data de início deve ser uma data válida'),
  endDate: z.string().datetime('Data de término deve ser uma data válida').refine(
    (data) => {
      return new Date(data.endDate) > new Date(data.startDate);
    },
    { message: 'Data de término deve ser posterior à data de início' }
  ),
  monthlyRent: z.number()
    .positive('Valor do aluguel deve ser positivo')
    .max(100000, 'Valor do aluguel não pode exceder R$ 100.000,00'),
  status: z.enum(['active', 'expired', 'pending', 'cancelled'] as const),
  documentType: z.string().optional(),
  notes: z.string().max(1000, 'Notas não podem exceder 1000 caracteres').optional(),
  depositAmount: z.number().min(0, 'Valor do depósito não pode ser negativo').optional(),
  contractTerm: z.number().int().positive('Prazo deve ser um número positivo de meses').optional()
}).refine(
  (data) => {
    if (data.contractTerm) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
      return Math.abs(monthsDiff - data.contractTerm) <= 1; // Allow 1 month tolerance
    }
    return true;
  },
  { message: 'Prazo do contrato não corresponde às datas informadas', path: ['contractTerm'] }
);

/**
 * Schema para atualização de contrato
 */
export const UpdateContractSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
  propertyId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  monthlyRent: z.number().positive().max(100000).optional(),
  status: z.enum(['active', 'expired', 'pending', 'cancelled'] as const).optional(),
  documentType: z.string().optional(),
  notes: z.string().max(1000).optional(),
  depositAmount: z.number().min(0).optional(),
  contractTerm: z.number().int().positive().optional(),
  updatedAt: z.string().datetime('Data de atualização deve ser uma data válida')
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  { message: 'Data de término deve ser posterior à data de início', path: ['endDate'] }
);

// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================================================

export type CreateContractInput = z.infer<typeof CreateContractSchema>;
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;

// =============================================================================
// FUNÇÕES DE MAPEAMENTO
// =============================================================================

/**
 * Converte entidade de propriedade para DTO
 */
export function propertyToDTO(property: any): PropertyDTO {
  return {
    id: property.id,
    address: property.address || '',
    neighborhood: property.neighborhood || '',
    city: property.city || '',
    state: property.state || '',
    zipCode: property.zipCode || '',
    type: property.type || 'apartment',
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area || 0,
    furnished: property.furnished || false,
    parkingSpaces: property.parkingSpaces || 0,
    amenities: property.amenities || [],
    isActive: property.isActive !== false
  };
}

/**
 * Converte perfil de usuário para DTO
 */
export function userToDTO(user: any): UserDTO {
  return {
    id: user.id,
    userId: user.userId || user.user_id || '',
    email: user.email || '',
    fullName: user.fullName || user.full_name || '',
    phone: user.phone || undefined,
    document: user.document || undefined,
    documentType: user.documentType || user.document_type || undefined,
    role: user.role === 'admin' ? 'admin' : 'locatario', // Ajustado para o tipo correto
    isActive: user.isActive !== false,
    createdAt: user.createdAt || user.created_at || ''
  };
}

/**
 * Converte contrato para DTO de resposta completo
 */
export function contractToResponseDTO(contract: any): ContractResponseDTO {
  const startDate = new Date(contract.startDate || contract.start_date);
  const endDate = new Date(contract.endDate || contract.end_date);
  const now = new Date();
  
  // Cálculos
  const duration = calculateDuration(contract.startDate || contract.start_date, contract.endDate || contract.end_date);
  const totalValue = (contract.monthlyRent || contract.monthly_rent || 0) * duration;
  const isActive = isContractActive(contract);
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const overdueDays = now > endDate ? Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

  return {
    id: contract.id,
    property: propertyToDTO(contract.property),
    tenant: userToDTO(contract.tenant),
    owner: contract.owner ? userToDTO(contract.owner) : undefined,
    startDate: contract.startDate || contract.start_date,
    endDate: contract.endDate || contract.end_date,
    monthlyRent: contract.monthlyRent || contract.monthly_rent || 0,
    status: contract.status,
    documentType: contract.documentType || contract.document_type || '',
    createdAt: contract.createdAt || contract.created_at,
    updatedAt: contract.updatedAt || contract.updated_at,
    duration,
    totalValue,
    isActive,
    daysRemaining: Math.max(0, daysRemaining),
    overdueDays,
    depositAmount: contract.depositAmount || contract.deposit_amount,
    contractTerm: contract.contractTerm || contract.contract_term,
    notes: contract.notes
  };
}

/**
 * Converte contrato para item de lista
 */
export function contractToListItemDTO(contract: any): ContractListItemDTO {
  const startDate = contract.startDate || contract.start_date;
  const endDate = contract.endDate || contract.end_date;
  const now = new Date();
  const endDateObj = new Date(endDate);
  const daysRemaining = Math.ceil((endDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const overdueDays = now > endDateObj ? Math.ceil((now.getTime() - endDateObj.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

  return {
    id: contract.id,
    propertyAddress: contract.property?.address || contract.property_address || '',
    tenantName: contract.tenant?.fullName || contract.tenant_name || '',
    monthlyRent: contract.monthlyRent || contract.monthly_rent || 0,
    status: contract.status,
    startDate,
    endDate,
    isActive: isContractActive(contract),
    daysRemaining: Math.max(0, daysRemaining),
    overdueDays,
    lastUpdate: contract.updatedAt || contract.updated_at || contract.createdAt || contract.created_at
  };
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Calcula a duração em meses entre duas datas
 */
export function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const yearsDiff = end.getFullYear() - start.getFullYear();
  const monthsDiff = end.getMonth() - start.getMonth();
  
  return yearsDiff * 12 + monthsDiff + (end.getDate() >= start.getDate() ? 1 : 0);
}

/**
 * Verifica se um contrato está ativo
 */
export function isContractActive(contract: any): boolean {
  const now = new Date();
  const startDate = new Date(contract.startDate || contract.start_date);
  const endDate = new Date(contract.endDate || contract.end_date);
  const status = contract.status;
  
  return status === 'active' && now >= startDate && now <= endDate;
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Valida e converte DTO para entidade
 */
export function dtoToContractEntity(dto: CreateContractInput | UpdateContractInput): any {
  return {
    ...dto,
    // Conversões e transformações necessárias
    monthlyRent: Number(dto.monthlyRent),
    depositAmount: dto.depositAmount ? Number(dto.depositAmount) : undefined,
    contractTerm: dto.contractTerm ? Number(dto.contractTerm) : undefined
  };
}

/**
 * Valida DTO de criação
 */
export function validateCreateContract(data: unknown): CreateContractInput {
  return CreateContractSchema.parse(data);
}

/**
 * Valida DTO de atualização
 */
export function validateUpdateContract(data: unknown): UpdateContractInput {
  return UpdateContractSchema.parse(data);
}

/**
 * Sanitiza dados de contrato removendo campos sensíveis
 */
export function sanitizeContractData(contract: any): Partial<ContractResponseDTO> {
  const { tenant, owner, ...sanitized } = contract;
  return sanitized;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Verifica se um objeto é um DTO de criação válido
 */
export function isCreateContractDTO(obj: any): obj is CreateContractDTO {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.propertyId === 'string' &&
    typeof obj.tenantId === 'string' &&
    typeof obj.startDate === 'string' &&
    typeof obj.endDate === 'string' &&
    typeof obj.monthlyRent === 'number' &&
    typeof obj.status === 'string'
  );
}

/**
 * Verifica se um objeto é um DTO de resposta válido
 */
export function isContractResponseDTO(obj: any): obj is ContractResponseDTO {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.property === 'object' &&
    typeof obj.tenant === 'object' &&
    typeof obj.startDate === 'string' &&
    typeof obj.endDate === 'string' &&
    typeof obj.monthlyRent === 'number' &&
    typeof obj.status === 'string'
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Schemas
  CreateContractSchema,
  UpdateContractSchema,
  
  // Types
  
  // Mappers
  propertyToDTO,
  userToDTO,
  contractToResponseDTO,
  contractToListItemDTO,
  dtoToContractEntity,
  
  // Validators
  validateCreateContract,
  validateUpdateContract,
  
  // Utilities
  calculateDuration,
  isContractActive,
  formatCurrency,
  sanitizeContractData,
  
  // Type Guards
  isCreateContractDTO,
  isContractResponseDTO
};