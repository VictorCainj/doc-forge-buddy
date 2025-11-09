/**
 * Tipos consolidados de contratos
 * Substitui duplicações entre domain/contract.ts e Supabase types
 */

import { VistoriaType, PersonType, ContractStatus, BaseEntity, BaseFormData } from './base';
import { Tables } from '@/integrations/supabase/types';

// =============================================================================
// DOCUMENTOS E TIPOS
// =============================================================================

export type DocumentType =
  | 'Termo do Locador'
  | 'Termo do Locatário'
  | 'Notificação de Agendamento'
  | 'Devolutiva WhatsApp'
  | 'Termo de Recusa de Assinatura - E-mail'
  | 'Notificação de Desocupação e Agendamento de Vistoria'
  | 'Devolutiva Locatário'
  | 'Devolutiva Cobrança de Consumo'
  | 'Devolutiva Caderninho'
  | 'Notificação de Desocupação - Comercial'
  | 'Distrato de Contrato de Locação';

// =============================================================================
// DADOS DE FORMULÁRIO CONSOLIDADOS
// =============================================================================

export interface ContractFormData extends BaseFormData {
  // Dados básicos do contrato
  numeroContrato?: string;
  enderecoImovel?: string;
  dataFirmamentoContrato?: string;
  dataInicioRescisao?: string;
  dataTerminoRescisao?: string;
  dataComunicacao?: string;
  prazoDias?: string;

  // Dados do locatário
  nomeLocatario?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  generoLocatario?: PersonType; // Usando PersonType consolidado
  celularLocatario?: string;
  emailLocatario?: string;
  qualificacaoCompletaLocatarios?: string;

  // Dados do proprietário/locador
  nomeProprietario?: string;
  nomesResumidosLocadores?: string;
  generoProprietario?: PersonType; // Usando PersonType consolidado
  celularProprietario?: string;
  emailProprietario?: string;
  qualificacaoCompletaLocadores?: string;

  // Dados de garantia
  tipoGarantia?: string;
  temFiador?: string;
  nomeFiador?: string;
  primeiroFiador?: string;
  segundoFiador?: string;
  terceiroFiador?: string;
  quartoFiador?: string;

  // Dados específicos para templates
  dataAtual?: string;
  dataRealizacaoVistoria?: string;
  assinanteSelecionado?: string;
  tipoVistoria?: VistoriaType;
  observacao?: string;

  // Campos calculados/processados
  locatarioTerm?: string;
  proprietarioTerm?: string;
  locatarioPrezado?: string;
  proprietarioPrezado?: string;
  primeiroNomeLocatario?: string;
  primeiroNomeProprietario?: string;
  mesesComprovantes?: string;
  saudacaoComercial?: string;

  // Motivo da desocupação
  motivoDesocupacao?: string;

  // Contas de consumo
  solicitarAgua?: string;
  solicitarCondominio?: string;
  solicitarGas?: string;
}

// =============================================================================
// CONTRATOS
// =============================================================================

export interface BaseContract extends BaseEntity {
  title: string;
}

export interface Contract extends BaseContract {
  form_data: ContractFormData;
  content: string;
  document_type: DocumentType | string;
}

// Dados para criação de novo contrato
export interface CreateContractData {
  title: string;
  form_data: ContractFormData;
  document_type: DocumentType | string;
  content: string;
}

// Dados para atualização de contrato
export interface UpdateContractData extends Partial<CreateContractData> {
  updated_at?: string;
}

// =============================================================================
// AGENDAMENTOS E VISTORIAS
// =============================================================================

export interface AgendamentoData {
  dataVistoria: string;
  horaVistoria: string;
  tipoVistoria: VistoriaType;
}

export interface RecusaAssinaturaData {
  dataRealizacaoVistoria: string;
  tipoVistoriaRecusa: VistoriaType;
  assinanteSelecionado: string;
}

export interface WhatsAppData {
  type: PersonType;
  selectedPerson: string;
  assinanteSelecionado: string;
}

// =============================================================================
// CONTAS DE CONSUMO
// =============================================================================

