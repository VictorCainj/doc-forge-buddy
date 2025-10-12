import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from '@/utils/iconMapper';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/copyTextUtils';

interface CopyButtonProps {
  content: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const CopyButton = ({
  content,
  className = '',
  size = 'sm',
  variant = 'outline',
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      setCopying(true);

      // Verificar se há imagens no conteúdo
      const hasImages = /<img[^>]+src=["'][^"']+["'][^>]*>/i.test(content);

      const success = await copyToClipboard(content);

      if (success) {
        setCopied(true);
        const description = hasImages
          ? 'Documento copiado com texto, formatação e imagens! Pronto para colar no e-mail.'
          : 'O conteúdo foi copiado para a área de transferência com formatação preservada.';

        toast({
          title: 'Documento copiado!',
          description,
        });

        // Resetar estado após 2 segundos
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Falha ao copiar');
      }
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o texto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      title="Copiar documento completo (texto, formatação e imagens)"
      disabled={copying}
    >
      {copying ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Copiando...
        </>
      ) : copied ? (
        <>
          <Check className="h-4 w-4" />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copiar
        </>
      )}
    </Button>
  );
};
