import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calculator,
  FileText,
  Printer,
  Save,
  Minimize2,
  Maximize2,
  Copy,
} from '@/utils/iconMapper';
import { CopyButton } from '@/components/ui/copy-button';
import { useNavigate } from 'react-router-dom';
import { getCompanyLogo } from '@/utils/logoManager';
import { useToast } from '@/hooks/use-toast';
import { formatDateBrazilian } from '@/utils/dateFormatter';
import { calculateAvisoPrevioWithAI } from '@/utils/openai';

interface FormData {
  dataComunicacao: string;
  dataVencimentoBoleto: string;
  valorAluguel: string;
  dataEntregaChaves: string;
  tipoCobranca: string;
  nomeLocatario: string;
  enderecoImovel: string;
  numeroContrato: string;
}

const CalculoAvisoPrevio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    dataComunicacao: '',
    dataVencimentoBoleto: '',
    valorAluguel: '',
    dataEntregaChaves: '',
    tipoCobranca: '',
    nomeLocatario: '',
    enderecoImovel: '',
    numeroContrato: '',
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [dynamicFontSize, setDynamicFontSize] = useState(14);

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const required = [
      'dataComunicacao',
      'dataVencimentoBoleto',
      'valorAluguel',
      'tipoCobranca',
    ];
    const missing = required.filter(
      (field) => !formData[field as keyof FormData]
    );

    if (missing.length > 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleCalculate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await calculateAvisoPrevioWithAI(
        formData.dataComunicacao,
        formData.dataVencimentoBoleto,
        formData.valorAluguel,
        formData.tipoCobranca,
        formData.dataEntregaChaves || undefined,
        formData.nomeLocatario || undefined,
        formData.enderecoImovel || undefined
      );

      setAiResult(result);
      setShowResults(true);

      toast({
        title: 'Cálculo concluído!',
        description: 'As orientações foram geradas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro no cálculo',
        description: 'Não foi possível processar o cálculo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecreaseFont = () => {
    if (dynamicFontSize > 10) {
      setDynamicFontSize(dynamicFontSize - 1);
      toast({
        title: 'Fonte reduzida',
        description: `O tamanho da fonte foi reduzido para ${dynamicFontSize - 1}px.`,
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
    }
  };

  const handlePrint = () => {
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.textContent = `
      @media print {
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
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          font-family: Arial, sans-serif !important;
        }
        
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
        
        .print-only {
          display: block !important;
        }
        
        @page {
          size: A4;
          margin: 0;
        }
      }
    `;

    const documentElement = document.getElementById('document-content');
    if (documentElement) {
      documentElement.classList.add('print-only');
    }

    document.head.appendChild(printStyles);
    window.print();

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

  const generateDocumentTemplate = () => {
    const currentDate = formatDateBrazilian(new Date());

    return `Valinhos, ${currentDate}.

ORIENTAÇÕES SOBRE AVISO PRÉVIO DE RESCISÃO

Contrato: ${formData.numeroContrato || 'Não informado'}
Locatário: ${formData.nomeLocatario || 'Não informado'}
Endereço: ${formData.enderecoImovel || 'Não informado'}

${aiResult}

_________________________________________
Responsável pela Gestão`;
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <header className="bg-card shadow-card border-b">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResults(false)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <h1 className="text-xl font-semibold text-foreground">
                  Orientações de Aviso Prévio
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDecreaseFont}
                  variant="outline"
                  className="gap-2"
                  title="Diminuir tamanho da fonte"
                >
                  <Minimize2 className="h-4 w-4" />
                  Diminuir
                </Button>
                <Button
                  onClick={handleIncreaseFont}
                  variant="outline"
                  className="gap-2"
                  title="Aumentar tamanho da fonte"
                >
                  <Maximize2 className="h-4 w-4" />
                  Aumentar
                </Button>
                <CopyButton
                  content={generateDocumentTemplate()}
                  className="gap-2"
                />
                <Button
                  onClick={handlePrint}
                  className="gap-2 bg-gradient-primary"
                >
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
                    fontSize: `${dynamicFontSize}px`,
                    whiteSpace: 'pre-line',
                  }}
                >
                  <div
                    className="flex justify-end items-start mb-8"
                    style={{ minHeight: '120px' }}
                  >
                    <img
                      src={getCompanyLogo()}
                      alt="Company Logo"
                      style={{
                        height: 'auto',
                        width: 'auto',
                        maxHeight: '120px',
                        maxWidth: '300px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                  <TextPreview content={generateDocumentTemplate()} />
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
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Cálculo de Aviso Prévio
              </h2>
              <p className="text-sm text-muted-foreground">
                Preencha as informações para gerar orientações personalizadas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Informações do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados Obrigatórios */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary border-b border-border pb-2">
                  Dados Obrigatórios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="dataComunicacao"
                      className="text-sm font-medium"
                    >
                      Data de Comunicação da Saída{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="dataComunicacao"
                      type="date"
                      value={formData.dataComunicacao}
                      onChange={(e) =>
                        handleInputChange('dataComunicacao', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="dataVencimentoBoleto"
                      className="text-sm font-medium"
                    >
                      Dia de Vencimento do Boleto{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="dataVencimentoBoleto"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ex: 15"
                      value={formData.dataVencimentoBoleto}
                      onChange={(e) =>
                        handleInputChange(
                          'dataVencimentoBoleto',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="valorAluguel"
                      className="text-sm font-medium"
                    >
                      Valor Mensal do Aluguel (R$){' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="valorAluguel"
                      type="number"
                      placeholder="Ex: 1500.00"
                      value={formData.valorAluguel}
                      onChange={(e) =>
                        handleInputChange('valorAluguel', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="tipoCobranca"
                      className="text-sm font-medium"
                    >
                      Tipo de Cobrança{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="tipoCobranca"
                      value={formData.tipoCobranca}
                      onChange={(e) =>
                        handleInputChange('tipoCobranca', e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="antecipado">Aluguel antecipado</option>
                      <option value="pos-pago">Aluguel pós-pago</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dados Opcionais */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary border-b border-border pb-2">
                  Informações Complementares
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="dataEntregaChaves"
                      className="text-sm font-medium"
                    >
                      Data que o Locatário Entregou as Chaves
                    </Label>
                    <Input
                      id="dataEntregaChaves"
                      type="date"
                      value={formData.dataEntregaChaves}
                      onChange={(e) =>
                        handleInputChange('dataEntregaChaves', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="numeroContrato"
                      className="text-sm font-medium"
                    >
                      Número do Contrato
                    </Label>
                    <Input
                      id="numeroContrato"
                      type="text"
                      placeholder="Ex: 13734"
                      value={formData.numeroContrato}
                      onChange={(e) =>
                        handleInputChange('numeroContrato', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="nomeLocatario"
                      className="text-sm font-medium"
                    >
                      Nome do Locatário
                    </Label>
                    <Input
                      id="nomeLocatario"
                      type="text"
                      placeholder="Nome completo do locatário"
                      value={formData.nomeLocatario}
                      onChange={(e) =>
                        handleInputChange('nomeLocatario', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="enderecoImovel"
                      className="text-sm font-medium"
                    >
                      Endereço do Imóvel
                    </Label>
                    <Textarea
                      id="enderecoImovel"
                      placeholder="Endereço completo do imóvel"
                      value={formData.enderecoImovel}
                      onChange={(e) =>
                        handleInputChange('enderecoImovel', e.target.value)
                      }
                      className="min-h-20"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCalculate}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular e Gerar Orientações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Componente para renderizar texto puro
const TextPreview = ({ content }: { content: string }) => {
  return (
    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{content}</div>
  );
};

export default CalculoAvisoPrevio;
