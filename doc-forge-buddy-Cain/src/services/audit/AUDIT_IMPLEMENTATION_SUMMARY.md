# Sistema Completo de Audit Logging e Monitoring

## 📋 Visão Geral

Este documento descreve a implementação completa de um sistema de audit logging e monitoring de segurança, seguindo as melhores práticas de auditoria e conformidade.

## 🏗️ Arquitetura

### Componentes Principais

1. **Audit Logger Service** (`/src/services/audit/audit-logger.service.ts`)
2. **Audit Middleware** (`/src/services/audit/audit.middleware.ts`)
3. **Security Monitor Service** (`/src/services/audit/security-monitor.service.ts`)
4. **Audit Dashboard** (`/src/components/audit/AuditDashboard.tsx`)
5. **Security Dashboard** (`/src/components/audit/SecurityDashboard.tsx`)
6. **API Endpoints** (`/src/server/routes/audit.routes.ts`)

## 🚀 Funcionalidades Implementadas

### 1. Audit Logger Service

**Funcionalidades:**
- Logging automático e manual de ações
- Sanitização automática de dados sensíveis
- Armazenamento em banco de dados (Supabase)
- Fallback para localStorage em caso de erro
- Hash de integridade para logs
- Sistema de filas para otimização de performance
- Suporte a eventos customizados

**Ações Suportadas:**
- `CREATE` - Criação de recursos
- `READ` - Leitura de recursos
- `UPDATE` - Atualização de recursos
- `DELETE` - Exclusão de recursos
- `LOGIN` / `LOGOUT` - Autenticação
- `EXPORT` - Exportação de dados
- `PRINT` - Impressão de documentos

**Recursos de Segurança:**
- IP tracking
- User Agent tracking
- Session ID tracking
- Metadata enrichment
- Dados sensíveis redigidos automaticamente

### 2. Audit Middleware

**Funcionalidades:**
- Interceptação automática de requisições HTTP
- Mapeamento automático de métodos HTTP para ações de audit
- Sanitização automática de dados sensíveis
- Middleware especializado para operações críticas
- Suporte a bulk operations
- Tracking de exports e prints
- Eventos de segurança

**Tipos de Middleware:**
- `auditMiddleware` - Middleware geral
- `criticalAudit` - Para ações críticas
- `bulkOperationAudit` - Para operações em massa
- `exportAudit` - Para exportações
- `printAudit` - Para impressões
- `securityAudit` - Para eventos de segurança

### 3. Security Monitor

**Detecção de Ameaças:**
- Tentativas de login falhadas em massa
- Acessos não autorizados
- Operações em massa suspeitas
- Padrões de scanning (múltiplos recursos)
- Exfiltração de dados (exports grandes)

**Tipos de Alertas:**
- `failed_login` - Logins falhados
- `unauthorized_access` - Acessos não autorizados
- `bulk_operation` - Operações em massa
- `suspicious_pattern` - Padrões suspeitos
- `data_exfiltration` - Exfiltração de dados

**Severidades:**
- `low` - Baixa
- `medium` - Média
- `high` - Alta
- `critical` - Crítica

**Notificações:**
- Email para alertas críticos
- Slack/Discord para alertas
- Notificações no navegador
- Log automático no audit

### 4. Dashboards

**Audit Dashboard:**
- Visualização de logs com filtros avançados
- Estatísticas em tempo real
- Exportação de dados
- Detalhes completos de cada log
- Timeline de atividade
- Analytics de ações

**Security Dashboard:**
- Monitoramento de alertas em tempo real
- Estatísticas de segurança
- Resolução de alertas
- Scan manual de segurança
- Analytics de ameaças
- Timeline de incidentes

### 5. API Endpoints

**Audit Logs:**
- `GET /api/audit-logs` - Buscar logs com filtros
- `GET /api/audit-logs/:id` - Buscar log específico
- `POST /api/audit-logs` - Criar log manual
- `GET /api/audit-logs/export` - Exportar logs
- `GET /api/audit-stats` - Estatísticas de audit
- `GET /api/audit-logs/user/:userId` - Logs por usuário

**Security:**
- `GET /api/security/alerts` - Buscar alertas
- `POST /api/security/alerts/:id/resolve` - Resolver alerta
- `GET /api/security/stats` - Estatísticas de segurança
- `POST /api/security/scan` - Scan manual

