/**
 * Tipos consolidados de vistoria
 * Substitui duplicações entre business/vistoria.ts, business/vistoria.extended.ts e Supabase types
 */

import { VistoriaType, BaseEntity, SupabaseJson } from './base';
import { Tables } from '@/integrations/supabase/types';

// =============================================================================
// FOTOS E ARQUIVOS
// =============================================================================

export type VistoriaFoto =
  | File
  | {
      name: string;
      url: string;
      isFromDatabase: boolean;
      size: number;
      type: string;
    };

// =============================================================================
// APONTAMENTOS
// =============================================================================

export interface ApontamentoVistoria {
  id: string;
  ambiente: string;
  subtitulo?: string;
  descricao: string;
  descricaoServico?: string; // Descrição específica para orçamento
  vistoriaInicial: {
    fotos: VistoriaFoto[];
    descritivoLaudo?: string;
  };
  vistoriaFinal: {
    fotos: VistoriaFoto[];
  };
  observacao: string;
  classificacao?: 'responsabilidade' | 'revisao'; // Classificação manual
  tipo?: 'material' | 'servico';
  valor?: number;
  quantidade?: number;
  unidade?: string;
}

export interface ApontamentoDB {
  id: string;
  ambiente: string;
  descricao: string;
  classificacao?: 'locador' | 'locatario' | 'ambos' | null;
  fotosInicial?: string[];
  fotosFinal?: string[];
  observacoes?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// =============================================================================
// DADOS DA VISTORIA
// =============================================================================

export interface DadosVistoria {
  locatario?: string;
  endereco?: string;
  dataVistoria?: string;
  tipoVistoria?: VistoriaType;
  responsavel?: string;
  observacoes?: string;
  tipoImovel?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface DadosVistoriaDB {
  endereco?: string;
  tipoImovel?: string;
  dataVistoria?: string;
  responsavel?: string;
  observacoes?: string;
  [key: string]: string | number | boolean | null | undefined;
}

// =============================================================================
// ANÁLISES DE VISTORIA
// =============================================================================

export interface VistoriaAnalise extends BaseEntity {
  title: string;
  contract_id?: string | null;
  public_document_id?: string | null;
  dados_vistoria: DadosVistoria;
  apontamentos: ApontamentoVistoria[];
}

export interface VistoriaAnaliseWithImages extends VistoriaAnalise {
  images: VistoriaImage[];
}

// Dados para criação de nova análise
export interface CreateVistoriaData {
  title: string;
  contract_id?: string | null;
  dados_vistoria: DadosVistoria;
  apontamentos: ApontamentoVistoria[];
}

// Dados para atualização
export interface UpdateVistoriaData {
  title?: string;
  contract_id?: string | null;
  dados_vistoria?: DadosVistoria;
  apontamentos?: ApontamentoVistoria[];
}

// =============================================================================
// IMAGENS DE VISTORIA
// =============================================================================

export interface VistoriaImage extends BaseEntity {
  vistoria_id?: string;
  apontamento_id: string;
  tipo_vistoria: string;
  image_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  image_serial?: string | null;
  user_id?: string | null;
}

// =============================================================================
// PAYLOADS PARA ATUALIZAÇÃO
// =============================================================================

export interface UpdateVistoriaAnalisePayload {
  title?: string;
  dados_vistoria?: SupabaseJson;
  apontamentos?: SupabaseJson;
  status?: string;
  updated_at?: string;
}

// =============================================================================
// CONVERSORES E HELPERS
// =============================================================================

/**
 * Converte dados para JSON do Supabase
 */
export const toSupabaseJson = <T>(data: T): SupabaseJson => {
  return JSON.parse(JSON.stringify(data)) as SupabaseJson;
};

/**
 * Converte JSON do Supabase para tipo específico
 */
export const fromSupabaseJson = <T>(json: SupabaseJson): T => {
  return json as T;
};

/**
 * Limpa payload removendo campos undefined
 */
export const cleanPayload = <T extends Record<string, unknown>>(
  payload: T
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isDadosVistoriaDB = (data: unknown): data is DadosVistoriaDB => {
  if (typeof data !== 'object' || data === null) return false;
  return true; // Validação básica, pode ser expandida
};

export const isApontamentosArray = (data: unknown): data is ApontamentoDB[] => {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'ambiente' in item &&
      'descricao' in item
  );
};

// =============================================================================
// MAPPING COM SUPABASE TYPES
// =============================================================================

/**
 * Mapeia vistoria_analises do Supabase para VistoriaAnalise
 */
export const mapSupabaseVistoriaAnalise = (
  dbAnalise: Tables<'vistoria_analises'>['Row']
): VistoriaAnalise => {
  return {
    id: dbAnalise.id,
    title: dbAnalise.title,
    contract_id: dbAnalise.contract_id,
    public_document_id: dbAnalise.public_document_id,
    dados_vistoria: dbAnalise.dados_vistoria as DadosVistoria,
    apontamentos: dbAnalise.apontamentos as ApontamentoVistoria[],
    created_at: dbAnalise.created_at,
    updated_at: dbAnalise.updated_at,
    user_id: dbAnalise.user_id
  };
};

/**
 * Mapeia vistoria_images do Supabase para VistoriaImage
 */
export const mapSupabaseVistoriaImage = (
  dbImage: Tables<'vistoria_images'>['Row']
): VistoriaImage => {
  return {
    id: dbImage.id,
    vistoria_id: dbImage.vistoria_id || undefined,
    apontamento_id: dbImage.apontamento_id,
    tipo_vistoria: dbImage.tipo_vistoria,
    image_url: dbImage.image_url,
    file_name: dbImage.file_name,
    file_size: dbImage.file_size,
    file_type: dbImage.file_type,
    image_serial: dbImage.image_serial,
    created_at: dbImage.created_at,
    user_id: dbImage.user_id
  };
};

/**
 * Mapeia dados para insert no Supabase
 */
export const mapToSupabaseVistoriaInsert = (
  data: CreateVistoriaData
): Tables<'vistoria_analises'>['Insert'] => {
  return {
    title: data.title,
    contract_id: data.contract_id || null,
    dados_vistoria: toSupabaseJson(data.dados_vistoria),
    apontamentos: toSupabaseJson(data.apontamentos),
  };
};

/**
 * Mapeia payload para update no Supabase
 */
export const mapToSupabaseVistoriaUpdate = (
  data: UpdateVistoriaData
): Tables<'vistoria_analises'>['Update'] => {
  return cleanPayload({
    title: data.title,
    contract_id: data.contract_id,
    dados_vistoria: data.dados_vistoria ? toSupabaseJson(data.dados_vistoria) : undefined,
    apontamentos: data.apontamentos ? toSupabaseJson(data.apontamentos) : undefined,
  });
};