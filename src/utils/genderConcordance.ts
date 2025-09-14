// Utilitário para aplicar concordância de gênero e número aos documentos

export interface GenderConfig {
  generoLocador: 'masculino' | 'feminino' | 'masculinos' | 'femininos';
  generoLocatario: 'masculino' | 'feminino' | 'masculinos' | 'femininos';
}

export const applyGenderConcordance = (text: string, config: GenderConfig): string => {
  let result = text;

  // Termos para locador
  const locadorTerms = getLocadorTerms(config.generoLocador);
  result = result.replace(/\{\{locador\}\}/gi, locadorTerms.termo);
  result = result.replace(/\{\{locadorArtigo\}\}/gi, locadorTerms.artigo);
  result = result.replace(/\{\{locadorProprietario\}\}/gi, locadorTerms.proprietario);
  result = result.replace(/\{\{locadorContratado\}\}/gi, locadorTerms.contratado);

  // Termos para locatário
  const locatarioTerms = getLocatarioTerms(config.generoLocatario);
  result = result.replace(/\{\{locatario\}\}/gi, locatarioTerms.termo);
  result = result.replace(/\{\{locatarioArtigo\}\}/gi, locatarioTerms.artigo);
  result = result.replace(/\{\{locatarioContratante\}\}/gi, locatarioTerms.contratante);
  result = result.replace(/\{\{locatarioInquilino\}\}/gi, locatarioTerms.locatario);

  // Pronomes e preposições
  result = result.replace(/\{\{aoLocatario\}\}/gi, getPreposition(config.generoLocatario));
  result = result.replace(/\{\{doLocador\}\}/gi, getPrepositionPossessive(config.generoLocador));

  return result;
};

const getLocadorTerms = (genero: GenderConfig['generoLocador']) => {
  switch (genero) {
    case 'masculino':
      return {
        termo: 'LOCADOR',
        artigo: 'o',
        proprietario: 'proprietário',
        contratado: 'contratado'
      };
    case 'feminino':
      return {
        termo: 'LOCADORA',
        artigo: 'a',
        proprietario: 'proprietária',
        contratado: 'contratada'
      };
    case 'masculinos':
      return {
        termo: 'LOCADORES',
        artigo: 'os',
        proprietario: 'proprietários',
        contratado: 'contratados'
      };
    case 'femininos':
      return {
        termo: 'LOCADORAS',
        artigo: 'as',
        proprietario: 'proprietárias',
        contratado: 'contratadas'
      };
    default:
      return {
        termo: 'LOCADOR(A)',
        artigo: 'o(a)',
        proprietario: 'proprietário(a)',
        contratado: 'contratado(a)'
      };
  }
};

const getLocatarioTerms = (genero: GenderConfig['generoLocatario']) => {
  switch (genero) {
    case 'masculino':
      return {
        termo: 'LOCATÁRIO',
        artigo: 'o',
        contratante: 'contratante',
        locatario: 'locatário'
      };
    case 'feminino':
      return {
        termo: 'LOCATÁRIA',
        artigo: 'a',
        contratante: 'contratante',
        locatario: 'locatária'
      };
    case 'masculinos':
      return {
        termo: 'LOCATÁRIOS',
        artigo: 'os',
        contratante: 'contratantes',
        locatario: 'locatários'
      };
    case 'femininos':
      return {
        termo: 'LOCATÁRIAS',
        artigo: 'as',
        contratante: 'contratantes',
        locatario: 'locatárias'
      };
    default:
      return {
        termo: 'LOCATÁRIO(A)',
        artigo: 'o(a)',
        contratante: 'contratante',
        locatario: 'locatário(a)'
      };
  }
};

const getPreposition = (genero: GenderConfig['generoLocatario']) => {
  switch (genero) {
    case 'masculino':
      return 'ao';
    case 'feminino':
      return 'à';
    case 'masculinos':
      return 'aos';
    case 'femininos':
      return 'às';
    default:
      return 'ao(à)';
  }
};

const getPrepositionPossessive = (genero: GenderConfig['generoLocador']) => {
  switch (genero) {
    case 'masculino':
      return 'do';
    case 'feminino':
      return 'da';
    case 'masculinos':
      return 'dos';
    case 'femininos':
      return 'das';
    default:
      return 'do(a)';
  }
};

// Função para converter as opções antigas para o novo formato
export const convertGenderToNew = (oldGenero: string): GenderConfig['generoLocador'] | GenderConfig['generoLocatario'] => {
  switch (oldGenero) {
    case 'masculino':
      return 'masculino';
    case 'feminino':
      return 'feminino';
    case 'neutro':
      return 'masculinos'; // Assumindo plural masculino para neutro
    default:
      return 'masculino';
  }
};