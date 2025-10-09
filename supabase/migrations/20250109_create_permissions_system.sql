-- ============================================================================
-- Sistema de Permissões Granulares
-- ============================================================================
-- Sistema flexível para gerenciar permissões detalhadas por módulo e ação

-- Enum para módulos do sistema
CREATE TYPE system_module AS ENUM (
  'users',
  'contracts',
  'prestadores',
  'vistorias',
  'documents',
  'reports',
  'audit',
  'settings',
  'admin'
);

-- Enum para ações
CREATE TYPE permission_action AS ENUM (
  'view',
  'create',
  'update',
  'delete',
  'export',
  'import',
  'bulk_edit',
  'manage_permissions'
);

-- Tabela de permissões disponíveis
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module system_module NOT NULL,
  action permission_action NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(module, action)
);

-- Índices para permissões
CREATE INDEX idx_permissions_module ON public.permissions(module);
CREATE INDEX idx_permissions_action ON public.permissions(action);
CREATE INDEX idx_permissions_active ON public.permissions(is_active);

-- Tabela de associação entre roles e permissões
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(role, permission_id)
);

-- Índice para role_permissions
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);

-- Tabela de permissões customizadas por usuário (sobrescreve role)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  granted BOOLEAN NOT NULL, -- true = concede, false = revoga
  granted_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_id)
);

-- Índices para user_permissions
CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON public.user_permissions(permission_id);
CREATE INDEX idx_user_permissions_expires ON public.user_permissions(expires_at);

-- Função para inserir permissões padrão
CREATE OR REPLACE FUNCTION public.insert_default_permissions()
RETURNS VOID AS $$
BEGIN
  -- Permissões de usuários
  INSERT INTO public.permissions (module, action, name, description) VALUES
  ('users', 'view', 'Visualizar Usuários', 'Pode visualizar lista de usuários'),
  ('users', 'create', 'Criar Usuários', 'Pode criar novos usuários'),
  ('users', 'update', 'Editar Usuários', 'Pode editar informações de usuários'),
  ('users', 'delete', 'Deletar Usuários', 'Pode deletar usuários'),
  ('users', 'manage_permissions', 'Gerenciar Permissões', 'Pode gerenciar permissões de usuários'),
  
  -- Permissões de contratos
  ('contracts', 'view', 'Visualizar Contratos', 'Pode visualizar contratos'),
  ('contracts', 'create', 'Criar Contratos', 'Pode criar novos contratos'),
  ('contracts', 'update', 'Editar Contratos', 'Pode editar contratos'),
  ('contracts', 'delete', 'Deletar Contratos', 'Pode deletar contratos'),
  ('contracts', 'export', 'Exportar Contratos', 'Pode exportar contratos'),
  ('contracts', 'bulk_edit', 'Edição em Massa de Contratos', 'Pode editar contratos em massa'),
  
  -- Permissões de prestadores
  ('prestadores', 'view', 'Visualizar Prestadores', 'Pode visualizar prestadores'),
  ('prestadores', 'create', 'Criar Prestadores', 'Pode criar novos prestadores'),
  ('prestadores', 'update', 'Editar Prestadores', 'Pode editar prestadores'),
  ('prestadores', 'delete', 'Deletar Prestadores', 'Pode deletar prestadores'),
  ('prestadores', 'export', 'Exportar Prestadores', 'Pode exportar prestadores'),
  ('prestadores', 'bulk_edit', 'Edição em Massa de Prestadores', 'Pode editar prestadores em massa'),
  
  -- Permissões de vistorias
  ('vistorias', 'view', 'Visualizar Vistorias', 'Pode visualizar vistorias'),
  ('vistorias', 'create', 'Criar Vistorias', 'Pode criar novas vistorias'),
  ('vistorias', 'update', 'Editar Vistorias', 'Pode editar vistorias'),
  ('vistorias', 'delete', 'Deletar Vistorias', 'Pode deletar vistorias'),
  ('vistorias', 'export', 'Exportar Vistorias', 'Pode exportar vistorias'),
  
  -- Permissões de documentos
  ('documents', 'view', 'Visualizar Documentos', 'Pode visualizar documentos'),
  ('documents', 'create', 'Criar Documentos', 'Pode criar novos documentos'),
  ('documents', 'update', 'Editar Documentos', 'Pode editar documentos'),
  ('documents', 'delete', 'Deletar Documentos', 'Pode deletar documentos'),
  ('documents', 'export', 'Exportar Documentos', 'Pode exportar documentos'),
  
  -- Permissões de relatórios
  ('reports', 'view', 'Visualizar Relatórios', 'Pode visualizar relatórios'),
  ('reports', 'create', 'Criar Relatórios', 'Pode criar relatórios customizados'),
  ('reports', 'export', 'Exportar Relatórios', 'Pode exportar relatórios'),
  
  -- Permissões de auditoria
  ('audit', 'view', 'Visualizar Logs de Auditoria', 'Pode visualizar logs de auditoria'),
  ('audit', 'export', 'Exportar Logs de Auditoria', 'Pode exportar logs de auditoria'),
  
  -- Permissões de configurações
  ('settings', 'view', 'Visualizar Configurações', 'Pode visualizar configurações do sistema'),
  ('settings', 'update', 'Alterar Configurações', 'Pode alterar configurações do sistema'),
  
  -- Permissões de administração
  ('admin', 'view', 'Acessar Painel Admin', 'Pode acessar o painel de administração'),
  ('admin', 'manage_permissions', 'Gerenciar Sistema de Permissões', 'Pode gerenciar todo o sistema de permissões')
  
  ON CONFLICT (module, action) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Executar inserção de permissões padrão
