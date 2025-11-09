/**
 * Utilitário para copiar texto de documentos preservando formatação básica
 * Mantém fonte Arial, negrito e estrutura do texto
 */

import { convertImagesToBase64 } from './imageToBase64';

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
 * Inclui conversão de imagens para base64 para garantir que sejam coladas corretamente
 */
export const copyToClipboard = async (
  htmlContent: string
): Promise<boolean> => {
  try {
    // Converter imagens externas para base64
    let htmlWithBase64Images = htmlContent;
    try {
      htmlWithBase64Images = await convertImagesToBase64(htmlContent);
    } catch (error) {
      console.warn('Aviso: Não foi possível converter todas as imagens', error);
    }

    // Verificar se navigator.clipboard está disponível
    if (navigator.clipboard && navigator.clipboard.write) {
      // Tentar copiar com formatação HTML primeiro
      try {
        const htmlBlob = new Blob([htmlWithBase64Images], {
          type: 'text/html',
        });
        const textContent = await copyDocumentText(htmlContent);
        const textBlob = new Blob([textContent], { type: 'text/plain' });

        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });

        await navigator.clipboard.write([clipboardItem]);
        return true;
      } catch (error) {
        // Se falhar com HTML, tentar apenas texto
        console.warn('Fallback para texto simples:', error);
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
      // Tentar fallback com HTML primeiro (preserva formatação e imagens)
      const htmlSuccess = fallbackCopyHtmlToClipboard(htmlWithBase64Images);
      if (htmlSuccess) {
        return true;
      }

      // Se falhar, tentar apenas texto como último recurso
      const formattedText = await copyDocumentText(htmlContent);
      return fallbackCopyTextToClipboard(formattedText);
    }
  } catch (error) {
    console.error('Erro ao copiar:', error);

    // Tentar fallback em caso de erro
    try {
      // Tentar HTML primeiro
      let htmlWithBase64Images = htmlContent;
      try {
        htmlWithBase64Images = await convertImagesToBase64(htmlContent);
      } catch {
        // Usar HTML original se conversão falhar
      }

      const htmlSuccess = fallbackCopyHtmlToClipboard(htmlWithBase64Images);
      if (htmlSuccess) {
        return true;
      }

      // Se falhar, tentar texto
      const formattedText = await copyDocumentText(htmlContent);
      return fallbackCopyTextToClipboard(formattedText);
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError);
      return false;
    }
  }
};

/**
 * Método fallback para copiar HTML com imagens (quando clipboard.write não está disponível)
 */
const fallbackCopyHtmlToClipboard = (htmlContent: string): boolean => {
  try {
    // Criar um elemento temporário com o HTML
    const container = document.createElement('div');
    container.innerHTML = htmlContent;

    // Configurar estilos para invisibilidade mas permitir seleção
    container.style.position = 'fixed';
    container.style.left = '-999999px';
    container.style.top = '0';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';

    // Adicionar ao DOM
    document.body.appendChild(container);

    // Selecionar o conteúdo
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(container);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Copiar
    const successful = document.execCommand('copy');

    // Limpar
    selection?.removeAllRanges();
    document.body.removeChild(container);

    return successful;
  } catch (error) {
    console.error('Erro no fallback HTML:', error);
    return false;
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
  } catch (error) {
    console.error('Erro no fallback de texto:', error);
    return false;
  }
};
