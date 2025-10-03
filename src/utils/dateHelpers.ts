/**
 * Utilitários para manipulação e formatação de datas
 * Centraliza toda a lógica de datas para evitar duplicação
 */

export class DateHelpers {
  /**
   * Converte string de data brasileira (DD/MM/AAAA) para objeto Date
   */
  static parseBrazilianDate(dateStr: string): Date | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
    const year = parseInt(parts[2], 10);
    
    // Validar se os valores são válidos
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900) return null;
    
    const date = new Date(year, month, day);
    
    // Verificar se a data é válida (ex: 31/02 seria inválida)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  }

  /**
   * Formata Date para string brasileira (DD/MM/AAAA)
   */
  static formatToBrazilian(date: Date): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Converte qualquer formato de data para brasileiro
   */
  static convertDateToBrazilian(dateStr: string): string {
    if (!dateStr) return '';
    
    // Se já está no formato brasileiro, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const parsed = this.parseBrazilianDate(dateStr);
      return parsed ? this.formatToBrazilian(parsed) : dateStr;
    }
    
    // Tentar converter de outros formatos
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : this.formatToBrazilian(date);
  }

  /**
   * Verifica se uma data está expirada (passada)
   */
  static isDateExpired(dateStr: string): boolean {
    const date = this.parseBrazilianDate(dateStr);
    if (!date) return false;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Comparar apenas a data, não o horário
    date.setHours(0, 0, 0, 0);
    
    return date < now;
  }

  /**
   * Calcula quantos dias faltam até uma data
   */
  static getDaysUntilDate(dateStr: string): number {
    const date = this.parseBrazilianDate(dateStr);
    if (!date) return 0;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se uma data está próxima (dentro de X dias)
   */
  static isDateNear(dateStr: string, days: number = 7): boolean {
    const daysUntil = this.getDaysUntilDate(dateStr);
    return daysUntil >= 0 && daysUntil <= days;
  }

  /**
   * Formata data para exibição com texto amigável
   */
  static formatDateWithText(dateStr: string): string {
    const date = this.parseBrazilianDate(dateStr);
    if (!date) return dateStr;
    
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Gera data atual no formato brasileiro
   */
  static getCurrentDateBrazilian(): string {
    return this.formatToBrazilian(new Date());
  }

  /**
   * Adiciona dias a uma data brasileira
   */
  static addDays(dateStr: string, days: number): string {
    const date = this.parseBrazilianDate(dateStr);
    if (!date) return dateStr;
    
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    
    return this.formatToBrazilian(newDate);
  }

  /**
   * Calcula a diferença em dias entre duas datas
   */
  static getDaysDifference(startDateStr: string, endDateStr: string): number {
    const startDate = this.parseBrazilianDate(startDateStr);
    const endDate = this.parseBrazilianDate(endDateStr);
    
    if (!startDate || !endDate) return 0;
    
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se uma data está em um determinado mês/ano
   */
  static isDateInMonth(dateStr: string, month: number, year: number): boolean {
    const date = this.parseBrazilianDate(dateStr);
    if (!date) return false;
    
    return date.getMonth() === month && date.getFullYear() === year;
  }
}
