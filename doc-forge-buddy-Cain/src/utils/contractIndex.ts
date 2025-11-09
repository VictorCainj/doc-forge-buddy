/**
 * Sistema de indexação de contratos para busca rápida O(1)
 * Otimiza filtros por data e busca
 */

import { Contract } from '@/types/contract';

interface ContractIndex {
  byYear: Map<number, Contract[]>;
  byYearMonth: Map<string, Contract[]>;
  byId: Map<string, Contract>;
  all: Contract[];
  lastUpdated: number;
}

/**
 * Parsear data brasileira (DD/MM/YYYY) de forma otimizada
 */
export function parseBrazilianDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  if (dateStr.includes('/')) {
    const [dia, mes, ano] = dateStr.split('/');
    const parsedDate = new Date(
      parseInt(ano, 10),
      parseInt(mes, 10) - 1,
      parseInt(dia, 10)
    );

    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

/**
 * Criar índice de contratos
 */
export function createContractIndex(contracts: Contract[]): ContractIndex {
  const byYear = new Map<number, Contract[]>();
  const byYearMonth = new Map<string, Contract[]>();
  const byId = new Map<string, Contract>();

  contracts.forEach((contract) => {
    // Indexar por ID
    byId.set(contract.id, contract);

    // Indexar por data
    const dateStr = contract.form_data?.dataInicioRescisao;
    if (dateStr) {
      const date = parseBrazilianDate(dateStr);
      if (date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const yearMonthKey = `${year}-${month}`;

        // Indexar por ano
        if (!byYear.has(year)) {
          byYear.set(year, []);
        }
        byYear.get(year)!.push(contract);

        // Indexar por ano-mês
        if (!byYearMonth.has(yearMonthKey)) {
          byYearMonth.set(yearMonthKey, []);
        }
        byYearMonth.get(yearMonthKey)!.push(contract);
      }
    }
  });

  return {
    byYear,
    byYearMonth,
    byId,
    all: contracts,
    lastUpdated: Date.now(),
  };
}

/**
 * Filtrar contratos usando índice
 */
export function filterContractsByDate(
  index: ContractIndex,
  month?: number,
  year?: number
): Contract[] {
  if (!month && !year) {
    return index.all;
  }

  if (month && year) {
    const key = `${year}-${month}`;
    return index.byYearMonth.get(key) || [];
  }

  if (year) {
    return index.byYear.get(year) || [];
  }

  if (month) {
    const currentYear = new Date().getFullYear();
    const key = `${currentYear}-${month}`;
    return index.byYearMonth.get(key) || [];
  }

  return [];
}

/**
 * Obter contrato por ID usando índice
 */
export function getContractById(
  index: ContractIndex,
  id: string
): Contract | undefined {
  return index.byId.get(id);
}

