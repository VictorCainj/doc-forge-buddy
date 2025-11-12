import type { Workbook, Worksheet, Cell } from 'exceljs';
import type { Contract } from '@/types/domain/contract';
import { formatDateShort } from '@/utils/core/dateFormatter';

let ExcelJS: typeof import('exceljs') | null = null;

async function getExcelJS() {
  if (!ExcelJS) {
    const startTime = performance.now();
    ExcelJS = await import('exceljs');
    const loadTime = performance.now() - startTime;
    console.log(`📊 ExcelJS carregado em ${loadTime.toFixed(0)}ms`);
  }
  return ExcelJS;
}

const colors = {
  header: { argb: 'FFF3F4F6' },
  zebra: { argb: 'FFF9FAFB' },
  border: { argb: 'FFE5E7EB' },
  text: { argb: 'FF111827' },
  alert: { argb: 'FFFDE8E8' },
};

function applyHeaderCellStyle(cell: Cell) {
  cell.style = {
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: colors.text.argb } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: colors.header,
    },
    border: {
      top: { style: 'thin', color: colors.border },
      left: { style: 'thin', color: colors.border },
      bottom: { style: 'thin', color: colors.border },
      right: { style: 'thin', color: colors.border },
    },
  };
}

function applyDataCellStyle(cell: Cell, isStriped: boolean, alignCenter = false) {
  cell.style = {
    font: { name: 'Calibri', size: 10, color: { argb: colors.text.argb } },
    alignment: {
      horizontal: alignCenter ? 'center' : 'left',
      vertical: 'middle',
      wrapText: !alignCenter,
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: isStriped ? colors.zebra : { argb: 'FFFFFFFF' },
    },
    border: {
      top: { style: 'thin', color: colors.border },
      left: { style: 'thin', color: colors.border },
      bottom: { style: 'thin', color: colors.border },
      right: { style: 'thin', color: colors.border },
    },
  };
}

function setDateCell(cell: Cell, date: Date | null, fallback: string) {
  if (date) {
    cell.value = date;
    cell.numFmt = 'dd/mm/yyyy';
  } else {
    cell.value = fallback;
  }
}

function parseDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;

    if (trimmed.includes('/')) {
      const [day, month, year] = trimmed.split('/');
      const parsed = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatValue(value: string | number | null | undefined, fallback = 'Não informado'): string {
  if (value === null || value === undefined) return fallback;
  const stringValue = String(value).trim();
  return stringValue === '' ? fallback : stringValue;
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return 'Não informado';

  try {
    if (dateStr.includes('/')) {
      return dateStr;
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }
    return formatDateShort(date);
  } catch {
    return dateStr;
  }
}

function getFirstNonEmpty(values: Array<any>): string | undefined {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const stringValue = String(value).trim();
    if (stringValue !== '') {
      return stringValue;
    }
  }
  return undefined;
}

function getContractIdentifier(contract: Contract): string {
  const formData = contract.form_data || {};
  const candidate = getFirstNonEmpty([
    formData.numeroContrato,
    formData.numero_contrato,
    contract.title,
    contract.id,
  ]);
  return formatValue(candidate);
}

function getLandlordName(formData: Record<string, any> = {}): string {
  const candidate = getFirstNonEmpty([
    formData.nomeProprietario,
    formData.primeiroNomeProprietario,
    formData.primeiroLocador,
    formData.nomesResumidosLocadores,
  ]);
  return formatValue(candidate);
}

function getTenantName(formData: Record<string, any> = {}): string {
  const candidate = getFirstNonEmpty([
    formData.nomeLocatario,
    formData.primeiroLocatario,
    formData.locatario_nome,
  ]);
  return formatValue(candidate);
}

function getAddress(formData: Record<string, any> = {}): string {
  const candidate = getFirstNonEmpty([
    formData.enderecoImovel,
    formData.imovel_endereco,
    formData.endereco,
    formData.address,
  ]);
  return formatValue(candidate);
}

