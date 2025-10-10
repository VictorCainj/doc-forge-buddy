-- Fix all functions with mutable search_path by adding SET search_path = public

-- 1. create_user_session
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id uuid,
  p_session_token text,
  p_ip_address text,
  p_user_agent text,
  p_device_info jsonb DEFAULT '{}'::jsonb,
  p_expires_hours integer DEFAULT 24
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_session_id UUID;
  v_max_sessions INT := 5;
  v_active_sessions INT;
BEGIN
  SELECT COUNT(*)
  INTO v_active_sessions
  FROM user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now();
  
  IF v_active_sessions >= v_max_sessions THEN
    UPDATE user_sessions
    SET is_active = false
    WHERE id = (
      SELECT id
      FROM user_sessions
      WHERE user_id = p_user_id
        AND is_active = true
      ORDER BY last_activity ASC
      LIMIT 1
    );
  END IF;
  
  INSERT INTO user_sessions (
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
$function$;

-- 2. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. search_similar_messages
CREATE OR REPLACE FUNCTION public.search_similar_messages(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE(
  message_id uuid,
  content text,
  similarity double precision,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id as message_id,
    cm.content,
    1 - (ce.embedding <=> query_embedding) as similarity,
    cm.created_at
  FROM chat_embeddings ce
  JOIN chat_messages cm ON ce.message_id = cm.id
  JOIN chat_sessions cs ON cm.session_id = cs.id
  WHERE 
    1 - (ce.embedding <=> query_embedding) > match_threshold
    AND (user_id_filter IS NULL OR cs.user_id = user_id_filter)
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- 4. grant_basic_permissions_to_user
CREATE OR REPLACE FUNCTION public.grant_basic_permissions_to_user()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO role_permissions (role, permission_id)
  SELECT 'user', id
  FROM permissions
  WHERE is_active = true
    AND module IN ('contracts', 'prestadores', 'vistorias', 'documents')
    AND action IN ('view', 'create', 'update', 'export')
  ON CONFLICT (role, permission_id) DO NOTHING;
END;
$function$;

-- 5. record_login_attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email text,
  p_ip_address text,
  p_success boolean,
  p_failure_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO login_attempts (email, ip_address, success, failure_reason)
  VALUES (p_email, p_ip_address, p_success, p_failure_reason)
  RETURNING id INTO v_attempt_id;
  
  RETURN v_attempt_id;
END;
$function$;

-- 6. log_audit_event
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_action audit_action,
  p_entity_type text,
  p_entity_id uuid,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
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
$function$;

-- 7. user_has_permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id uuid,
  p_module system_module,
  p_action permission_action
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_has_permission BOOLEAN := false;
  v_user_role user_role;
  v_permission_id UUID;
  v_custom_permission BOOLEAN;
BEGIN
  SELECT role INTO v_user_role
  FROM profiles
  WHERE user_id = p_user_id;

  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO v_permission_id
  FROM permissions
  WHERE module = p_module
    AND action = p_action
    AND is_active = true;

  IF v_permission_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT granted INTO v_custom_permission
  FROM user_permissions
  WHERE user_id = p_user_id
    AND permission_id = v_permission_id
    AND (expires_at IS NULL OR expires_at > now());

  IF v_custom_permission IS NOT NULL THEN
    RETURN v_custom_permission;
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM role_permissions
    WHERE role = v_user_role
      AND permission_id = v_permission_id
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$function$;

-- 8. audit_trigger_function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_action audit_action;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
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

  INSERT INTO audit_logs (
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

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- 9. insert_default_permissions
CREATE OR REPLACE FUNCTION public.insert_default_permissions()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO permissions (module, action, name, description) VALUES
  ('users', 'view', 'Visualizar Usuários', 'Pode visualizar lista de usuários'),
  ('users', 'create', 'Criar Usuários', 'Pode criar novos usuários'),
  ('users', 'update', 'Editar Usuários', 'Pode editar informações de usuários'),
  ('users', 'delete', 'Deletar Usuários', 'Pode deletar usuários'),
  ('users', 'manage_permissions', 'Gerenciar Permissões', 'Pode gerenciar permissões de usuários'),
  ('contracts', 'view', 'Visualizar Contratos', 'Pode visualizar contratos'),
  ('contracts', 'create', 'Criar Contratos', 'Pode criar novos contratos'),
  ('contracts', 'update', 'Editar Contratos', 'Pode editar contratos'),
  ('contracts', 'delete', 'Deletar Contratos', 'Pode deletar contratos'),
  ('contracts', 'export', 'Exportar Contratos', 'Pode exportar contratos'),
  ('contracts', 'bulk_edit', 'Edição em Massa de Contratos', 'Pode editar contratos em massa'),
  ('prestadores', 'view', 'Visualizar Prestadores', 'Pode visualizar prestadores'),
  ('prestadores', 'create', 'Criar Prestadores', 'Pode criar novos prestadores'),
  ('prestadores', 'update', 'Editar Prestadores', 'Pode editar prestadores'),
  ('prestadores', 'delete', 'Deletar Prestadores', 'Pode deletar prestadores'),
  ('prestadores', 'export', 'Exportar Prestadores', 'Pode exportar prestadores'),
  ('prestadores', 'bulk_edit', 'Edição em Massa de Prestadores', 'Pode editar prestadores em massa'),
  ('vistorias', 'view', 'Visualizar Vistorias', 'Pode visualizar vistorias'),
  ('vistorias', 'create', 'Criar Vistorias', 'Pode criar novas vistorias'),
  ('vistorias', 'update', 'Editar Vistorias', 'Pode editar vistorias'),
  ('vistorias', 'delete', 'Deletar Vistorias', 'Pode deletar vistorias'),
  ('vistorias', 'export', 'Exportar Vistorias', 'Pode exportar vistorias'),
  ('documents', 'view', 'Visualizar Documentos', 'Pode visualizar documentos'),
  ('documents', 'create', 'Criar Documentos', 'Pode criar novos documentos'),
  ('documents', 'update', 'Editar Documentos', 'Pode editar documentos'),
  ('documents', 'delete', 'Deletar Documentos', 'Pode deletar documentos'),
  ('documents', 'export', 'Exportar Documentos', 'Pode exportar documentos'),
  ('reports', 'view', 'Visualizar Relatórios', 'Pode visualizar relatórios'),
  ('reports', 'create', 'Criar Relatórios', 'Pode criar relatórios customizados'),
  ('reports', 'export', 'Exportar Relatórios', 'Pode exportar relatórios'),
  ('audit', 'view', 'Visualizar Logs de Auditoria', 'Pode visualizar logs de auditoria'),
  ('audit', 'export', 'Exportar Logs de Auditoria', 'Pode exportar logs de auditoria'),
  ('settings', 'view', 'Visualizar Configurações', 'Pode visualizar configurações do sistema'),
  ('settings', 'update', 'Alterar Configurações', 'Pode alterar configurações do sistema'),
  ('admin', 'view', 'Acessar Painel Admin', 'Pode acessar o painel de administração'),
  ('admin', 'manage_permissions', 'Gerenciar Sistema de Permissões', 'Pode gerenciar todo o sistema de permissões')
  ON CONFLICT (module, action) DO NOTHING;
END;
$function$;

-- 10. get_audit_stats
CREATE OR REPLACE FUNCTION public.get_audit_stats(
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  total_events bigint,
  events_by_action jsonb,
  events_by_entity jsonb,
  top_users jsonb,
  events_by_day jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_events,
    (
      SELECT jsonb_object_agg(action, count)
      FROM (
        SELECT action::text, COUNT(*) as count
        FROM audit_logs
        WHERE 
          (p_start_date IS NULL OR created_at >= p_start_date) AND
          (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY action
      ) sub
    ) as events_by_action,
    (
      SELECT jsonb_object_agg(entity_type, count)
      FROM (
        SELECT entity_type, COUNT(*) as count
        FROM audit_logs
        WHERE 
          (p_start_date IS NULL OR created_at >= p_start_date) AND
          (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY entity_type
        ORDER BY count DESC
        LIMIT 10
      ) sub
    ) as events_by_entity,
    (
      SELECT jsonb_agg(user_data)
      FROM (
        SELECT jsonb_build_object(
          'user_id', al.user_id,
          'email', p.email,
          'full_name', p.full_name,
          'count', COUNT(*)
        ) as user_data
        FROM audit_logs al
        LEFT JOIN profiles p ON p.user_id = al.user_id
        WHERE 
          (p_start_date IS NULL OR al.created_at >= p_start_date) AND
          (p_end_date IS NULL OR al.created_at <= p_end_date)
        GROUP BY al.user_id, p.email, p.full_name
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) sub
    ) as top_users,
    (
      SELECT jsonb_object_agg(day, count)
      FROM (
        SELECT 
          DATE(created_at) as day,
          COUNT(*) as count
        FROM audit_logs
        WHERE 
          (p_start_date IS NULL OR created_at >= p_start_date) AND
          (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY DATE(created_at)
        ORDER BY day DESC
        LIMIT 30
      ) sub
    ) as events_by_day
  FROM audit_logs
  WHERE 
    (p_start_date IS NULL OR created_at >= p_start_date) AND
    (p_end_date IS NULL OR created_at <= p_end_date);
END;
$function$;

-- 11. grant_all_permissions_to_admin
CREATE OR REPLACE FUNCTION public.grant_all_permissions_to_admin()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO role_permissions (role, permission_id)
  SELECT 'admin', id
  FROM permissions
  WHERE is_active = true
  ON CONFLICT (role, permission_id) DO NOTHING;
END;
$function$;

-- 12. get_audit_logs
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_user_id uuid DEFAULT NULL,
  p_action audit_action DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  action audit_action,
  entity_type text,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  FROM audit_logs al
  LEFT JOIN profiles p ON p.user_id = al.user_id
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
$function$;

-- 13. terminate_session
CREATE OR REPLACE FUNCTION public.terminate_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE user_sessions
  SET is_active = false
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$function$;

-- 14. update_session_activity
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE user_sessions
  SET last_activity = now()
  WHERE session_token = p_session_token
    AND is_active = true
    AND expires_at > now();
    
  RETURN FOUND;
END;
$function$;

-- 15. check_users_without_profile
CREATE OR REPLACE FUNCTION public.check_users_without_profile()
RETURNS TABLE(
  user_id uuid,
  email text,
  created_at timestamp with time zone,
  has_profile boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta verificação';
  END IF;

  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    au.created_at,
    EXISTS(
      SELECT 1 FROM profiles p 
      WHERE p.user_id = au.id
    ) as has_profile
  FROM auth.users au
  WHERE NOT EXISTS(
    SELECT 1 FROM profiles p 
    WHERE p.user_id = au.id
  );
END;
$function$;

-- 16. get_user_satisfaction_stats
CREATE OR REPLACE FUNCTION public.get_user_satisfaction_stats(user_id_param uuid)
RETURNS TABLE(
  avg_rating numeric,
  total_feedback bigint,
  positive_feedback bigint,
  negative_feedback bigint
)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating), 2) as avg_rating,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE rating >= 4) as positive_feedback,
    COUNT(*) FILTER (WHERE rating <= 2) as negative_feedback
  FROM chat_feedback
  WHERE user_id = user_id_param;
END;
$function$;

-- 17. cleanup_expired_sessions_manual
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions_manual()
RETURNS TABLE(
  sessions_deleted integer,
  oldest_deleted timestamp with time zone,
  newest_deleted timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_deleted INT;
  v_oldest TIMESTAMPTZ;
  v_newest TIMESTAMPTZ;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta operação';
  END IF;

  SELECT 
    COUNT(*),
    MIN(expires_at),
    MAX(expires_at)
  INTO v_deleted, v_oldest, v_newest
  FROM user_sessions
  WHERE expires_at < now() - interval '7 days';

  DELETE FROM user_sessions
  WHERE expires_at < now() - interval '7 days';

  RETURN QUERY SELECT v_deleted, v_oldest, v_newest;
END;
$function$;

-- 18. cleanup_expired_sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < now() - interval '7 days';
  
  RETURN NULL;
END;
$function$;

-- 19. is_password_in_history
CREATE OR REPLACE FUNCTION public.is_password_in_history(
  p_user_id uuid,
  p_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM password_history
    WHERE user_id = p_user_id
      AND password_hash = p_password_hash
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$function$;

-- 20. is_user_locked_out
CREATE OR REPLACE FUNCTION public.is_user_locked_out(
  p_email text,
  p_max_attempts integer DEFAULT 5,
  p_lockout_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_failed_attempts INT;
  v_lockout_time TIMESTAMPTZ;
BEGIN
  v_lockout_time := now() - (p_lockout_minutes || ' minutes')::interval;
  
  SELECT COUNT(*)
  INTO v_failed_attempts
  FROM login_attempts
  WHERE email = p_email
    AND created_at > v_lockout_time
    AND success = false;
    
  RETURN v_failed_attempts >= p_max_attempts;
END;
$function$;

-- 21. get_user_active_sessions
CREATE OR REPLACE FUNCTION public.get_user_active_sessions(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  session_token text,
  ip_address text,
  user_agent text,
  device_info jsonb,
  last_activity timestamp with time zone,
  created_at timestamp with time zone,
  is_current boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  FROM user_sessions us
  WHERE us.user_id = p_user_id
    AND us.is_active = true
    AND us.expires_at > now()
  ORDER BY us.last_activity DESC;
END;
$function$;

-- 22. get_integrity_stats
CREATE OR REPLACE FUNCTION public.get_integrity_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_stats JSONB;
  v_orphan_contracts INT;
  v_orphan_prestadores INT;
  v_orphan_vistorias INT;
  v_duplicate_emails INT;
  v_invalid_profiles INT;
  v_expired_sessions INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta verificação';
  END IF;

  SELECT COUNT(*)
  INTO v_orphan_contracts
  FROM contracts c
  WHERE c.user_id IS NOT NULL
    AND NOT EXISTS(
      SELECT 1 FROM profiles p
      WHERE p.user_id = c.user_id
    );

  SELECT COUNT(*)
  INTO v_orphan_prestadores
  FROM prestadores pr
  WHERE pr.user_id IS NOT NULL
    AND NOT EXISTS(
      SELECT 1 FROM profiles p
      WHERE p.user_id = pr.user_id
    );

  SELECT COUNT(*)
  INTO v_orphan_vistorias
  FROM vistoria_analises va
  WHERE va.user_id IS NOT NULL
    AND NOT EXISTS(
      SELECT 1 FROM profiles p
      WHERE p.user_id = va.user_id
    );

  SELECT COUNT(*)
  INTO v_duplicate_emails
  FROM (
    SELECT email
    FROM profiles
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;

  SELECT COUNT(*)
  INTO v_invalid_profiles
  FROM profiles
  WHERE email !~ '^[^@]+@[^@]+\.[^@]+$'
    OR role NOT IN ('admin', 'user')
    OR user_id IS NULL
    OR user_id = '';

  SELECT COUNT(*)
  INTO v_expired_sessions
  FROM user_sessions
  WHERE expires_at < now()
    AND is_active = true;

  v_stats := jsonb_build_object(
    'orphan_contracts', v_orphan_contracts,
    'orphan_prestadores', v_orphan_prestadores,
    'orphan_vistorias', v_orphan_vistorias,
    'duplicate_emails', v_duplicate_emails,
    'invalid_profiles', v_invalid_profiles,
    'expired_sessions', v_expired_sessions,
    'total_issues', (
      v_orphan_contracts + 
      v_orphan_prestadores + 
      v_orphan_vistorias + 
      v_duplicate_emails + 
      v_invalid_profiles + 
      v_expired_sessions
    ),
    'checked_at', now()
  );

  RETURN v_stats;
END;
$function$;

-- 23. update_knowledge_entry_timestamp
CREATE OR REPLACE FUNCTION public.update_knowledge_entry_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 24. search_knowledge
CREATE OR REPLACE FUNCTION public.search_knowledge(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5,
  user_id_filter uuid DEFAULT NULL,
  source_type_filter text DEFAULT NULL
)
RETURNS TABLE(
  entry_id uuid,
  title text,
  content text,
  similarity double precision,
  source_type text,
  metadata jsonb
)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ke.id as entry_id,
    ke.title,
    ke.content,
    1 - (ke.embedding <=> query_embedding) as similarity,
    ke.source_type,
    ke.metadata
  FROM knowledge_entries ke
  WHERE 
    1 - (ke.embedding <=> query_embedding) > match_threshold
    AND (user_id_filter IS NULL OR ke.user_id = user_id_filter)
    AND (source_type_filter IS NULL OR ke.source_type = source_type_filter)
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- 25. fix_orphan_profiles
CREATE OR REPLACE FUNCTION public.fix_orphan_profiles()
RETURNS TABLE(
  profile_id uuid,
  email text,
  action text,
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta operação';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    'Requer correção manual'::TEXT as action,
    false as success
  FROM profiles p
  WHERE p.user_id IS NULL OR p.user_id = '';
END;
$function$;

-- 26. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  );
  RETURN NEW;
END;
$function$;

-- 27. add_password_to_history
CREATE OR REPLACE FUNCTION public.add_password_to_history(
  p_user_id uuid,
  p_password_hash text,
  p_max_history integer DEFAULT 5
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO password_history (user_id, password_hash)
  VALUES (p_user_id, p_password_hash);
  
  DELETE FROM password_history
  WHERE user_id = p_user_id
    AND id NOT IN (
      SELECT id
      FROM password_history
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT p_max_history
    );
END;
$function$;

-- 28. get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(
  module system_module,
  action permission_action,
  name text,
  description text,
  granted_by_role boolean,
  custom_grant boolean,
  expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  WITH user_role_permissions AS (
    SELECT 
      p.module,
      p.action,
      p.name,
      p.description,
      true as granted_by_role,
      false as custom_grant,
      NULL::TIMESTAMPTZ as expires_at
    FROM permissions p
    INNER JOIN role_permissions rp ON rp.permission_id = p.id
    INNER JOIN profiles prof ON prof.role = rp.role
    WHERE prof.user_id = p_user_id
      AND p.is_active = true
  ),
  user_custom_permissions AS (
    SELECT 
      p.module,
      p.action,
      p.name,
      p.description,
      false as granted_by_role,
      up.granted as custom_grant,
      up.expires_at
    FROM permissions p
    INNER JOIN user_permissions up ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND (up.expires_at IS NULL OR up.expires_at > now())
      AND p.is_active = true
  )
  SELECT * FROM user_role_permissions
  UNION
  SELECT * FROM user_custom_permissions;
END;
$function$;