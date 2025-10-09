/**
 * Tipos de relatórios disponíveis no sistema
 */

export type ReportType =
  | 'users'
  | 'contracts'
  | 'prestadores'
  | 'system'
  | 'audit';

export type ReportFormat = 'pdf' | 'csv' | 'excel';

export type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface ReportConfig {
  type: ReportType;
  title: string;
  period: ReportPeriod;
  startDate?: Date;
  endDate?: Date;
  format: ReportFormat;
  filters?: Record<string, any>;
}

export interface ReportData {
  title: string;
  subtitle: string;
  generatedAt: Date;
  period: string;
  data: any;
  summary: Record<string, any>;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

// Relatório de Usuários
export interface UsersReportData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  usersByRole: Record<string, number>;
  newUsersPerDay: Record<string, number>;
  userActivity: Array<{
    user_id: string;
    email: string;
    full_name: string;
    last_login: string;
    action_count: number;
  }>;
}

// Relatório de Contratos
export interface ContractsReportData {
  totalContracts: number;
  contractsByMonth: Record<string, number>;
  contractsByType: Record<string, number>;
  averageDuration: number;
  topContractors: Array<{
    name: string;
    count: number;
  }>;
}

// Relatório de Prestadores
export interface PrestadoresReportData {
  totalPrestadores: number;
  activeP restadores: number;
  prestadoresBySpecialty: Record<string, number>;
  prestadoresPerMonth: Record<string, number>;
  topPrestadores: Array<{
    nome: string;
    especialidade: string;
    contracts_count: number;
  }>;
}

// Relatório de Sistema
export interface SystemReportData {
  uptime: string;
  totalStorage: string;
  usedStorage: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  performanceMetrics: {
    pageLoadTime: number;
    apiResponseTime: number;
    databaseQueryTime: number;
  };
}

// Relatório de Auditoria
export interface AuditReportData {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByEntity: Record<string, number>;
  topUsers: Array<{
    user_email: string;
    event_count: number;
  }>;
  criticalEvents: number;
  eventsByDay: Record<string, number>;
}


