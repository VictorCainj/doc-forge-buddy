/**
 * Repository específico para Notificações
 * Implementa operações especializadas para a entidade Notification
 */

import type { BaseEntity } from '@/types/shared/base';
import { BaseRepository } from './BaseRepository';

export type NotificationType = 
  | 'info'
  | 'success' 
  | 'warning'
  | 'error'
  | 'reminder'
  | 'system';

export type NotificationStatus = 
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'cancelled';

export interface Notification extends BaseEntity {
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  is_archived: boolean;
  scheduled_for?: string | null;
  sent_at?: string | null;
  read_at?: string | null;
  action_url?: string | null;
  action_text?: string | null;
  metadata?: Record<string, any> | null;
  expires_at?: string | null;
  retry_count: number;
  max_retries: number;
}

export interface CreateNotificationData {
  user_id?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_for?: string | null;
  action_url?: string | null;
  action_text?: string | null;
  metadata?: Record<string, any>;
  expires_at?: string | null;
  max_retries?: number;
}

export interface UpdateNotificationData extends Partial<CreateNotificationData> {
  status?: NotificationStatus;
  is_read?: boolean;
  is_archived?: boolean;
  sent_at?: string | null;
  read_at?: string | null;
  retry_count?: number;
  updated_at?: string;
}

export class NotificationRepository extends BaseRepository<Notification, string> {
  constructor(userId?: string | null) {
    super('notifications', 'Notification', userId);
  }

  /**
   * Busca notificações por usuário
   */
  async findByUser(userId: string): Promise<Notification[]> {
    return this.findMany({ user_id: userId } as any);
  }

  /**
   * Busca notificações por tipo
   */
  async findByType(type: NotificationType): Promise<Notification[]> {
    return this.findMany({ type } as any);
  }

  /**
   * Busca notificações por status
   */
  async findByStatus(status: NotificationStatus): Promise<Notification[]> {
    return this.findMany({ status } as any);
  }

  /**
   * Busca notificações pendentes
   */
  async findPending(): Promise<Notification[]> {
    return this.findByStatus('pending');
  }

  /**
   * Busca notificações enviadas
   */
  async findSent(): Promise<Notification[]> {
    return this.findByStatus('sent');
  }

  /**
   * Busca notificações entregues
   */
  async findDelivered(): Promise<Notification[]> {
    return this.findByStatus('delivered');
  }

  /**
   * Busca notificações lidas
   */
  async findRead(): Promise<Notification[]> {
    return this.findMany({ is_read: true } as any);
  }

  /**
   * Busca notificações não lidas
   */
  async findUnread(): Promise<Notification[]> {
    return this.findMany({ is_read: false } as any);
  }

  /**
   * Busca notificações arquivadas
   */
  async findArchived(): Promise<Notification[]> {
    return this.findMany({ is_archived: true } as any);
  }

  /**
   * Busca notificações ativas (não arquivadas)
   */
  async findActive(): Promise<Notification[]> {
    return this.findMany({ is_archived: false } as any);
  }

  /**
   * Busca notificações por prioridade
   */
  async findByPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<Notification[]> {
    return this.findMany({ priority } as any);
  }

  /**
   * Busca notificações agendadas
   */
  async findScheduled(): Promise<Notification[]> {
    return this.findWithConditions([
      {
        column: 'scheduled_for',
        operator: 'not_in',
        value: [null, '']
      }
    ]);
  }

  /**
   * Busca notificações que precisam ser enviadas
   */
  async findDueForSending(): Promise<Notification[]> {
    const now = new Date().toISOString();
    
    return this.findWithConditions([
      {
        column: 'status',
        operator: 'eq',
        value: 'pending'
      },
      {
        column: 'scheduled_for',
        operator: 'lte',
        value: now
      }
    ], { column: 'priority', ascending: false }); // Prioriza por prioridade
  }

