import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Printer, Download, FileDown, Save, Home, User, Users, FileCheck, Search, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FormWizard, WizardStep } from "@/components/ui/form-wizard";
import { FormField } from "@/components/ui/form-field";
import { useFormWizard, FormStep as FormStepType } from "@/hooks/use-form-wizard";
import { generateDocx, downloadDocx, DocxData } from "@/utils/docxGenerator";
import { formatDateBrazilian, convertDateToBrazilian } from "@/utils/dateFormatter";

interface DocumentFormWizardProps {
  title: string;
  description: string;
  steps: FormStepType[];
  template: string;
  getTemplate?: (fontSize: number) => string;
  onGenerate: (data: Record<string, string>) => Record<string, string> | void;
  initialData?: Record<string, string>;
  termId?: string;
  isEditing?: boolean;
  contractData?: Record<string, string>;
  onFormDataChange?: (data: Record<string, string>) => void;
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
}) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processedFormData, setProcessedFormData] = useState<Record<string, string>>({});
  const [dynamicFontSize, setDynamicFontSize] = useState(14); // Tamanho padrão
  const { toast } = useToast();

  // Função para detectar múltiplos locatários
  const isMultipleLocatarios = (nomeLocatario: string) => {
    if (!nomeLocatario) return false;
    return nomeLocatario.includes(',') || 
           nomeLocatario.includes(' e ') || 
           nomeLocatario.includes(' E ');
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
  }, [formData, onFormDataChange]);

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

  const handleStepChange = (stepIndex: number) => {
    goToStep(stepIndex);
  };

  const handleComplete = () => {
    
    if (isFormValid) {
      const processedData = onGenerate(formData);
      const finalData = { ...formData, ...processedData };
      setProcessedFormData(finalData);
      
      // Calcular tamanho da fonte ideal se getTemplate estiver disponível
      if (getTemplate) {
        const htmlContent = replaceTemplateVariables(getTemplate(14), finalData);
        const optimalFontSize = calculateOptimalFontSize(htmlContent, 14);
        setDynamicFontSize(optimalFontSize);
        
        // Mostrar feedback apenas se a fonte foi realmente reduzida
        if (optimalFontSize < 14) {
          const reduction = ((14 - optimalFontSize) / 14 * 100).toFixed(1);
          toast({
            title: "📏 Fonte Ajustada para Manter 1 Página",
            description: `Fonte reduzida de 14px para ${optimalFontSize}px (-${reduction}%)`,
            duration: 4000,
          });
        } else {
        }
      }
      
      setShowPreview(true);
    } else {
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

    // Criar estilos CSS para ocultar elementos da UI durante impressão
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.textContent = `
      @media print {
        /* Ocultar TODOS os elementos da UI e containers */
        body > *:not(.print-only), 
        .min-h-screen, .bg-gradient-secondary,
        header, .header, nav, .nav, .action-bar, .toolbar,
        button, .btn, .button, .print\\:hidden,
        .container, .mx-auto, .px-6, .py-8,
        .max-w-4xl, .shadow-card, .border-b,
        .flex.items-center.justify-between,
        .gap-2, .gap-3, main, .card, .CardContent,
        [class*="shadow"], [class*="border"],
        .text-xl, .text-sm, .text-muted-foreground,
        .font-semibold, .font-bold,
        .mb-6, .mb-8, .py-6, .px-6 {
          display: none !important;
        }
        
        /* Resetar body para impressão */
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          font-family: Arial, sans-serif !important;
        }
        
        /* Mostrar APENAS o conteúdo do documento */
        #document-content {
          display: block !important;
          position: static !important;
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 auto !important;
          padding: 20mm !important;
          box-sizing: border-box !important;
          background: white !important;
          color: black !important;
          font-size: ${dynamicFontSize}px !important;
          line-height: 1.6 !important;
          page-break-inside: avoid !important;
          box-shadow: none !important;
          border: none !important;
        }
        
        /* Garantir que o documento seja o único elemento visível */
        .print-only {
          display: block !important;
        }
        
        /* Ocultar scrollbars */
        ::-webkit-scrollbar {
          display: none !important;
        }
        
        /* Configurações de página */
        @page {
          size: A4;
          margin: 0;
        }
      }
    `;
    
    // Adicionar classe especial ao documento para impressão
    const documentElement = document.getElementById('document-content');
    if (documentElement) {
      documentElement.classList.add('print-only');
    }
    
    // Adicionar estilos temporariamente
    document.head.appendChild(printStyles);
    
    // Imprimir
    window.print();
    
    // Remover estilos e classe após impressão
    setTimeout(() => {
      const existingStyles = document.getElementById('print-styles');
      if (existingStyles) {
        document.head.removeChild(existingStyles);
      }
      if (documentElement) {
        documentElement.classList.remove('print-only');
      }
    }, 1000);
  };

  const handleDownloadDocx = async () => {
    if (!processedFormData || Object.keys(processedFormData).length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum documento foi gerado ainda. Complete o formulário primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      const htmlContent = getTemplate ? replaceTemplateVariables(getTemplate(dynamicFontSize), processedFormData) : '';
      
      // Extrair título do documento
      const titleMatch = htmlContent.match(/<div[^>]*>([^<]+)<\/div>/);
      const documentTitle = titleMatch ? titleMatch[1].trim() : 'Documento';
      
      // Extrair data
      const dateMatch = htmlContent.match(/Valinhos, ([^<]+)\./);
      const documentDate = dateMatch ? dateMatch[1].trim() : formatDateBrazilian(new Date());
      
      // Extrair assinaturas
      const signatureMatches = htmlContent.match(/<span[^>]*>([^<]+)<\/span>/g);
      const signatures = {
        name1: signatureMatches && signatureMatches[0] ? signatureMatches[0].replace(/<[^>]*>/g, '') : '',
        name2: signatureMatches && signatureMatches[1] ? signatureMatches[1].replace(/<[^>]*>/g, '') : 'VICTOR CAIN JORGE'
      };

      const docxData: DocxData = {
        title: documentTitle,
        date: `Valinhos, ${documentDate}.`,
        content: htmlContent,
        signatures
      };

      const blob = await generateDocx(docxData);
      const filename = `${documentTitle.replace(/\s+/g, '_')}.docx`;
      
      downloadDocx(blob, filename);
      
      toast({
        title: "Sucesso",
        description: "Documento DOCX baixado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar documento DOCX. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    // Usar o elemento existente mas com configuração otimizada
    const element = document.getElementById('document-content');
    
    if (!element) {
      toast({
        title: "❌ Erro na Geração do PDF",
        description: "Elemento do documento não encontrado",
        duration: 3000,
      });
      return;
    }

    
    // Configuração de alta qualidade para PDF
    const opt = {
      margin: [8, 8, 8, 8], // Margens otimizadas
      filename: `${title}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 1.0 // Qualidade máxima
      },
      html2canvas: { 
        scale: 3, // Escala máxima para qualidade profissional
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        dpi: 300, // DPI alto para qualidade profissional
        letterRendering: true,
        removeContainer: true,
        imageTimeout: 15000,
        height: element.scrollHeight,
        width: element.scrollWidth,
        scrollX: 0,
        scrollY: 0,
        onclone: function(clonedDoc) {
          // Remover elementos da UI no clone
          const clonedElement = clonedDoc.getElementById('document-content');
          if (clonedElement) {
            // Garantir que o clone tenha apenas o conteúdo do documento
            clonedElement.style.position = 'static';
            clonedElement.style.left = 'auto';
            clonedElement.style.top = 'auto';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '15mm';
            clonedElement.style.width = '180mm'; // Largura A4 menos margens
            clonedElement.style.maxHeight = '260mm'; // Altura máxima para 1 página
            clonedElement.style.overflow = 'hidden';
            clonedElement.style.fontSize = `${dynamicFontSize}px`;
            clonedElement.style.lineHeight = '1.4';
            
            // Remover elementos da UI que possam ter sido clonados
            const uiElements = clonedDoc.querySelectorAll('.print\\:hidden, [class*="shadow"], [class*="border"], button, .action-bar, .header, header, nav');
            uiElements.forEach(el => el.remove());
          }
        }
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        putOnlyUsedFonts: true,
        compress: false // Não comprimir para manter qualidade
      },
      pagebreak: { 
        mode: ['avoid-all'],
        avoid: ['tr', 'img', 'div']
      }
    };
    
    
    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        toast({
          title: "📄 PDF Gerado",
          description: "Download realizado com sucesso",
          duration: 3000,
        });
      })
      .catch((error) => {
        toast({
          title: "❌ Erro na Geração do PDF",
          description: "Tente novamente",
          duration: 5000,
        });
      });
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

  // Sistema inteligente de ajuste de fonte - mais conservador e preciso
  const calculateOptimalFontSize = (content: string, baseSize: number = 14) => {
    // Criar elemento temporário para medir altura com medidas exatas A4
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '794px'; // 210mm em pixels (96 DPI)
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.padding = '60px'; // ~16mm em pixels
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.color = '#000000';
    
    document.body.appendChild(tempDiv);
    
    // Primeiro teste: verificar se cabe com o tamanho base
    tempDiv.style.fontSize = `${baseSize}px`;
    tempDiv.innerHTML = content;
    
    const maxHeightPx = 950; // Altura máxima controlada para garantir 1 página
    const currentHeight = tempDiv.scrollHeight;
    
    // Se cabe perfeitamente, não reduzir
    if (currentHeight <= maxHeightPx) {
      document.body.removeChild(tempDiv);
      return baseSize;
    }
    
    
    // Só agora reduzir gradualmente com precisão
    let currentSize = baseSize;
    const minSize = 10; // Tamanho mínimo legível
    
    while (currentSize >= minSize) {
      tempDiv.style.fontSize = `${currentSize}px`;
      tempDiv.innerHTML = content;
      
      const heightPx = tempDiv.scrollHeight;
      
      if (heightPx <= maxHeightPx) {
        document.body.removeChild(tempDiv);
        return currentSize;
      }
      
      currentSize -= 0.2; // Redução mais gradual para maior precisão
    }
    
    document.body.removeChild(tempDiv);
    return minSize;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {step.fields.map((field) => {
          // Lógica condicional para mostrar campos baseados no tipo de termo
          let shouldShowField = true;
          
          if (field.name === "statusAgua") {
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
            // Para termo do locador, não usar opções (campo de texto)
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
          }

          return (
          <div
            key={field.name}
            className={field.type === "textarea" ? "md:col-span-2" : ""}
          >
            <FormField
              name={field.name}
              label={field.label}
                type={
                  field.name === "nomeQuemRetira" && formData.tipoTermo === "locador"
                    ? "text"
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
                    : undefined
                }
                tooltip={
                  field.name === "dataFirmamentoContrato"
                    ? "Guia dos meses:\n1 - Janeiro\n2 - Fevereiro\n3 - Março\n4 - Abril\n5 - Maio\n6 - Junho\n7 - Julho\n8 - Agosto\n9 - Setembro\n10 - Outubro\n11 - Novembro\n12 - Dezembro"
                    : undefined
                }
            />
          </div>
          );
        })}
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
                <Button onClick={handleDownloadPDF} variant="outline" className="gap-2 print:hidden">
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button onClick={handleDownloadDocx} variant="outline" className="gap-2 print:hidden">
                  <FileDown className="h-4 w-4" />
                  DOCX
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
                    justifyContent: 'flex-end', 
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
                onClick={() => isEditing ? navigate("/termos-salvos") : navigate("/")}
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
        />
      </main>
    </div>
  );
};

export default DocumentFormWizard;
