/**
 * Edge Function para verificação periódica de notificações
 * Executa via cron job para verificar contratos expirando e criar notificações
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Criar cliente Supabase com service role para acesso completo
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todos os usuários ativos
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) throw usersError;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    let notificationsCreated = 0;
    let errors = 0;

    // Processar cada usuário
    for (const user of users.users || []) {
      try {
        // Buscar contratos do usuário
        const { data: contracts, error: contractsError } = await supabase
          .from('saved_terms')
          .select('id, form_data, user_id')
          .eq('user_id', user.id)
          .not('form_data', 'is', null);

        if (contractsError) {
          console.error(`Erro ao buscar contratos do usuário ${user.id}:`, contractsError);
          errors++;
          continue;
        }

        if (!contracts || contracts.length === 0) continue;

        // Processar cada contrato
        for (const contract of contracts) {
          try {
            const formData = contract.form_data as any;
            const terminationDate = formData?.dataTerminoRescisao;

            if (!terminationDate) continue;

            const termDate = new Date(terminationDate);
            const daysRemaining = Math.ceil(
              (termDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Criar notificação se estiver entre 1 e 30 dias
            if (daysRemaining >= 1 && daysRemaining <= 30) {
              const contractNumber = formData?.numeroContrato || 'N/A';

              // Verificar se já existe notificação recente para este contrato
              const { data: existingNotifications } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('metadata->>contract_id', contract.id)
                .in('type', ['contract_expiring', 'contract_expiring_7days', 'contract_expiring_1day'])
                .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .limit(1);

              if (!existingNotifications || existingNotifications.length === 0) {
                const title =
                  daysRemaining <= 1
                    ? `Contrato ${contractNumber} expira hoje!`
                    : daysRemaining <= 7
                      ? `Contrato ${contractNumber} expira em ${daysRemaining} dias`
                      : `Contrato ${contractNumber} próximo de expiração`;

                const message =
                  daysRemaining <= 1
                    ? `O contrato ${contractNumber} expira hoje (${terminationDate}). Ação necessária.`
                    : daysRemaining <= 7
                      ? `O contrato ${contractNumber} expira em ${daysRemaining} dias (${terminationDate}).`
                      : `O contrato ${contractNumber} expira em ${daysRemaining} dias (${terminationDate}).`;

                const type =
                  daysRemaining <= 1
                    ? 'contract_expiring_1day'
                    : daysRemaining <= 7
                      ? 'contract_expiring_7days'
                      : 'contract_expiring';

                const priority =
                  daysRemaining <= 1 ? 'urgent' : daysRemaining <= 7 ? 'high' : 'normal';

                // Criar notificação
                const { error: notificationError } = await supabase.rpc(
                  'create_notification',
                  {
                    p_user_id: user.id,
                    p_type: type,
                    p_title: title,
                    p_message: message,
                    p_metadata: {
                      contract_id: contract.id,
                      days_remaining: daysRemaining,
                      date: terminationDate,
                    },
                    p_priority: priority,
                    p_expires_at: terminationDate,
                  }
                );

                if (notificationError) {
                  console.error(`Erro ao criar notificação para contrato ${contract.id}:`, notificationError);
                  errors++;
                } else {
                  notificationsCreated++;
                }
              }
            }
          } catch (error) {
            console.error(`Erro ao processar contrato ${contract.id}:`, error);
            errors++;
          }
        }

        // Verificar vistorias agendadas para amanhã
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const { data: vistorias, error: vistoriasError } = await supabase
          .from('vistoria_analises')
          .select('id, contract_id, dados_vistoria, title')
          .eq('user_id', user.id)
          .not('dados_vistoria', 'is', null);

        if (!vistoriasError && vistorias) {
          for (const vistoria of vistorias) {
            try {
              const dadosVistoria = vistoria.dados_vistoria as any;
              const vistoriaDate = dadosVistoria?.dataVistoria;

              if (!vistoriaDate) continue;

              const vistoriaDateObj = new Date(vistoriaDate);
              const vistoriaDateStr = vistoriaDateObj.toISOString().split('T')[0];

              // Se a vistoria for amanhã ou hoje, criar lembrete
              if (vistoriaDateStr === tomorrowStr || vistoriaDateStr === today.toISOString().split('T')[0]) {
                const isToday = vistoriaDateStr === today.toISOString().split('T')[0];

                // Verificar se já existe notificação de lembrete
                const { data: existingReminder } = await supabase
                  .from('notifications')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('metadata->>vistoria_id', vistoria.id)
                  .in('type', ['vistoria_reminder', 'vistoria_today'])
                  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                  .limit(1);

                if (!existingReminder || existingReminder.length === 0) {
                  const contractTitle = vistoria.title || 'Contrato';
                  const contractNumber = contractTitle.split(' ')[1] || 'N/A';

                  const { error: reminderError } = await supabase.rpc(
                    'create_notification',
                    {
                      p_user_id: user.id,
                      p_type: isToday ? 'vistoria_today' : 'vistoria_reminder',
                      p_title: isToday
                        ? `Vistoria hoje: ${contractNumber}`
                        : `Lembrete: Vistoria amanhã - ${contractNumber}`,
                      p_message: isToday
                        ? `A vistoria do contrato ${contractNumber} está agendada para hoje (${vistoriaDate}).`
                        : `A vistoria do contrato ${contractNumber} está agendada para amanhã (${vistoriaDate}).`,
                      p_metadata: {
                        vistoria_id: vistoria.id,
                        contract_id: vistoria.contract_id,
                        date: vistoriaDate,
                      },
                      p_priority: isToday ? 'urgent' : 'high',
                      p_expires_at: vistoriaDate,
                    }
                  );

                  if (reminderError) {
                    console.error(`Erro ao criar lembrete de vistoria ${vistoria.id}:`, reminderError);
                    errors++;
                  } else {
                    notificationsCreated++;
                  }
                }
              }
            } catch (error) {
              console.error(`Erro ao processar vistoria ${vistoria.id}:`, error);
              errors++;
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao processar usuário ${user.id}:`, error);
        errors++;
      }
    }

    // Limpar notificações expiradas e lidas
    const { data: cleanedCount } = await supabase.rpc('cleanup_expired_notifications');

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated,
        errors,
        cleanedCount: cleanedCount || 0,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro na função check-notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
