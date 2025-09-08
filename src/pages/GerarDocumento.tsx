import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Copy, Check, ArrowLeft, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

const GerarDocumento = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  // Dados passados via state da navegação
  const { title, template, formData, documentType } = location.state || {};

  // Se não há dados, redirecionar para contratos
  if (!title || !template) {
    navigate('/contratos');
    return null;
  }

  const handleCopyContent = async () => {
    try {
      // Converter HTML para texto preservando formatação e espaços
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = template;
      
      // Função para preservar formatação HTML
      const preserveFormatting = (element: Element): string => {
        let result = '';
        
        for (const node of Array.from(element.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            // Preservar texto exatamente como está
            result += node.textContent || '';
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            
            // Preservar quebras de linha para divs e parágrafos
            if (el.tagName === 'DIV' || el.tagName === 'P') {
              result += preserveFormatting(el);
              if (el.nextSibling) {
                result += '\n';
              }
            }
            // Preservar quebras de linha para BR
            else if (el.tagName === 'BR') {
              result += '\n';
            }
            // Preservar conteúdo de SPAN e STRONG
            else if (el.tagName === 'SPAN' || el.tagName === 'STRONG') {
              result += preserveFormatting(el);
            }
            // Para outros elementos, apenas o conteúdo
            else {
              result += preserveFormatting(el);
            }
          }
        }
        
        return result;
      };
      
      let textContent = preserveFormatting(tempDiv);
      
      // Limpar apenas quebras de linha duplas desnecessárias, mas preservar espaços
      textContent = textContent
        .replace(/\n{3,}/g, '\n\n') // Máximo 2 quebras de linha seguidas
        .trim();
      
      // Tentar usar a API moderna do clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textContent);
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = textContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      toast.success('Conteúdo copiado para a área de transferência!');
      
      // Resetar o estado após 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar conteúdo. Tente selecionar e copiar manualmente.');
    }
  };

  const handlePrint = () => {
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
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('Gerando PDF...');
      
      // Configurações do PDF
      const opt = {
        margin: [10, 10, 10, 10], // [top, left, bottom, right]
        filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          logging: false,
          width: 800,
          height: 1000
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };

      // Criar elemento temporário para conversão
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = template;
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#000';
      tempDiv.style.maxWidth = '800px';
      tempDiv.style.margin = '0 auto';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.boxSizing = 'border-box';
      
      // Aplicar estilos para PDF
      const style = document.createElement('style');
      style.textContent = `
        * { 
          -webkit-print-color-adjust: exact; 
          color-adjust: exact;
          box-sizing: border-box;
        }
        img { 
          max-width: 100%; 
          height: auto; 
          display: block;
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
        .flex {
          display: flex !important;
        }
        .justify-content-space-between {
          justify-content: space-between !important;
        }
        .align-items-flex-start {
          align-items: flex-start !important;
        }
      `;
      tempDiv.appendChild(style);
      
      // Adicionar temporariamente ao DOM
      document.body.appendChild(tempDiv);
      
      // Gerar PDF
      await html2pdf().set(opt).from(tempDiv).save();
      
      // Remover elemento temporário
      document.body.removeChild(tempDiv);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

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
              <Button
                onClick={handleCopyContent}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Conteúdo
                  </>
                )}
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
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
            <h2 className="text-lg font-semibold mb-4">Documento Gerado:</h2>
            <div className="bg-white p-6 rounded border max-h-96 overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: template }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerarDocumento;
