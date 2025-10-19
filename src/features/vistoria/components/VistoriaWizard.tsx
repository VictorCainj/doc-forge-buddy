import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Home,
  ClipboardList,
  Calculator,
  Eye,
} from '@/utils/iconMapper';
import { CheckCircle } from 'lucide-react';
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
    description: 'Informações do contrato e vistoria',
  },
  {
    id: 2,
    title: 'Ambientes',
    icon: Home,
    description: 'Fotos e descrição dos ambientes',
  },
  {
    id: 3,
    title: 'Apontamentos',
    icon: ClipboardList,
    description: 'Itens a reparar ou observar',
  },
  {
    id: 4,
    title: 'Orçamento',
    icon: Calculator,
    description: 'Valores e prestadores',
  },
  {
    id: 5,
    title: 'Revisão',
    icon: Eye,
    description: 'Revisar e gerar documento',
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
  onCancel,
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
        return (
          <Step1DadosBasicos
            data={data}
            updateData={updateData}
            errors={errors}
          />
        );
      case 2:
        return (
          <Step2Ambientes data={data} updateData={updateData} errors={errors} />
        );
      case 3:
        return (
          <Step3Apontamentos
            data={data}
            updateData={updateData}
            errors={errors}
          />
        );
      case 4:
        return (
          <Step4Orcamento data={data} updateData={updateData} errors={errors} />
        );
      case 5:
        return <Step5Revisao data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 space-y-3">
      {/* Header com Steps */}
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardContent className="pt-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-neutral-700">
                Progresso
              </span>
              <span className="text-xs font-bold text-primary-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
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
                      relative group transition-all duration-200
                      flex flex-col items-center gap-1 p-2 rounded-lg
                      ${isActive ? 'bg-primary-50 border border-primary-300' : ''}
                      ${!isActive && 'border border-transparent hover:border-neutral-300 hover:bg-white'}
                      ${step.id > currentStep ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div
                      className={`
                      relative w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shadow-elevation-1
                      ${isActive ? 'bg-primary-500 border border-primary-500' : ''}
                      ${isCompleted ? 'bg-success-500 border border-success-500' : ''}
                      ${!isActive && !isCompleted ? 'bg-white border border-neutral-300' : ''}
                    `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-white" color="white" />
                      ) : (
                        <Icon
                          className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-700'}`}
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-neutral-900' : 'text-neutral-700'}`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[8px] text-neutral-700 hidden md:block">
                        {step.description}
                      </p>
                    </div>
                  </button>

                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                      absolute top-5 left-full w-7 h-0.5 transition-all duration-200
                      ${isCompleted ? 'bg-success-400' : 'bg-neutral-300'}
                    `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content - altura dinâmica baseada em viewport */}
      <Card>
        <CardContent className="pt-4 max-h-[calc(100vh-500px)] min-h-[300px] overflow-y-auto custom-scrollbar smooth-scroll">
          <CurrentStepComponent />
        </CardContent>
      </Card>

      {/* Navigation - Material Design */}
      <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
        <div className="flex gap-1.5">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              className="gap-1.5 text-neutral-700 text-sm px-2 py-1.5 hover:bg-neutral-100 transition-all duration-200"
            >
              Cancelar
            </Button>
          )}

          {canGoPrev && (
            <Button
              variant="ghost"
              onClick={prevStep}
              className="gap-1.5 text-neutral-700 text-sm px-2 py-1.5 hover:bg-neutral-100 transition-all duration-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-700 font-medium">
            {currentStep} / {STEPS.length}
          </span>
        </div>

        <Button
          onClick={handleNext}
          className="gap-1.5 bg-primary-500 text-white px-3 py-1.5 text-sm hover:bg-primary-600 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200"
        >
          {isLastStep ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Finalizar
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
