/**
 * Exemplos de uso dos Data Transfer Objects (DTOs)
 * Demonstra a implementação prática dos DTOs
 */

import {
  CreateContractSchema,
  CreatePropertySchema,
  CreateUserSchema,
  contractToResponseDTO,
  propertyToResponseDTO,
  userToResponseDTO,
  validateCreateContract,
  formatCurrency
} from './index';

// =============================================================================
// EXEMPLO 1: CRIAÇÃO DE CONTRATO
// =============================================================================

function exemploCriacaoContrato() {
  // 1. Dados de entrada do usuário
  const dadosContrato = {
    propertyId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.999Z',
    monthlyRent: 2500,
    status: 'active' as const
  };

  // 2. Validação automática
  const contratoValidado = validateCreateContract(dadosContrato);
  console.log('Contrato validado:', contratoValidado);

  // 3. Formatação
  const valorFormatado = formatCurrency(contratoValidado.monthlyRent);
  console.log('Valor formatado:', valorFormatado);

  // 4. Simulação de salvamento
  const contratoSalvo = {
    id: 'contrato-123',
    ...contratoValidado,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 5. Conversão para DTO de resposta
  const contratoDTO = contractToResponseDTO({
    ...contratoSalvo,
    property: {
      id: contratoValidado.propertyId,
      address: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      type: 'apartment',
      area: 85,
      furnished: false,
      parkingSpaces: 1,
      amenities: ['varanda'],
      isActive: true
    },
    tenant: {
      id: contratoValidado.tenantId,
      userId: 'user-123',
      email: 'locatario@exemplo.com',
      fullName: 'João da Silva',
      role: 'locatario',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  });

  console.log('DTO de resposta:', {
    id: contratoDTO.id,
    duracao: `${contratoDTO.duration} meses`,
    valorTotal: formatCurrency(contratoDTO.totalValue),
    ativo: contratoDTO.isActive,
    diasRestantes: contratoDTO.daysRemaining
  });

  return contratoDTO;
}

// =============================================================================
// EXEMPLO 2: CRIAÇÃO DE PROPRIEDADE
// =============================================================================

function exemploCriacaoPropriedade() {
  // 1. Dados de entrada
  const dadosPropriedade = {
    address: 'Rua das Palmeiras, 456',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-000',
    type: 'apartment' as const,
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    furnished: true,
    parkingSpaces: 2,
    amenities: ['varanda', 'portaria', 'academia'],
    ownerId: '123e4567-e89b-12d3-a456-426614174001',
    isActive: true
  };

  // 2. Validação
  const propriedadeValidada = CreatePropertySchema.parse(dadosPropriedade);

  // 3. Simulação de salvamento
  const propriedadeSalva = {
    id: 'propriedade-123',
    ...propriedadeValidada,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 4. Conversão para DTO
  const propriedadeDTO = propertyToResponseDTO(propriedadeSalva);

  console.log('Propriedade criada:', {
    endereco: propriedadeDTO.address,
    tipo: propriedadeDTO.type,
    area: `${propriedadeDTO.area}m²`,
    quartos: propriedadeDTO.bedrooms,
    vaga: propriedadeDTO.parkingSpaces,
    Status: propriedadeDTO.isActive ? 'Ativa' : 'Inativa'
  });

  return propriedadeDTO;
}

// =============================================================================
// EXEMPLO 3: CRIAÇÃO DE USUÁRIO
// =============================================================================

function exemploCriacaoUsuario() {
  // 1. Dados de entrada
  const dadosUsuario = {
    email: 'usuario@exemplo.com',
    fullName: 'Maria dos Santos',
    phone: '(11) 99999-8888',
    document: '123.456.789-00',
    documentType: 'CPF' as const,
    role: 'user' as const,
    isActive: true,
    city: 'São Paulo',
    state: 'SP'
  };

  // 2. Validação
  const usuarioValidado = CreateUserSchema.parse(dadosUsuario);

  // 3. Simulação de salvamento
  const usuarioSalvo = {
    id: 'usuario-123',
    userId: 'user-123',
    ...usuarioValidado,
    exp: 0,
    level: 1,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 4. Conversão para DTO
  const usuarioDTO = userToResponseDTO(usuarioSalvo);

  console.log('Usuário criado:', {
    nome: usuarioDTO.fullName,
    email: usuarioDTO.email,
    telefone: usuarioDTO.phone,
    cidade: usuarioDTO.city,
    nivel: usuarioDTO.level,
    status: usuarioDTO.isActive ? 'Ativo' : 'Inativo'
  });

  return usuarioDTO;
}

// =============================================================================
// EXEMPLO 4: VALIDAÇÃO E TRATAMENTO DE ERROS
// =============================================================================

function exemploValidacaoErros() {
  console.log('\n=== Exemplos de Validação ===');

  // Dados inválidos
  const dadosInvalidos = {
    propertyId: 'invalid-uuid',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.999Z',
    monthlyRent: -100, // Valor negativo
    status: 'active' as const
  };

  try {
    validateCreateContract(dadosInvalidos);
  } catch (error) {
    console.log('Erro de validação capturado:', error instanceof Error ? error.message : 'Erro desconhecido');
  }

  // Dados válidos
  const dadosValidos = {
    propertyId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.999Z',
    monthlyRent: 2500,
    status: 'active' as const
  };

  try {
    const resultado = validateCreateContract(dadosValidos);
    console.log('Validação bem-sucedida:', 'Dados corretos');
  } catch (error) {
    console.log('Erro inesperado:', error);
  }
}

// =============================================================================
// EXEMPLO 5: TRANSFORMAÇÃO EM LOTE
// =============================================================================

function exemploTransformacaoLote() {
  console.log('\n=== Transformação em Lote ===');

  // Simular múltiplos contratos
  const contratos = Array.from({ length: 5 }, (_, i) => ({
    id: `contrato-${i + 1}`,
    property: {
      id: `prop-${i + 1}`,
      address: `Rua ${i + 1}, ${i + 100}`,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      type: 'apartment',
      area: 80 + i * 10,
      furnished: i % 2 === 0,
      parkingSpaces: 1,
      amenities: ['varanda'],
      isActive: true
    },
    tenant: {
      id: `user-${i + 1}`,
      userId: `user-${i + 1}`,
      email: `usuario${i + 1}@exemplo.com`,
      fullName: `Usuário ${i + 1}`,
      role: 'locatario',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.999Z',
    monthlyRent: 2000 + i * 500,
    status: 'active' as const,
    documentType: 'Termo do Locatário',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }));

  // Transformar todos em DTOs
  const contratosDTO = contratos.map(contractToResponseDTO);

  // Resumo
  const resumo = {
    total: contratosDTO.length,
    valorMedio: contratosDTO.reduce((sum, c) => sum + c.monthlyRent, 0) / contratosDTO.length,
    duracaoMedia: contratosDTO.reduce((sum, c) => sum + c.duration, 0) / contratosDTO.length,
    ativos: contratosDTO.filter(c => c.isActive).length
  };

  console.log('Resumo da transformação em lote:', {
    total: resumo.total,
    valorMedio: formatCurrency(resumo.valorMedio),
    duracaoMedia: `${Math.round(resumo.duracaoMedia)} meses`,
    contratosAtivos: resumo.ativos
  });

  return contratosDTO;
}

// =============================================================================
// FUNÇÃO PRINCIPAL DE EXEMPLO
// =============================================================================

export function executarExemplosDTO() {
  console.log('🚀 Iniciando exemplos de DTOs\n');

  try {
    // Executar todos os exemplos
    exemploCriacaoContrato();
    console.log('\n' + '='.repeat(50) + '\n');
    
    exemploCriacaoPropriedade();
    console.log('\n' + '='.repeat(50) + '\n');
    
    exemploCriacaoUsuario();
    console.log('\n' + '='.repeat(50) + '\n');
    
    exemploValidacaoErros();
    console.log('\n' + '='.repeat(50) + '\n');
    
    exemploTransformacaoLote();
    
    console.log('\n✅ Todos os exemplos executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a execução dos exemplos:', error);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  exemploCriacaoContrato,
  exemploCriacaoPropriedade,
  exemploCriacaoUsuario,
  exemploValidacaoErros,
  exemploTransformacaoLote
};