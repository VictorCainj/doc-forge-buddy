/**
 * Utilitários para processamento de nomes
 */

/**
 * Divide uma string de nomes completos em um array de nomes individuais
 * Aceita vírgulas e " e "/" E " como separadores
 *
 * @param fullNames - String contendo um ou mais nomes separados por vírgulas e/ou " e "
 * @returns Array de nomes individuais sem espaços extras
 *
 * @example
 * splitNames("João e Maria") // ["João", "Maria"]
 * splitNames("João, Maria e Pedro") // ["João", "Maria", "Pedro"]
 * splitNames("João, Maria, Pedro e Ana") // ["João", "Maria", "Pedro", "Ana"]
 */
export const splitNames = (fullNames: string): string[] => {
  if (!fullNames) return [];

  return fullNames
    .split(/[,]|(?:\s+e\s+)|(?:\s+E\s+)/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
};

/**
 * Formata uma lista de nomes para exibição com vírgulas e "e"
 *
 * @param names - Array de nomes
 * @returns String formatada (ex: "João, Maria e Pedro")
 *
 * @example
 * formatNamesList(["João", "Maria"]) // "João e Maria"
 * formatNamesList(["João", "Maria", "Pedro"]) // "João, Maria e Pedro"
 */
export const formatNamesList = (names: string[]): string => {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;

  return names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1];
};

/**
 * Extrai os primeiros nomes de uma lista de nomes completos
 *
 * @param fullNames - String contendo nomes completos
 * @returns Array de primeiros nomes capitalizados
 *
 * @example
 * extractFirstNames("João Silva e Maria Santos") // ["João", "Maria"]
 */
export const extractFirstNames = (fullNames: string): string[] => {
  const names = splitNames(fullNames);
  return names.map((name) => {
    const firstName = name.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  });
};