function getRescissionDate(
  formData: Record<string, any> = {},
  key: 'dataInicioRescisao' | 'dataTerminoRescisao'
): { date: Date | null; display: string } {
  const parsed = parseDate(formData[key]);
  if (parsed) {
    return { date: parsed, display: formatDateShort(parsed) };
  }
  return { date: null, display: formatDate(formData[key]) };
}

function getInspectionDate(contract: Contract): { date: Date | null; display: string } {
  const formData = contract.form_data || {};
  const candidateDates = [
    (contract as any).data_vistoria,
    formData.dataVistoria,
    formData.dataRealizacaoVistoria,
  ];

  for (const value of candidateDates) {
    const parsed = parseDate(value);
    if (parsed) {
      return { date: parsed, display: formatDateShort(parsed) };
    }
  }

  const fallback = formatDate(candidateDates[0]);
  return { date: null, display: fallback };
}

function calculateDaysUntil(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = target.getTime() - startToday.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDateTimeWithHours(value?: string | null): { date: Date | null; display: string } {
  if (!value) {
    return { date: null, display: 'Não informado' };
  }

  try {
    const parsedFromHelper = parseDate(value);
    if (parsedFromHelper) {
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(parsedFromHelper);
      return { date: parsedFromHelper, display: formatted };
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return { date: null, display: formatValue(value) };
    }

    const formatted = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(parsed);

    return { date: parsed, display: formatted };
  } catch {
    return { date: null, display: formatValue(value) };
  }
}

function getCommunicationDate(
  formData: Record<string, any> = {}
): { date: Date | null; display: string } {
  const parsed = parseDate(formData.dataComunicacao);
  if (parsed) {
    return { date: parsed, display: formatDateShort(parsed) };
  }

  return { date: null, display: formatDate(formData.dataComunicacao) };
}

type BillStatusKey =
  | 'energia'
  | 'agua'
  | 'condominio'
  | 'gas'
  | 'notificacao_rescisao'
  | 'entrega_chaves';

const statusKeyMap: Record<BillStatusKey, string[]> = {
  energia: ['statusEnergia', 'energiaStatus', 'status_energia', 'energia_entregue', 'entregaEnergia'],
  agua: ['statusAgua', 'aguaStatus', 'status_agua', 'entregaAgua'],
  condominio: ['statusCondominio', 'condominioStatus', 'status_condominio'],
  gas: ['statusGas', 'gasStatus', 'status_gas'],
  notificacao_rescisao: [
    'statusNotificacaoRescisao',
    'statusNotificacao',
    'status_notificacao_rescisao',
    'notificacaoStatus',
  ],
  entrega_chaves: ['statusEntregaChaves', 'entregaChavesStatus', 'status_entrega_chaves'],
};

function normalizeStatusValue(value: unknown): string | null {
  if (typeof value === 'boolean') {
    return value ? 'Entregue' : 'Pendente';
  }

  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  if (normalized === '') {
    return null;
  }

  const lower = normalized.toLowerCase();

  if (
    ['true', 'sim', 'entregue', 'ok', 'concluido', 'concluída', 'concluida', 'feito', 'realizado'].includes(
      lower
    )
  ) {
    return 'Entregue';
  }

  if (
    ['false', 'nao', 'não', 'pendente', 'em aberto', 'aguardando', 'a fazer', 'não entregue', 'nao entregue'].includes(
      lower
    )
  ) {
    return 'Pendente';
  }

  return normalized;
}

function resolveStatusLabel(
  contract: Contract,
  formData: Record<string, any>,
  billType: BillStatusKey
): string {
  const contractAny = contract as unknown as {
    billStatus?: Partial<Record<BillStatusKey, boolean>>;
    bills?: Array<{ bill_type: string; delivered: boolean }>;
  };

  const statusFromContract = contractAny.billStatus?.[billType];
  if (typeof statusFromContract === 'boolean') {
    return statusFromContract ? 'Entregue' : 'Pendente';
  }

  const deliveredFromBills = contractAny.bills?.find((bill) => bill.bill_type === billType)?.delivered;
  if (typeof deliveredFromBills === 'boolean') {
    return deliveredFromBills ? 'Entregue' : 'Pendente';
  }

  const candidate = getFirstNonEmpty(statusKeyMap[billType].map((key) => formData?.[key]));
  const normalized = normalizeStatusValue(candidate);
  return normalized ?? 'Não informado';
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data ?? {});
  } catch (error) {
    console.warn('[exportContractsToExcel] Falha ao serializar form_data', error);
    return '';
  }
}

