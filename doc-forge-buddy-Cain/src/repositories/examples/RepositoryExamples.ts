/**
 * Exemplos de uso do Repository Pattern
 * Demonstra como usar os repositories na aplicação
 */

import {
  RepositoryFactory,
  RepositoryType,
  getContractRepository,
  getUserRepository,
  createRepositoryContext,
  configureRepositories,
  enableRepositoryLogging,
  type Contract,
  type UserProfile,
  type CreateContractData,
  type CreateUserPayload
} from '@/repositories';

// =============================================================================
// EXEMPLO 1: Configuração básica
// =============================================================================

export const exampleBasicSetup = async () => {
  // Configura o factory com opções
  configureRepositories({
    enableLogging: true,
    enablePerformanceMonitoring: true,
    defaultUserId: 'default-user-id',
    cacheEnabled: true,
    cacheTimeout: 600000 // 10 minutos
  });

  // Habilita logging
  enableRepositoryLogging(true);
};

// =============================================================================
// EXEMPLO 2: Uso básico de repositories
// =============================================================================

export const exampleBasicUsage = async (userId: string) => {
  // Método 1: Usando factory diretamente
  const contractRepo = RepositoryFactory.get(RepositoryType.CONTRACT, userId);
  const userRepo = RepositoryFactory.get(RepositoryType.USER, userId);

  // Buscar contrato por ID
  const contract = await contractRepo.findById('contract-123');
  console.log('Contract found:', contract);

  // Buscar usuário por email
  const user = await userRepo.findByEmail('user@example.com');
  console.log('User found:', user);

  // Criar novo contrato
  const newContract: CreateContractData = {
    title: 'Novo Contrato de Locação',
    document_type: 'Termo do Locador',
    form_data: {
      numeroContrato: 'CTR-2024-001',
      nomeLocatario: 'João da Silva',
      enderecoImovel: 'Rua das Flores, 123'
    },
    content: '<html>...</html>'
  };

  const createdContract = await contractRepo.create(newContract);
  console.log('Contract created:', createdContract);
};

// =============================================================================
// EXEMPLO 3: Usando convenience functions
// =============================================================================

export const exampleConvenienceFunctions = async (userId: string) => {
  // Método 2: Usando funções de conveniência
  const contractRepo = getContractRepository(userId);
  const userRepo = getUserRepository(userId);

  // Buscar contratos por status
  const activeContracts = await contractRepo.findByStatus('active');
  console.log('Active contracts:', activeContracts.length);

  // Buscar usuários administrativos
  const admins = await userRepo.findAdmins();
  console.log('Admin users:', admins.length);

  // Contar usuários ativos
  const activeUserCount = await userRepo.count({ is_active: true } as any);
  console.log('Active users:', activeUserCount);
};

// =============================================================================
// EXEMPLO 4: Usando contexto
// =============================================================================

export const exampleContextUsage = async (userId: string) => {
  // Método 3: Usando contexto
  const context = createRepositoryContext(userId);

  // Obter repositories específicos
  const contractRepo = context.getContractRepository();
  const userRepo = context.getUserRepository();
  const vistoriaRepo = context.getVistoriaRepository();

  // Obter todos de uma vez
  const { contract, user, vistoria, document, notification } = context.getAll();

  // Exemplo: Buscar contratos do usuário e suas vistorias
  const userContracts = await contractRepo.findByUserId(userId);
  const userVistorias = await vistoriaRepo.findByUserId(userId);

  console.log(`User ${userId} has ${userContracts.length} contracts and ${userVistorias.length} vistorias`);
};

// =============================================================================
// EXEMPLO 5: Operações complexas
// =============================================================================

export const exampleComplexOperations = async (userId: string) => {
  const contractRepo = getContractRepository(userId);
  const userRepo = getUserRepository(userId);

  // Busca com múltiplos filtros
  const filteredContracts = await contractRepo.findWithFilters({
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    page: 1,
    limit: 20
  });

  // Transação complexa: criar usuário e contrato associado
  const result = await contractRepo.transaction([
    async () => {
      // Criar usuário
      const userData: CreateUserPayload = {
        email: 'novo@usuario.com',
        full_name: 'Novo Usuário',
        role: 'user' as any
      };
      return await userRepo.create(userData);
    },
    async (createdUser) => {
      // Criar contrato associado ao usuário
      const contractData: CreateContractData = {
        title: 'Contrato do Novo Usuário',
        document_type: 'Termo do Locatário',
        form_data: {
          numeroContrato: 'CTR-2024-NEW',
          nomeLocatario: createdUser.full_name || 'Usuário',
          emailLocatario: createdUser.email
        },
        content: '<html>...</html>'
      };
      return await contractRepo.create(contractData);
    }
  ].map(fn => () => fn(null))); // Simplificado para este exemplo

  console.log('Transaction result:', result);
};

// =============================================================================
// EXEMPLO 6: Operações em lote
// =============================================================================

export const exampleBulkOperations = async (userId: string) => {
  const contractRepo = getContractRepository(userId);

  // Operações em lote
  const bulkResult = await contractRepo.bulkOperation('create', [
    {
      title: 'Contrato 1',
      document_type: 'Termo do Locador',
      form_data: { numeroContrato: 'BULK-001' },
      content: '<html>...</html>'
    },
    {
      title: 'Contrato 2',
      document_type: 'Termo do Locatário',
      form_data: { numeroContrato: 'BULK-002' },
      content: '<html>...</html>'
    }
  ]);

  console.log('Bulk create result:', {
    success: bulkResult.success.length,
    failed: bulkResult.failed.length
  });
};

