/**
 * Exemplo de uso do sistema de audit logging
 * Demonstra como integrar o audit em diferentes partes da aplicação
 */

import React, { useEffect } from 'react';
import { auditLogger, AuditAction } from '@/services/audit';
import { securityMonitor } from '@/services/audit';
import { useLogAuditEvent } from '@/hooks/useAuditLog';

/**
 * Exemplo 1: Hook de Audit no Frontend
 */
export function AuditExampleComponent() {
  const logAudit = useLogAuditEvent();

  const handleCreateUser = async (userData: any) => {
    try {
      // Log da ação
      await logAudit.mutateAsync({
        action: 'CREATE',
        entity_type: 'user',
        entity_id: userData.id,
        new_data: { ...userData, password: '[REDACTED]' },
        metadata: { source: 'admin_panel', method: 'api' }
      });

      // Ação bem-sucedida
      console.log('Usuário criado com audit log');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      // Log da ação crítica
      await auditLogger.logDataChange(
        'user-123', // ID do usuário logado
        AuditAction.DELETE,
        'contract',
        contractId,
        { status: 'active' },
        { status: 'deleted', deleted_at: new Date().toISOString() }
      );

      console.log('Contrato deletado com audit log');
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
    }
  };

  return (
    <div className="audit-example">
      <h2>Exemplo de Audit Logging</h2>
      <button onClick={() => handleCreateUser({ id: '123', name: 'João' })}>
        Criar Usuário
      </button>
      <button onClick={() => handleDeleteContract('contract-456')}>
        Deletar Contrato
      </button>
    </div>
  );
}

/**
 * Exemplo 2: Middleware de Audit no Backend
 */
export function AuditBackendExample() {
  // Este exemplo mostra como usar os middlewares de audit
  // em um servidor Express.js
  
  const middlewareExamples = `
import express from 'express';
import { 
  auditMiddleware, 
  criticalAudit, 
  bulkOperationAudit, 
  exportAudit,
  printAudit,
  securityAudit 
} from './src/services/audit/audit.middleware';

const app = express();

// Middleware geral de audit
app.use(auditMiddleware);

// Middleware para ações críticas
app.post('/admin/delete-user/:id', 
  criticalAudit(AuditAction.DELETE, 'user'),
  deleteUserHandler
);

// Middleware para operações em massa
app.put('/admin/bulk-update-contracts',
  bulkOperationAudit('bulk_update'),
  bulkUpdateHandler
);

// Middleware para exportações
app.get('/admin/export-contracts',
  exportAudit('csv'),
  exportContractsHandler
);

// Middleware para impressões
app.post('/admin/print-contract/:id',
  printAudit('contract'),
  printContractHandler
);

// Middleware para eventos de segurança
app.post('/admin/change-permissions/:userId',
  securityAudit('permission_change', 'high'),
  changePermissionsHandler
);

// Endpoint para logs customizados
app.post('/custom-audit', async (req, res) => {
  const { auditLogger } = require('./src/services/audit/audit-logger.service');
  
  await auditLogger.log({
    userId: req.user.id,
    action: 'CUSTOM_ACTION',
    resource: 'custom_resource',
    metadata: { customData: req.body }
  });
  
  res.json({ success: true });
});

// Endpoint para forçar scan de segurança
app.post('/admin/security/scan', async (req, res) => {
  const { securityMonitor } = require('./src/services/audit/security-monitor.service');
  
  await securityMonitor.checkForSuspiciousActivity();
  
  res.json({ 
    success: true, 
    alerts: securityMonitor.getActiveAlerts() 
  });
});
  `;

  return (
    <div className="backend-example">
      <h2>Exemplo de Middleware de Audit</h2>
      <pre>{middlewareExamples}</pre>
    </div>
  );
}

/**
 * Exemplo 3: Security Monitor
 */
export function SecurityMonitorExample() {
  useEffect(() => {
    // Iniciar monitoramento de segurança
    securityMonitor.start(5); // A cada 5 minutos

    // Configurar listeners para alertas
    const handleSecurityAlert = (alert: any) => {
      console.log('🚨 Alerta de segurança:', alert);
      // Aqui você pode enviar notificação, email, etc.
    };

    // Obter alertas ativos
    const activeAlerts = securityMonitor.getActiveAlerts();
    console.log('Alertas ativos:', activeAlerts);

    // Obter estatísticas
    const stats = securityMonitor.getSecurityStats();
    console.log('Estatísticas de segurança:', stats);

    return () => {
      // Parar monitoramento quando o componente for desmontado
      securityMonitor.stop();
    };
  }, []);

  const forceSecurityScan = async () => {
    await securityMonitor.checkForSuspiciousActivity();
    const alerts = securityMonitor.getActiveAlerts();
    console.log('Alertas após scan:', alerts);
  };

  return (
    <div className="security-example">
      <h2>Exemplo de Security Monitor</h2>
      <button onClick={forceSecurityScan}>
        Executar Scan Manual
      </button>
      <p>O security monitor está rodando em background</p>
    </div>
  );
}

