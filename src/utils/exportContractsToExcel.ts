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
 * Criar seção de resumo no topo da planilha
 */
function createSummarySection(
  worksheet: Worksheet,
  contracts: Contract[],
  options: ExportContractsOptions
): number {
  let currentRow = 1;

  // Título principal
  worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'EXPORTAÇÃO DE CONTRATOS';
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

  periodoInfo.forEach((info, index) => {
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
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
 * Criar planilha principal de contratos
 */
function createContractsSheet(
  workbook: Workbook,
  contracts: Contract[],
  options: ExportContractsOptions
): Worksheet {
  const worksheet = workbook.addWorksheet('Contratos');

  // Criar seção de resumo
  let currentRow = createSummarySection(worksheet, contracts, options);

  // Definir cabeçalhos
  const headers = [
    'Nº Contrato',
    'Data Firmamento',
    'Data Início Rescisão',
    'Data Término Rescisão',
    'Data Comunicação',
    'Proprietário(s)',
    'Qualificação Proprietário(s)',
    'Celular Proprietário',
    'Email Proprietário',
    'Locatário(s)',
    'Qualificação Locatário(s)',
    'Celular Locatário',
    'Email Locatário',
    'Endereço do Imóvel',
    'Tipo de Garantia',
    'Fiador(es)',
    'Motivo Desocupação',
    'Prazo (Dias)',
    'Data Criação',
    'Última Atualização',
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
      formatValue(formData.numeroContrato),
      formatDate(formData.dataFirmamentoContrato),
      formatDate(formData.dataInicioRescisao),
      formatDate(formData.dataTerminoRescisao),
      formatDate(formData.dataComunicacao),
      formatValue(formData.nomeProprietario),
      formatValue(formData.qualificacaoCompletaLocadores),
      formatValue(formData.celularProprietario),
      formatValue(formData.emailProprietario),
      formatValue(formData.nomeLocatario),
      formatValue(formData.qualificacaoCompletaLocatarios),
      formatValue(formData.celularLocatario),
      formatValue(formData.emailLocatario),
      formatValue(formData.enderecoImovel),
      formatValue(formData.tipoGarantia),
      formatValue(formData.nomeFiador),
      formatValue(formData.motivoDesocupacao),
      formatValue(formData.prazoDias),
      formatDate(contract.created_at),
      formatDate(contract.updated_at),
    ];

    rowData.forEach((value, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = value;
      cell.style = createDataStyle(isEven);
      
      // Alinhamento específico para algumas colunas
      if (index === 0) { // Nº Contrato
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (index >= 1 && index <= 4) { // Datas
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (index === 17) { // Prazo
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { vertical: 'middle', wrapText: true };
      }
    });

    worksheet.getRow(currentRow).height = 20;
    currentRow++;
  });

  // Ajustar largura das colunas (autofit)
  worksheet.columns.forEach((column, index) => {
    if (column) {
      let maxLength = 10;
      
      // Definir larguras mínimas e máximas por coluna
      const columnWidths: Record<number, number> = {
        0: 15,  // Nº Contrato
        1: 18,  // Data Firmamento
        2: 20,  // Data Início Rescisão
        3: 20,  // Data Término Rescisão
        4: 18,  // Data Comunicação
        5: 30,  // Proprietário(s)
        6: 40,  // Qualificação Proprietário(s)
        7: 18,  // Celular Proprietário
        8: 25,  // Email Proprietário
        9: 30,  // Locatário(s)
        10: 40, // Qualificação Locatário(s)
        11: 18, // Celular Locatário
        12: 25, // Email Locatário
        13: 40, // Endereço
        14: 20, // Tipo Garantia
        15: 30, // Fiador(es)
        16: 30, // Motivo Desocupação
        17: 12, // Prazo
        18: 18, // Data Criação
        19: 18, // Última Atualização
      };

      if (columnWidths[index]) {
        column.width = columnWidths[index];
      } else {
        column.width = maxLength;
      }
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
 * Exporta contratos para arquivo Excel com formatação profissional
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

  // Criar planilha principal
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

