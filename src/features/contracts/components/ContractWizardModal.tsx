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
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
} from 'lucide-react';
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
 * Modal de wizard de contratos com design tecnológico/gaming
 * Navegação por setas laterais e visual futurista
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

  const {
    currentStep,
    formData,
    isStepValid,
    canGoNext,
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
          .filter(nome => nome);
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
          .filter(nome => nome);
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
          .filter(nome => nome);
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
        setHasScroll(scrollHeight > clientHeight);
        setIsScrolledToBottom(scrollHeight - scrollTop - clientHeight < 10);
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

  // Renderiza campo baseado no tipo
  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';

    const fieldClasses = cn(
      'bg-slate-800/50 border-blue-500/30 text-white placeholder:text-slate-400',
      'focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20',
      'transition-all duration-300'
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
            <SelectContent className="bg-slate-900 border-blue-500/30">
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white hover:bg-blue-500/20 focus:bg-blue-500/30"
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
      <DialogContent className="max-w-4xl p-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border border-blue-500/20 shadow-xl overflow-visible">
        {/* Header profissional */}
        <DialogHeader className="relative p-6 border-b border-blue-500/20 bg-slate-900/80">
          <DialogTitle className="text-2xl font-bold text-white text-center relative z-10">
            {title}
          </DialogTitle>
          
          {/* Progress bar */}
          <div className="mt-4 relative">
            <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Etapa {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </DialogHeader>

        {/* Stage indicators */}
        <div className="flex items-center justify-center gap-2 p-4 bg-slate-900/50 border-b border-blue-500/20">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={cn(
                  'relative group transition-all duration-300',
                  'flex flex-col items-center gap-1 p-3 rounded-lg',
                  isActive && 'bg-blue-500/10 border border-blue-400/50',
                  !isActive && 'border border-transparent hover:border-blue-500/20',
                  isCompleted && 'opacity-60'
                )}
              >
                {/* Ícone */}
                <div
                  className={cn(
                    'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
                    isActive && 'bg-blue-600 border border-blue-400',
                    !isActive && isCompleted && 'bg-slate-700 border border-slate-600',
                    !isActive && !isCompleted && 'bg-slate-800 border border-slate-700'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-blue-300" />
                  ) : (
                    Icon && <Icon className={cn(
                      'h-5 w-5',
                      isActive && 'text-white',
                      !isActive && 'text-slate-400'
                    )} />
                  )}
                </div>
                
                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-300',
                    isActive && 'text-blue-300',
                    !isActive && 'text-slate-400'
                  )}
                >
                  {step.title.split(' ')[0]}
                </span>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-8 left-full w-8 h-0.5 transition-all duration-300',
                      isCompleted ? 'bg-blue-500/50' : 'bg-slate-700/50'
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
              {/* Step info */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  {currentStepData.description}
                </p>
              </div>

              {/* Content com scroll - maior para etapas com PersonManager */}
              <div className="relative">
                <div 
                  ref={scrollRef}
                  className={cn(
                    "overflow-y-auto pr-2 custom-scrollbar",
                    (currentStepData.id === 'locador' || currentStepData.id === 'locatario') 
                      ? "max-h-[550px]" 
                      : "max-h-[450px]"
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

                {currentStepData.id === 'fiador' && formData.temFiador === 'sim' && (
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
                  if (currentStepData.id === 'locador' && field.name === 'nomeProprietario') {
                    return null;
                  }
                  if (currentStepData.id === 'locatario' && field.name === 'nomeLocatario') {
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
                        className="text-slate-300 font-medium flex items-center gap-1"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-blue-400 text-xs">*</span>
                        )}
                      </Label>
                      {renderField(field)}
                      {field.tooltip && (
                        <p className="text-xs text-slate-500 italic">
                          {field.tooltip}
                        </p>
                      )}
                    </div>
                  );
                })}
                </div>
                </div>
                
                {/* Indicador de mais conteúdo abaixo */}
                {hasScroll && !isScrolledToBottom && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none flex items-end justify-center pb-2">
                    <div className="flex items-center gap-1 text-blue-400 text-xs animate-bounce">
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

        {/* Botões de navegação lateral - Fora do modal */}
        {/* Botão Anterior - Esquerda */}
        {canGoPrevious && (
          <button
            onClick={handlePrevious}
            className={cn(
              'absolute -left-20 top-1/2 -translate-y-1/2 z-20',
              'w-14 h-14 rounded-full',
              'bg-slate-800/90 backdrop-blur-sm border-2 border-blue-500/40',
              'flex items-center justify-center',
              'hover:bg-slate-700 hover:border-blue-400/60 hover:scale-110',
              'transition-all duration-300',
              'shadow-xl shadow-black/50'
            )}
            aria-label="Etapa anterior"
          >
            <ChevronLeft className="h-7 w-7 text-blue-400" />
          </button>
        )}

        {/* Botão Próximo - Direita */}
        {currentStep < steps.length - 1 && (
          <button
            onClick={handleNext}
            disabled={!isStepValid}
            className={cn(
              'absolute -right-20 top-1/2 -translate-y-1/2 z-20',
              'w-14 h-14 rounded-full',
              'bg-blue-600/90 backdrop-blur-sm border-2 border-blue-400/60',
              'flex items-center justify-center',
              'hover:bg-blue-500 hover:border-blue-300 hover:scale-110',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
              'transition-all duration-300',
              'shadow-xl shadow-blue-900/50'
            )}
            aria-label="Próxima etapa"
          >
            <ChevronRight className="h-7 w-7 text-white" />
          </button>
        )}

        {/* Footer apenas com botão Finalizar */}
        {currentStep === steps.length - 1 && (
          <div className="flex items-center justify-center p-6 border-t border-blue-500/20 bg-slate-900/80">
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid || isSubmitting}
              className={cn(
                'gap-2 bg-blue-600 text-white px-8',
                'hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-300'
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
