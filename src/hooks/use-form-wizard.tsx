import { useState, useCallback, useMemo } from "react";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "email" | "tel" | "select";
  required?: boolean;
  placeholder?: string;
  validation?: (value: string) => string | null;
  mask?: string;
  options?: Array<{ value: string; label: string }>;
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
  onStepValidation 
}: UseFormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validar um campo específico
  const validateField = useCallback((field: FormField, value: string): string | null => {
    if (field.required && (!value || value.trim() === "")) {
      return `${field.label} é obrigatório`;
    }
    
    if (field.validation) {
      return field.validation(value);
    }

    // Validações básicas por tipo
    switch (field.type) {
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "E-mail inválido";
        }
        break;
      case "tel":
        if (value && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value)) {
          return "Telefone inválido. Use o formato (XX) XXXXX-XXXX";
        }
        break;
    }

    return null;
  }, []);

  // Validar uma etapa específica (sem side effects)
  const validateStepInternal = useCallback((stepIndex: number, data: Record<string, string>): boolean => {
    const step = steps[stepIndex];
    if (!step) return true;

    return step.fields.every(field => {
      const value = data[field.name] || "";
      const error = validateField(field, value);
      return !error;
    });
  }, [steps, validateField]);

  // Validar uma etapa específica (com side effects)
  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = steps[stepIndex];
    if (!step) return true;

    let hasErrors = false;
    const newErrors: Record<string, string> = { ...errors };

    step.fields.forEach(field => {
      const value = formData[field.name] || "";
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
  }, [steps, formData, errors, validateField, onStepValidation]);

  // Atualizar valor de um campo
  const updateField = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validar campo em tempo real
    const field = steps.flatMap(step => step.fields).find(f => f.name === name);
    if (field) {
      const error = validateField(field, value);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[name] = error;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
    }
  }, [steps, validateField]);

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
      setCurrentStep(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentStep, steps.length, validateStep]);

  // Ir para etapa anterior
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentStep]);

  // Ir para etapa específica
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      return true;
    }
    return false;
  }, [steps.length]);

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
    return steps.every((_, index) => validateStepInternal(index, formData));
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

  // Gerar dados de teste aleatórios
  const generateTestData = useCallback(() => {
    const nomes = ['João Silva', 'Pedro Lima', 'Carlos Oliveira', 'Victor Cain', 'Rafael Santos', 'Maria Santos', 'Ana Costa', 'Fernanda Souza'];
    const enderecosCompletos = [
      'Rua das Flores, 123, Apto 45, Centro, Valinhos/SP, CEP: 13270-000',
      'Avenida Brasil, 456, Casa 2, Jardim América, Campinas/SP, CEP: 13100-000',
      'Rua Santos Dumont, 789, Bloco A, Vila Industrial, Valinhos/SP, CEP: 13271-000'
    ];
    const qualificacoes = [
      'JOÃO SILVA, brasileiro, solteiro, engenheiro civil, portador do RG. nº SP-12.345.678 SSP/SP, e inscrito no CPF sob o nº 123.456.789-00, nascido em 15/05/1985, com filiação de ANTONIO SILVA e MARIA SILVA, residente e domiciliado na cidade de Valinhos/SP',
      'MARIA SANTOS, brasileira, casada, professora universitária, portadora do RG. nº SP-98.765.432 SSP/SP, e inscrita no CPF sob o nº 987.654.321-00, nascida em 22/08/1990, com filiação de JOSÉ SANTOS e ANA SANTOS, residente e domiciliada na cidade de Campinas/SP',
      'DIOGO VIEIRA ORLANDO, brasileiro, divorciado, engenheiro ambiental, portador do RG. nº MG-14.837.051 SSP/MG, e inscrito no CPF sob o nº 096.402.496-96, nascido em 14/12/1988, com filiação de LUIS ANTONIO ORLANDO e MARIA TEREZA VIEIRA ORLANDO, residente e domiciliado na cidade de Campinas/SP, e BARBARA SIMINATTI DOS SANTOS, brasileira, solteira, maior, servidora pública municipal, portadora do RG. nº 36.153.912-5 SSP/SP, e inscrita no CPF sob o nº 395.076.738-06, nascida em 02/07/1990, com filiação de VALDIR CORREIA DOS SANTOS e VANIR SIMINATTI DOS SANTOS, residente e domiciliada na cidade de Campinas/SP, ambos devidamente qualificados neste instrumento'
    ];
    const nomesResumidos = ['JOÃO SILVA', 'MARIA SANTOS e PEDRO LIMA', 'ANA COSTA', 'CARLOS OLIVEIRA e FERNANDA SOUZA'];
    const celulares = ['19 99999-9999', '19 98888-8888', '19 97777-7777'];
    const emails = ['joao@email.com', 'maria@email.com', 'contato@email.com'];
    const chavesExemplos = ['04 chaves simples', '02 chaves simples, 01 chave tetra', '06 chaves simples'];

    const randomChoice = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const randomNumber = () => Math.floor(Math.random() * 9000) + 1000;
    const randomDate = () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2025, 11, 31);
      const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      return date.toLocaleDateString('pt-BR');
    };

    const testData: Record<string, string> = {
      numeroContrato: randomNumber().toString(),
      endereco: randomChoice(enderecosCompletos),
      dataContrato: randomDate(),
      nomeLocador: randomChoice(nomes),
      qualificacaoLocatarios: randomChoice(qualificacoes),
      nomesResumidos: randomChoice(nomesResumidos),
      celularLocatario: randomChoice(celulares),
      emailLocatario: randomChoice(emails),
      cpfl: Math.random() > 0.5 ? 'SIM' : 'NÃO',
      tipoSegundaDocumento: Math.random() > 0.5 ? 'DAEV' : 'SANASA',
      segundoDocumento: randomChoice(['SIM', 'NÃO', 'No condomínio']),
      tipoQuantidadeChaves: randomChoice(chavesExemplos),
      dataVistoria: randomDate(),
      nomeQuemRetira: randomChoice(nomes),
    };

    setFormData(testData);
    setTouched({});
    setErrors({});
  }, []);

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
    generateTestData,
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
