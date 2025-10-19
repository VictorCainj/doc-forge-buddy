/**
 * Tipos estendidos para Vistoria - Complementa os tipos base
 * Criado para eliminar uso de 'any' e melhorar type safety
 */

import { Json } from '@/integrations/supabase/types';

/**
 * Dados estruturados da vistoria no banco de dados
 */
export interface DadosVistoriaDB {
  endereco?: string;
  tipoImovel?: string;
  dataVistoria?: string;
  responsavel?: string;
  observacoes?: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Estrutura de um apontamento individual na vistoria
 */
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

/**
 * Payload para atualização de análise de vistoria
 */
export interface UpdateVistoriaAnalisePayload {
  title?: string;
  dados_vistoria?: Json;
  apontamentos?: Json;
  status?: string;
  updated_at?: string;
}

/**
 * Helper para conversão segura de dados para JSON do Supabase
 */
export const toSupabaseJson = <T>(data: T): Json => {
  return JSON.parse(JSON.stringify(data)) as Json;
};

/**
 * Helper para conversão segura de JSON do Supabase para tipo específico
 */
export const fromSupabaseJson = <T>(json: Json): T => {
  return json as T;
};

/**
 * Type guard para verificar se dados são válidos de vistoria
 */
export const isDadosVistoriaDB = (data: unknown): data is DadosVistoriaDB => {
  if (typeof data !== 'object' || data === null) return false;
  return true; // Validação básica, pode ser expandida
};

/**
 * Type guard para verificar se é um array de apontamentos válido
 */
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
