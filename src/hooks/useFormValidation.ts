/**
 * Hook para validação de formulários
 * Centraliza toda a lógica de validação para evitar duplicação
 */

import { useState, useCallback, useMemo } from 'react';
import { useStandardToast } from '@/utils/toastHelpers';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  message?: string;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
  [fieldName: string]: string;
}

export interface UseFormValidationReturn {
  errors: ValidationErrors;
  isValid: boolean;
  hasErrors: boolean;
  validate: (fieldName: string, value: string) => string | null;
  validateAll: (data: Record<string, string>) => boolean;
  validateField: (fieldName: string, value: string) => void;
  clearError: (fieldName: string) => void;
  clearAllErrors: () => void;
  setError: (fieldName: string, error: string) => void;
  getFieldError: (fieldName: string) => string | null;
  isFieldValid: (fieldName: string) => boolean;
}

/**
 * Hook principal para validação de formulários
 */
export const useFormValidation = (
  rules: ValidationRules = {}
): UseFormValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { showValidationError } = useStandardToast();

  // Validar um campo específico
  const validate = useCallback((fieldName: string, value: string): string | null => {
    const rule = rules[fieldName];
    if (!rule) return null;

    // Verificar se é obrigatório
    if (rule.required && (!value || !value.trim())) {
      return rule.message || `${fieldName} é obrigatório`;
    }

    // Se o campo está vazio e não é obrigatório, não validar outras regras
    if (!value || !value.trim()) {
      return null;
    }

    // Verificar comprimento mínimo
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `${fieldName} deve ter pelo menos ${rule.minLength} caracteres`;
    }

    // Verificar comprimento máximo
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `${fieldName} deve ter no máximo ${rule.maxLength} caracteres`;
    }

    // Verificar padrão (regex)
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || `${fieldName} tem formato inválido`;
    }

    // Validação customizada
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  // Validar um campo e atualizar o estado de erros
  const validateField = useCallback((fieldName: string, value: string) => {
    const error = validate(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }));
  }, [validate]);

  // Validar todos os campos
  const validateAll = useCallback((data: Record<string, string>): boolean => {
    const newErrors: ValidationErrors = {};
    let hasAnyError = false;

    Object.keys(rules).forEach(fieldName => {
      const value = data[fieldName] || '';
      const error = validate(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
        hasAnyError = true;
      }
    });

    setErrors(newErrors);

    if (hasAnyError) {
      showValidationError();
    }

    return !hasAnyError;
  }, [rules, validate, showValidationError]);

  // Limpar erro de um campo específico
  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Limpar todos os erros
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Definir erro manualmente
  const setError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // Obter erro de um campo específico
  const getFieldError = useCallback((fieldName: string): string | null => {
    return errors[fieldName] || null;
  }, [errors]);

  // Verificar se um campo é válido
  const isFieldValid = useCallback((fieldName: string): boolean => {
    return !errors[fieldName];
  }, [errors]);

  // Valores computados
  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error && error.trim() !== '');
  }, [errors]);

  const isValid = useMemo(() => {
    return !hasErrors;
  }, [hasErrors]);

  return {
    errors,
    isValid,
    hasErrors,
    validate,
    validateAll,
    validateField,
    clearError,
    clearAllErrors,
    setError,
    getFieldError,
    isFieldValid,
  };
};

/**
 * Regras de validação pré-definidas
 */
export const ValidationRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message,
  }),

  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'E-mail inválido',
  }),

  phone: (message?: string): ValidationRule => ({
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    message: message || 'Telefone inválido. Use o formato (11) 99999-9999',
  }),

  cpf: (message?: string): ValidationRule => ({
    pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    custom: (value: string) => {
      if (!value) return null;
      
      // Remover formatação
      const cpf = value.replace(/[^\d]/g, '');
      
      // Verificar se tem 11 dígitos
      if (cpf.length !== 11) {
        return message || 'CPF deve ter 11 dígitos';
      }
      
      // Verificar se não são todos iguais
      if (/^(\d)\1{10}$/.test(cpf)) {
        return message || 'CPF inválido';
      }
      
      // Validar dígitos verificadores
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
      }
      let digit = 11 - (sum % 11);
      if (digit === 10 || digit === 11) digit = 0;
      if (digit !== parseInt(cpf.charAt(9))) {
        return message || 'CPF inválido';
      }
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
      }
      digit = 11 - (sum % 11);
      if (digit === 10 || digit === 11) digit = 0;
      if (digit !== parseInt(cpf.charAt(10))) {
        return message || 'CPF inválido';
      }
      
      return null;
    },
    message,
  }),

  cnpj: (message?: string): ValidationRule => ({
    pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    message: message || 'CNPJ inválido. Use o formato 00.000.000/0000-00',
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    minLength: min,
    message: message || `Deve ter pelo menos ${min} caracteres`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    maxLength: max,
    message: message || `Deve ter no máximo ${max} caracteres`,
  }),

  numeric: (message?: string): ValidationRule => ({
    pattern: /^\d+$/,
    message: message || 'Deve conter apenas números',
  }),

  alphanumeric: (message?: string): ValidationRule => ({
    pattern: /^[a-zA-Z0-9]+$/,
    message: message || 'Deve conter apenas letras e números',
  }),

  date: (message?: string): ValidationRule => ({
    pattern: /^\d{2}\/\d{2}\/\d{4}$/,
    custom: (value: string) => {
      if (!value) return null;
      
      const parts = value.split('/');
      if (parts.length !== 3) {
        return message || 'Data inválida. Use o formato DD/MM/AAAA';
      }
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
        return message || 'Data inválida';
      }
      
      const date = new Date(year, month - 1, day);
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return message || 'Data inválida';
      }
      
      return null;
    },
    message,
  }),

  url: (message?: string): ValidationRule => ({
    pattern: /^https?:\/\/.+/,
    message: message || 'URL inválida',
  }),

  strongPassword: (message?: string): ValidationRule => ({
    minLength: 8,
    custom: (value: string) => {
      if (!value) return null;
      
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return message || 'Senha deve conter ao menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial';
      }
      
      return null;
    },
    message,
  }),
};

/**
 * Hook especializado para validação de contratos
 */
export const useContractValidation = () => {
  const contractRules: ValidationRules = {
    numeroContrato: ValidationRules.required('Número do contrato é obrigatório'),
    enderecoImovel: ValidationRules.required('Endereço do imóvel é obrigatório'),
    nomeLocatario: ValidationRules.required('Nome do locatário é obrigatório'),
    nomeProprietario: ValidationRules.required('Nome do proprietário é obrigatório'),
    dataInicioRescisao: ValidationRules.date('Data de início da rescisão inválida'),
    dataTerminoRescisao: ValidationRules.date('Data de término da rescisão inválida'),
    emailLocatario: ValidationRules.email('E-mail do locatário inválido'),
    celularLocatario: ValidationRules.phone('Telefone do locatário inválido'),
  };

  return useFormValidation(contractRules);
};

/**
 * Hook especializado para validação de usuários
 */
export const useUserValidation = () => {
  const userRules: ValidationRules = {
    name: ValidationRules.required('Nome é obrigatório'),
    email: ValidationRules.email('E-mail inválido'),
    password: ValidationRules.strongPassword(),
    phone: ValidationRules.phone('Telefone inválido'),
  };

  return useFormValidation(userRules);
};
