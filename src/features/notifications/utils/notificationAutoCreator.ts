/**
 * Utilitário para criar notificações automaticamente
 * Integração com hooks de contratos e vistorias
 */

import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '../services/notificationService';
import { QueryClient } from '@tanstack/react-query';

// QueryClient singleton para invalidar cache
let queryClientInstance: QueryClient | null = null;

export function setNotificationQueryClient(client: QueryClient) {
  queryClientInstance = client;
}

export class NotificationAutoCreator {
  /**
   * Criar notificação ao criar contrato
   */
  static async onContractCreated(contractId: string, contractNumber: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await NotificationService.createContractCreatedNotification(
        user.id,
        contractId,
        contractNumber
      );
    } catch (error) {
      console.error('Erro ao criar notificação de contrato criado:', error);
    }
  }

  /**
   * Criar notificação ao atualizar contrato
   */
  static async onContractUpdated(contractId: string, contractNumber: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn('Usuário não autenticado ao criar notificação de contrato atualizado');
        return;
      }

      console.log('Criando notificação de contrato atualizado:', { contractId, contractNumber, userId: user.id });

      const notification = await NotificationService.createContractUpdatedNotification(
        user.id,
        contractId,
        contractNumber
      );

      console.log('Notificação criada com sucesso:', notification.id);

      // Invalidar cache de notificações para atualizar a UI
      if (queryClientInstance) {
        queryClientInstance.invalidateQueries({ queryKey: ['notifications'] });
        queryClientInstance.invalidateQueries({ queryKey: ['notification-count'] });
      }
    } catch (error) {
      console.error('Erro ao criar notificação de contrato atualizado:', error);
      // Não lançar erro para não interromper o fluxo de atualização do contrato
    }
  }

  /**
   * Criar notificação ao agendar vistoria
   */
  static async onVistoriaScheduled(
    vistoriaId: string,
    contractId: string,
    contractNumber: string,
    vistoriaDate: string,
    vistoriaType: string
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await NotificationService.createVistoriaScheduledNotification(
        user.id,
        vistoriaId,
        contractId,
        contractNumber,
        vistoriaDate,
        vistoriaType
      );

      // Criar lembrete para 1 dia antes
      const reminderDate = new Date(vistoriaDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      
      if (reminderDate > new Date()) {
        await NotificationService.createVistoriaReminderNotification(
          user.id,
          vistoriaId,
          contractId,
          contractNumber,
          vistoriaDate,
          false
        );
      } else {
        const isToday = reminderDate.toDateString() === new Date().toDateString();
        await NotificationService.createVistoriaReminderNotification(
          user.id,
          vistoriaId,
          contractId,
          contractNumber,
          vistoriaDate,
          isToday
        );
      }
    } catch (error) {
      console.error('Erro ao criar notificação de vistoria agendada:', error);
    }
  }

  /**
   * Verificar e criar notificações para contratos próximos de expiração
   */
  static async checkExpiringContracts(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: contracts, error } = await supabase
        .from('saved_terms')
        .select('id, form_data, user_id')
        .eq('user_id', user.id)
        .not('form_data', 'is', null);

      if (error) throw error;
      if (!contracts) return;

      const today = new Date();

      for (const contract of contracts) {
        const formData = contract.form_data as any;
        const terminationDate = formData?.dataTerminoRescisao;

        if (!terminationDate) continue;

        const termDate = new Date(terminationDate);
        const daysRemaining = Math.ceil(
          (termDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining >= 1 && daysRemaining <= 30) {
          const contractNumber = formData?.numeroContrato || 'N/A';

          const { data: existingNotifications } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('metadata->>contract_id', contract.id)
            .in('type', ['contract_expiring', 'contract_expiring_7days', 'contract_expiring_1day'])
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!existingNotifications || existingNotifications.length === 0) {
            await NotificationService.createContractExpiringNotification(
              user.id,
              contract.id,
              contractNumber,
              daysRemaining,
              terminationDate
            );
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar contratos expirando:', error);
    }
  }
}
