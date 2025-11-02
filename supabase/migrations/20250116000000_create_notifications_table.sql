-- Migration: Criar tabela de notificações
-- Data: 2025-01-16

-- Criar tabela notifications
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários só podem ver suas próprias notificações
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política RLS: Usuários só podem criar suas próprias notificações
CREATE POLICY "Users can create their own notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política RLS: Usuários só podem atualizar suas próprias notificações
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política RLS: Usuários só podem deletar suas próprias notificações
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

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
    user_id,
    type,
    title,
    message,
    metadata,
    priority,
    expires_at
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_metadata,
    p_priority,
    p_expires_at
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read = true,
      read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Função para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = true,
      read_at = NOW()
  WHERE user_id = p_user_id
    AND read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Função para buscar notificações do usuário
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  metadata JSONB,
  read BOOLEAN,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  priority VARCHAR(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.metadata,
    n.read,
    n.read_at,
    n.created_at,
    n.expires_at,
    n.priority
  FROM notifications n
  WHERE n.user_id = p_user_id
    AND (p_unread_only = false OR n.read = false)
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função para contar notificações não lidas
CREATE OR REPLACE FUNCTION count_unread_notifications(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND read = false
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN v_count;
END;
$$;

-- Função para limpar notificações expiradas (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND read = true; -- Só deleta as lidas
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Tabela de notificações do sistema';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação: contract_expiring, vistoria_scheduled, vistoria_reminder, contract_history, etc.';
COMMENT ON COLUMN notifications.metadata IS 'Dados adicionais em formato JSON (contract_id, vistoria_id, dates, etc.)';
COMMENT ON COLUMN notifications.priority IS 'Prioridade: low, normal, high, urgent';

-- Trigger para criar notificação quando vistoria é agendada
CREATE OR REPLACE FUNCTION notify_vistoria_scheduled()
RETURNS TRIGGER AS $$
DECLARE
  v_contract_id UUID;
  v_contract_number TEXT;
  v_user_id UUID;
  v_data_vistoria JSONB;
  v_vistoria_date TEXT;
  v_vistoria_type TEXT;
BEGIN
  -- Obter dados da vistoria
  v_data_vistoria := NEW.dados_vistoria;
  v_user_id := NEW.user_id;
  v_contract_id := NEW.contract_id;
  
  IF v_data_vistoria IS NOT NULL THEN
    v_vistoria_date := v_data_vistoria->>'dataVistoria';
    v_vistoria_type := v_data_vistoria->>'tipoVistoria' OR v_data_vistoria->>'tipoVistoria';
    
    IF v_vistoria_date IS NOT NULL AND v_user_id IS NOT NULL THEN
      -- Buscar número do contrato
      IF v_contract_id IS NOT NULL THEN
        SELECT form_data->>'numeroContrato' INTO v_contract_number
        FROM saved_terms
        WHERE id = v_contract_id;
      END IF;
      
      IF v_contract_number IS NULL THEN
        v_contract_number := 'N/A';
      END IF;
      
      -- Criar notificação de vistoria agendada
      PERFORM create_notification(
        v_user_id,
        'vistoria_scheduled',
        'Vistoria agendada',
        format('Uma vistoria foi agendada para o contrato %s no dia %s.', v_contract_number, v_vistoria_date),
        jsonb_build_object(
          'vistoria_id', NEW.id,
          'contract_id', v_contract_id,
          'date', v_vistoria_date
        ),
        'normal',
        v_vistoria_date::timestamptz
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_vistoria_scheduled
  AFTER INSERT OR UPDATE OF dados_vistoria ON vistoria_analises
  FOR EACH ROW
  WHEN (NEW.dados_vistoria IS NOT NULL AND (NEW.dados_vistoria->>'dataVistoria') IS NOT NULL)
  EXECUTE FUNCTION notify_vistoria_scheduled();

