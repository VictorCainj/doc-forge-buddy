-- ============================================================================
-- Sistema de Autenticação Multi-Fator (2FA)
-- ============================================================================

-- Adicionar campo de 2FA à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ DEFAULT now();

-- Tabela para rastrear sessões ativas
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active, expires_at);

-- Tabela para histórico de senhas (prevenir reutilização)
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índice para histórico de senhas
CREATE INDEX idx_password_history_user_id ON public.password_history(user_id);

-- Tabela para tentativas de login
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para tentativas de login
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address, created_at DESC);

-- Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_ip_address TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, success, failure_reason)
  VALUES (p_email, p_ip_address, p_success, p_failure_reason)
  RETURNING id INTO v_attempt_id;
  
  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário está bloqueado por tentativas falhadas
CREATE OR REPLACE FUNCTION public.is_user_locked_out(
  p_email TEXT,
  p_max_attempts INT DEFAULT 5,
  p_lockout_minutes INT DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  v_failed_attempts INT;
  v_lockout_time TIMESTAMPTZ;
BEGIN
  v_lockout_time := now() - (p_lockout_minutes || ' minutes')::interval;
  
  SELECT COUNT(*)
  INTO v_failed_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND created_at > v_lockout_time
    AND success = false;
    
  RETURN v_failed_attempts >= p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar nova sessão
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_device_info JSONB DEFAULT '{}'::jsonb,
  p_expires_hours INT DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_max_sessions INT := 5;
  v_active_sessions INT;
BEGIN
  -- Verificar número de sessões ativas
  SELECT COUNT(*)
  INTO v_active_sessions
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now();
  
  -- Se exceder o limite, desativar a sessão mais antiga
  IF v_active_sessions >= v_max_sessions THEN
    UPDATE public.user_sessions
    SET is_active = false
    WHERE id = (
      SELECT id
      FROM public.user_sessions
      WHERE user_id = p_user_id
        AND is_active = true
      ORDER BY last_activity ASC
      LIMIT 1
    );
  END IF;
  
  -- Criar nova sessão
  INSERT INTO public.user_sessions (
    user_id,
    session_token,
    ip_address,
    user_agent,
    device_info,
    expires_at
  ) VALUES (
    p_user_id,
    p_session_token,
    p_ip_address,
    p_user_agent,
    p_device_info,
    now() + (p_expires_hours || ' hours')::interval
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar atividade da sessão
CREATE OR REPLACE FUNCTION public.update_session_activity(
  p_session_token TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_sessions
  SET last_activity = now()
  WHERE session_token = p_session_token
    AND is_active = true
    AND expires_at > now();
    
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para encerrar sessão
CREATE OR REPLACE FUNCTION public.terminate_session(
  p_session_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter sessões ativas de um usuário
CREATE OR REPLACE FUNCTION public.get_user_active_sessions(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  session_token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    LEFT(us.session_token, 10) || '...' as session_token,
    us.ip_address,
    us.user_agent,
    us.device_info,
    us.last_activity,
    us.created_at,
    us.session_token = current_setting('request.jwt.claim.session_token', true) as is_current
  FROM public.user_sessions us
  WHERE us.user_id = p_user_id
    AND us.is_active = true
    AND us.expires_at > now()
  ORDER BY us.last_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar senha ao histórico
CREATE OR REPLACE FUNCTION public.add_password_to_history(
  p_user_id UUID,
  p_password_hash TEXT,
  p_max_history INT DEFAULT 5
)
RETURNS VOID AS $$
BEGIN
  -- Adicionar nova senha ao histórico
  INSERT INTO public.password_history (user_id, password_hash)
  VALUES (p_user_id, p_password_hash);
  
  -- Manter apenas as últimas N senhas
  DELETE FROM public.password_history
  WHERE user_id = p_user_id
    AND id NOT IN (
      SELECT id
      FROM public.password_history
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT p_max_history
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se senha já foi usada
CREATE OR REPLACE FUNCTION public.is_password_in_history(
  p_user_id UUID,
  p_password_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.password_history
    WHERE user_id = p_user_id
      AND password_hash = p_password_hash
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para limpar sessões expiradas automaticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < now() - interval '7 days';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para limpeza (executado após inserção)
CREATE TRIGGER cleanup_expired_sessions_trigger
  AFTER INSERT ON public.user_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_sessions();

-- RLS Policies
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver suas próprias sessões
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE user_id = user_sessions.user_id));

-- Policy: Admins podem ver todas as sessões
CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Usuários podem terminar suas próprias sessões
CREATE POLICY "Users can terminate own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE user_id = user_sessions.user_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE user_id = user_sessions.user_id));

-- Policy: Sistema pode inserir sessões
CREATE POLICY "System can insert sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Apenas admins podem ver tentativas de login
CREATE POLICY "Admins can view login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Sistema pode inserir tentativas de login
CREATE POLICY "System can insert login attempts"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.user_sessions IS 'Rastreia sessões ativas de usuários para controle e segurança';
COMMENT ON TABLE public.password_history IS 'Histórico de senhas para prevenir reutilização';
COMMENT ON TABLE public.login_attempts IS 'Registro de tentativas de login para detecção de ataques';
COMMENT ON COLUMN public.profiles.two_factor_enabled IS 'Indica se o usuário tem 2FA ativado';
COMMENT ON COLUMN public.profiles.two_factor_secret IS 'Chave secreta para TOTP (criptografada)';
COMMENT ON COLUMN public.profiles.two_factor_backup_codes IS 'Códigos de backup para 2FA';


