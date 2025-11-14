import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Printer,
  Minimize2,
  Maximize2,
  FileText,
  Copy,
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
  const {
    title,
    template,
    secondaryTemplate,
    formData,
    documentType,
    preserveAnalysisState,
    contractId,
    invitationMessage,
    invitationMessageHtml,
  } = location.state || {};

  // Se não há dados, redirecionar para contratos
  if (!title || !template) {
    navigate('/contratos');
    return null;
  }

  // Verificar se há template secundário (e-mail de convite)
  const hasSecondaryTemplate =
    secondaryTemplate && secondaryTemplate.trim() !== '';
  const rawInvitationHtml =
    typeof invitationMessageHtml === 'string' && invitationMessageHtml.trim().length > 0
      ? invitationMessageHtml.trim()
      : '';
  const invitationMessageText =
    typeof invitationMessage === 'string' ? invitationMessage.trim() : '';
  const hasInvitationMessage =
    rawInvitationHtml !== '' || invitationMessageText !== '';
  const invitationHtml = rawInvitationHtml || invitationMessageText.replace(/\n/g, '<br />');

  const secondaryBlockForCopy = hasSecondaryTemplate ? secondaryTemplate : '';

  const combinedDocumentContent =
    documentType === 'Convite para Acompanhamento'
      ? invitationMessageText || invitationHtml || template
      : [template, secondaryBlockForCopy]
          .filter((section) => section && section.trim().length > 0)
          .join('\n\n');

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
      case 'Convite para Acompanhamento':
        return `Convite para Acompanhamento da Vistoria de Saída - Contrato N° ${contractNumber}`;
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

  const handleCopyRenderedContent = async (elementId: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error('Elemento não encontrado para copiar');
        return;
      }

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);

      const textToCopy = selection.toString();
      selection?.removeAllRanges();

      await navigator.clipboard.writeText(textToCopy);
      toast.success('Conteúdo copiado!');
    } catch (error) {
      console.error('Erro ao copiar conteúdo renderizado:', error);
      toast.error('Erro ao copiar. Tente novamente.');
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

      // Montar conteúdo completo incluindo convite e template secundário se existirem
      const printContent = template;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            ${printCSS}
          </head>
          <body>
            ${printContent}
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header Minimalista */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => {
                  // Se for análise de vistoria, voltar para a página de análise com ID do contrato
                  if (documentType === 'Análise de Vistoria' && contractId) {
                    navigate(`/analise-vistoria/${contractId}`, {
                      state: preserveAnalysisState,
                    });
                  } else if (documentType === 'Análise de Vistoria') {
                    navigate('/analise-vistoria', {
                      state: preserveAnalysisState,
                    });
                  } else {
                    navigate('/contratos');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="h-6 w-px bg-neutral-300" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-0.5">
                    {getDocumentTitle()}
                  </h1>
                  <p className="text-sm text-neutral-600">
                    {isWhatsAppMessage
                      ? 'Mensagem para WhatsApp'
                      : 'Visualização do documento gerado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {documentType === 'Análise de Vistoria' && (
                <Button
                  onClick={() => {
                    // Usar rota parametrizada se tiver contractId
                    if (contractId) {
                      navigate(`/analise-vistoria/${contractId}`, {
                        state: preserveAnalysisState,
                      });
                    } else {
                      navigate('/analise-vistoria', {
                        state: preserveAnalysisState,
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
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
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-all duration-200"
                title="Diminuir tamanho da fonte"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleIncreaseFont}
                variant="ghost"
                size="sm"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-all duration-200"
                title="Aumentar tamanho da fonte"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {documentType === 'Convite para Acompanhamento' ? (
                <Button
                  onClick={() => handleCopyRenderedContent('document-content')}
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              ) : (
                <CopyButton
                  content={combinedDocumentContent}
                  size="sm"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
                />
              )}
              <Button
                onClick={handlePrint}
                variant="primary"
                size="sm"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {isPrinting ? 'Preparando...' : 'Imprimir'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
        {/* Document Preview - Primeiro Documento */}
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

        {/* Convite para Acompanhamento */}
        {hasInvitationMessage && documentType !== 'Convite para Acompanhamento' && (
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div
                className="p-8 rounded-lg max-h-[calc(100vh-200px)] overflow-auto"
                style={{ fontSize: `${fontSize}px`, backgroundColor: 'white' }}
                id="invitation-content-rendered"
              >
                <div dangerouslySetInnerHTML={{ __html: invitationHtml }} />
              </div>
            </CardContent>
            <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                Copie este convite para envio por e-mail.
              </p>
              <Button
                onClick={() => handleCopyRenderedContent('invitation-content-rendered')}
                size="sm"
                variant="outline"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
            </div>
          </Card>
        )}

        {/* Segundo Documento - E-mail de Convite (apenas para Vistoria Final) */}
        {hasSecondaryTemplate && (
          <Card className="shadow-sm">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
                    Assunto do E-mail: Convite para Acompanhamento da Vistoria
                    de Saída - Contrato N°{' '}
                    {formData?.numeroContrato || '[Número]'}
                  </h2>
                  <p className="text-xs text-neutral-600">Documento separado</p>
                </div>
              </div>
              <CopyButton
                content={secondaryTemplate}
                size="sm"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
              />
            </div>
            <CardContent className="p-0">
              <div
                className="p-8 rounded-lg max-h-[calc(100vh-200px)] overflow-auto bg-white"
                style={{ fontSize: `${fontSize}px`, backgroundColor: 'white' }}
                id="secondary-document-content"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: secondaryTemplate }}
                  style={{ backgroundColor: 'white', color: 'black' }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Componente para renderizar template de forma segura
// const SafeTemplateContent = ({ html }: { html: string }) => {
//   const safeHTML = useSafeHTML(html);
//   return (
//     <div
//       dangerouslySetInnerHTML={{ __html: safeHTML }}
//       style={{ backgroundColor: 'white', color: 'black' }}
//     />
//   );
// };

export default GerarDocumento;
