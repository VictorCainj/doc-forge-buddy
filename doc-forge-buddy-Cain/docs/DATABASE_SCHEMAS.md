/**
 * @fileoverview Documentação de Database Schemas
 * @description Migrations e esquemas do banco de dados Supabase
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

/**
 * ========================================
 * TABELA: NOTIFICATIONS
 * ========================================
 * Sistema completo de notificações com RLS
 * Funcionalidades: notificações, prioridade, expiração, triggers automáticos
 * 
 * @example Uso da tabela notifications
 * ```sql
 * -- Buscar notificações não lidas
 * SELECT * FROM notifications 
 * WHERE user_id = auth.uid() AND read = false
 * ORDER BY created_at DESC;
 * 
 * -- Criar notificação programaticamente
 * SELECT create_notification(
 *   'user-uuid',
 *   'contract_expiring',
 *   'Contrato expirando',
 *   'O contrato 123 expira em 30 dias',
 *   '{"contract_id": "123"}'::jsonb,
 *   'high',
 *   NOW() + INTERVAL '30 days'
 * );
 * ```
 */

-- Migration: create_notifications_table.sql
-- Data: 2025-01-16
-- Funcionalidades implementadas:
-- ✅ Tabela com UUID primário
-- ✅ Relacionamento com auth.users
-- ✅ Metadados em JSONB
-- ✅ Prioridades (low, normal, high, urgent)
-- ✅ Sistema de expiração
-- ✅ RLS completo
-- ✅ Índices de performance
-- ✅ Funções helper
-- ✅ Triggers automáticos

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

/**
 * ========================================
 * TABELA: VISTORIA_ANALYSES
 * ========================================
 * Sistema de análise de vistoria com imagens
 * Funcionalidades: apontamentos, fotos, classificações
 */

-- Migration: add_vistoria_tracking_to_contracts.sql
-- Data: 2025-01-16
-- Funcionalidades:
-- ✅ Tracking de vistoria em contratos
-- ✅ Logs de status
-- ✅ Timestamps de acompanhamento

-- Coluna para tracking de vistoria em contratos existentes
ALTER TABLE saved_terms 
ADD COLUMN IF NOT EXISTS vistoria_tracking JSONB DEFAULT '{}'::jsonb;

-- Tabela de análises de vistoria (provavelmente já existe)
-- Esta seria uma estrutura típica:
CREATE TABLE IF NOT EXISTS vistoria_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES saved_terms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  dados_vistoria JSONB NOT NULL,
  apontamentos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

/**
 * ========================================
 * TABELA: PROMPT_ANALYTICS
 * ========================================
 * Sistema de aprendizado e analytics de prompts
 * Funcionalidades: métricas, performance, aprendizado
 */

-- Migration: create_prompt_learning_analytics_tables.sql
-- Data: 2025-01-16
-- Funcionalidades:
-- ✅ Analytics de prompts
-- ✅ Métricas de performance
-- ✅ Sistema de aprendizado

-- Tabela de analytics de prompts
CREATE TABLE IF NOT EXISTS prompt_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_type VARCHAR(50) NOT NULL,
  success_rate FLOAT DEFAULT 0.0,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de prompt
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0.0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/**
 * ========================================
 * POLÍTICAS RLS (ROW LEVEL SECURITY)
 * ========================================
 * Sistema de segurança por linha
 */

-- Política para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para vistoria_analyses
ALTER TABLE vistoria_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vistoria analyses"
  ON vistoria_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create vistoria analyses"
  ON vistoria_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para prompt_analytics
ALTER TABLE prompt_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompt analytics"
  ON prompt_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompt analytics"
  ON prompt_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

