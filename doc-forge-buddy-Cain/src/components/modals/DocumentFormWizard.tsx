import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Home,
  User,
  Users,
  FileCheck,
  Search,
  Check,
} from '@/utils/iconMapper';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { FormWizard, WizardStep } from '@/components/ui/form-wizard';
import { formLogger } from '@/utils/logger';
import {
  useFormWizard,
  FormStep as FormStepType,
} from '@/hooks/use-form-wizard';
import {
  useDocumentFormState,
  useDocumentPreview,
  useFontSizeAdjustment,
  usePersonManagement,
} from '@/features/documents/hooks';
import {
  DocumentPreview,
  FormStepContent,
} from '@/features/documents/components';
import { replaceTemplateVariables } from '@/features/documents/utils';

interface DocumentFormWizardProps {
  title: string;
  description: string;
  steps: FormStepType[];
  template: string;
  getTemplate?: (fontSize: number) => string;
  onGenerate: (
    data: Record<string, string>
  ) => Record<string, string> | void | Promise<Record<string, string>>;
  initialData?: Record<string, string>;
  termId?: string;
  isEditing?: boolean;
  contractData?: Record<string, string>;
  onFormDataChange?: (data: Record<string, string>) => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  externalFormData?: Record<string, string>;
  hideSaveButton?: boolean;
}

