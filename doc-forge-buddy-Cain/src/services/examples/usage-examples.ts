/**
 * Exemplos de uso dos Services Layer
 * Demonstra como usar os services implementados na prática
 */

import { 
  createContractService, 
  createNotificationService, 
  createValidationService, 
  createEventBus,
  ServiceContainer,
  CONTRACT_SERVICE_EVENTS 
} from '../index';
import { ContractFormData, DocumentType } from '@/types/domain/contract';

// === Exemplos básicos de uso ===

/**
 * Exemplo 1: Uso básico do ContractService
 */
export async function exemploUsoContratoBasico() {
  const contractService = createContractService();
  
  try {
    // Criar novo contrato
    const novoContrato = await contractService.create({
      title: 'Contrato de Locação 001',
      form_data: {
        numeroContrato: 'LOC-2024-001',
        nomeLocatario: 'João da Silva',
        enderecoImovel: 'Rua das Flores, 123, Centro, São Paulo/SP',
        dataFirmamentoContrato: '2024-01-01',
        dataTerminoRescisao: '2024-12-31',
        emailLocatario: 'joao@email.com',
        celularLocatario: '(11) 99999-9999',
        tipoGarantia: 'fiador',
        nomeFiador: 'Maria da Silva',
        observacao: 'Contrato teste para demonstração'
      },
      document_type: 'Termo do Locador' as DocumentType,
      content: 'Conteúdo do contrato...'
    });

    console.log('Contrato criado:', novoContrato);

    // Buscar contrato por ID
    const contratoBuscado = await contractService.findById(novoContrato.id);
    console.log('Contrato encontrado:', contratoBuscado);

    // Atualizar dados
    const contratoAtualizado = await contractService.update(novoContrato.id, {
      form_data: {
        ...novoContrato.form_data,
        observacao: 'Contrato atualizado com observações adicionais'
      }
    });

    console.log('Contrato atualizado:', contratoAtualizado);

  } catch (error) {
    console.error('Erro no exemplo básico:', error);
  }
}

/**
 * Exemplo 2: Uso com validação
 */
export async function exemploUsoComValidacao() {
  const contractService = createContractService();
  const validationService = createValidationService();

  const dadosContrato: ContractFormData = {
    numeroContrato: 'LOC-2024-002',
    nomeLocatario: 'Ana Santos',
    enderecoImovel: 'Av. Paulista, 1000, Bela Vista, São Paulo/SP',
    dataFirmamentoContrato: '2024-02-01',
    dataTerminoRescisao: '2024-02-28', // Data inválida (muito curta)
    emailLocatario: 'ana@email', // Email inválido
    celularLocatario: '11999999999', // Formato inválido
    tipoGarantia: 'fiador'
  };

  // Validar dados antes de criar
  const validacao = validationService.validateContractFormData(dadosContrato);
  
  if (!validacao.isValid) {
    console.log('Erros de validação:', validacao.errors);
    console.log('Avisos:', validacao.warnings);
    console.log('Sugestões:', validacao.suggestions);
    return;
  }

  // Se válido, criar contrato
  try {
    const contrato = await contractService.create({
      title: 'Contrato Validação',
      form_data: dadosContrato,
      document_type: 'Termo do Locatário' as DocumentType,
      content: 'Conteúdo do contrato...'
    });
    
    console.log('Contrato criado com validação:', contrato);
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
  }
}

/**
 * Exemplo 3: Renovação de contrato
 */
