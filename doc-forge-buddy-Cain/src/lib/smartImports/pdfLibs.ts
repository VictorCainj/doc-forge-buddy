// Smart imports para bibliotecas PDF
export const pdfLibs = {
  // Carregamento assíncrono de bibliotecas PDF
  loadHtml2Pdf: async () => {
    const html2pdf = await import('html2pdf.js');
    return html2pdf.default;
  },

  loadHtml2Canvas: async () => {
    const html2canvas = await import('html2canvas');
    return html2canvas.default;
  },

  loadJsPdf: async () => {
    const jsPDF = await import('jspdf');
    return jsPDF.default;
  },

  loadPdfProcessor: async () => {
    // Bibliotecas de processamento de PDF
    const pdfjsLib = await import('pdfjs-dist');
    const pdfMake = await import('pdfmake/build/pdfmake');
    const vfsFonts = await import('pdfmake/build/vfs_fonts');
    
    return {
      pdfjsLib: pdfjsLib.default || pdfjsLib,
      pdfMake: pdfMake.default,
      vfsFonts: vfsFonts.default,
    };
  },

  // Função principal de carregamento
  default: async function() {
    const pdfLibs = {
      html2pdf: null,
      html2canvas: null,
      jspdf: null,
      pdfProcessor: null,
    };

    // Carregar bibliotecas PDF de forma otimizada
    const loadPromises = [
      // html2pdf - conversão HTML para PDF
      import('html2pdf.js')
        .then((module) => {
          pdfLibs.html2pdf = module.default;
        })
        .catch(() => console.warn('html2pdf.js library failed to load')),

      // html2canvas - captura de tela para PDF
      import('html2canvas')
        .then((module) => {
          pdfLibs.html2canvas = module.default;
        })
        .catch(() => console.warn('html2canvas library failed to load')),

      // jsPDF - geração de PDF nativa
      import('jspdf')
        .then((module) => {
          pdfLibs.jspdf = module.default;
        })
        .catch(() => console.warn('jspdf library failed to load')),

      // Processadores PDF avançados
      Promise.all([
        import('pdfjs-dist'),
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
      ])
        .then(([pdfjsLib, pdfMake, vfsFonts]) => {
          pdfLibs.pdfProcessor = {
            pdfjsLib: pdfjsLib.default || pdfjsLib,
            pdfMake: pdfMake.default,
            vfsFonts: vfsFonts.default,
          };
        })
        .catch(() => console.warn('PDF processor libraries failed to load')),
    ];

    await Promise.allSettled(loadPromises);
    
    return pdfLibs;
  }
};