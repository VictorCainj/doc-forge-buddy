import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata data no formato brasileiro completo
 * Exemplo: "07 de setembro de 2025"
 * @param date Data a ser formatada
 * @returns Data formatada em português ou "Data inválida" se inválida
 */
export const formatDateBrazilian = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      throw new Error('Data inválida');
    }

    return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    // console.warn('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

/**
 * Formata data no formato curto (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns Data formatada em formato curto
 */
export const formatDateShort = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      throw new Error('Data inválida');
    }

    return format(dateObj, 'dd/MM/yyyy');
  } catch {
    // console.warn('Erro ao formatar data curta:', error);
    return 'Data inválida';
  }
};

/**
 * Formata data e hora no formato brasileiro
 * @param date Data a ser formatada
 * @returns Data e hora formatadas
 */
export const formatDateTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      throw new Error('Data inválida');
    }

    return format(dateObj, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
      locale: ptBR,
    });
  } catch {
    // console.warn('Erro ao formatar data e hora:', error);
    return 'Data inválida';
  }
};

/**
 * Formata data atual no formato brasileiro completo
 * @returns Data atual formatada
 */
export const getCurrentDateBrazilian = (): string => {
  return formatDateBrazilian(new Date());
};

/**
 * Converte data do formato DD/MM/YYYY para formato brasileiro
 * @param dateString String de data no formato DD/MM/YYYY
 * @returns Data formatada em português
 */
export const convertDateToBrazilian = (dateString: string): string => {
  if (!dateString) return '';

  try {
    // Se já está no formato brasileiro, retorna como está
    if (dateString.includes('de')) {
      return dateString;
    }

    // Se está no formato DD/MM/YYYY
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return formatDateBrazilian(date);
    }

    // Se está no formato ISO ou outro formato
    const date = parseISO(dateString);
    return formatDateBrazilian(date);
  } catch {
    // console.warn('Erro ao converter data:', error);
    return 'Data inválida';
  }
};

/**
 * Valida se uma string é uma data válida
 * @param dateString String de data a ser validada
 * @returns true se válida, false caso contrário
 */
export const isValidDateString = (dateString: string): boolean => {
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch {
    return false;
  }
};