// =============================================================================
// EXEMPLO 7: Monitoramento e estatísticas
// =============================================================================

export const exampleMonitoring = async () => {
  // Estatísticas dos repositories
  const stats = RepositoryFactory.getStats();
  console.log('Repository stats:', stats);

  // Health check
  const health = await RepositoryFactory.healthCheck();
  console.log('Repository health:', health);

  // Estatísticas específicas de performance
  const performance = repositoryLogger.getPerformanceStats('Contract', 'findById');
  console.log('Contract findById performance:', performance);

  // Logs recentes
  const recentLogs = repositoryLogger.getLogs({
    level: 'ERROR',
    fromDate: new Date(Date.now() - 3600000).toISOString() // Última hora
  });
  console.log('Recent error logs:', recentLogs.length);
};

// =============================================================================
// EXEMPLO 8: Tratamento de erros
// =============================================================================

export const exampleErrorHandling = async (userId: string) => {
  const contractRepo = getContractRepository(userId);

  try {
    // Tentar buscar contrato inexistente
    const contract = await contractRepo.findById('non-existent-id');
    
    if (!contract) {
      throw new Error('Contrato não encontrado');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erro esperado:', error.message);
    } else {
      console.error('Erro inesperado:', error);
    }
  }

  // Exemplo com validação
  try {
    await contractRepo.create({
      title: '', // Título inválido
      document_type: 'Termo do Locador',
      form_data: { numeroContrato: 'INVALID' },
      content: '<html>...</html>'
    });
  } catch (error) {
    console.error('Erro de validação:', error instanceof Error ? error.message : error);
  }
};

// =============================================================================
// EXEMPLO 9: Integração com hooks React
// =============================================================================

export const exampleReactIntegration = () => {
  // Exemplo de como seria usado em um hook React
  const useContractData = (userId: string) => {
    return {
      // Esta função seria usada dentro de um hook customizado
      fetchContracts: async () => {
        const contractRepo = getContractRepository(userId);
        return await contractRepo.findManyPaginated({}, 1, 10);
      },
      
      createContract: async (data: CreateContractData) => {
        const contractRepo = getContractRepository(userId);
        return await contractRepo.create(data);
      },
      
      updateContract: async (id: string, data: any) => {
        const contractRepo = getContractRepository(userId);
        return await contractRepo.update(id, data);
      }
    };
  };
};

// =============================================================================
// EXEMPLO 10: Demonstração completa
// =============================================================================

export const exampleCompleteDemo = async (userId: string) => {
  console.log('=== DEMO COMPLETO DO REPOSITORY PATTERN ===\n');

  // 1. Configuração
  configureRepositories({
    enableLogging: true,
    defaultUserId: userId
  });

  // 2. Contexto
  const context = createRepositoryContext(userId);
  const { contract, user } = context.getAll();

  // 3. Operações
  console.log('1. Buscando contratos ativos...');
  const activeContracts = await contract.findByStatus('active');
  console.log(`   Encontrados: ${activeContracts.length} contratos`);

  console.log('\n2. Criando novo usuário...');
  const newUser: CreateUserPayload = {
    email: 'demo@exemplo.com',
    full_name: 'Usuário Demo',
    role: 'user' as any
  };
  const createdUser = await user.create(newUser);
  console.log(`   Usuário criado: ${createdUser.full_name}`);

  console.log('\n3. Criando contrato para o usuário...');
  const contractData: CreateContractData = {
    title: 'Contrato Demo',
    document_type: 'Termo do Locatário',
    form_data: {
      numeroContrato: 'DEMO-001',
      nomeLocatario: createdUser.full_name || 'Demo User',
      emailLocatario: createdUser.email
    },
    content: '<html><body>Contrato demo</body></html>'
  };
  const createdContract = await contract.create(contractData);
  console.log(`   Contrato criado: ${createdContract.title}`);

  console.log('\n4. Estatísticas finais...');
  const finalStats = await contract.getStats();
  console.log(`   Total de contratos: ${finalStats.total}`);
  console.log(`   Por status:`, finalStats.byStatus);

  console.log('\n=== DEMO CONCLUÍDO ===');
};

// =============================================================================
// EXECUÇÃO DOS EXEMPLOS
// =============================================================================

// Descomente para executar exemplos específicos
/*
// Executar demo completo
exampleCompleteDemo('demo-user-id').catch(console.error);

// Testar configurações
exampleBasicSetup().catch(console.error);

// Testar operações básicas
exampleBasicUsage('user-123').catch(console.error);

// Testar conveniência
exampleConvenienceFunctions('user-123').catch(console.error);

// Testar contexto
exampleContextUsage('user-123').catch(console.error);

// Testar operações complexas
exampleComplexOperations('user-123').catch(console.error);

// Testar operações em lote
exampleBulkOperations('user-123').catch(console.error);

// Testar monitoramento
exampleMonitoring().catch(console.error);

// Testar tratamento de erros
exampleErrorHandling('user-123').catch(console.error);
*/