import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';

// Tipos para workflow de vistoria
export interface VistoriaStep {
  id: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  isCompleted: boolean;
  isActive: boolean;
  dependencies: string[];
  validationRules: ValidationRule[];
  metadata?: Record<string, any>;
}

export interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'file';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

export interface VistoriaStatus {
  id: string;
  vistoriaId: string;
  currentStep: string;
  completedSteps: string[];
  blockedSteps: string[];
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
}

export interface WorkflowTransition {
  fromStep: string;
  toStep: string;
  isValid: boolean;
  requirements: string[];
  warnings: string[];
}

export interface UseVistoriaWorkflowOptions {
  autoSave?: boolean;
  enableValidation?: boolean;
  enableNotifications?: boolean;
  enableSLA?: boolean;
}

// Configuração padrão dos passos da vistoria
const DEFAULT_WORKFLOW_STEPS: Omit<VistoriaStep, 'id'>[] = [
  {
    name: 'Agendamento',
    description: 'Agendar data e hora da vistoria',
    order: 1,
    isRequired: true,
    isCompleted: false,
    isActive: true,
    dependencies: [],
    validationRules: [
      { field: 'scheduledDate', required: true, type: 'date' },
      { field: 'scheduledTime', required: true, type: 'string' }
    ]
  },
  {
    name: 'Preparação',
    description: 'Preparar equipamentos e documentos',
    order: 2,
    isRequired: true,
    isCompleted: false,
    isActive: false,
    dependencies: ['agendamento'],
    validationRules: [
      { field: 'equipmentChecked', required: true, type: 'boolean' },
      { field: 'documentsPrepared', required: true, type: 'boolean' }
    ]
  },
  {
    name: 'Execução',
    description: 'Realizar a vistoria no local',
    order: 3,
    isRequired: true,
    isCompleted: false,
    isActive: false,
    dependencies: ['preparacao'],
    validationRules: [
      { field: 'locationVisited', required: true, type: 'boolean' },
      { field: 'photosTaken', required: true, type: 'boolean' },
      { field: 'checklistCompleted', required: true, type: 'boolean' }
    ]
  },
  {
    name: 'Documentação',
    description: 'Documentar findings e apontamentos',
    order: 4,
    isRequired: true,
    isCompleted: false,
    isActive: false,
    dependencies: ['execucao'],
    validationRules: [
      { field: 'reportGenerated', required: true, type: 'boolean' },
      { field: 'photosUploaded', required: true, type: 'boolean' },
      { field: 'apontamentosCreated', required: true, type: 'boolean' }
    ]
  },
  {
    name: 'Validação',
    description: 'Validar documentação e findings',
    order: 5,
    isRequired: true,
    isCompleted: false,
    isActive: false,
    dependencies: ['documentacao'],
    validationRules: [
      { field: 'supervisorApproval', required: true, type: 'boolean' },
      { field: 'qualityCheck', required: true, type: 'boolean' }
    ]
  },
  {
    name: 'Finalização',
    description: 'Finalizar vistoria e entregar documentos',
    order: 6,
    isRequired: true,
    isCompleted: false,
    isActive: false,
    dependencies: ['validacao'],
    validationRules: [
      { field: 'documentsDelivered', required: true, type: 'boolean' },
      { field: 'clientNotified', required: true, type: 'boolean' }
    ]
  }
];

