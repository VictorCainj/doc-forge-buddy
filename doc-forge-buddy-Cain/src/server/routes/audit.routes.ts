/**
 * API Endpoints para Audit Logging
 * Endpoints REST para gerenciar logs de auditoria
 */

import { Router, Request, Response } from 'express';
import { auditLogger } from '../services/audit/audit-logger.service';
import { securityMonitor, SecurityAlert } from '../services/audit/security-monitor.service';
import { supabase } from '../integrations/supabase/client';

// Middleware de autenticação (assumindo que existe)
import { authMiddleware, requireRole } from '../middleware/auth';

// Instância do router
const auditRouter = Router();

/**
 * GET /api/audit-logs
 * Buscar logs de auditoria com filtros
 */
auditRouter.get('/audit-logs', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      action,
      resource,
      limit = 100,
      offset = 0
    } = req.query;

    const result = await auditLogger.getLogs({
      startDate: startDate as string,
      endDate: endDate as string,
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        hasMore: result.hasMore,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/audit-logs/:id
 * Buscar log específico por ID
 */
auditRouter.get('/audit-logs/:id', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Log não encontrado'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Erro ao buscar audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/audit-logs/export
 * Exportar logs de auditoria em CSV
 */
auditRouter.get('/audit-logs/export', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const logs = await auditLogger.getAllLogs(req.query);
    
    // Converter para CSV
    const csv = convertToCSV(logs);
    
    // Log da exportação
    await auditLogger.log({
      userId: req.user.id,
      action: 'EXPORT',
      resource: 'audit_logs',
      metadata: {
        exportFormat: 'csv',
        recordCount: logs.length,
        filters: req.query
      }
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error('Erro ao exportar audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao exportar logs',
      message: error.message
    });
  }
});

/**
 * POST /api/audit-logs
 * Criar log de auditoria manualmente
 */
auditRouter.post('/audit-logs', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      action,
      resource,
      resourceId,
      oldData,
      newData,
      metadata
    } = req.body;

    // Validação básica
    if (!action || !resource) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: action, resource'
      });
    }

    await auditLogger.log({
      userId: req.user.id,
      userEmail: req.user.email,
      action,
      resource,
      resourceId,
      oldData,
      newData,
      metadata,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: req.sessionID || 'unknown'
    });

    res.json({
      success: true,
      message: 'Log de auditoria criado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/audit-stats
 * Obter estatísticas de audit
 */
auditRouter.get('/audit-stats', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate as string || new Date().toISOString();

    // Buscar dados para estatísticas
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('action, entity_type, user_id, created_at, success')
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      throw error;
    }

    // Calcular estatísticas
    const stats = {
      totalEvents: logs?.length || 0,
      eventsByAction: {} as Record<string, number>,
      eventsByEntity: {} as Record<string, number>,
      eventsByDay: {} as Record<string, number>,
      topUsers: [] as Array<{ user_id: string; email: string; full_name: string; count: number }>,
      successRate: 0,
      avgEventsPerDay: 0
    };

    if (logs) {
      // Contar por ação
      logs.forEach(log => {
        stats.eventsByAction[log.action] = (stats.eventsByAction[log.action] || 0) + 1;
        stats.eventsByEntity[log.entity_type] = (stats.eventsByEntity[log.entity_type] || 0) + 1;
        
        const day = log.created_at.split('T')[0];
        stats.eventsByDay[day] = (stats.eventsByDay[day] || 0) + 1;
      });

      // Taxa de sucesso
      const successCount = logs.filter(log => log.success !== false).length;
      stats.successRate = stats.totalEvents > 0 ? (successCount / stats.totalEvents) * 100 : 0;

      // Top usuários
      const userGroups = logs.reduce((acc, log) => {
        if (log.user_id) {
          if (!acc[log.user_id]) {
            acc[log.user_id] = [];
          }
          acc[log.user_id].push(log);
        }
        return acc;
      }, {} as Record<string, typeof logs>);

      stats.topUsers = Object.entries(userGroups)
        .map(([userId, userLogs]) => ({
          user_id: userId,
          email: userLogs[0]?.user_email || 'N/A',
          full_name: userLogs[0]?.user_name || 'N/A',
          count: userLogs.length
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Média de eventos por dia
      const days = Object.keys(stats.eventsByDay).length;
      stats.avgEventsPerDay = days > 0 ? stats.totalEvents / days : 0;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/audit-logs/user/:userId
 * Buscar logs de usuário específico
 */
auditRouter.get('/audit-logs/user/:userId', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar logs do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * Security Monitoring Endpoints
 */

/**
 * GET /api/security/alerts
 * Buscar alertas de segurança
 */
auditRouter.get('/security/alerts', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { resolved, severity, type, limit = 50 } = req.query;

    // Buscar alertas do banco
    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true');
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Erro ao buscar alertas de segurança:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/security/alerts/:id/resolve
 * Resolver alerta de segurança
 */
auditRouter.post('/security/alerts/:id/resolve', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { error } = await supabase
      .from('security_alerts')
      .update({
        resolved: true,
        resolved_by: req.user.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Log da resolução
    await auditLogger.log({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'security_alert',
      resourceId: id,
      metadata: {
        action: 'resolved',
        notes
      }
    });

    res.json({
      success: true,
      message: 'Alerta resolvido com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao resolver alerta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/security/stats
 * Obter estatísticas de segurança
 */
auditRouter.get('/security/stats', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const stats = securityMonitor.getSecurityStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas de segurança:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/security/scan
 * Executar scan de segurança manual
 */
auditRouter.post('/security/scan', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    // Executar scan de segurança
    await securityMonitor.checkForSuspiciousActivity();
    
    // Log do scan
    await auditLogger.log({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'security_monitor',
      metadata: {
        action: 'manual_scan',
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Scan de segurança executado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao executar scan:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao executar scan',
      message: error.message
    });
  }
});

/**
 * Utility Functions
 */

/**
 * Converter logs para CSV
 */
function convertToCSV(logs: any[]): string {
  if (!logs || logs.length === 0) {
    return 'No data available';
  }

  const headers = [
    'ID',
    'Data/Hora',
    'Usuário',
    'Email',
    'Ação',
    'Recurso',
    'ID do Recurso',
    'IP',
    'User Agent',
    'Status',
    'Erro'
  ];

  const rows = logs.map(log => [
    log.id,
    new Date(log.created_at).toLocaleString('pt-BR'),
    log.user_name || 'Sistema',
    log.user_email || 'N/A',
    log.action,
    log.entity_type,
    log.entity_id || 'N/A',
    log.ip_address || 'N/A',
    log.user_agent || 'N/A',
    log.metadata?.success !== false ? 'Sucesso' : 'Falha',
    log.metadata?.error || 'N/A'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
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

export default auditRouter;