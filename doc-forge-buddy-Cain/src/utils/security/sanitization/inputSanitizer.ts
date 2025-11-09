/**
 * Módulo de sanitização de inputs
 * Proteção contra XSS e ataques de injeção
 */

// Configuração DOMPurify
const DOMPurify = require('isomorphic-dompurify');

// Configurações de sanitização
const ALLOWED_TAGS_BASIC = ['b', 'i', 'em', 'strong', 'a'];
const ALLOWED_ATTR_BASIC = ['href'];
const ALLOWED_TAGS_RICH = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALLOWED_ATTR_RICH = ['href', 'target'];
const FORBIDDEN_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
const FORBIDDEN_ATTR = ['onclick', 'onload', 'onerror', 'style', 'onmouseover', 'onfocus', 'onblur'];

/**
 * Sanitização básica de strings
 * Remove HTML perigoso e escapa caracteres especiais
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Sanitização DOMPurify
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ALLOWED_TAGS_BASIC,
    ALLOWED_ATTR: ALLOWED_ATTR_BASIC,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: FORBIDDEN_ATTR
  });

  // Escapar caracteres especiais
  return escapeHtml(clean);
}

/**
 * Sanitização de rich text (HTML completo)
 * Permite mais tags para conteúdo rico
 */
export function sanitizeRichText(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_TAGS_RICH,
    ALLOWED_ATTR: ALLOWED_ATTR_RICH,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: FORBIDDEN_ATTR,
    KEEP_CONTENT: true
  });
}

/**
 * Sanitização de URLs
 * Valida e limpa URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Validar se é URL
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  
  if (!urlPattern.test(url)) {
    return '';
  }

  // Sanitizar e garantir que tenha protocolo
  let cleanUrl = sanitizeInput(url);
  
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  return cleanUrl;
}

/**
 * Sanitização de números
 * Garante que seja um número válido
 */
export function sanitizeNumber(input: any): number {
  if (input === null || input === undefined) {
    return 0;
  }

  const num = parseFloat(String(input).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Sanitização de booleanos
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') {
    return input;
  }
  
  if (typeof input === 'string') {
    return input.toLowerCase() === 'true' || input === '1';
  }
  
  if (typeof input === 'number') {
    return input !== 0;
  }
  
  return false;
}

/**
 * Sanitização recursiva de objetos
 * Aplica sanitização a todos os valores do objeto
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }

  if (typeof obj === 'number') {
    return obj;
  }

  if (typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Não sanitizar campos sensíveis
      if (isSensitiveField(key)) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    
    return sanitized;
  }

  return obj;
}

/**
 * Verifica se um campo é sensível (não deve ser sanitizado)
 */
function isSensitiveField(fieldName: string): boolean {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'authToken',
    'refreshToken',
    'accessToken'
  ];
  
  return sensitiveFields.includes(fieldName.toLowerCase());
}

/**
 * Escapa caracteres HTML especiais
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=\/]/g, (m) => map[m]);
}

/**
 * Remove caracteres peligrosos de strings
 */
export function removeDangerousChars(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remover < e >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .replace(/data:/gi, '') // Remover data URIs
    .replace(/vbscript:/gi, ''); // Remover vbscript:
}

/**
 * Sanitização de arquivos (nomes)
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remover caracteres perigosos
  return filename
    .replace(/[^\w\-\.]/g, '_') // Manter apenas alfanuméricos, hífens e pontos
    .replace(/\.+/g, '.') // Evitar múltiplos pontos
    .replace(/^_+/, '') // Remover underscores no início
    .replace(/_+$/, '') // Remover underscores no final
    .substring(0, 255); // Limitar tamanho
}
