/**
 * @fileoverview Tipos específicos para contratos
 * @description Substitui o uso genérico de Record<string, string> com interfaces tipadas
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

/**
 * Tipos de documento suportados pelo sistema
 * @description Define todos os tipos de documento que podem ser gerados
 */
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

export type VistoriaType =
  | 'inicial'
  | 'final'
  | 'vistoria'
  | 'revistoria'
  | 'nao_realizada';
export type PersonType = 'locador' | 'locatario';
export type GenderType = 'masculino' | 'feminino' | 'masculinos' | 'femininos';
export type ContractStatus = 'active' | 'expired' | 'pending' | 'cancelled';

/**
 * Interface específica para dados de formulário de contrato
 * Substitui Record<string, string> com campos tipados
 */
export interface ContractFormData {
  // Dados básicos do contrato
  numeroContrato: string;
  enderecoImovel?: string;
  dataFirmamentoContrato?: string;
  dataInicioRescisao?: string;
  dataTerminoRescisao?: string;
  dataComunicacao?: string;
  prazoDias?: string;
  versao?: number;

  // Dados do locatário
  nomeLocatario?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  generoLocatario?: GenderType;
  celularLocatario?: string;
  emailLocatario?: string;
  qualificacaoCompletaLocatarios?: string;

  // Dados do proprietário/locador
  nomeProprietario?: string;
  nomesResumidosLocadores?: string;
  generoProprietario?: GenderType;
  celularProprietario?: string;
  emailProprietario?: string;
  qualificacaoCompletaLocadores?: string;

  // Dados de garantia
  tipoGarantia?: string;
  temFiador?: string; // Mantido para compatibilidade
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

  // Campos flexíveis para casos especiais
  [key: string]: string | undefined;
}

/**
 * Interface base para contratos
 */
export interface BaseContract {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface completa para contratos com form_data tipado
 */
export interface Contract extends BaseContract {
  form_data: ContractFormData;
  content: string;
  document_type: DocumentType | string; // string para compatibilidade
}

/**
 * Dados para criação de novo contrato
 */
export interface CreateContractData {
  title: string;
  form_data: ContractFormData;
  document_type: DocumentType | string;
  content: string;
}

/**
 * Dados para atualização de contrato
 */
export interface UpdateContractData extends Partial<CreateContractData> {
  updated_at?: string;
}

/**
 * Interface para dados de agendamento
 */
export interface AgendamentoData {
  dataVistoria: string;
  horaVistoria: string;
  tipoVistoria: VistoriaType;
}

/**
 * Interface para dados de recusa de assinatura
 */
export interface RecusaAssinaturaData {
  dataRealizacaoVistoria: string;
  tipoVistoriaRecusa: VistoriaType;
  assinanteSelecionado: string;
}

/**
 * Interface para dados de WhatsApp
 */
export interface WhatsAppData {
  type: PersonType;
  selectedPerson: string;
  assinanteSelecionado: string;
}

/**
 * Tipos de contas de consumo
 */
export type BillType =
  | 'energia'
  | 'agua'
  | 'condominio'
  | 'gas'
  | 'notificacao_rescisao'
  | 'entrega_chaves';

/**
 * Interface para conta de consumo de um contrato
 */
export interface ContractBill {
  id: string;
  contract_id: string;
  bill_type: BillType;
  delivered: boolean;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

/**
 * Status de entrega das contas de consumo
 */
export interface BillStatus {
  energia?: boolean;
  agua?: boolean;
  condominio?: boolean;
  gas?: boolean;
  notificacao_rescisao?: boolean;
  entrega_chaves?: boolean;
}

/**
 * Tipo de status de contrato para badges e gradientes
 */
export type ContractStatusType = 'ativo' | 'pendente' | 'expirado' | 'rescisao';

/**
 * Interface para favorito de contrato
 */
export interface ContractFavorite {
  id: string;
  contract_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Interface para tag de contrato
 */
export interface ContractTag {
  id: string;
  contract_id: string;
  tag_name: string;
  color: string;
  user_id: string;
  created_at: string;
  is_automatic?: boolean; // Indica se a tag é gerada automaticamente
}