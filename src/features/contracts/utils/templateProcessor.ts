import { convertDateToBrazilian } from '@/utils/dateFormatter';

/**
 * Processa templates Handlebars substituindo variáveis e condicionais
 */
export function processContractTemplate(
  template: string,
  data: Record<string, string>
): string {
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
      value || (key === 'observacao' ? '' : `[${key.toUpperCase()}]`);

    // Formatar datas automaticamente
    if (
      key.toLowerCase().includes('data') ||
      key.toLowerCase().includes('date')
    ) {
      if (value && value.trim() !== '') {
        formattedValue = convertDateToBrazilian(value);
      }
    }

    result = result.replace(new RegExp(placeholder, 'g'), formattedValue);
  });

  // Limpeza final de placeholders não substituídos
  result = result.replace(/\{\{[^}]*\}\}/g, '');

  return result;
}
