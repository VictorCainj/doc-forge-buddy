// Exportações de templates de documentos
export * from './analiseVistoria';
export * from './documentos';

// Template collections
export const templateCollections = {
  // Templates de análise de vistoria
  analiseVistoria: {
    template1: 'Template básico de análise',
    template2: 'Template avançado de análise',
    template3: 'Template personalizado'
  },

  // Templates de documentos
  documentos: {
    contratoTemplate: 'Template de contrato',
    termoTemplate: 'Template de termo',
    relatorioTemplate: 'Template de relatório'
  }
};

// Função para obter template por nome
export const getTemplate = async (type: string, name: string) => {
  switch (type) {
    case 'analiseVistoria':
      return templateCollections.analiseVistoria[name] || null;
    case 'documentos':
      return templateCollections.documentos[name] || null;
    default:
      return null;
  }
};