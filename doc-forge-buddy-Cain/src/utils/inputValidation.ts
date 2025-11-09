/**
 * Validadores de inputs específicos para dados brasileiros
 */

import { z } from 'zod';

/**
 * Validação de CPF
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;

  return true;
};

/**
 * Validação de CNPJ
 */
export const validateCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ[13])) return false;

  return true;
};

/**
 * Validação de email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validação de telefone brasileiro
 */
export const validatePhone = (phone: string): boolean => {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');

  // Verifica se tem 10 ou 11 dígitos
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;

  return true;
};

/**
 * Validação de CEP
 */
export const validateCEP = (cep: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/\D/g, '');

  // Verifica se tem 8 dígitos
  if (cleanCEP.length !== 8) return false;

  // Verifica se não são todos iguais
  if (/^(\d)\1{7}$/.test(cleanCEP)) return false;

  return true;
};

/**
 * Validação de data brasileira (DD/MM/AAAA)
 */
export const validateDateBR = (date: string): boolean => {
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = date.match(dateRegex);

  if (!match) return false;

  const [, day, month, year] = match;
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  // Verifica se a data é válida
  return (
    dateObj.getDate() === parseInt(day) &&
    dateObj.getMonth() === parseInt(month) - 1 &&
    dateObj.getFullYear() === parseInt(year)
  );
};

/**
 * Validação de número de contrato
 */
export const validateContractNumber = (contractNumber: string): boolean => {
  // Remove caracteres não alfanuméricos
  const cleanNumber = contractNumber.replace(/[^a-zA-Z0-9]/g, '');

  // Verifica se tem entre 3 e 20 caracteres
  if (cleanNumber.length < 3 || cleanNumber.length > 20) return false;

  return true;
};

/**
 * Schemas Zod para validação de formulários
 */
export const validationSchemas = {
  cpf: z.string().refine(validateCPF, {
    message: 'CPF inválido',
  }),

  cnpj: z.string().refine(validateCNPJ, {
    message: 'CNPJ inválido',
  }),

  email: z.string().refine(validateEmail, {
    message: 'Email inválido',
  }),

  phone: z.string().refine(validatePhone, {
    message: 'Telefone inválido',
  }),

  cep: z.string().refine(validateCEP, {
    message: 'CEP inválido',
  }),

  dateBR: z.string().refine(validateDateBR, {
    message: 'Data inválida (use DD/MM/AAAA)',
  }),

  contractNumber: z.string().refine(validateContractNumber, {
    message: 'Número de contrato inválido',
  }),

  required: z.string().min(1, 'Campo obrigatório'),

  optional: z.string().optional(),

  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  address: z
    .string()
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(200, 'Endereço deve ter no máximo 200 caracteres'),

  price: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
      return !isNaN(num) && num >= 0;
    },
    {
      message: 'Valor inválido',
    }
  ),

  description: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
};

/**
 * Utilitários de formatação
 */
export const formatters = {
  cpf: (cpf: string): string => {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  cnpj: (cnpj: string): string => {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  },

  phone: (phone: string): string => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  },

  cep: (cep: string): string => {
    const clean = cep.replace(/\D/g, '');
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  },

  currency: (value: string): string => {
    const num = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  },
};

/**
 * Validação de upload de arquivo
 */
export const validateFileUpload = (
  file: File
): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 10MB.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não permitido.' };
  }

  return { valid: true };
};

/**
 * Função para validar múltiplos campos
 */
export const validateFormData = <T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, z.ZodSchema>
): { valid: boolean; errors: Record<keyof T, string> } => {
  const errors: Record<keyof T, string> = {} as Record<keyof T, string>;
  let valid = true;

  for (const [key, validator] of Object.entries(schema)) {
    try {
      validator.parse(data[key]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors[key as keyof T] = error.errors[0].message;
        valid = false;
      }
    }
  }

  return { valid, errors };
};
