import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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
