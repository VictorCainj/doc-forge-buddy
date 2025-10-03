/**
 * Hook personalizado para formulários com preview
 * Extrai lógica complexa de formulário dos componentes
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { TemplateProcessor } from '@/utils/templateProcessor';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: (value: string) => string | null;
}

export interface UseFormWithPreviewOptions {
  initialData?: Record<string, string>;
  contractData?: Record<string, string>;
  template?: string;
  fields?: FormField[];
  onFormDataChange?: (data: Record<string, string>) => void;
  onGenerate?: (data: Record<string, string>) => void;
  autoPreview?: boolean;
}

export interface UseFormWithPreviewReturn {
  // Estados do formulário
  formData: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  
  // Estados do preview
  showPreview: boolean;
  previewContent: string;
  fontSize: number;
  isGenerating: boolean;
  
  // Ações do formulário
  updateField: (name: string, value: string) => void;
  updateMultipleFields: (data: Record<string, string>) => void;
  validateField: (name: string) => string | null;
  validateForm: () => boolean;
  resetForm: () => void;
  setFieldTouched: (name: string, touched?: boolean) => void;
  
  // Ações do preview
  togglePreview: () => void;
  updateFontSize: (size: number) => void;
  generateDocument: () => void;
  
  // Utilitários
  getFieldError: (name: string) => string | null;
  isFieldTouched: (name: string) => boolean;
  getFieldValue: (name: string) => string;
}

export const useFormWithPreview = (options: UseFormWithPreviewOptions): UseFormWithPreviewReturn => {
  const {
    initialData = {},
    contractData = {},
    template = '',
    fields = [],
    onFormDataChange,
    onGenerate,
    autoPreview = true,
  } = options;

  // ✅ Estados organizados
  const [formData, setFormData] = useState<Record<string, string>>(() => ({
    ...initialData,
    ...contractData,
  }));
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isGenerating, setIsGenerating] = useState(false);

  // ✅ Validação de campo individual
  const validateField = useCallback((name: string): string | null => {
    const field = fields.find(f => f.name === name);
    const value = formData[name] || '';

    // Campo obrigatório
    if (field?.required && !value.trim()) {
      return `${field.label} é obrigatório`;
    }

    // Validação customizada
    if (field?.validation) {
      return field.validation(value);
    }

    // Validações por tipo
    switch (field?.type) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Email inválido';
        }
        break;
      case 'tel':
        if (value && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value)) {
          return 'Telefone inválido (ex: (11) 99999-9999)';
        }
        break;
    }

    return null;
  }, [fields, formData]);

  // ✅ Atualizar campo individual
  const updateField = useCallback((name: string, value: string) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Callback externo
    onFormDataChange?.(newFormData);
  }, [formData, errors, onFormDataChange]);

  // ✅ Atualizar múltiplos campos
  const updateMultipleFields = useCallback((data: Record<string, string>) => {
    const newFormData = { ...formData, ...data };
    setFormData(newFormData);
    onFormDataChange?.(newFormData);
  }, [formData, onFormDataChange]);

  // ✅ Validar formulário completo
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach(field => {
      const error = validateField(field.name);
      if (error) {
        newErrors[field.name] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [fields, validateField]);

  // ✅ Marcar campo como tocado
  const setFieldTouched = useCallback((name: string, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
    
    // Validar campo quando tocado
    if (isTouched) {
      const error = validateField(name);
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    }
  }, [validateField]);

  // ✅ Reset do formulário
  const resetForm = useCallback(() => {
    setFormData({ ...initialData, ...contractData });
    setErrors({});
    setTouched({});
    setShowPreview(false);
    setIsGenerating(false);
  }, [initialData, contractData]);

  // ✅ Gerar documento
  const generateDocument = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate?.(formData);
    } finally {
      setIsGenerating(false);
    }
  }, [validateForm, onGenerate, formData]);

  // ✅ Conteúdo do preview processado
  const previewContent = useMemo(() => {
    if (!template || !showPreview) return '';
    
    try {
      return TemplateProcessor.processTemplate(template, formData);
    } catch (error) {
      console.error('Erro ao processar template:', error);
      return 'Erro ao gerar preview';
    }
  }, [template, formData, showPreview]);

  // ✅ Estados derivados
  const isValid = useMemo(() => {
    return fields.every(field => {
      const error = validateField(field.name);
      return !error;
    });
  }, [fields, validateField]);

  const isDirty = useMemo(() => {
    const initialValues = { ...initialData, ...contractData };
    return Object.keys(formData).some(key => formData[key] !== initialValues[key]);
  }, [formData, initialData, contractData]);

  // ✅ Auto-preview quando dados mudarem
  useEffect(() => {
    if (autoPreview && template && Object.keys(formData).length > 0) {
      setShowPreview(true);
    }
  }, [formData, template, autoPreview]);

  // ✅ Utilitários
  const getFieldError = useCallback((name: string): string | null => {
    return touched[name] ? errors[name] || null : null;
  }, [errors, touched]);

  const isFieldTouched = useCallback((name: string): boolean => {
    return touched[name] || false;
  }, [touched]);

  const getFieldValue = useCallback((name: string): string => {
    return formData[name] || '';
  }, [formData]);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  const updateFontSize = useCallback((size: number) => {
    setFontSize(Math.max(10, Math.min(24, size)));
  }, []);

  return {
    // Estados do formulário
    formData,
    errors,
    touched,
    isValid,
    isDirty,
    
    // Estados do preview
    showPreview,
    previewContent,
    fontSize,
    isGenerating,
    
    // Ações do formulário
    updateField,
    updateMultipleFields,
    validateField,
    validateForm,
    resetForm,
    setFieldTouched,
    
    // Ações do preview
    togglePreview,
    updateFontSize,
    generateDocument,
    
    // Utilitários
    getFieldError,
    isFieldTouched,
    getFieldValue,
  };
};
