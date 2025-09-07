import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Printer, Download, FileDown, Save, Home, User, Users, FileCheck, Search, Check, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { Document, Paragraph, TextRun, Packer } from "docx";
import { saveAs } from "file-saver";
const companyLogo = "/lovable-uploads/b46a97fe-55bb-462c-98b9-2f3ad07ee463.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FormWizard, WizardStep } from "@/components/ui/form-wizard";
import { FormField } from "@/components/ui/form-field";
import { useFormWizard, FormStep as FormStepType } from "@/hooks/use-form-wizard";

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
}) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processedFormData, setProcessedFormData] = useState<Record<string, string>>({});
  const [dynamicFontSize, setDynamicFontSize] = useState(14); // Tamanho padrão
  const { toast } = useToast();

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
    generateTestData,
  } = useFormWizard({
    steps,
    initialData,
  });

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
          console.log(`✅ Mantida fonte padrão: ${optimalFontSize}px`);
        }
      }
      
      setShowPreview(true);
    }
  };

  const handlePrint = () => {
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

  const handleDownloadPDF = () => {
    // Usar o elemento existente mas com configuração otimizada
    const element = document.getElementById('document-content');
    
    if (!element) {
      console.error('❌ Elemento document-content não encontrado!');
      toast({
        title: "❌ Erro na Geração do PDF",
        description: "Elemento do documento não encontrado",
        duration: 3000,
      });
      return;
    }

    console.log('🔍 Elemento encontrado:', element);
    console.log('📏 Dimensões:', { 
      width: element.offsetWidth, 
      height: element.offsetHeight,
      scrollHeight: element.scrollHeight 
    });
    
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
    
    console.log('🔄 Iniciando geração do PDF...');
    
    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        console.log('✅ PDF gerado com sucesso!');
        toast({
          title: "📄 PDF Gerado",
          description: "Download realizado com sucesso",
          duration: 3000,
        });
      })
      .catch((error) => {
        console.error('❌ Erro na geração do PDF:', error);
        toast({
          title: "❌ Erro na Geração do PDF",
          description: "Tente novamente",
          duration: 5000,
        });
      });
  };

  const handleDownloadDOCX = async () => {
    const templateToUse = getTemplate ? getTemplate(dynamicFontSize) : template;
    const processedText = replaceTemplateVariables(templateToUse, processedFormData)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .split('\n');

    const doc = new Document({
      sections: [{
        properties: {},
        children: processedText.map(line => 
          new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: line.trim() === '' ? 200 : 100 }
          })
        )
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    saveAs(new Blob([buffer]), `${title}.docx`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const documentContent = replaceTemplateVariables(template, processedFormData);
      const documentTitle = `${title} - ${processedFormData.nomeLocatario || 'Sem nome'} - ${new Date().toLocaleDateString('pt-BR')}`;
      
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
      console.error('Erro ao salvar:', error);
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
      result = result.replace(new RegExp(placeholder, 'g'), value || `[${key.toUpperCase()}]`);
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
      console.log(`✅ Fonte ${baseSize}px cabe perfeitamente (${currentHeight}px <= ${maxHeightPx}px)`);
      return baseSize;
    }
    
    console.log(`⚠️ Conteúdo excede 1 página: ${currentHeight}px > ${maxHeightPx}px`);
    
    // Só agora reduzir gradualmente com precisão
    let currentSize = baseSize;
    const minSize = 10; // Tamanho mínimo legível
    
    while (currentSize >= minSize) {
      tempDiv.style.fontSize = `${currentSize}px`;
      tempDiv.innerHTML = content;
      
      const heightPx = tempDiv.scrollHeight;
      
      if (heightPx <= maxHeightPx) {
        document.body.removeChild(tempDiv);
        console.log(`✅ Fonte otimizada: ${currentSize}px (${heightPx}px <= ${maxHeightPx}px)`);
        return currentSize;
      }
      
      currentSize -= 0.2; // Redução mais gradual para maior precisão
    }
    
    document.body.removeChild(tempDiv);
    console.log(`⚠️ Fonte mínima atingida: ${minSize}px`);
    return minSize;
  };

  // Mapear os ícones para cada etapa
  const stepIcons = [Home, User, Users, FileCheck, Search, Check];

  // Converter FormSteps para WizardSteps
  const wizardSteps: WizardStep[] = steps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    icon: step.icon || stepIcons[index % stepIcons.length],
    isValid: index <= currentStep ? true : undefined,
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {step.fields.map((field) => (
          <div
            key={field.name}
            className={field.type === "textarea" ? "md:col-span-2" : ""}
          >
            <FormField
              name={field.name}
              label={field.label}
              type={field.type}
              value={formData[field.name] || ""}
              onChange={(value) => updateField(field.name, value)}
              placeholder={field.placeholder}
              required={field.required}
              error={getFieldError(field.name)}
              touched={isFieldTouched(field.name)}
              mask={field.mask}
              options={field.options}
            />
          </div>
        ))}
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
                <Button onClick={handleDownloadDOCX} variant="outline" className="gap-2 print:hidden">
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
                      src={companyLogo} 
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={generateTestData}
              className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <TestTube className="h-4 w-4" />
              Preencher com Dados de Teste
            </Button>
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
