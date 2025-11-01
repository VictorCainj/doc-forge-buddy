// @ts-nocheck
import { convertDateToBrazilian } from '@/utils/dateFormatter';

/**
 * Tipos de template processing
 */
export type TemplateProcessorOptions = {
  /**
   * Se deve limpar placeholders não substituídos
   * @default true
   */
  cleanUnusedPlaceholders?: boolean;

  /**
   * Se deve formatar datas automaticamente
   * @default true
   */
  formatDates?: boolean;

  /**
   * Caractere para indicar campo ausente
   * @default '[CAMPO]'
   */
  missingFieldPlaceholder?: string;
};

/**
 * Processa templates Handlebars substituindo variáveis e condicionais
 *
 * @example
 * ```typescript
 * const template = "Olá {{nome}}, você tem {{idade}} anos";
 * const data = { nome: "João", idade: "30" };
 * const result = processTemplate(template, data);
 * // "Olá João, você tem 30 anos"
 * ```
 *
 * @param template - Template Handlebars
 * @param data - Dados para substituição
 * @param options - Opções de processamento
 * @returns Template processado
 */
export function processTemplate(
  template: string,
  data: Record<string, string | string[]>,
  options: TemplateProcessorOptions = {}
): string {
  const {
    cleanUnusedPlaceholders = true,
    formatDates = true,
    missingFieldPlaceholder = '[CAMPO]',
  } = options;

  let result = template;

  // Processar condicionais {{#eq}} (igualdade)
  result = result.replace(
    /\{\{#eq\s+(\w+)\s+"([^"]+)"\}\}([\s\S]*?)\{\{\/eq\}\}/g,
    (match, variable, expectedValue, content) => {
      if (data[variable] === expectedValue) {
        return content;
      }
      return '';
    }
  );

  // Processar condicionais com else
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, variable, ifContent, elseContent) => {
      const value = data[variable];
      if (value) {
        if (typeof value === 'string' && value.trim()) {
          return ifContent;
        } else if (Array.isArray(value) && value.length > 0) {
          return ifContent;
        }
      }
      return elseContent;
    }
  );

  // Processar condicionais simples (sem else)
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, variable, content) => {
      const value = data[variable];
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.trim() !== '') {
          return content;
        } else if (Array.isArray(value) && value.length > 0) {
          return content;
        }
      }
      return '';
    }
  );

  // Processar loops {{#each}}
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, arrayName, content) => {
      const array = data[arrayName];
      if (Array.isArray(array) && array.length > 0) {
        return array
          .map((item) => {
            return content.replace(/\{\{this\}\}/g, item);
          })
          .join('');
      }
      return '';
    }
  );

  // Substituir variáveis
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    let formattedValue =
      value || (key === 'observacao' ? '' : missingFieldPlaceholder);

    // Formatar datas automaticamente
    if (
      formatDates &&
      (key.toLowerCase().includes('data') || key.toLowerCase().includes('date'))
    ) {
      if (value && typeof value === 'string' && value.trim() !== '') {
        formattedValue = convertDateToBrazilian(value);
      }
    }

    result = result.replace(new RegExp(placeholder, 'g'), formattedValue);
  });

  // Limpeza final de placeholders não substituídos
  if (cleanUnusedPlaceholders) {
    result = result.replace(/\{\{[^}]*\}\}/g, '');
  }

  return result;
}

/**
 * Verifica se há múltiplos locatários baseado no nome
 *
 * @param nomeLocatario - Nome do locatário
 * @returns true se há múltiplos locatários
 *
 * @example
 * ```typescript
 * isMultipleLocatarios("João e Maria") // true
 * isMultipleLocatarios("João") // false
 * ```
 */
export function isMultipleLocatarios(nomeLocatario: string): boolean {
  if (!nomeLocatario) return false;
  return nomeLocatario.includes(' e ');
}

/**
 * Verifica se a pessoa que retira a chave é terceira (não é locador nem locatário)
 *
 * @param nomeQuemRetira - Nome da pessoa que retira
 * @param nomeProprietario - Nome do proprietário
 * @param nomeLocatario - Nome do locatário
 * @returns true se é terceira pessoa
 *
 * @example
 * ```typescript
 * isTerceiraPessoa("Carlos", "João", "Maria") // true
 * isTerceiraPessoa("João", "João", "Maria") // false
 * ```
 */
export function isTerceiraPessoa(
  nomeQuemRetira: string,
  nomeProprietario: string,
  nomeLocatario: string
): boolean {
  // Se não há nome preenchido, não é terceira pessoa
  if (!nomeQuemRetira) return false;

  // Verificar se o nome não corresponde ao proprietário nem ao locatário
  const naoEhProprietario =
    !nomeProprietario ||
    !nomeQuemRetira.toLowerCase().includes(nomeProprietario.toLowerCase());
  const naoEhLocatario =
    !nomeLocatario ||
    !nomeQuemRetira.toLowerCase().includes(nomeLocatario.toLowerCase());

  return naoEhProprietario && naoEhLocatario;
}

/**
 * @deprecated Use processTemplate() instead
 * Mantido para compatibilidade com código existente
 */
export const replaceTemplateVariables = processTemplate;

/**
 * @deprecated Use processTemplate() instead
 * Mantido para compatibilidade com código existente
 */
export const processContractTemplate = processTemplate;
