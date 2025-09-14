import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

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
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  onComplete,
  onStepChange,
  completedSteps = [],
  currentStep: controlledStep,
  showProgress = true,
  allowStepNavigation = true,
  isSubmitting = false,
  submitButtonText = 'Gerar Documento',
}) => {
  const [internalStep, setInternalStep] = useState(0);
  const currentStep =
    controlledStep !== undefined ? controlledStep : internalStep;

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
    <div className="w-full">
      {/* Step Content */}
      <div className="space-y-6">{currentStepData.content}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        <Button
          type="button"
          onClick={handleNext}
          disabled={currentStepData.isValid === false || isSubmitting}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {submitButtonText}
            </>
          ) : (
            <>
              {currentStep === steps.length - 1 ? submitButtonText : 'Próximo'}
              {currentStep < steps.length - 1 && (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FormWizard;
