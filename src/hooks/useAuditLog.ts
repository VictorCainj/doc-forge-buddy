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
 * Gerar hash único para logs (garantir imutabilidade)
 */
async function generateLogHash(data: Record<string, any>): Promise<string> {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  const dataBuffer = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Obter ID da sessão (ou criar um novo)
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('audit_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('audit_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Salvar log localmente como backup
 */
function saveAuditLogLocally(payload: any): void {
  try {
    const existingLogs = JSON.parse(
      localStorage.getItem('audit_logs_backup') || '[]'
    );
    existingLogs.push({
      ...payload,
      backup_timestamp: new Date().toISOString(),
    });

    // Manter apenas os últimos 100 logs
    const trimmedLogs = existingLogs.slice(-100);
    localStorage.setItem('audit_logs_backup', JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Erro ao salvar log de backup:', error);
  }
}

/**
 * Retenção configurável de logs (default: 1 ano)
 */
export const AUDIT_LOG_RETENTION_DAYS = 365;

/**
 * Eventos críticos que devem sempre ser logados
 */
export const CRITICAL_AUDIT_EVENTS = [
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'USER_DELETE',
  'ADMIN_ACCESS',
  'DATA_EXPORT',
  'SECURITY_VIOLATION',
];

/**
 * Hook para registrar ações de auditoria manualmente
 */
export const useLogAuditEvent = () => {
  return useMutation({
    mutationFn: async (payload: CreateAuditLogPayload) => {
      // Obter informações do navegador de forma mais robusta
      let ipAddress: string | null = null;
      try {
        // Tentar múltiplas APIs para obter IP
        const ipResponse = await Promise.race([
          fetch('https://api.ipify.org?format=json'),
          fetch('https://ipapi.co/json/'),
          fetch('https://api.myip.com'),
        ]);
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip || ipData.query || null;
      } catch {
        ipAddress = 'unknown';
      }

      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();

      // Gerar hash único para garantir imutabilidade
      const logHash = await generateLogHash({
        timestamp,
        action: payload.action,
        entityType: payload.entity_type,
        entityId: payload.entity_id,
        userAgent,
        ipAddress,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Criar payload com campos obrigatórios de segurança
      const securePayload = {
        p_user_id: user?.id || null,
        p_action: payload.action,
        p_entity_type: payload.entity_type,
        p_entity_id: payload.entity_id || null,
        p_old_data: payload.old_data || null,
        p_new_data: payload.new_data || null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_metadata: {
          ...payload.metadata,
          log_hash: logHash,
          timestamp,
          session_id: getSessionId(),
          window_size: `${window.innerWidth}x${window.innerHeight}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          referrer: document.referrer || null,
          url: window.location.href,
        },
      };

      const { data, error } = await supabase.rpc(
        'log_audit_event',
        securePayload
      );

      if (error) {
        // Em caso de erro, tentar salvar localmente como backup
        saveAuditLogLocally(securePayload);
        throw error;
      }
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
