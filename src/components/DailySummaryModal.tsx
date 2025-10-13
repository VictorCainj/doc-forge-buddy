import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, Loader2, CheckCircle2 } from '@/utils/iconMapper';
import { useToast } from '@/hooks/use-toast';
import { exportSummaryToPDF } from '@/utils/pdfExport';

interface DailySummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string;
  isGenerating: boolean;
  userName: string;
}

export const DailySummaryModal = ({
  open,
  onOpenChange,
  summary,
  isGenerating,
  userName,
}: DailySummaryModalProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      // Tentar usar a API moderna primeiro
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summary);
      } else {
        // Fallback: método tradicional
        const textArea = document.createElement('textarea');
        textArea.value = summary;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } finally {
          textArea.remove();
        }
      }

      setIsCopied(true);
      toast({
        title: 'Copiado!',
        description: 'O resumo foi copiado para a área de transferência.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o texto.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      await exportSummaryToPDF(summary, userName, today);
      toast({
        title: 'PDF exportado!',
        description: 'O resumo foi exportado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Resumo do Dia</DialogTitle>
          <DialogDescription>
            Resumo narrativo das atividades do dia gerado pela IA
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
              <p className="text-sm text-neutral-600">Gerando resumo...</p>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
              <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                {summary}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={isGenerating || !summary}
          >
            {isCopied ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Texto
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isGenerating || isExporting || !summary}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </>
            )}
          </Button>
          <Button onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