async function computeFormDataHash(formData: Record<string, any>): Promise<string> {
  const serialized = safeStringify(formData);

  if (!serialized) {
    return 'Não informado';
  }

  try {
    if (window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(serialized);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (error) {
    console.warn('[exportContractsToExcel] Falha ao gerar hash SHA-256', error);
  }

  return 'Não disponível';
}

function getVersionValue(formData: Record<string, any>): number | string {
  const rawVersion =
    formData?.versao ?? formData?.version ?? (formData as Record<string, any>)['versaoContrato'];

  if (rawVersion === undefined || rawVersion === null || rawVersion === '') {
    return 'Não informado';
  }

  const parsed = Number(rawVersion);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return formatValue(rawVersion);
}

function getLastActionValue(formData: Record<string, any>): string {
  const candidate = getFirstNonEmpty([
    formData?.ultimaAcao,
    formData?.ultima_acao,
    formData?.lastAction,
    formData?.ultimaacao,
  ]);

  return formatValue(candidate);
}

type DateLikeCellValue = { date: Date | null; display: string; isDateTime?: boolean };
type RowCellValue = string | number | DateLikeCellValue;

async function createContractsSheet(workbook: Workbook, contracts: Contract[]): Promise<Worksheet> {
  const worksheet = workbook.addWorksheet('Contratos');

  const headers = [
    'Contrato ID (using to match)',
    'Número do Contrato',
    'Locador',
    'Locatário',
    'Endereço',
    'Motivo Desocupação',
    'Data Início Rescisão',
    'Data Término Rescisão',
    'Data Comunicação',
    'Dias até Vistoria',
    'Status Energia',
    'Status Água',
    'Status Condomínio',
    'Status Gás',
    'Status Notificação Rescisão',
    'Status Entrega de Chaves',
    'Última Atualização',
    'Versão',
    'Última Ação',
    'Hash Form Data',
  ];

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(1, index + 1);
    cell.value = header;
    applyHeaderCellStyle(cell);
  });
  worksheet.getRow(1).height = 24;

  const rows = await Promise.all(
    contracts.map(async (contract) => {
      const formData = (contract.form_data || {}) as Record<string, any>;

      const contractId = formatValue(contract.id);
      const contractNumber = getContractIdentifier(contract);
      const landlord = getLandlordName(formData);
      const tenant = getTenantName(formData);
      const address = getAddress(formData);
      const motivo = formatValue(formData.motivoDesocupacao);
      const startRescission = getRescissionDate(formData, 'dataInicioRescisao');
      const endRescission = getRescissionDate(formData, 'dataTerminoRescisao');
      const communication = getCommunicationDate(formData);
      const inspection = getInspectionDate(contract);
      const daysUntil = calculateDaysUntil(inspection.date);
      const statusEnergia = resolveStatusLabel(contract, formData, 'energia');
      const statusAgua = resolveStatusLabel(contract, formData, 'agua');
      const statusCondominio = resolveStatusLabel(contract, formData, 'condominio');
      const statusGas = resolveStatusLabel(contract, formData, 'gas');
      const statusNotificacao = resolveStatusLabel(contract, formData, 'notificacao_rescisao');
      const statusEntregaChaves = resolveStatusLabel(contract, formData, 'entrega_chaves');

      const lastUpdateSource = getFirstNonEmpty([
        formData?.ultimaAtualizacao,
        formData?.ultima_atualizacao,
        formData?.lastUpdate,
        contract.updated_at,
      ]);
      const lastUpdate = formatDateTimeWithHours(lastUpdateSource);

      const versionValue = getVersionValue(formData);
      const lastAction = getLastActionValue(formData);

      const rawHash =
        getFirstNonEmpty([
          formData?.hashFormData,
          formData?.hash_form_data,
          formData?.formDataHash,
          formData?.hash,
          (formData?.totem_metadados as Record<string, any> | undefined)?.hash,
          (contract as unknown as { totem_metadados?: { hash?: string } }).totem_metadados?.hash,
        ]) || undefined;

      const hash = rawHash ?? (await computeFormDataHash(formData));

      const values: RowCellValue[] = [
        contractId,
        contractNumber,
        landlord,
        tenant,
        address,
        motivo,
        startRescission,
        endRescission,
        communication,
        daysUntil ?? 'Não informado',
        statusEnergia,
        statusAgua,
        statusCondominio,
        statusGas,
        statusNotificacao,
        statusEntregaChaves,
        { ...lastUpdate, isDateTime: true },
        versionValue,
        lastAction,
        hash,
      ];

      return {
        values,
        isUrgent: daysUntil !== null && daysUntil <= 7,
      };
    })
  );

  const dateColumns = new Set<number>([7, 8, 9, 17]);
  const dateTimeColumns = new Set<number>([17]);
  const centerColumns = new Set<number>([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18]);
  const urgentColumns = new Set<number>([10]);

  rows.forEach(({ values, isUrgent }, contractIndex) => {
    const rowIndex = contractIndex + 2;

    values.forEach((value, columnIndex) => {
      const columnNumber = columnIndex + 1;
      const cell = worksheet.getCell(rowIndex, columnNumber);
      const isStriped = contractIndex % 2 === 1;
      const alignCenter = centerColumns.has(columnNumber);

      if (
        typeof value === 'object' &&
        value !== null &&
        'date' in value &&
        'display' in value
      ) {
        const typedValue = value as DateLikeCellValue;

        if (typedValue.date && dateColumns.has(columnNumber)) {
          cell.value = typedValue.date;
          cell.numFmt = dateTimeColumns.has(columnNumber) ? 'dd/mm/yyyy hh:mm' : 'dd/mm/yyyy';
        } else {
          cell.value = typedValue.display;
        }

        applyDataCellStyle(cell, isStriped, true);
      } else {
        cell.value = value as string | number;
        applyDataCellStyle(cell, isStriped, alignCenter);
      }

      if (isUrgent && urgentColumns.has(columnNumber)) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: colors.alert };
      }
    });

    worksheet.getRow(rowIndex).height = 20;
  });

  const columnWidths = [20, 22, 26, 26, 40, 30, 20, 20, 20, 18, 20, 20, 20, 18, 28, 24, 24, 12, 26, 44];
  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  if (contracts.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: contracts.length + 1, column: headers.length },
    };
  }

  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 1,
      xSplit: 0,
      activeCell: 'A2',
      showGridLines: true,
    },
  ];

  return worksheet;
}

