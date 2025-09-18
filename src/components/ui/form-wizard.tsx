import React, { useState, ComponentProps } from 'react';
import { motion } from 'framer-motion';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Progress } from '@/components/ui/progress';
// import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

function Step({ step, currentStep }: { step: number; currentStep: number }) {
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
        className="absolute inset-0 rounded-full bg-blue-200"
      />

      <motion.div
        initial={false}
        variants={{
          inactive: {
            backgroundColor: '#fff',
            borderColor: '#e5e5e5',
            color: '#a3a3a3',
          },
          active: {
            backgroundColor: '#fff',
            borderColor: '#3b82f6',
            color: '#3b82f6',
          },
          complete: {
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            color: '#3b82f6',
          },
        }}
        transition={{ duration: 0.2 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold"
      >
        <div className="flex items-center justify-center">
          {status === 'complete' ? (
            <CheckIcon className="h-6 w-6 text-white" />
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
        {steps.map((_, index) => (
          <Step key={index} step={index + 1} currentStep={currentStep + 1} />
        ))}
      </div>

      {/* Step Content */}
      <div className="space-y-6 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-gray-600">{currentStepData.description}</p>
          )}
        </div>
        {currentStepData.content}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`${
            currentStep === 0 ? 'pointer-events-none opacity-50' : ''
          } duration-350 rounded px-2 py-1 text-neutral-400 transition hover:text-neutral-700`}
        >
          Anterior
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
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
          } bg duration-350 flex items-center justify-center rounded-full bg-blue-500 py-1.5 px-3.5 font-medium tracking-tight text-white transition hover:bg-blue-600 active:bg-blue-700`}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              {submitButtonText}
            </>
          ) : (
            <>
              {currentStep === steps.length - 1 ? submitButtonText : 'Próximo'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FormWizard;
