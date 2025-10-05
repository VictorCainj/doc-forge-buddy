import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

/**
 * Hook para gerenciar o Wizard de Vistorias
 * 5 etapas: Dados Básicos → Ambientes → Apontamentos → Orçamento → Revisão
 */

// Schemas de validação por step
const step1Schema = z.object({
  contratoId: z.string().min(1, 'Selecione um contrato'),
  dataVistoria: z.string().min(1, 'Data obrigatória'),
  tipoVistoria: z.enum(['inicial', 'final', 'vistoria', 'revistoria']),
  responsavel: z.string().optional(),
});

const step2Schema = z.object({
  ambientes: z.array(z.object({
    nome: z.string().min(1, 'Nome do ambiente obrigatório'),
    fotos: z.array(z.string()),
  })).min(1, 'Adicione pelo menos um ambiente'),
});

const step3Schema = z.object({
  apontamentos: z.array(z.object({
    ambiente: z.string(),
    subtitulo: z.string(),
    descricao: z.string(),
    tipo: z.enum(['material', 'servico']),
  })),
});

const step4Schema = z.object({
  orcamento: z.object({
    prestadorId: z.string().optional(),
    valorTotal: z.number().min(0),
    itens: z.array(z.any()),
  }),
});

export interface VistoriaWizardData {
  // Step 1
  contratoId?: string;
  dataVistoria?: string;
  tipoVistoria?: 'inicial' | 'final' | 'vistoria' | 'revistoria';
  responsavel?: string;
  
  // Step 2
  ambientes?: Array<{
    nome: string;
    fotos: string[];
  }>;
  
  // Step 3
  apontamentos?: Array<{
    ambiente: string;
    subtitulo: string;
    descricao: string;
    tipo: 'material' | 'servico';
    valor?: number;
    quantidade?: number;
  }>;
  
  // Step 4
  orcamento?: {
    prestadorId?: string;
    valorTotal: number;
    itens: any[];
  };
}

export function useVistoriaWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<VistoriaWizardData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 5;

  // Progresso calculado
  const progress = useMemo(() => {
    return (currentStep / totalSteps) * 100;
  }, [currentStep]);

  // Validar step atual
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      setErrors({});
      
      switch (currentStep) {
        case 1:
          step1Schema.parse({
            contratoId: data.contratoId,
            dataVistoria: data.dataVistoria,
            tipoVistoria: data.tipoVistoria || 'inicial',
            responsavel: data.responsavel,
          });
          break;
          
        case 2:
          step2Schema.parse({
            ambientes: data.ambientes || [],
          });
          break;
          
        case 3:
          step3Schema.parse({
            apontamentos: data.apontamentos || [],
          });
          break;
          
        case 4:
          step4Schema.parse({
            orcamento: data.orcamento || { valorTotal: 0, itens: [] },
          });
          break;
          
        case 5:
          // Step 5 é apenas revisão, sem validação
          break;
      }
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errorMap[path] = err.message;
        });
        setErrors(errorMap);
      }
      return false;
    }
  }, [currentStep, data]);

  // Atualizar dados
  const updateData = useCallback((newData: Partial<VistoriaWizardData>) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  // Próximo step
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      return true;
    }
    
    return false;
  }, [currentStep, validateCurrentStep]);

  // Step anterior
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  }, [currentStep]);

  // Ir para step específico
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      setErrors({});
    }
  }, []);

  // Resetar wizard
  const reset = useCallback(() => {
    setCurrentStep(1);
    setData({});
    setErrors({});
  }, []);

  // Pode avançar?
  const canGoNext = useMemo(() => {
    return currentStep < totalSteps;
  }, [currentStep]);

  // Pode voltar?
  const canGoPrev = useMemo(() => {
    return currentStep > 1;
  }, [currentStep]);

  // É o último step?
  const isLastStep = useMemo(() => {
    return currentStep === totalSteps;
  }, [currentStep]);

  // Dados estão completos?
  const isComplete = useMemo(() => {
    return !!(
      data.contratoId &&
      data.dataVistoria &&
      data.ambientes && data.ambientes.length > 0
    );
  }, [data]);

  return {
    // Estado
    currentStep,
    data,
    errors,
    
    // Info
    totalSteps,
    progress,
    canGoNext,
    canGoPrev,
    isLastStep,
    isComplete,
    
    // Actions
    updateData,
    nextStep,
    prevStep,
    goToStep,
    reset,
    validateCurrentStep,
  };
}
