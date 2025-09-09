// Utilitário para aplicar concordância de gênero e número nos documentos

export interface GenderConcordance {
  article: string;          // o/a/os/as
  pronoun: string;         // ele/ela/eles/elas
  possessive: string;      // seu/sua/seus/suas
  adjective: string;       // locador/locadora/locadores/locadoras
  verb: string;           // é/são
  preposition: string;    // do/da/dos/das
}

export const getGenderConcordance = (gender: string, role: 'locador' | 'locatario'): GenderConcordance => {
  const baseRole = role === 'locador' ? 'locador' : 'locatário';
  
  switch (gender) {
    case 'masculino':
      return {
        article: 'o',
        pronoun: 'ele',
        possessive: 'seu',
        adjective: baseRole,
        verb: 'é',
        preposition: 'do'
      };
    
    case 'feminino':
      return {
        article: 'a',
        pronoun: 'ela',
        possessive: 'sua',
        adjective: role === 'locador' ? 'locadora' : 'locatária',
        verb: 'é',
        preposition: 'da'
      };
    
    case 'masculinos':
      return {
        article: 'os',
        pronoun: 'eles',
        possessive: 'seus',
        adjective: role === 'locador' ? 'locadores' : 'locatários',
        verb: 'são',
        preposition: 'dos'
      };
    
    case 'femininos':
      return {
        article: 'as',
        pronoun: 'elas',
        possessive: 'suas',
        adjective: role === 'locador' ? 'locadoras' : 'locatárias',
        verb: 'são',
        preposition: 'das'
      };
    
    default:
      // Fallback para masculino singular
      return {
        article: 'o',
        pronoun: 'ele',
        possessive: 'seu',
        adjective: baseRole,
        verb: 'é',
        preposition: 'do'
      };
  }
};

// Função para aplicar concordância em templates de texto
export const applyConcordance = (
  text: string, 
  locadorGender: string, 
  locatarioGender: string
): string => {
  const locadorConcordance = getGenderConcordance(locadorGender, 'locador');
  const locatarioConcordance = getGenderConcordance(locatarioGender, 'locatario');
  
  let processedText = text;
  
  // Substituições para LOCADOR
  processedText = processedText.replace(/\[ARTIGO_LOCADOR\]/g, locadorConcordance.article);
  processedText = processedText.replace(/\[PRONOME_LOCADOR\]/g, locadorConcordance.pronoun);
  processedText = processedText.replace(/\[POSSESSIVO_LOCADOR\]/g, locadorConcordance.possessive);
  processedText = processedText.replace(/\[ADJETIVO_LOCADOR\]/g, locadorConcordance.adjective);
  processedText = processedText.replace(/\[VERBO_LOCADOR\]/g, locadorConcordance.verb);
  processedText = processedText.replace(/\[PREPOSICAO_LOCADOR\]/g, locadorConcordance.preposition);
  
  // Substituições para LOCATÁRIO
  processedText = processedText.replace(/\[ARTIGO_LOCATARIO\]/g, locatarioConcordance.article);
  processedText = processedText.replace(/\[PRONOME_LOCATARIO\]/g, locatarioConcordance.pronoun);
  processedText = processedText.replace(/\[POSSESSIVO_LOCATARIO\]/g, locatarioConcordance.possessive);
  processedText = processedText.replace(/\[ADJETIVO_LOCATARIO\]/g, locatarioConcordance.adjective);
  processedText = processedText.replace(/\[VERBO_LOCATARIO\]/g, locatarioConcordance.verb);
  processedText = processedText.replace(/\[PREPOSICAO_LOCATARIO\]/g, locatarioConcordance.preposition);
  
  return processedText;
};