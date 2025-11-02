// @ts-nocheck
import ExcelJS from 'exceljs';
import type { Workbook, Worksheet } from 'exceljs';
import { Contract } from '@/types/contract';
import { formatDateBrazilian, formatDateShort } from './dateFormatter';

/**
 * Cores da paleta profissional
 */
const colors = {
  primary: { argb: 'FF1E3A8A' }, // Azul escuro
  secondary: { argb: 'FF059669' }, // Verde escuro
  tertiary: { argb: 'FF6B21A8' }, // Roxo escuro
  highlight: { argb: 'FFEA580C' }, // Laranja escuro
  headerLight: { argb: 'FFF3F4F6' }, // Cinza claro
  zebraLight: { argb: 'FFF9FAFB' }, // Cinza muito claro
  statBg: { argb: 'FFFAFAFA' }, // Cinza muito claro
  summaryBg: { argb: 'FFDBEAFE' }, // Azul muito claro
  success: { argb: 'FF10B981' }, // Verde
  warning: { argb: 'FFF59E0B' }, // Amarelo
  danger: { argb: 'FFEF4444' }, // Vermelho
};

/**
 * Estilo para títulos das planilhas
 */
function createTitleStyle(color: { argb: string }) {
  return {
    font: {
      name: 'Calibri',
      size: 16,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: color,
    },
    alignment: { horizontal: 'center', vertical: 'middle' as const },
  };
}

/**
 * Estilo para cabeçalhos
 */
function createHeaderStyle(bgColor: { argb: string }) {
  return {
    font: { name: 'Calibri', size: 11, bold: true },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: bgColor,
    },
    alignment: { horizontal: 'center', vertical: 'middle' as const },
    border: {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    },
  };
}

/**
 * Estilo para dados normais
 */
function createDataStyle(isEven: boolean = false) {
  return {
    font: { name: 'Calibri', size: 10 },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: isEven ? colors.zebraLight : { argb: 'FFFFFFFF' },
    },
    border: {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    },
  };
}

/**
 * Estilo para seção de resumo
 */
function createSummaryStyle() {
  return {
    font: { name: 'Calibri', size: 10, bold: true },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: colors.summaryBg,
    },
    border: {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    },
  };
}

/**
 * Helper para formatar valor ou retornar padrão
 */
function formatValue(value: string | undefined | null, defaultValue: string = 'Não informado'): string {
  if (!value || value.trim() === '') return defaultValue;
  return value.trim();
}

/**
 * Helper para formatar booleano
 */
function formatBoolean(value: boolean | null | undefined): string {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  return 'Não informado';
}

/**
 * Helper para formatar data brasileira (DD/MM/YYYY)
 */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return 'Não informado';
  
  try {
    // Se já está no formato brasileiro DD/MM/YYYY
    if (dateStr.includes('/')) {
      return dateStr;
    }
    
    // Tentar parsear como ISO
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Retornar original se não conseguir parsear
    }
    
    return formatDateShort(date);
  } catch {
    return dateStr;
  }
}

/**
 * Interface para opções de exportação
 */
export interface ExportContractsOptions {
  selectedMonth?: string;
  selectedYear?: string;
  hasSearched?: boolean;
}

/**
 * Criar planilha de resumo/estatísticas
 */
