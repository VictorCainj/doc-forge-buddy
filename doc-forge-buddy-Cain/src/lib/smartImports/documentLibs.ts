// Smart imports para bibliotecas de documentos
export const documentLibs = {
  // Carregamento assíncrono de bibliotecas pesadas
  loadDocx: async () => {
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    return { Document, Packer, Paragraph, TextRun };
  },

  loadExcel: async () => {
    const ExcelJS = await import('exceljs');
    return ExcelJS;
  },

  loadMarkdown: async () => {
    const ReactMarkdown = await import('react-markdown');
    const remarkGfm = await import('remark-gfm');
    const rehypeRaw = await import('rehype-raw');
    const rehypeSanitize = await import('rehype-sanitize');
    
    return {
      ReactMarkdown,
      remarkGfm,
      rehypeRaw,
      rehypeSanitize,
    };
  },

  loadDocumentTemplates: async () => {
    // Importar templates de documentos
    const templates = await import('@/templates');
    return templates;
  },

  // Cache das bibliotecas carregadas
  cache: new Map<string, any>(),

  // Função principal de carregamento
  default: async function() {
    // Carregar apenas quando necessário
    const libs = {
      docx: null,
      excel: null,
      markdown: null,
      templates: null,
    };

    // Carregar bibliotecas de forma paralela mas controlada
    const loadPromises = [
      // Docx - usado para geração de contratos
      import('docx')
        .then((module) => {
          libs.docx = {
            Document: module.Document,
            Packer: module.Packer,
            Paragraph: module.Paragraph,
            TextRun: module.TextRun,
          };
        })
        .catch(() => console.warn('docx library failed to load')),

      // ExcelJS - usado para relatórios
      import('exceljs')
        .then((module) => {
          libs.excel = module.default || module;
        })
        .catch(() => console.warn('exceljs library failed to load')),

      // React Markdown - usado para formatação
      import('react-markdown')
        .then(async (reactMarkdown) => {
          const remarkGfm = await import('remark-gfm');
          const rehypeRaw = await import('rehype-raw');
          const rehypeSanitize = await import('rehype-sanitize');
          
          libs.markdown = {
            ReactMarkdown: reactMarkdown.default,
            remarkGfm: remarkGfm.default,
            rehypeRaw: rehypeRaw.default,
            rehypeSanitize: rehypeSanitize.default,
          };
        })
        .catch(() => console.warn('react-markdown library failed to load')),

      // Templates
      import('@/templates')
        .then((templates) => {
          libs.templates = templates;
        })
        .catch(() => console.warn('templates failed to load')),
    ];

    await Promise.allSettled(loadPromises);
    
    return libs;
  }
};