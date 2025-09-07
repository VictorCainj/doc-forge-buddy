import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Printer, Download, FileDown, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { Document, Paragraph, TextRun, Packer } from "docx";
import { saveAs } from "file-saver";
const companyLogo = "/lovable-uploads/b46a97fe-55bb-462c-98b9-2f3ad07ee463.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number";
  required?: boolean;
  placeholder?: string;
}

interface FieldGroup {
  title: string;
  fields: FormField[];
  getDynamicTitle?: (formData: Record<string, string>) => string;
}

interface DocumentFormProps {
  title: string;
  description: string;
  fields?: FormField[];
  fieldGroups?: FieldGroup[];
  template: string;
  onGenerate: (data: Record<string, string>) => Record<string, string> | void;
  initialData?: Record<string, string>;
  termId?: string;
  isEditing?: boolean;
}

const DocumentForm = ({ title, description, fields, fieldGroups, template, onGenerate, initialData, termId, isEditing }: DocumentFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Record<string, string>>(initialData || {});
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = () => {
    const processedData = onGenerate(formData);
    // Usa os dados processados se retornados, senão usa os originais
    if (processedData) {
      setFormData(processedData);
    }
    setShowPreview(true);
  };

  const handlePrint = () => {
    // Criar estilos CSS para ocultar elementos da UI durante impressão
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.textContent = `
      @media print {
        /* Ocultar todos os elementos da UI */
        header, .header, nav, .nav, .action-bar, .toolbar,
        button, .btn, .button, .print\\:hidden,
        [class*="shadow"], [class*="border"],
        .container, .mx-auto, .px-6, .py-8,
        .max-w-4xl, .max-w-none,
        .bg-gradient-secondary, .bg-card,
        .shadow-card, .border-b,
        .flex, .justify-between, .items-center,
        .gap-2, .gap-3,
        .text-xl, .text-sm, .text-muted-foreground,
        .font-semibold, .font-bold,
        .mb-6, .mb-8, .py-6, .px-6,
        .min-h-screen, .bg-gradient-secondary {
          display: none !important;
        }
        
        /* Mostrar apenas o conteúdo do documento */
        #document-content {
          display: block !important;
          position: static !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 20mm !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        
        /* Garantir que o documento ocupe toda a página */
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        
        /* Garantir quebra de página */
        .page-break {
          page-break-before: always;
        }
      }
    `;
    
    // Adicionar estilos temporariamente
    document.head.appendChild(printStyles);
    
    // Imprimir
    window.print();
    
    // Remover estilos após impressão
    setTimeout(() => {
      const existingStyles = document.getElementById('print-styles');
      if (existingStyles) {
        document.head.removeChild(existingStyles);
      }
    }, 1000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('document-content');
    // Configuração de alta qualidade para PDF
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `${title}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 1.0 // Qualidade máxima
      },
      html2canvas: { 
        scale: 3, // Escala maior para melhor qualidade
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        dpi: 300, // DPI alto para qualidade profissional
        letterRendering: true,
        imageTimeout: 15000,
        removeContainer: true
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
    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadDOCX = async () => {
    const processedText = replaceTemplateVariables(template, formData)
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
      const documentContent = replaceTemplateVariables(template, formData);
      const documentTitle = `${title} - ${formData.nomeLocatario || 'Sem nome'} - ${new Date().toLocaleDateString('pt-BR')}`;
      
      if (isEditing && termId) {
        // Atualizar termo existente
        const { error } = await supabase
          .from('saved_terms')
          .update({
            title: documentTitle,
            content: documentContent,
            form_data: formData,
          })
          .eq('id', termId);

        if (error) throw error;

        toast({
          title: "Documento atualizado!",
          description: "O termo foi atualizado com sucesso.",
        });
      } else {
        // Criar novo termo
        const { error } = await supabase
          .from('saved_terms')
          .insert({
            title: documentTitle,
            content: documentContent,
            form_data: formData,
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
                <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button onClick={handleDownloadDOCX} variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  DOCX
                </Button>
                <Button onClick={handlePrint} className="gap-2 bg-gradient-primary">
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
                <div id="document-content" className="max-w-none text-foreground" style={{ fontFamily: 'Arial, sans-serif', maxHeight: '100vh', overflow: 'hidden' }}>
                  <div className="flex justify-end items-start mb-8" style={{ minHeight: '120px' }}>
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
                    />
                  </div>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: replaceTemplateVariables(template, formData)
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
      <header className="bg-card shadow-card border-b">
        <div className="container mx-auto px-6 py-6">
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
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Preencher Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fieldGroups ? (
                fieldGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary border-b border-border pb-2">
                      {group.getDynamicTitle ? group.getDynamicTitle(formData) : group.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm font-medium">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </Label>
                          {field.type === "textarea" ? (
                            <Textarea
                              id={field.name}
                              placeholder={field.placeholder}
                              value={formData[field.name] || ""}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              className="min-h-20"
                            />
                          ) : (
                            <Input
                              id={field.name}
                              type={field.type}
                              placeholder={field.placeholder}
                              value={formData[field.name] || ""}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                fields?.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="min-h-20"
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                ))
              )}
              
              <Button 
                onClick={handleGenerate} 
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {isEditing ? 'Atualizar Documento' : 'Gerar Documento'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DocumentForm;