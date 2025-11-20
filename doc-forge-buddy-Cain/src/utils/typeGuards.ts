import { VistoriaAnaliseWithImages, ApontamentoVistoria, DadosVistoria } from '@/types/vistoria';
import { Prestador } from '@/types/business';

/**
 * Type guard para validar VistoriaAnaliseWithImages
 */
export function isValidAnalise(data: unknown): data is VistoriaAnaliseWithImages {
  if (!data || typeof data !== 'object') return false;
  
  const analise = data as Partial<VistoriaAnaliseWithImages>;
  
  return (
    typeof analise.id === 'string' &&
    typeof analise.title === 'string' &&
    typeof analise.created_at === 'string' &&
    analise.dados_vistoria !== undefined &&
    isValidDadosVistoria(analise.dados_vistoria) &&
    Array.isArray(analise.apontamentos) &&
    Array.isArray(analise.images)
  );
}

/**
 * Type guard para validar DadosVistoria
 */
export function isValidDadosVistoria(data: unknown): data is DadosVistoria {
  if (!data || typeof data !== 'object') return false;
  
  const dados = data as Partial<DadosVistoria>;
  
  return (
    typeof dados.locatario === 'string' &&
    typeof dados.endereco === 'string' &&
    typeof dados.dataVistoria === 'string'
  );
}

/**
 * Type guard para validar ApontamentoVistoria
 */
export function isValidApontamento(data: unknown): data is ApontamentoVistoria {
  if (!data || typeof data !== 'object') return false;
  
  const apt = data as Partial<ApontamentoVistoria>;
  
  return (
    typeof apt.id === 'string' &&
    typeof apt.ambiente === 'string' &&
    typeof apt.descricao === 'string' &&
    apt.vistoriaInicial !== undefined &&
    apt.vistoriaFinal !== undefined
  );
}

/**
 * Type guard para validar Prestador
 */
export function isValidPrestador(data: unknown): data is Prestador {
  if (!data || typeof data !== 'object') return false;
  
  const prestador = data as Partial<Prestador>;
  
  return (
    typeof prestador.id === 'string' &&
    typeof prestador.nome === 'string' &&
    typeof prestador.created_at === 'string'
  );
}

/**
 * Type guard para validar array de análises
 */
export function isValidAnaliseArray(data: unknown): data is VistoriaAnaliseWithImages[] {
  return Array.isArray(data) && data.every(isValidAnalise);
}

/**
 * Type guard para validar array de prestadores
 */
export function isValidPrestadorArray(data: unknown): data is Prestador[] {
  return Array.isArray(data) && data.every(isValidPrestador);
}

/**
 * Type guard para validar File
 */
export function isValidImageFile(file: unknown): file is File {
  if (!(file instanceof File)) return false;
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  return (
    allowedTypes.includes(file.type) &&
    file.size > 0 &&
    file.size <= maxSize
  );
}

/**
 * Validador de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validador de CNPJ (formato básico)
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  return cleanCNPJ.length === 14;
}

/**
 * Validador de telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}
