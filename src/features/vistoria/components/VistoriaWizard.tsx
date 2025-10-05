import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  Home, 
  ClipboardList, 
  Calculator, 
  Eye 
} from 'lucide-react';
import { useVistoriaWizard } from '../hooks/useVistoriaWizard';
import { Step1DadosBasicos } from './steps/Step1DadosBasicos';
import { Step2Ambientes } from './steps/Step2Ambientes';
import { Step3Apontamentos } from './steps/Step3Apontamentos';
import { Step4Orcamento } from './steps/Step4Orcamento';
import { Step5Revisao } from './steps/Step5Revisao';

const STEPS = [
  { 
    id: 1, 
    title: 'Dados Básicos', 
    icon: FileText,
    description: 'Informações do contrato e vistoria'
  },
  { 
    id: 2, 
    title: 'Ambientes', 
    icon: Home,
    description: 'Fotos e descrição dos ambientes'
  },
  { 
    id: 3, 
    title: 'Apontamentos', 
    icon: ClipboardList,
    description: 'Itens a reparar ou observar'
  },
  { 
    id: 4, 
    title: 'Orçamento', 
    icon: Calculator,
    description: 'Valores e prestadores'
  },
  { 
    id: 5, 
    title: 'Revisão', 
    icon: Eye,
    description: 'Revisar e gerar documento'
  },
];

interface VistoriaWizardProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

/**
 * Wizard multi-step para criação de análises de vistoria
 * Divide o processo em 5 etapas claras e organizadas
 */
export const VistoriaWizard: React.FC<VistoriaWizardProps> = ({ 
  onComplete, 
  onCancel 
}) => {
  const {
    currentStep,
    data,
    errors,
    progress,
    canGoPrev,
    isLastStep,
    updateData,
    nextStep,
    prevStep,
    goToStep,
  } = useVistoriaWizard();

  const handleNext = async () => {
    const success = await nextStep();
    
    if (success && isLastStep) {
      // Se chegou no último step e avançou, significa que finalizou
      onComplete?.(data);
    }
  };

  const CurrentStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <Step1DadosBasicos data={data} updateData={updateData} errors={errors} />;
      case 2:
        return <Step2Ambientes data={data} updateData={updateData} errors={errors} />;
      case 3:
        return <Step3Apontamentos data={data} updateData={updateData} errors={errors} />;
      case 4:
        return <Step4Orcamento data={data} updateData={updateData} errors={errors} />;
      case 5:
        return <Step5Revisao data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header com Steps */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">
                Progresso
              </span>
              <span className="text-sm font-bold text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Navigation */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={step.id > currentStep}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-lg transition-all
                      ${isActive ? 'bg-blue-100 ring-2 ring-blue-500' : ''}
                      ${isCompleted ? 'cursor-pointer hover:bg-green-50' : ''}
                      ${step.id > currentStep ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-blue-600 text-white shadow-lg' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500 hidden md:block">
                        {step.description}
                      </p>
                    </div>
                  </button>
                  
                  {index < STEPS.length - 1 && (
                    <div className={`
                      flex-1 h-1 mx-2 rounded
                      ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}
                    `} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6 min-h-[500px]">
          <CurrentStepComponent />
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          
          {canGoPrev && (
            <Button
              variant="outline"
              onClick={prevStep}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          )}
        </div>
        
        <Button
          onClick={handleNext}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          {isLastStep ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
