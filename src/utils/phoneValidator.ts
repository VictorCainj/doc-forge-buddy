/**
 * Utilitários para validação e formatação de números de telefone
 * Validação flexível que aceita diferentes formatos brasileiros
 */

/**
 * Valida se um número de telefone é válido
 * @param phone Número de telefone a ser validado
 * @returns Mensagem de erro ou null se válido
 */
export const validatePhoneNumber = (phone: string): string | null => {
  if (!phone || phone.trim() === '') {
    return null;
  }

  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');

  // Verifica se tem 10 ou 11 dígitos (com DDD)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return 'Telefone deve ter 10 ou 11 dígitos (com DDD)';
  }

  // Verifica se o DDD é válido (11-99)
  const ddd = cleanPhone.substring(0, 2);
  const dddNumber = parseInt(ddd);
  if (dddNumber < 11 || dddNumber > 99) {
    return 'DDD inválido';
  }

  // Verifica se o número não é uma sequência repetida
  if (/^(\d)\1{9,10}$/.test(cleanPhone)) {
    return 'Número de telefone inválido';
  }

  return null;
};

/**
 * Formata um número de telefone no padrão brasileiro
 * @param phone Número de telefone a ser formatado
 * @returns Número formatado
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
};

/**
 * Remove formatação de um número de telefone
 * @param phone Número formatado
 * @returns Número apenas com dígitos
 */
export const unformatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Máscara para input de telefone
 * @param value Valor atual do input
 * @returns Valor com máscara aplicada
 */
export const applyPhoneMask = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');

  if (cleanValue.length <= 2) {
    return cleanValue;
  } else if (cleanValue.length <= 7) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
  } else if (cleanValue.length <= 11) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7)}`;
  }

  return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
};

/**
 * Validação personalizada para React Hook Form
 * @param value Valor a ser validado
 * @returns Mensagem de erro ou true se válido
 */
export const phoneValidation = (value: string): string | boolean => {
  const error = validatePhoneNumber(value);
  return error || true;
};
