/**
 * Módulo de validação de dados
 * Validação de email, telefone e outros campos
 */

import validator from 'validator';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  value?: any;
}

/**
 * Validação de email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  if (!email || typeof email !== 'string') {
    errors.push('Email é obrigatório');
    isValid = false;
  } else {
    // Verificar formato
    if (!validator.isEmail(email)) {
      errors.push('Formato de email inválido');
      isValid = false;
    }

    // Verificar comprimento
    if (email.length < 5 || email.length > 254) {
      errors.push('Email deve ter entre 5 e 254 caracteres');
      isValid = false;
    }

    // Verificar domínios perigosos
    const dangerousDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'tempmail.org',
      'yopmail.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && dangerousDomains.includes(domain)) {
      errors.push('Domínio de email não permitido');
      isValid = false;
    }
  }

  return {
    isValid,
    errors,
    value: isValid ? email.toLowerCase().trim() : email
  };
}

/**
 * Validação de telefone brasileiro
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  if (!phone || typeof phone !== 'string') {
    errors.push('Telefone é obrigatório');
    isValid = false;
  } else {
    // Remover formatação
    const cleanPhone = phone.replace(/\D/g, '');

    // Verificar se tem 10 ou 11 dígitos
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
      isValid = false;
    }

    // Verificar se começa com código de área válido
    const areaCodes = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '86', '89', // PI
      '84', // RN
      '85', '88', // CE
      '91', '93', '94', // PA
      '92', '97', // AM
      '96', // AP
      '98', '99' // MA
    ];

    const areaCode = cleanPhone.substring(0, 2);
    if (!areaCodes.includes(areaCode)) {
      errors.push('Código de área inválido');
      isValid = false;
    }
  }

  return {
    isValid,
    errors,
    value: isValid ? phone.replace(/\D/g, '') : phone
  };
}

/**
 * Validação de CPF
 */
export function validateCPF(cpf: string): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  if (!cpf || typeof cpf !== 'string') {
    errors.push('CPF é obrigatório');
    isValid = false;
  } else {
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      errors.push('CPF deve ter 11 dígitos');
      isValid = false;
    }

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      errors.push('CPF inválido');
      isValid = false;
    }

    // Validar dígitos verificadores
    if (isValid && !validateCpfDigits(cleanCpf)) {
      errors.push('CPF inválido');
      isValid = false;
    }
  }

  return {
    isValid,
    errors,
    value: isValid ? cpf.replace(/\D/g, '') : cpf
  };
}

/**
 * Validação de CNPJ
 */
export function validateCNPJ(cnpj: string): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  if (!cnpj || typeof cnpj !== 'string') {
    errors.push('CNPJ é obrigatório');
    isValid = false;
  } else {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      errors.push('CNPJ deve ter 14 dígitos');
      isValid = false;
    }

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) {
      errors.push('CNPJ inválido');
      isValid = false;
    }

    // Validar dígitos verificadores
    if (isValid && !validateCnpjDigits(cleanCnpj)) {
      errors.push('CNPJ inválido');
      isValid = false;
    }
  }

  return {
    isValid,
    errors,
    value: isValid ? cnpj.replace(/\D/g, '') : cnpj
  };
}

/**
 * Validação de senha
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  if (!password || typeof password !== 'string') {
    errors.push('Senha é obrigatória');
    isValid = false;
  } else {
    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
      isValid = false;
    }

    if (password.length > 128) {
      errors.push('Senha deve ter no máximo 128 caracteres');
      isValid = false;
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
      isValid = false;
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
      isValid = false;
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
      isValid = false;
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
      isValid = false;
    }
  }

  return {
    isValid,
    errors
  };
}

/**
 * Validação de ID (UUID ou numérico)
 */
export function validateId(id: string | number): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  if (id === null || id === undefined) {
    errors.push('ID é obrigatório');
    isValid = false;
  } else if (typeof id === 'string') {
    if (!validator.isUUID(id) && !validator.isNumeric(id)) {
      errors.push('ID deve ser um UUID válido ou número');
      isValid = false;
    }
  } else if (typeof id === 'number') {
    if (!Number.isInteger(id) || id <= 0) {
      errors.push('ID deve ser um número inteiro positivo');
      isValid = false;
    }
  } else {
    errors.push('ID deve ser string ou número');
    isValid = false;
  }

  return {
    isValid,
    errors,
    value: id
  };
}

/**
 * Validação de data
 */
export function validateDate(date: string | Date): ValidationResult {
  const errors: string[] = [];
  let isValid = true;
  let parsedDate: Date;

  if (!date) {
    errors.push('Data é obrigatória');
    isValid = false;
  } else {
    try {
      if (typeof date === 'string') {
        parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          errors.push('Data inválida');
          isValid = false;
        }
      } else if (date instanceof Date) {
        parsedDate = date;
        if (isNaN(parsedDate.getTime())) {
          errors.push('Data inválida');
          isValid = false;
        }
      } else {
        errors.push('Data deve ser string ou Date');
        isValid = false;
      }
    } catch (error) {
      errors.push('Data inválida');
      isValid = false;
    }
  }

  return {
    isValid,
    errors,
    value: isValid ? parsedDate : date
  };
}

/**
 * Validar dígitos verificadores do CPF
 */
function validateCpfDigits(cpf: string): boolean {
  let sum = 0;
  let remainder;

  // Primeiro dígito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  // Segundo dígito
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

/**
 * Validar dígitos verificadores do CNPJ
 */
function validateCnpjDigits(cnpj: string): boolean {
  let sum = 0;
  let remainder;

  // Primeiro dígito
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.substring(i, i + 1)) * weights1[i];
  }
  remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cnpj.substring(12, 13))) return false;

  // Segundo dígito
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.substring(i, i + 1)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cnpj.substring(13, 14))) return false;

  return true;
}

/**
 * Validação de campos obrigatórios
 */
export function validateRequiredFields(data: any, requiredFields: string[]): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`Campo ${field} é obrigatório`);
      isValid = false;
    }
  }

  return {
    isValid,
    errors
  };
}
