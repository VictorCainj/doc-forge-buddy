import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseClipboardReturn {
  copyToClipboard: (text: string, messageId: string) => Promise<void>;
  copiedMessageId: string | null;
}

export const useClipboard = (): UseClipboardReturn => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (
    text: string,
    messageId: string
  ): Promise<void> => {
    try {
      // Tenta usar a API moderna do clipboard primeiro
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para navegadores mais antigos ou contextos não seguros
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('Falha no comando copy');
        }
      }

      setCopiedMessageId(messageId);
      toast({
        title: 'Texto copiado!',
        description: 'O texto foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast({
        title: 'Erro ao copiar',
        description:
          'Não foi possível copiar o texto. Tente selecionar e copiar manualmente (Ctrl+C).',
        variant: 'destructive',
      });
    }
  };

  return {
    copyToClipboard,
    copiedMessageId,
  };
};
