// Geradores de dados para testes de integração

import { faker } from '@faker-js/faker/locale/pt_BR';

// Gerador de contratos
export const generateContract = (overrides: Partial<any> = {}): any => {
  const startDate = faker.date.past({ years: 1 });
  const endDate = faker.date.future({ years: 2, refDate: startDate });
  
  return {
    id: faker.string.uuid(),
    contractNumber: `CON-${faker.number.int({ min: 2020, max: 2024 })}-${faker.number.int({ min: 1, max: 9999 }).toString().padStart(3, '0')}`,
    clientName: faker.person.fullName(),
    property: `${faker.location.streetAddress()}, ${faker.location.city()}`,
    status: faker.helpers.arrayElement(['active', 'pending', 'completed', 'cancelled']),
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalValue: faker.number.float({ min: 500, max: 5000, multipleOf: 0.01 }),
    paidValue: 0,
    dueDate: faker.date.future({ years: 1, refDate: startDate }).toISOString().split('T')[0],
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
};

// Gerador de lista de contratos
export const generateContractsList = (count: number = 5, overrides: any = {}): any => {
  const contracts = Array.from({ length: count }, () => generateContract());
  
  return {
    contracts,
    total: contracts.length,
    page: 1,
    hasMore: false,
    ...overrides,
  };
};

// Gerador de usuários
export const generateUser = (overrides: Partial<any> = {}): any => {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    user_metadata: {
      name: faker.person.fullName(),
      role: faker.helpers.arrayElement(['admin', 'user', 'manager']),
      ...overrides.user_metadata,
    },
    ...overrides,
  };
};

// Gerador de usuários com lista
export const generateUsersList = (count: number = 2, overrides: any = {}): any => {
  const users = Array.from({ length: count }, () => generateUser());
  
  return {
    users,
    total: users.length,
    ...overrides,
  };
};

// Gerador de sessão de autenticação
export const generateAuthSession = (user?: any, overrides: any = {}): any => {
  const userData = user || generateUser();
  
  return {
    user: userData,
    session: {
      access_token: faker.string.alphanumeric(64),
      refresh_token: faker.string.alphanumeric(32),
      expires_in: faker.number.int({ min: 300, max: 3600 }),
      ...overrides.session,
    },
    ...overrides,
  };
};

// Gerador de estatísticas de contratos
export const generateContractStats = (overrides: any = {}): any => {
  const total = faker.number.int({ min: 0, max: 100 });
  const active = faker.number.int({ min: 0, max: total });
  const pending = faker.number.int({ min: 0, max: total - active });
  const completed = faker.number.int({ min: 0, max: total - active - pending });
  const cancelled = total - active - pending - completed;
  
  return {
    total,
    active,
    pending,
    completed,
    cancelled,
    totalValue: faker.number.float({ min: 10000, max: 100000, multipleOf: 0.01 }),
    paidValue: faker.number.float({ min: 5000, max: 50000, multipleOf: 0.01 }),
    ...overrides,
  };
};

// Gerador de erros de API
export const generateApiError = (overrides: Partial<any> = {}): any => {
  const errorTypes = [
    'Network Error',
    'Invalid credentials',
    'Contract not found',
    'Database connection failed',
    'Unauthorized',
    'Internal server error',
    'Rate limit exceeded',
    'Invalid request format',
  ];

  return {
    error: {
      message: faker.helpers.arrayElement(errorTypes),
      code: faker.string.alphanumeric(10),
      ...overrides.error,
    },
    ...overrides,
  };
};

// Gerador de filtros para contratos
export const generateContractFilters = (overrides: any = {}): any => {
  return {
    status: faker.helpers.arrayElement(['active', 'pending', 'completed', 'cancelled', null, undefined]),
    search: faker.helpers.arrayElement([faker.person.fullName(), faker.string.alphanumeric(8), null, undefined]),
    startDate: faker.helpers.arrayElement([faker.date.past().toISOString().split('T')[0], null, undefined]),
    endDate: faker.helpers.arrayElement([faker.date.future().toISOString().split('T')[0], null, undefined]),
    page: faker.number.int({ min: 1, max: 10 }),
    limit: faker.helpers.arrayElement([10, 20, 50, 100]),
    ...overrides,
  };
};

// Gerador de dados para teste de paginação
export const generatePaginatedResponse = (itemGenerator: () => any, totalCount: number, page: number, limit: number): any => {
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalCount);
  const items = Array.from({ length: endIndex - startIndex }, () => itemGenerator());

  return {
    items,
    total: totalCount,
    page,
    hasMore: endIndex < totalCount,
  };
};

// Gerador de dados para testes de erro
export const generateNetworkError = (): Error => {
  return new Error('Network Error');
};

export const generateTimeoutError = (): Error => {
  return new Error('Timeout Error');
};

export const generateValidationError = (field: string, message: string): Error => {
  return new Error(`Validation Error: ${field} - ${message}`);
};

// Dados específicos para cenários de teste
export const testDataScenarios = {
  // Cenário de sucesso completo
  successfulContract: generateContract({
    status: 'active',
    totalValue: 2000,
    paidValue: 1000,
  }),

  // Cenário de contrato pendente
  pendingContract: generateContract({
    status: 'pending',
    paidValue: 0,
  }),

  // Cenário de contrato completo
  completedContract: generateContract({
    status: 'completed',
    totalValue: 3000,
    paidValue: 3000,
  }),

  // Cenário de usuário admin
  adminUser: generateUser({
    user_metadata: {
      name: 'Admin Test',
      role: 'admin',
    },
  }),

  // Cenário de usuário regular
  regularUser: generateUser({
    user_metadata: {
      name: 'User Test',
      role: 'user',
    },
  }),

  // Cenário de erro de rede
  networkError: generateApiError({
    error: {
      message: 'Network Error',
      code: 'NETWORK_ERROR',
    },
  }),

  // Cenário de erro de autenticação
  authError: generateApiError({
    error: {
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS',
    },
  }),

  // Cenário de erro de validação
  validationError: generateApiError({
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
    },
  }),
};

// Função utilitária para resetar dados entre testes
export const resetTestData = () => {
  // Fazer seed do faker para resultados consistentes
  faker.seed(12345);
};

// Função para gerar dados massivos para testes de performance
export const generateBulkData = (type: 'contracts' | 'users', count: number): any[] => {
  resetTestData();
  
  if (type === 'contracts') {
    return Array.from({ length: count }, () => generateContract());
  }
  
  if (type === 'users') {
    return Array.from({ length: count }, () => generateUser());
  }
  
  return [];
};