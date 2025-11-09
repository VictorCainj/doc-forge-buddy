/**
 * Content Security Policy (CSP) Configuration
 * Implementa proteção robusta contra XSS e outros ataques
 */

// Temporarily commented to avoid Node.js crypto dependency
// import crypto from 'crypto';

// Configurações CSP
export interface CSPConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  frameSrc: string[];
  objectSrc: string[];
  baseUri: string;
  formAction: string;
  upgradeInsecureRequests: boolean;
  reportUri?: string;
  nonce?: string;
}

// Gerar nonce para scripts inline (temporariamente desativado)
export const generateNonce = (): string => {
  // Temporarily disabled to avoid Buffer dependency
  return 'random-nonce-value';
  // return Buffer.from(crypto.randomBytes(16)).toString('base64');
};

// Configuração CSP para desenvolvimento
export const getDevCSPConfig = (nonce?: string): CSPConfig => ({
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...(nonce ? [`'nonce-${nonce}'`] : [])],
  styleSrc: ["'self'", "'unsafe-inline'", ...(nonce ? [`'nonce-${nonce}'`] : [])],
  imgSrc: ["'self'", "data:", "https:"],
  fontSrc: ["'self'", "https:"],
  connectSrc: [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://localhost:*",
    "ws://localhost:*"
  ],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: "'self'",
  formAction: "'self'",
  upgradeInsecureRequests: false
});

// Configuração CSP para produção
export const getProdCSPConfig = (nonce?: string): CSPConfig => ({
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", ...(nonce ? [`'nonce-${nonce}'`] : [])],
  styleSrc: ["'self'", ...(nonce ? [`'nonce-${nonce}'`] : [])],
  imgSrc: ["'self'", "data:", "https:"],
  fontSrc: ["'self'", "https:"],
  connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: "'self'",
  formAction: "'self'",
  upgradeInsecureRequests: true,
  reportUri: "/csp-report"
});

// Converter configuração CSP para string
export const cspConfigToString = (config: CSPConfig): string => {
  const directives = [
    `default-src ${config.defaultSrc.join(' ')}`,
    `script-src ${config.scriptSrc.join(' ')}`,
    `style-src ${config.styleSrc.join(' ')}`,
    `img-src ${config.imgSrc.join(' ')}`,
    `font-src ${config.fontSrc.join(' ')}`,
    `connect-src ${config.connectSrc.join(' ')}`,
    `frame-src ${config.frameSrc.join(' ')}`,
    `object-src ${config.objectSrc.join(' ')}`,
    `base-uri ${config.baseUri}`,
    `form-action ${config.formAction}`
  ];

  if (config.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  if (config.reportUri) {
    directives.push(`report-uri ${config.reportUri}`);
  }

  return directives.join('; ');
};

// Validação de CSP
export const validateCSP = (cspHeader: string): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  const cspString = cspHeader.toLowerCase();

  // Verificações de segurança
  if (cspString.includes("'unsafe-inline'") && cspString.includes("script-src")) {
    warnings.push("⚠️  'unsafe-inline' em script-src é um risco de segurança");
  }

  if (cspString.includes("'unsafe-eval'") && cspString.includes("script-src")) {
    warnings.push("⚠️  'unsafe-eval' em script-src é um risco de segurança");
  }

  if (!cspString.includes("object-src 'none'")) {
    warnings.push("⚠️  Recomenda-se definir object-src 'none'");
  }

  if (!cspString.includes("frame-ancestors")) {
    warnings.push("ℹ️  Considere definir frame-ancestors para proteção adicional");
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
};

// Hook para aplicar nonce aos elementos
export const applyNonceToElement = (element: HTMLElement, nonce: string): void => {
  if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
    element.setAttribute('nonce', nonce);
  }
};

// Gerar meta tag CSP
export const generateCSPMetaTag = (config: CSPConfig): string => {
  const cspString = cspConfigToString(config);
  return `<meta http-equiv="Content-Security-Policy" content="${cspString}">`;
};

// Extrair domínios permitidos
export const extractAllowedDomains = (config: CSPConfig): string[] => {
  const domains: Set<string> = new Set();

  [...config.imgSrc, ...config.fontSrc, ...config.connectSrc].forEach(src => {
    if (src.startsWith('https://') || src.startsWith('ws://') || src.startsWith('wss://')) {
      const domain = src.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
      const cleanDomain = domain.split('/')[0].split('?')[0].split('#')[0];
      if (cleanDomain && !cleanDomain.includes('*')) {
        domains.add(cleanDomain);
      }
    }
  });

  return Array.from(domains);
};