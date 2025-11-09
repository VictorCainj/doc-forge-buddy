import { http, HttpResponse, delay } from 'msw';
import { mockUser, mockContract } from '../utils/test-utils';

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3001/api';

// Auth endpoints
export const authHandlers = [
  // Login
  http.post(`${API_BASE_URL}/auth/login`, async () => {
    await delay(500); // Simulate network delay
    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      },
      message: 'Login successful',
    });
  }),

  // Logout
  http.post(`${API_BASE_URL}/auth/logout`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      message: 'Logout successful',
    });
  }),

  // Register
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    await delay(800);
    const userData = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: '2',
          email: userData.email,
          name: userData.name,
          role: 'user',
        },
        token: 'mock-jwt-token',
      },
      message: 'User registered successfully',
    });
  }),

  // Get current user
  http.get(`${API_BASE_URL}/auth/me`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
      },
    });
  }),

  // Forgot password
  http.post(`${API_BASE_URL}/auth/forgot-password`, async () => {
    await delay(600);
    return HttpResponse.json({
      success: true,
      message: 'Password reset email sent',
    });
  }),

  // Reset password
  http.post(`${API_BASE_URL}/auth/reset-password`, async () => {
    await delay(400);
    return HttpResponse.json({
      success: true,
      message: 'Password reset successful',
    });
  }),
];

// Contract endpoints
export const contractHandlers = [
  // Get all contracts
  http.get(`${API_BASE_URL}/contracts`, async () => {
    await delay(400);
    return HttpResponse.json({
      success: true,
      data: {
        contracts: [mockContract],
        total: 1,
        page: 1,
        limit: 10,
      },
    });
  }),

  // Get contract by ID
  http.get(`${API_BASE_URL}/contracts/:id`, async ({ params }) => {
    await delay(300);
    
    if (params.id === 'not-found') {
      return HttpResponse.json(
        {
          success: false,
          error: 'Contract not found',
        },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        contract: { ...mockContract, id: params.id },
      },
    });
  }),

  // Create contract
  http.post(`${API_BASE_URL}/contracts`, async ({ request }) => {
    await delay(600);
    const contractData = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        contract: {
          id: '2',
          ...contractData,
          status: 'ativo',
          dataCriacao: new Date().toISOString(),
        },
      },
      message: 'Contract created successfully',
    });
  }),

  // Update contract
  http.put(`${API_BASE_URL}/contracts/:id`, async ({ request, params }) => {
    await delay(500);
    const updateData = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        contract: {
          id: params.id,
          ...mockContract,
          ...updateData,
        },
      },
      message: 'Contract updated successfully',
    });
  }),

  // Delete contract
  http.delete(`${API_BASE_URL}/contracts/:id`, async ({ params }) => {
    await delay(400);
    
    return HttpResponse.json({
      success: true,
      message: 'Contract deleted successfully',
    });
  }),
];

// Document endpoints
export const documentHandlers = [
  // Get documents
  http.get(`${API_BASE_URL}/documents`, async () => {
    await delay(350);
    return HttpResponse.json({
      success: true,
      data: {
        documents: [
          {
            id: '1',
            nome: 'Contrato Principal',
            tipo: 'contrato',
            tamanho: 1024 * 1024, // 1MB
            dataUpload: new Date().toISOString(),
            url: '/uploads/contrato.pdf',
          },
        ],
      },
    });
  }),

  // Upload document
  http.post(`${API_BASE_URL}/documents/upload`, async () => {
    await delay(1000);
    return HttpResponse.json({
      success: true,
      data: {
        document: {
          id: '2',
          nome: 'Novo Documento.pdf',
          tipo: 'documento',
          tamanho: 2048 * 1024, // 2MB
          dataUpload: new Date().toISOString(),
          url: '/uploads/novo-documento.pdf',
        },
      },
      message: 'Document uploaded successfully',
    });
  }),

  // Download document
  http.get(`${API_BASE_URL}/documents/:id/download`, async () => {
    await delay(500);
    
    // Return a mock PDF file
    return new HttpResponse('mock-pdf-content', {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      },
    });
  }),
];

// User management endpoints
export const userHandlers = [
  // Get users (admin only)
  http.get(`${API_BASE_URL}/users`, async () => {
    await delay(400);
    return HttpResponse.json({
      success: true,
      data: {
        users: [
          mockUser,
          {
            id: '2',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin' as const,
          },
        ],
        total: 2,
      },
    });
  }),

  // Update user
  http.put(`${API_BASE_URL}/users/:id`, async ({ request, params }) => {
    await delay(500);
    const updateData = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: params.id,
          ...mockUser,
          ...updateData,
        },
      },
      message: 'User updated successfully',
    });
  }),

  // Delete user
  http.delete(`${API_BASE_URL}/users/:id`, async ({ params }) => {
    await delay(400);
    
    return HttpResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  }),
];

// Dashboard/Analytics endpoints
export const dashboardHandlers = [
  // Get dashboard data
  http.get(`${API_BASE_URL}/dashboard`, async () => {
    await delay(600);
    return HttpResponse.json({
      success: true,
      data: {
        stats: {
          totalContracts: 150,
          activeContracts: 120,
          pendingDocuments: 25,
          totalUsers: 45,
        },
        charts: {
          contractsByMonth: [
            { month: 'Jan', contracts: 15 },
            { month: 'Feb', contracts: 18 },
            { month: 'Mar', contracts: 22 },
          ],
        },
      },
    });
  }),

  // Get notifications
  http.get(`${API_BASE_URL}/notifications`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        notifications: [
          {
            id: '1',
            type: 'info',
            title: 'New Contract',
            message: 'A new contract has been created',
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      },
    });
  }),
];

// Error simulation handlers
export const errorHandlers = [
  // Simulate server error
  http.get(`${API_BASE_URL}/error/500`, () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Something went wrong on the server',
      },
      { status: 500 }
    );
  }),

  // Simulate network error
  http.get(`${API_BASE_URL}/error/network`, () => {
    return HttpResponse.error();
  }),

  // Simulate validation error
  http.post(`${API_BASE_URL}/error/validation`, async ({ request }) => {
    const data = await request.json();
    
    return HttpResponse.json(
      {
        success: false,
        error: 'Validation Error',
        details: {
          email: 'Email is invalid',
          password: 'Password must be at least 8 characters',
        },
      },
      { status: 400 }
    );
  }),

  // Simulate unauthorized
  http.get(`${API_BASE_URL}/error/unauthorized`, () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'You are not authorized to access this resource',
      },
      { status: 401 }
    );
  }),
];

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...contractHandlers,
  ...documentHandlers,
  ...userHandlers,
  ...dashboardHandlers,
  ...errorHandlers,
];

// Helper to create custom handlers
export const createCustomHandler = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  response: any,
  status: number = 200,
  delayMs: number = 300
) => {
  return http[method.toLowerCase()](`${API_BASE_URL}${url}`, async () => {
    await delay(delayMs);
    return HttpResponse.json(response, { status });
  });
};

// Helper to create error handlers
export const createErrorHandler = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  error: string,
  status: number = 400,
  delayMs: number = 300
) => {
  return http[method.toLowerCase()](`${API_BASE_URL}${url}`, async () => {
    await delay(delayMs);
    return HttpResponse.json(
      {
        success: false,
        error,
        message: error,
      },
      { status }
    );
  });
};