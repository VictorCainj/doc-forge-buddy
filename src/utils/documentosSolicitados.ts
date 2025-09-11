// Utilitário para gerar a lista de documentos solicitados na devolutiva locatário

export interface ConfiguracaoDocumentos {
  solicitarCondominio?: string;
  solicitarAgua?: string;
  solicitarEnergia?: string;
  solicitarGas?: string;
  solicitarCND?: string;
}

/**
 * Gera a lista de documentos solicitados baseada na configuração do contrato
 */
export function gerarDocumentosSolicitados(config: ConfiguracaoDocumentos): string {
  const documentos: string[] = [];

  if (config.solicitarCondominio === 'sim') {
    documentos.push('condomínio');
  }

  if (config.solicitarAgua === 'sim') {
    documentos.push('água');
  }

  // Energia elétrica sempre deve ser solicitada
  documentos.push('energia elétrica');

  if (config.solicitarGas === 'sim') {
    documentos.push('gás');
  }

  // Se não há documentos, retorna uma mensagem padrão
  if (documentos.length === 0) {
    return 'conforme estabelecido em contrato';
  }

  // Formata a lista com vírgulas e "e" antes do último item
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
