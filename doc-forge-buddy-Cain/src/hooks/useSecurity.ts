import { useEffect, useState } from 'react';

// Tipos para configuração de segurança
interface SecurityConfig {
  enableCSP: boolean;
  enableHTTPSRedirect: boolean;
  enableSecurityHeaders: boolean;
  allowedOrigins: string[];
  enableRateLimiting: boolean;
  sessionTimeout: number;
}

// Configuração de segurança padrão
const defaultSecurityConfig: SecurityConfig = {
  enableCSP: true,
  enableHTTPSRedirect: true,
  enableSecurityHeaders: true,
  allowedOrigins: [
    'https://localhost:3000',
    'https://agzutoonsruttqbjnclo.supabase.co'
  ],
  enableRateLimiting: true,
  sessionTimeout: 24 * 60 * 60 * 1000 // 24 horas
};

/**
 * Hook para aplicar configurações de segurança
 */
export const useSecurityHeaders = (config?: Partial<SecurityConfig>) => {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    ...defaultSecurityConfig,
    ...config
  });

  useEffect(() => {
    // HTTPS Redirect
    if (securityConfig.enableHTTPSRedirect && 
        typeof window !== 'undefined' && 
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost') {
      window.location.replace(
        'https:' + window.location.href.substring(window.location.protocol.length)
      );
    }

    // Content Security Policy
    if (securityConfig.enableCSP && typeof document !== 'undefined') {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://agzutoonsruttqbjnclo.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        `connect-src 'self' https://agzutoonsruttqbjnclo.supabase.co wss://agzutoonsruttqbjnclo.supabase.co ${securityConfig.allowedOrigins.join(' ')}`,
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
      
      document.head.appendChild(cspMeta);
    }

    // Security Headers (meta tags)
    if (securityConfig.enableSecurityHeaders && typeof document !== 'undefined') {
      const securityHeaders = [
        { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
        { httpEquiv: 'X-Frame-Options', content: 'DENY' },
        { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
        { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
        { httpEquiv: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=()' }
      ];

      securityHeaders.forEach(header => {
        const meta = document.createElement('meta');
        meta.httpEquiv = header.httpEquiv;
        meta.content = header.content;
        document.head.appendChild(meta);
      });
    }
  }, [securityConfig]);

  return securityConfig;
};

/**
 * Função para verificar se a conexão é segura
 */
export const isSecureConnection = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

/**
 * Função para validar origins permitidos
 */
export const isAllowedOrigin = (origin: string, allowedOrigins: string[] = defaultSecurityConfig.allowedOrigins): boolean => {
  return allowedOrigins.includes(origin);
};

/**
 * Função para detectar ataques XSS
 */
export const detectXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src\s*=\s*["']?\s*javascript:/gi,
    /<[^>]+style\s*=\s*["']?\s*expression\s*\(/gi,
    /<[^>]+style\s*=\s*["']?\s*vml\s*:/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Função para sanitizar input
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Função para validar CSRF token
 */
export const validateCSRFToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // Verificar se é um token válido (hex de 64 caracteres)
  const tokenPattern = /^[a-f0-9]{64}$/i;
  return tokenPattern.test(token);
};

/**
 * Função para gerar CSRF token
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hook para gerenciar tokens de segurança
 */
export const useSecurityTokens = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');

  useEffect(() => {
    // Verificar tokens existentes ou gerar novos
    const existingCsrfToken = localStorage.getItem('csrf_token');
    const existingSessionToken = localStorage.getItem('session_token');

    if (existingCsrfToken && validateCSRFToken(existingCsrfToken)) {
      setCsrfToken(existingCsrfToken);
    } else {
      const newCsrfToken = generateCSRFToken();
      localStorage.setItem('csrf_token', newCsrfToken);
      setCsrfToken(newCsrfToken);
    }

    if (existingSessionToken) {
      setSessionToken(existingSessionToken);
    } else {
      const newSessionToken = generateCSRFToken();
      localStorage.setItem('session_token', newSessionToken);
      setSessionToken(newSessionToken);
    }
  }, []);

  const refreshTokens = () => {
    const newCsrfToken = generateCSRFToken();
    const newSessionToken = generateCSRFToken();
    
    localStorage.setItem('csrf_token', newCsrfToken);
    localStorage.setItem('session_token', newSessionToken);
    
    setCsrfToken(newCsrfToken);
    setSessionToken(newSessionToken);
  };

  const clearTokens = () => {
    localStorage.removeItem('csrf_token');
    localStorage.removeItem('session_token');
    setCsrfToken('');
    setSessionToken('');
  };

  return {
    csrfToken,
    sessionToken,
    refreshTokens,
    clearTokens,
    isValid: validateCSRFToken(csrfToken) && validateCSRFToken(sessionToken)
  };
};

/**
 * Função para rate limiting client-side
 */
export class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 100, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  canMakeRequest(identifier: string = 'global'): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remover requests antigas
    const recentRequests = requests.filter(time => now - time < this.timeWindow);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Adicionar nova request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string = 'global'): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(time => now - time < this.timeWindow);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  reset(identifier: string = 'global'): void {
    this.requests.delete(identifier);
  }
}

/**
 * Hook para rate limiting
 */
export const useRateLimiting = (maxRequests: number = 100, timeWindow: number = 60000) => {
  const limiter = new ClientRateLimiter(maxRequests, timeWindow);
  
  const canMakeRequest = (identifier?: string) => limiter.canMakeRequest(identifier);
  const getRemainingRequests = (identifier?: string) => limiter.getRemainingRequests(identifier);
  const reset = (identifier?: string) => limiter.reset(identifier);
  
  return { canMakeRequest, getRemainingRequests, reset };
};

/**
 * Função para validar dados de entrada
 */
export const validateInput = (data: any, schema: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Dados inválidos');
    return { isValid: false, errors };
  }
  
  // Implementar validação básica baseada no schema
  // Esta é uma implementação simplificada - em produção use uma biblioteca como Zod
  Object.keys(schema).forEach(key => {
    const rule = schema[key];
    const value = data[key];
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} é obrigatório`);
    }
    
    if (rule.type && typeof value !== rule.type) {
      errors.push(`${key} deve ser do tipo ${rule.type}`);
    }
    
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      errors.push(`${key} deve ter pelo menos ${rule.minLength} caracteres`);
    }
    
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      errors.push(`${key} deve ter no máximo ${rule.maxLength} caracteres`);
    }
    
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(`${key} não está no formato correto`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Função para monitorar tentativas de segurança
 */
export const logSecurityEvent = (event: string, details?: any) => {
  if (typeof window !== 'undefined' && window.console && process.env.NODE_ENV !== 'production') {
    console.warn('🚨 Security Event:', event, details);
  }
  
  // Em produção, enviar para serviço de monitoramento
  if (process.env.NODE_ENV === 'production') {
    // Implementar envio para Sentry ou serviço similar
    // Sentry.captureMessage(`Security Event: ${event}`, 'warning', { extra: details });
  }
};

/**
 * Hook para monitoramento de segurança
 */
export const useSecurityMonitoring = () => {
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  const addSecurityEvent = (event: string, details?: any) => {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    
    setSecurityEvents(prev => [...prev, securityEvent]);
    logSecurityEvent(event, details);
  };

  const clearEvents = () => setSecurityEvents([]);

  return {
    securityEvents,
    addSecurityEvent,
    clearEvents
  };
};

export default {
  useSecurityHeaders,
  isSecureConnection,
  isAllowedOrigin,
  detectXSS,
  sanitizeInput,
  validateCSRFToken,
  generateCSRFToken,
  useSecurityTokens,
  ClientRateLimiter,
  useRateLimiting,
  validateInput,
  logSecurityEvent,
  useSecurityMonitoring
};