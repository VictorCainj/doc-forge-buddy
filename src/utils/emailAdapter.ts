import { urlToBase64HD } from './imageHD';
import { log } from './logger';

/**
 * Utilitário para adaptar HTML para formato de e-mail
 * Converte estilos inline e garante compatibilidade com clientes de e-mail
 */
export const adaptHTMLForEmail = async (html: string): Promise<string> => {
  // Processar HTML para converter imagens e garantir compatibilidade
  let processedHTML = await processHTMLForEmail(html);

  // Criar wrapper completo de e-mail com estilos inline
  const emailWrapper = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
    img {display: block !important; max-width: 100% !important; height: auto !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          <tr>
            <td style="padding: 20px;">
              ${processedHTML}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return emailWrapper;
};

/**
 * Processa HTML para e-mail: converte imagens para base64 e garante estilos inline
 */
async function processHTMLForEmail(html: string): Promise<string> {
  // Criar um elemento temporário para processar o HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Processar todas as imagens
  const images = Array.from(tempDiv.querySelectorAll('img'));
  
  if (images.length === 0) {
    return tempDiv.innerHTML;
  }

  log.debug(`Processando ${images.length} imagens para e-mail`);

  // Processar todas as imagens em paralelo
  const imagePromises = images.map((img, index) => {
    log.debug(`Processando imagem ${index + 1}/${images.length}`);
    return processImageForEmail(img);
  });

  // Aguardar todas as conversões
  await Promise.all(imagePromises);

  log.debug('Todas as imagens processadas com sucesso');

  // Garantir que estilos sejam inline para compatibilidade com e-mail
  const styledElements = tempDiv.querySelectorAll('[style]');
  styledElements.forEach((el) => {
    // Já tem estilo inline, manter
    const htmlEl = el as HTMLElement;
    if (htmlEl.style) {
      // Garantir display block para imagens
      if (htmlEl.tagName === 'IMG') {
        htmlEl.style.display = 'block';
        htmlEl.style.maxWidth = '100%';
        htmlEl.style.height = 'auto';
      }
    }
  });

  return tempDiv.innerHTML;
}

/**
 * Processa uma imagem individual para e-mail
 */
async function processImageForEmail(img: HTMLImageElement): Promise<void> {
  const src = img.getAttribute('src');

  if (!src) {
    return;
  }

  // Se já é base64, manter
  if (src.startsWith('data:image/')) {
    // Garantir que o estilo está correto
    img.style.display = 'block';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.border = 'none';
    img.style.outline = 'none';
    img.style.textDecoration = 'none';
    return;
  }

  // Se é uma URL externa, tentar converter para base64
  if (src.startsWith('http://') || src.startsWith('https://')) {
    try {
      log.debug('Convertendo imagem URL para base64:', src);
      
      // Tentar converter URL para base64
      const base64 = await urlToBase64HD(src, {
        maxWidth: 1200, // Reduzir para e-mail (menor que PDF)
        maxHeight: 800,
        quality: 0.85, // Compressão ligeiramente maior para e-mail
        format: 'jpeg',
      });

      // Atualizar src com base64
      img.setAttribute('src', base64);
      
      // Garantir estilos inline
      img.style.display = 'block';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.border = 'none';
      img.style.outline = 'none';
      img.style.textDecoration = 'none';
      
      log.debug('Imagem convertida com sucesso para e-mail');
    } catch (error) {
      log.warn('Erro ao converter imagem para base64, mantendo URL:', error);
      // Manter URL original se falhar
      // Garantir estilos mesmo assim
      img.style.display = 'block';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    }
  }
}

/**
 * Converte imagens em URLs para formato base64 inline para e-mail
 * Importante: URLs externas podem não funcionar em todos os clientes de e-mail
 */
export const convertImagesToInlineForEmail = async (
  html: string
): Promise<string> => {
  // Já processado pela função principal
  return html;
};

