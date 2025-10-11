import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Printer,
  Minimize2,
  Maximize2,
  FileText,
  Download,
} from '@/utils/iconMapper';
import { CopyButton } from '@/components/ui/copy-button';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

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
        return `Título: Confirmação de Notificação de Desocupação e Procedimentos Finais - Contrato ${contractNumber}`;
      case 'Devolutiva Proprietário':
        return `Título: [CONTRATO] - Notificação de Desocupação e Agendamento de Vistoria.`;
      case 'Notificação de Agendamento': {
        // Verificar se é revistoria ou vistoria final baseado no título
        const isRevistoria = title?.includes('Revistoria');
        const tipoVistoria = isRevistoria ? 'Revistoria' : 'Vistoria Final';
        return `Título: Notificação para Realização de ${tipoVistoria} - Contrato ${contractNumber}`;
      }
      case 'Devolutiva Comercial':
        return `Título: Devolutiva Comercial - Contrato ${contractNumber}`;
      case 'Notificação de Desocupação - Comercial':
        return `Título: Notificação de Desocupação - Comercial - Contrato ${contractNumber}`;
      case 'Notificação de Desocupação e Agendamento de Vistoria':
        return `Título: Contrato ${contractNumber} - Notificação de Desocupação e Agendamento de Vistoria`;
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

  const handleDecreaseFont = () => {
    if (fontSize > 10) {
      setFontSize(fontSize - 1);
      toast.success(`Fonte reduzida para ${fontSize - 1}px`);
    } else {
      toast.info('Já no tamanho mínimo de fonte (10px)');
    }
  };

  const handleIncreaseFont = () => {
    if (fontSize < 20) {
      setFontSize(fontSize + 1);
      toast.success(`Fonte aumentada para ${fontSize + 1}px`);
    } else {
      toast.info('Já no tamanho máximo de fonte (20px)');
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
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
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

  // Verificar se é uma devolutiva (não deve mostrar botão Exportar)
  const isDevolutiva =
    documentType &&
    (documentType.includes('Devolutiva') ||
      documentType === 'Notificação de Desocupação e Agendamento de Vistoria' ||
      documentType === 'Notificação de Desocupação - Comercial');

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Minimalista */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => {
                  // Se for análise de vistoria, voltar para a página de análise
                  if (documentType === 'Análise de Vistoria') {
                    navigate('/analise-vistoria');
                  } else {
                    navigate('/contratos');
                  }
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="h-6 w-px bg-neutral-200" />
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  {getDocumentTitle()}
                </h1>
                <p className="text-sm text-neutral-500">
                  {isWhatsAppMessage
                    ? 'Mensagem para WhatsApp'
                    : 'Visualização do documento gerado'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {documentType === 'Análise de Vistoria' && (
                <Button
                  onClick={() => navigate('/analise-vistoria')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  title="Continuar editando a análise"
                >
                  <FileText className="h-4 w-4" />
                  Continuar Editando
                </Button>
              )}
              <Button
                onClick={handleDecreaseFont}
                variant="ghost"
                size="sm"
                className="gap-2"
                title="Diminuir tamanho da fonte"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleIncreaseFont}
                variant="ghost"
                size="sm"
                className="gap-2"
                title="Aumentar tamanho da fonte"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <CopyButton content={template} size="sm" className="gap-2" />
              <Button
                onClick={handlePrint}
                variant="primary"
                size="sm"
                className="gap-2"
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {isPrinting ? 'Preparando...' : 'Imprimir'}
              </Button>
              {!isDevolutiva && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Document Preview - Minimalista */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div
              className={`p-8 rounded-lg max-h-[calc(100vh-200px)] overflow-auto ${
                isWhatsAppMessage
                  ? 'bg-white border border-success-200'
                  : 'bg-white'
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
  );
};

export default GerarDocumento;
