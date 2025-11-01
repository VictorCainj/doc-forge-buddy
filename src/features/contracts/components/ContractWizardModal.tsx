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
import { splitNames } from '@/utils/nameHelpers';
import { FormStep, FormField } from '@/hooks/use-form-wizard';
import { useContractWizard } from '../hooks/useContractWizard';
import { ChevronLeft, ChevronRight, FileText } from '@/utils/iconMapper';
import { Check } from 'lucide-react';
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

  // Estados para detectar scroll
  const [_hasScroll, setHasScroll] = useState(false);
  const [_isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  // Estado e ref para detectar scroll
  const scrollRef = useRef<HTMLDivElement>(null);

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
        const nomesLocadores = splitNames(initialData.nomeProprietario);
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
        const nomesLocatarios = splitNames(initialData.nomeLocatario);
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
        const nomesFiadores = splitNames(initialData.nomeFiador);
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
      'focus:border-neutral-600 focus:ring-2 focus:ring-neutral-500/20',
      'hover:border-neutral-400',
      'transition-all duration-200 rounded-lg',
      'w-full min-w-0' // Garantir largura completa e permitir shrink
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
            className={cn(
              fieldClasses,
              'min-h-[80px] max-h-[120px] resize-none'
            )}
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
      <DialogContent className="max-w-4xl p-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 border border-neutral-200 shadow-2xl overflow-visible rounded-2xl">
        {/* Header Google Material Design 3 - Professional */}
        <DialogHeader className="relative px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-neutral-900 tracking-tight">
              {title}
            </DialogTitle>
          </div>

          {/* Progress bar - Tons Neutros com gradiente */}
          <div className="mt-3 relative">
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-neutral-600 dark:bg-neutral-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-neutral-600">
              <span className="font-medium">
                Etapa {currentStep + 1} de {steps.length}
              </span>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Stage indicators - Google Material Design - Professional */}
        <div className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-b border-neutral-200">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;

            // Lógica melhorada para determinar se etapa está concluída
            const isCompleted =
              index < currentStep ||
              (() => {
                // Se é a etapa atual ou anterior, verifica se todos os campos obrigatórios estão preenchidos
                const requiredFields = step.fields.filter(
                  (field) => field.required
                );
                const allFieldsFilled = requiredFields.every((field) => {
                  const value = formData[field.name];
                  return value !== undefined && value.trim() !== '';
                });

                return allFieldsFilled;
              })();

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={cn(
                  'relative group transition-all duration-200',
                  'flex flex-col items-center gap-1.5 p-2 rounded-lg',
                  isActive && 'bg-neutral-100 dark:bg-neutral-800',
                  !isActive && 'hover:bg-neutral-50'
                )}
              >
                {/* Ícone */}
                <div
                  className={cn(
                    'relative w-9 h-9 flex items-center justify-center transition-all duration-200',
                    isActive && 'bg-neutral-200 dark:bg-neutral-700 rounded-lg',
                    !isActive &&
                      isCompleted &&
                      'bg-green-500 rounded-full shadow-md',
                    !isActive &&
                      !isCompleted &&
                      'bg-white border-2 border-neutral-300 rounded-lg hover:border-neutral-400'
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-5 w-5 text-white stroke-2" />
                  ) : (
                    Icon && (
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          isActive && 'text-neutral-700 dark:text-neutral-300',
                          !isActive && 'text-neutral-600'
                        )}
                      />
                    )
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-200',
                    isActive && 'text-neutral-700 dark:text-neutral-300',
                    !isActive && 'text-neutral-600'
                  )}
                >
                  {step.title.split(' ')[0]}
                </span>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-[25px] left-full w-8 h-0.5 transition-all duration-200 -z-10',
                      index < currentStep ? 'bg-green-500' : 'bg-neutral-300'
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
              className="p-3 space-y-3"
            >
              {/* Step info - Google Material Design - Professional */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-neutral-900">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  {currentStepData.description}
                </p>
              </div>

              {/* Content com scroll - altura dinâmica baseada em viewport */}
              <div className="relative">
                <div
                  ref={scrollRef}
                  className={cn(
                    'overflow-y-auto pr-1 custom-scrollbar smooth-scroll',
                    'max-h-[calc(100vh-550px)] min-h-[350px]'
                  )}
                >
                  {/* Person Managers */}
                  {currentStepData.id === 'locador' && (
                    <div className="mb-3">
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
                    <div className="mb-3">
                      <PersonManager
                        title="Locatário(s)"
                        people={locatarios}
                        onPeopleChange={setLocatarios}
                        placeholder="Nome completo do locatário"
                        maxPeople={4}
                      />
                    </div>
                  )}

                  {currentStepData.id === 'garantia' &&
                    formData.tipoGarantia === 'Fiador' && (
                      <div className="mb-3">
                        <PersonManager
                          title="Fiador(es)"
                          people={fiadores}
                          onPeopleChange={setFiadores}
                          placeholder="Nome completo do fiador"
                          maxPeople={4}
                        />
                      </div>
                    )}

                  {/* Fields - Grid responsivo ultra compacto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            'space-y-1',
                            field.type === 'textarea' && 'md:col-span-2',
                            field.name === 'enderecoImovel' && 'md:col-span-2',
                            field.name === 'qualificacaoCompletaLocadores' &&
                              'md:col-span-2',
                            field.name === 'qualificacaoCompletaLocatarios' &&
                              'md:col-span-2'
                          )}
                        >
                          <Label
                            htmlFor={field.name}
                            className="text-neutral-700 font-medium flex items-center gap-0.5 text-xs"
                          >
                            {field.label}
                            {field.required && (
                              <span className="text-error-500 text-xs">*</span>
                            )}
                          </Label>
                          {renderField(field)}
                          {field.tooltip && (
                            <p className="text-[10px] text-neutral-700 italic">
                              {field.tooltip}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Google Material Design - Professional */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-white">
          {/* Botão Anterior - Professional */}
          <Button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            variant="ghost"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-700 text-sm font-medium',
              'border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400',
              'disabled:opacity-0 disabled:pointer-events-none',
              'transition-all duration-200'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          {/* Indicador de progresso no centro */}
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="font-medium">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          {/* Botão Próximo ou Finalizar - Professional */}
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid || isSubmitting}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium',
                'bg-blue-600 hover:bg-blue-700',
                'shadow-sm hover:shadow-md',
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
                  <Check className="h-4 w-4" color="white" />
                  {submitButtonText}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium',
                'bg-blue-600 hover:bg-blue-700',
                'shadow-sm hover:shadow-md',
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
