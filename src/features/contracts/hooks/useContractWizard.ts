import { useState, useCallback } from 'react';
import { FormStep } from '@/hooks/use-form-wizard';

interface UseContractWizardReturn {
  currentStep: number;
  formData: Record<string, string>;
  isStepValid: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
  
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (data: Record<string, string>) => void;
  updateFieldValue: (fieldName: string, value: string) => void;
  resetWizard: () => void;
}

/**
 * Hook customizado para gerenciar o estado do wizard de contratos
 * Mantém sincronização entre etapas e validação de campos
 */
export const useContractWizard = (
  steps: FormStep[],
  initialData: Record<string, string> = {}
): UseContractWizardReturn => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>(initialData);

  // Calcula o progresso em porcentagem
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Verifica se todos os campos obrigatórios do step atual estão preenchidos
  const isStepValid = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return false;

    const requiredFields = step.fields.filter(field => field.required);
    
    return requiredFields.every(field => {
      const value = formData[field.name];
      return value !== undefined && value.trim() !== '';
    });
  }, [currentStep, steps, formData]);

  // Verifica se pode avançar
  const canGoNext = currentStep < steps.length - 1 && isStepValid();

  // Verifica se pode voltar
  const canGoPrevious = currentStep > 0;

  // Navega para uma etapa específica
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  // Avança para próxima etapa
  const nextStep = useCallback(() => {
    if (canGoNext) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [canGoNext, steps.length]);

  // Volta para etapa anterior
  const previousStep = useCallback(() => {
    if (canGoPrevious) {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  }, [canGoPrevious]);

  // Atualiza dados do formulário
  const updateFormData = useCallback((data: Record<string, string>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  // Atualiza um campo específico
  const updateFieldValue = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  // Reseta o wizard
  const resetWizard = useCallback(() => {
    setCurrentStep(0);
    setFormData(initialData);
  }, [initialData]);

  return {
    currentStep,
    formData,
    isStepValid: isStepValid(),
    canGoNext,
    canGoPrevious,
    progress,
    goToStep,
    nextStep,
    previousStep,
    updateFormData,
    updateFieldValue,
    resetWizard,
  };
};
