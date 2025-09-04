import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Printer, Download, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { Document, Paragraph, TextRun, Packer } from "docx";
import { saveAs } from "file-saver";
import companyLogo from "@/assets/company-logo.png";

interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number";
  required?: boolean;
  placeholder?: string;
}

interface DocumentFormProps {
  title: string;
  description: string;
  fields: FormField[];
  template: string;
  onGenerate: (data: Record<string, string>) => void;
}

const DocumentForm = ({ title, description, fields, template, onGenerate }: DocumentFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = () => {
    onGenerate(formData);
    setShowPreview(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('document-content');
    const opt = {
      margin: 1,
      filename: `${title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
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
              <CardContent className="p-8 print:p-12">
                <div id="document-content" className="prose prose-lg max-w-none text-foreground">
                  <div className="flex justify-between items-start mb-8">
                    <img src={companyLogo} alt="Company Logo" className="h-16 w-auto" />
                    <div className="flex-1"></div>
                  </div>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: replaceTemplateVariables(template, formData)
                        .replace(/\n/g, '<br/>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
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
              {fields.map((field) => (
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
              
              <Button 
                onClick={handleGenerate} 
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                Gerar Documento
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DocumentForm;