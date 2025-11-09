import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { replaceTemplateVariables } from '../utils/templateProcessor';

interface UseDocumentPreviewProps {
  title: string;
  template: string;
  getTemplate?: (fontSize: number) => string;
  termId?: string;
  isEditing?: boolean;
}

interface UseDocumentPreviewReturn {
  showPreview: boolean;
  saving: boolean;
  processedFormData: Record<string, string>;
  setShowPreview: (show: boolean) => void;
  setProcessedFormData: (data: Record<string, string>) => void;
  handlePrint: () => void;
  handleSave: () => Promise<void>;
}

/**
 * Hook para gerenciar preview e impressão de documentos
 */
export const useDocumentPreview = ({
  title,
  template,
  termId,
  isEditing = false,
}: UseDocumentPreviewProps): UseDocumentPreviewReturn => {
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processedFormData, setProcessedFormData] = useState<
    Record<string, string>
  >({});
  const { toast } = useToast();

  const handlePrint = useCallback(() => {
    if (!processedFormData || Object.keys(processedFormData).length === 0) {
      toast({
        title: 'Erro',
        description:
          'Nenhum documento foi gerado ainda. Complete o formulário primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'Erro',
          description:
            'Não foi possível abrir a janela de impressão. Verifique se o popup está bloqueado.',
          variant: 'destructive',
        });
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

      // Obter o conteúdo do documento
      const documentElement = document.getElementById('document-content');
      const documentContent = documentElement ? documentElement.innerHTML : '';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            ${printCSS}
          </head>
          <body>
            ${documentContent}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Aguardar o conteúdo carregar antes de imprimir
      setTimeout(() => {
        printWindow.print();

        // Fechar a janela após um tempo
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);

      toast({
        title: 'Impressão',
        description:
          "Abrindo janela de impressão... Dica: Nas opções de impressão, desmarque 'Cabeçalhos e rodapés' para uma impressão mais limpa.",
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao abrir impressão. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [processedFormData, title, toast]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const documentContent = replaceTemplateVariables(
        template,
        processedFormData
      );
      const documentTitle = `${title} - ${processedFormData.nomeLocatario || 'Sem nome'} - ${formatDateBrazilian(new Date())}`;

      if (isEditing && termId) {
        const { error } = await supabase
          .from('saved_terms')
          .update({
            title: documentTitle,
            content: documentContent,
            form_data: processedFormData,
          })
          .eq('id', termId);

        if (error) throw error;

        toast({
          title: 'Documento atualizado!',
          description: 'O termo foi atualizado com sucesso.',
        });
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        const { error } = await supabase.from('saved_terms').insert({
          title: documentTitle,
          content: documentContent,
          form_data: processedFormData,
          document_type: 'termo-inquilino',
          user_id: user.id,
        });

        if (error) throw error;

        toast({
          title: 'Documento salvo!',
          description:
            "O termo foi salvo com sucesso e pode ser acessado em 'Termos Salvos'.",
        });
      }
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o documento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [template, processedFormData, title, isEditing, termId, toast]);

  return {
    showPreview,
    saving,
    processedFormData,
    setShowPreview,
    setProcessedFormData,
    handlePrint,
    handleSave,
  };
};
