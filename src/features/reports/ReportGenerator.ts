import { supabase } from '@/integrations/supabase/client';
import {
  ReportConfig,
  ReportData,
  UsersReportData,
  ContractsReportData,
  PrestadoresReportData,
  AuditReportData,
} from './ReportTypes';
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Classe principal para geração de relatórios
 */
export class ReportGenerator {
  /**
   * Obter período de datas baseado na configuração
   */
  private static getPeriodDates(config: ReportConfig): {
    start: Date;
    end: Date;
  } {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (config.period) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'week':
        start = startOfDay(subDays(now, 7));
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'quarter':
        start = startOfDay(subDays(now, 90));
        break;
      case 'year':
        start = startOfDay(subDays(now, 365));
        break;
      case 'custom':
        start = config.startDate || startOfDay(subDays(now, 30));
        end = config.endDate || endOfDay(now);
        break;
      default:
        start = startOfDay(subDays(now, 30));
    }

    return { start, end };
  }

  /**
   * Formatar período para exibição
   */
  private static formatPeriod(start: Date, end: Date): string {
    return `${format(start, 'dd/MM/yyyy', { locale: ptBR })} a ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`;
  }

  /**
   * Gerar relatório de usuários
   */
  static async generateUsersReport(config: ReportConfig): Promise<ReportData> {
    const { start, end } = this.getPeriodDates(config);

    // Buscar dados de usuários
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const { data: allProfiles } = await supabase.from('profiles').select('*');

    const { data: auditLogs } = await supabase.rpc('get_audit_logs', {
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString(),
      p_limit: 10000,
      p_offset: 0,
    });

    // Processar dados
    const totalUsers = allProfiles?.length || 0;
    const activeUsers = allProfiles?.filter((p) => p.is_active).length || 0;
    const adminUsers =
      allProfiles?.filter((p) => p.role === 'admin').length || 0;

    const usersByRole: Record<string, number> = {
      admin: adminUsers,
      user: totalUsers - adminUsers,
    };

    // Usuários por dia
    const newUsersPerDay: Record<string, number> = {};
    profiles?.forEach((profile) => {
      const day = format(new Date(profile.created_at), 'dd/MM', {
        locale: ptBR,
      });
      newUsersPerDay[day] = (newUsersPerDay[day] || 0) + 1;
    });

    // Atividade de usuários (top 10)
    const userActivity = auditLogs
      ? Object.values(
          auditLogs.reduce((acc: any, log: any) => {
            if (log.user_id) {
              if (!acc[log.user_id]) {
                acc[log.user_id] = {
                  user_id: log.user_id,
                  email: log.user_email,
                  full_name: log.user_name,
                  action_count: 0,
                  last_login: log.created_at,
                };
              }
              acc[log.user_id].action_count += 1;
            }
            return acc;
          }, {})
        )
          .sort((a: any, b: any) => b.action_count - a.action_count)
          .slice(0, 10)
      : [];

    const reportData: UsersReportData = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      usersByRole,
      newUsersPerDay,
      userActivity,
    };

    return {
      title: 'Relatório de Usuários',
      subtitle: 'Análise completa de usuários do sistema',
      generatedAt: new Date(),
      period: this.formatPeriod(start, end),
      data: reportData,
      summary: {
        'Total de Usuários': totalUsers,
        'Usuários Ativos': activeUsers,
        Administradores: adminUsers,
        'Novos Usuários': profiles?.length || 0,
      },
      charts: [
        {
          type: 'doughnut',
          title: 'Usuários por Cargo',
          labels: ['Administradores', 'Usuários'],
          datasets: [
            {
              label: 'Quantidade',
              data: [adminUsers, totalUsers - adminUsers],
              backgroundColor: ['#3b82f6', '#10b981'],
            },
          ],
        },
        {
          type: 'line',
          title: 'Novos Usuários por Dia',
          labels: Object.keys(newUsersPerDay),
          datasets: [
            {
              label: 'Novos Usuários',
              data: Object.values(newUsersPerDay),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            },
          ],
        },
      ],
    };
  }

  /**
   * Gerar relatório de contratos
   */
  static async generateContractsReport(
    config: ReportConfig
  ): Promise<ReportData> {
    const { start, end } = this.getPeriodDates(config);

    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const totalContracts = contracts?.length || 0;

    // Contratos por mês
    const contractsByMonth: Record<string, number> = {};
    contracts?.forEach((contract) => {
      const month = format(new Date(contract.created_at), 'MM/yyyy', {
        locale: ptBR,
      });
      contractsByMonth[month] = (contractsByMonth[month] || 0) + 1;
    });

    const reportData: ContractsReportData = {
      totalContracts,
      contractsByMonth,
      contractsByType: {},
      averageDuration: 0,
      topContractors: [],
    };

    return {
      title: 'Relatório de Contratos',
      subtitle: 'Análise de contratos do sistema',
      generatedAt: new Date(),
      period: this.formatPeriod(start, end),
      data: reportData,
      summary: {
        'Total de Contratos': totalContracts,
        'Contratos no Período': totalContracts,
      },
      charts: [
        {
          type: 'bar',
          title: 'Contratos por Mês',
          labels: Object.keys(contractsByMonth),
          datasets: [
            {
              label: 'Contratos',
              data: Object.values(contractsByMonth),
              backgroundColor: '#10b981',
            },
          ],
        },
      ],
    };
  }

  /**
   * Gerar relatório de prestadores
   */
  static async generatePrestadoresReport(
    config: ReportConfig
  ): Promise<ReportData> {
    const { start, end } = this.getPeriodDates(config);

    const { data: prestadores } = await supabase
      .from('prestadores')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const totalPrestadores = prestadores?.length || 0;

    // Prestadores por especialidade
    const prestadoresBySpecialty: Record<string, number> = {};
    prestadores?.forEach((prestador) => {
      const specialty = prestador.especialidade || 'Não informado';
      prestadoresBySpecialty[specialty] =
        (prestadoresBySpecialty[specialty] || 0) + 1;
    });

    const reportData: PrestadoresReportData = {
      totalPrestadores,
      activePrestadores: totalPrestadores,
      prestadoresBySpecialty,
      prestadoresPerMonth: {},
      topPrestadores: [],
    };

    return {
      title: 'Relatório de Prestadores',
      subtitle: 'Análise de prestadores cadastrados',
      generatedAt: new Date(),
      period: this.formatPeriod(start, end),
      data: reportData,
      summary: {
        'Total de Prestadores': totalPrestadores,
        Especialidades: Object.keys(prestadoresBySpecialty).length,
      },
      charts: [
        {
          type: 'pie',
          title: 'Prestadores por Especialidade',
          labels: Object.keys(prestadoresBySpecialty),
          datasets: [
            {
              label: 'Prestadores',
              data: Object.values(prestadoresBySpecialty),
              backgroundColor: [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#8b5cf6',
              ],
            },
          ],
        },
      ],
    };
  }

  /**
   * Gerar relatório de auditoria
   */
  static async generateAuditReport(config: ReportConfig): Promise<ReportData> {
    const { start, end } = this.getPeriodDates(config);

    const { data: stats } = await supabase.rpc('get_audit_stats', {
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString(),
    });

    const auditData = stats?.[0] || {};

    const reportData: AuditReportData = {
      totalEvents: auditData.total_events || 0,
      eventsByAction: auditData.events_by_action || {},
      eventsByEntity: auditData.events_by_entity || {},
      topUsers: auditData.top_users || [],
      criticalEvents: 0,
      eventsByDay: auditData.events_by_day || {},
    };

    return {
      title: 'Relatório de Auditoria',
      subtitle: 'Análise de ações e alterações no sistema',
      generatedAt: new Date(),
      period: this.formatPeriod(start, end),
      data: reportData,
      summary: {
        'Total de Eventos': reportData.totalEvents,
        'Tipos de Ação': Object.keys(reportData.eventsByAction).length,
        'Usuários Ativos': reportData.topUsers.length,
      },
      charts: [
        {
          type: 'bar',
          title: 'Eventos por Ação',
          labels: Object.keys(reportData.eventsByAction),
          datasets: [
            {
              label: 'Quantidade',
              data: Object.values(reportData.eventsByAction),
              backgroundColor: '#3b82f6',
            },
          ],
        },
      ],
    };
  }

  /**
   * Gerar relatório baseado na configuração
   */
  static async generate(config: ReportConfig): Promise<ReportData> {
    switch (config.type) {
      case 'users':
        return this.generateUsersReport(config);
      case 'contracts':
        return this.generateContractsReport(config);
      case 'prestadores':
        return this.generatePrestadoresReport(config);
      case 'audit':
        return this.generateAuditReport(config);
      default:
        throw new Error(`Tipo de relatório não suportado: ${config.type}`);
    }
  }
}
