// Função para formatar data no formato brasileiro completo
export const formatDateBrazilian = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }

  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${day} de ${month} de ${year}`;
};

// Função para formatar data atual no formato brasileiro
export const getCurrentDateBrazilian = (): string => {
  return formatDateBrazilian(new Date());
};

// Função para converter data do formato DD/MM/YYYY para formato brasileiro
export const convertDateToBrazilian = (dateString: string): string => {
  if (!dateString) return '';
  
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
  const date = new Date(dateString);
  return formatDateBrazilian(date);
};