export function useVistoriaWorkflow(
  vistoriaId: string,
  options: UseVistoriaWorkflowOptions = {}
) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    autoSave = true,
    enableValidation = true,
    enableNotifications = true,
    enableSLA = true
  } = options;

  // Estados locais
  const [currentStep, setCurrentStep] = useState<string>('agendamento');
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Buscar status da vistoria
  const {
    data: vistoriaStatus,
    isLoading: statusLoading,
    error: statusError
  } = useQuery({
    queryKey: ['vistoria-status', vistoriaId],
    queryFn: async (): Promise<VistoriaStatus> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 400));
      return {
        id: `status-${vistoriaId}`,
        vistoriaId,
        currentStep: 'agendamento',
        completedSteps: [],
        blockedSteps: [],
        progress: 0,
        startedAt: new Date(),
        priority: 'medium',
        status: 'not_started'
      };
    },
    enabled: !!vistoriaId,
    refetchInterval: 30000
  });

  // Buscar configuração dos passos
  const {
    data: workflowSteps,
    isLoading: stepsLoading
  } = useQuery({
    queryKey: ['workflow-steps', vistoriaId],
    queryFn: async (): Promise<VistoriaStep[]> => {
      // Simulação - buscar configuração customizada
      await new Promise(resolve => setTimeout(resolve, 200));
      return DEFAULT_WORKFLOW_STEPS.map((step, index) => ({
        ...step,
        id: `step-${index + 1}`,
        isActive: index === 0
      }));
    },
    enabled: !!vistoriaId
  });

  // Mutação para salvar progresso
  const saveProgressMutation = useMutation({
    mutationFn: async (data: { stepId: string; stepData: any; isComplete: boolean }) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, timestamp: new Date() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vistoria-status', vistoriaId] });
    }
  });

  // Mutação para transição de passo
  const transitionMutation = useMutation({
    mutationFn: async ({
      fromStep,
      toStep,
      stepData
    }: {
      fromStep: string;
      toStep: string;
      stepData: any;
    }) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        newStatus: {
          ...vistoriaStatus,
          currentStep: toStep,
          completedSteps: [...(vistoriaStatus?.completedSteps || []), fromStep],
          progress: calculateProgress(toStep, workflowSteps || [])
        } as VistoriaStatus
      };
    },
    onSuccess: (result) => {
      if (result.newStatus) {
        queryClient.setQueryData(['vistoria-status', vistoriaId], result.newStatus);
        setCurrentStep(result.newStatus.currentStep);
        
        if (enableNotifications) {
          toast({
            title: 'Passo concluído',
            description: `Progresso atualizado para ${result.newStatus.progress}%`,
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar progresso',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  });

  // Validar passo atual
  const validateStep = useCallback((stepId: string, data: any): Record<string, string[]> => {
    const step = workflowSteps?.find(s => s.id === stepId);
    if (!step || !enableValidation) return {};

    const errors: Record<string, string[]> = {};

    step.validationRules.forEach(rule => {
      const value = data[rule.field];
      const fieldErrors: string[] = [];

      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${rule.field} é obrigatório`);
      }

      if (value !== undefined && value !== null && value !== '') {
        switch (rule.type) {
          case 'string':
            if (rule.minLength && value.length < rule.minLength) {
              fieldErrors.push(`${rule.field} deve ter pelo menos ${rule.minLength} caracteres`);
            }
            if (rule.maxLength && value.length > rule.maxLength) {
              fieldErrors.push(`${rule.field} deve ter no máximo ${rule.maxLength} caracteres`);
            }
            if (rule.pattern && !rule.pattern.test(value)) {
              fieldErrors.push(`${rule.field} não está no formato válido`);
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              fieldErrors.push(`${rule.field} deve ser um número válido`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              fieldErrors.push(`${rule.field} deve ser uma data válida`);
            }
            break;
        }

        if (rule.customValidator) {
          const customError = rule.customValidator(value);
          if (customError) {
            fieldErrors.push(customError);
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors[rule.field] = fieldErrors;
      }
    });

    return errors;
  }, [workflowSteps, enableValidation]);

  // Verificar se pode transicionar para outro passo
  const canTransitionTo = useCallback((targetStepId: string): WorkflowTransition => {
    const currentStepData = workflowSteps?.find(s => s.id === currentStep);
    const targetStepData = workflowSteps?.find(s => s.id === targetStepId);

    if (!currentStepData || !targetStepData) {
      return {
        fromStep: currentStep,
        toStep: targetStepId,
        isValid: false,
        requirements: ['Passo não encontrado'],
        warnings: []
      };
    }

    const requirements: string[] = [];
    const warnings: string[] = [];

    // Verificar dependências
    targetStepData.dependencies.forEach(depId => {
      const isCompleted = vistoriaStatus?.completedSteps.includes(depId) || false;
      if (!isCompleted) {
        const depStep = workflowSteps?.find(s => s.id === depId);
        requirements.push(`Concluir passo: ${depStep?.name || depId}`);
      }
    });

    // Verificar se o passo atual está completo
    const currentStepData_value = stepData[currentStep];
    const validationErrors_current = validateStep(currentStep, currentStepData_value);
    if (Object.keys(validationErrors_current).length > 0) {
      requirements.push('Completar validações do passo atual');
    }

    // Verificar bloqueios
    if (vistoriaStatus?.blockedSteps.includes(targetStepId)) {
      warnings.push('Este passo está temporariamente bloqueado');
    }

    return {
      fromStep: currentStep,
      toStep: targetStepId,
      isValid: requirements.length === 0,
      requirements,
      warnings
    };
  }, [currentStep, stepData, workflowSteps, vistoriaStatus, validateStep]);

  // Salvar dados do passo
  const saveStepData = useCallback(async (
    stepId: string,
    data: any,
    options?: { autoComplete?: boolean }
  ) => {
    setStepData(prev => ({ ...prev, [stepId]: data }));

    if (autoSave) {
      const isComplete = options?.autoComplete || false;
      await saveProgressMutation.mutateAsync({ stepId, stepData: data, isComplete });
    }
  }, [autoSave, saveProgressMutation]);

  // Completar passo atual
  const completeStep = useCallback(async (data?: any) => {
    const stepDataToSave = data || stepData[currentStep];
    const errors = validateStep(currentStep, stepDataToSave);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: 'Validação falhou',
        description: 'Verifique os dados inseridos',
        variant: 'destructive'
      });
      return false;
    }

    setIsTransitioning(true);
    setValidationErrors({});

    try {
      await saveStepData(currentStep, stepDataToSave, { autoComplete: true });
      
      // Encontrar próximo passo disponível
      const nextStep = workflowSteps?.find(step => 
        step.dependencies.every(dep => 
          vistoriaStatus?.completedSteps.includes(dep) || dep === currentStep
        ) && !vistoriaStatus?.completedSteps.includes(step.id)
      );

      if (nextStep) {
        await transitionMutation.mutateAsync({
          fromStep: currentStep,
          toStep: nextStep.id,
          stepData: stepDataToSave
        });
      } else {
        // Workflow completo
        toast({
          title: 'Vistoria concluída',
          description: 'Todos os passos foram concluídos com sucesso!',
        });
      }

      return true;
    } catch (error) {
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [currentStep, stepData, validateStep, saveStepData, transitionMutation, workflowSteps, vistoriaStatus, toast]);

  // Voltar para passo anterior
  const goToPreviousStep = useCallback(async () => {
    const completedSteps = vistoriaStatus?.completedSteps || [];
    if (completedSteps.length === 0) return;

    const previousStepId = completedSteps[completedSteps.length - 1];
    setCurrentStep(previousStepId);
  }, [vistoriaStatus]);

  // Ir para passo específico
  const goToStep = useCallback(async (stepId: string) => {
    const transition = canTransitionTo(stepId);
    if (!transition.isValid) {
      toast({
        title: 'Transição não permitida',
        description: transition.requirements.join(', '),
        variant: 'destructive'
      });
      return false;
    }

    setCurrentStep(stepId);
    return true;
  }, [canTransitionTo, toast]);

  // Calcular progresso geral
  const progress = useMemo(() => {
    if (!workflowSteps || !vistoriaStatus) return 0;
    return calculateProgress(vistoriaStatus.currentStep, workflowSteps);
  }, [workflowSteps, vistoriaStatus]);

  // Obter próximos passos disponíveis
  const nextSteps = useMemo(() => {
    if (!workflowSteps) return [];
    
    return workflowSteps.filter(step => 
      step.dependencies.every(dep => 
        vistoriaStatus?.completedSteps.includes(dep) || dep === currentStep
      ) && !vistoriaStatus?.completedSteps.includes(step.id)
    );
  }, [workflowSteps, vistoriaStatus, currentStep]);

  // Verificar SLA
  const slaStatus = useMemo(() => {
    if (!enableSLA || !vistoriaStatus) return null;

    const startedAt = new Date(vistoriaStatus.startedAt);
    const now = new Date();
    const elapsedHours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
    
    // SLA baseado na prioridade
    const slaHours = {
      low: 168,      // 7 dias
      medium: 72,    // 3 dias
      high: 24,      // 1 dia
      urgent: 8      // 8 horas
    };

    const maxHours = slaHours[vistoriaStatus.priority];
    const remainingHours = maxHours - elapsedHours;
    
    return {
      elapsedHours,
      maxHours,
      remainingHours,
      isOverdue: remainingHours < 0,
      progress: Math.min((elapsedHours / maxHours) * 100, 100)
    };
  }, [vistoriaStatus, enableSLA]);

  return {
    // Estado
    vistoriaStatus,
    workflowSteps,
    currentStep,
    stepData,
    progress,
    nextSteps,
    isTransitioning,
    validationErrors,
    slaStatus,
    isLoading: statusLoading || stepsLoading,
    error: statusError,

    // Ações
    saveStepData,
    completeStep,
    goToPreviousStep,
    goToStep,
    validateStep: (stepId: string, data: any) => validateStep(stepId, data),

    // Utilitários
    canTransitionTo,
    isStepCompleted: (stepId: string) => 
      vistoriaStatus?.completedSteps.includes(stepId) || false,
    isStepActive: (stepId: string) => stepId === currentStep,
    getStepById: (stepId: string) => 
      workflowSteps?.find(s => s.id === stepId)
  };
}

// Funções auxiliares
function calculateProgress(currentStep: string, steps: VistoriaStep[]): number {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  if (currentStepIndex === -1) return 0;
  
  return Math.round(((currentStepIndex + 1) / steps.length) * 100);
}