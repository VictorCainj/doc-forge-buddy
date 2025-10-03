// @ts-nocheck
/**
 * Utilitários de validação de dados robustos
 * Previne erros de parsing e validação de entrada
 */

export interface Contract {
  id: string;
  title: string;
  form_data: Record<string, string>;
  created_at: string;
  document_type: string;
}

/**
 * Faz parse seguro do form_data, evitando erros de JSON inválido
 * @param data Dados a serem parseados
 * @returns Objeto Record<string, string> ou objeto vazio em caso de erro
 */
export const parseFormDataSafely = (data: unknown): Record<string, string> => {
  try {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as Record<string, string>;
      }
    } else if (typeof data === 'object' && data !== null) {
      return data as Record<string, string>;
    }
  } catch {
    // console.warn('Erro ao fazer parse do form_data:', error);
  }
  return {};
};

/**
 * Valida se um contrato tem todos os campos obrigatórios
 * @param contract Dados do contrato a serem validados
 * @returns Contrato validado ou null se inválido
 */
export const validateContractData = (contract: unknown): Contract | null => {
  if (!contract || typeof contract !== 'object') {
    return null;
  }

  const requiredFields = ['id', 'title', 'created_at', 'document_type'];
  const hasRequiredFields = requiredFields.every(
    (field) => contract[field] !== undefined && contract[field] !== null
  );

  if (!hasRequiredFields) {
    // console.warn('Contrato inválido - campos obrigatórios ausentes:', contract);
    return null;
  }

  return {
    ...contract,
    form_data: parseFormDataSafely(contract.form_data),
  };
};

/**
 * Valida e filtra uma lista de contratos
 * @param contracts Lista de contratos a serem validados
 * @returns Lista de contratos válidos
 */
export const validateContractsList = (contracts: unknown[]): Contract[] => {
  if (!Array.isArray(contracts)) {
    return [];
  }

  return contracts
    .map(validateContractData)
    .filter((contract): contract is Contract => contract !== null);
};

/**
 * Valida se uma string é um email válido
 * @param email String a ser validada
 * @returns true se válido, false caso contrário
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se uma string é uma data válida
 * @param dateString String de data a ser validada
 * @returns true se válido, false caso contrário
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Sanitiza uma string removendo caracteres perigosos
 * @param input String a ser sanitizada
 * @returns String sanitizada
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres HTML perigosos
    .substring(0, 1000); // Limita tamanho
};
