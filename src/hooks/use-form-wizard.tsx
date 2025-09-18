import { useState, useCallback, useMemo } from 'react';
import { validatePhoneNumber } from '@/utils/phoneValidator';

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'email'
    | 'tel'
    | 'select'
    | 'arrowDropdown';
  required?: boolean;
  placeholder?: string;
  validation?: (value: string) => string | null;
  mask?: string;
  options?: Array<{ value: string; label: string }>;
  tooltip?: string;
  conditional?: {
    field: string;
    value: string;
  };
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  icon?: React.ComponentType<{ className?: string }>;
}

interface UseFormWizardProps {
  steps: FormStep[];
  initialData?: Record<string, string>;
  onStepValidation?: (stepIndex: number, isValid: boolean) => void;
}

export const useFormWizard = ({
  steps,
  initialData = {},
  onStepValidation,
}: UseFormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validar um campo específico
  const validateField = useCallback(
    (field: FormField, value: string, isDisabled?: boolean): string | null => {
      // Se o campo está desabilitado, não validar
      if (isDisabled) {
        return null;
      }

      if (field.required && (!value || value.trim() === '')) {
        return `${field.label} é obrigatório`;
      }

      if (field.validation) {
        return field.validation(value);
      }

      // Validações básicas por tipo
      switch (field.type) {
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'E-mail inválido';
          }
          break;
        case 'tel':
          if (value) {
            const phoneError = validatePhoneNumber(value);
            if (phoneError) {
              return phoneError;
            }
          }
          break;
      }

      return null;
    },
    []
  );

  // Validar uma etapa específica (sem side effects)
  const validateStepInternal = useCallback(
    (stepIndex: number, data: Record<string, string>): boolean => {
      const step = steps[stepIndex];
      if (!step) return true;

      // Pular validação da etapa "documentos" para termo do locador
      if (step.id === 'documentos' && data.tipoTermo === 'locador') {
        return true;
      }

      return step.fields.every((field) => {
        const value = data[field.name] || '';
        const error = validateField(field, value);
        return !error;
      });
    },
    [steps, validateField]
  );

  // Validar uma etapa específica (com side effects)
  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const step = steps[stepIndex];
      if (!step) return true;

      // Pular validação da etapa "documentos" para termo do locador
      if (step.id === 'documentos' && formData.tipoTermo === 'locador') {
        return true;
      }

      let hasErrors = false;
      const newErrors: Record<string, string> = { ...errors };

      step.fields.forEach((field) => {
        const value = formData[field.name] || '';
        const error = validateField(field, value);

        if (error) {
          newErrors[field.name] = error;
          hasErrors = true;
        } else {
          delete newErrors[field.name];
        }
      });

      setErrors(newErrors);
      const isValid = !hasErrors;
      onStepValidation?.(stepIndex, isValid);
      return isValid;
    },
    [steps, formData, errors, validateField, onStepValidation]
  );

  // Atualizar valor de um campo
  const updateField = useCallback(
    (name: string, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validar campo em tempo real
      const field = steps
        .flatMap((step) => step.fields)
        .find((f) => f.name === name);
      if (field) {
        const error = validateField(field, value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          if (error) {
            newErrors[name] = error;
          } else {
            delete newErrors[name];
          }
          return newErrors;
        });
      }
    },
    [steps, validateField]
  );

  // Aplicar máscara a um valor
  const applyMask = useCallback((mask: string, value: string): string => {
    if (!mask) return value;

    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    let masked = '';
    let digitIndex = 0;

    for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
      if (mask[i] === '9') {
        masked += digits[digitIndex];
        digitIndex++;
      } else {
        masked += mask[i];
      }
    }

    return masked;
  }, []);

  // Ir para próxima etapa
  const nextStep = useCallback(() => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return true;
    }
    return false;
  }, [currentStep, steps.length, validateStep]);

  // Ir para etapa anterior
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      return true;
    }
    return false;
  }, [currentStep]);

  // Ir para etapa específica
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        return true;
      }
      return false;
    },
    [steps.length]
  );

  // Calcular etapas completadas
  const completedSteps = useMemo(() => {
    const completed: number[] = [];
    for (let i = 0; i < currentStep; i++) {
      if (validateStepInternal(i, formData)) {
        completed.push(i);
      }
    }
    return completed;
  }, [currentStep, formData, validateStepInternal]);

  // Verificar se o formulário está válido
  const isFormValid = useMemo(() => {
    return steps.every((step, index) => {
      // Pular validação da etapa "documentos" para termo do locador
      if (step.id === 'documentos' && formData.tipoTermo === 'locador') {
        return true;
      }
      return validateStepInternal(index, formData);
    });
  }, [steps, formData, validateStepInternal]);

  // Verificar se a etapa atual está válida
  const isCurrentStepValid = useMemo(() => {
    return validateStepInternal(currentStep, formData);
  }, [currentStep, formData, validateStepInternal]);

  // Reset do formulário
  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  return {
    // Estado
    currentStep,
    formData,
    errors,
    touched,

    // Computados
    completedSteps,
    isFormValid,
    isCurrentStepValid,
    totalSteps: steps.length,
    progress: ((currentStep + 1) / steps.length) * 100,

    // Ações
    updateField,
    nextStep,
    previousStep,
    goToStep,
    validateStep,
    resetForm,
    applyMask,

    // Utilitários
    getCurrentStep: () => steps[currentStep],
    getFieldError: (fieldName: string) => errors[fieldName],
    isFieldTouched: (fieldName: string) => touched[fieldName],
    isLastStep: currentStep === steps.length - 1,
    isFirstStep: currentStep === 0,
  };
};

export default useFormWizard;
