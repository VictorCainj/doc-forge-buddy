-- ============================================================================
-- Funções de Verificação de Integridade (Backend)
-- ============================================================================
-- Funções RPC que usam service_role para verificações completas de integridade
-- NOTA: Estas funções só funcionam com privilégios elevados

-- Função para verificar usuários do Auth sem profile
-- Esta função requer ser executada com service_role_key
CREATE OR REPLACE FUNCTION public.check_users_without_profile()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  has_profile BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- NOTA: Esta query usa auth.users que requer privilégios especiais
  -- Verificar se o usuário executando é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
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
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = au.id
    ) as has_profile
  FROM auth.users au
  WHERE NOT EXISTS(
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = au.id
  );
END;
$$;

-- Função para obter estatísticas de integridade completas
CREATE OR REPLACE FUNCTION public.get_integrity_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSONB;
  v_orphan_contracts INT;
  v_orphan_prestadores INT;
  v_orphan_vistorias INT;
  v_duplicate_emails INT;
  v_invalid_profiles INT;
  v_expired_sessions INT;
BEGIN
  -- Verificar permissões de admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta verificação';
  END IF;

  -- Contar contratos órfãos
  SELECT COUNT(*)
  INTO v_orphan_contracts
  FROM public.contracts c
  WHERE c.user_id IS NOT NULL
    AND NOT EXISTS(
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = c.user_id
    );

  -- Contar prestadores órfãos
  SELECT COUNT(*)
  INTO v_orphan_prestadores
  FROM public.prestadores pr
  WHERE pr.user_id IS NOT NULL
    AND NOT EXISTS(
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = pr.user_id
    );

  -- Contar vistorias órfãs
  SELECT COUNT(*)
  INTO v_orphan_vistorias
  FROM public.vistoria_analises va
  WHERE va.user_id IS NOT NULL
    AND NOT EXISTS(
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = va.user_id
    );

  -- Contar emails duplicados
  SELECT COUNT(*)
  INTO v_duplicate_emails
  FROM (
    SELECT email
    FROM public.profiles
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Contar profiles com dados inválidos
  SELECT COUNT(*)
  INTO v_invalid_profiles
  FROM public.profiles
  WHERE email !~ '^[^@]+@[^@]+\.[^@]+$'
    OR role NOT IN ('admin', 'user')
    OR user_id IS NULL
    OR user_id = '';

  -- Contar sessões expiradas mas ativas
  SELECT COUNT(*)
  INTO v_expired_sessions
  FROM public.user_sessions
  WHERE expires_at < now()
    AND is_active = true;

  -- Construir JSON com estatísticas
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
$$;

-- Função para limpar sessões expiradas (manutenção)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions_manual()
RETURNS TABLE (
  sessions_deleted INT,
  oldest_deleted TIMESTAMPTZ,
  newest_deleted TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INT;
  v_oldest TIMESTAMPTZ;
  v_newest TIMESTAMPTZ;
BEGIN
  -- Verificar permissões de admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta operação';
  END IF;

  -- Obter estatísticas antes de deletar
  SELECT 
    COUNT(*),
    MIN(expires_at),
    MAX(expires_at)
  INTO v_deleted, v_oldest, v_newest
  FROM public.user_sessions
  WHERE expires_at < now() - interval '7 days';

  -- Deletar sessões expiradas há mais de 7 dias
  DELETE FROM public.user_sessions
  WHERE expires_at < now() - interval '7 days';

  RETURN QUERY SELECT v_deleted, v_oldest, v_newest;
END;
$$;

-- Função para corrigir profiles órfãos (criar user_id se possível)
CREATE OR REPLACE FUNCTION public.fix_orphan_profiles()
RETURNS TABLE (
  profile_id UUID,
  email TEXT,
  action TEXT,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar permissões de admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta operação';
  END IF;

  -- Esta é uma função placeholder
  -- A correção real depende do caso específico e deve ser feita manualmente
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    'Requer correção manual'::TEXT as action,
    false as success
  FROM public.profiles p
  WHERE p.user_id IS NULL OR p.user_id = '';
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.check_users_without_profile IS 
  'Verifica usuários do Auth sem profile. Requer privilégios de admin.';

COMMENT ON FUNCTION public.get_integrity_stats IS 
  'Retorna estatísticas de integridade do sistema. Requer privilégios de admin.';

COMMENT ON FUNCTION public.cleanup_expired_sessions_manual IS 
  'Remove manualmente sessões expiradas há mais de 7 dias. Requer privilégios de admin.';

COMMENT ON FUNCTION public.fix_orphan_profiles IS 
  'Identifica profiles órfãos que requerem correção manual. Requer privilégios de admin.';

-- ============================================================================
-- NOTA DE USO
-- ============================================================================
-- Estas funções são opcionais e requerem privilégios elevados.
-- Use apenas se necessário para verificações administrativas profundas.
--
-- Exemplo de uso no frontend:
--
-- const { data, error } = await supabase.rpc('get_integrity_stats');
-- console.log('Estatísticas:', data);
--
-- const { data: orphans } = await supabase.rpc('check_users_without_profile');
-- console.log('Usuários sem profile:', orphans);
-- ============================================================================

