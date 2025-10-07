// Utilitário para gerar a lista de documentos solicitados na devolutiva locatário

export interface ConfiguracaoDocumentos {
  solicitarCondominio?: string;
  solicitarAgua?: string;
  solicitarEnergia?: string;
  solicitarGas?: string;
  solicitarCND?: string;
  // Nomes específicos das concessionárias
  tipoAgua?: string;  // Ex: 'DAEV', 'SABESP', etc.
  tipoEnergia?: string;  // Ex: 'CPFL', 'ENEL', etc.
}

/**
 * Gera a lista de documentos solicitados baseada na configuração do contrato
 * Sempre especifica os documentos cadastrados com nomes das concessionárias quando disponíveis
 */
export function gerarDocumentosSolicitados(config: ConfiguracaoDocumentos): string {
  const documentos: string[] = [];

  // Adiciona os documentos na ordem: condomínio, água, energia, gás
  if (config.solicitarCondominio === 'sim') {
    documentos.push('condomínio');
  }

  if (config.solicitarAgua === 'sim') {
    documentos.push('água');
  }

  if (config.solicitarEnergia === 'sim') {
    documentos.push('energia elétrica');
  }

  if (config.solicitarGas === 'sim') {
    documentos.push('gás');
  }

  // CND não é incluída aqui pois tem tratamento separado no template

  // Formata a lista com vírgulas e "e" antes do último item
  if (documentos.length === 0) {
    // Se nenhum documento foi configurado, retorna apenas energia elétrica como padrão
    return 'energia elétrica';
  }

  if (documentos.length === 1) {
    return documentos[0];
  }

  if (documentos.length === 2) {
    return `${documentos[0]} e ${documentos[1]}`;
  }

  // Para 3 ou mais itens: "item1, item2, item3 e item4"
  const ultimoItem = documentos[documentos.length - 1];
  const itensIniciais = documentos.slice(0, -1).join(', ');
  
  return `${itensIniciais} e ${ultimoItem}`;
}