export type BillType =
  | 'energia'
  | 'agua'
  | 'condominio'
  | 'gas'
  | 'notificacao_rescisao'
  | 'entrega_chaves';

export interface ContractBill extends BaseEntity {
  contract_id: string;
  bill_type: BillType;
  delivered: boolean;
  delivered_at?: string;
  user_id?: string;
}

export interface BillStatus {
  energia?: boolean;
  agua?: boolean;
  condominio?: boolean;
  gas?: boolean;
  notificacao_rescisao?: boolean;
  entrega_chaves?: boolean;
}

// =============================================================================
// FAVORITOS E TAGS
// =============================================================================

export interface ContractFavorite extends BaseEntity {
  contract_id: string;
  user_id: string;
}

export interface ContractTag extends BaseEntity {
  contract_id: string;
  tag_name: string;
  color: string;
  user_id: string;
  is_automatic?: boolean;
}

// Status de contrato para badges e gradientes
export type ContractStatusType = 'ativo' | 'pendente' | 'expirado' | 'rescisao';

// =============================================================================
// CONTRATOS LEGACY (SUPABASE)
// =============================================================================

/**
 * Contrato da tabela contracts do Supabase (estrutura legada)
 */
export interface LegacyContract {
  id: string;
  numero_contrato: string;
  endereco_imovel: string;
  nome_locatario: string;
  nome_proprietario: string;
  email_proprietario: string;
  data_inicio_desocupacao: string;
  data_termino_desocupacao: string;
  data_comunicacao: string;
  prazo_dias: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Saved terms do Supabase (tabela principal de documentos)
 */
export interface SavedTerm extends BaseEntity {
  content: string;
  document_type: string;
  form_data: Record<string, any>;
  title: string;
  user_id: string | null;
  teve_vistoria?: boolean | null;
  teve_revistoria?: boolean | null;
  data_vistoria?: string | null;
  data_revistoria?: string | null;
  vistoria_id?: string | null;
  revistoria_id?: string | null;
}

// =============================================================================
// MAPPING COM SUPABASE TYPES
// =============================================================================

/**
 * Mapeia saved_terms do Supabase para Contract
 */
export const mapSupabaseSavedTerm = (dbTerm: Tables<'saved_terms'>['Row']): Contract => {
  return {
    id: dbTerm.id,
    title: dbTerm.title,
    content: dbTerm.content,
    document_type: dbTerm.document_type as DocumentType,
    form_data: dbTerm.form_data as ContractFormData,
    created_at: dbTerm.created_at,
    updated_at: dbTerm.updated_at,
    user_id: dbTerm.user_id
  };
};

/**
 * Mapeia contract_bills do Supabase para ContractBill
 */
export const mapSupabaseContractBill = (dbBill: Tables<'contract_bills'>['Row']): ContractBill => {
  return {
    id: dbBill.id,
    contract_id: dbBill.contract_id,
    bill_type: dbBill.bill_type as BillType,
    delivered: dbBill.delivered,
    delivered_at: dbBill.delivered_at,
    created_at: dbBill.created_at,
    updated_at: dbBill.updated_at,
    user_id: dbBill.user_id
  };
};

/**
 * Mapeia contracts do Supabase para LegacyContract
 */
export const mapSupabaseContract = (dbContract: Tables<'contracts'>['Row']): LegacyContract => {
  return {
    id: dbContract.id,
    numero_contrato: dbContract.numero_contrato,
    endereco_imovel: dbContract.endereco_imovel,
    nome_locatario: dbContract.nome_locatario,
    nome_proprietario: dbContract.nome_proprietario,
    email_proprietario: dbContract.email_proprietario,
    data_inicio_desocupacao: dbContract.data_inicio_desocupacao,
    data_termino_desocupacao: dbContract.data_termino_desocupacao,
    data_comunicacao: dbContract.data_comunicacao,
    prazo_dias: dbContract.prazo_dias,
    user_id: dbContract.user_id,
    created_at: dbContract.created_at,
    updated_at: dbContract.updated_at
  };
};