export async function exemploRenovacaoContrato() {
  const contractService = createContractService();

  try {
    // Primeiro, criar um contrato
    const contrato = await contractService.create({
      title: 'Contrato para Renovação',
      form_data: {
        numeroContrato: 'RENOV-2024-001',
        nomeLocatario: 'Carlos Oliveira',
        enderecoImovel: 'Rua da Paz, 456, Vila Madalena, São Paulo/SP',
        dataFirmamentoContrato: '2023-01-01',
        dataTerminoRescisao: '2024-01-01',
        emailLocatario: 'carlos@email.com'
      },
      document_type: 'Termo do Locador' as DocumentType,
      content: 'Conteúdo do contrato...'
    });

    // Verificar se pode renovar
    const podeRenovar = await contractService.canRenewContract(contrato.id);
    console.log('Pode renovar contrato:', podeRenovar);

    if (podeRenovar.canRenew) {
      // Renovar contrato
      const contratoRenovado = await contractService.renewContract(contrato.id, {
        newEndDate: '2025-01-01',
        newStartDate: '2024-01-01',
        renewalReason: 'Renovação anual',
        updatedTerms: {
          observacao: 'Contrato renovado por mais 1 ano'
        }
      });

      console.log('Contrato renovado:', contratoRenovado);
    }

  } catch (error) {
    console.error('Erro na renovação:', error);
  }
}

/**
 * Exemplo 4: Terminação de contrato
 */
export async function exemploTerminacaoContrato() {
  const contractService = createContractService();

  try {
    // Criar contrato
    const contrato = await contractService.create({
      title: 'Contrato para Terminação',
      form_data: {
        numeroContrato: 'TERM-2024-001',
        nomeLocatario: 'Pedro Almeida',
        enderecoImovel: 'Rua dos Bobos, 0, Centro, São Paulo/SP',
        dataFirmamentoContrato: '2023-06-01',
        dataTerminoRescisao: '2024-06-01',
        emailLocatario: 'pedro@email.com'
      },
      document_type: 'Termo do Locatário' as DocumentType,
      content: 'Conteúdo do contrato...'
    });

    // Verificar se pode terminar
    const podeTerminar = await contractService.canTerminateContract(contrato.id);
    console.log('Pode terminar contrato:', podeTerminar);

    if (podeTerminar.canTerminate) {
      // Terminar contrato
      const contratoTerminado = await contractService.terminateContract(contrato.id, {
        terminationDate: '2024-03-01',
        reason: 'Rescisão por descumprimento de contrato',
        terminationType: 'breach',
        propertyCondition: 'good',
        damagesAmount: 0,
        returnDate: '2024-03-01'
      });

      console.log('Contrato terminado:', contratoTerminado);
    }

  } catch (error) {
    console.error('Erro na terminação:', error);
  }
}

/**
 * Exemplo 5: Métricas e analytics
 */
export async function exemploMétricasContratos() {
  const contractService = createContractService();

  try {
    // Calcular métricas globais
    const metricas = await contractService.calculateGlobalMetrics({
      status: 'active' // Filtrar apenas contratos ativos
    });

    console.log('Métricas globais:', metricas);

    // Gerar relatório
    const relatorio = await contractService.generateReport('analytics', {
      status: 'active'
    });

    console.log('Relatório de analytics:', relatorio);

    // Buscar contratos que precisam de atenção
    const contratosAtencao = await contractService.getContractsNeedingAttention();
    console.log('Contratos que precisam de atenção:', contratosAtencao);

  } catch (error) {
    console.error('Erro ao calcular métricas:', error);
  }
}

/**
 * Exemplo 6: Buscas e filtros avançados
 */
export async function exemploBuscaAvancada() {
  const contractService = createContractService();

  try {
    // Busca textual
    const resultadoBusca = await contractService.searchContracts('João Silva', {
      status: 'active',
      dateRange: {
        start: '2024-01-01',
        end: '2024-12-31'
      }
    });

    console.log('Resultado da busca:', resultadoBusca);

    // Contratos por propriedade
    const contratosPorPropriedade = await contractService.getContractsByProperty(
      'prop-123',
      { status: 'active' },
      { limit: 10, page: 1 }
    );

    console.log('Contratos por propriedade:', contratosPorPropriedade);

    // Contratos relacionados
    const primeiroContrato = await contractService.findMany({ limit: 1 });
    if (primeiroContrato.length > 0) {
      const relacionados = await contractService.findRelatedContracts(
        primeiroContrato[0].id,
        'client'
      );
      console.log('Contratos relacionados (mesmo cliente):', relacionados);
    }

  } catch (error) {
    console.error('Erro na busca avançada:', error);
  }
}

