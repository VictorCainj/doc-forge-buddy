/**
 * Módulo de Segurança Centralizado
 * Input Sanitization e Rate Limiting
 * 
 * Este módulo fornece uma solução completa de segurança incluindo:
 * - Sanitização de inputs
 * - Validação de dados
 * - Rate limiting
 * - Middleware de segurança
 * - Query builder seguro
 */

export * from './sanitization/inputSanitizer';
export * from './validators/dataValidators';
export * from './rate-limiting/rateLimiter';
export * from './middleware/sanitizationMiddleware';
export * from './query-builder/secureQueryBuilder';

/**
 * Configurações globais de segurança
 */
export const SECURITY_CONFIG = {
  // Configurações de sanitização
  SANITIZATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 1000,
    MAX_OBJECT_DEPTH: 10,
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: ['href', 'target']
  },
  
  // Configurações de rate limiting
  RATE_LIMITING: {
    DEFAULT_WINDOW_MS: 60 * 1000, // 1 minuto
    DEFAULT_MAX_REQUESTS: 100,
    AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    AUTH_MAX_REQUESTS: 5,
    UPLOAD_WINDOW_MS: 60 * 60 * 1000, // 1 hora
    UPLOAD_MAX_REQUESTS: 10
  },
  
  // Campos sensíveis que não devem ser sanitizados
  SENSITIVE_FIELDS: [
    'password',
    'token',
    'secret',
    'apiKey',
    'authToken',
    'refreshToken',
    'accessToken',
    'creditCard',
    'ssn'
  ],
  
  // Caracteres perigosos para detectar
  DANGEROUS_CHARS: [
    '<',
    '>',
    '"',
    "'",
    '&',
    'script',
    'javascript:',
    'vbscript:',
    'onload',
    'onerror',
    'onclick'
  ]
};

/**
 * Função utilitária para configurar segurança rapidamente
 */
export function configureSecurity(options: {
  redisUrl?: string;
  enableRateLimit?: boolean;
  enableSanitization?: boolean;
  customSensitiveFields?: string[];
}) {
  // Configurar Redis se fornecido
  if (options.redisUrl) {
    const { initializeRedis } = require('./rate-limiting/rateLimiter');
    initializeRedis(options.redisUrl);
  }
  
  // Adicionar campos sensíveis customizados
  if (options.customSensitiveFields) {
    SECURITY_CONFIG.SENSITIVE_FIELDS.push(...options.customSensitiveFields);
  }
  
  return {
    rateLimiters: {
      auth: require('./rate-limiting/rateLimiter').authRateLimiter,
      api: require('./rate-limiting/rateLimiter').apiRateLimiter,
      upload: require('./rate-limiting/rateLimiter').uploadRateLimiter,
      search: require('./rate-limiting/rateLimiter').searchRateLimiter
    },
    middlewares: {
      sanitizeBody: require('./middleware/sanitizationMiddleware').sanitizeBody,
      sanitizeAll: require('./middleware/sanitizationMiddleware').sanitizeAll,
      sanitizeQuery: require('./middleware/sanitizationMiddleware').sanitizeQuery,
      sanitizeParams: require('./middleware/sanitizationMiddleware').sanitizeParams
    },
    validators: {
      validateEmail: require('./validators/dataValidators').validateEmail,
      validatePhone: require('./validators/dataValidators').validatePhone,
      validateCPF: require('./validators/dataValidators').validateCPF,
      validateCNPJ: require('./validators/dataValidators').validateCNPJ,
      validatePassword: require('./validators/dataValidators').validatePassword
    },
    sanitizers: {
      sanitizeInput: require('./sanitization/inputSanitizer').sanitizeInput,
      sanitizeRichText: require('./sanitization/inputSanitizer').sanitizeRichText,
      sanitizeUrl: require('./sanitization/inputSanitizer').sanitizeUrl,
      sanitizeObject: require('./sanitization/inputSanitizer').sanitizeObject
    },
    queryBuilder: {
      SecureQueryBuilder: require('./query-builder/secureQueryBuilder').SecureQueryBuilder,
      QueryBuilderFactory: require('./query-builder/secureQueryBuilder').QueryBuilderFactory
    }
  };
}

/**
 * Decorator para aplicar segurança automaticamente
 */
export function Secure(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    // Sanitizar argumentos
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'object' && args[i] !== null) {
        const { sanitizeObject } = require('./sanitization/inputSanitizer');
        args[i] = sanitizeObject(args[i]);
      }
    }
    
    // Executar método original
    return method.apply(this, args);
  };
}

/**
 * Função para logging de segurança
 */
export function logSecurityEvent(event: {
  type: 'sanitization' | 'rate_limit' | 'validation' | 'query_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  ip?: string;
  userId?: string;
  endpoint?: string;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Security Event:', JSON.stringify(logEntry, null, 2));
  }
  
  // Em produção, enviar para sistema de logging
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrar com sistema de logging (Winston, Bunyan, etc.)
    // Exemplo: logger.warn(logEntry);
  }
}

/**
 * Utilitários para desenvolvimento
 */

// Função para limpar e preparar ambiente de desenvolvimento
export function setupDevEnvironment() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🛡️  Configurando ambiente de segurança para desenvolvimento...');
    
    // Configurar DOMPurify para desenvolvimento
    const DOMPurify = require('isomorphic-dompurify');
    if (DOMPurify.addHook) {
      DOMPurify.addHook('afterSanitizeAttributes', function(node: any) {
        // Log de sanitização para debug
        if (node.hasAttribute && node.hasAttribute('href')) {
          console.log('Link sanitizado:', node.getAttribute('href'));
        }
      });
    }
    
    console.log('✅ Ambiente de segurança configurado');
  }
}

// Função para verificar saúde do sistema de segurança
export function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      dompurify: typeof window !== 'undefined' ? 
        (window as any).DOMPurify ? 'available' : 'not available' : 
        'server-side',
      redis: redisClient ? 'connected' : 'not configured',
      validators: 'available',
      sanitizers: 'available',
      rateLimiters: 'available'
    }
  };
}
