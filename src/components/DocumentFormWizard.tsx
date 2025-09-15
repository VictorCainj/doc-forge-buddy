import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Printer,
  Save,
  Home,
  User,
  Users,
  FileCheck,
  Search,
  Check,
  Minimize2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormWizard, WizardStep } from '@/components/ui/form-wizard';
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
  description,
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
  externalFormData,
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
    errors,
    touched,
    completedSteps,
    isCurrentStepValid,
    isFormValid,
    updateField,
    nextStep,
    previousStep,
    goToStep,
    getCurrentStep,
    getFieldError,
    isFieldTouched,
    isLastStep,
    isFirstStep,
  } = useFormWizard({
    steps,
    initialData,
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

        // Verificação adicional após o preview ser exibido
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
        console.error('Erro ao processar formulário:', error);
      }
    } else if (!isFormValid) {
      toast({
        title: 'Formulário incompleto',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
    }
  };

  const handleCompact = () => {
    if (dynamicFontSize > 11) {
      setDynamicFontSize(11);
      toast({
        title: 'Documento compactado',
        description:
          'O tamanho da fonte foi reduzido para 11px para economizar espaço.',
      });
    } else if (dynamicFontSize > 10) {
      setDynamicFontSize(10);
      toast({
        title: 'Documento super compactado',
        description:
          'O tamanho da fonte foi reduzido para 10px para máxima economia de espaço.',
      });
    } else {
      toast({
        title: 'Já no tamanho mínimo',
        description: 'O documento já está no tamanho mínimo de fonte (10px).',
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
    } catch (error) {
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
    } catch (error) {
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
      (match, variable, expectedValue, content) => {
        if (data[variable] === expectedValue) {
          return content;
        }
        return '';
      }
    );

    // Processar condicionais Handlebars com else
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, variable, ifContent, elseContent) => {
        if (data[variable] && data[variable].trim()) {
          return ifContent;
        }
        return elseContent;
      }
    );

    // Processar condicionais Handlebars simples (sem else)
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, variable, content) => {
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
            step.id === 'desocupacao'
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
              shouldShowField = formData.tipoAgua && formData.tipoAgua !== '';
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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white text-gray-900 px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                Madia Imóveis
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="text-gray-700 hover:bg-gray-100 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Editar
              </Button>
              {!hideSaveButton && (
                <Button
                  onClick={handleSave}
                  variant="outline"
                  className="gap-2 bg-white text-black hover:bg-gray-100"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
              <Button
                onClick={handleCompact}
                variant="outline"
                className="gap-2 bg-white text-black hover:bg-gray-100"
                title="Compactar documento para economizar espaço"
              >
                <Minimize2 className="h-4 w-4" />
                Compactar
              </Button>
              <Button
                onClick={handlePrint}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </header>

        <main className="bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
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
    <div className="min-h-screen bg-gray-50">
      {/* Barra de progresso compacta com botão voltar */}
      <div className="bg-white px-6 py-1.5 border-b border-gray-200">
        <div className="flex items-center justify-between text-gray-700 text-xs">
          <span>Etapa 1 de 1</span>
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-600 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
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
              className="text-gray-700 hover:bg-gray-100 gap-1 h-6 px-2 text-xs"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Card principal mais compacto */}
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Vistoria e Entrega
                </h1>
                <p className="text-sm text-gray-600">
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

      {/* Footer mais compacto */}
      <footer className="bg-white text-gray-700 px-6 py-4 border-t border-gray-200">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-500 hover:text-gray-700 text-xs">
              Recursos
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700 text-xs">
              Legal
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700 text-xs">
              Contato
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <a href="#" className="text-gray-500 hover:text-gray-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentFormWizard;
