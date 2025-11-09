// Mocks customizados para cenários específicos de teste

import { vi } from 'vitest';
import { faker } from '@faker-js/faker/locale/pt_BR';

// Mock de servidor lento
export const createSlowServerMock = (delay: number = 2000) => {
  return {
    delay,
    response: vi.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Resposta tardia' }),
        }), delay)
      )
    ),
  };
};

// Mock de servidor com falhas intermitentes
export const createFlakyServerMock = (failureRate: number = 0.3) => {
  let callCount = 0;
  
  return {
    shouldFail: () => {
      callCount++;
      return Math.random() < failureRate;
    },
    response: vi.fn().mockImplementation(() => {
      if (callCount > 0 && callCount % Math.ceil(1 / failureRate) === 0) {
        return Promise.resolve({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          data: faker.string.alphanumeric(10),
          timestamp: new Date().toISOString(),
        }),
      });
    }),
  };
};

// Mock de servidor com dados consistentes
export const createConsistentServerMock = () => {
  const mockData = {
    contracts: [
      {
        id: '1',
        contractNumber: 'CON-2024-CONSISTENT',
        clientName: 'Cliente Consistente',
        property: 'Rua Consistente, 123',
        status: 'active' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        totalValue: 1500.00,
        paidValue: 750.00,
        dueDate: '2024-06-30',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    users: [
      {
        id: '1',
        email: 'consistent@example.com',
        user_metadata: {
          name: 'User Consistente',
          role: 'user',
        },
      },
    ],
  };

  return {
    getContracts: vi.fn().mockResolvedValue({
      ...mockData,
      contracts: mockData.contracts,
      total: mockData.contracts.length,
      page: 1,
      hasMore: false,
    }),
    
    getContract: vi.fn().mockImplementation((id: string) => {
      const contract = mockData.contracts.find(c => c.id === id);
      if (!contract) {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(contract),
      });
    }),
    
    getUsers: vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        users: mockData.users,
        total: mockData.users.length,
      }),
    }),
  };
};

// Mock para cenários de rate limiting
export const createRateLimitMock = (limit: number = 5, windowMs: number = 60000) => {
  let requests = 0;
  const windowStart = Date.now();
  
  return {
    checkLimit: () => {
      const now = Date.now();
      if (now - windowStart > windowMs) {
        requests = 0; // Reset window
      }
      
      if (requests >= limit) {
        return false; // Rate limit exceeded
      }
      
      requests++;
      return true;
    },
    
    response: vi.fn().mockImplementation(() => {
      if (!checkLimit()) {
        return Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (windowStart + windowMs - Date.now()) / 1000,
          },
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          data: faker.string.alphanumeric(10),
          rateLimitRemaining: limit - requests,
        }),
      });
    }),
  };
};

// Mock para cenários de autenticação
export const createAuthMock = () => {
  const sessions = new Map();
  const users = new Map([
    ['admin@example.com', {
      id: 'admin-1',
      email: 'admin@example.com',
      user_metadata: { name: 'Admin', role: 'admin' },
    }],
    ['user@example.com', {
      id: 'user-1', 
      email: 'user@example.com',
      user_metadata: { name: 'User', role: 'user' },
    }],
  ]);

  return {
    signIn: vi.fn().mockImplementation((email: string, password: string) => {
      if (!users.has(email)) {
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Invalid credentials',
        });
      }
      
      if (password !== 'correct-password') {
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Invalid credentials',
        });
      }
      
      const user = users.get(email);
      const token = faker.string.alphanumeric(64);
      sessions.set(token, { user, email });
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user,
          session: {
            access_token: token,
            refresh_token: faker.string.alphanumeric(32),
            expires_in: 3600,
          },
        }),
      });
    }),
    
    signOut: vi.fn().mockImplementation((token: string) => {
      sessions.delete(token);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Logged out' }),
      });
    }),
    
    getSession: vi.fn().mockImplementation((token: string) => {
      const session = sessions.get(token);
      if (!session) {
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Invalid session',
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: session.user,
          session: {
            access_token: token,
            refresh_token: faker.string.alphanumeric(32),
            expires_in: 3600,
          },
        }),
      });
    }),
    
    resetPassword: vi.fn().mockImplementation((email: string) => {
      if (!users.has(email)) {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'User not found',
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          message: 'Password reset email sent' 
        }),
      });
    }),
  };
};

