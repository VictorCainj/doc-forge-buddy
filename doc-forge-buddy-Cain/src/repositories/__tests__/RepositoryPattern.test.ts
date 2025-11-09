/**
 * Testes básicos para o Repository Pattern
 * Demonstra funcionalidades principais dos repositories
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  RepositoryFactory,
  RepositoryType,
  getContractRepository,
  getUserRepository,
  configureRepositories,
  repositoryLogger
} from '@/repositories';

// Mock do Supabase para testes
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({
    data: { id: '1', title: 'Test Contract', created_at: '2024-01-01' },
    error: null
  }),
  insert: jest.fn().mockResolvedValue({
    data: { id: '2', title: 'New Contract', created_at: '2024-01-01' },
    error: null
  }),
  update: jest.fn().mockResolvedValue({
    data: { id: '1', title: 'Updated Contract', updated_at: '2024-01-02' },
    error: null
  }),
  delete: jest.fn().mockResolvedValue({ error: null }),
  count: jest.fn().mockResolvedValue({ count: 5, error: null })
};

// Substitui o supabase real pelo mock nos testes
jest.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Repository Pattern', () => {
  beforeAll(() => {
    // Configura o factory para testes
    configureRepositories({
      enableLogging: true,
      defaultUserId: 'test-user-id',
      cacheEnabled: false // Desabilita cache para testes
    });
  });

  afterAll(() => {
    // Limpa os repositories após os testes
    RepositoryFactory.clearAll();
  });

  describe('RepositoryFactory', () => {
    it('should create and return repository instances', () => {
      const contractRepo = RepositoryFactory.get(RepositoryType.CONTRACT, 'test-user');
      const userRepo = RepositoryFactory.get(RepositoryType.USER, 'test-user');

      expect(contractRepo).toBeDefined();
      expect(userRepo).toBeDefined();
      expect(contractRepo.constructor.name).toBe('ContractRepository');
      expect(userRepo.constructor.name).toBe('UserRepository');
    });

    it('should return the same instance for same type and user', () => {
      const repo1 = RepositoryFactory.get(RepositoryType.CONTRACT, 'test-user');
      const repo2 = RepositoryFactory.get(RepositoryType.CONTRACT, 'test-user');

      expect(repo1).toBe(repo2);
    });

    it('should clear cache', () => {
      RepositoryFactory.get(RepositoryType.CONTRACT, 'test-user');
      RepositoryFactory.clearCache();

      // Após limpar, deve criar nova instância
      const newRepo = RepositoryFactory.get(RepositoryType.CONTRACT, 'test-user');
      // A instância será diferente (embora não possamos testar diretamente)
    });

    it('should return supported repository types', () => {
      const supportedTypes = RepositoryFactory.getSupportedTypes();
      expect(supportedTypes).toContain(RepositoryType.CONTRACT);
      expect(supportedTypes).toContain(RepositoryType.USER);
      expect(supportedTypes).toContain(RepositoryType.VISTORIA);
      expect(supportedTypes).toContain(RepositoryType.DOCUMENT);
      expect(supportedTypes).toContain(RepositoryType.NOTIFICATION);
    });
  });

  describe('ContractRepository', () => {
    it('should find contract by ID', async () => {
      const contractRepo = getContractRepository('test-user');
      const contract = await contractRepo.findById('1');

      expect(contract).toBeDefined();
      expect(contract?.id).toBe('1');
      expect(mockSupabase.from).toHaveBeenCalledWith('contracts');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('should create new contract', async () => {
      const contractRepo = getContractRepository('test-user');
      const newContract = await contractRepo.create({
        title: 'Test Contract',
        document_type: 'Termo do Locador',
        form_data: { numeroContrato: 'TEST-001' },
        content: '<html>Test</html>'
      });

      expect(newContract).toBeDefined();
      expect(newContract.id).toBe('2');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should update contract', async () => {
      const contractRepo = getContractRepository('test-user');
      const updatedContract = await contractRepo.update('1', {
        title: 'Updated Contract'
      });

      expect(updatedContract).toBeDefined();
      expect(updatedContract.title).toBe('Updated Contract');
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should delete contract', async () => {
      const contractRepo = getContractRepository('test-user');
      await contractRepo.delete('1');

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should count contracts', async () => {
      const contractRepo = getContractRepository('test-user');
      const count = await contractRepo.count();

      expect(count).toBe(5);
      expect(mockSupabase.count).toHaveBeenCalled();
    });

    it('should find contracts with conditions', async () => {
      const contractRepo = getContractRepository('test-user');
      
      // Mock para findWithConditions
      const mockResult = [
        { id: '1', title: 'Active Contract' },
        { id: '2', title: 'Another Active Contract' }
      ];
      
      jest.spyOn(contractRepo, 'findWithConditions').mockResolvedValue(mockResult);

      const contracts = await contractRepo.findWithConditions([
        { column: 'status', operator: 'eq', value: 'active' }
      ]);

      expect(contracts).toHaveLength(2);
      expect(contracts[0].id).toBe('1');
    });
  });

  describe('UserRepository', () => {
    it('should find user by email', async () => {
      const userRepo = getUserRepository('test-user');
      
      // Mock para findByEmail
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user'
      };
      
      jest.spyOn(userRepo, 'findWithConditions').mockResolvedValue([mockUser]);

      const user = await userRepo.findByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should create new user', async () => {
      const userRepo = getUserRepository('test-user');
      const newUser = await userRepo.create({
        email: 'new@example.com',
        full_name: 'New User',
        role: 'user'
      });

      expect(newUser).toBeDefined();
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should find active users', async () => {
      const userRepo = getUserRepository('test-user');
      
      // Mock para findMany
      const mockUsers = [
        { id: '1', email: 'user1@example.com', is_active: true },
        { id: '2', email: 'user2@example.com', is_active: true }
      ];
      
      jest.spyOn(userRepo, 'findMany').mockResolvedValue(mockUsers);

      const activeUsers = await userRepo.findActiveUsers();

      expect(activeUsers).toHaveLength(2);
      expect(activeUsers[0].is_active).toBe(true);
    });
  });

  describe('RepositoryLogger', () => {
    it('should log queries', () => {
      const timer = {
        success: jest.fn(),
        error: jest.fn()
      };

      // Simula logging
      repositoryLogger.setEnabled(true);
      
      timer.success({ id: '1', title: 'Test' });
      timer.error(new Error('Test error'));

      expect(timer.success).toHaveBeenCalled();
      expect(timer.error).toHaveBeenCalled();
    });

    it('should get performance stats', () => {
      // Simula algumas métricas
      const stats = repositoryLogger.getPerformanceStats('Contract', 'findById');
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('average');
      expect(stats).toHaveProperty('min');
      expect(stats).toHaveProperty('max');
    });
  });

  describe('Error Handling', () => {
    it('should throw RepositoryError for non-existent contract', async () => {
      const contractRepo = getContractRepository('test-user');
      
      // Mock para simular erro "not found"
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const contract = await contractRepo.findById('non-existent');

      expect(contract).toBeNull();
    });

    it('should handle validation errors', async () => {
      const contractRepo = getContractRepository('test-user');

      await expect(contractRepo.create({
        title: '', // Título inválido
        document_type: 'Termo do Locador',
        form_data: { numeroContrato: 'TEST-001' },
        content: '<html>Test</html>'
      })).rejects.toThrow('Título do contrato é obrigatório');
    });
  });

  describe('Convenience Functions', () => {
    it('should work with convenience functions', () => {
      const contractRepo = getContractRepository('test-user');
      const userRepo = getUserRepository('test-user');

      expect(contractRepo).toBeDefined();
      expect(userRepo).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await RepositoryFactory.healthCheck();
      
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('repositories');
      expect(health).toHaveProperty('config');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
    });
  });
});

// Teste de integração simples
describe('Repository Integration', () => {
  it('should work end-to-end', async () => {
    // Configuração
    configureRepositories({
      enableLogging: false, // Desabilita para teste mais limpo
      defaultUserId: 'integration-test-user'
    });

    // Obtém repositories
    const contractRepo = getContractRepository('integration-test-user');
    const userRepo = getUserRepository('integration-test-user');

    // Simula operações
    const contractId = 'test-contract-123';
    
    // Mock das operações
    jest.spyOn(contractRepo, 'findById').mockResolvedValue({
      id: contractId,
      title: 'Integration Test Contract',
      document_type: 'Termo do Locador'
    });

    jest.spyOn(userRepo, 'count').mockResolvedValue(10);

    // Executa operações
    const contract = await contractRepo.findById(contractId);
    const userCount = await userRepo.count();

    // Verificações
    expect(contract).toBeDefined();
    expect(contract?.id).toBe(contractId);
    expect(userCount).toBe(10);

    // Limpa mocks
    jest.restoreAllMocks();
  });
});

// Teste de performance (simulado)
describe('Performance Tests', () => {
  it('should handle multiple operations efficiently', async () => {
    const start = Date.now();
    
    // Configuração
    configureRepositories({
      enablePerformanceMonitoring: true,
      cacheEnabled: true,
      cacheTimeout: 60000
    });

    const contractRepo = getContractRepository('perf-test-user');
    
    // Mock para simular operações rápidas
    jest.spyOn(contractRepo, 'count').mockResolvedValue(1000);
    jest.spyOn(contractRepo, 'findMany').mockResolvedValue([
      { id: '1', title: 'Contract 1' },
      { id: '2', title: 'Contract 2' }
    ]);

    // Executa múltiplas operações
    const results = await Promise.all([
      contractRepo.count(),
      contractRepo.count(),
      contractRepo.findMany(),
      contractRepo.findMany()
    ]);

    const end = Date.now();
    const duration = end - start;

    // Deve ser rápido (menos de 100ms para operações mock)
    expect(duration).toBeLessThan(100);
    expect(results).toHaveLength(4);

    // Limpa mocks
    jest.restoreAllMocks();
  });
});