export interface ExportContractsOptions {
  selectedMonth?: string;
  selectedYear?: string;
  hasSearched?: boolean;
}

function buildFileName(options: ExportContractsOptions, fallbackDate: string): string {
  if (options.selectedMonth && options.selectedYear) {
    const monthStr = options.selectedMonth.padStart(2, '0');
    return `contratos-${options.selectedYear}-${monthStr}.xlsx`;
  }

  if (options.selectedYear) {
    return `contratos-${options.selectedYear}.xlsx`;
  }

  if (options.hasSearched) {
    return `contratos-busca-${fallbackDate}.xlsx`;
  }

  return `contratos-todos-${fallbackDate}.xlsx`;
}

export async function exportContractsToExcel(
  contracts: Contract[],
  options: ExportContractsOptions = {}
): Promise<void> {
  if (!contracts || contracts.length === 0) {
    throw new Error('Não há contratos para exportar');
  }

  const ExcelJSModule = await getExcelJS();
  const { Workbook } = ExcelJSModule;

  const workbook = new Workbook();
  workbook.creator = 'Doc Forge Buddy';
  workbook.created = new Date();

  await createContractsSheet(workbook, contracts);

  const generatedAt = new Date();
  const dateStr = generatedAt.toISOString().split('T')[0].replace(/-/g, '');
  const filename = buildFileName(options, dateStr);

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