// Mock para cenários de validação
export const createValidationMock = () => {
  const validationRules = {
    contract: {
      required: ['contractNumber', 'clientName', 'property', 'startDate', 'endDate', 'totalValue'],
      minLength: { contractNumber: 3, clientName: 2, property: 5 },
      maxLength: { contractNumber: 50, clientName: 100, property: 200 },
      pattern: { contractNumber: /^CON-\d{4}-\d{3,4}$/ },
      types: { totalValue: 'number', paidValue: 'number' },
    },
    user: {
      required: ['email'],
      pattern: { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    },
  };

  return {
    validate: vi.fn().mockImplementation((data: any, type: string) => {
      const rules = validationRules[type as keyof typeof validationRules];
      if (!rules) {
        return { valid: true, errors: [] };
      }
      
      const errors: string[] = [];
      
      // Verificar campos obrigatórios
      if (rules.required) {
        for (const field of rules.required) {
          if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            errors.push(`${field} é obrigatório`);
          }
        }
      }
      
      // Verificar padrões
      if (rules.pattern) {
        for (const [field, pattern] of Object.entries(rules.pattern)) {
          if (data[field] && !pattern.test(data[field])) {
            errors.push(`${field} não está no formato correto`);
          }
        }
      }
      
      // Verificar tipos
      if (rules.types) {
        for (const [field, expectedType] of Object.entries(rules.types)) {
          if (data[field] && typeof data[field] !== expectedType) {
            errors.push(`${field} deve ser do tipo ${expectedType}`);
          }
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
      };
    }),
    
    response: vi.fn().mockImplementation((data: any, type: string) => {
      const validation = validate(data, type);
      
      if (!validation.valid) {
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Validation Error',
          json: () => Promise.resolve({
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: validation.errors,
            },
          }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          data,
          validated: true,
          timestamp: new Date().toISOString(),
        }),
      });
    }),
  };
};

// Mock para cenários de paginação
export const createPaginationMock = (totalItems: number = 100, pageSize: number = 10) => {
  return {
    getPage: vi.fn().mockImplementation((page: number, pageSizeParam?: number) => {
      const size = pageSizeParam || pageSize;
      const startIndex = (page - 1) * size;
      const endIndex = Math.min(startIndex + size, totalItems);
      const hasMore = endIndex < totalItems;
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          items: Array.from({ length: endIndex - startIndex }, (_, i) => ({
            id: `item-${startIndex + i + 1}`,
            data: faker.string.alphanumeric(20),
          })),
          total: totalItems,
          page,
          pageSize: size,
          hasMore,
          totalPages: Math.ceil(totalItems / size),
        }),
      });
    }),
  };
};

// Utilitários para criar mocks complexos
export const createMockScenario = (scenario: string) => {
  switch (scenario) {
    case 'network-error':
      return vi.fn().mockRejectedValue(new Error('Network Error'));
    
    case 'timeout':
      return vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
    
    case 'server-error':
      return vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
    
    case 'validation-error':
      return vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: ['Field is required', 'Invalid format'],
          },
        }),
      });
    
    case 'rate-limited':
      return vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({
          error: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMITED',
          },
        }),
      });
    
    case 'unauthorized':
      return vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
          },
        }),
      });
    
    case 'not-found':
      return vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({
          error: {
            message: 'Resource not found',
            code: 'NOT_FOUND',
          },
        }),
      });
    
    default:
      return vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });
  }
};

// Mock para simular latência de rede
export const createNetworkLatencyMock = (minLatency: number = 50, maxLatency: number = 500) => {
  return vi.fn().mockImplementation(() => {
    const latency = Math.random() * (maxLatency - minLatency) + minLatency;
    
    return new Promise(resolve => 
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve({
            data: faker.string.alphanumeric(20),
            latency,
            timestamp: new Date().toISOString(),
          }),
        });
      }, latency)
    );
  });
};

// Configuração global de mocks para teste
export const configureGlobalMocks = () => {
  // Configurar fetch global com mock padrão
  global.fetch = createMockScenario('success');
  
  // Configurar localStorage para testes
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
  
  // Configurar console para suprimir logs em testes
  global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
};