  /**
   * Busca notificações expiradas
   */
  async findExpired(): Promise<Notification[]> {
    const now = new Date().toISOString();
    
    return this.findWithConditions([
      {
        column: 'expires_at',
        operator: 'lte',
        value: now
      }
    ]);
  }

  /**
   * Busca notificações com falha
   */
  async findFailed(): Promise<Notification[]> {
    return this.findByStatus('failed');
  }

  /**
   * Busca notificações que precisam de retry
   */
  async findNeedingRetry(): Promise<Notification[]> {
    const failedNotifications = await this.findFailed();
    
    return failedNotifications.filter(notification => 
      notification.retry_count < notification.max_retries
    );
  }

  /**
   * Cria notificação
   */
  async create(data: CreateNotificationData): Promise<Notification> {
    // Validações
    this.validateNotificationData(data);

    // Dados padrão
    const notificationData = {
      user_id: data.user_id || null,
      title: data.title,
      message: data.message,
      type: data.type,
      status: data.scheduled_for ? 'pending' : 'sent' as NotificationStatus,
      priority: data.priority || 'medium',
      is_read: false,
      is_archived: false,
      scheduled_for: data.scheduled_for || null,
      sent_at: data.scheduled_for ? null : new Date().toISOString(),
      action_url: data.action_url || null,
      action_text: data.action_text || null,
      metadata: data.metadata || null,
      expires_at: data.expires_at || null,
      retry_count: 0,
      max_retries: data.max_retries || 3
    };

    return super.create(notificationData as any);
  }

