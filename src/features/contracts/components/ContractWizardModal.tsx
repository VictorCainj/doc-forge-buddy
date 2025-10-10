import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PersonManager } from '@/components/ui/person-manager';
import { FormStep, FormField } from '@/hooks/use-form-wizard';
import { useContractWizard } from '../hooks/useContractWizard';
import { ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Person {
  id: string;
  name: string;
}

interface ContractWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: FormStep[];
  initialData?: Record<string, string>;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
  title?: string;
}

/**
 * Modal de wizard de contratos com design Google Material
 * Navegação por setas laterais e visual minimalista
 */
export const ContractWizardModal: React.FC<ContractWizardModalProps> = ({
  open,
  onOpenChange,
  steps,
  initialData,
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Finalizar',
  title = 'Novo Contrato',
}) => {
  // Estados para gerenciar pessoas
  const [locadores, setLocadores] = useState<Person[]>([]);
  const [locatarios, setLocatarios] = useState<Person[]>([]);
  const [fiadores, setFiadores] = useState<Person[]>([]);

  // Estado e ref para detectar scroll
  const [hasScroll, setHasScroll] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFooterShadow, setShowFooterShadow] = useState(false);

  const {
    currentStep,
    formData,
    isStepValid,
    canGoNext: _canGoNext,
    canGoPrevious,
    progress,
    goToStep,
    nextStep,
    previousStep,
    updateFieldValue,
  } = useContractWizard(steps, initialData);

  const currentStepData = steps[currentStep];

  // Inicializar pessoas a partir dos dados iniciais
  useEffect(() => {
    if (initialData) {
      // Inicializar locadores
      if (initialData.nomeProprietario && locadores.length === 0) {
        const nomesLocadores = initialData.nomeProprietario
          .split(/ e | E /)
          .map((nome) => nome.trim())
          .filter((nome) => nome);
        const locadoresIniciais = nomesLocadores.map((nome, index) => ({
          id: `locador-${index}`,
          name: nome,
        }));
        if (locadoresIniciais.length > 0) {
          setLocadores(locadoresIniciais);
        }
      }

      // Inicializar locatários
      if (initialData.nomeLocatario && locatarios.length === 0) {
        const nomesLocatarios = initialData.nomeLocatario
          .split(/ e | E /)
          .map((nome) => nome.trim())
          .filter((nome) => nome);
        const locatariosIniciais = nomesLocatarios.map((nome, index) => ({
          id: `locatario-${index}`,
          name: nome,
        }));
        if (locatariosIniciais.length > 0) {
          setLocatarios(locatariosIniciais);
        }
      }

      // Inicializar fiadores
      if (initialData.nomeFiador && fiadores.length === 0) {
        const nomesFiadores = initialData.nomeFiador
          .split(/ e | E /)
          .map((nome) => nome.trim())
          .filter((nome) => nome);
        const fiadoresIniciais = nomesFiadores.map((nome, index) => ({
          id: `fiador-${index}`,
          name: nome,
        }));
        if (fiadoresIniciais.length > 0) {
          setFiadores(fiadoresIniciais);
        }
      }
    }
  }, [initialData]);

  // Sincronizar dados das pessoas com o formData
  useEffect(() => {
    // Atualizar dados dos locadores
    if (locadores.length > 0) {
      const nomesLocadoresArray = locadores.map((l) => l.name);
      const nomesLocadores =
        nomesLocadoresArray.length > 1
          ? nomesLocadoresArray.slice(0, -1).join(', ') +
            ' e ' +
            nomesLocadoresArray[nomesLocadoresArray.length - 1]
          : nomesLocadoresArray[0];
      updateFieldValue('nomeProprietario', nomesLocadores);
    }

    // Atualizar dados dos locatários
    if (locatarios.length > 0) {
      const nomesLocatariosArray = locatarios.map((l) => l.name);
      const nomesLocatarios =
        nomesLocatariosArray.length > 1
          ? nomesLocatariosArray.slice(0, -1).join(', ') +
            ' e ' +
            nomesLocatariosArray[nomesLocatariosArray.length - 1]
          : nomesLocatariosArray[0];
      updateFieldValue('nomeLocatario', nomesLocatarios);
    }

    // Atualizar dados dos fiadores
    if (fiadores.length > 0) {
      const nomesFiadoresArray = fiadores.map((f) => f.name);
      const nomesFiadores =
        nomesFiadoresArray.length > 1
          ? nomesFiadoresArray.slice(0, -1).join(', ') +
            ' e ' +
            nomesFiadoresArray[nomesFiadoresArray.length - 1]
          : nomesFiadoresArray[0];
      updateFieldValue('nomeFiador', nomesFiadores);
    }
  }, [locadores, locatarios, fiadores, updateFieldValue]);

  // Detectar se há scroll disponível e posição
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
        const hasScrollContent = scrollHeight > clientHeight;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

        setHasScroll(hasScrollContent);
        setIsScrolledToBottom(isAtBottom);
        // Mostrar sombra no footer se há scroll e não está no final
        setShowFooterShadow(hasScrollContent && !isAtBottom);
      }
    };

    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
      return () => scrollElement.removeEventListener('scroll', checkScroll);
    }
  }, [currentStep, locadores, locatarios, fiadores]);

  // Reset scroll ao mudar de etapa
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  // Renderiza campo baseado no tipo - Google Material Design
  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';

    const fieldClasses = cn(
      'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-500',
      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30',
      'hover:border-neutral-400',
      'transition-all duration-200 rounded-lg'
    );

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => updateFieldValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={cn(fieldClasses, 'min-h-[100px] resize-none')}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => updateFieldValue(field.name, val)}
          >
            <SelectTrigger className={fieldClasses}>
              <SelectValue placeholder={field.placeholder || 'Selecione...'} />
            </SelectTrigger>
            <SelectContent className="bg-white border-neutral-200">
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-neutral-900 hover:bg-neutral-100 focus:bg-neutral-200"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            id={field.name}
            type={field.type || 'text'}
            value={value}
            onChange={(e) => updateFieldValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={fieldClasses}
          />
        );
    }
  };

  // Animações
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    nextStep();
  };

  const handlePrevious = () => {
    setDirection(-1);
    previousStep();
  };

  const handleStepClick = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    goToStep(index);
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-white border border-neutral-200 shadow-elevation-4 overflow-visible rounded-xl">
        {/* Header Google Material Design 3 */}
        <DialogHeader className="relative p-6 border-b border-neutral-200 bg-white">
          <DialogTitle className="text-2xl font-medium text-[#202124] text-center relative z-10">
            {title}
          </DialogTitle>

          {/* Progress bar - Azul Google */}
          <div className="mt-4 relative">
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-700">
              <span className="font-medium">
                Etapa {currentStep + 1} de {steps.length}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
        </DialogHeader>

        {/* Stage indicators - Google Material Design */}
        <div className="flex items-center justify-center gap-2 p-4 bg-[#F8F9FA] border-b border-neutral-200">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={cn(
                  'relative group transition-all duration-200',
                  'flex flex-col items-center gap-1 p-3 rounded-xl',
                  isActive && 'bg-[#E8F0FE] border border-primary-300',
                  !isActive &&
                    'border border-transparent hover:border-neutral-300 hover:bg-white',
                  isCompleted && 'opacity-70'
                )}
              >
                {/* Ícone */}
                <div
                  className={cn(
                    'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-elevation-1',
                    isActive && 'bg-primary-500 border border-primary-500',
                    !isActive &&
                      isCompleted &&
                      'bg-success-500 border border-success-500',
                    !isActive &&
                      !isCompleted &&
                      'bg-white border border-neutral-300'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    Icon && (
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          isActive && 'text-white',
                          !isActive && 'text-neutral-700'
                        )}
                      />
                    )
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-200',
                    isActive && 'text-[#202124]',
                    !isActive && 'text-[#5F6368]'
                  )}
                >
                  {step.title.split(' ')[0]}
                </span>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-8 left-full w-8 h-0.5 transition-all duration-200',
                      isCompleted ? 'bg-success-400' : 'bg-neutral-300'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content area com animação */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="p-6 space-y-6"
            >
              {/* Step info - Google Material Design */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium text-[#202124]">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-[#5F6368] mt-2">
                  {currentStepData.description}
                </p>
              </div>

              {/* Content com scroll - maior para etapas com PersonManager */}
              <div className="relative">
                <div
                  ref={scrollRef}
                  className={cn(
                    'overflow-y-auto pr-2 custom-scrollbar',
                    currentStepData.id === 'locador' ||
                      currentStepData.id === 'locatario'
                      ? 'max-h-[550px]'
                      : 'max-h-[450px]'
                  )}
                >
                  {/* Person Managers */}
                  {currentStepData.id === 'locador' && (
                    <div className="mb-6">
                      <PersonManager
                        title="Locador(es)"
                        people={locadores}
                        onPeopleChange={setLocadores}
                        placeholder="Nome completo do locador"
                        maxPeople={4}
                      />
                    </div>
                  )}

                  {currentStepData.id === 'locatario' && (
                    <div className="mb-6">
                      <PersonManager
                        title="Locatário(s)"
                        people={locatarios}
                        onPeopleChange={setLocatarios}
                        placeholder="Nome completo do locatário"
                        maxPeople={4}
                      />
                    </div>
                  )}

                  {currentStepData.id === 'fiador' &&
                    formData.temFiador === 'sim' && (
                      <div className="mb-6">
                        <PersonManager
                          title="Fiador(es)"
                          people={fiadores}
                          onPeopleChange={setFiadores}
                          placeholder="Nome completo do fiador"
                          maxPeople={4}
                        />
                      </div>
                    )}

                  {/* Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentStepData.fields.map((field) => {
                      // Ocultar campos de nome quando PersonManager estiver sendo usado
                      if (
                        currentStepData.id === 'locador' &&
                        field.name === 'nomeProprietario'
                      ) {
                        return null;
                      }
                      if (
                        currentStepData.id === 'locatario' &&
                        field.name === 'nomeLocatario'
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={field.name}
                          className={cn(
                            'space-y-2',
                            field.type === 'textarea' && 'md:col-span-2'
                          )}
                        >
                          <Label
                            htmlFor={field.name}
                            className="text-[#5F6368] font-medium flex items-center gap-1 text-sm"
                          >
                            {field.label}
                            {field.required && (
                              <span className="text-error-500 text-sm">*</span>
                            )}
                          </Label>
                          {renderField(field)}
                          {field.tooltip && (
                            <p className="text-xs text-[#5F6368] italic">
                              {field.tooltip}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Indicador de mais conteúdo abaixo - Google Material */}
                {hasScroll && !isScrolledToBottom && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
                    <div className="flex items-center gap-1 text-primary-600 text-xs animate-bounce font-medium">
                      <ChevronDown className="h-4 w-4" />
                      <span>Role para ver mais</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Google Material Design - Sempre visível */}
        <div
          className={cn(
            'flex items-center justify-between p-6 border-t border-neutral-200 bg-white',
            'transition-shadow duration-200',
            showFooterShadow && 'shadow-elevation-2'
          )}
        >
          {/* Botão Anterior */}
          <Button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            variant="ghost"
            className={cn(
              'gap-2 text-neutral-700',
              'hover:bg-neutral-100',
              'disabled:opacity-0 disabled:pointer-events-none',
              'transition-all duration-200'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          {/* Indicador de progresso no centro */}
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <span className="font-medium">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          {/* Botão Próximo ou Finalizar - Azul Google */}
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid || isSubmitting}
              className={cn(
                'gap-2 bg-primary-500 text-white px-6',
                'hover:bg-primary-600',
                'shadow-elevation-1 hover:shadow-elevation-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {submitButtonText}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid}
              className={cn(
                'gap-2 bg-primary-500 text-white px-6',
                'hover:bg-primary-600',
                'shadow-elevation-1 hover:shadow-elevation-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
