import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSendEmail } from '@/hooks/useSendEmail';
import { Mail, Loader2 } from '@/utils/iconMapper';

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlContent: string;
  defaultSubject: string;
  defaultTo?: string;
}

export const SendEmailModal = ({
  open,
  onOpenChange,
  htmlContent,
  defaultSubject,
  defaultTo,
}: SendEmailModalProps) => {
  const { toast } = useToast();
  const { sendEmail } = useSendEmail();
  const [email, setEmail] = useState(defaultTo || '');
  const [subject, setSubject] = useState(defaultSubject);
  const [isSending, setIsSending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async () => {
    // Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Por favor, insira um e-mail válido.',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: 'Assunto obrigatório',
        description: 'Por favor, insira um assunto para o e-mail.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setIsProcessing(true);

    try {
      // O processamento das imagens acontece dentro do sendEmail
      const result = await sendEmail({
        to: email,
        subject: subject.trim(),
        htmlContent,
      });

      if (result.success) {
        toast({
          title: 'E-mail enviado!',
          description: `O documento foi enviado com sucesso para ${email}. Todas as imagens foram incluídas no formato perfeito para visualização.`,
        });
        onOpenChange(false);
        // Limpar campos
        setEmail('');
        setSubject(defaultSubject);
      } else {
        throw new Error(result.error || 'Erro ao enviar e-mail');
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar e-mail',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível enviar o e-mail. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Documento por E-mail
          </DialogTitle>
          <DialogDescription>
            Envie o documento comparativo de vistoria por e-mail com todas as
            imagens comparativas incluídas. O documento será processado e todas
            as imagens serão convertidas para formato perfeito para visualização
            em e-mail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail do Destinatário *</Label>
            <Input
              id="email"
              type="email"
              placeholder="destinatario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto do E-mail *</Label>
            <Input
              id="subject"
              placeholder="Assunto do e-mail"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || isProcessing}>
            {isSending || isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isProcessing ? 'Processando imagens...' : 'Enviando...'}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar E-mail
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

