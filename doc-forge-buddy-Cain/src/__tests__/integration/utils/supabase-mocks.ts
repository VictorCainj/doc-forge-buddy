import { vi } from 'vitest';

// Tipos para mocks do Supabase
export interface MockSupabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface MockSupabaseQueryBuilder {
  select: () => MockSupabaseQueryBuilder;
  insert: (data: any) => MockSupabaseQueryBuilder;
  update: (data: any) => MockSupabaseQueryBuilder;
  delete: () => MockSupabaseQueryBuilder;
  upsert: (data: any) => MockSupabaseQueryBuilder;
  eq: (column: string, value: any) => MockSupabaseQueryBuilder;
  neq: (column: string, value: any) => MockSupabaseQueryBuilder;
  gt: (column: string, value: any) => MockSupabaseQueryBuilder;
  gte: (column: string, value: any) => MockSupabaseQueryBuilder;
  lt: (column: string, value: any) => MockSupabaseQueryBuilder;
  lte: (column: string, value: any) => MockSupabaseQueryBuilder;
  like: (column: string, pattern: string) => MockSupabaseQueryBuilder;
  ilike: (column: string, pattern: string) => MockSupabaseQueryBuilder;
  is: (column: string, value: any) => MockSupabaseQueryBuilder;
  in: (column: string, values: any[]) => MockSupabaseQueryBuilder;
  order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => MockSupabaseQueryBuilder;
  range: (from: number, to: number) => MockSupabaseQueryBuilder;
  limit: (count: number) => MockSupabaseQueryBuilder;
  single: () => Promise<MockSupabaseResponse<any>>;
  maybeSingle: () => Promise<MockSupabaseResponse<any>>;
  then: (callback: (result: MockSupabaseResponse<any>) => any) => Promise<any>;
}

// Mock dos dados do Supabase
export const mockSupabaseData = {
  users: [
    {
      id: '1',
      email: 'admin@example.com',
      user_metadata: {
        name: 'Admin User',
        role: 'admin',
      },
    },
  ],
  contracts: [
    {
      id: '1',
      contract_number: 'CON-2024-001',
      client_name: 'João Silva',
      property: 'Rua das Flores, 123',
      status: 'active',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      total_value: 1200.00,
      paid_value: 600.00,
      due_date: '2024-06-30',
    },
  ],
};

// Criar mock do Supabase
export const createMockSupabase = () => {
  // Mock do auth
  const mockAuth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    getUser: vi.fn(),
  };

  // Mock do from (database)
  const mockFrom = vi.fn((table: string) => {
    const queryBuilder: MockSupabaseQueryBuilder = {
      select: () => queryBuilder,
      insert: () => queryBuilder,
      update: () => queryBuilder,
      delete: () => queryBuilder,
      upsert: () => queryBuilder,
      eq: () => queryBuilder,
      neq: () => queryBuilder,
      gt: () => queryBuilder,
      gte: () => queryBuilder,
      lt: () => queryBuilder,
      lte: () => queryBuilder,
      like: () => queryBuilder,
      ilike: () => queryBuilder,
      is: () => queryBuilder,
      in: () => queryBuilder,
      order: () => queryBuilder,
      range: () => queryBuilder,
      limit: () => queryBuilder,
      
      single: vi.fn(() => Promise.resolve({
        data: mockSupabaseData[table as keyof typeof mockSupabaseData]?.[0] || null,
        error: null,
      })),
      
      maybeSingle: vi.fn(() => Promise.resolve({
        data: mockSupabaseData[table as keyof typeof mockSupabaseData]?.[0] || null,
        error: null,
      })),
      
      then: vi.fn((callback) => {
        const result = {
          data: mockSupabaseData[table as keyof typeof mockSupabaseData] || [],
          error: null,
        };
        return callback(result);
      }),
    };
    
    return queryBuilder;
  });

  return {
    auth: mockAuth,
    from: mockFrom,
  };
};

// Configurar mocks do Supabase por padrão
export const mockSupabase = createMockSupabase();

// Helper para configurar responses específicas
export const configureSupabaseResponse = {
  // Configurar response de autenticação bem-sucedida
  authSuccess: (user: any = mockSupabaseData.users[0]) => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user } },
      error: null,
    });
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user, session: { access_token: 'mock-token' } },
      error: null,
    });
  },

  // Configurar response de autenticação com erro
  authError: (errorMessage: string = 'Invalid credentials') => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: errorMessage },
    });
  },

  // Configurar response de busca de contrato
  contractFound: (contract: any = mockSupabaseData.contracts[0]) => {
    const mockQueryBuilder = {
      ...mockSupabase.from('contracts'),
      single: vi.fn(() => Promise.resolve({
        data: contract,
        error: null,
      })),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);
  },

  // Configurar response de contrato não encontrado
  contractNotFound: () => {
    const mockQueryBuilder = {
      ...mockSupabase.from('contracts'),
      single: vi.fn(() => Promise.resolve({
        data: null,
        error: { message: 'Contract not found' },
      })),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);
  },

  // Configurar response de inserção de dados
  dataInserted: (table: string, insertedData: any) => {
    const mockQueryBuilder = {
      ...mockSupabase.from(table),
      then: vi.fn((callback) => {
        const result = {
          data: [insertedData],
          error: null,
        };
        return callback(result);
      }),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);
  },

  // Configurar response de erro de banco de dados
  databaseError: (errorMessage: string = 'Database connection failed') => {
    const mockQueryBuilder = {
      ...mockSupabase.from('contracts'),
      then: vi.fn(() => Promise.resolve({
        data: null,
        error: { message: errorMessage },
      })),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);
  },
};

// Limpar todos os mocks
export const clearSupabaseMocks = () => {
  vi.clearAllMocks();
};