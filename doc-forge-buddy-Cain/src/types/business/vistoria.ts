/**
 * @fileoverview Tipos para sistema de vistoria
 * @description Definições de tipos para o sistema completo de vistoria de imóveis
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

/**
 * Union type para fotos de vistoria
 * @description Suporta tanto File (upload novo) quanto objeto (foto existente)
 */
export type VistoriaFoto =
  | File
  | {
      /** Nome do arquivo */
      name: string;
      /** URL da imagem */
      url: string;
      /** Indica se a foto vem do banco de dados */
      isFromDatabase: boolean;
      /** Tamanho do arquivo em bytes */
      size: number;
      /** Tipo MIME do arquivo */
      type: string;
    };

/**
 * Interface para apontamento de vistoria
 * @description Define estrutura para um apontamento específico em uma vistoria
 */
export interface ApontamentoVistoria {
  /** Identificador único do apontamento */
  id: string;
  /** Ambiente onde foi feito o apontamento */
  ambiente: string;
  /** Subtítulo do apontamento */
  subtitulo: string;
  /** Descrição detalhada do apontamento */
  descricao: string;
  /** Descrição específica para orçamento (opcional) */
  descricaoServico?: string;
  /** Dados da vistoria inicial */
  vistoriaInicial: {
    /** Fotos da vistoria inicial */
    fotos: VistoriaFoto[];
    /** Descritivo do laudo (opcional) */
    descritivoLaudo?: string;
  };
  /** Dados da vistoria final */
  vistoriaFinal: {
    /** Fotos da vistoria final */
    fotos: VistoriaFoto[];
  };
  /** Observações gerais */
  observacao: string;
  /** Classificação manual do apontamento (opcional) */
  classificacao?: 'responsabilidade' | 'revisao';
  /** Tipo do apontamento (opcional) */
  tipo?: 'material' | 'servico';
  /** Valor estimado (opcional) */
  valor?: number;
  /** Quantidade estimada (opcional) */
  quantidade?: number;
  /** Unidade de medida (opcional) */
  unidade?: string;
}

/**
 * Interface para dados básicos de vistoria
 * @description Informações principais para identificação e contexto da vistoria
 */
export interface DadosVistoria {
  /** Nome do locatário */
  locatario: string;
  /** Endereço do imóvel */
  endereco: string;
  /** Data da vistoria */
  dataVistoria: string;
  /** Tipo de vistoria (opcional) */
  tipoVistoria?: 'inicial' | 'final' | 'vistoria' | 'revistoria';
  /** Responsável pela vistoria (opcional) */
  responsavel?: string;
  /** Observações gerais (opcional) */
  observacoes?: string;
}

/**
 * Interface para análise de vistoria
 * @description Estrutura principal para armazenar dados completos de uma análise de vistoria
 */
export interface VistoriaAnalise {
  /** Identificador único (opcional, gerado automaticamente) */
  id?: string;
  /** Título da análise */
  title: string;
  /** ID do contrato associado (opcional) */
  contract_id?: string | null;
  /** ID do documento público associado (opcional) */
  public_document_id?: string | null;
  /** Dados básicos da vistoria */
  dados_vistoria: DadosVistoria;
  /** Lista de apontamentos da vistoria */
  apontamentos: ApontamentoVistoria[];
  /** Data de criação (opcional) */
  created_at?: string;
  /** Data de atualização (opcional) */
  updated_at?: string;
  /** ID do usuário que criou (opcional) */
  user_id?: string | null;
}

/**
 * Interface para imagem de vistoria
 * @description Metadados de uma imagem associada a um apontamento
 */
export interface VistoriaImage {
  /** Identificador único (opcional) */
  id?: string;
  /** ID da vistoria */
  vistoria_id: string;
  /** ID do apontamento */
  apontamento_id: string;
  /** Tipo de vistoria */
  tipo_vistoria: string;
  /** URL da imagem */
  image_url: string;
  /** Nome do arquivo */
  file_name: string;
  /** Tamanho do arquivo em bytes */
  file_size: number;
  /** Tipo MIME do arquivo */
  file_type: string;
  /** Número de série da imagem (opcional) */
  image_serial?: string;
  /** Data de criação (opcional) */
  created_at?: string;
  /** ID do usuário (opcional) */
  user_id?: string | null;
}

/**
 * Interface para análise de vistoria com imagens
 * @description Extensão de VistoriaAnalise incluindo suas imagens associadas
 */
export interface VistoriaAnaliseWithImages extends VistoriaAnalise {
  /** Imagens associadas à análise */
  images: VistoriaImage[];
}

/**
 * Interface para dados de criação de vistoria
 * @description Dados necessários para criar uma nova análise de vistoria
 */
export interface CreateVistoriaData {
  /** Título da nova vistoria */
  title: string;
  /** ID do contrato associado (opcional) */
  contract_id?: string | null;
  /** Dados básicos da vistoria */
  dados_vistoria: DadosVistoria;
  /** Lista de apontamentos iniciais */
  apontamentos: ApontamentoVistoria[];
}

/**
 * Interface para dados de atualização de vistoria
 * @description Dados opcionais para atualização de uma vistoria existente
 */
export interface UpdateVistoriaData {
  /** Novo título (opcional) */
  title?: string;
  /** Novo ID de contrato (opcional) */
  contract_id?: string | null;
  /** Novos dados básicos (opcional) */
  dados_vistoria?: DadosVistoria;
  /** Novos apontamentos (opcional) */
  apontamentos?: ApontamentoVistoria[];
}