function createSummarySheet(
  workbook: Workbook,
  contracts: Contract[],
  options: ExportContractsOptions
): Worksheet {
  const worksheet = workbook.addWorksheet('Resumo');

  let currentRow = 1;

  // Título principal
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'RESUMO E ESTATÍSTICAS';
  titleCell.style = createTitleStyle(colors.primary);
  worksheet.getRow(currentRow).height = 30;
  currentRow += 2;

  // Informações do período
  const periodoInfo: Array<{ label: string; value: string }> = [];
  
  if (options.selectedMonth && options.selectedYear) {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    periodoInfo.push({ label: 'Período', value: `${meses[parseInt(options.selectedMonth) - 1]} de ${options.selectedYear}` });
  } else if (options.selectedYear) {
    periodoInfo.push({ label: 'Ano', value: options.selectedYear });
  } else if (options.selectedMonth) {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    periodoInfo.push({ label: 'Mês', value: `${meses[parseInt(options.selectedMonth) - 1]} de ${new Date().getFullYear()}` });
  } else if (options.hasSearched) {
    periodoInfo.push({ label: 'Filtro', value: 'Busca personalizada' });
  } else {
    periodoInfo.push({ label: 'Período', value: 'Todos os contratos' });
  }

  periodoInfo.push({ label: 'Data de Exportação', value: formatDateBrazilian(new Date()) });
  periodoInfo.push({ label: 'Total de Contratos', value: contracts.length.toString() });

  // Estatísticas
  const vistoriasRealizadas = contracts.filter(c => (c as any).teve_vistoria === true).length;
  const revisitoriasRealizadas = contracts.filter(c => (c as any).teve_revistoria === true).length;
  const comFiadores = contracts.filter(c => {
    const formData = c.form_data || {};
    return formData.tipoGarantia === 'Fiador' || formData.temFiador === 'sim';
  }).length;
  const comMotivoDesocupacao = contracts.filter(c => {
    const formData = c.form_data || {};
    return formData.motivoDesocupacao && formData.motivoDesocupacao.trim() !== '';
  }).length;

  // Criar tabela de informações
  const summaryData = [
    ...periodoInfo,
    { label: 'Vistorias Realizadas', value: vistoriasRealizadas.toString() },
    { label: 'Revistorias Realizadas', value: revisitoriasRealizadas.toString() },
    { label: 'Contratos com Fiadores', value: comFiadores.toString() },
    { label: 'Contratos com Motivo Desocupação', value: comMotivoDesocupacao.toString() },
  ];

  // Cabeçalhos
  worksheet.getCell(`A${currentRow}`).value = 'Item';
  worksheet.getCell(`B${currentRow}`).value = 'Valor';
  worksheet.getRow(currentRow).getCell(1).style = createHeaderStyle(colors.headerLight);
  worksheet.getRow(currentRow).getCell(2).style = createHeaderStyle(colors.headerLight);
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // Dados
  summaryData.forEach((item) => {
    worksheet.getCell(`A${currentRow}`).value = item.label;
    worksheet.getCell(`B${currentRow}`).value = item.value;
    worksheet.getRow(currentRow).getCell(1).style = createDataStyle(false);
    worksheet.getRow(currentRow).getCell(2).style = createDataStyle(false);
    worksheet.getRow(currentRow).height = 20;
    currentRow++;
  });

  // Ajustar larguras
  worksheet.getColumn(1).width = 35;
  worksheet.getColumn(2).width = 30;

  return worksheet;
}

/**
 * Criar planilha principal de contratos com TODOS os campos
 */