/**
 * Exemplo 4: Uso em React Query
 */
export function AuditWithReactQuery() {
  const logAudit = useLogAuditEvent();

  const createContractMutation = {
    mutationFn: async (contractData: any) => {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar contrato');
      }

      const contract = await response.json();

      // Log do audit após sucesso
      await logAudit.mutateAsync({
        action: 'CREATE',
        entity_type: 'contract',
        entity_id: contract.id,
        new_data: contract,
        metadata: { 
          source: 'react_query',
          timestamp: new Date().toISOString()
        }
      });

      return contract;
    },
    onError: (error: any) => {
      console.error('Erro na mutation:', error);
      
      // Log do erro no audit
      logAudit.mutate({
        action: 'CREATE',
        entity_type: 'contract',
        metadata: {
          error: error.message,
          source: 'react_query',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  return (
    <div className="react-query-example">
      <h2>Exemplo com React Query</h2>
      <p>Use o mutation com audit log integrado</p>
    </div>
  );
}

/**
 * Exemplo 5: Custom Hook de Audit
 */
export function useCustomAudit() {
  const logAudit = useLogAuditEvent();

  const auditContractAction = async (
    action: 'create' | 'update' | 'delete',
    contractId: string,
    data?: any
  ) => {
    const actionMap = {
      create: 'CREATE',
      update: 'UPDATE',
      delete: 'DELETE'
    } as const;

    await logAudit.mutateAsync({
      action: actionMap[action],
      entity_type: 'contract',
      entity_id: contractId,
      old_data: action === 'update' ? data?.old : undefined,
      new_data: data?.new,
      metadata: {
        component: 'useCustomAudit',
        timestamp: new Date().toISOString()
      }
    });
  };

  return { auditContractAction };
}

/**
 * Exemplo 6: Configuração Inicial
 */
export function AuditSetupExample() {
  // Este exemplo mostra como configurar o sistema no início da aplicação
  const setupAuditSystem = () => `
import { auditLogger } from '@/services/audit';
import { securityMonitor } from '@/services/audit';

// No arquivo principal da aplicação (App.tsx, main.tsx)
function App() {
  useEffect(() => {
    // Inicializar audit logger
    console.log('Audit logger inicializado');
    
    // Iniciar monitoring de segurança
    securityMonitor.start(5); // A cada 5 minutos
    
    // Configurar listeners para eventos críticos
    auditLogger.onAuditLogCreated((log) => {
      if (log.action === 'DELETE' && log.resource === 'user') {
        // Notificar administradores sobre deleção de usuário
        console.log('Usuário deletado:', log);
      }
    });
    
    return () => {
      // Cleanup ao desmontar
      securityMonitor.stop();
    };
  }, []);

  return (
    <div className="app">
      {/* Sua aplicação aqui */}
    </div>
  );
}
  `;

  return (
    <div className="setup-example">
      <h2>Configuração Inicial do Sistema</h2>
      <pre>{setupAuditSystem}</pre>
    </div>
  );
}

/**
 * Exemplo 7: Dashboard Integration
 */
export function AuditDashboardIntegration() {
  // Como integrar os dashboards na aplicação
  const dashboardIntegration = `
import { AuditDashboard } from '@/components/audit/AuditDashboard';
import { SecurityDashboard } from '@/components/audit/SecurityDashboard';
import { AdminRoute } from '@/components/AdminRoute';

function AdminPages() {
  return (
    <AdminRoute requiredRole="admin">
      <Routes>
        <Route path="/admin/audit" element={<AuditDashboard />} />
        <Route path="/admin/security" element={<SecurityDashboard />} />
      </Routes>
    </AdminRoute>
  );
}

// Componentes são responsivos e funcionam com todos os temas
// Eles automaticamente se conectam aos dados do Supabase
  `;

  return (
    <div className="dashboard-integration">
      <h2>Integração dos Dashboards</h2>
      <pre>{dashboardIntegration}</pre>
    </div>
  );
}

/**
 * Componente principal que demonstra todos os exemplos
 */
export function AuditSystemExamples() {
  return (
    <div className="audit-system-examples space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          Sistema de Audit Logging - Exemplos de Uso
        </h1>
        <p className="text-gray-600">
          Demonstrações de como usar o sistema de audit em diferentes cenários
        </p>
      </div>

      <AuditExampleComponent />
      <SecurityMonitorExample />
      <AuditWithReactQuery />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AuditBackendExample />
        <AuditSetupExample />
      </div>
      
      <AuditDashboardIntegration />
    </div>
  );
}