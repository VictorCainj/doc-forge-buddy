/**
 * Tipos para o Dashboard de Desocupação
 */

export interface EntregaChaves {
  entregue: boolean;
  dataEntrega?: string;
  diasPendentes?: number;
}

export interface ContratoDesocupacao {
  id: string;
  numeroContrato: string;
  enderecoImovel: string;
  nomeLocador?: string;
  nomeLocatario: string;
  motivoDesocupacao: string;
  dataInicioRescisao: string; // Alterado de dataComunicacao
  dataTerminoRescisao?: string;
  dataNotificacao: string;
  entregaChaves?: EntregaChaves;
}

export interface DashboardStats {
  totalDesocupacoes: number;
  motivoMaisComum: string;
  periodoAtual: string;
}

export interface MotivoStats {
  motivo: string;
  count: number;
  percentage: number;
}

export interface DashboardFilters {
  periodo: 'mes-atual' | 'periodo-personalizado' | 'mes-especifico';
  dataInicio?: string;
  dataFim?: string;
  ano?: number;
  mes?: number;
}

export interface DashboardData {
  contratos: ContratoDesocupacao[];
  stats: DashboardStats;
  motivosStats: MotivoStats[];
}
