/**
 * Remove uma imagem específica do HTML do documento
 * @param htmlContent - Conteúdo HTML do documento
 * @param imageSrc - URL ou src da imagem a ser removida
 * @returns HTML atualizado sem a imagem
 */
export function removeImageFromHTML(
  htmlContent: string,
  imageSrc: string
): string {
  if (!htmlContent || !imageSrc) {
    return htmlContent;
  }

  // Escapar caracteres especiais para regex
  const escapedSrc = imageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Padrões para encontrar a tag img completa
  const patterns = [
    // Tag img simples: <img src="..." alt="..." />
    new RegExp(`<img[^>]*src=["']${escapedSrc}["'][^>]*/?>`, 'gi'),
    // Tag img com fechamento: <img src="...">...</img>
    new RegExp(`<img[^>]*src=["']${escapedSrc}["'][^>]*>.*?</img>`, 'gi'),
    // Tag img dentro de div ou outros containers
    new RegExp(
      `<div[^>]*>\\s*<img[^>]*src=["']${escapedSrc}["'][^>]*/?>\\s*</div>`,
      'gi'
    ),
  ];

  let updatedHTML = htmlContent;

  // Aplicar cada padrão
  patterns.forEach((pattern) => {
    updatedHTML = updatedHTML.replace(pattern, '');
  });

  // Limpar divs vazios que podem ter ficado
  updatedHTML = updatedHTML.replace(/<div[^>]*>\s*<\/div>/gi, '');

  // Limpar quebras de linha excessivas
  updatedHTML = updatedHTML.replace(/\n\s*\n\s*\n/g, '\n\n');

  return updatedHTML;
}

/**
 * Remove múltiplas imagens do HTML do documento
 * @param htmlContent - Conteúdo HTML do documento
 * @param imageSrcs - Array de URLs ou srcs das imagens a serem removidas
 * @returns HTML atualizado sem as imagens
 */
export function removeMultipleImagesFromHTML(
  htmlContent: string,
  imageSrcs: string[]
): string {
  if (!htmlContent || !imageSrcs || imageSrcs.length === 0) {
    return htmlContent;
  }

  let updatedHTML = htmlContent;

  imageSrcs.forEach((src) => {
    updatedHTML = removeImageFromHTML(updatedHTML, src);
  });

  return updatedHTML;
}

/**
 * Verifica se uma imagem existe no HTML
 * @param htmlContent - Conteúdo HTML do documento
 * @param imageSrc - URL ou src da imagem
 * @returns true se a imagem existe no HTML
 */
export function imageExistsInHTML(
  htmlContent: string,
  imageSrc: string
): boolean {
  if (!htmlContent || !imageSrc) {
    return false;
  }

  const escapedSrc = imageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`src=["']${escapedSrc}["']`, 'gi');

  return pattern.test(htmlContent);
}

/**
 * Obtém todas as URLs de imagens do HTML
 * @param htmlContent - Conteúdo HTML do documento
 * @returns Array de URLs das imagens encontradas
 */
export function getAllImageUrls(htmlContent: string): string[] {
  if (!htmlContent) {
    return [];
  }

  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}
