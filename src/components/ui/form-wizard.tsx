import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  isValid?: boolean;
}

interface FormWizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
  completedSteps?: number[];
  currentStep?: number;
  showProgress?: boolean;
  allowStepNavigation?: boolean;
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  onComplete,
  onStepChange,
  completedSteps = [],
  currentStep: controlledStep,
  showProgress = true,
  allowStepNavigation = true,
}) => {
  const [internalStep, setInternalStep] = useState(0);
  const currentStep = controlledStep !== undefined ? controlledStep : internalStep;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      if (controlledStep === undefined) {
        setInternalStep(nextStep);
      }
      onStepChange?.(nextStep);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      if (controlledStep === undefined) {
        setInternalStep(prevStep);
      }
      onStepChange?.(prevStep);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (allowStepNavigation) {
      if (controlledStep === undefined) {
        setInternalStep(stepIndex);
      }
      onStepChange?.(stepIndex);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Etapa {currentStep + 1} de {steps.length}
            </h2>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            const IconComponent = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(index)}
                  disabled={!allowStepNavigation && !isPast && !isCurrent}
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                    ${isCurrent 
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-110' 
                      : isCompleted || isPast
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-border bg-background text-muted-foreground'
                    }
                    ${allowStepNavigation ? 'hover:scale-105 cursor-pointer' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : IconComponent ? (
                    <IconComponent className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-1 ${isPast || isCompleted ? 'bg-green-500' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {currentStepData.icon && (
              <div className="p-2 bg-primary/10 rounded-lg">
                <currentStepData.icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
              {currentStepData.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentStepData.description}
                </p>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Content */}
          <div className="min-h-[200px]">
            {currentStepData.content}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} / {steps.length}
              </span>
            </div>

            <Button
              type="button"
              onClick={handleNext}
              disabled={currentStepData.isValid === false}
              className="gap-2 bg-gradient-primary hover:opacity-90"
            >
              {currentStep === steps.length - 1 ? 'Gerar Documento' : 'Próximo'}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormWizard;
