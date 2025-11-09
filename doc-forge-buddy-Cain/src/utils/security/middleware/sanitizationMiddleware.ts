/**
 * Middleware de sanitização para Express
 * Aplica sanitização automática aos dados de entrada
 */

import { Request, Response, NextFunction } from 'express';
import { sanitizeObject, sanitizeInput } from '../sanitization/inputSanitizer';

/**
 * Middleware de sanitização do body
 */
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware de sanitização de query params
 */
export function sanitizeQuery(req: Request, res: Response, next: NextFunction) {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Middleware de sanitização de params
 */
export function sanitizeParams(req: Request, res: Response, next: NextFunction) {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Middleware completo de sanitização
 */
export function sanitizeAll(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
}

/**
 * Middleware de sanitização customizada por rota
 */
export function createSanitizeMiddleware(fields: string[], excludeFields: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitizar body
    if (req.body) {
      for (const field of fields) {
        if (req.body[field] && !excludeFields.includes(field)) {
          req.body[field] = typeof req.body[field] === 'string' 
            ? sanitizeInput(req.body[field])
            : sanitizeObject(req.body[field]);
        }
      }
    }
    
    // Sanitizar query
    if (req.query) {
      for (const field of fields) {
        if (req.query[field] && !excludeFields.includes(field)) {
          req.query[field] = typeof req.query[field] === 'string' 
            ? sanitizeInput(req.query[field])
            : sanitizeObject(req.query[field]);
        }
      }
    }
    
    // Sanitizar params
    if (req.params) {
      for (const field of fields) {
        if (req.params[field] && !excludeFields.includes(field)) {
          req.params[field] = typeof req.params[field] === 'string' 
            ? sanitizeInput(req.params[field])
            : sanitizeObject(req.params[field]);
        }
      }
    }
    
    next();
  };
}

/**
 * Middleware de sanitização para rich text
 */
export function sanitizeRichTextFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { sanitizeRichText } = require('../sanitization/inputSanitizer');
    
    if (req.body) {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeRichText(req.body[field]);
        }
      }
    }
    
    next();
  };
}

/**
 * Middleware de sanitização para URLs
 */
export function sanitizeUrlFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { sanitizeUrl } = require('../sanitization/inputSanitizer');
    
    if (req.body) {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeUrl(req.body[field]);
        }
      }
    }
    
    next();
  };
}

/**
 * Middleware de sanitização para números
 */
export function sanitizeNumberFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { sanitizeNumber } = require('../sanitization/inputSanitizer');
    
    if (req.body) {
      for (const field of fields) {
        if (req.body[field] !== undefined && req.body[field] !== null) {
          req.body[field] = sanitizeNumber(req.body[field]);
        }
      }
    }
    
    if (req.query) {
      for (const field of fields) {
        if (req.query[field] !== undefined && req.query[field] !== null) {
          req.query[field] = sanitizeNumber(req.query[field]);
        }
      }
    }
    
    next();
  };
}

/**
 * Middleware de sanitização para arquivos
 */
export function sanitizeFileFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { sanitizeFilename } = require('../sanitization/inputSanitizer');
    
    if (req.body) {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeFilename(req.body[field]);
        }
      }
    }
    
    if (req.file) {
      // Renomear arquivo se necessário
      if (req.file.fieldname && fields.includes(req.file.fieldname)) {
        req.file.originalname = sanitizeFilename(req.file.originalname);
      }
    }
    
    next();
  };
}

/**
 * Middleware de validação de conteúdo
 */
export function validateContent(fields: string[], maxLength: number = 10000) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      const value = req.body[field];
      
      if (value && typeof value === 'string' && value.length > maxLength) {
        return res.status(400).json({
          error: 'Content Too Long',
          message: `Campo ${field} excede o tamanho máximo de ${maxLength} caracteres`,
          field,
          maxLength,
          currentLength: value.length
        });
      }
      
      // Verificar caracteres de controle
      if (value && typeof value === 'string' && /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)) {
        return res.status(400).json({
          error: 'Invalid Content',
          message: `Campo ${field} contém caracteres de controle inválidos`,
          field
        });
      }
    }
    
    next();
  };
}

/**
 * Middleware de proteção contra CSV injection
 */
export function preventCSVInjection(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      const value = req.body[field];
      
      if (value && typeof value === 'string') {
        // Prefixar com apostrofe se começar com caracteres perigosos
        if (/^[=+\-@]/.test(value.trim())) {
          req.body[field] = "'" + value;
        }
      }
    }
    
    next();
  };
}

/**
 * Middleware de sanitização condicional
 */
export function conditionalSanitize(shouldSanitize: (req: Request) => boolean, sanitizer: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (shouldSanitize(req)) {
      sanitizer(req, res, next);
    } else {
      next();
    }
  };
}

/**
 * Middleware de logging de sanitização
 */
export function logSanitization() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Log de dados sanitizados (opcional)
      if (process.env.NODE_ENV === 'development') {
        console.log('Request sanitized:', {
          method: req.method,
          path: req.path,
          body: req.body ? Object.keys(req.body) : 'no body',
          query: req.query ? Object.keys(req.query) : 'no query',
          params: req.params ? Object.keys(req.params) : 'no params'
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware de rate limiting + sanitização
 */
export function securitySuite(limiterMiddleware: any, sanitizeMiddleware: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Aplicar rate limiting primeiro
    limiterMiddleware(req, res, (err: any) => {
      if (err) return next(err);
      
      // Depois sanitização
      sanitizeMiddleware(req, res, next);
    });
  };
}

/**
 * Middleware específico para API
 */
export const apiSecurityMiddleware = securitySuite(
  // Rate limiter (ajuste conforme sua implementação)
  (req: Request, res: Response, next: NextFunction) => {
    // Placeholder para rate limiting
    next();
  },
  // Sanitização completa
  sanitizeAll
);

/**
 * Middleware específico para uploads
 */
export const uploadSecurityMiddleware = securitySuite(
  // Rate limiter para uploads
  (req: Request, res: Response, next: NextFunction) => {
    // Placeholder para rate limiting de uploads
    next();
  },
  // Sanitização para arquivos
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    next();
  }
);

/**
 * Middleware específico para autenticação
 */
export const authSecurityMiddleware = securitySuite(
  // Rate limiter para auth
  (req: Request, res: Response, next: NextFunction) => {
    // Placeholder para rate limiting de auth
    next();
  },
  // Sanitização específica para auth
  createSanitizeMiddleware(['email', 'username'], ['password', 'token', 'secret'])
);
