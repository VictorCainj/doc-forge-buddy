import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';
import { adaptHTMLForEmail } from '@/utils/emailAdapter';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  fromEmail?: string;
  fromName?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Hook para envio de e-mails via edge function
 */
export const useSendEmail = () => {
  const sendEmail = async ({
    to,
    subject,
    htmlContent,
    fromEmail,
    fromName,
  }: SendEmailParams): Promise<SendEmailResult> => {
    try {
      log.debug('Enviando e-mail', { to, subject });

      // Adaptar HTML para formato de e-mail (async agora)
      const emailHTML = await adaptHTMLForEmail(htmlContent);

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          htmlContent: emailHTML,
          fromEmail,
          fromName,
        },
      });

      if (error) {
        log.error('Erro ao enviar e-mail:', error);
        throw new Error(error.message || 'Erro ao enviar e-mail');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao enviar e-mail');
      }

      log.info('E-mail enviado com sucesso', { messageId: data.messageId });

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (error) {
      log.error('Erro no hook useSendEmail:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao enviar e-mail',
      };
    }
  };

  return { sendEmail };
};