## 🔧 Configuração

### Variáveis de Ambiente

```env
# External Logging
VITE_EXTERNAL_LOGGING_URL=https://your-logging-service.com/endpoint

# Notifications
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
VITE_EMAIL_SERVICE_URL=https://your-email-service.com/send
VITE_ADMIN_EMAIL=admin@yourcompany.com
```

### Banco de Dados

**Tabela `audit_logs`:**
```sql
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
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
```

**Tabela `security_alerts`:**
```sql
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

CREATE INDEX idx_security_alerts_type ON security_alerts(type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_resolved ON security_alerts(resolved);
```

## 📊 Métricas e KPIs

### Métricas de Audit
- Total de eventos auditados
- Taxa de sucesso das operações
- Usuários mais ativos
- Ações mais frequentes
- Recursos mais acessados
- Timeline de atividade

### Métricas de Segurança
- Alertas ativos vs. resolvidos
- Tentativas de intrusão
- Padrões suspeitos detectados
- Tempo médio de resolução
- Distribuição por severidade
- Tendências de ameaças

## 🔐 Segurança

### Dados Sensíveis
- Senhas, tokens e chaves são automaticamente redigidos
- Metadata enriquecido para forense
- Hash de integridade para detectar alterações
- Session tracking para correlação

### Compliance
- LGPD compliance com dados mínimos necessários
- Retenção configurável de logs
- Exportação para auditorias externas
- Timestamps precisos paraChain of custody

### Monitoramento Contínuo
- Scans automáticos a cada 5 minutos
- Detecção de anomalias em tempo real
- Alertas em múltiplos canais
- Resolução trackable de incidentes

## 🛠️ Uso

### Hook de Audit
```typescript
import { useLogAuditEvent } from '@/hooks/useAuditLog';

const logAudit = useLogAuditEvent();

// Log de ação simples
await logAudit.mutateAsync({
  action: 'CREATE',
  entity_type: 'user',
  entity_id: 'user-123',
  metadata: { source: 'admin_panel' }
});
```

### Audit Logger Service
```typescript
import { auditLogger } from '@/services/audit/audit-logger.service';

// Log de mudança de dados
await auditLogger.logDataChange(
  'user-123',
  AuditAction.UPDATE,
  'user_profile',
  'user-123',
  oldData,
  newData
);
```

### Middleware
```typescript
// No Express
app.use(auditMiddleware);

// Para ações críticas
app.post('/admin/delete-user', 
  criticalAudit(AuditAction.DELETE, 'user'),
  deleteUserHandler
);
```

## 📈 Monitoramento

### Dashboard de Audit
- URL: `/admin/audit`
- Requer: Role `admin`
- Funcionalidades: Visualização, filtros, exportação

### Dashboard de Segurança
- URL: `/admin/security`
- Requer: Role `admin`
- Funcionalidades: Alertas, scan manual, resolução

## 🔍 Troubleshooting

### Logs não aparecem
1. Verificar conexão com Supabase
2. Verificar permissões de RLS
3. Verificar console para erros
4. Verificar se o middleware está ativo

### Alertas não funcionam
1. Verificar configuração de notificações
2. Verificar logs do security monitor
3. Testar scan manual
4. Verificar thresholds de detecção

### Performance
- Sistema usa filas para evitar bloqueios
- Auto-cleanup de logs antigos
- Indexação otimizada no banco
- Lazy loading nos dashboards

## 🚀 Próximos Passos

1. **Integração com SIEM** - Conectar com sistemas de SIEM externos
2. **Machine Learning** - Detecção de anomalias com ML
3. **Geolocalização** - Mapear IPs para geolocalização
4. **Compliance Reports** - Relatórios automáticos para auditoria
5. **Real-time Streaming** - WebSocket para alertas em tempo real

## 📝 Conclusão

O sistema implementado fornece:
- ✅ Audit completo de todas as ações
- ✅ Detecção automática de ameaças
- ✅ Dashboards intuitivos
- ✅ API robusta
- ✅ Notificações multi-canal
- ✅ Compliance e segurança
- ✅ Performance otimizada
- ✅ Fácil manutenção

Este sistema garante rastreabilidade completa e monitoramento proativo de segurança, atendendo às necessidades de compliance e segurança corporativa.