/**
 * Exemplo 7: Operações em lote
 */
export async function exemploOperacoesLote() {
  const contractService = createContractService();

  try {
    // Criar alguns contratos para teste
    const idsContratos: string[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const contrato = await contractService.create({
        title: `Contrato Lote ${i}`,
        form_data: {
          numeroContrato: `LOTE-2024-${i.toString().padStart(3, '0')}`,
          nomeLocatario: `Cliente ${i}`,
          enderecoImovel: `Rua ${i}, ${i}00, São Paulo/SP`,
          dataFirmamentoContrato: '2024-01-01',
          dataTerminoRescisao: '2024-12-31',
          emailLocatario: `cliente${i}@email.com`
        },
        document_type: 'Termo do Locador' as DocumentType,
        content: 'Conteúdo do contrato...'
      });
      
      idsContratos.push(contrato.id);
    }

    // Operações em lote
    const resultadoLote = await contractService.bulkOperation(
      'update_status',
      idsContratos.slice(0, 3), // Apenas os 3 primeiros
      'cancelled' as any
    );

    console.log('Resultado operação em lote:', resultadoLote);

    // Adicionar tags em lote
    const resultadoTags = await contractService.bulkOperation(
      'add_tags',
      idsContratos,
      { tagName: 'Importante', color: '#ff0000' }
    );

    console.log('Resultado adição de tags:', resultadoTags);

  } catch (error) {
    console.error('Erro nas operações em lote:', error);
  }
}

// === Exemplos com EventBus ===

/**
 * Exemplo 8: Usando EventBus
 */
export async function exemploEventBus() {
  const eventBus = createEventBus();
  const contractService = createContractService();

  // Registrar listener para eventos de contrato
  eventBus.on(CONTRACT_SERVICE_EVENTS.CREATED, (event) => {
    console.log('Contrato criado!', event);
  });

  eventBus.on(CONTRACT_SERVICE_EVENTS.RENEWED, (event) => {
    console.log('Contrato renovado!', event);
  });

  // Agora, quando criamos um contrato, o evento será disparado automaticamente
  // (o ContractService já emite eventos internamente)

  const contrato = await contractService.create({
    title: 'Contrato com EventBus',
    form_data: {
      numeroContrato: 'EVENT-2024-001',
      nomeLocatario: 'Maria Evento',
      enderecoImovel: 'Rua dos Eventos, 999, São Paulo/SP',
      dataFirmamentoContrato: '2024-01-01',
      dataTerminoRescisao: '2024-12-31'
    },
    document_type: 'Termo do Locador' as DocumentType,
    content: 'Conteúdo do contrato...'
  });

  console.log('Contrato com eventos criado:', contrato);
}

// === Exemplos com ServiceContainer ===

/**
 * Exemplo 9: Usando ServiceContainer
 */
export async function exemploServiceContainer() {
  const container = new ServiceContainer();

  // Registrar services
  container.registerSingleton('ContractService', createContractService);
  container.registerSingleton('NotificationService', createNotificationService);
  container.registerSingleton('ValidationService', createValidationService);
  container.registerSingleton('EventBus', createEventBus);

  // Inicializar container
  container.initialize();

  // Resolver services
  const contractService = container.get('ContractService');
  const notificationService = container.get('NotificationService');

  // Usar services
  try {
    const contrato = await contractService.create({
      title: 'Contrato via Container',
      form_data: {
        numeroContrato: 'CONTAINER-2024-001',
        nomeLocatario: 'Pedro Container',
        enderecoImovel: 'Rua Container, 123, São Paulo/SP',
        dataFirmamentoContrato: '2024-01-01',
        dataTerminoRescisao: '2024-12-31'
      },
      document_type: 'Termo do Locador' as DocumentType,
      content: 'Conteúdo do contrato...'
    });

    // Usar notification service
    await notificationService.notifyContractCreated(contrato);

    console.log('Contrato criado via container:', contrato);

  } catch (error) {
    console.error('Erro com container:', error);
  } finally {
    // Cleanup
    container.dispose();
  }
}

