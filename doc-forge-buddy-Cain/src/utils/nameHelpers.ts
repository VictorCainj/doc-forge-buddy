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
    .split(/[,]|(?:\s+e\s+)|(?:\s+E\s+)|\n+/)
    .map(name => name.trim())
    .filter(name => name.length > 0);
};

/**
 * Formata uma lista de nomes para exibição com vírgulas e "e" seguindo padrão convencional
 * Aplicável APENAS para exibição em documentos, mantendo individualidade no cadastro
 *
 * Regras:
 * - 1 nome: sem separadores
 * - 2 nomes: "Nome1 e Nome2"
 * - 3+ nomes: "Nome1, Nome2, Nome3 e Nome4"
 *
 * @param names - Array de nomes
 * @returns String formatada (ex: "João, Maria e Pedro")
 *
 * @example
 * formatNamesList(["João"]) // "João"
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
 * Formata uma lista de nomes com HTML (negrito) para exibição em documentos
 * Aplicável APENAS para exibição em documentos, mantendo individualidade no cadastro
 *
 * @param names - Array de nomes
 * @returns String formatada com HTML (ex: "<strong>João</strong>, <strong>Maria</strong> e <strong>Pedro</strong>")
 *
 * @example
 * formatNamesListWithHTML(["João"]) // "<strong>João</strong>"
 * formatNamesListWithHTML(["João", "Maria"]) // "<strong>João</strong> e <strong>Maria</strong>"
 * formatNamesListWithHTML(["João", "Maria", "Pedro"]) // "<strong>João</strong>, <strong>Maria</strong> e <strong>Pedro</strong>"
 */
export const formatNamesListWithHTML = (names: string[]): string => {
  if (names.length === 0) return '';
  if (names.length === 1) return `<strong>${names[0]}</strong>`;
  if (names.length === 2)
    return `<strong>${names[0]}</strong> e <strong>${names[1]}</strong>`;

  const formatted = names
    .slice(0, -1)
    .map(nome => `<strong>${nome}</strong>`)
    .join(', ');
  return `${formatted} e <strong>${names[names.length - 1]}</strong>`;
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
  return names.map(name => {
    const firstName = name.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  });
};

interface LocatarioNameSource {
  nomeLocatario?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
}

/**
 * Extrai e normaliza todos os nomes de locatários disponíveis no contrato.
 * Garante unicidade e remove entradas curtas ou vazias.
 */
export const getContractLocatarioNames = (
  data: LocatarioNameSource
): string[] => {
  const seen = new Set<string>();
  const names: string[] = [];

  const addName = (rawName?: string) => {
    if (!rawName) return;
    const trimmed = rawName.trim();
    if (trimmed.length <= 2) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    names.push(trimmed);
  };

  if (data.nomeLocatario) {
    splitNames(data.nomeLocatario).forEach(addName);
  }

  addName(data.primeiroLocatario);
  addName(data.segundoLocatario);
  addName(data.terceiroLocatario);
  addName(data.quartoLocatario);

  return names;
};

interface LocadorNameSource {
  nomesResumidosLocadores?: string;
  nomeProprietario?: string;
}

/**
 * Retorna a lista de proprietários relacionados ao contrato.
 * Remove duplicidades e entradas inválidas.
 */
export const getContractLocadorNames = (data: LocadorNameSource): string[] => {
  const seen = new Set<string>();
  const names: string[] = [];

  const addName = (rawName?: string) => {
    if (!rawName) return;
    const trimmed = rawName.trim();
    if (trimmed.length <= 2) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    names.push(trimmed);
  };

  if (data.nomesResumidosLocadores) {
    splitNames(data.nomesResumidosLocadores).forEach(addName);
  }

  if (names.length === 0 && data.nomeProprietario) {
    splitNames(data.nomeProprietario).forEach(addName);
  } else {
    addName(data.nomeProprietario);
  }

  return names;
};
