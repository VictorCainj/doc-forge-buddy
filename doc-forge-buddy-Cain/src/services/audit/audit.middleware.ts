/**
 * Middleware para audit automático
 * Implementa logging automático de requisições HTTP
 */

import { Request, Response, NextFunction } from 'express';
import { auditLogger, AuditAction } from './audit-logger.service';

// Extender interface Request para incluir dados de audit
declare global {
  namespace Express {
    interface Request {
      auditLogged?: boolean;
      originalBody?: any;
    }
  }
}

/**
 * Middleware para audit automático
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Capturar body original antes de qualquer modificação
  req.originalBody = req.body;

  // Interceptar resposta para logging
  res.send = function(data) {
    // Log da requisição apenas se não foi logado ainda
    if (!req.auditLogged && req.user) {
      logRequest(req, res, data);
    }
    
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    // Log da requisição apenas se não foi logado ainda
    if (!req.auditLogged && req.user) {
      logRequest(req, res, data);
    }
    
    return originalJson.call(this, data);
  };

  next();
}

/**
 * Log de requisição específica
 */
function logRequest(req: Request, res: Response, responseData: any): void {
  try {
    const action = mapHttpMethodToAuditAction(req.method);
    const resource = getResourceFromPath(req.route?.path || req.path);
    const resourceId = extractResourceId(req.params, req.body);
    
    // Não fazer audit de requisições de audit
    if (resource === 'audit-logs' && action === AuditAction.READ) {
      return;
    }

    // Sanitizar dados sensíveis
    const sanitizedBody = sanitizeForAudit(req.body);
    const sanitizedOldData = req.originalBody ? sanitizeForAudit(req.originalBody) : null;

    auditLogger.log({
      userId: req.user.id,
      userEmail: req.user.email,
      action,
      resource,
      resourceId,
      oldData: sanitizedOldData,
      newData: sanitizedBody,
      metadata: {
        httpMethod: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        statusCode: res.statusCode,
        responseSize: responseData ? JSON.stringify(responseData).length : 0,
        headers: {
          'content-type': req.get('Content-Type'),
          'user-agent': req.get('User-Agent')
        }
      },
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: getSessionId(req),
      success: res.statusCode < 400,
      error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined
    });

    // Marcar como logado para evitar duplicação
    req.auditLogged = true;
  } catch (error) {
    console.error('Erro no middleware de audit:', error);
  }
}

/**
 * Mapear método HTTP para ação de audit
 */
function mapHttpMethodToAuditAction(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'POST': return AuditAction.CREATE;
    case 'PUT':
    case 'PATCH': return AuditAction.UPDATE;
    case 'DELETE': return AuditAction.DELETE;
    case 'GET': 
    default: return AuditAction.READ;
  }
}

/**
 * Extrair recurso do path
 */
function getResourceFromPath(path: string): string {
  // Remover parâmetros dinâmicos (/api/users/:id -> /api/users)
  const cleanPath = path.replace(/\/:[^/]+/g, '');
  
  // Extrair o último segmento do path
  const segments = cleanPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || 'unknown';
}

/**
 * Extrair ID do recurso dos parâmetros ou body
 */
function extractResourceId(params: any, body: any): string | undefined {
  // Tentar parâmetros da URL primeiro
  if (params.id) {
    return params.id;
  }
  
  // Tentar body
  if (body && typeof body === 'object' && body.id) {
    return body.id;
  }
  
  return undefined;
}

/**
 * Sanitizar dados sensíveis
 */
function sanitizeForAudit(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'credential',
    'auth',
    'authorization',
    'apiKey',
    'privateKey',
    'refreshToken'
  ];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Obter IP do cliente
 */
function getClientIP(req: Request): string {
  return (req.ip || 
          req.connection.remoteAddress || 
          req.socket.remoteAddress ||
          req.headers['x-forwarded-for'] as string ||
          req.headers['x-real-ip'] as string ||
          'unknown');
}

/**
 * Obter ID da sessão
 */
function getSessionId(req: Request): string {
  return req.sessionID || 
         (req.headers['x-session-id'] as string) || 
         'unknown';
}

/**
 * Middleware específico para actions críticas
 */
export function criticalAudit(action: AuditAction, resource: string) {
  return function(req: Request, res: Response, next: NextFunction) {
    // Log imediato para actions críticas
    auditLogger.log({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action,
      resource,
      metadata: {
        middleware: 'critical-audit',
        httpMethod: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      },
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: getSessionId(req)
    });

    next();
  };
}

/**
 * Middleware para audit de bulk operations
 */
export function bulkOperationAudit(operation: string) {
  return function(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log da operação em massa
      auditLogger.log({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: AuditAction.UPDATE,
        resource: req.path,
        metadata: {
          operation: 'bulk',
          operationType: operation,
          recordCount: req.body?.ids?.length || 0,
          timestamp: new Date().toISOString()
        },
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: getSessionId(req)
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Middleware para audit de exports
 */
export function exportAudit(format: 'csv' | 'pdf' | 'excel') {
  return function(req: Request, res: Response, next: NextFunction) {
    auditLogger.log({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: AuditAction.EXPORT,
      resource: req.path,
      metadata: {
        exportFormat: format,
        filters: req.query,
        timestamp: new Date().toISOString()
      },
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: getSessionId(req)
    });

    next();
  };
}

/**
 * Middleware para audit de prints
 */
export function printAudit(resource: string) {
  return function(req: Request, res: Response, next: NextFunction) {
    auditLogger.log({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: AuditAction.PRINT,
      resource,
      resourceId: req.params.id,
      metadata: {
        printSettings: req.body?.settings,
        timestamp: new Date().toISOString()
      },
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: getSessionId(req)
    });

    next();
  };
}

/**
 * Middleware para auditoria de segurança
 */
export function securityAudit(event: string, severity: 'low' | 'medium' | 'high' | 'critical') {
  return function(req: Request, res: Response, next: NextFunction) {
    auditLogger.log({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: AuditAction.READ, // ou uma action específica para segurança
      resource: 'security',
      metadata: {
        securityEvent: event,
        severity,
        httpMethod: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ipAddress: getClientIP(req),
        timestamp: new Date().toISOString()
      },
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: getSessionId(req),
      success: true
    });

    next();
  };
}