// === Exemplos com Error Handling ===

/**
 * Exemplo 10: Tratamento de erros
 */
export async function exemploTratamentoErros() {
  const contractService = createContractService();
  const notificationService = createNotificationService();

  // Callbacks para tratamento de erros
  const callbacks = {
    onSuccess: (operation: string, data?: any) => {
      console.log(`Operação ${operation} realizada com sucesso:`, data);
    },
    onError: (operation: string, error: Error) => {
      console.error(`Erro na operação ${operation}:`, error);
      
      // Notificar erro
      notificationService.notifyError(error, {
        operation,
        timestamp: new Date().toISOString()
      });
    },
    onStart: (operation: string) => {
      console.log(`Iniciando operação ${operation}...`);
    },
    onComplete: (operation: string) => {
      console.log(`Operação ${operation} completada`);
    }
  };

  try {
    // Tentar criar contrato inválido para testar erro
    await contractService.create({
      title: '',
      form_data: {
        numeroContrato: '', // Campo obrigatório vazio
        nomeLocatario: '',
        enderecoImovel: ''
      },
      document_type: 'Termo do Locador' as DocumentType,
      content: ''
    }, callbacks);

  } catch (error) {
    console.error('Erro capturado:', error);
  }
}

// === Função para executar todos os exemplos ===

/**
 * Executa todos os exemplos em sequência
 */
export async function executarTodosExemplos() {
  console.log('=== Início dos Exemplos de Services Layer ===\n');

  console.log('1. Exemplo básico...');
  await exemploUsoContratoBasico();

  console.log('\n2. Exemplo com validação...');
  await exemploUsoComValidacao();

  console.log('\n3. Exemplo de renovação...');
  await exemploRenovacaoContrato();

  console.log('\n4. Exemplo de terminação...');
  await exemploTerminacaoContrato();

  console.log('\n5. Exemplo de métricas...');
  await exemploMétricasContratos();

  console.log('\n6. Exemplo de busca avançada...');
  await exemploBuscaAvancada();

  console.log('\n7. Exemplo de operações em lote...');
  await exemploOperacoesLote();

  console.log('\n8. Exemplo EventBus...');
  await exemploEventBus();

  console.log('\n9. Exemplo ServiceContainer...');
  await exemploServiceContainer();

  console.log('\n10. Exemplo tratamento de erros...');
  await exemploTratamentoErros();

  console.log('\n=== Todos os exemplos executados ===');
}

// Exemplo de uso em um componente React
export function ExemploComponentReact() {
  // Este é um exemplo de como usar os services em um componente React
  
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractService = useContractService();
  const notificationService = useNotificationService();

  const carregarContratos = useCallback(async () => {
    if (!contractService) return;

    setLoading(true);
    setError(null);

    try {
      const result = await contractService.findManyPaginated(
        { status: 'active' },
        { limit: 10, page: 1 }
      );
      setContratos(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      if (notificationService) {
        await notificationService.notifyError(err as Error, {
          component: 'ExemploComponentReact',
          action: 'carregarContratos'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [contractService, notificationService]);

  useEffect(() => {
    carregarContratos();
  }, [carregarContratos]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h2>Lista de Contratos</h2>
      {contratos.map((contrato) => (
        <div key={contrato.id}>
          <h3>{contrato.form_data.numeroContrato}</h3>
          <p>Cliente: {contrato.form_data.nomeLocatario}</p>
          <p>Status: {contrato.status}</p>
        </div>
      ))}
    </div>
  );
}

// Para uso em desenvolvimento - descomente para testar
// executarTodosExemplos();