// @ts-nocheck
/**
 * Hook para buscar e gerenciar notificações
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Notification, NotificationFilters } from '../types/notification';

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_user_id: user.id,
        p_limit: filters?.limit || 20,
        p_offset: filters?.offset || 0,
        p_unread_only: filters?.unread_only || false,
      });

      if (error) throw error;

      // Filtrar por tipo se especificado
      let notifications = (data as Notification[]) || [];

      if (filters?.type) {
        notifications = notifications.filter((n) => n.type === filters.type);
      }

      if (filters?.priority) {
        notifications = notifications.filter(
          (n) => n.priority === filters.priority
        );
      }

      return notifications;
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch a cada minuto
  });
}

export function useNotificationCount() {
  return useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { total: 0, unread: 0 };

      const { data, error } = await supabase.rpc(
        'count_unread_notifications',
        {
          p_user_id: user.id,
        }
      );

      if (error) throw error;

      // Buscar total também
      const { count: totalCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .or(
          'expires_at.is.null,expires_at.gt.' +
            new Date().toISOString()
        );

      return {
        total: totalCount || 0,
        unread: data || 0,
      };
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch a cada minuto
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
}