function createContractsSheet(
  workbook: Workbook,
  contracts: Contract[],
  options: ExportContractsOptions
): Worksheet {
  const worksheet = workbook.addWorksheet('Contratos');

  // Criar seção de resumo
  let currentRow = createSummarySection(worksheet, contracts, options);

  // Definir cabeçalhos organizados por categoria
  const headers = [
    // IDENTIFICAÇÃO
    'ID Contrato',
    'Nº Contrato',
    'Título',
    
    // DATAS DO CONTRATO
    'Data Firmamento',
    'Data Início Rescisão',
    'Data Término Rescisão',
    'Data Comunicação',
    'Prazo (Dias)',
    
    // PROPRIETÁRIO/LOCADOR
    'Proprietário(s)',
    'Proprietário 1',
    'Proprietário 2',
    'Proprietário 3',
    'Proprietário 4',
    'Qualificação Completa Proprietário(s)',
    'Gênero Proprietário',
    'Celular Proprietário',
    'Email Proprietário',
    
    // LOCATÁRIO
    'Locatário(s)',
    'Locatário 1',
    'Locatário 2',
    'Locatário 3',
    'Locatário 4',
    'Qualificação Completa Locatário(s)',
    'Gênero Locatário',
    'Celular Locatário',
    'Email Locatário',
    
    // IMÓVEL
    'Endereço do Imóvel',
    'Quantidade de Chaves',
    'Tipo de Chaves',
    
    // GARANTIA E FIADORES
    'Tipo de Garantia',
    'Tem Fiador',
    'Fiador(es)',
    'Fiador 1',
    'Fiador 2',
    'Fiador 3',
    'Fiador 4',
    
    // PROCESSO DE RESCISÃO
    'Motivo Desocupação',
    'Observações',
    
    // VISTORIAS
    'Teve Vistoria',
    'Data Vistoria',
    'Teve Revistoria',
    'Data Revistoria',
    
    // METADADOS
    'Data Criação',
    'Última Atualização',
    'Tipo Documento',
  ];

  // Inserir cabeçalhos
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.style = createHeaderStyle(colors.headerLight);
  });
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // Congelar primeira linha de cabeçalho
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: currentRow - 1,
      activeCell: `A${currentRow}`,
      showGridLines: true,
    },
  ];

  // Inserir dados dos contratos
  contracts.forEach((contract, contractIndex) => {
    const formData = contract.form_data || {};
    const isEven = contractIndex % 2 === 0;

    const rowData = [
      // IDENTIFICAÇÃO
      contract.id || '',
      formatValue(formData.numeroContrato),
      contract.title || '',
      
      // DATAS DO CONTRATO
      formatDate(formData.dataFirmamentoContrato),
      formatDate(formData.dataInicioRescisao),
      formatDate(formData.dataTerminoRescisao),
      formatDate(formData.dataComunicacao),
      formatValue(formData.prazoDias),
      
      // PROPRIETÁRIO/LOCADOR
      formatValue(formData.nomeProprietario),
      formatValue(formData.primeiroLocador || formData.primeiroProprietario),
      formatValue(formData.segundoLocador || formData.segundoProprietario),
      formatValue(formData.terceiroLocador || formData.terceiroProprietario),
      formatValue(formData.quartoLocador || formData.quartoProprietario),
      formatValue(formData.qualificacaoCompletaLocadores),
      formatValue(formData.generoProprietario),
      formatValue(formData.celularProprietario),
      formatValue(formData.emailProprietario),
      
      // LOCATÁRIO
      formatValue(formData.nomeLocatario),
      formatValue(formData.primeiroLocatario),
      formatValue(formData.segundoLocatario),
      formatValue(formData.terceiroLocatario),
      formatValue(formData.quartoLocatario),
      formatValue(formData.qualificacaoCompletaLocatarios),
      formatValue(formData.generoLocatario),
      formatValue(formData.celularLocatario),
      formatValue(formData.emailLocatario),
      
      // IMÓVEL
      formatValue(formData.enderecoImovel),
      formatValue(formData.quantidadeChaves),
      formatValue(formData.tipoChaves),
      
      // GARANTIA E FIADORES
      formatValue(formData.tipoGarantia),
      formatBoolean(formData.temFiador === 'sim'),
      formatValue(formData.nomeFiador),
      formatValue(formData.primeiroFiador),
      formatValue(formData.segundoFiador),
      formatValue(formData.terceiroFiador),
      formatValue(formData.quartoFiador),
      
      // PROCESSO DE RESCISÃO
      formatValue(formData.motivoDesocupacao),
      formatValue(formData.observacao),
      
      // VISTORIAS
      formatBoolean((contract as any).teve_vistoria),
      formatDate((contract as any).data_vistoria),
      formatBoolean((contract as any).teve_revistoria),
      formatDate((contract as any).data_revistoria),
      
      // METADADOS
      formatDate(contract.created_at),
      formatDate(contract.updated_at),
      formatValue(contract.document_type),
    ];

    rowData.forEach((value, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = value;
      cell.style = createDataStyle(isEven);
      
      // Alinhamento específico para algumas colunas
      if (index === 0 || index === 1 || index === 7) { // ID, Nº Contrato, Prazo
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (index >= 3 && index <= 6) { // Datas
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (index >= 47 && index <= 50) { // Datas vistoria e metadados
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (index === 45 || index === 46) { // Booleanos vistoria
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { vertical: 'middle', wrapText: true };
      }
    });

    worksheet.getRow(currentRow).height = 20;
    currentRow++;
  });

  // Ajustar largura das colunas
  const columnWidths: Record<number, number> = {
    0: 36,  // ID Contrato
    1: 15,  // Nº Contrato
    2: 40,  // Título
    3: 18,  // Data Firmamento
    4: 20,  // Data Início Rescisão
    5: 20,  // Data Término Rescisão
    6: 18,  // Data Comunicação
    7: 12,  // Prazo
    8: 30,  // Proprietário(s)
    9: 25,  // Proprietário 1
    10: 25, // Proprietário 2
    11: 25, // Proprietário 3
    12: 25, // Proprietário 4
    13: 50, // Qualificação Proprietário
    14: 15, // Gênero Proprietário
    15: 18, // Celular Proprietário
    16: 25, // Email Proprietário
    17: 30, // Locatário(s)
    18: 25, // Locatário 1
    19: 25, // Locatário 2
    20: 25, // Locatário 3
    21: 25, // Locatário 4
    22: 50, // Qualificação Locatário
    23: 15, // Gênero Locatário
    24: 18, // Celular Locatário
    25: 25, // Email Locatário
    26: 40, // Endereço
    27: 18, // Quantidade Chaves
    28: 25, // Tipo Chaves
    29: 20, // Tipo Garantia
    30: 12, // Tem Fiador
    31: 30, // Fiador(es)
    32: 25, // Fiador 1
    33: 25, // Fiador 2
    34: 25, // Fiador 3
    35: 25, // Fiador 4
    36: 30, // Motivo Desocupação
    37: 40, // Observações
    38: 15, // Teve Vistoria
    39: 18, // Data Vistoria
    40: 18, // Teve Revistoria
    41: 18, // Data Revistoria
    42: 18, // Data Criação
    43: 18, // Última Atualização
    44: 20, // Tipo Documento
  };

  worksheet.columns.forEach((column, index) => {
    if (column) {
      column.width = columnWidths[index] || 15;
    }
  });

  // Adicionar filtros automáticos
  worksheet.autoFilter = {
    from: {
      row: currentRow - contracts.length - 1,
      column: 1,
    },
    to: {
      row: currentRow - 1,
      column: headers.length,
    },
  };

  return worksheet;
}

/**
 * Criar seção de resumo no topo da planilha
 */
function createSummarySection(
  worksheet: Worksheet,
  contracts: Contract[],
  options: ExportContractsOptions
): number {
  let currentRow = 1;

  // Título principal
  worksheet.mergeCells(`A${currentRow}:AQ${currentRow}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'EXPORTAÇÃO COMPLETA DE CONTRATOS';
  titleCell.style = createTitleStyle(colors.primary);
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // Informações do período
  const periodoInfo = [];
  if (options.selectedMonth && options.selectedYear) {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    periodoInfo.push(`Período: ${meses[parseInt(options.selectedMonth) - 1]} de ${options.selectedYear}`);
  } else if (options.selectedYear) {
    periodoInfo.push(`Ano: ${options.selectedYear}`);
  } else if (options.selectedMonth) {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    periodoInfo.push(`Mês: ${meses[parseInt(options.selectedMonth) - 1]} de ${new Date().getFullYear()}`);
  } else if (options.hasSearched) {
    periodoInfo.push('Filtro: Busca personalizada');
  } else {
    periodoInfo.push('Período: Todos os contratos');
  }

  periodoInfo.push(`Data de Exportação: ${formatDateBrazilian(new Date())}`);
  periodoInfo.push(`Total de Contratos: ${contracts.length}`);

  periodoInfo.forEach((info) => {
    worksheet.mergeCells(`A${currentRow}:AQ${currentRow}`);
    const infoCell = worksheet.getCell(`A${currentRow}`);
    infoCell.value = info;
    infoCell.style = createSummaryStyle();
    worksheet.getRow(currentRow).height = 20;
    currentRow++;
  });

  // Linha em branco
  currentRow++;

  return currentRow;
}

/**
 * Exporta contratos para arquivo Excel com formatação profissional e completa
 */
export async function exportContractsToExcel(
  contracts: Contract[],
  options: ExportContractsOptions = {}
): Promise<void> {
  // Validar se há contratos para exportar
  if (!contracts || contracts.length === 0) {
    throw new Error('Não há contratos para exportar');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Doc Forge Buddy';
  workbook.created = new Date();

  // Criar planilha de resumo primeiro
  createSummarySheet(workbook, contracts, options);

  // Criar planilha principal com todos os dados
  createContractsSheet(workbook, contracts, options);

  // Gerar nome do arquivo
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  
  let filename = 'contratos';
  if (options.selectedMonth && options.selectedYear) {
    const monthStr = options.selectedMonth.padStart(2, '0');
    filename = `contratos-${options.selectedYear}-${monthStr}`;
  } else if (options.selectedYear) {
    filename = `contratos-${options.selectedYear}`;
  } else if (options.hasSearched) {
    filename = `contratos-busca-${dateStr}`;
  } else {
    filename = `contratos-todos-${dateStr}`;
  }

  filename = `${filename}.xlsx`;

  // Criar buffer e fazer download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
