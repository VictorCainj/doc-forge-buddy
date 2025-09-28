/**
 * Utilitário para copiar texto de documentos preservando formatação básica
 * Mantém fonte Arial, negrito e estrutura do texto
 */

export const copyDocumentText = async (
  htmlContent: string
): Promise<string> => {
  // Criar um elemento temporário para processar o HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Função para processar elementos e preservar formatação
  const processElement = (element: Element): string => {
    let result = '';

    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        // Texto simples - adicionar diretamente
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        // Preservar quebras de linha para elementos de bloco
        if (['div', 'p', 'br'].includes(tagName)) {
          if (tagName === 'br') {
            result += '\n';
          } else {
            const content = processElement(el);
            result += content + '\n';
          }
        }
        // Preservar negrito (sem tags Markdown)
        else if (['strong', 'b'].includes(tagName)) {
          const content = processElement(el);
          result += content; // Copiar apenas o texto, sem formatação
        }
        // Preservar itálico (sem tags Markdown)
        else if (['em', 'i'].includes(tagName)) {
          const content = processElement(el);
          result += content; // Copiar apenas o texto, sem formatação
        }
        // Processar outros elementos recursivamente
        else {
          result += processElement(el);
        }
      }
    }

    return result;
  };

  // Processar o conteúdo
  let processedText = processElement(tempDiv);

  // Limpar e normalizar o texto
  processedText = processedText
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Máximo 2 quebras de linha consecutivas
    .replace(/[ \t]+/g, ' ') // Normalizar espaços
    .replace(/\n[ \t]+/g, '\n') // Remover espaços no início das linhas
    .replace(/[ \t]+\n/g, '\n') // Remover espaços no final das linhas
    .trim();

  return processedText;
};

/**
 * Copia o texto formatado para a área de transferência
 */
export const copyToClipboard = async (
  htmlContent: string
): Promise<boolean> => {
  try {
    // Verificar se navigator.clipboard está disponível
    if (navigator.clipboard && navigator.clipboard.write) {
      // Tentar copiar com formatação HTML primeiro
      try {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({
          'text/html': blob,
          'text/plain': new Blob([await copyDocumentText(htmlContent)], {
            type: 'text/plain',
          }),
        });

        await navigator.clipboard.write([clipboardItem]);
        return true;
      } catch {
        // Se falhar com HTML, tentar apenas texto
        // console.log('Falha ao copiar HTML, tentando texto simples');
        const formattedText = await copyDocumentText(htmlContent);
        await navigator.clipboard.writeText(formattedText);
        return true;
      }
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      // Fallback para writeText apenas
      const formattedText = await copyDocumentText(htmlContent);
      await navigator.clipboard.writeText(formattedText);
      return true;
    } else {
      // Fallback para navegadores mais antigos
      const formattedText = await copyDocumentText(htmlContent);
      return fallbackCopyTextToClipboard(formattedText);
    }
  } catch {
    // Tentar fallback em caso de erro
    try {
      const formattedText = await copyDocumentText(htmlContent);
      return fallbackCopyTextToClipboard(formattedText);
    } catch {
      return false;
    }
  }
};

/**
 * Método fallback para copiar texto em navegadores mais antigos
 */
const fallbackCopyTextToClipboard = (text: string): boolean => {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Evitar rolagem para o elemento
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch {
    return false;
  }
};
