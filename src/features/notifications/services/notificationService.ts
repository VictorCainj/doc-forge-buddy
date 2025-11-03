// @ts-nocheck
/**
 * Serviço para criação e gerenciamento de notificações
 */

import { supabase } from '@/integrations/supabase/client';
import {
  CreateNotificationPayload,
  Notification,
  NotificationType,
  NotificationPriority,
} from '../types/notification';

export class NotificationService {
  /**
   * Criar uma nova notificação
   */
  static async createNotification(
    payload: CreateNotificationPayload
  ): Promise<Notification> {
    console.log('NotificationService.createNotification chamado com:', payload);
    
    // Tentar usar a função RPC primeiro
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: payload.user_id,
        p_type: payload.type,
        p_title: payload.title,
        p_message: payload.message,
        p_metadata: payload.metadata || {},
        p_priority: payload.priority || 'normal',
        p_expires_at: payload.expires_at || null,
      });

      if (error) {
        console.error('Erro ao chamar RPC create_notification:', error);
        // Se RPC falhar, tentar inserção direta
        throw error;
      }

      console.log('RPC create_notification retornou ID:', data);

      // Buscar a notificação criada
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar notificação criada:', fetchError);
        throw fetchError;
      }

      console.log('Notificação criada com sucesso:', notification);
      return notification as Notification;
    } catch (rpcError) {
      // Fallback: inserção direta se RPC falhar
      console.warn('RPC falhou, tentando inserção direta:', rpcError);
      
      const { data: notification, error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.user_id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          metadata: payload.metadata || {},
          priority: payload.priority || 'normal',
          expires_at: payload.expires_at || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar notificação (inserção direta):', insertError);
        throw insertError;
      }

      console.log('Notificação criada via inserção direta:', notification);
      return notification as Notification;
    }
  }

  /**
   * Criar notificação para contrato próximo de expiração
   */
  static async createContractExpiringNotification(
    userId: string,
    contractId: string,
    contractNumber: string,
    daysRemaining: number,
    expirationDate: string
  ): Promise<Notification> {
    const title =
      daysRemaining <= 1
        ? `Contrato ${contractNumber} expira hoje!`
        : daysRemaining <= 7
          ? `Contrato ${contractNumber} expira em ${daysRemaining} dias`
          : `Contrato ${contractNumber} próximo de expiração`;

    const message =
      daysRemaining <= 1
        ? `O contrato ${contractNumber} expira hoje (${expirationDate}). Ação necessária.`
        : daysRemaining <= 7
          ? `O contrato ${contractNumber} expira em ${daysRemaining} dias (${expirationDate}).`
          : `O contrato ${contractNumber} expira em ${daysRemaining} dias (${expirationDate}).`;

    const type: NotificationType =
      daysRemaining <= 1
        ? 'contract_expiring_1day'
        : daysRemaining <= 7
          ? 'contract_expiring_7days'
          : 'contract_expiring';

    const priority: NotificationPriority =
      daysRemaining <= 1 ? 'urgent' : daysRemaining <= 7 ? 'high' : 'normal';

    return this.createNotification({
      user_id: userId,
      type,
      title,
      message,
      metadata: {
        contract_id: contractId,
        days_remaining: daysRemaining,
        date: expirationDate,
      },
      priority,
      expires_at: expirationDate,
    });
  }

  /**
   * Criar notificação para vistoria agendada
   */
  static async createVistoriaScheduledNotification(
    userId: string,
    vistoriaId: string,
    contractId: string,
    contractNumber: string,
    vistoriaDate: string,
    vistoriaType: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'vistoria_scheduled',
      title: `Vistoria ${vistoriaType} agendada`,
      message: `Uma vistoria ${vistoriaType} foi agendada para o contrato ${contractNumber} no dia ${vistoriaDate}.`,
      metadata: {
        vistoria_id: vistoriaId,
        contract_id: contractId,
        date: vistoriaDate,
      },
      priority: 'normal',
      expires_at: vistoriaDate,
    });
  }

  /**
   * Criar notificação de lembrete de vistoria
   */
  static async createVistoriaReminderNotification(
    userId: string,
    vistoriaId: string,
    contractId: string,
    contractNumber: string,
    vistoriaDate: string,
    isToday: boolean = false
  ): Promise<Notification> {
    const type: NotificationType = isToday
      ? 'vistoria_today'
      : 'vistoria_reminder';

    return this.createNotification({
      user_id: userId,
      type,
      title: isToday
        ? `Vistoria hoje: ${contractNumber}`
        : `Lembrete: Vistoria amanhã - ${contractNumber}`,
      message: isToday
        ? `A vistoria do contrato ${contractNumber} está agendada para hoje (${vistoriaDate}).`
        : `A vistoria do contrato ${contractNumber} está agendada para amanhã (${vistoriaDate}).`,
      metadata: {
        vistoria_id: vistoriaId,
        contract_id: contractId,
        date: vistoriaDate,
      },
      priority: isToday ? 'urgent' : 'high',
      expires_at: vistoriaDate,
    });
  }

  /**
   * Criar notificação de histórico de contrato
   */
  static async createContractHistoryNotification(
    userId: string,
    contractId: string,
    contractNumber: string,
    changeCount: number,
    lastChangeDate: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'contract_history',
      title: `Atualizações no contrato ${contractNumber}`,
      message: `O contrato ${contractNumber} teve ${changeCount} atualização(ões) recente(s). Última atualização: ${lastChangeDate}.`,
      metadata: {
        contract_id: contractId,
        date: lastChangeDate,
      },
      priority: 'low',
    });
  }

  /**
   * Criar notificação de contrato criado
   */
  static async createContractCreatedNotification(
    userId: string,
    contractId: string,
    contractNumber: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'contract_created',
      title: `Novo contrato criado: ${contractNumber}`,
      message: `O contrato ${contractNumber} foi criado com sucesso.`,
      metadata: {
        contract_id: contractId,
      },
      priority: 'normal',
    });
  }

  /**
   * Criar notificação de contrato atualizado
   */
  static async createContractUpdatedNotification(
    userId: string,
    contractId: string,
    contractNumber: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'contract_updated',
      title: `Contrato atualizado: ${contractNumber}`,
      message: `O contrato ${contractNumber} foi atualizado.`,
      metadata: {
        contract_id: contractId,
      },
      priority: 'normal',
    });
  }

  /**
   * Criar notificação de documento gerado
   */
  static async createDocumentGeneratedNotification(
    userId: string,
    contractId: string,
    documentId: string,
    documentType: string,
    contractNumber: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'document_generated',
      title: `Documento gerado: ${documentType}`,
      message: `O documento "${documentType}" foi gerado para o contrato ${contractNumber}.`,
      metadata: {
        contract_id: contractId,
        document_id: documentId,
      },
      priority: 'normal',
    });
  }

  /**
   * Criar notificação de entrega de chaves pendente
   */
  static async createEntregaChavesPendingNotification(
    userId: string,
    contractId: string,
    contractNumber: string,
    daysPending: number
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'entrega_chaves_pending',
      title: `Entrega de chaves pendente: ${contractNumber}`,
      message: `A entrega de chaves do contrato ${contractNumber} está pendente há ${daysPending} dia(s).`,
      metadata: {
        contract_id: contractId,
        days_remaining: daysPending,
      },
      priority: daysPending > 7 ? 'high' : 'normal',
    });
  }

  /**
   * Criar notificação de contas pendentes
   */
  static async createContractBillsPendingNotification(
    userId: string,
    contractId: string,
    contractNumber: string,
    billsCount: number
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'contract_bills_pending',
      title: `Contas pendentes: ${contractNumber}`,
      message: `O contrato ${contractNumber} possui ${billsCount} conta(s) pendente(s).`,
      metadata: {
        contract_id: contractId,
      },
      priority: billsCount > 3 ? 'high' : 'normal',
    });
  }

  /**
   * Criar notificação de vistoria concluída
   */
  static async createVistoriaCompletedNotification(
    userId: string,
    vistoriaId: string,
    contractId: string,
    contractNumber: string,
    vistoriaType: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'vistoria_completed',
      title: `Vistoria ${vistoriaType} concluída: ${contractNumber}`,
      message: `A vistoria ${vistoriaType} do contrato ${contractNumber} foi concluída.`,
      metadata: {
        vistoria_id: vistoriaId,
        contract_id: contractId,
      },
      priority: 'normal',
    });
  }
}

