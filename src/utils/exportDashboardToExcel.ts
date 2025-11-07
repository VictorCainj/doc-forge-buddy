import ExcelJS from 'exceljs';
import type { Workbook, Worksheet } from 'exceljs';
import { DashboardData, DashboardFilters } from '@/types/dashboardDesocupacao';

/**
 * Cores da paleta profissional
 */
const colors = {
  primary: { argb: 'FF1E3A8A' }, // Azul escuro
  secondary: { argb: 'FF059669' }, // Verde escuro
  tertiary: { argb: 'FF6B21A8' }, // Roxo escuro
  highlight: { argb: 'FFEA580C' }, // Laranja escuro
  headerLight: { argb: 'FFF3F4F6' }, // Cinza claro
  headerGreen: { argb: 'FFD1FAE5' }, // Verde claro
  headerPurple: { argb: 'FFE9D5FF' }, // Roxo claro
  headerOrange: { argb: 'FFFED7AA' }, // Laranja claro
  zebraLight: { argb: 'FFF9FAFB' }, // Cinza muito claro
  statusGreenBg: { argb: 'FFD1FAE5' }, // Verde claro (fundo)
  statusGreenText: { argb: 'FF065F46' }, // Verde escuro (texto)
  statusRedBg: { argb: 'FFFEE2E2' }, // Vermelho claro (fundo)
  statusRedText: { argb: 'FF991B1B' }, // Vermelho escuro (texto)
  statBg: { argb: 'FFFAFAFA' }, // Cinza muito claro
  statHighlight: { argb: 'FFFEF3C7' }, // Amarelo claro
  totalBg: { argb: 'FF374151' }, // Cinza escuro
  statsBg: { argb: 'FFDBEAFE' }, // Azul muito claro
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
 * Estilo para linha de totais
 */
function createTotalStyle() {
  return {
    font: {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: colors.totalBg,
    },
    alignment: { horizontal: 'center', vertical: 'middle' as const },
    border: {
      top: { style: 'double', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    },
  };
}

/**
 * Estilo para status (Sim/Não)
 */
function createStatusStyle(value: string) {
  const isSim = value === 'Sim';
  return {
    font: {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: isSim ? colors.statusGreenText : colors.statusRedText,
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: isSim ? colors.statusGreenBg : colors.statusRedBg,
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
 * Aplicar bordas em um range de células
 */
function _applyBorders(
  worksheet: Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = worksheet.getCell(row, col);
      if (!cell.border) {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      }
    }
  }
}

/**
 * Mesclar células para título
 */
function mergeTitleCells(
  worksheet: Worksheet,
  row: number,
  startCol: number,
  endCol: number
) {
  worksheet.mergeCells(row, startCol, row, endCol);
}

/**
 * Função auxiliar para calcular período formatado
 */
function getPeriodoFormatado(filters: DashboardFilters): string {
  let mes: number;
  let ano: number;

  if (filters.periodo === 'mes-especifico' && filters.ano && filters.mes) {
    mes = filters.mes;
    ano = filters.ano;
  } else if (filters.periodo === 'periodo-personalizado') {
    if (filters.dataInicio) {
      const dataInicio = new Date(filters.dataInicio);
      mes = dataInicio.getMonth() + 1;
      ano = dataInicio.getFullYear();
    } else {
      const now = new Date();
      mes = now.getMonth() + 1;
      ano = now.getFullYear();
    }
  } else {
    const now = new Date();
    mes = now.getMonth() + 1;
    ano = now.getFullYear();
  }

  const ultimoDia = new Date(ano, mes, 0).getDate();
  const nomeMes = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ][mes - 1];

  return `01/${nomeMes} até ${ultimoDia}/${nomeMes}`;
}

/**
 * Função para parsear data no formato DD/MM/YYYY
 */
function parseDate(dateString: string): Date | null {
  if (!dateString || dateString === 'N/A') return null;

  if (dateString.includes('/')) {
    const [dia, mes, ano] = dateString.split('/');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  }

  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Obter nome do mês baseado no filtro
 */
function getNomeMesFiltro(filters: DashboardFilters): string {
  const nomesMeses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  if (filters.periodo === 'mes-especifico' && filters.mes) {
    return nomesMeses[filters.mes - 1];
  }

  const now = new Date();
  return nomesMeses[now.getMonth()];
}

/**
 * Criar planilha de Contratos
 */
function createContratosSheet(
  workbook: Workbook,
  data: DashboardData,
  filters: DashboardFilters
): Worksheet {
  const worksheet = workbook.addWorksheet('Contratos');
  const periodoFormatado = getPeriodoFormatado(filters);
  const nomeMes = getNomeMesFiltro(filters);

  // Título com mês e quantidade de contratos (coluna B)
  const totalContratos = data.contratos.length;
  worksheet.getCell(1, 2).value =
    `CONTRATOS EM DESOCUPAÇÃO - ${nomeMes.toUpperCase()} - ${totalContratos} Contrato${totalContratos !== 1 ? 's' : ''}`;
  Object.assign(worksheet.getCell(1, 2), createTitleStyle(colors.primary));
  mergeTitleCells(worksheet, 1, 2, 8);
  worksheet.getRow(1).height = 25;

  // Subtítulo com período e data/hora de geração (coluna B)
  const agora = new Date();
  const dataGeracao = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaGeracao = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  worksheet.getCell(2, 2).value =
    `Período: ${periodoFormatado} | Gerado em: ${dataGeracao} às ${horaGeracao}`;
  worksheet.getCell(2, 2).font = {
    name: 'Calibri',
    size: 11,
    color: { argb: 'FF757575' },
  };
  worksheet.getCell(2, 2).alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  mergeTitleCells(worksheet, 2, 2, 8);
  worksheet.getRow(2).height = 20;

  // Linha vazia
  worksheet.getRow(3).height = 10;

  // Cabeçalhos (colunas B-H)
  const headers = [
    'Número do Contrato',
    'Endereço do Imóvel',
    'Nome do Locador',
    'Nome do Locatário',
    'Data Início Rescisão',
    'Data Término Rescisão',
    'Motivo de Desocupação',
  ];

  headers.forEach((header, idx) => {
    const cell = worksheet.getCell(4, idx + 2); // Começa na coluna B (índice 2)
    cell.value = header;
    Object.assign(cell, createHeaderStyle(colors.headerLight));
  });
  worksheet.getRow(4).height = 25;

  // Ordenar contratos do mais antigo para o mais recente (por data de início da rescisão)
  const contratosOrdenados = [...data.contratos].sort((a, b) => {
    const dataA = parseDate(a.dataInicioRescisao);
    const dataB = parseDate(b.dataInicioRescisao);

    // Se as datas forem inválidas, colocar no final
    if (!dataA && !dataB) return 0;
    if (!dataA) return 1;
    if (!dataB) return -1;

    // Ordenar do mais antigo (menor data) para o mais recente (maior data)
    return dataA.getTime() - dataB.getTime();
  });

  // Dados
  contratosOrdenados.forEach((contrato, rowIdx) => {
    const row = rowIdx + 5;
    const isEven = rowIdx % 2 === 0;

    const values = [
      contrato.numeroContrato || 'N/A',
      contrato.enderecoImovel || 'N/A',
      contrato.nomeLocador || 'N/A',
      contrato.nomeLocatario || 'N/A',
      contrato.dataInicioRescisao || 'N/A',
      contrato.dataTerminoRescisao || 'N/A',
      contrato.motivoDesocupacao || 'N/A',
    ];

    values.forEach((value, colIdx) => {
      const cell = worksheet.getCell(row, colIdx + 2); // Começa na coluna B (índice 2)
      cell.value = value;
      Object.assign(cell, createDataStyle(isEven));
      // Colunas centralizadas: 0 (Número do Contrato), 4 (Data Início), 5 (Data Término)
      // Colunas de texto à esquerda: 1 (Endereço), 2 (Locador), 3 (Locatário), 6 (Motivo)
      const isCenterColumn = colIdx === 0 || colIdx === 4 || colIdx === 5;
      cell.alignment = {
        horizontal: isCenterColumn ? 'center' : 'left',
        vertical: 'middle',
      };
    });
    worksheet.getRow(row).height = 20;
  });

  // Ajustar larguras das colunas
  // Coluna A vazia (espaçamento esquerdo), B-H para dados
  worksheet.columns = [
    { width: 5 }, // A: Espaçamento esquerdo
    { width: 20 }, // B: Número do Contrato
    { width: 40 }, // C: Endereço do Imóvel
    { width: 25 }, // D: Nome do Locador
    { width: 30 }, // E: Nome do Locatário
    { width: 20 }, // F: Data Início Rescisão
    { width: 20 }, // G: Data Término Rescisão
    { width: 35 }, // H: Motivo de Desocupação
  ];

  // Adicionar filtros (colunas B-H)
  worksheet.autoFilter = 'B4:H4';

  // Congelar painéis
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 4,
      xSplit: 0,
      topLeftCell: 'B5',
      activeCell: 'B5',
    },
  ];

  return worksheet;
}

/**
 * Criar planilha de Ranking Motivos com Estatísticas
 */
function createRankingSheet(
  workbook: Workbook,
  data: DashboardData,
  filters: DashboardFilters
): Worksheet {
  const worksheet = workbook.addWorksheet('Ranking Motivos');
  const periodoFormatado = getPeriodoFormatado(filters);
  const nomeMes = getNomeMesFiltro(filters);

  // ========== SEÇÃO 1: RANKING DE MOTIVOS (Colunas B-D, com espaço na coluna A) ==========

  // Título do Ranking com mês (coluna B)
  worksheet.getCell(1, 2).value =
    `RANKING DE MOTIVOS DE DESOCUPAÇÃO - ${nomeMes.toUpperCase()}`;
  Object.assign(worksheet.getCell(1, 2), createTitleStyle(colors.primary));
  mergeTitleCells(worksheet, 1, 2, 4);
  worksheet.getRow(1).height = 25;

  // Linha vazia
  worksheet.getRow(2).height = 10;

  // Cabeçalhos do Ranking (colunas B-D)
  const headers = ['Motivo', 'Quantidade', 'Porcentagem'];
  headers.forEach((header, idx) => {
    const cell = worksheet.getCell(3, idx + 2); // Começa na coluna B (índice 2)
    cell.value = header;
    Object.assign(cell, createHeaderStyle(colors.headerLight));
  });
  worksheet.getRow(3).height = 25;

  // Dados do Ranking (colunas B-D)
  data.motivosStats.forEach((motivo, rowIdx) => {
    const row = rowIdx + 4;
    const isEven = rowIdx % 2 === 0;

    worksheet.getCell(row, 2).value = motivo.motivo || 'N/A';
    worksheet.getCell(row, 3).value = motivo.count || 0;
    worksheet.getCell(row, 4).value = `${motivo.percentage.toFixed(2)}%`;

    [2, 3, 4].forEach((col) => {
      const cell = worksheet.getCell(row, col);
      Object.assign(cell, createDataStyle(isEven));
      cell.alignment = {
        horizontal: col === 2 ? 'left' : 'center',
        vertical: 'middle',
      };
    });
    worksheet.getRow(row).height = 20;
  });

  // Linha TOTAL do Ranking
  const totalRow = data.motivosStats.length + 4;
  const totalQuantidade = data.motivosStats.reduce(
    (sum, motivo) => sum + motivo.count,
    0
  );

  worksheet.getCell(totalRow, 2).value = 'TOTAL';
  worksheet.getCell(totalRow, 3).value = totalQuantidade;
  worksheet.getCell(totalRow, 4).value = '100.00%';

  [2, 3, 4].forEach((col) => {
    const cell = worksheet.getCell(totalRow, col);
    Object.assign(cell, createTotalStyle());
  });
  worksheet.getRow(totalRow).height = 25;

  // ========== SEÇÃO 2: ESTATÍSTICAS (Colunas F-G, com espaço na coluna E) ==========

  // Título das Estatísticas (coluna F, linha 1) com mês
  worksheet.getCell(1, 6).value =
    `ESTATÍSTICAS DO DASHBOARD - ${nomeMes.toUpperCase()}`;
  Object.assign(worksheet.getCell(1, 6), createTitleStyle(colors.primary));
  mergeTitleCells(worksheet, 1, 6, 7);
  worksheet.getRow(1).height = 25;

  // Linha vazia (já existe na linha 2)

  // Cabeçalhos das Estatísticas (coluna F-G, linha 3)
  worksheet.getCell(3, 6).value = 'Métrica';
  Object.assign(worksheet.getCell(3, 6), createHeaderStyle(colors.headerLight));
  worksheet.getCell(3, 7).value = 'Valor';
  Object.assign(worksheet.getCell(3, 7), createHeaderStyle(colors.headerLight));

  // Dados das Estatísticas (colunas F-G)
  const estatisticas = [
    { metrica: 'Total de Desocupações', valor: data.stats.totalDesocupacoes },
    {
      metrica: 'Motivo Mais Comum',
      valor: data.stats.motivoMaisComum || 'N/A',
    },
    { metrica: 'Período Analisado', valor: `Período: ${periodoFormatado}` },
  ];

  estatisticas.forEach((stat, idx) => {
    const row = idx + 4;
    const isPeriodo = stat.metrica === 'Período Analisado';

    // Coluna Métrica (F)
    const cellMetrica = worksheet.getCell(row, 6);
    cellMetrica.value = stat.metrica;
    cellMetrica.font = { name: 'Calibri', size: 10, bold: true };
    cellMetrica.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: colors.statBg,
    };
    cellMetrica.alignment = { horizontal: 'left', vertical: 'middle' };
    cellMetrica.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    // Coluna Valor (G)
    const cellValor = worksheet.getCell(row, 7);
    cellValor.value = stat.valor;
    cellValor.font = {
      name: 'Calibri',
      size: 10,
      bold: isPeriodo,
    };
    cellValor.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: isPeriodo ? colors.statHighlight : { argb: 'FFFFFFFF' },
    };
    cellValor.alignment = {
      horizontal: 'center', // Sempre centralizado (números e texto)
      vertical: 'middle',
    };
    cellValor.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    // Garantir que a linha tenha a mesma altura do ranking
    if (row <= totalRow) {
      worksheet.getRow(row).height = row === totalRow ? 25 : 20;
    } else {
      worksheet.getRow(row).height = 22;
    }
  });

  // Ajustar larguras das colunas
  // Coluna A vazia (espaçamento esquerdo), B-D para Ranking, E vazia (espaço), F-G para Estatísticas
  worksheet.columns = [
    { width: 5 }, // A: Espaçamento esquerdo
    { width: 40 }, // B: Motivo
    { width: 12 }, // C: Quantidade
    { width: 12 }, // D: Porcentagem
    { width: 5 }, // E: Espaço entre seções
    { width: 25 }, // F: Métrica (Estatísticas)
    { width: 35 }, // G: Valor (Estatísticas)
  ];

  // Adicionar filtros apenas para o ranking (colunas B-D)
  worksheet.autoFilter = 'B3:D3';

  // Congelar painéis
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 3,
      xSplit: 0,
      topLeftCell: 'B4',
      activeCell: 'B4',
    },
  ];

  return worksheet;
}

