import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
  fromEmail?: string;
  fromName?: string;
}

serve(async (req): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, htmlContent, fromEmail, fromName }: EmailRequest =
      await req.json();

    if (!to || !subject || !htmlContent) {
      throw new Error('Campos obrigatórios: to, subject, htmlContent');
    }

    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error('E-mail do destinatário inválido');
    }

    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }

    // Criar cliente Supabase com service role key para acessar recursos administrativos
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Usar Resend API para envio de e-mails (configurar variável RESEND_API_KEY)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      // Fallback: usar Supabase Auth para envio (se disponível)
      // Nota: Supabase Auth tem limitações para envio de HTML complexo
      throw new Error(
        'RESEND_API_KEY não configurada. Configure a chave da API Resend.'
      );
    }

    // Enviar e-mail via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail || 'DocForge <noreply@docforge.com>',
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error('Resend API Error:', error);
      throw new Error(`Erro ao enviar e-mail: ${resendResponse.status}`);
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        message: 'E-mail enviado com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    console.error('Erro ao enviar e-mail:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

