import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const GerarDocumento = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  
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
        return `Título: Notificação de Desocupação e Agendamento de Vistoria - Contrato ${contractNumber}`;
      case 'Notificação de Agendamento':
        return `Título: Notificação para Realização de Vistoria Final - Contrato ${contractNumber}`;
      case 'Distrato de Contrato de Locação':
        return `Título: Instrumento Particular de Rescisão de Contrato de Locação - Contrato ${contractNumber}`;
      default:
        return `Título: ${documentType} - Contrato ${contractNumber}`;
    }
  };


  const handlePrint = () => {
    if (isPrinting) return;
    
    setIsPrinting(true);
    try {
      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Não foi possível abrir a janela de impressão. Verifique se o popup está bloqueado.');
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

      toast.success('Abrindo janela de impressão... Dica: Nas opções de impressão, desmarque "Cabeçalhos e rodapés" para uma impressão mais limpa.');
    } catch (error) {
      toast.error('Erro ao abrir impressão. Tente novamente.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopyWhatsAppMessage = async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    try {
      // Extrair apenas o texto da mensagem (sem HTML) e converter para formato WhatsApp
      let textContent = template
        .replace(/<[^>]*>/g, '') // Remove todas as tags HTML
        .replace(/&nbsp;/g, ' ') // Substitui &nbsp; por espaço
        .replace(/\s+/g, ' ') // Remove espaços múltiplos
        .trim();
      
      // Converter negrito HTML para negrito WhatsApp
      textContent = textContent.replace(/\*\*(.*?)\*\*/g, '*$1*');
      
      // Adicionar emojis e formatação para WhatsApp
      textContent = textContent.replace(/MADIA IMÓVEIS/g, '🏠 *MADIA IMÓVEIS* 🏠');
      textContent = textContent.replace(/VICTOR/g, '*VICTOR*');
      textContent = textContent.replace(/Setor de Desocupação/g, '*Setor de Desocupação*');
      
      await navigator.clipboard.writeText(textContent);
      toast.success('Mensagem copiada para a área de transferência! Cole no WhatsApp.');
    } catch (error) {
      toast.error('Erro ao copiar mensagem. Tente novamente.');
    } finally {
      setIsCopying(false);
    }
  };

  // Verificar se é uma mensagem do WhatsApp
  const isWhatsAppMessage = documentType?.includes('WhatsApp');

  return (
    <div className="min-h-screen bg-gradient-secondary p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-gray-600 mt-1">Gerando {documentType} baseado nos dados do contrato</p>
            </div>
            <div className="flex gap-2">
              {isWhatsAppMessage ? (
                <Button
                  onClick={handleCopyWhatsAppMessage}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                  disabled={isCopying}
                >
                  {isCopying ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {isCopying ? 'Copiando...' : 'Copiar Mensagem'}
                </Button>
              ) : (
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  {isPrinting ? 'Preparando...' : 'Imprimir'}
                </Button>
              )}
              <Button
                onClick={() => navigate('/contratos')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar aos Contratos
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-800 mb-2">{getDocumentTitle()}</h1>
              <h2 className="text-lg font-semibold">
                {isWhatsAppMessage ? 'Mensagem para WhatsApp:' : 'Documento Gerado:'}
              </h2>
            </div>
            <div className={`p-6 rounded border max-h-96 overflow-auto ${
              isWhatsAppMessage 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: template }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerarDocumento;
