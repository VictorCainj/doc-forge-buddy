/**
 * Express.js Middleware para Content Security Policy (CSP)
 * Aplica headers de segurança robustos em produção
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { getProdCSPConfig, generateNonce } from './csp-config';

interface CSPMiddlewareOptions {
  enabled?: boolean;
  reportOnly?: boolean;
  useNonce?: boolean;
  reportUri?: string;
}

/**
 * Middleware principal para CSP
 */
export const createCSPMiddleware = (options: CSPMiddlewareOptions = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'production',
    reportOnly = process.env.NODE_ENV !== 'production',
    useNonce = true,
    reportUri = '/csp-report'
  } = options;

  if (!enabled) {
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    };
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Gerar nonce se habilitado
    const nonce = useNonce ? generateNonce() : undefined;
    
    // Configurar CSP
    const cspConfig = getProdCSPConfig(nonce);
    if (reportUri) {
      cspConfig.reportUri = reportUri;
    }

    // Configurar Helmet
    const helmetConfig = {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: cspConfig.defaultSrc,
          scriptSrc: cspConfig.scriptSrc,
          styleSrc: cspConfig.styleSrc,
          imgSrc: cspConfig.imgSrc,
          fontSrc: cspConfig.fontSrc,
          connectSrc: cspConfig.connectSrc,
          frameSrc: cspConfig.frameSrc,
          objectSrc: cspConfig.objectSrc,
          baseUri: [cspConfig.baseUri],
          formAction: [cspConfig.formAction],
          upgradeInsecureRequests: cspConfig.upgradeInsecureRequests ? [] : undefined,
          reportUri: cspConfig.reportUri
        }
      },
      hsts: {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true
      },
      xssFilter: true,
      noSniff: true,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    };

    // Aplicar helmet
    helmet(helmetConfig)(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }

      // Adicionar nonce como header customizado para uso no frontend
      if (nonce) {
        res.setHeader('X-CSP-Nonce', nonce);
      }

      next();
    });
  };
};

/**
 * Middleware simplificado para desenvolvimento
 */
export const devCSPMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    return next();
  }

  // CSP mais permissivo para desenvolvimento
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' https:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://localhost:* ws://localhost:*;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `;

  res.setHeader('Content-Security-Policy', cspHeader);
  next();
};

/**
 * Endpoint para receber relatórios de violação CSP
 */
export const cspReportHandler = (req: Request, res: Response) => {
  const report = req.body;
  
  // Log da violação
  console.warn('CSP Violation Report:', JSON.stringify(report, null, 2));

  // Aqui você pode salvar no banco de dados, enviar para serviço de monitoramento, etc.
  // Exemplo: await saveCSPReport(report);

  // Responder com 204 No Content
  res.status(204).end();
};

/**
 * Middleware para logs de segurança
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log de headers de segurança
  const securityHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Referrer-Policy'
  ];

  const presentHeaders = securityHeaders.filter(header => res.getHeader(header));
  
  if (presentHeaders.length > 0) {
    console.log(`Security headers set for ${req.method} ${req.path}: ${presentHeaders.join(', ')}`);
  }

  next();
};

export { CSPMiddlewareOptions };