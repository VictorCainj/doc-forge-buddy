import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Printer, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
const companyLogo = "https://i.imgur.com/xwz1P7v.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDateBrazilian } from "@/utils/dateFormatter";

interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  tooltip?: string;
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
          font-size: 14px !important;
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


  const handleSave = async () => {
    setSaving(true);
    try {
      const documentContent = replaceTemplateVariables(template, formData);
      const documentTitle = `${title} - ${formData.nomeLocatario || 'Sem nome'} - ${formatDateBrazilian(new Date())}`;
      
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
              <CardContent className="p-6 print:p-0">
                <div 
                  id="document-content" 
                  className="max-w-none text-foreground print:text-black" 
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '20mm',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}
                >
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
                          ) : field.type === "select" ? (
                            <select
                              id={field.name}
                              value={formData[field.name] || ""}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">{field.placeholder || "Selecione uma opção"}</option>
                              {field.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
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
                    ) : field.type === "select" ? (
                      <select
                        id={field.name}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{field.placeholder || "Selecione uma opção"}</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
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