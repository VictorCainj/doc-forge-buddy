// Smart imports para funcionalidades administrativas
export const adminLibs = {
  // Carregamento assíncrono de bibliotecas administrativas
  loadUserManagement: async () => {
    const { UserManagement } = await import('@/features/admin/userManagement');
    return { UserManagement };
  },

  loadRoleManagement: async () => {
    const { RoleManagement } = await import('@/features/admin/roleManagement');
    return { RoleManagement };
  },

  loadSystemSettings: async () => {
    const { SystemSettings } = await import('@/features/admin/systemSettings');
    return { SystemSettings };
  },

  loadAuditLogs: async () => {
    const { AuditLogs } = await import('@/features/admin/auditLogs');
    return { AuditLogs };
  },

  loadBackupRestore: async () => {
    const { BackupRestore } = await import('@/features/admin/backupRestore');
    return { BackupRestore };
  },

  loadSecuritySettings: async () => {
    const { SecuritySettings } = await import('@/features/admin/securitySettings');
    return { SecuritySettings };
  },

  // Função principal de carregamento
  default: async function() {
    const adminLibs = {
      userManagement: null,
      roleManagement: null,
      systemSettings: null,
      auditLogs: null,
      backupRestore: null,
      securitySettings: null,
    };

    // Carregar funcionalidades administrativas apenas para usuários autorizados
    const loadPromises = [
      // Gerenciamento de usuários
      import('@/features/admin/userManagement')
        .then((module) => {
          adminLibs.userManagement = module.UserManagement;
        })
        .catch(() => console.warn('userManagement module failed to load')),

      // Gerenciamento de papéis
      import('@/features/admin/roleManagement')
        .then((module) => {
          adminLibs.roleManagement = module.RoleManagement;
        })
        .catch(() => console.warn('roleManagement module failed to load')),

      // Configurações do sistema
      import('@/features/admin/systemSettings')
        .then((module) => {
          adminLibs.systemSettings = module.SystemSettings;
        })
        .catch(() => console.warn('systemSettings module failed to load')),

      // Logs de auditoria
      import('@/features/admin/auditLogs')
        .then((module) => {
          adminLibs.auditLogs = module.AuditLogs;
        })
        .catch(() => console.warn('auditLogs module failed to load')),

      // Backup e restauração
      import('@/features/admin/backupRestore')
        .then((module) => {
          adminLibs.backupRestore = module.BackupRestore;
        })
        .catch(() => console.warn('backupRestore module failed to load')),

      // Configurações de segurança
      import('@/features/admin/securitySettings')
        .then((module) => {
          adminLibs.securitySettings = module.SecuritySettings;
        })
        .catch(() => console.warn('securitySettings module failed to load')),
    ];

    await Promise.allSettled(loadPromises);
    
    return adminLibs;
  }
};