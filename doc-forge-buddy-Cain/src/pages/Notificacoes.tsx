/**
 * Página completa de notificações
 */

import React, { useState } from 'react';
import { useNotifications, useMarkAllAsRead } from '@/features/notifications/hooks/useNotifications';
import { NotificationItem } from '@/features/notifications/components/NotificationItem';
import { NotificationType, NotificationPriority } from '@/features/notifications/types/notification';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, CheckCircle, Filter } from '@/utils/iconMapper';
import { Card } from '@/components/ui/card';

export default function Notificacoes() {
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: notifications = [], isLoading } = useNotifications({
    limit: 50,
    unread_only: unreadOnly,
  });
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
    return true;
  });

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Notificações
          </h1>
          <p className="text-sm text-neutral-600">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filtros:</span>
          </div>

          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as NotificationType | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="contract_expiring">Contrato expirando</SelectItem>
              <SelectItem value="vistoria_scheduled">Vistoria agendada</SelectItem>
              <SelectItem value="vistoria_reminder">Lembrete de vistoria</SelectItem>
              <SelectItem value="contract_history">Histórico de contrato</SelectItem>
              <SelectItem value="contract_created">Contrato criado</SelectItem>
              <SelectItem value="contract_updated">Contrato atualizado</SelectItem>
              <SelectItem value="document_generated">Documento gerado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterPriority}
            onValueChange={(value) => setFilterPriority(value as NotificationPriority | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            onClick={() => setUnreadOnly(!unreadOnly)}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            {unreadOnly ? 'Mostrar todas' : 'Apenas não lidas'}
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">Carregando notificações...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Nenhuma notificação
          </h3>
          <p className="text-sm text-neutral-600">
            {notifications.length === 0
              ? 'Você não possui notificações ainda.'
              : 'Nenhuma notificação corresponde aos filtros selecionados.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
