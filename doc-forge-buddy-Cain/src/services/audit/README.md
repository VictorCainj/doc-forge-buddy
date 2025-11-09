# 🔍 Sistema de Audit Logging e Monitoring

Sistema completo de auditoria e monitoramento de segurança para aplicações web, com detecção automática de atividades suspeitas e visualização em tempo real.

## 🚀 Características Principais

- ✅ **Audit Completo**: Rastreamento automático de todas as ações
- ✅ **Security Monitoring**: Detecção de atividades suspeitas em tempo real
- ✅ **Dashboards Intuitivos**: Visualização de dados com filtros avançados
- ✅ **Alertas Automáticos**: Notificações por email, Slack e navegador
- ✅ **API RESTful**: Endpoints completos para integração
- ✅ **Compliance Ready**: Preparado para auditorias e conformidade LGPD

## 📦 Instalação

### 1. Dependências

```bash
npm install uuid date-fns
```

### 2. Configuração do Banco

```sql
-- Tabela de audit logs
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Tabela de alertas de segurança
CREATE TABLE security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_alerts_resolved ON security_alerts(resolved);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
```

### 3. Variáveis de Ambiente

```env
# Logging externo (opcional)
VITE_EXTERNAL_LOGGING_URL=https://your-logging-service.com/endpoint

# Notificações
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
VITE_EMAIL_SERVICE_URL=https://your-email-service.com/send
VITE_ADMIN_EMAIL=admin@yourcompany.com
```

## 🔧 Uso Rápido

### Frontend - Hook Simples

```typescript
import { useLogAuditEvent } from '@/hooks/useAuditLog';

function MyComponent() {
  const logAudit = useLogAuditEvent();
  
  const handleAction = async () => {
    await logAudit.mutate({
      action: 'CREATE',
      entity_type: 'contract',
      entity_id: 'contract-123',
      metadata: { source: 'user_action' }
    });
  };
  
  return <button onClick={handleAction}>Ação Auditável</button>;
}
```

### Backend - Middleware Automático

```typescript
import { auditMiddleware } from '@/services/audit/audit.middleware';

app.use(auditMiddleware); // Audit automático de todas as rotas

// Ou middleware específico para ações críticas
app.post('/admin/delete', 
  criticalAudit(AuditAction.DELETE, 'user'),
  deleteUserHandler
);
```

### Service - Controle Avançado

```typescript
import { auditLogger } from '@/services/audit/audit-logger.service';

await auditLogger.logDataChange(
  'user-123',
  AuditAction.UPDATE,
  'user_profile',
  'user-123',
  oldData,
  newData
);
```

## 📊 Dashboards

### Audit Dashboard
- **Rota**: `/admin/audit`
- **Funcionalidades**:
  - Visualização de logs com filtros
  - Estatísticas em tempo real
  - Exportação de dados
  - Timeline de atividade

### Security Dashboard
- **Rota**: `/admin/security`
- **Funcionalidades**:
  - Monitoramento de alertas
  - Resolução de incidentes
  - Scan manual de segurança
  - Analytics de ameaças

## 🛡️ Monitoramento de Segurança

### Detecções Automáticas

- **Logins Falhados**: Múltiplas tentativas do mesmo IP
- **Acessos Não Autorizados**: Tentativas de acesso sem permissão
- **Operações em Massa**: Modificações suspeitas em lote
- **Padrões de Scanning**: Acesso a múltiplos recursos
- **Exfiltração**: Exportações suspeitas de dados

### Alertas e Notificações

- **Email**: Para alertas críticos
- **Slack/Discord**: Notificações em tempo real
- **Navegador**: Alertas highs e criticals
- **Audit Log**: Todos os eventos são registrados

## 🔌 API Endpoints

