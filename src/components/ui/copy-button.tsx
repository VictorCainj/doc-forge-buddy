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
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      const success = await copyToClipboard(content);

      if (success) {
        setCopied(true);
        toast({
          title: 'Texto copiado!',
          description:
            'O conteúdo foi copiado para a área de transferência com formatação preservada.',
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
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      title="Copiar texto do documento"
    >
      {copied ? (
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
