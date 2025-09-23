import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Printer,
  Save,
  Home,
  User,
  Users,
  FileCheck,
  Search,
  Check,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormWizard, WizardStep } from '@/components/ui/form-wizard';
// import { useTimeoutWithCleanup } from '@/utils/fontSizeCalculator';
import { formLogger } from '@/utils/logger';
import { FormField } from '@/components/ui/form-field';
import { PersonManager } from '@/components/ui/person-manager';
import {
  useFormWizard,
  FormStep as FormStepType,
} from '@/hooks/use-form-wizard';
import {
  formatDateBrazilian,
  convertDateToBrazilian,
} from '@/utils/dateFormatter';
import { cn } from '@/lib/utils';

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
  hideSaveButton = false,
}) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processedFormData, setProcessedFormData] = useState<
    Record<string, string>
  >({});
  const [dynamicFontSize, setDynamicFontSize] = useState(14); // Tamanho dinâmico
  const [locadores, setLocadores] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [locatarios, setLocatarios] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const { toast } = useToast();

  // Função para detectar múltiplos locatários baseado na quantidade adicionada
  const isMultipleLocatarios = (nomeLocatario: string) => {
    if (!nomeLocatario) return false;
    return nomeLocatario.includes(' e ');
  };

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
    initialData,
    contractData,
  });

  // Chamar onFormDataChange quando os dados do formulário mudarem
  useEffect(() => {
    if (onFormDataChange && formData) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  // Efeito para preencher automaticamente o campo de gênero quando há múltiplos locatários
  React.useEffect(() => {
    const nomeLocatario = formData.nomeLocatario || '';
    if (isMultipleLocatarios(nomeLocatario) && !formData.generoLocatario) {
      updateField('generoLocatario', 'neutro');
    }
  }, [formData.nomeLocatario, formData.generoLocatario, updateField]);

  // Efeito para preencher automaticamente o campo de gênero quando há múltiplos proprietários
  React.useEffect(() => {
    const nomeProprietario = formData.nomeProprietario || '';
    if (
      isMultipleLocatarios(nomeProprietario) &&
      !formData.generoProprietario
    ) {
      updateField('generoProprietario', 'neutro');
    }
  }, [formData.nomeProprietario, formData.generoProprietario, updateField]);

  // Auto-preencher campos quando for termo do locador
  React.useEffect(() => {
    if (formData.tipoTermo === 'locador' && contractData?.nomeProprietario) {
      if (!formData.tipoQuemRetira) {
        updateField('tipoQuemRetira', 'proprietario');
      }
      if (!formData.nomeQuemRetira) {
        updateField('nomeQuemRetira', contractData.nomeProprietario);
      }
    }
  }, [
    formData.tipoTermo,
    formData.tipoQuemRetira,
    formData.nomeQuemRetira,
    contractData?.nomeProprietario,
    updateField,
  ]);

  // Sincronizar dados das pessoas com o formData apenas quando o PersonManager estiver sendo usado
  React.useEffect(() => {
    // Verificar se há etapas que usam PersonManager (locador/locatario)
    const hasPersonManagerSteps = steps.some(
      (step) => step.id === 'locador' || step.id === 'locatario'
    );

    if (hasPersonManagerSteps) {
      // Atualizar dados dos locadores
      if (locadores.length > 0) {
        const nomesLocadoresArray = locadores.map((l) => l.name);
        const nomesLocadores =
          nomesLocadoresArray.length > 1
            ? nomesLocadoresArray.slice(0, -1).join(', ') +
              ' e ' +
              nomesLocadoresArray[nomesLocadoresArray.length - 1]
            : nomesLocadoresArray[0];

        // Só atualizar se o valor for diferente para evitar loops
        if (formData.nomeProprietario !== nomesLocadores) {
          updateField('nomeProprietario', nomesLocadores);
        }
      } else if (formData.nomeProprietario !== '') {
        updateField('nomeProprietario', '');
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

        // Só atualizar se o valor for diferente para evitar loops
        if (formData.nomeLocatario !== nomesLocatarios) {
          updateField('nomeLocatario', nomesLocatarios);
        }

        // Definir primeiro, segundo, terceiro e quarto locatário
        const primeiro = locatarios[0]?.name || '';
        const segundo = locatarios[1]?.name || '';
        const terceiro = locatarios[2]?.name || '';
        const quarto = locatarios[3]?.name || '';

        if (formData.primeiroLocatario !== primeiro)
          updateField('primeiroLocatario', primeiro);
        if (formData.segundoLocatario !== segundo)
          updateField('segundoLocatario', segundo);
        if (formData.terceiroLocatario !== terceiro)
          updateField('terceiroLocatario', terceiro);
        if (formData.quartoLocatario !== quarto)
          updateField('quartoLocatario', quarto);
      } else {
        if (formData.nomeLocatario !== '') updateField('nomeLocatario', '');
        if (formData.primeiroLocatario !== '')
          updateField('primeiroLocatario', '');
        if (formData.segundoLocatario !== '')
          updateField('segundoLocatario', '');
        if (formData.terceiroLocatario !== '')
          updateField('terceiroLocatario', '');
        if (formData.quartoLocatario !== '') updateField('quartoLocatario', '');
      }
    }
  }, [
    locadores,
    locatarios,
    formData.nomeProprietario,
    formData.nomeLocatario,
    formData.primeiroLocatario,
    formData.segundoLocatario,
    formData.terceiroLocatario,
    formData.quartoLocatario,
    updateField,
    steps,
  ]);

  // Inicializar dados das pessoas a partir dos dados existentes do formulário
  React.useEffect(() => {
    // Verificar se há etapas que usam PersonManager
    const hasPersonManagerSteps = steps.some(
      (step) => step.id === 'locador' || step.id === 'locatario'
    );

    if (hasPersonManagerSteps && initialData) {
      // Inicializar locadores se houver dados
      if (initialData.nomeProprietario && locadores.length === 0) {
        const nomesLocadores = initialData.nomeProprietario
          .split(/ e | E /)
          .map((nome) => nome.trim());
        const locadoresIniciais = nomesLocadores
          .map((nome, index) => ({
            id: `locador-${index}`,
            name: nome,
          }))
          .filter((l) => l.name);
        if (locadoresIniciais.length > 0) {
          setLocadores(locadoresIniciais);
        }
      }

      // Inicializar locatários se houver dados
      if (initialData.nomeLocatario && locatarios.length === 0) {
        const nomesLocatarios = initialData.nomeLocatario
          .split(/ e | E /)
          .map((nome) => nome.trim());
        const locatariosIniciais = nomesLocatarios
          .map((nome, index) => ({
            id: `locatario-${index}`,
            name: nome,
          }))
          .filter((l) => l.name);
        if (locatariosIniciais.length > 0) {
          setLocatarios(locatariosIniciais);
        }
      }
    }
  }, [initialData, steps, locadores.length, locatarios.length]);

  // Auto-preencher nome quando selecionar "incluir nome completo" no termo do locador
  React.useEffect(() => {
    if (
      formData.incluirNomeCompleto === 'sim' &&
      contractData?.nomeProprietario
    ) {
      if (formData.nomeQuemRetira !== contractData.nomeProprietario) {
        updateField('nomeQuemRetira', contractData.nomeProprietario);
      }
    } else if (
      formData.incluirNomeCompleto === 'todos' &&
      contractData?.nomeProprietario
    ) {
      if (formData.nomeQuemRetira !== contractData.nomeProprietario) {
        updateField('nomeQuemRetira', contractData.nomeProprietario);
      }
    } else if (
      formData.incluirNomeCompleto &&
      formData.incluirNomeCompleto !== 'nao' &&
      formData.incluirNomeCompleto !== 'sim' &&
      formData.incluirNomeCompleto !== 'todos' &&
      contractData?.nomeProprietario
    ) {
      if (formData.nomeQuemRetira !== formData.incluirNomeCompleto) {
        updateField('nomeQuemRetira', formData.incluirNomeCompleto);
      }
    } else if (
      formData.incluirNomeCompleto === 'sim' &&
      contractData?.nomeLocatario
    ) {
      if (formData.nomeQuemRetira !== contractData.nomeLocatario) {
        updateField('nomeQuemRetira', contractData.nomeLocatario);
      }
    } else if (
      formData.incluirNomeCompleto === 'todos' &&
      contractData?.nomeLocatario
    ) {
      if (formData.nomeQuemRetira !== contractData.nomeLocatario) {
        updateField('nomeQuemRetira', contractData.nomeLocatario);
      }
    } else if (
      formData.incluirNomeCompleto &&
      formData.incluirNomeCompleto !== 'nao' &&
      formData.incluirNomeCompleto !== 'sim' &&
      formData.incluirNomeCompleto !== 'todos'
    ) {
      if (formData.nomeQuemRetira !== formData.incluirNomeCompleto) {
        updateField('nomeQuemRetira', formData.incluirNomeCompleto);
      }
    }
  }, [
    formData.incluirNomeCompleto,
    formData.nomeQuemRetira,
    contractData?.nomeProprietario,
    contractData?.nomeLocatario,
    updateField,
  ]);

  // Função para verificar se a pessoa que retira a chave é terceira (não é locador nem locatário)
  const isTerceiraPessoa = () => {
    const nomeQuemRetira = formData.nomeQuemRetira || '';
    const nomeProprietario = contractData?.nomeProprietario || '';
    const nomeLocatario = contractData?.nomeLocatario || '';

    // Se não há nome preenchido, não é terceira pessoa
    if (!nomeQuemRetira) return false;

    // Verificar se o nome não corresponde ao proprietário nem ao locatário
    const naoEhProprietario =
      !nomeProprietario ||
      !nomeQuemRetira.toLowerCase().includes(nomeProprietario.toLowerCase());
    const naoEhLocatario =
      !nomeLocatario ||
      !nomeQuemRetira.toLowerCase().includes(nomeLocatario.toLowerCase());

    return naoEhProprietario && naoEhLocatario;
  };

  const handleStepChange = (stepIndex: number) => {
    goToStep(stepIndex);
  };

  // Função para verificar se o conteúdo excede uma página e ajustar a fonte
  const checkAndAdjustFontSize = (content: string, fontSize: number) => {
    // Criar um elemento temporário para medir o conteúdo
    const tempElement = document.createElement('div');
    tempElement.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 794px;
      font-family: Arial, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.4;
      padding: 20px;
      box-sizing: border-box;
      overflow: hidden;
    `;
    tempElement.innerHTML = content;
    document.body.appendChild(tempElement);

    const contentHeight = tempElement.offsetHeight;
    const maxHeight = 1050; // Altura máxima de uma página A4 (297mm - margens) em pixels

    document.body.removeChild(tempElement);

    // Se exceder uma página, reduzir a fonte
    if (contentHeight > maxHeight && fontSize > 10) {
      const newFontSize = Math.max(10, fontSize - 1);
      return newFontSize;
    }

    return fontSize;
  };

  const handleComplete = async () => {
    if (isFormValid && !isSubmitting) {
      try {
        const processedData = await onGenerate(formData);
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
          setDynamicFontSize(adjustedFontSize);
          toast({
            title: 'Ajuste automático aplicado',
            description: `O tamanho da fonte foi reduzido para ${adjustedFontSize}px para caber em uma página.`,
          });
        }

        setShowPreview(true);

        // Verificação adicional após o preview ser exibido com cleanup automático
        setTimeout(() => {
          const documentElement = document.getElementById('document-content');
          if (documentElement) {
            const contentHeight = documentElement.offsetHeight;
            const maxHeight = 1050;

            if (contentHeight > maxHeight && dynamicFontSize > 10) {
              const newFontSize = Math.max(10, dynamicFontSize - 1);
              setDynamicFontSize(newFontSize);
              toast({
                title: 'Ajuste adicional aplicado',
                description: `O tamanho da fonte foi reduzido para ${newFontSize}px para garantir que caiba em uma página.`,
              });
            }
          }
        }, 100);
      } catch (error) {
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

  const handleDecreaseFont = () => {
    if (dynamicFontSize > 10) {
      setDynamicFontSize(dynamicFontSize - 1);
      toast({
        title: 'Fonte reduzida',
        description: `O tamanho da fonte foi reduzido para ${dynamicFontSize - 1}px.`,
      });
    } else {
      toast({
        title: 'Já no tamanho mínimo',
        description: 'O documento já está no tamanho mínimo de fonte (10px).',
      });
    }
  };

  const handleIncreaseFont = () => {
    if (dynamicFontSize < 20) {
      setDynamicFontSize(dynamicFontSize + 1);
      toast({
        title: 'Fonte aumentada',
        description: `O tamanho da fonte foi aumentado para ${dynamicFontSize + 1}px.`,
      });
    } else {
      toast({
        title: 'Já no tamanho máximo',
        description: 'O documento já está no tamanho máximo de fonte (20px).',
      });
    }
  };

  const handlePrint = () => {
    if (!processedFormData || Object.keys(processedFormData).length === 0) {
      toast({
        title: 'Erro',
        description:
          'Nenhum documento foi gerado ainda. Complete o formulário primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'Erro',
          description:
            'Não foi possível abrir a janela de impressão. Verifique se o popup está bloqueado.',
          variant: 'destructive',
        });
        return;
      }

      // CSS para impressão
      const printCSS = `
        <style>
          @page {
            margin: 0;
            size: A4;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { display: none !important; }
            img { 
              max-width: 100%; 
              height: auto; 
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            * { 
              -webkit-print-color-adjust: exact; 
              color-adjust: exact;
              box-sizing: border-box;
            }
            div {
              margin: 0;
              padding: 0;
            }
            p {
              margin: 0 0 20px 0;
              padding: 0;
            }
            h1, h2, h3 {
              margin: 0 0 20px 0;
              padding: 0;
              letter-spacing: 1px;
            }
            /* Ocultar cabeçalho e rodapé do navegador */
        @page {
              margin: 0;
          size: A4;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
            }
            body {
              padding: 20px !important;
            }
          }
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #000;
            margin: 0;
            padding: 20px;
          }
        </style>
      `;

      // Obter o conteúdo do documento
      const documentElement = document.getElementById('document-content');
      const documentContent = documentElement ? documentElement.innerHTML : '';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            ${printCSS}
          </head>
          <body>
            ${documentContent}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Aguardar o conteúdo carregar antes de imprimir
      setTimeout(() => {
        // Configurar opções de impressão para ocultar cabeçalho/rodapé
        printWindow.print();

        // Fechar a janela após um tempo
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);

      toast({
        title: 'Impressão',
        description:
          "Abrindo janela de impressão... Dica: Nas opções de impressão, desmarque 'Cabeçalhos e rodapés' para uma impressão mais limpa.",
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao abrir impressão. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const documentContent = replaceTemplateVariables(
        template,
        processedFormData
      );
      const documentTitle = `${title} - ${processedFormData.nomeLocatario || 'Sem nome'} - ${formatDateBrazilian(new Date())}`;

      if (isEditing && termId) {
        const { error } = await supabase
          .from('saved_terms')
          .update({
            title: documentTitle,
            content: documentContent,
            form_data: processedFormData,
          })
          .eq('id', termId);

        if (error) throw error;

        toast({
          title: 'Documento atualizado!',
          description: 'O termo foi atualizado com sucesso.',
        });
      } else {
        const { error } = await supabase.from('saved_terms').insert({
          title: documentTitle,
          content: documentContent,
          form_data: processedFormData,
          document_type: 'termo-inquilino',
        });

        if (error) throw error;

        toast({
          title: 'Documento salvo!',
          description:
            "O termo foi salvo com sucesso e pode ser acessado em 'Termos Salvos'.",
        });
      }
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o documento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const replaceTemplateVariables = (
    template: string,
    data: Record<string, string>
  ) => {
    let result = template;

    // Processar condicionais Handlebars {{#eq}} (igualdade)
    result = result.replace(
      /\{\{#eq\s+(\w+)\s+"([^"]+)"\}\}([\s\S]*?)\{\{\/eq\}\}/g,
      (_match, variable, expectedValue, content) => {
        if (data[variable] === expectedValue) {
          return content;
        }
        return '';
      }
    );

    // Processar condicionais Handlebars com else
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_match, variable, ifContent, elseContent) => {
        if (data[variable] && data[variable].trim()) {
          return ifContent;
        }
        return elseContent;
      }
    );

    // Processar condicionais Handlebars simples (sem else)
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_match, variable, content) => {
        if (data[variable] && data[variable].trim()) {
          return content;
        }
        return '';
      }
    );

    // Substituir variáveis
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      // Para observações vazias, não exibir placeholder
      let formattedValue =
        value || (key === 'observacao' ? '' : `[${key.toUpperCase()}]`);

      // Formatar datas automaticamente
      if (
        key.toLowerCase().includes('data') ||
        key.toLowerCase().includes('date')
      ) {
        if (value && value.trim() !== '') {
          formattedValue = convertDateToBrazilian(value);
        }
      }

      result = result.replace(new RegExp(placeholder, 'g'), formattedValue);
    });

    return result;
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
      <div className="space-y-6 overflow-visible">
        {/* Gerenciadores de pessoas para etapas específicas */}
        {step.id === 'locador' && (
          <PersonManager
            title="Locador(es)"
            people={locadores}
            onPeopleChange={setLocadores}
            placeholder="Nome completo do locador"
            maxPeople={4}
          />
        )}

        {step.id === 'locatario' && (
          <PersonManager
            title="Locatário(s)"
            people={locatarios}
            onPeopleChange={setLocatarios}
            placeholder="Nome completo do locatário"
            maxPeople={4}
          />
        )}

        <div
          className={cn(
            'grid gap-6 overflow-visible',
            step.id === 'rescisao'
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2'
          )}
        >
          {step.fields.map((field) => {
            // Lógica condicional para mostrar campos baseados no tipo de termo
            let shouldShowField = true;

            // Ocultar campos tradicionais quando PersonManager estiver sendo usado
            if (step.id === 'locador' && field.name === 'nomeLocador') {
              shouldShowField = false;
            } else if (
              step.id === 'locatario' &&
              field.name === 'nomesResumidos'
            ) {
              shouldShowField = false;
            } else if (field.name === 'statusAgua') {
              shouldShowField = Boolean(
                formData.tipoAgua && formData.tipoAgua !== ''
              );
            } else if (
              field.name === 'cpfl' ||
              field.name === 'tipoAgua' ||
              field.name === 'statusAgua'
            ) {
              // Campos de documentos só aparecem para termo do locatário
              shouldShowField = formData.tipoTermo !== 'locador';
            } else if (field.name === 'dataVistoria') {
              // Campo de vistoria só aparece para termo do locatário
              shouldShowField = formData.tipoTermo !== 'locador';
            }

            // Lógica condicional para campos de vistoria/revistoria
            if (field.conditional) {
              const { field: conditionalField, value: conditionalValue } =
                field.conditional;
              shouldShowField = formData[conditionalField] === conditionalValue;
            }

            if (!shouldShowField) return null;

            // Lógica para opções dinâmicas baseadas no tipo de termo
            let dynamicOptions = field.options;

            // Ajustar opções do campo "tipoQuemRetira" baseado no tipo de termo
            if (field.name === 'tipoQuemRetira') {
              if (formData.tipoTermo === 'locador') {
                // Para termo do locador, só mostra opção de proprietário
                dynamicOptions = [
                  { value: 'proprietario', label: 'Proprietário' },
                ];
              } else {
                // Para termo do locatário, mostra ambas as opções
                dynamicOptions = [
                  { value: 'proprietario', label: 'Proprietário' },
                  { value: 'locatario', label: 'Locatário' },
                ];
              }
            } else if (field.name === 'nomeQuemRetira') {
              // Verificar se o formulário tem o campo tipoQuemRetira
              const hasTimoQuemRetira = steps.some((step) =>
                step.fields.some((f) => f.name === 'tipoQuemRetira')
              );

              if (hasTimoQuemRetira) {
                // Lógica para formulários que têm tipoQuemRetira
                if (formData.tipoTermo === 'locador') {
                  dynamicOptions = [];
                } else if (formData.tipoQuemRetira === 'proprietario') {
                  dynamicOptions = [
                    {
                      value: contractData.nomeProprietario || '',
                      label: contractData.nomeProprietario || 'Proprietário',
                    },
                  ];
                } else if (formData.tipoQuemRetira === 'locatario') {
                  if (isMultipleLocatarios(contractData.nomeLocatario || '')) {
                    // Se há múltiplos locatários, criar opções para cada um
                    const nomesLocatarios =
                      contractData.nomeLocatario
                        ?.split(/[, e E]+/)
                        .map((nome) => nome.trim())
                        .filter((nome) => nome) || [];
                    dynamicOptions = nomesLocatarios.map((nome) => ({
                      value: nome,
                      label: nome,
                    }));
                  } else {
                    // Se há apenas um locatário
                    dynamicOptions = [
                      {
                        value: contractData.nomeLocatario || '',
                        label: contractData.nomeLocatario || 'Locatário',
                      },
                    ];
                  }
                } else {
                  dynamicOptions = [];
                }
              } else {
                // Para formulários que NÃO têm tipoQuemRetira (como TermoLocatario e TermoLocador)
                // Usar as opções definidas no próprio formulário
                dynamicOptions = field.options || [];
              }
            }

            return (
              <React.Fragment key={field.name}>
                <div
                  className={cn(
                    field.type === 'textarea' ? 'md:col-span-2' : '',
                    field.type === 'arrowDropdown' && 'overflow-visible'
                  )}
                >
                  <FormField
                    name={field.name}
                    label={field.label}
                    type={
                      field.name === 'nomeQuemRetira'
                        ? 'textWithSuggestions'
                        : field.type
                    }
                    value={formData[field.name] || ''}
                    onChange={(value) => updateField(field.name, value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    error={getFieldError(field.name)}
                    touched={isFieldTouched(field.name)}
                    mask={field.mask}
                    options={dynamicOptions}
                    disabled={false}
                    description={
                      field.name === 'generoLocatario' &&
                      isMultipleLocatarios(formData.nomeLocatario || '')
                        ? 'Campo preenchido automaticamente para múltiplos locatários (neutro)'
                        : field.name === 'generoProprietario' &&
                            isMultipleLocatarios(
                              formData.nomeProprietario || ''
                            )
                          ? 'Campo preenchido automaticamente para múltiplos proprietários (neutro)'
                          : field.name === 'statusAgua'
                            ? `Status do documento ${formData.tipoAgua || 'selecionado'}`
                            : field.name === 'nomeQuemRetira' &&
                                !formData.tipoQuemRetira
                              ? 'Primeiro selecione quem está retirando a chave'
                              : field.name === 'nomeQuemRetira'
                                ? 'Digite o nome ou selecione uma sugestão'
                                : undefined
                    }
                    tooltip={
                      field.name === 'dataFirmamentoContrato'
                        ? 'Guia dos meses:\n\n1 - Janeiro     7 - Julho\n2 - Fevereiro  8 - Agosto\n3 - Março      9 - Setembro\n4 - Abril     10 - Outubro\n5 - Maio      11 - Novembro\n6 - Junho     12 - Dezembro'
                        : undefined
                    }
                  />
                </div>
              </React.Fragment>
            );
          })}

          {/* Campo adicional para RG/CPF quando é terceira pessoa */}
          {isTerceiraPessoa() && (
            <div className="md:col-span-2">
              <FormField
                name="documentoQuemRetira"
                label="RG ou CPF da Pessoa"
                type="text"
                value={formData.documentoQuemRetira || ''}
                onChange={(value) => updateField('documentoQuemRetira', value)}
                placeholder="Digite o RG ou CPF da pessoa"
                required={true}
                error={getFieldError('documentoQuemRetira')}
                touched={isFieldTouched('documentoQuemRetira')}
              />
            </div>
          )}
        </div>
      </div>
    ),
  }));

  if (showPreview) {
    return (
      <div className="min-h-screen bg-background">
        <header className="glass-card border-border px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold text-sm">
                Madia Imóveis
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="text-foreground hover:bg-accent gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Editar
              </Button>
              {!hideSaveButton && (
                <Button
                  onClick={handleSave}
                  variant="outline"
                  className="gap-2 bg-background text-foreground hover:bg-accent border-border"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
              <Button
                onClick={handleDecreaseFont}
                variant="outline"
                className="gap-2 bg-background text-foreground hover:bg-accent border-border"
                title="Diminuir tamanho da fonte"
              >
                <Minimize2 className="h-4 w-4" />
                Diminuir
              </Button>
              <Button
                onClick={handleIncreaseFont}
                variant="outline"
                className="gap-2 bg-background text-foreground hover:bg-accent border-border"
                title="Aumentar tamanho da fonte"
              >
                <Maximize2 className="h-4 w-4" />
                Aumentar
              </Button>
              <CopyButton
                content={replaceTemplateVariables(
                  getTemplate ? getTemplate(dynamicFontSize) : template,
                  processedFormData
                )}
                className="gap-2"
              />
              <Button
                onClick={handlePrint}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </header>

        <main className="bg-background min-h-screen">
          <div className="max-w-4xl mx-auto p-6">
            <div className="glass-card border-border overflow-hidden">
              <div className="p-6 overflow-hidden">
                <div
                  id="document-content"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    width: '100%', // Largura responsiva
                    maxWidth: '794px', // Largura máxima (210mm em pixels)
                    minHeight: '800px', // Altura mínima
                    maxHeight: '950px', // Altura máxima para garantir 1 página
                    padding: '40px', // Padding otimizado
                    margin: '0 auto',
                    boxSizing: 'border-box',
                    lineHeight: '1.4', // Line-height otimizado
                    fontSize: `${dynamicFontSize}px`,
                    position: 'relative',
                    overflow: 'hidden', // Esconder qualquer overflow
                    pageBreakInside: 'avoid',
                    pageBreakAfter: 'avoid',
                    wordWrap: 'break-word', // Quebrar palavras longas
                    overflowWrap: 'break-word', // Quebrar palavras longas
                  }}
                >
                  <div
                    style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      maxWidth: '100%',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: replaceTemplateVariables(
                        getTemplate ? getTemplate(dynamicFontSize) : template,
                        processedFormData
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Barra de progresso compacta com botão voltar */}
      <div className="glass-card border-border px-6 py-1.5">
        <div className="flex items-center justify-between text-foreground text-xs">
          <span>Etapa 1 de 1</span>
          <div className="flex-1 mx-4">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span>100% concluído</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-foreground hover:bg-accent gap-1 h-6 px-2 text-xs"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Card principal mais compacto */}
      <main className="bg-background min-h-screen">
        <div className="max-w-3xl mx-auto p-6">
          <div className="glass-card border-border">
            <div className="p-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Vistoria e Entrega
                </h1>
                <p className="text-sm text-foreground/80 font-medium">
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