### Audit Logs
```http
GET    /api/audit-logs              # Listar logs com filtros
GET    /api/audit-logs/:id          # Detalhes de um log
POST   /api/audit-logs              # Criar log manual
GET    /api/audit-logs/export       # Exportar logs
GET    /api/audit-stats             # Estatísticas
GET    /api/audit-logs/user/:userId # Logs por usuário
```

### Segurança
```http
GET    /api/security/alerts                  # Listar alertas
POST   /api/security/alerts/:id/resolve      # Resolver alerta
GET    /api/security/stats                   # Estatísticas
POST   /api/security/scan                    # Scan manual
```

## 📈 Métricas e KPIs

### Audit Metrics
- Total de eventos auditados
- Taxa de sucesso das operações
- Usuários mais ativos
- Ações mais frequentes
- Timeline de atividade

### Security Metrics
- Alertas ativos vs. resolvidos
- Tentativas de intrusão
- Padrões suspeitos detectados
- Tempo médio de resolução
- Distribuição por severidade

## 🔐 Segurança e Compliance

### Dados Protegidos
- Senhas e tokens automaticamente redigidos
- IP e User Agent tracking
- Session correlation
- Metadata enriquecido

### LGPD Compliance
- Retenção configurável de logs
- Dados mínimos necessários
- Exportação para auditorias
- Timestamps precisos

## ⚙️ Configuração Avançada

### Retenção de Logs
```typescript
// Configurar retenção (padrão: 1 ano)
export const AUDIT_LOG_RETENTION_DAYS = 365;
```

### Eventos Críticos
```typescript
// Configurar eventos que sempre são logados
export const CRITICAL_AUDIT_EVENTS = [
  'LOGIN',
  'LOGOUT', 
  'PASSWORD_CHANGE',
  'USER_DELETE',
  'ADMIN_ACCESS',
  'DATA_EXPORT',
  'SECURITY_VIOLATION'
];
```

### Thresholds de Segurança
```typescript
// Configurar limites para detecção
const SECURITY_THRESHOLDS = {
  FAILED_LOGINS_PER_HOUR: 10,
  UNAUTHORIZED_ACCESS_PER_HOUR: 5,
  BULK_OPERATIONS_PER_HOUR: 3,
  SCANNING_RESOURCES_PER_HOUR: 20,
  EXPORT_RECORDS_THRESHOLD: 5000
};
```

## 🚨 Troubleshooting

### Logs não aparecem
1. Verificar conexão Supabase
2. Verificar permissões RLS
3. Verificar console para erros
4. Confirmar que middleware está ativo

### Alertas não funcionam
1. Verificar configuração notificações
2. Verificar logs do monitor
3. Testar scan manual
4. Verificar thresholds

### Performance
- Sistema usa filas para não bloquear
- Auto-cleanup de logs antigos
- Indexação otimizada
- Lazy loading nos dashboards

## 🔧 Integração com Outros Sistemas

### Sentry
```typescript
// Integrar com Sentry para erros
import * as Sentry from '@sentry/react';

auditLogger.onAuditLogCreated((log) => {
  if (log.action === 'ERROR') {
    Sentry.captureException(new Error(log.metadata?.error));
  }
});
```

### Google Analytics
```typescript
// Trackear eventos de audit
import { gtag } from 'ga-gtag';

auditLogger.onAuditLogCreated((log) => {
  gtag('event', 'audit_action', {
    action: log.action,
    resource: log.resource,
    user_id: log.userId
  });
});
```

### Custom Webhooks
```typescript
// Enviar para webhook customizado
const webhookUrl = 'https://your-webhook.com/audit';
auditLogger.onAuditLogCreated(async (log) => {
  if (log.action === 'DELETE') {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
  }
});
```

## 📚 Exemplos Completos

Veja o arquivo `src/examples/AuditSystemExamples.tsx` para exemplos completos de uso em diferentes cenários.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@yourcompany.com
- 💬 Slack: #audit-system
- 📖 Documentação: [Link para docs]

---

**Sistema de Audit Logging v1.0** - Monitoramento completo e detecção proativa de segurança.