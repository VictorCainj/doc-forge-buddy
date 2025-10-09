-- ============================================================================
-- Sistema de Auditoria e Logs
-- ============================================================================
-- Este arquivo cria toda a infraestrutura necessária para rastrear ações
-- dos usuários e alterações em dados críticos do sistema.

-- Enum para tipos de ação
CREATE TYPE audit_action AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_RESET',
  'BULK_UPDATE',
  'BULK_DELETE',
  'EXPORT',
  'IMPORT',
  'PERMISSION_CHANGE',
  'ROLE_CHANGE',
  'STATUS_CHANGE'
);

-- Tabela principal de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para performance em consultas comuns
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_composite ON public.audit_logs(entity_type, entity_id, created_at DESC);

-- Função auxiliar para registrar auditoria
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action audit_action,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Triggers Automáticos para Auditoria
-- ============================================================================

-- Função genérica de auditoria para triggers
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_action audit_action;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  -- Determinar tipo de ação
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  END IF;

  -- Registrar log de auditoria
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_data,
    v_new_data
  );

  -- Retornar o registro apropriado
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para tabela profiles
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para tabela contracts
CREATE TRIGGER audit_contracts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para tabela prestadores
CREATE TRIGGER audit_prestadores_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.prestadores
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger para tabela vistoria_analises
CREATE TRIGGER audit_vistoria_analises_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.vistoria_analises
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- ============================================================================
-- RLS Policies para Audit Logs
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem visualizar logs de auditoria
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Policy: Sistema pode inserir logs (SECURITY DEFINER nas funções)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Funções de Consulta e Relatórios
-- ============================================================================

-- Função para obter logs de auditoria com filtros
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_user_id UUID DEFAULT NULL,
  p_action audit_action DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  action audit_action,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    p.email as user_email,
    p.full_name as user_name,
    al.action,
    al.entity_type,
    al.entity_id,
    al.old_data,
    al.new_data,
    al.ip_address,
    al.user_agent,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON p.user_id = al.user_id
  WHERE 
    (p_user_id IS NULL OR al.user_id = p_user_id) AND
    (p_action IS NULL OR al.action = p_action) AND
    (p_entity_type IS NULL OR al.entity_type = p_entity_type) AND
    (p_start_date IS NULL OR al.created_at >= p_start_date) AND
    (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas de auditoria
CREATE OR REPLACE FUNCTION public.get_audit_stats(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_events BIGINT,
  events_by_action JSONB,
  events_by_entity JSONB,
  top_users JSONB,
  events_by_day JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total de eventos
    COUNT(*) as total_events,
    
    -- Eventos por ação
    (
      SELECT jsonb_object_agg(action, count)
      FROM (
        SELECT action::text, COUNT(*) as count
        FROM public.audit_logs
        WHERE 
          (p_start_date IS NULL OR created_at >= p_start_date) AND
          (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY action
      ) sub
    ) as events_by_action,
    
    -- Eventos por entidade
    (
      SELECT jsonb_object_agg(entity_type, count)
      FROM (
        SELECT entity_type, COUNT(*) as count
        FROM public.audit_logs
        WHERE 
          (p_start_date IS NULL OR created_at >= p_start_date) AND
          (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY entity_type
        ORDER BY count DESC
        LIMIT 10
      ) sub
    ) as events_by_entity,
    
    -- Top usuários
    (
      SELECT jsonb_agg(user_data)
      FROM (
        SELECT jsonb_build_object(
          'user_id', al.user_id,
          'email', p.email,
          'full_name', p.full_name,
          'count', COUNT(*)
        ) as user_data
        FROM public.audit_logs al
        LEFT JOIN public.profiles p ON p.user_id = al.user_id
        WHERE 
          (p_start_date IS NULL OR al.created_at >= p_start_date) AND
          (p_end_date IS NULL OR al.created_at <= p_end_date)
        GROUP BY al.user_id, p.email, p.full_name
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) sub
    ) as top_users,
    
    -- Eventos por dia
    (
      SELECT jsonb_object_agg(day, count)
      FROM (
        SELECT 
          DATE(created_at) as day,
          COUNT(*) as count
        FROM public.audit_logs
        WHERE 
          (p_start_date IS NULL OR created_at >= p_start_date) AND
          (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY DATE(created_at)
        ORDER BY day DESC
        LIMIT 30
      ) sub
    ) as events_by_day
    
  FROM public.audit_logs
  WHERE 
    (p_start_date IS NULL OR created_at >= p_start_date) AND
    (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comentários e Documentação
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Registro completo de todas as ações e alterações no sistema para fins de auditoria e segurança';
COMMENT ON COLUMN public.audit_logs.action IS 'Tipo de ação realizada';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Tipo de entidade afetada (nome da tabela)';
COMMENT ON COLUMN public.audit_logs.entity_id IS 'ID do registro afetado';
COMMENT ON COLUMN public.audit_logs.old_data IS 'Dados antes da alteração (para UPDATE e DELETE)';
COMMENT ON COLUMN public.audit_logs.new_data IS 'Dados após a alteração (para CREATE e UPDATE)';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Metadados adicionais da ação';