  /**
   * Atualiza notificação
   */
  async update(id: string, data: UpdateNotificationData): Promise<Notification> {
    // Validações
    if (data.title !== undefined) {
      this.validateTitle(data.title);
    }

    if (data.type !== undefined) {
      this.validateNotificationType(data.type);
    }

    if (data.status !== undefined) {
      this.validateNotificationStatus(data.status);
    }

    return super.update(id, data as any);
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, {
      is_read: true,
      read_at: new Date().toISOString(),
      status: 'delivered',
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Marca notificação como não lida
   */
  async markAsUnread(id: string): Promise<Notification> {
    return this.update(id, {
      is_read: false,
      read_at: null,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Arquiva notificação
   */
  async archive(id: string): Promise<Notification> {
    return this.update(id, {
      is_archived: true,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Desarquiva notificação
   */
  async unarchive(id: string): Promise<Notification> {
    return this.update(id, {
      is_archived: false,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Envia notificação
   */
  async send(id: string): Promise<Notification> {
    return this.update(id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Marca notificação como entregue
   */
  async markAsDelivered(id: string): Promise<Notification> {
    return this.update(id, {
      status: 'delivered',
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Marca notificação como com falha
   */
  async markAsFailed(id: string, error?: string): Promise<Notification> {
    const notification = await this.findById(id);
    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    return this.update(id, {
      status: 'failed',
      retry_count: notification.retry_count + 1,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Tenta reenviar notificação com falha
   */
  async retry(id: string): Promise<Notification> {
    const notification = await this.findById(id);
    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    if (notification.retry_count >= notification.max_retries) {
      throw new Error('Número máximo de tentativas excedido');
    }

    return this.update(id, {
      status: 'pending',
      retry_count: notification.retry_count + 1,
      sent_at: null,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Busca contagem de notificações não lidas por usuário
   */
  async getUnreadCount(userId: string): Promise<number> {
    const unreadNotifications = await this.findWithConditions([
      {
        column: 'user_id',
        operator: 'eq',
        value: userId
      },
      {
        column: 'is_read',
        operator: 'eq',
        value: false
      },
      {
        column: 'is_archived',
        operator: 'eq',
        value: false
      }
    ]);

    return unreadNotifications.length;
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async markAllAsRead(userId: string): Promise<number> {
    const unreadNotifications = await this.findWithConditions([
      {
        column: 'user_id',
        operator: 'eq',
        value: userId
      },
      {
        column: 'is_read',
        operator: 'eq',
        value: false
      }
    ]);

    let updated = 0;
    for (const notification of unreadNotifications) {
      try {
        await this.markAsRead(notification.id);
        updated++;
      } catch (error) {
        console.error(`Erro ao marcar notificação ${notification.id} como lida:`, error);
      }
    }

    return updated;
  }

  /**
   * Remove notificações expiradas
   */
  async removeExpired(): Promise<number> {
    const expiredNotifications = await this.findExpired();
    
    let deleted = 0;
    for (const notification of expiredNotifications) {
      try {
        await this.delete(notification.id);
        deleted++;
      } catch (error) {
        console.error(`Erro ao deletar notificação expirada ${notification.id}:`, error);
      }
    }

    return deleted;
  }

  /**
   * Limpa notificações antigas
   */
  async cleanupOldNotifications(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString();

    const oldNotifications = await this.findWithConditions([
      {
        column: 'created_at',
        operator: 'lte',
        value: cutoffString
      },
      {
        column: 'is_read',
        operator: 'eq',
        value: true
      }
    ]);

    let deleted = 0;
    for (const notification of oldNotifications) {
      try {
        await this.delete(notification.id);
        deleted++;
      } catch (error) {
        console.error(`Erro ao deletar notificação antiga ${notification.id}:`, error);
      }
    }

    return deleted;
  }

  /**
   * Obtém estatísticas das notificações
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    unread: number;
    sent: number;
    failed: number;
    scheduled: number;
  }> {
    const allNotifications = await this.findMany();
    
    const stats = {
      total: allNotifications.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      unread: 0,
      sent: 0,
      failed: 0,
      scheduled: 0
    };

    allNotifications.forEach(notification => {
      // Contagem por tipo
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

      // Contagem por status
      stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;

      // Contagem por prioridade
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;

      // Contadores específicos
      if (!notification.is_read) {
        stats.unread++;
      }

      if (notification.status === 'sent') {
        stats.sent++;
      }

      if (notification.status === 'failed') {
        stats.failed++;
      }

      if (notification.scheduled_for) {
        stats.scheduled++;
      }
    });

    return stats;
  }

  /**
   * Cria notificação de sistema
   */
  async createSystemNotification(
    title: string,
    message: string,
    type: NotificationType = 'info',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<Notification> {
    return this.create({
      user_id: null, // Notificação de sistema para todos
      title,
      message,
      type,
      priority,
      metadata: {
        is_system: true,
        system_created: new Date().toISOString()
      }
    });
  }

  /**
   * Valida dados da notificação
   */
  private validateNotificationData(data: CreateNotificationData): void {
    if (!data.title || data.title.trim() === '') {
      throw new Error('Título da notificação é obrigatório');
    }

    this.validateTitle(data.title);

    if (!data.message || data.message.trim() === '') {
      throw new Error('Mensagem da notificação é obrigatória');
    }

    this.validateNotificationType(data.type);
  }

  /**
   * Valida título
   */
  private validateTitle(title: string): void {
    if (title.length < 3) {
      throw new Error('Título deve ter pelo menos 3 caracteres');
    }

    if (title.length > 200) {
      throw new Error('Título deve ter no máximo 200 caracteres');
    }
  }

  /**
   * Valida tipo de notificação
   */
  private validateNotificationType(type: NotificationType): void {
    const validTypes: NotificationType[] = [
      'info', 'success', 'warning', 'error', 'reminder', 'system'
    ];

    if (!validTypes.includes(type)) {
      throw new Error(`Tipo de notificação inválido. Tipos válidos: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Valida status de notificação
   */
  private validateNotificationStatus(status: NotificationStatus): void {
    const validStatuses: NotificationStatus[] = [
      'pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Status de notificação inválido. Status válidos: ${validStatuses.join(', ')}`);
    }
  }
}