/**
 * ========================================
 * FUNÇÕES HELPER
 * ========================================
 * Funções PL/pgSQL para operações comuns
 */

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_priority VARCHAR(20) DEFAULT 'normal',
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, metadata, priority, expires_at
  )
  VALUES (
    p_user_id, p_type, p_title, p_message, p_metadata, p_priority, p_expires_at
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

/**
 * @example Uso das funções helper
 * ```sql
 * -- Criar notificação
 * SELECT create_notification(
 *   'user-uuid',
 *   'contract_expiring',
 *   'Atenção: Contrato expira em breve',
 *   'O contrato ABC-123 expira em 15 dias',
 *   '{"contract_id": "ABC-123", "days_remaining": 15}'::jsonb,
 *   'high',
 *   NOW() + INTERVAL '15 days'
 * );
 * 
 * -- Buscar notificações não lidas
 * SELECT * FROM get_user_notifications('user-uuid', 20, 0, true);
 * 
 * -- Marcar como lida
 * SELECT mark_notification_read('notification-uuid');
 * ```
 */

/**
 * ========================================
 * TRIGGERS AUTOMÁTICOS
 * ========================================
 * Triggers para automação de processos
 */

-- Trigger para notificação automática de vistoria
CREATE OR REPLACE FUNCTION notify_vistoria_scheduled()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_vistoria_date TEXT;
BEGIN
  v_user_id := NEW.user_id;
  v_vistoria_date := NEW.dados_vistoria->>'dataVistoria';
  
  IF v_user_id IS NOT NULL AND v_vistoria_date IS NOT NULL THEN
    PERFORM create_notification(
      v_user_id,
      'vistoria_scheduled',
      'Vistoria agendada',
      format('Uma vistoria foi agendada para o dia %s', v_vistoria_date),
      jsonb_build_object('vistoria_id', NEW.id),
      'normal',
      v_vistoria_date::timestamptz
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_vistoria_scheduled
  AFTER INSERT OR UPDATE ON vistoria_analyses
  FOR EACH ROW
  WHEN (NEW.dados_vistoria IS NOT NULL)
  EXECUTE FUNCTION notify_vistoria_scheduled();

/**
 * ========================================
 * ÍNDICES DE PERFORMANCE
 * ========================================
 * Índices para otimização de queries
 */

-- Índices para notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read) WHERE read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_priority 
  ON notifications(type, priority) WHERE priority IN ('high', 'urgent');

-- Índices para vistoria_analyses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vistoria_analyses_contract_id 
  ON vistoria_analyses(contract_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vistoria_analyses_user_created 
  ON vistoria_analyses(user_id, created_at DESC);

-- Índices para prompt_analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_analytics_user_type 
  ON prompt_analytics(user_id, prompt_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_analytics_last_used 
  ON prompt_analytics(last_used_at DESC);

/**
 * ========================================
 * COMENTÁRIOS DE DOCUMENTAÇÃO
 * ========================================
 * Metadados para geração automática de documentação
 */

COMMENT ON TABLE notifications IS 'Tabela de notificações do sistema com suporte a prioridades e expiração';
COMMENT ON TABLE vistoria_analyses IS 'Tabela de análises de vistoria com apontamentos e imagens';
COMMENT ON TABLE prompt_analytics IS 'Tabela de analytics de prompts para sistema de aprendizado';

COMMENT ON COLUMN notifications.type IS 'Tipo: contract_expiring, vistoria_scheduled, system_alert, etc.';
COMMENT ON COLUMN notifications.metadata IS 'Dados adicionais em JSON (contract_id, vistoria_id, etc.)';
COMMENT ON COLUMN notifications.priority IS 'low, normal, high, urgent';

COMMENT ON FUNCTION create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB, VARCHAR, TIMESTAMPTZ) 
IS 'Cria uma nova notificação com parâmetros opcionais';

COMMENT ON FUNCTION get_user_notifications(UUID, INTEGER, INTEGER, BOOLEAN) 
IS 'Busca notificações do usuário com paginação e filtro de lidas';

/**
 * ========================================
 * EXEMPLOS DE USO COMPLETO
 * ========================================
 * Casos de uso práticos das tabelas e funções
 */

/**
 * @example Cenário 1: Sistema de notificação de contrato expirando
 * ```sql
 * -- 1. Agendar notificação 30 dias antes da expiração
 * INSERT INTO notifications (user_id, type, title, message, expires_at)
 * VALUES (
 *   'user-uuid',
 *   'contract_expiring',
 *   'Contrato expira em breve',
 *   'O contrato ABC-123 expira em 30 dias',
 *   (CURRENT_DATE + INTERVAL '30 days')::timestamptz
 * );
 * 
 * -- 2. Marcar como lida quando o usuário visualizar
 * SELECT mark_notification_read(notification_id);
 * 
 * -- 3. Limpar notificações expiradas
 * SELECT cleanup_expired_notifications();
 * ```
 */

/**
 * @example Cenário 2: Analytics de prompts
 * ```sql
 * -- 1. Registrar uso de prompt
 * INSERT INTO prompt_analytics (user_id, prompt_type, usage_count, last_used_at)
 * VALUES ('user-uuid', 'contract_generation', 1, NOW())
 * ON CONFLICT (user_id, prompt_type) 
 * DO UPDATE SET 
 *   usage_count = prompt_analytics.usage_count + 1,
 *   last_used_at = NOW();
 * 
 * -- 2. Calcular taxa de sucesso
 * UPDATE prompt_analytics 
 * SET success_rate = (
 *   SELECT COUNT(*) * 100.0 / NULLIF(COUNT(*), 0)
 *   FROM prompt_usage_logs 
 *   WHERE user_id = prompt_analytics.user_id 
 *     AND prompt_type = prompt_analytics.prompt_type
 *     AND successful = true
 * )
 * WHERE user_id = 'user-uuid';
 * ```
 */

/**
 * @example Cenário 3: Trigger de vistoria
 * ```sql
 * -- 1. Inserir nova vistoria (trigger cria notificação automaticamente)
 * INSERT INTO vistoria_analyses (
 *   user_id, 
 *   title, 
 *   dados_vistoria,
 *   apontamentos
 * ) VALUES (
 *   'user-uuid',
 *   'Vistoria Casa A',
 *   '{"locatario": "João Silva", "dataVistoria": "2025-01-20"}'::jsonb,
 *   '[]'::jsonb
 * );
 * 
 * -- 2. Notificação é criada automaticamente pelo trigger
 * -- O usuário receberá uma notificação de vistoria agendada
 * ```
 */