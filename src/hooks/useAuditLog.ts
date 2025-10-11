import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AuditLog,
  AuditLogFilters,
  AuditStats,
  CreateAuditLogPayload,
} from '@/types/audit';
import { toast } from 'sonner';

/**
 * Hook para registrar ações de auditoria manualmente
 */
export const useLogAuditEvent = () => {
  return useMutation({
    mutationFn: async (payload: CreateAuditLogPayload) => {
      // Obter informações do navegador
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => data.ip)
        .catch(() => null);

      const userAgent = navigator.userAgent;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc('log_audit_event', {
        p_user_id: user?.id || null,
        p_action: payload.action,
        p_entity_type: payload.entity_type,
        p_entity_id: payload.entity_id || null,
        p_old_data: payload.old_data || null,
        p_new_data: payload.new_data || null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_metadata: payload.metadata || {},
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Erro ao registrar log de auditoria:', error);
    },
  });
};

/**
 * Hook para buscar logs de auditoria com filtros
 */
export const useAuditLogs = (filters?: AuditLogFilters) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_logs', {
        p_user_id: filters?.user_id || null,
        p_action: filters?.action || null,
        p_entity_type: filters?.entity_type || null,
        p_start_date: filters?.start_date?.toISOString() || null,
        p_end_date: filters?.end_date?.toISOString() || null,
        p_limit: filters?.limit || 100,
        p_offset: filters?.offset || 0,
      });

      if (error) throw error;
      return data as AuditLog[];
    },
    staleTime: 30000, // 30 segundos
  });
};

/**
 * Hook para obter estatísticas de auditoria
 */
export const useAuditStats = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['audit-stats', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_stats', {
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      });

      if (error) throw error;
      return data[0] as AuditStats;
    },
    staleTime: 60000, // 1 minuto
  });
};

/**
 * Hook para exportar logs de auditoria
 */
export const useExportAuditLogs = () => {
  const logAudit = useLogAuditEvent();

  return useMutation({
    mutationFn: async (filters?: AuditLogFilters) => {
      // Buscar todos os logs sem limite
      const { data, error } = await supabase.rpc('get_audit_logs', {
        p_user_id: filters?.user_id || null,
        p_action: filters?.action || null,
        p_entity_type: filters?.entity_type || null,
        p_start_date: filters?.start_date?.toISOString() || null,
        p_end_date: filters?.end_date?.toISOString() || null,
        p_limit: 10000,
        p_offset: 0,
      });

      if (error) throw error;

      // Registrar exportação nos logs
      await logAudit.mutateAsync({
        action: 'EXPORT',
        entity_type: 'audit_logs',
        metadata: {
          filters,
          count: data?.length || 0,
        },
      });

      return data as AuditLog[];
    },
    onSuccess: (data) => {
      toast.success(`${data.length} registros exportados com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao exportar logs');
    },
  });
};

/**
 * Helper para converter logs em CSV
 */
export const convertLogsToCSV = (logs: AuditLog[]): string => {
  const headers = [
    'Data/Hora',
    'Usuário',
    'Email',
    'Ação',
    'Tipo de Entidade',
    'ID da Entidade',
    'IP',
  ];

  const rows = logs.map((log) => [
    new Date(log.created_at).toLocaleString('pt-BR'),
    log.user_name || '-',
    log.user_email || '-',
    log.action,
    log.entity_type,
    log.entity_id || '-',
    log.ip_address || '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Helper para baixar CSV
 */
export const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
