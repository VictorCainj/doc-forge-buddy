/**
 * Shared template processing utilities
 * Centraliza toda lógica de processamento de templates Handlebars
 */

export {
  processTemplate,
  isMultipleLocatarios,
  isTerceiraPessoa,
  replaceTemplateVariables,
  processContractTemplate,
} from './templateProcessor';

export type { TemplateProcessorOptions } from './templateProcessor';
