import { useState, useCallback, useMemo } from 'react';
import { ZodSchema, ZodError } from 'zod';

export interface FormValidationState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isValidating: boolean;
}

export interface FormValidationActions<T> {
  setData: (data: T) => void;
  setField: (field: keyof T, value: any) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  reset: () => void;
  getFieldError: (field: keyof T) => string | undefined;
}

/**
 * Hook para validação de formulários em tempo real usando Zod
 * 
 * @param schema - Schema Zod para validação dos dados
 * @param initialData - Dados iniciais do formulário
 * @returns Objeto com estado e ações de validação
 */
export function useFormValidation<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  initialData: T
): FormValidationState<T> & FormValidationActions<T> {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Validação completa do formulário
  const validateForm = useCallback((): boolean => {
    setIsValidating(true);
    try {
      schema.parse(data);
      setErrors({});
      setIsValidating(false);
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof T;
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
      setIsValidating(false);
      return false;
    }
  }, [data, schema]);

  // Validação de campo específico
  const validateField = useCallback((field: keyof T): boolean => {
    try {
      const fieldSchema = schema.shape[field];
      if (!fieldSchema) return true;
      
      fieldSchema.parse(data[field]);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0]?.message }));
      }
      return false;
    }
  }, [data, schema]);

  // Atualizar valor de um campo
  const setField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Reset do formulário
  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setIsValidating(false);
  }, [initialData]);

  // Obter erro de um campo específico
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors[field];
  }, [errors]);

  // Memoização do estado de validade
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && !isValidating;
  }, [errors, isValidating]);

  return {
    data,
    errors,
    isValid,
    isValidating,
    setData,
    setField,
    validateField,
    validateForm,
    reset,
    getFieldError,
  };
}