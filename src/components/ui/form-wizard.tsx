import React, { useState, ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Progress } from '@/components/ui/progress';

function Step({
  step,
  currentStep,
  stepData,
}: {
  step: number;
  currentStep: number;
  stepData?: WizardStep;
}) {
  const status =
    currentStep === step
      ? 'active'
      : currentStep < step
        ? 'inactive'
        : 'complete';

  return (
    <motion.div animate={status} className="relative">
      <motion.div
        variants={{
          active: {
            scale: 1,
            transition: {
              delay: 0,
              duration: 0.2,
            },
          },
          complete: {
            scale: 1.25,
          },
        }}
        transition={{
          duration: 0.6,
          delay: 0.2,
          type: 'tween',
          ease: 'circOut',
        }}
        className="absolute inset-0 rounded-full bg-primary/20"
      />

      <motion.div
        initial={false}
        variants={{
          inactive: {
            backgroundColor: 'hsl(var(--muted))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          },
          active: {
            backgroundColor: 'hsl(var(--primary))',
            borderColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 0 0 4px hsl(var(--primary) / 0.2)',
          },
          complete: {
            backgroundColor: 'hsl(var(--primary))',
            borderColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 0 0 4px hsl(var(--primary) / 0.3)',
          },
        }}
        transition={{ duration: 0.2 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold"
      >
        <div className="flex items-center justify-center">
          {status === 'complete' ? (
            <CheckIcon className="h-6 w-6 text-white" />
          ) : stepData?.icon ? (
            <stepData.icon className="h-5 w-5" />
          ) : (
            <span>{step}</span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CheckIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.2,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3,
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

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
  completedSteps: _completedSteps = [],
  currentStep: controlledStep,
  showProgress: _showProgress = true,
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

  const _goToStep = (_stepIndex: number) => {
    if (allowStepNavigation) {
      if (controlledStep === undefined) {
        // setInternalStep(stepIndex);
      }
      // onStepChange?.(stepIndex);
    }
  };

  // const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="w-full">
      {/* Step Progress */}
      <div className="flex justify-between rounded p-8 mb-6">
        {steps.map((stepData, index) => (
          <Step
            key={index}
            step={index + 1}
            currentStep={currentStep + 1}
            stepData={stepData}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="space-y-6 mb-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            {currentStepData.icon && (
              <div className="bg-primary/10 p-3 rounded-full mr-3">
                <currentStepData.icon className="h-6 w-6 text-primary" />
              </div>
            )}
            <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {currentStepData.title}
            </h2>
          </div>
          {currentStepData.description && (
            <p className="text-foreground/80 font-medium">
              {currentStepData.description}
            </p>
          )}
        </div>
        {currentStepData.content}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-8 mt-8 border-t border-border">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`${
            currentStep === 0 ? 'pointer-events-none opacity-50' : ''
          } duration-350 rounded px-2 py-1 text-muted-foreground transition hover:text-foreground flex items-center gap-2`}
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentStepData.isValid === false || isSubmitting}
          className={`${
            currentStepData.isValid === false || isSubmitting
              ? 'pointer-events-none opacity-50'
              : ''
          } bg duration-350 flex items-center justify-center rounded-full bg-primary py-1.5 px-3.5 font-medium tracking-tight text-primary-foreground transition hover:bg-primary/90 active:bg-primary/80 gap-2`}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              {submitButtonText}
            </>
          ) : (
            <>
              {currentStep === steps.length - 1 ? submitButtonText : 'Próximo'}
              {currentStep < steps.length - 1 && (
                <ArrowRight className="h-4 w-4" />
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FormWizard;
