/**
 * Validadores de segurança para sanitização e validação de dados
 */

import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML removendo scripts e elementos perigosos
 */
export const validateHTML = (html: string): string => {
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'b',
        'i',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'div',
        'span',
        'img',
        'a',
        'table',
        'tr',
        'td',
        'th',
        'thead',
        'tbody',
      ],
      ALLOWED_ATTR: [
        'class',
        'style',
        'src',
        'alt',
        'href',
        'target',
        'rel',
        'title',
        'width',
        'height',
        'colspan',
        'rowspan',
        'align',
        'valign',
      ],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: [
        'script',
        'object',
        'embed',
        'iframe',
        'form',
        'input',
        'button',
      ],
      FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onfocus',
        'onblur',
      ],
    });
  } catch (error) {
    console.error('Erro ao sanitizar HTML:', error);
    return '';
  }
};

/**
 * Sanitiza input do usuário removendo caracteres perigosos
 */
export const sanitizeUserInput = (input: string): string => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .slice(0, 10000); // Limita tamanho
};

/**
 * Valida upload de arquivo
 */
export const validateFileUpload = (
  file: File
): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 10MB.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não permitido.' };
  }

  // Verificar extensão do arquivo
  const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.pdf',
    '.doc',
    '.docx',
  ];
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'));

  if (!allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'Extensão de arquivo não permitida.' };
  }

  return { valid: true };
};

/**
 * Valida token CSRF básico
 */
export const checkCSRFToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;

  // Verificar formato básico (pode ser expandido conforme necessário)
  return token.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(token);
};

/**
 * Valida URL segura
 */
export const validateSecureURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);

    // Permitir apenas HTTPS em produção
    if (import.meta.env.PROD && urlObj.protocol !== 'https:') {
      return false;
    }

    // Bloquear URLs perigosas
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (
      dangerousProtocols.some((protocol) =>
        url.toLowerCase().startsWith(protocol)
      )
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Valida entrada SQL (prevenção básica de injection)
 */
export const validateSQLInput = (input: string): boolean => {
  if (typeof input !== 'string') return false;

  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/i,
    /(;|--|\/\*|\*\/)/,
    /(\b(script|javascript|vbscript|onload|onerror)\b)/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(input));
};

/**
 * Sanitiza nome de arquivo para upload
 */
export const sanitizeFileName = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por _
    .replace(/_{2,}/g, '_') // Remove múltiplos _ consecutivos
    .replace(/^_|_$/g, '') // Remove _ do início e fim
    .slice(0, 100); // Limita tamanho
};

/**
 * Valida conteúdo de imagem para prevenir ataques
 */
export const validateImageContent = async (
  file: File
): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve({ valid: false, error: 'Erro ao validar imagem' });
      return;
    }

    img.onload = () => {
      try {
        // Verificar dimensões
        if (img.width > 4000 || img.height > 4000) {
          resolve({
            valid: false,
            error: 'Imagem muito grande. Máximo 4000x4000 pixels.',
          });
          return;
        }

        // Redesenhar a imagem para limpar qualquer código malicioso
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        resolve({ valid: true });
      } catch {
        resolve({ valid: false, error: 'Erro ao processar imagem' });
      }
    };

    img.onerror = () => {
      resolve({ valid: false, error: 'Arquivo não é uma imagem válida' });
    };

    img.src = URL.createObjectURL(file);
  });
};
