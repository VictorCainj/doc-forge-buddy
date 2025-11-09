import { http, HttpResponse } from 'msw';

// Dados mockados para testes
const mockContracts = [
  {
    id: '1',
    contractNumber: 'CON-2024-001',
    clientName: 'João Silva',
    property: 'Rua das Flores, 123',
    status: 'active' as const,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    totalValue: 1200.00,
    paidValue: 600.00,
    dueDate: '2024-06-30',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    contractNumber: 'CON-2024-002',
    clientName: 'Maria Santos',
    property: 'Av. Brasil, 456',
    status: 'pending' as const,
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    totalValue: 1500.00,
    paidValue: 0.00,
    dueDate: '2024-02-28',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '3',
    contractNumber: 'CON-2024-003',
    clientName: 'Pedro Oliveira',
    property: 'Rua do Sol, 789',
    status: 'completed' as const,
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    totalValue: 1800.00,
    paidValue: 1800.00,
    dueDate: '2024-05-31',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-05-31T00:00:00Z',
  },
];

const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    user_metadata: {
      name: 'Admin User',
      role: 'admin',
    },
  },
  {
    id: '2',
    email: 'user@example.com',
    user_metadata: {
      name: 'Regular User',
      role: 'user',
    },
  },
];

// Handlers para APIs
export const handlers = [
  // === CONTRACTS API ===
  // GET /api/contracts - Listar contratos
  http.get('/api/contracts', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let filteredContracts = [...mockContracts];

    // Aplicar filtros
    if (status) {
      filteredContracts = filteredContracts.filter(
        contract => contract.status === status
      );
    }

    if (search) {
      filteredContracts = filteredContracts.filter(
        contract =>
          contract.clientName.toLowerCase().includes(search.toLowerCase()) ||
          contract.contractNumber.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

    return HttpResponse.json({
      contracts: paginatedContracts,
      total: filteredContracts.length,
      page,
      hasMore: endIndex < filteredContracts.length,
    });
  }),

  // GET /api/contracts/:id - Buscar contrato específico
  http.get('/api/contracts/:id', ({ params }) => {
    const { id } = params;
    const contract = mockContracts.find(c => c.id === id);

    if (!contract) {
      return HttpResponse.json(
        { error: { message: 'Contrato não encontrado' } },
        { status: 404 }
      );
    }

    return HttpResponse.json(contract);
  }),

  // POST /api/contracts - Criar novo contrato
  http.post('/api/contracts', async ({ request }) => {
    const body = await request.json();

    const newContract = {
      id: `temp-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending' as const,
      paidValue: 0,
    };

    return HttpResponse.json(newContract, { status: 201 });
  }),

  // PUT /api/contracts/:id - Atualizar contrato
  http.put('/api/contracts/:id', async ({ params, request }) => {
    const { id } = params;
    const updates = await request.json();

    const contractIndex = mockContracts.findIndex(c => c.id === id);

    if (contractIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Contrato não encontrado' } },
        { status: 404 }
      );
    }

    const updatedContract = {
      ...mockContracts[contractIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockContracts[contractIndex] = updatedContract;

    return HttpResponse.json(updatedContract);
  }),

  // DELETE /api/contracts/:id - Deletar contrato
  http.delete('/api/contracts/:id', ({ params }) => {
    const { id } = params;
    const contractIndex = mockContracts.findIndex(c => c.id === id);

    if (contractIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Contrato não encontrado' } },
        { status: 404 }
      );
    }

    mockContracts.splice(contractIndex, 1);

    return HttpResponse.json({ message: 'Contrato deletado com sucesso' });
  }),

  // GET /api/contracts/stats - Estatísticas de contratos
  http.get('/api/contracts/stats', () => {
    const stats = {
      total: mockContracts.length,
      active: mockContracts.filter(c => c.status === 'active').length,
      pending: mockContracts.filter(c => c.status === 'pending').length,
      completed: mockContracts.filter(c => c.status === 'completed').length,
      cancelled: mockContracts.filter(c => c.status === 'cancelled').length,
      totalValue: mockContracts.reduce((sum, c) => sum + c.totalValue, 0),
      paidValue: mockContracts.reduce((sum, c) => sum + c.paidValue, 0),
    };

    return HttpResponse.json(stats);
  }),

  // === AUTH API ===
  // POST /api/auth/signin - Login
  http.post('/api/auth/signin', async ({ request }) => {
    const body = await request.json();
    const { email, password } = body;

    // Simular validação
    if (email === 'invalid@example.com') {
      return HttpResponse.json(
        { error: { message: 'Credenciais inválidas' } },
        { status: 401 }
      );
    }

    if (password === 'wrong') {
      return HttpResponse.json(
        { error: { message: 'Senha incorreta' } },
        { status: 401 }
      );
    }

    const user = mockUsers.find(u => u.email === email) || {
      id: 'temp-user',
      email,
      user_metadata: { name: 'Test User' },
    };

    return HttpResponse.json({
      user,
      session: {
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      },
    });
  }),

  // POST /api/auth/signout - Logout
  http.post('/api/auth/signout', () => {
    return HttpResponse.json({ message: 'Logout realizado com sucesso' });
  }),

  // POST /api/auth/reset-password - Reset de senha
  http.post('/api/auth/reset-password', ({ request }) => {
    return HttpResponse.json({
      message: 'Email de reset enviado com sucesso',
    });
  }),

  // === USERS API ===
  // GET /api/users - Listar usuários
  http.get('/api/users', () => {
    return HttpResponse.json({
      users: mockUsers,
      total: mockUsers.length,
    });
  }),

  // === ERROR HANDLING ===
  // Simular erros de rede
  http.get('/api/network-error', () => {
    return HttpResponse.json(
      { error: { message: 'Erro de rede simulado' } },
      { status: 503 }
    );
  }),

  // Simular timeout
  http.get('/api/timeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return HttpResponse.json({ message: 'Resposta tardia' });
  }),

  // Simular erro 500
  http.get('/api/server-error', () => {
    return HttpResponse.json(
      { error: { message: 'Erro interno do servidor' } },
      { status: 500 }
    );
  }),
];