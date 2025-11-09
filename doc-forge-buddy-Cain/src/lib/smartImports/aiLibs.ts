// Smart imports para bibliotecas de IA
export const aiLibs = {
  // Carregamento assíncrono de bibliotecas de IA
  loadOpenAI: async () => {
    const OpenAI = await import('openai');
    return OpenAI;
  },

  loadTextProcessing: async () => {
    const { 
      textAnalysis,
      contentGeneration,
      smartSuggestions,
    } = await import('@/lib/ai/textProcessing');
    return {
      textAnalysis,
      contentGeneration,
      smartSuggestions,
    };
  },

  loadDocumentAI: async () => {
    const {
      documentAnalyzer,
      contractAnalyzer,
      termExtractor,
    } = await import('@/lib/ai/documentAI');
    return {
      documentAnalyzer,
      contractAnalyzer,
      termExtractor,
    };
  },

  loadSmartFeatures: async () => {
    const {
      smartSearch,
      autoComplete,
      intelligentRouting,
    } = await import('@/lib/ai/smartFeatures');
    return {
      smartSearch,
      autoComplete,
      intelligentRouting,
    };
  },

  // Função principal de carregamento
  default: async function() {
    const aiLibs = {
      openai: null,
      textProcessing: null,
      documentAI: null,
      smartFeatures: null,
    };

    // Carregar bibliotecas de IA de forma controlada
    const loadPromises = [
      // OpenAI - geração de texto e análise
      import('openai')
        .then((module) => {
          aiLibs.openai = module.default || module;
        })
        .catch(() => console.warn('openai library failed to load')),

      // Processamento de texto
      import('@/lib/ai/textProcessing')
        .then((module) => {
          aiLibs.textProcessing = {
            textAnalysis: module.textAnalysis,
            contentGeneration: module.contentGeneration,
            smartSuggestions: module.smartSuggestions,
          };
        })
        .catch(() => console.warn('textProcessing module failed to load')),

      // IA para documentos
      import('@/lib/ai/documentAI')
        .then((module) => {
          aiLibs.documentAI = {
            documentAnalyzer: module.documentAnalyzer,
            contractAnalyzer: module.contractAnalyzer,
            termExtractor: module.termExtractor,
          };
        })
        .catch(() => console.warn('documentAI module failed to load')),

      // Funcionalidades inteligentes
      import('@/lib/ai/smartFeatures')
        .then((module) => {
          aiLibs.smartFeatures = {
            smartSearch: module.smartSearch,
            autoComplete: module.autoComplete,
            intelligentRouting: module.intelligentRouting,
          };
        })
        .catch(() => console.warn('smartFeatures module failed to load')),
    ];

    await Promise.allSettled(loadPromises);
    
    return aiLibs;
  }
};