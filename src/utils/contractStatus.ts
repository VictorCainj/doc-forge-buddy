/**
 * Utilitários para calcular status de contratos baseado em datas
 */

import { Contract } from '@/types/contract';

/**
 * Status possíveis de um contrato
 * Usa o tipo do arquivo de tipos principal
 */
export type ContractStatusType = 'ativo' | 'pendente' | 'expirado' | 'rescisao';

/**
 * Interface para informações de status
 */
export interface ContractStatusInfo {
  status: ContractStatusType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Converte string de data brasileira (DD/MM/YYYY) para Date
 */
export function parseBrazilianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    return new Date(year, month, day);
  } catch {
    return null;
  }
}

/**
 * Calcula o status de um contrato baseado em suas datas
 */
export function getContractStatus(contract: Contract): ContractStatusType {
  const formData = contract.form_data;
  
  // Se não tem data de início de rescisão, está pendente
  if (!formData.dataInicioRescisao) {
    return 'pendente';
  }
  
  const dataInicioRescisao = parseBrazilianDate(formData.dataInicioRescisao);
  const dataTerminoRescisao = parseBrazilianDate(formData.dataTerminoRescisao || '');
  
  if (!dataInicioRescisao) {
    return 'pendente';
  }
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Resetar horas para comparação
  
  // Se tem data de início de rescisão, está em processo de rescisão
  // Mas só se a data de término ainda não passou
  if (dataTerminoRescisao) {
    // Se a data de término já passou, está expirado
    if (dataTerminoRescisao < hoje) {
      return 'expirado';
    }
    // Se está entre início e término, está em rescisão
    return 'rescisao';
  }
  
  // Se tem início mas não tem término, está em rescisão
  return 'rescisao';
}

/**
 * Obtém informações completas de status (cores, labels, etc)
 */
export function getContractStatusInfo(contract: Contract): ContractStatusInfo {
  const status = getContractStatus(contract);
  
  const statusMap: Record<ContractStatusType, ContractStatusInfo> = {
    ativo: {
      status: 'ativo',
      label: 'Ativo',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    pendente: {
      status: 'pendente',
      label: 'Pendente',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    expirado: {
      status: 'expirado',
      label: 'Expirado',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    rescisao: {
      status: 'rescisao',
      label: 'Em Rescisão',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
  };
  
  return statusMap[status];
}

/**
 * Verifica se um contrato está próximo do vencimento (30 dias)
 */
export function isContractExpiringSoon(contract: Contract): boolean {
  const formData = contract.form_data;
  const dataTerminoRescisao = parseBrazilianDate(formData.dataTerminoRescisao || '');
  
  if (!dataTerminoRescisao) return false;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const diasAteVencimento = Math.ceil(
    (dataTerminoRescisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return diasAteVencimento >= 0 && diasAteVencimento <= 30;
}

