/**
 * Sistema de Validação de Dados
 * Valida diferentes tipos de dados para garantir integridade
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida CPF (Cadastro de Pessoa Física)
 */
export function validateCPF(cpf: string): ValidationResult {
  const errors: string[] = [];

  // Remover formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  // Verificar se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    errors.push('CPF deve conter 11 dígitos');
    return { isValid: false, errors };
  }

  // Verificar se não são todos dígitos iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }

  // Validar dígitos verificadores
  let sum = 0;
  let remainder;

  // Validar primeiro dígito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }

  // Validar segundo dígito
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
    errors.push('CPF inválido');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida CNPJ (Cadastro Nacional da Pessoa Jurídica)
 */
export function validateCNPJ(cnpj: string): ValidationResult {
  const errors: string[] = [];

  // Remover formatação
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

  // Verificar se tem 14 dígitos
  if (cleanCNPJ.length !== 14) {
    errors.push('CNPJ deve conter 14 dígitos');
    return { isValid: false, errors };
  }

  // Verificar se não são todos dígitos iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    errors.push('CNPJ inválido');
    return { isValid: false, errors };
  }

  // Validar dígitos verificadores
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    errors.push('CNPJ inválido');
    return { isValid: false, errors };
  }

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    errors.push('CNPJ inválido');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida número de telefone brasileiro
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];

  // Remover formatação
  const cleanPhone = phone.replace(/[^\d]/g, '');

  // Verificar comprimento (10 ou 11 dígitos)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    errors.push('Telefone deve conter 10 ou 11 dígitos (com DDD)');
    return { isValid: false, errors };
  }

  // Verificar se DDD é válido (11 a 99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    errors.push('DDD inválido');
    return { isValid: false, errors };
  }

  // Verificar se o primeiro dígito do número é válido
  const firstDigit = parseInt(cleanPhone.charAt(2));
  if (cleanPhone.length === 11 && firstDigit !== 9) {
    errors.push('Para celular, o terceiro dígito deve ser 9');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida CEP (Código de Endereçamento Postal)
 */
export function validateCEP(cep: string): ValidationResult {
  const errors: string[] = [];

  // Remover formatação
  const cleanCEP = cep.replace(/[^\d]/g, '');

  // Verificar se tem 8 dígitos
  if (cleanCEP.length !== 8) {
    errors.push('CEP deve conter 8 dígitos');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    errors.push('Email inválido');
    return { isValid: false, errors };
  }

  // Verificar comprimento
  if (email.length > 254) {
    errors.push('Email muito longo');
    return { isValid: false, errors };
  }

  // Verificar parte local (antes do @)
  const [localPart, _domain] = email.split('@');
  if (localPart.length > 64) {
    errors.push('Parte local do email muito longa');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida URL
 */
export function validateURL(url: string): ValidationResult {
  const errors: string[] = [];

  try {
    new URL(url);
    return { isValid: true, errors: [] };
  } catch {
    errors.push('URL inválida');
    return { isValid: false, errors };
  }
}

/**
 * Valida data no formato brasileiro (DD/MM/YYYY)
 */
export function validateDate(date: string): ValidationResult {
  const errors: string[] = [];

  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = date.match(dateRegex);

  if (!match) {
    errors.push('Data deve estar no formato DD/MM/YYYY');
    return { isValid: false, errors };
  }

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);

  // Verificar mês
  if (month < 1 || month > 12) {
    errors.push('Mês inválido');
    return { isValid: false, errors };
  }

  // Verificar dia
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    errors.push('Dia inválido para o mês especificado');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Valida se a data é futura
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > new Date().getTime();
}

/**
 * Valida se a data é passada
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < new Date().getTime();
}

/**
 * Valida range de datas
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date
): ValidationResult {
  const errors: string[] = [];

  if (startDate >= endDate) {
    errors.push('Data inicial deve ser anterior à data final');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida campo obrigatório
 */
export function validateRequired(
  value: any,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];

  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} é obrigatório`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida comprimento mínimo
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];

  if (value.length < minLength) {
    errors.push(`${fieldName} deve ter no mínimo ${minLength} caracteres`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida comprimento máximo
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];

  if (value.length > maxLength) {
    errors.push(`${fieldName} deve ter no máximo ${maxLength} caracteres`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida número dentro de um range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];

  if (value < min || value > max) {
    errors.push(`${fieldName} deve estar entre ${min} e ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formata CPF
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/[^\d]/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/[^\d]/g, '');
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/[^\d]/g, '');

  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

/**
 * Formata CEP
 */
export function formatCEP(cep: string): string {
  const clean = cep.replace(/[^\d]/g, '');
  return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
}
