import { convertDateToBrazilian } from '@/utils/dateFormatter';

/**
 * Substitui variáveis do template com dados do formulário
 */
export const replaceTemplateVariables = (
  template: string,
  data: Record<string, string>
): string => {
  let result = template;

  // Processar condicionais Handlebars {{#eq}} (igualdade)
  result = result.replace(
    /\{\{#eq\s+(\w+)\s+"([^"]+)"\}\}([\s\S]*?)\{\{\/eq\}\}/g,
    (_match, variable, expectedValue, content) => {
      if (data[variable] === expectedValue) {
        return content;
      }
      return '';
    }
  );

  // Processar condicionais Handlebars com else
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, variable, ifContent, elseContent) => {
      if (data[variable] && data[variable].trim()) {
        return ifContent;
      }
      return elseContent;
    }
  );

  // Processar condicionais Handlebars simples (sem else)
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, variable, content) => {
      if (data[variable] && data[variable].trim()) {
        return content;
      }
      return '';
    }
  );

  // Substituir variáveis
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    // Para observações vazias, não exibir placeholder
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

  return result;
};

/**
 * Verifica se há múltiplos locatários baseado no nome
 */
export const isMultipleLocatarios = (nomeLocatario: string): boolean => {
  if (!nomeLocatario) return false;
  return nomeLocatario.includes(' e ');
};

/**
 * Verifica se a pessoa que retira a chave é terceira (não é locador nem locatário)
 */
export const isTerceiraPessoa = (
  nomeQuemRetira: string,
  nomeProprietario: string,
  nomeLocatario: string
): boolean => {
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
};
