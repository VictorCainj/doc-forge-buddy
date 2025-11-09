import React, { useState, ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from '@/utils/iconMapper';
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
        className="absolute inset-0 rounded-full bg-neutral-200"
      />

      <motion.div
        initial={false}
        variants={{
          inactive: {
            backgroundColor: 'rgb(245, 245, 245)',
            borderColor: 'rgb(229, 229, 229)',
            color: 'rgb(115, 115, 115)',
          },
          active: {
            backgroundColor: 'rgb(23, 23, 23)',
            borderColor: 'rgb(23, 23, 23)',
            color: 'rgb(255, 255, 255)',
            boxShadow: '0 0 0 4px rgba(23, 23, 23, 0.1)',
          },
          complete: {
            backgroundColor: 'rgb(23, 23, 23)',
            borderColor: 'rgb(23, 23, 23)',
            color: 'rgb(255, 255, 255)',
            boxShadow: '0 0 0 4px rgba(23, 23, 23, 0.15)',
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
      {/* Step Progress - Ultra Compacto */}
      <div className="flex justify-between rounded p-3 mb-3">
        {steps.map((stepData, index) => (
          <Step
            key={index}
            step={index + 1}
            currentStep={currentStep + 1}
            stepData={stepData}
          />
        ))}
      </div>

      {/* Step Content - altura dinâmica baseada em viewport - Ultra Compacto */}
      <div className="space-y-3 mb-4">
        <div className="text-center mb-3">
          <div className="flex items-center justify-center mb-1.5">
            {currentStepData.icon && (
              <div className="bg-neutral-100 p-2 rounded-full mr-2">
                <currentStepData.icon className="h-5 w-5 text-neutral-700" />
              </div>
            )}
            <h2 className="text-lg font-semibold text-neutral-900">
              {currentStepData.title}
            </h2>
          </div>
          {currentStepData.description && (
            <p className="text-xs text-neutral-600 font-normal">
              {currentStepData.description}
            </p>
          )}
        </div>
        <div className="max-h-[calc(100vh-400px)] min-h-[400px] overflow-y-auto pr-1 custom-scrollbar smooth-scroll">
          {currentStepData.content}
        </div>
      </div>

      {/* Navigation Buttons - Ultra Compacto */}
      <div className="flex justify-between items-center pt-3 mt-3 border-t border-neutral-200">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`${
            currentStep === 0 ? 'pointer-events-none opacity-50' : ''
          } duration-350 rounded px-2 py-1 text-sm text-neutral-600 transition hover:text-neutral-900 flex items-center gap-1.5`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Anterior
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-600 font-medium">
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
          } bg duration-350 flex items-center justify-center rounded-lg bg-neutral-900 py-1.5 px-3 text-sm font-medium tracking-tight text-white transition hover:bg-neutral-800 active:bg-neutral-700 gap-1.5 shadow-sm`}
        >
          {isSubmitting ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {submitButtonText}
            </>
          ) : (
            <>
              {currentStep === steps.length - 1 ? submitButtonText : 'Próximo'}
              {currentStep < steps.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FormWizard;
