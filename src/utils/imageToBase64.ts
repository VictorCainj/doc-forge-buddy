/**
 * Utilitário para converter imagens de URLs externas para base64
 * Permite copiar documentos com imagens embutidas para e-mails
 */

// Cache de imagens já convertidas para melhorar performance
const imageCache = new Map<string, string>();

/**
 * Converte uma imagem de URL para base64
 */
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  // Verificar cache primeiro
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  try {
    // Tentar usar fetch com CORS
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();

    // Converter blob para base64
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        imageCache.set(url, base64);
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Erro ao converter imagem'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Fallback: tentar carregar via canvas (funciona para imagens no mesmo domínio ou com CORS habilitado)
    try {
      return await convertImageViaCanvas(url);
    } catch {
      // Se tudo falhar, retornar a URL original
      console.warn(`Não foi possível converter imagem: ${url}`, error);
      return url;
    }
  }
};

/**
 * Converte imagem usando canvas (fallback para CORS)
 */
const convertImageViaCanvas = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Tentar converter para base64
        try {
          const base64 = canvas.toDataURL('image/png');
          imageCache.set(url, base64);
          resolve(base64);
        } catch (error) {
          // Se falhar (por exemplo, por CORS), retornar URL original
          console.warn(`CORS bloqueou conversão da imagem: ${url}`);
          resolve(url);
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Erro ao carregar imagem: ${url}`));
    };

    img.src = url;
  });
};

/**
 * Extrai todas as URLs de imagens do HTML
 */
const extractImageUrls = (htmlContent: string): string[] => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    // Ignorar imagens já em base64
    if (!url.startsWith('data:')) {
      urls.push(url);
    }
  }

  return urls;
};

/**
 * Converte todas as imagens de um HTML para base64
 * @param htmlContent - Conteúdo HTML com imagens externas
 * @returns HTML com imagens convertidas para base64
 */
export const convertImagesToBase64 = async (
  htmlContent: string
): Promise<string> => {
  // Extrair todas as URLs de imagens
  const imageUrls = extractImageUrls(htmlContent);

  if (imageUrls.length === 0) {
    // Sem imagens, retornar conteúdo original
    return htmlContent;
  }

  // Converter todas as imagens em paralelo
  const conversions = imageUrls.map(async (url) => {
    try {
      const base64 = await fetchImageAsBase64(url);
      return { url, base64 };
    } catch (error) {
      console.warn(`Não foi possível converter imagem: ${url}`, error);
      return { url, base64: url }; // Mantém URL original em caso de erro
    }
  });

  const results = await Promise.all(conversions);

  // Substituir URLs pelas versões base64
  let processedHtml = htmlContent;
  results.forEach(({ url, base64 }) => {
    const regex = new RegExp(
      `(<img[^>]+src=["'])${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'][^>]*>)`,
      'gi'
    );
    processedHtml = processedHtml.replace(regex, `$1${base64}$2`);
  });

  return processedHtml;
};

/**
 * Limpa o cache de imagens (útil para liberar memória)
 */
export const clearImageCache = (): void => {
  imageCache.clear();
};

/**
 * Retorna o tamanho atual do cache
 */
export const getImageCacheSize = (): number => {
  return imageCache.size;
};
