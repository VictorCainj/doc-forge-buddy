/**
 * Componente de dropdown com lista de notificações
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell } from '@/utils/iconMapper';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications({
    limit: 10,
    unread_only: false,
  });
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount =
    notifications?.filter((n) => !n.read).length || 0;

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notificacoes');
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5 text-neutral-700" />
          {hasUnread && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-error-500 text-white border-2 border-white"
              variant="error"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
        forceMount
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900">
            Notificações
          </h3>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs"
              disabled={markAllAsRead.isPending}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-600">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onMarkAsRead={() => {
                    // Atualizar contador localmente
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                onClick={handleViewAll}
                className="w-full justify-center text-sm"
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