const DocumentFormWizard: React.FC<DocumentFormWizardProps> = ({
  title,
  steps,
  template,
  getTemplate,
  onGenerate,
  initialData,
  termId,
  isEditing = false,
  contractData = {},
  onFormDataChange,
  isSubmitting = false,
  submitButtonText = 'Gerar Documento',
  externalFormData = {},
  hideSaveButton = false,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Hook para ajuste de fonte
  const {
    fontSize: dynamicFontSize,
    increaseFont: handleIncreaseFont,
    decreaseFont: handleDecreaseFont,
    checkAndAdjustFontSize,
  } = useFontSizeAdjustment(14);

  // Hook para preview e impressão
  const {
    showPreview,
    saving,
    processedFormData,
    setShowPreview,
    setProcessedFormData,
    handlePrint,
    handleSave,
  } = useDocumentPreview({
    title,
    template,
    getTemplate,
    termId,
    isEditing,
  });

  // Verificar se há etapas que usam PersonManager
  const hasPersonManagerSteps = steps.some(
    (step) =>
      step.id === 'locador' || step.id === 'locatario' || step.id === 'garantia'
  );

  // Hook principal do formulário
  const {
    currentStep,
    formData,
    completedSteps,
    isFormValid,
    updateField,
    goToStep,
    getFieldError,
    isFieldTouched,
  } = useFormWizard({
    steps,
    initialData: externalFormData || initialData,
    contractData: contractData || {},
  });

  // Hook para gerenciar pessoas (locadores, locatários, fiadores)
  const {
    locadores,
    locatarios,
    fiadores,
    setLocadores,
    setLocatarios,
    setFiadores,
  } = usePersonManagement({
    initialData,
    hasPersonManagerSteps,
    updateField,
  });

  // Hook para auto-preenchimento e estado do formulário
  useDocumentFormState({
    formData,
    contractData,
    updateField,
  });

  // Chamar onFormDataChange quando os dados do formulário mudarem
  useEffect(() => {
    if (onFormDataChange && formData) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const handleStepChange = (stepIndex: number) => {
    goToStep(stepIndex);
  };

  const handleComplete = async () => {
    if (isFormValid && !isSubmitting) {
      try {
        const processedData = await onGenerate(formData);

        // Se processedData é undefined ou null, não prosseguir
        if (!processedData) {
          return;
        }

        const finalData = { ...formData, ...processedData };
        setProcessedFormData(finalData);

        // Verificar e ajustar o tamanho da fonte se necessário
        const templateContent = getTemplate
          ? getTemplate(dynamicFontSize)
          : template;
        const documentContent = replaceTemplateVariables(
          templateContent,
          finalData
        );
        const adjustedFontSize = checkAndAdjustFontSize(
          documentContent,
          dynamicFontSize
        );

        if (adjustedFontSize !== dynamicFontSize) {
          toast({
            title: 'Ajuste automático aplicado',
            description: `O tamanho da fonte foi reduzido para ${adjustedFontSize}px para caber em uma página.`,
          });
        }

        setShowPreview(true);

        // Verificação adicional após o preview ser exibido
        setTimeout(() => {
          const documentElement = document.getElementById('document-content');
          if (documentElement) {
            const contentHeight = documentElement.offsetHeight;
            const maxHeight = 1050;

            if (contentHeight > maxHeight && dynamicFontSize > 10) {
              const newFontSize = checkAndAdjustFontSize(
                documentElement.innerHTML,
                dynamicFontSize
              );
              if (newFontSize !== dynamicFontSize) {
                toast({
                  title: 'Ajuste adicional aplicado',
                  description: `O tamanho da fonte foi reduzido para ${newFontSize}px para garantir que caiba em uma página.`,
                });
              }
            }
          }
        }, 100);
      } catch (error: unknown) {
        // Se o erro for de validação, apenas silenciosamente retornar
        if (error instanceof Error && error.message === 'VALIDATION_REQUIRED') {
          return;
        }
        // Erro já tratado no onGenerate
        formLogger.error('Erro ao processar formulário:', error);
      }
    } else if (!isFormValid) {
      toast({
        title: 'Formulário incompleto',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
    }
  };

  // Mapear os ícones para cada etapa
  const stepIcons = [Home, User, Users, FileCheck, Search, Check];

  // Filtrar etapas baseado no tipo de termo
  const filteredSteps = steps.filter((step) => {
    // Ocultar etapa "Documentos Apresentados" para termo do locador
    if (step.id === 'documentos' && formData.tipoTermo === 'locador') {
      return false;
    }
    return true;
  });

  // Converter FormSteps para WizardSteps
  const wizardSteps: WizardStep[] = filteredSteps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    icon: step.icon || stepIcons[index % stepIcons.length],
    isValid: index <= currentStep ? true : undefined,
    content: (
      <FormStepContent
        step={step}
        formData={formData}
        contractData={contractData}
        locadores={locadores}
        locatarios={locatarios}
        fiadores={fiadores}
        updateField={updateField}
        getFieldError={getFieldError}
        isFieldTouched={isFieldTouched}
        setLocadores={setLocadores}
        setLocatarios={setLocatarios}
        setFiadores={setFiadores}
      />
    ),
  }));

  if (showPreview) {
    return (
      <DocumentPreview
        title={title}
        documentContent={replaceTemplateVariables(
          getTemplate ? getTemplate(dynamicFontSize) : template,
          processedFormData
        )}
        fontSize={dynamicFontSize}
        saving={saving}
        hideSaveButton={hideSaveButton}
        onBack={() => setShowPreview(false)}
        onSave={handleSave}
        onPrint={handlePrint}
        onIncreaseFont={handleIncreaseFont}
        onDecreaseFont={handleDecreaseFont}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Barra de progresso compacta com botão voltar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between text-neutral-700 text-xs">
          <span className="font-medium">Etapa 1 de 1</span>
          <div className="flex-1 mx-4">
            <div className="w-full bg-neutral-200 rounded-full h-1.5">
              <div
                className="bg-neutral-900 h-1.5 rounded-full transition-all duration-300"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">100% concluído</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 gap-1 h-7 px-2 text-xs"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Card principal mais compacto */}
      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto p-6 w-full">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm">
            <div className="p-8">
              <div className="text-center mb-4">
                <h1 className="text-xl font-semibold mb-2 text-neutral-900">
                  Vistoria e Entrega
                </h1>
                <p className="text-xs text-neutral-600 font-normal">
                  Detalhes da vistoria e entrega das chaves
                </p>
              </div>

              <FormWizard
                steps={wizardSteps}
                onComplete={handleComplete}
                onStepChange={handleStepChange}
                completedSteps={completedSteps}
                currentStep={currentStep}
                allowStepNavigation={true}
                isSubmitting={isSubmitting}
                submitButtonText={submitButtonText}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentFormWizard;
