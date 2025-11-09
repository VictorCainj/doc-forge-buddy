import { log } from './logger';

/**
 * Lazy import do docx para melhor performance
 * A biblioteca é carregada apenas quando necessário
 */
let docxModule: typeof import('docx') | null = null;

async function getDocxModule() {
  if (!docxModule) {
    const startTime = performance.now();
    docxModule = await import('docx');
    const loadTime = performance.now() - startTime;
    console.log(`📝 DOCX carregado em ${loadTime.toFixed(0)}ms`);
  }
  return docxModule;
}

export interface DocxData {
  title: string;
  date: string;
  content: string;
  signatures: {
    name1: string;
    name2: string;
  };
}

export const generateDocx = async (data: DocxData): Promise<Blob> => {
  // Carregar docx apenas quando necessário
  const docx = await getDocxModule();
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  // Converter HTML para texto simples
  const cleanContent = data.content
    .replace(/<[^>]*>/g, '') // Remove todas as tags HTML
    .replace(/&nbsp;/g, ' ') // Substitui &nbsp; por espaços
    .replace(/&amp;/g, '&') // Substitui &amp; por &
    .replace(/&lt;/g, '<') // Substitui &lt; por <
    .replace(/&gt;/g, '>') // Substitui &gt; por >
    .replace(/&quot;/g, '"') // Substitui &quot; por "
    .replace(/&#39;/g, "'") // Substitui &#39; por '
    .trim();

  // Dividir o conteúdo em parágrafos
  const paragraphs = cleanContent.split('\n').filter(p => p.trim() !== '');

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Título
        new Paragraph({
          text: data.title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
        }),

        // Data
        new Paragraph({
          text: data.date,
          alignment: AlignmentType.RIGHT,
          spacing: {
            after: 400,
          },
        }),

        // Conteúdo
        ...paragraphs.map(paragraph => 
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
                size: 24, // 12pt
              }),
            ],
            spacing: {
              after: 200,
            },
          })
        ),

        // Espaçamento para assinaturas
        new Paragraph({
          text: '',
          spacing: {
            after: 600,
          },
        }),

        // Assinaturas
        new Paragraph({
          children: [
            new TextRun({
              text: '__________________________________________',
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.signatures.name1,
              size: 20,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '__________________________________________',
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.signatures.name2,
              size: 20,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  // Usar toBlob em vez de toBuffer para compatibilidade com navegador
  const blob = await Packer.toBlob(doc);
  return blob;
};

export const downloadDocx = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