SELECT public.insert_default_permissions();

-- Função para atribuir todas as permissões ao role admin
CREATE OR REPLACE FUNCTION public.grant_all_permissions_to_admin()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.role_permissions (role, permission_id)
  SELECT 'admin', id
  FROM public.permissions
  WHERE is_active = true
  ON CONFLICT (role, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Executar atribuição de permissões para admin
SELECT public.grant_all_permissions_to_admin();

-- Função para atribuir permissões básicas ao role user
CREATE OR REPLACE FUNCTION public.grant_basic_permissions_to_user()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.role_permissions (role, permission_id)
  SELECT 'user', id
  FROM public.permissions
  WHERE is_active = true
    AND module IN ('contracts', 'prestadores', 'vistorias', 'documents')
    AND action IN ('view', 'create', 'update', 'export')
  ON CONFLICT (role, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Executar atribuição de permissões básicas para user
SELECT public.grant_basic_permissions_to_user();

-- Função para verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_module system_module,
  p_action permission_action
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
  v_user_role user_role;
  v_permission_id UUID;
  v_custom_permission BOOLEAN;
BEGIN
  -- Obter role do usuário
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Se não encontrou usuário, retornar false
  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Obter ID da permissão
  SELECT id INTO v_permission_id
  FROM public.permissions
  WHERE module = p_module
    AND action = p_action
    AND is_active = true;

  -- Se permissão não existe, retornar false
  IF v_permission_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar permissão customizada do usuário (tem prioridade)
  SELECT granted INTO v_custom_permission
  FROM public.user_permissions
  WHERE user_id = p_user_id
    AND permission_id = v_permission_id
    AND (expires_at IS NULL OR expires_at > now());

  -- Se tem permissão customizada, retornar ela
  IF v_custom_permission IS NOT NULL THEN
    RETURN v_custom_permission;
  END IF;

  -- Verificar permissão do role
  SELECT EXISTS(
    SELECT 1
    FROM public.role_permissions
    WHERE role = v_user_role
      AND permission_id = v_permission_id
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todas as permissões de um usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  module system_module,
  action permission_action,
  name TEXT,
  description TEXT,
  granted_by_role BOOLEAN,
  custom_grant BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
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
    FROM public.permissions p
    INNER JOIN public.role_permissions rp ON rp.permission_id = p.id
    INNER JOIN public.profiles prof ON prof.role = rp.role
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
    FROM public.permissions p
    INNER JOIN public.user_permissions up ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND (up.expires_at IS NULL OR up.expires_at > now())
      AND p.is_active = true
  )
  SELECT * FROM user_role_permissions
  UNION
  SELECT * FROM user_custom_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem visualizar permissões disponíveis
CREATE POLICY "All authenticated users can view permissions"
  ON public.permissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Apenas admins podem modificar permissões
CREATE POLICY "Admins can manage permissions"
  ON public.permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Apenas admins podem visualizar role_permissions
CREATE POLICY "Admins can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Apenas admins podem gerenciar role_permissions
CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Usuários podem ver suas próprias permissões customizadas
CREATE POLICY "Users can view own custom permissions"
  ON public.user_permissions
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Admins podem ver todas as permissões customizadas
CREATE POLICY "Admins can view all custom permissions"
  ON public.user_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins podem gerenciar permissões customizadas
CREATE POLICY "Admins can manage custom permissions"
  ON public.user_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at em permissions
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.permissions IS 'Permissões disponíveis no sistema organizadas por módulo e ação';
COMMENT ON TABLE public.role_permissions IS 'Associação entre roles e permissões';
COMMENT ON TABLE public.user_permissions IS 'Permissões customizadas por usuário que sobrescrevem as permissões do role';
COMMENT ON FUNCTION public.user_has_permission IS 'Verifica se um usuário tem uma permissão específica';
COMMENT ON FUNCTION public.get_user_permissions IS 'Retorna todas as permissões de um usuário (role + customizadas)';

