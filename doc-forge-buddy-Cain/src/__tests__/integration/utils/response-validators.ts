// Validadores para garantir que as respostas das APIs estão no formato correto

export interface ContractValidation {
  id: string;
  contractNumber: string;
  clientName: string;
  property: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalValue: number;
  paidValue: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractsListResponseValidation {
  contracts: ContractValidation[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface UserValidation {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    role?: string;
  };
}

export interface AuthResponseValidation {
  user: UserValidation;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

// Validador de contrato
export const validateContract = (contract: any): contract is ContractValidation => {
  const requiredFields = [
    'id', 'contractNumber', 'clientName', 'property', 'status',
    'startDate', 'endDate', 'totalValue', 'paidValue', 'dueDate',
    'createdAt', 'updatedAt'
  ];

  // Verificar se todos os campos obrigatórios existem
  for (const field of requiredFields) {
    if (!(field in contract)) {
      throw new Error(`Campo obrigatório ausente: ${field}`);
    }
  }

  // Validar tipos
  if (typeof contract.id !== 'string') {
    throw new Error('ID deve ser string');
  }

  if (typeof contract.contractNumber !== 'string') {
    throw new Error('contractNumber deve ser string');
  }

  if (typeof contract.clientName !== 'string') {
    throw new Error('clientName deve ser string');
  }

  if (typeof contract.property !== 'string') {
    throw new Error('property deve ser string');
  }

  if (!['active', 'pending', 'completed', 'cancelled'].includes(contract.status)) {
    throw new Error('status deve ser um dos valores: active, pending, completed, cancelled');
  }

  if (typeof contract.startDate !== 'string') {
    throw new Error('startDate deve ser string');
  }

  if (typeof contract.endDate !== 'string') {
    throw new Error('endDate deve ser string');
  }

  if (typeof contract.totalValue !== 'number') {
    throw new Error('totalValue deve ser number');
  }

  if (typeof contract.paidValue !== 'number') {
    throw new Error('paidValue deve ser number');
  }

  if (typeof contract.dueDate !== 'string') {
    throw new Error('dueDate deve ser string');
  }

  if (typeof contract.createdAt !== 'string') {
    throw new Error('createdAt deve ser string');
  }

  if (typeof contract.updatedAt !== 'string') {
    throw new Error('updatedAt deve ser string');
  }

  // Validar se as datas são válidas
  if (isNaN(Date.parse(contract.startDate))) {
    throw new Error('startDate deve ser uma data válida');
  }

  if (isNaN(Date.parse(contract.endDate))) {
    throw new Error('endDate deve ser uma data válida');
  }

  if (isNaN(Date.parse(contract.dueDate))) {
    throw new Error('dueDate deve ser uma data válida');
  }

  // Validar valores numéricos
  if (contract.totalValue < 0) {
    throw new Error('totalValue deve ser maior ou igual a zero');
  }

  if (contract.paidValue < 0) {
    throw new Error('paidValue deve ser maior ou igual a zero');
  }

  if (contract.paidValue > contract.totalValue) {
    throw new Error('paidValue não pode ser maior que totalValue');
  }

  return true;
};

// Validador de lista de contratos
export const validateContractsList = (response: any): response is ContractsListResponseValidation => {
  if (!response || typeof response !== 'object') {
    throw new Error('Resposta deve ser um objeto');
  }

  if (!Array.isArray(response.contracts)) {
    throw new Error('contracts deve ser um array');
  }

  if (typeof response.total !== 'number') {
    throw new Error('total deve ser um número');
  }

  if (typeof response.page !== 'number') {
    throw new Error('page deve ser um número');
  }

  if (typeof response.hasMore !== 'boolean') {
    throw new Error('hasMore deve ser um boolean');
  }

  // Validar cada contrato na lista
  response.contracts.forEach((contract: any, index: number) => {
    try {
      validateContract(contract);
    } catch (error) {
      throw new Error(`Erro no contrato na posição ${index}: ${error.message}`);
    }
  });

  return true;
};

// Validador de resposta de autenticação
export const validateAuthResponse = (response: any): response is AuthResponseValidation => {
  if (!response || typeof response !== 'object') {
    throw new Error('Resposta deve ser um objeto');
  }

  if (!response.user || typeof response.user !== 'object') {
    throw new Error('user deve ser um objeto');
  }

  if (typeof response.user.id !== 'string') {
    throw new Error('user.id deve ser string');
  }

  if (typeof response.user.email !== 'string') {
    throw new Error('user.email deve ser string');
  }

  if (!response.session || typeof response.session !== 'object') {
    throw new Error('session deve ser um objeto');
  }

  if (typeof response.session.access_token !== 'string') {
    throw new Error('session.access_token deve ser string');
  }

  if (typeof response.session.refresh_token !== 'string') {
    throw new Error('session.refresh_token deve ser string');
  }

  if (typeof response.session.expires_in !== 'number') {
    throw new Error('session.expires_in deve ser number');
  }

  return true;
};

// Validador de erro de API
export const validateApiError = (error: any): boolean => {
  if (!error || typeof error !== 'object') {
    throw new Error('Erro deve ser um objeto');
  }

  if (!error.error || typeof error.error !== 'object') {
    throw new Error('Erro deve ter estrutura { error: { message: string } }');
  }

  if (typeof error.error.message !== 'string') {
    throw new Error('error.message deve ser string');
  }

  return true;
};

// Função utilitária para validar qualquer resposta de API
export const validateApiResponse = <T>(
  response: any,
  validator: (response: any) => response is T
): response is T => {
  return validator(response);
};

// Função para validar dados antes de assertions
export const expectValidContract = (contract: any) => {
  expect(() => validateContract(contract)).not.toThrow();
};

export const expectValidContractsList = (response: any) => {
  expect(() => validateContractsList(response)).not.toThrow();
};

export const expectValidAuthResponse = (response: any) => {
  expect(() => validateAuthResponse(response)).not.toThrow();
};

export const expectValidApiError = (error: any) => {
  expect(() => validateApiError(error)).not.toThrow();
};