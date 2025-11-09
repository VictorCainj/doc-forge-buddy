/**
 * Índices do sistema de audit
 */

export { auditLogger } from './audit-logger.service';
export { 
  auditMiddleware, 
  criticalAudit, 
  bulkOperationAudit, 
  exportAudit, 
  printAudit,
  securityAudit 
} from './audit.middleware';
export { 
  securityMonitor, 
  type SecurityAlert,
  type SuspiciousActivity 
} from './security-monitor.service';
export type { 
  AuditLog, 
  AuditAction, 
  CreateAuditEntry 
} from './audit-logger.service';

export { AuditDashboard } from '@/components/audit/AuditDashboard';
export { SecurityDashboard } from '@/components/audit/SecurityDashboard';