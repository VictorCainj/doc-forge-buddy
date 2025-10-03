/**
 * Tipos específicos para contratos
 * Substitui o uso genérico de Record<string, string>
 */

export type DocumentType = 
  | 'Termo do Locador'
  | 'Termo do Locatário' 
  | 'Notificação de Agendamento'
  | 'Devolutiva WhatsApp'
  | 'NPS Email'
  | 'NPS WhatsApp'
  | 'Termo de Recusa de Assinatura - E-mail'
  | 'Devolutiva via E-mail - Locador'
  | 'Confirmação de Notificação de Desocupação e Procedimentos Finais - Contrato 13734'
  | 'Devolutiva Cobrança de Consumo'
  | 'Devolutiva Caderninho'
  | 'WhatsApp - Comercial'
  | 'Distrato de Contrato de Locação';

export type VistoriaType = 'inicial' | 'final' | 'vistoria' | 'revistoria';
export type PersonType = 'locador' | 'locatario';
export type GenderType = 'masculino' | 'feminino';
export type ContractStatus = 'active' | 'expired' | 'pending' | 'cancelled';

/**
 * Interface específica para dados de formulário de contrato
 * Substitui Record<string, string> com campos tipados
 */
export interface ContractFormData {
  // Dados básicos do contrato
  numeroContrato: string;
  enderecoImovel: string;
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

  // Dados do fiador
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
 * Interface para dados de NPS
 */
export interface NPSData {
  numbers: Record<string, string>;
  selectedParties: Record<string, boolean>;
  method: 'email' | 'whatsapp';
  whatsappType?: PersonType;
  selectedPerson?: string;
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
