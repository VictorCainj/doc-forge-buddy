import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Printer,
  Minimize2,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const GerarDocumento = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPrinting, setIsPrinting] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  // Dados passados via state da navegação
  const { title, template, formData, documentType } = location.state || {};

  // Se não há dados, redirecionar para contratos
  if (!title || !template) {
    navigate('/contratos');
    return null;
  }

  // Função para gerar título baseado no tipo de documento
  const getDocumentTitle = () => {
    const contractNumber = formData?.numeroContrato || '[Número]';

    switch (documentType) {
      case 'Devolutiva Locatário':
        return `Título: Confirmação de Notificação de Rescisão e Procedimentos Finais - Contrato ${contractNumber}`;
      case 'Devolutiva Proprietário':
        return `Título: Notificação de Rescisão e Agendamento de Vistoria - Contrato ${contractNumber}`;
      case 'Notificação de Agendamento': {
        // Verificar se é revistoria ou vistoria final baseado no título
        const isRevistoria = title?.includes('Revistoria');
        const tipoVistoria = isRevistoria ? 'Revistoria' : 'Vistoria Final';
        return `Título: Notificação para Realização de ${tipoVistoria} - Contrato ${contractNumber}`;
      }
      case 'Devolutiva Comercial':
        return `Título: Devolutiva Comercial - Contrato ${contractNumber}`;
      case 'Distrato de Contrato de Locação':
        return `Título: Instrumento Particular de Rescisão de Contrato de Locação - Contrato ${contractNumber}`;
      case 'Termo de Recusa de Assinatura - E-mail':
        return `Título: Termo de Recusa de Assinatura - E-mail (Etapa 1) - Contrato ${contractNumber}`;
      case 'Termo de Recusa de Assinatura - PDF':
        return `Título: Registro de Vistoria de Saída - Recusa de Assinatura (Etapa 2) - Contrato ${contractNumber}`;
      default:
        return `Título: ${documentType} - Contrato ${contractNumber}`;
    }
  };

  const handleCompact = () => {
    if (fontSize > 11) {
      setFontSize(11);
      toast.success('Documento compactado - Fonte reduzida para 11px');
    } else if (fontSize > 10) {
      setFontSize(10);
      toast.success('Documento super compactado - Fonte reduzida para 10px');
    } else {
      toast.info('Já no tamanho mínimo de fonte (10px)');
    }
  };

  const handlePrint = () => {
    if (isPrinting) return;

    setIsPrinting(true);
    try {
      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error(
          'Não foi possível abrir a janela de impressão. Verifique se o popup está bloqueado.'
        );
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
              font-size: ${fontSize}px;
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
            font-size: ${fontSize}px;
            margin: 0;
            padding: 20px;
          }
        </style>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            ${printCSS}
          </head>
          <body>
            ${template}
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

      toast.success(
        'Abrindo janela de impressão... Dica: Nas opções de impressão, desmarque "Cabeçalhos e rodapés" para uma impressão mais limpa.'
      );
    } catch {
      toast.error('Erro ao abrir impressão. Tente novamente.');
    } finally {
      setIsPrinting(false);
    }
  };

  // Verificar se é uma mensagem do WhatsApp
  const isWhatsAppMessage = documentType?.includes('WhatsApp');

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <div className="professional-header">
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Gerador de Documentos
                </h1>
                <p className="text-white/80 text-lg">
                  Visualização e impressão de documentos gerados
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {documentType}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-white/90">
                <p className="text-sm">
                  Contrato {formData?.numeroContrato || '[Número]'}
                </p>
                <p className="text-xs text-white/70">
                  Documento gerado automaticamente
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  onClick={() => navigate('/contratos')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Document Controls */}
          <Card className="glass-card mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    {title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Gerando {documentType} baseado nos dados do contrato
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleCompact}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    title="Compactar documento para economizar espaço"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Compactar
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="default"
                    size="sm"
                    className="gap-2"
                    disabled={isPrinting}
                  >
                    {isPrinting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Printer className="h-4 w-4" />
                    )}
                    {isPrinting ? 'Preparando...' : 'Imprimir'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Document Preview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                {getDocumentTitle()}
              </CardTitle>
              <p className="text-muted-foreground">
                {isWhatsAppMessage
                  ? 'Mensagem para WhatsApp'
                  : 'Visualização do documento gerado'}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className={`p-6 rounded-lg border max-h-[600px] overflow-auto ${
                  isWhatsAppMessage
                    ? 'bg-white border-green-200/50'
                    : 'bg-white border-gray-300'
                }`}
                style={{ fontSize: `${fontSize}px`, backgroundColor: 'white' }}
                id="document-content"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: template }}
                  style={{ backgroundColor: 'white', color: 'black' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GerarDocumento;
