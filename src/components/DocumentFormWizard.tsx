import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Printer, Save, Home, User, Users, FileCheck, Search, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FormWizard, WizardStep } from "@/components/ui/form-wizard";
import { FormField } from "@/components/ui/form-field";
import { PersonManager } from "@/components/ui/person-manager";
import { useFormWizard, FormStep as FormStepType } from "@/hooks/use-form-wizard";
import { formatDateBrazilian, convertDateToBrazilian } from "@/utils/dateFormatter";

interface DocumentFormWizardProps {
  title: string;
  description: string;
  steps: FormStepType[];
  template: string;
  getTemplate?: (fontSize: number) => string;
  onGenerate: (data: Record<string, string>) => Record<string, string> | void | Promise<Record<string, string>>;
  initialData?: Record<string, string>;
  termId?: string;
  isEditing?: boolean;
  contractData?: Record<string, string>;
  onFormDataChange?: (data: Record<string, string>) => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  externalFormData?: Record<string, string>;
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
  submitButtonText = "Gerar Documento",
  externalFormData
}) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processedFormData, setProcessedFormData] = useState<Record<string, string>>({});
  const [dynamicFontSize] = useState(14); // Tamanho padrão fixo
  const [locadores, setLocadores] = useState<Array<{id: string, name: string}>>([]);
  const [locatarios, setLocatarios] = useState<Array<{id: string, name: string}>>([]);
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
  }, [formData]);

  // Efeito para preencher automaticamente o campo de gênero quando há múltiplos locatários
  React.useEffect(() => {
    const nomeLocatario = formData.nomeLocatario || "";
    if (isMultipleLocatarios(nomeLocatario) && !formData.generoLocatario) {
      updateField("generoLocatario", "neutro");
    }
  }, [formData.nomeLocatario, formData.generoLocatario, updateField]);

  // Efeito para preencher automaticamente o campo de gênero quando há múltiplos proprietários
  React.useEffect(() => {
    const nomeProprietario = formData.nomeProprietario || "";
    if (isMultipleLocatarios(nomeProprietario) && !formData.generoProprietario) {
      updateField("generoProprietario", "neutro");
    }
  }, [formData.nomeProprietario, formData.generoProprietario, updateField]);

  // Auto-preencher campos quando for termo do locador
  React.useEffect(() => {
    
    if (formData.tipoTermo === "locador" && contractData?.nomeProprietario) {
      if (!formData.tipoQuemRetira) {
        updateField("tipoQuemRetira", "proprietario");
      }
      if (!formData.nomeQuemRetira) {
        updateField("nomeQuemRetira", contractData.nomeProprietario);
      }
    }
  }, [formData.tipoTermo, formData.tipoQuemRetira, formData.nomeQuemRetira, contractData?.nomeProprietario, updateField]);

  // Notificar mudanças no formData para o componente pai
  React.useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData]);

  // Sincronizar dados das pessoas com o formData apenas quando o PersonManager estiver sendo usado
  React.useEffect(() => {
    // Verificar se há etapas que usam PersonManager (locador/locatario)
    const hasPersonManagerSteps = steps.some(step => step.id === "locador" || step.id === "locatario");
    
    if (hasPersonManagerSteps) {
      // Atualizar dados dos locadores
      if (locadores.length > 0) {
        const nomesLocadoresArray = locadores.map(l => l.name);
        const nomesLocadores = nomesLocadoresArray.length > 1 
          ? nomesLocadoresArray.slice(0, -1).join(', ') + ' e ' + nomesLocadoresArray[nomesLocadoresArray.length - 1]
          : nomesLocadoresArray[0];
        updateField("nomeProprietario", nomesLocadores);
        // Não sobrescrever qualificacaoCompletaLocadores - deixar o usuário preencher manualmente
      } else {
        updateField("nomeProprietario", "");
        // Não limpar qualificacaoCompletaLocadores - preservar o que o usuário digitou
      }

      // Atualizar dados dos locatários
      if (locatarios.length > 0) {
        const nomesLocatariosArray = locatarios.map(l => l.name);
        const nomesLocatarios = nomesLocatariosArray.length > 1 
          ? nomesLocatariosArray.slice(0, -1).join(', ') + ' e ' + nomesLocatariosArray[nomesLocatariosArray.length - 1]
          : nomesLocatariosArray[0];
        updateField("nomeLocatario", nomesLocatarios);
        // Não sobrescrever qualificacaoCompletaLocatarios - deixar o usuário preencher manualmente
        
        // Definir primeiro, segundo, terceiro e quarto locatário
        updateField("primeiroLocatario", locatarios[0]?.name || "");
        updateField("segundoLocatario", locatarios[1]?.name || "");
        updateField("terceiroLocatario", locatarios[2]?.name || "");
        updateField("quartoLocatario", locatarios[3]?.name || "");
      } else {
        updateField("nomeLocatario", "");
        // Não limpar qualificacaoCompletaLocatarios - preservar o que o usuário digitou
        updateField("primeiroLocatario", "");
        updateField("segundoLocatario", "");
        updateField("terceiroLocatario", "");
        updateField("quartoLocatario", "");
      }
    }
  }, [locadores, locatarios, updateField, steps]);

  // Inicializar dados das pessoas a partir dos dados existentes do formulário
  React.useEffect(() => {
    // Verificar se há etapas que usam PersonManager
    const hasPersonManagerSteps = steps.some(step => step.id === "locador" || step.id === "locatario");
    
    if (hasPersonManagerSteps && initialData) {
      // Inicializar locadores se houver dados
      if (initialData.nomeProprietario && locadores.length === 0) {
        const nomesLocadores = initialData.nomeProprietario.split(/ e | E /).map(nome => nome.trim());
        const locadoresIniciais = nomesLocadores.map((nome, index) => ({
          id: `locador-${index}`,
          name: nome
        })).filter(l => l.name);
        if (locadoresIniciais.length > 0) {
          setLocadores(locadoresIniciais);
        }
      }
      
      // Inicializar locatários se houver dados
      if (initialData.nomeLocatario && locatarios.length === 0) {
        const nomesLocatarios = initialData.nomeLocatario.split(/ e | E /).map(nome => nome.trim());
        const locatariosIniciais = nomesLocatarios.map((nome, index) => ({
          id: `locatario-${index}`,
          name: nome
        })).filter(l => l.name);
        if (locatariosIniciais.length > 0) {
          setLocatarios(locatariosIniciais);
        }
      }
    }
  }, [initialData, steps, locadores.length, locatarios.length]);

  // Auto-preencher nome quando selecionar "incluir nome completo" no termo do locador
  React.useEffect(() => {
    
    if (formData.incluirNomeCompleto === "sim" && contractData?.nomeProprietario) {
      updateField("nomeQuemRetira", contractData.nomeProprietario);
    } else if (formData.incluirNomeCompleto === "todos" && contractData?.nomeProprietario) {
      updateField("nomeQuemRetira", contractData.nomeProprietario);
    } else if (formData.incluirNomeCompleto && formData.incluirNomeCompleto !== "nao" && formData.incluirNomeCompleto !== "sim" && formData.incluirNomeCompleto !== "todos" && contractData?.nomeProprietario) {
      updateField("nomeQuemRetira", formData.incluirNomeCompleto);
    } else if (formData.incluirNomeCompleto === "sim" && contractData?.nomeLocatario) {
      updateField("nomeQuemRetira", contractData.nomeLocatario);
    } else if (formData.incluirNomeCompleto === "todos" && contractData?.nomeLocatario) {
      updateField("nomeQuemRetira", contractData.nomeLocatario);
    } else if (formData.incluirNomeCompleto && formData.incluirNomeCompleto !== "nao" && formData.incluirNomeCompleto !== "sim" && formData.incluirNomeCompleto !== "todos") {
      updateField("nomeQuemRetira", formData.incluirNomeCompleto);
    }
  }, [formData.incluirNomeCompleto, contractData?.nomeProprietario, contractData?.nomeLocatario, updateField]);

  // Função para verificar se a pessoa que retira a chave é terceira (não é locador nem locatário)
  const isTerceiraPessoa = () => {
    const nomeQuemRetira = formData.nomeQuemRetira || "";
    const nomeProprietario = contractData?.nomeProprietario || "";
    const nomeLocatario = contractData?.nomeLocatario || "";
    
    // Se não há nome preenchido, não é terceira pessoa
    if (!nomeQuemRetira) return false;
    
    // Verificar se o nome não corresponde ao proprietário nem ao locatário
    const naoEhProprietario = !nomeProprietario || !nomeQuemRetira.toLowerCase().includes(nomeProprietario.toLowerCase());
    const naoEhLocatario = !nomeLocatario || !nomeQuemRetira.toLowerCase().includes(nomeLocatario.toLowerCase());
    
    return naoEhProprietario && naoEhLocatario;
  };

  const handleStepChange = (stepIndex: number) => {
    goToStep(stepIndex);
  };

  const handleComplete = async () => {
    
    if (isFormValid && !isSubmitting) {
      try {
        const processedData = await onGenerate(formData);
        const finalData = { ...formData, ...processedData };
        setProcessedFormData(finalData);
        
        // Fonte mantida no tamanho padrão de 14px
        
        setShowPreview(true);
      } catch (error) {
        // Erro já tratado no onGenerate
        console.error("Erro ao processar formulário:", error);
      }
    } else if (!isFormValid) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    if (!processedFormData || Object.keys(processedFormData).length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum documento foi gerado ainda. Complete o formulário primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Erro",
          description: "Não foi possível abrir a janela de impressão. Verifique se o popup está bloqueado.",
          variant: "destructive"
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
        title: "Impressão",
        description: "Abrindo janela de impressão... Dica: Nas opções de impressão, desmarque 'Cabeçalhos e rodapés' para uma impressão mais limpa."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao abrir impressão. Tente novamente.",
        variant: "destructive"
      });
    }
  };




  const handleSave = async () => {
    setSaving(true);
    try {
      const documentContent = replaceTemplateVariables(template, processedFormData);
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
          title: "Documento atualizado!",
          description: "O termo foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('saved_terms')
          .insert({
            title: documentTitle,
            content: documentContent,
            form_data: processedFormData,
            document_type: 'termo-inquilino'
          });

        if (error) throw error;

        toast({
          title: "Documento salvo!",
          description: "O termo foi salvo com sucesso e pode ser acessado em 'Termos Salvos'.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o documento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const replaceTemplateVariables = (template: string, data: Record<string, string>) => {
    let result = template;
    
    // Processar condicionais Handlebars {{#eq}} (igualdade)
    result = result.replace(/\{\{#eq\s+(\w+)\s+"([^"]+)"\}\}([\s\S]*?)\{\{\/eq\}\}/g, (match, variable, expectedValue, content) => {
      if (data[variable] === expectedValue) {
        return content;
      }
      return '';
    });
    
    // Processar condicionais Handlebars com else
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, ifContent, elseContent) => {
      if (data[variable] && data[variable].trim()) {
        return ifContent;
      }
      return elseContent;
    });
    
    // Processar condicionais Handlebars simples (sem else)
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
      if (data[variable] && data[variable].trim()) {
        return content;
      }
      return '';
    });
    
    // Substituir variáveis
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      let formattedValue = value || `[${key.toUpperCase()}]`;
      
      // Formatar datas automaticamente
      if (key.toLowerCase().includes('data') || key.toLowerCase().includes('date')) {
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
  const filteredSteps = steps.filter(step => {
    // Ocultar etapa "Documentos Apresentados" para termo do locador
    if (step.id === "documentos" && formData.tipoTermo === "locador") {
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
      <div className="space-y-6">
        {/* Gerenciadores de pessoas para etapas específicas */}
        {step.id === "locador" && (
          <PersonManager
            title="Locador(es)"
            people={locadores}
            onPeopleChange={setLocadores}
            placeholder="Nome completo do locador"
            maxPeople={4}
          />
        )}
        
        {step.id === "locatario" && (
          <PersonManager
            title="Locatário(s)"
            people={locatarios}
            onPeopleChange={setLocatarios}
            placeholder="Nome completo do locatário"
            maxPeople={4}
          />
        )}
        
        <div className={`grid gap-6 ${step.id === "desocupacao" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
        {step.fields.map((field) => {
          // Lógica condicional para mostrar campos baseados no tipo de termo
          let shouldShowField = true;
          
          // Ocultar campos tradicionais quando PersonManager estiver sendo usado
          if (step.id === "locador" && field.name === "nomeLocador") {
            shouldShowField = false;
          } else if (step.id === "locatario" && field.name === "nomesResumidos") {
            shouldShowField = false;
          } else if (field.name === "statusAgua") {
            shouldShowField = formData.tipoAgua && formData.tipoAgua !== "";
          } else if (field.name === "cpfl" || field.name === "tipoAgua" || field.name === "statusAgua") {
            // Campos de documentos só aparecem para termo do locatário
            shouldShowField = formData.tipoTermo !== "locador";
          } else if (field.name === "dataVistoria") {
            // Campo de vistoria só aparece para termo do locatário
            shouldShowField = formData.tipoTermo !== "locador";
          }

          if (!shouldShowField) return null;

          // Lógica para opções dinâmicas baseadas no tipo de termo
          let dynamicOptions = field.options;
          
          // Ajustar opções do campo "tipoQuemRetira" baseado no tipo de termo
          if (field.name === "tipoQuemRetira") {
            if (formData.tipoTermo === "locador") {
              // Para termo do locador, só mostra opção de proprietário
              dynamicOptions = [
                { value: "proprietario", label: "Proprietário" }
              ];
            } else {
              // Para termo do locatário, mostra ambas as opções
              dynamicOptions = [
                { value: "proprietario", label: "Proprietário" },
                { value: "locatario", label: "Locatário" }
              ];
            }
          } else if (field.name === "nomeQuemRetira") {
            // Verificar se o formulário tem o campo tipoQuemRetira
            const hasTimoQuemRetira = steps.some(step => 
              step.fields.some(f => f.name === "tipoQuemRetira")
            );
            
            if (hasTimoQuemRetira) {
              // Lógica para formulários que têm tipoQuemRetira
              if (formData.tipoTermo === "locador") {
                dynamicOptions = [];
              } else if (formData.tipoQuemRetira === "proprietario") {
                dynamicOptions = [
                  { value: contractData.nomeProprietario || "", label: contractData.nomeProprietario || "Proprietário" }
                ];
              } else if (formData.tipoQuemRetira === "locatario") {
                if (isMultipleLocatarios(contractData.nomeLocatario || "")) {
                  // Se há múltiplos locatários, criar opções para cada um
                  const nomesLocatarios = contractData.nomeLocatario?.split(/[, e E]+/).map(nome => nome.trim()).filter(nome => nome) || [];
                  dynamicOptions = nomesLocatarios.map(nome => ({
                    value: nome,
                    label: nome
                  }));
                } else {
                  // Se há apenas um locatário
                  dynamicOptions = [
                    { value: contractData.nomeLocatario || "", label: contractData.nomeLocatario || "Locatário" }
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
                className={field.type === "textarea" ? "md:col-span-2" : ""}
              >
                <FormField
                  name={field.name}
                  label={field.label}
                    type={
                      field.name === "nomeQuemRetira"
                        ? "textWithSuggestions"
                        : field.type
                    }
                  value={formData[field.name] || ""}
                  onChange={(value) => updateField(field.name, value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  error={getFieldError(field.name)}
                  touched={isFieldTouched(field.name)}
                  mask={field.mask}
                    options={dynamicOptions}
                    disabled={false}
                    description={
                      field.name === "generoLocatario" && 
                      isMultipleLocatarios(formData.nomeLocatario || "")
                        ? "Campo preenchido automaticamente para múltiplos locatários (neutro)"
                        : field.name === "generoProprietario" && 
                          isMultipleLocatarios(formData.nomeProprietario || "")
                        ? "Campo preenchido automaticamente para múltiplos proprietários (neutro)"
                        : field.name === "statusAgua"
                        ? `Status do documento ${formData.tipoAgua || 'selecionado'}`
                        : field.name === "nomeQuemRetira" && !formData.tipoQuemRetira
                        ? "Primeiro selecione quem está retirando a chave"
                        : field.name === "nomeQuemRetira"
                        ? "Digite o nome ou selecione uma sugestão"
                        : undefined
                    }
                    tooltip={
                  field.name === "dataFirmamentoContrato"
                    ? "Guia dos meses:\n\n1 - Janeiro     7 - Julho\n2 - Fevereiro  8 - Agosto\n3 - Março      9 - Setembro\n4 - Abril     10 - Outubro\n5 - Maio      11 - Novembro\n6 - Junho     12 - Dezembro"
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
            value={formData.documentoQuemRetira || ""}
            onChange={(value) => updateField("documentoQuemRetira", value)}
            placeholder="Digite o RG ou CPF da pessoa"
            required={true}
            error={getFieldError("documentoQuemRetira")}
            touched={isFieldTouched("documentoQuemRetira")}
          />
        </div>
      )}
        </div>
      </div>
    ),
  }));


  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <header className="bg-card shadow-card border-b">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Editar
                </Button>
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleSave} 
                  variant="outline" 
                  className="gap-2"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button onClick={handlePrint} className="gap-2 bg-gradient-primary print:hidden">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-card print:shadow-none print:border-none">
              <CardContent className="p-6 print:p-8">
                <div 
                  id="document-content" 
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    width: '794px', // 210mm em pixels
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
                    pageBreakAfter: 'avoid'
                  }}
                >
                   <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-start', 
                    alignItems: 'flex-start', 
                    marginBottom: '40px',
                    minHeight: '120px'
                  }}>
                    <img 
                      src="https://i.imgur.com/xwz1P7v.png" 
                      alt="Company Logo" 
                      style={{ 
                        height: 'auto', 
                        width: 'auto',
                        maxHeight: '120px',
                        maxWidth: '300px',
                        objectFit: 'contain'
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: replaceTemplateVariables(
                        getTemplate ? getTemplate(dynamicFontSize) : template, 
                        processedFormData
                      )
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <header className="bg-card shadow-card border-b print:hidden">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {isEditing ? 'Voltar aos Termos' : 'Voltar'}
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
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
      </main>
    </div>
  );
};

export default DocumentFormWizard;