/**
 * Criar planilha de Finalizados
 */
function createFinalizadosSheet(
  workbook: Workbook,
  data: DashboardData,
  filters: DashboardFilters
): Worksheet {
  const worksheet = workbook.addWorksheet('Finalizados');

  // Obter ano e mês do filtro
  const getAnoEMes = (): { ano: number; mes: number } => {
    if (filters.periodo === 'mes-especifico' && filters.ano && filters.mes) {
      return { ano: filters.ano, mes: filters.mes };
    }
    // Mês atual
    const now = new Date();
    return { ano: now.getFullYear(), mes: now.getMonth() + 1 };
  };

  const { ano: anoFiltro, mes: mesFiltro } = getAnoEMes();

  // Nome do mês em português
  const nomesMesesCompletos = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const nomeMes = nomesMesesCompletos[mesFiltro - 1];

  // Filtrar contratos finalizados: 
  // Contratos que foram NOTIFICADOS no mês (dataInicioRescisao) E já entregaram as chaves
  const contratosFinalizados = data.contratos.filter((contrato) => {
    // Deve ter entregado as chaves (status entregue = true)
    if (contrato.entregaChaves?.entregue !== true) {
      return false;
    }

    // Deve ter sido notificado no mês do filtro (baseado em dataInicioRescisao)
    if (!contrato.dataInicioRescisao) {
      return false;
    }

    const dataInicioRescisao = parseDate(contrato.dataInicioRescisao);
    if (
      !dataInicioRescisao ||
      dataInicioRescisao.getMonth() + 1 !== mesFiltro ||
      dataInicioRescisao.getFullYear() !== anoFiltro
    ) {
      return false;
    }

    // Passou nas validações: foi notificado no mês E já entregou as chaves
    return true;
  });

  // Título
  worksheet.getCell(1, 1).value =
    `CONTRATOS FINALIZADOS - ${nomeMes.toUpperCase()} (Notificados no Mês)`;
  Object.assign(worksheet.getCell(1, 1), createTitleStyle(colors.primary));
  mergeTitleCells(worksheet, 1, 1, 6);
  worksheet.getRow(1).height = 25;

  // Subtítulo explicativo
  worksheet.getCell(2, 1).value = 
    'Contratos que foram notificados em ' + nomeMes + ' e já entregaram as chaves (no próprio mês ou em meses posteriores)';
  worksheet.getCell(2, 1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF757575' } };
  worksheet.getCell(2, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  mergeTitleCells(worksheet, 2, 1, 6);
  worksheet.getRow(2).height = 20;

  // Linha vazia
  worksheet.getRow(3).height = 10;

  // Cabeçalhos
  const headers = [
    'Número do Contrato',
    'Nome do Locatário',
    'Endereço do Imóvel',
    'Data Notificação',
    'Data Término Rescisão',
    'Data Entrega Chaves',
  ];

  headers.forEach((header, idx) => {
    const cell = worksheet.getCell(4, idx + 1);
    cell.value = header;
    Object.assign(cell, createHeaderStyle(colors.headerLight));
  });
  worksheet.getRow(4).height = 25;

  // Separar contratos em grupos baseado na data de entrega das chaves
  const contratosNoMes = contratosFinalizados.filter((contrato) => {
    if (!contrato.entregaChaves?.dataEntrega) return false;
    const dataEntrega = parseDate(contrato.entregaChaves.dataEntrega);
    return (
      dataEntrega &&
      dataEntrega.getMonth() + 1 === mesFiltro &&
      dataEntrega.getFullYear() === anoFiltro
    );
  });

  const contratosOutroMes = contratosFinalizados.filter((contrato) => {
    if (!contrato.entregaChaves?.dataEntrega) return true; // Se não tem data, considera outro mês
    const dataEntrega = parseDate(contrato.entregaChaves.dataEntrega);
    return !(
      dataEntrega &&
      dataEntrega.getMonth() + 1 === mesFiltro &&
      dataEntrega.getFullYear() === anoFiltro
    );
  });

  // ========== SEÇÃO 1: CHAVES ENTREGUES NO MÊS ==========
  let currentRow = 5;
  
  if (contratosNoMes.length > 0) {
    const sectionTitleRow = currentRow;
    worksheet.getCell(sectionTitleRow, 1).value = 
      `CHAVES ENTREGUES EM ${nomeMes.toUpperCase()} (${contratosNoMes.length} contratos)`;
    Object.assign(worksheet.getCell(sectionTitleRow, 1), createTitleStyle(colors.secondary));
    mergeTitleCells(worksheet, sectionTitleRow, 1, 6);
    worksheet.getRow(sectionTitleRow).height = 22;
    currentRow++;

    // Dados dos contratos que entregaram no mês
    contratosNoMes.forEach((contrato, idx) => {
      const row = currentRow;
      const isEven = idx % 2 === 0;

      const values = [
        contrato.numeroContrato || 'N/A',
        contrato.nomeLocatario || 'N/A',
        contrato.enderecoImovel || 'N/A',
        contrato.dataInicioRescisao || 'N/A',
        contrato.dataTerminoRescisao || 'N/A',
        contrato.entregaChaves?.dataEntrega || 'N/A',
      ];

      values.forEach((value, colIdx) => {
        const cell = worksheet.getCell(row, colIdx + 1);
        cell.value = value;
        Object.assign(cell, createDataStyle(isEven));
        cell.alignment = {
          horizontal: colIdx === 1 || colIdx === 2 ? 'left' : 'center',
          vertical: 'middle',
        };
      });
      worksheet.getRow(row).height = 20;
      currentRow++;
    });

    // Espaço
    worksheet.getRow(currentRow).height = 10;
    currentRow++;
  }

  // ========== SEÇÃO 2: CHAVES ENTREGUES EM OUTROS MESES ==========
  if (contratosOutroMes.length > 0) {
    const sectionTitleRow = currentRow;
    worksheet.getCell(sectionTitleRow, 1).value = 
      `CHAVES ENTREGUES EM OUTROS MESES (${contratosOutroMes.length} contratos)`;
    Object.assign(worksheet.getCell(sectionTitleRow, 1), createTitleStyle(colors.highlight));
    mergeTitleCells(worksheet, sectionTitleRow, 1, 6);
    worksheet.getRow(sectionTitleRow).height = 22;
    currentRow++;

    // Dados dos contratos que entregaram em outro mês
    contratosOutroMes.forEach((contrato, idx) => {
      const row = currentRow;
      const isEven = idx % 2 === 0;

      const values = [
        contrato.numeroContrato || 'N/A',
        contrato.nomeLocatario || 'N/A',
        contrato.enderecoImovel || 'N/A',
        contrato.dataInicioRescisao || 'N/A',
        contrato.dataTerminoRescisao || 'N/A',
        contrato.entregaChaves?.dataEntrega || 'N/A',
      ];

      values.forEach((value, colIdx) => {
        const cell = worksheet.getCell(row, colIdx + 1);
        cell.value = value;
        Object.assign(cell, createDataStyle(isEven));
        cell.alignment = {
          horizontal: colIdx === 1 || colIdx === 2 ? 'left' : 'center',
          vertical: 'middle',
        };
      });
      worksheet.getRow(row).height = 20;
      currentRow++;
    });
  }

  // ========== ESTATÍSTICAS RESUMIDAS ==========
  if (contratosFinalizados.length > 0) {
    // Espaço
    worksheet.getRow(currentRow).height = 15;
    currentRow++;
    const statsTitleRow = currentRow;
    worksheet.getCell(statsTitleRow, 1).value = 'ESTATÍSTICAS RESUMIDAS';
    Object.assign(
      worksheet.getCell(statsTitleRow, 1),
      createTitleStyle(colors.primary) // Azul escuro neutro
    );
    mergeTitleCells(worksheet, statsTitleRow, 1, 6);
    worksheet.getRow(statsTitleRow).height = 25;
    currentRow++;

    const totalFinalizados = contratosFinalizados.length;
    const entregaramChavesNoMes = contratosNoMes.length;
    const entregaramChavesOutroMes = contratosOutroMes.length;

    // Calcular próximo mês
    const proximoMesNum = mesFiltro === 12 ? 1 : mesFiltro + 1;
    const nomeProximoMes = nomesMesesCompletos[proximoMesNum - 1];

    // Buscar contratos pendentes do período (estão no mês do filtro mas não entregaram chaves)
    // A lógica considera todos os contratos que estão no período filtrado
    const contratosPendentesProximoMes = data.contratos.filter((contrato) => {
      // Deve estar no período do filtro (baseado em dataInicioRescisao)
      if (!contrato.dataInicioRescisao) return false;

      const dataInicio = parseDate(contrato.dataInicioRescisao);
      if (
        !dataInicio ||
        dataInicio.getMonth() + 1 !== mesFiltro ||
        dataInicio.getFullYear() !== anoFiltro
      ) {
        return false;
      }

      // E NÃO deve ter entregado as chaves ainda
      return contrato.entregaChaves?.entregue !== true;
    });

    const statsData = [
      {
        label: `Total de contratos finalizados em ${nomeMes.toLowerCase()}`,
        value: totalFinalizados,
      },
      {
        label: `Entregaram as chaves em ${nomeMes.toLowerCase()}`,
        value: entregaramChavesNoMes,
      },
      {
        label: 'Entregaram as chaves em outro mês',
        value: entregaramChavesOutroMes,
      },
      {
        label: `Contratos pendentes de entrega de chaves para ${nomeProximoMes.toLowerCase()}`,
        value: contratosPendentesProximoMes.length,
      },
    ];

    statsData.forEach((stat) => {
      const row = currentRow;

      // Coluna label (mesclar colunas 2-3)
      const cellLabelStart = worksheet.getCell(row, 2);
      cellLabelStart.value = stat.label;
      cellLabelStart.font = { name: 'Calibri', size: 11, bold: true };
      cellLabelStart.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: colors.statsBg,
      };
      cellLabelStart.alignment = { horizontal: 'left', vertical: 'middle' };
      cellLabelStart.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      worksheet.mergeCells(row, 2, row, 3);

      // Coluna valor (mesclar colunas 4-6)
      const cellValue = worksheet.getCell(row, 4);
      cellValue.value = stat.value;
      cellValue.font = { name: 'Calibri', size: 11, bold: true };
      cellValue.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: colors.statsBg,
      };
      cellValue.alignment = { horizontal: 'center', vertical: 'middle' };
      cellValue.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      worksheet.mergeCells(row, 4, row, 6);

      worksheet.getRow(row).height = 22;
      currentRow++;
    });
  }

  // Ajustar larguras
  worksheet.columns = [
    { width: 20 },
    { width: 30 },
    { width: 40 },
    { width: 18 },
    { width: 20 },
    { width: 20 },
  ];

  // Adicionar filtros nos cabeçalhos
  worksheet.autoFilter = 'A4:F4';

  // Congelar painéis
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 4,
      xSplit: 0,
      topLeftCell: 'A5',
      activeCell: 'A5',
    },
  ];

  return worksheet;
}

/**
 * Exporta dados do dashboard para arquivo Excel com formatação profissional
 */
export async function exportDashboardToExcel(
  data: DashboardData,
  filters: DashboardFilters
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // Criar planilhas
  createContratosSheet(workbook, data, filters);
  createRankingSheet(workbook, data, filters);
  createFinalizadosSheet(workbook, data, filters);

  // Gerar nome do arquivo
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `dashboard-desocupacao-${dateStr}.xlsx`;

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
