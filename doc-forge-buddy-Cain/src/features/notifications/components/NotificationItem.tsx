/**
 * Componente para exibir um item individual de notificação
 */

import React from 'react';
import { Notification, NotificationType } from '../types/notification';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Circle,
  Clock,
  FileText,
  AlertCircle,
  Calendar,
  Bell,
} from '@/utils/iconMapper';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { useMarkAsRead, useDeleteNotification } from '../hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: () => void;
  compact?: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'contract_expiring':
    case 'contract_expiring_7days':
    case 'contract_expiring_1day':
      return AlertCircle;
    case 'vistoria_scheduled':
    case 'vistoria_reminder':
    case 'vistoria_today':
    case 'vistoria_completed':
      return Calendar;
    case 'contract_history':
    case 'contract_created':
    case 'contract_updated':
      return FileText;
    case 'document_generated':
      return FileText;
    case 'entrega_chaves_pending':
    case 'contract_bills_pending':
      return Bell;
    default:
      return Bell;
  }
};

const getNotificationColor = (priority: string, read: boolean) => {
  if (read) return 'text-neutral-500';
  
  switch (priority) {
    case 'urgent':
      return 'text-error-600';
    case 'high':
      return 'text-warning-600';
    case 'normal':
      return 'text-neutral-700';
    case 'low':
      return 'text-neutral-600';
    default:
      return 'text-neutral-700';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  compact = false,
}) => {
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const Icon = getNotificationIcon(notification.type);
  const isRead = notification.read;
  const colorClass = getNotificationColor(notification.priority, isRead);

  const handleMarkAsRead = async () => {
    if (!isRead) {
      await markAsRead.mutateAsync(notification.id);
      onMarkAsRead?.();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDateBrazilian(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        !isRead && 'bg-neutral-50 border-l-2 border-l-primary-500',
        isRead && 'bg-white',
        compact && 'p-2'
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5', colorClass)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                'text-sm font-medium mb-1',
                !isRead ? 'text-neutral-900' : 'text-neutral-600'
              )}
            >
              {notification.title}
            </h4>
            <p
              className={cn(
                'text-xs mb-2 line-clamp-2',
                !isRead ? 'text-neutral-700' : 'text-neutral-500'
              )}
            >
              {notification.message}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500">
                {formatDate(notification.created_at)}
              </span>
              {notification.priority !== 'normal' && (
                <Badge
                  variant={
                    notification.priority === 'urgent'
                      ? 'error'
                      : notification.priority === 'high'
                        ? 'warning'
                        : 'secondary'
                  }
                  size="sm"
                >
                  {notification.priority === 'urgent'
                    ? 'Urgente'
                    : notification.priority === 'high'
                      ? 'Alta'
                      : 'Baixa'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-7 w-7 p-0"
                title="Marcar como lida"
              >
                <Circle className="h-4 w-4 text-neutral-400" />
              </Button>
            )}
            {isRead && (
              <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
