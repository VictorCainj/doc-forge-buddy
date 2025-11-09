import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';
import { useOptimisticUpdate } from './useOptimisticUpdate';

// Tipos para sincronização em background
export interface SyncEntity {
  id: string;
  type: 'contract' | 'vistoria' | 'document' | 'user' | 'company';
  data: any;
  version: number;
  lastSync: Date;
  status: 'synced' | 'pending' | 'conflicting' | 'error' | 'offline';
  syncMetadata: {
    source: 'local' | 'remote' | 'merged';
    conflicts?: SyncConflict[];
    retryCount: number;
    lastError?: string;
  };
}

export interface SyncConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  localTimestamp: Date;
  remoteTimestamp: Date;
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merged' | 'custom';
  customResolution?: any;
}

export interface SyncOperation {
  id: string;
  entityId: string;
  type: 'create' | 'update' | 'delete' | 'merge';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  retryCount: number;
  maxRetries: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  error?: string;
  result?: any;
  dependencies?: string[];
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // ms
  maxRetries: number;
  batchSize: number;
  conflictResolution: 'manual' | 'local' | 'remote' | 'timestamp' | 'custom';
  enableOffline: boolean;
  enableConflictsDetection: true;
  enableNotifications: true;
  backgroundSync: true;
  syncOnAppStart: true;
  syncOnNetworkRecovery: true;
}

export interface SyncStats {
  totalEntities: number;
  syncedEntities: number;
  pendingEntities: number;
  conflictingEntities: number;
  errorEntities: number;
  offlineEntities: number;
  lastSyncTime: Date | null;
  avgSyncTime: number;
  successRate: number;
  networkStatus: 'online' | 'offline' | 'poor';
  pendingOperations: number;
  failedOperations: number;
}

export interface UseBackgroundSyncOptions {
  entity: string;
  enableOptimistic?: boolean;
  enableOffline?: boolean;
  autoSyncInterval?: number;
  maxRetries?: number;
  conflictResolution?: SyncSettings['conflictResolution'];
}

const DEFAULT_SETTINGS: SyncSettings = {
  autoSync: true,
  syncInterval: 30000, // 30 segundos
  maxRetries: 3,
  batchSize: 10,
  conflictResolution: 'manual',
  enableOffline: true,
  enableConflictsDetection: true,
  enableNotifications: true,
  backgroundSync: true,
  syncOnAppStart: true,
  syncOnNetworkRecovery: true
};

export function useBackgroundSync(
  entity: string,
  options: UseBackgroundSyncOptions = {} as UseBackgroundSyncOptions
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    enableOptimistic = true,
    enableOffline = true,
    autoSyncInterval = 30000,
    maxRetries = 3,
    conflictResolution = 'manual'
  } = options;

  // Estados locais
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    ...DEFAULT_SETTINGS,
    autoSync: options.autoSync ?? DEFAULT_SETTINGS.autoSync,
    syncInterval: options.autoSyncInterval ?? DEFAULT_SETTINGS.syncInterval,
    maxRetries: options.maxRetries ?? DEFAULT_SETTINGS.maxRetries,
    conflictResolution: options.conflictResolution ?? DEFAULT_SETTINGS.conflictResolution,
    enableOffline: options.enableOffline ?? DEFAULT_SETTINGS.enableOffline
  });

  // Refs
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const optimisticUpdateRef = useRef<any>(null);

  // Detectar mudanças na conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncSettings.syncOnNetworkRecovery) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncSettings.syncOnNetworkRecovery]);

  // Query para entidades locais
  const {
    data: localEntities,
    isLoading: localLoading
  } = useQuery({
    queryKey: ['local-entities', entity],
    queryFn: async (): Promise<SyncEntity[]> => {
      // Simulação - buscar entidades do cache local
      return generateMockLocalEntities();
    },
    staleTime: 10000
  });

  // Query para entidades remotas
  const {
    data: remoteEntities,
    isLoading: remoteLoading,
    error: remoteError
  } = useQuery({
    queryKey: ['remote-entities', entity],
    queryFn: async (): Promise<SyncEntity[]> => {
      if (!isOnline) throw new Error('Offline');
      // Simulação - buscar entidades do servidor
      return generateMockRemoteEntities();
    },
    enabled: isOnline,
    staleTime: 30000,
    retry: (failureCount, error) => {
      return isOnline && failureCount < maxRetries;
    }
  });

  // Mutação para sincronização
  const syncMutation = useMutation({
    mutationFn: async (syncData: {
      local: SyncEntity[];
      remote: SyncEntity[];
      conflicts: SyncConflict[];
    }) => {
      // Implementar lógica de sincronização
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await performSync(syncData);
      return result;
    },
    onSuccess: (result) => {
      setLastSyncTime(new Date());
      queryClient.invalidateQueries({ queryKey: ['local-entities', entity] });
      
      if (syncSettings.enableNotifications) {
        toast({
          title: 'Sincronização concluída',
          description: `${result.syncedCount} entidades sincronizadas`,
        });
      }
    },
    onError: (error) => {
      if (syncSettings.enableNotifications) {
        toast({
          title: 'Erro na sincronização',
          description: 'Tente novamente mais tarde',
          variant: 'destructive'
        });
      }
    }
  });

  // Setup do update otimista se habilitado
  useEffect(() => {
    if (enableOptimistic) {
      // Implementar setup do optimistic update
    }
  }, [enableOptimistic]);

  // Detectar conflitos
  const detectConflicts = useCallback((local: SyncEntity[], remote: SyncEntity[]): SyncConflict[] => {
    const conflicts: SyncConflict[] = [];

    local.forEach(localEntity => {
      const remoteEntity = remote.find(r => r.id === localEntity.id);
      
      if (remoteEntity && localEntity.version !== remoteEntity.version) {
        // Conflito de versão detectado
        const fields = Object.keys({ ...localEntity.data, ...remoteEntity.data });
        
        fields.forEach(field => {
          const localValue = localEntity.data[field];
          const remoteValue = remoteEntity.data[field];
          
          if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
            conflicts.push({
              field,
              localValue,
              remoteValue,
              localTimestamp: localEntity.lastSync,
              remoteTimestamp: remoteEntity.lastSync,
              resolved: false
            });
          }
        });
      }
    });

    return conflicts;
  }, []);

  // Executar sincronização
  const performSync = useCallback(async (data: {
    local: SyncEntity[];
    remote: SyncEntity[];
    conflicts?: SyncConflict[];
  }) => {
    const { local, remote, conflicts = [] } = data;
    
    // Resolver conflitos baseado na configuração
    const resolvedConflicts = await resolveConflicts(conflicts, syncSettings.conflictResolution);
    
    // Identificar entidades para sincronizar
    const toSync = determineSyncOperations(local, remote, resolvedConflicts);
    
    // Executar operações de sincronização
    const results = await executeSyncOperations(toSync);
    
    return {
      syncedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      conflicts: resolvedConflicts
    };
  }, [syncSettings.conflictResolution]);

  // Resolver conflitos
  const resolveConflicts = useCallback(async (
    conflicts: SyncConflict[],
    resolution: SyncSettings['conflictResolution']
  ): Promise<SyncConflict[]> => {
    if (conflicts.length === 0) return [];

    switch (resolution) {
      case 'local':
        return conflicts.map(conflict => ({
          ...conflict,
          resolved: true,
          resolution: 'local'
        }));
        
      case 'remote':
        return conflicts.map(conflict => ({
          ...conflict,
          resolved: true,
          resolution: 'remote'
        }));
        
      case 'timestamp':
        return conflicts.map(conflict => {
          const useLocal = conflict.localTimestamp > conflict.remoteTimestamp;
          return {
            ...conflict,
            resolved: true,
            resolution: useLocal ? 'local' : 'remote'
          };
        });
        
      case 'manual':
      case 'custom':
        // Retorna conflitos para resolução manual
        return conflicts;
        
      default:
        return conflicts;
    }
  }, []);

  // Determinar operações de sincronização
  const determineSyncOperations = useCallback((
    local: SyncEntity[],
    remote: SyncEntity[],
    resolvedConflicts: SyncConflict[]
  ): SyncOperation[] => {
    const operations: SyncOperation[] = [];

    // Adicionar entidades locais que não estão no remoto (criadas localmente)
    local.forEach(localEntity => {
      const remoteEntity = remote.find(r => r.id === localEntity.id);
      
      if (!remoteEntity) {
        operations.push({
          id: `create-${localEntity.id}`,
          entityId: localEntity.id,
          type: 'create',
          status: 'pending',
          priority: 'normal',
          retryCount: 0,
          maxRetries
        });
      }
    });

    // Atualizar entidades com mudanças
    local.forEach(localEntity => {
      const remoteEntity = remote.find(r => r.id === localEntity.id);
      
      if (remoteEntity && localEntity.version !== remoteEntity.version) {
        const hasConflict = resolvedConflicts.some(c => !c.resolved);
        
        operations.push({
          id: `update-${localEntity.id}`,
          entityId: localEntity.id,
          type: hasConflict ? 'merge' : 'update',
          status: 'pending',
          priority: hasConflict ? 'high' : 'normal',
          retryCount: 0,
          maxRetries
        });
      }
    });

    return operations;
  }, [maxRetries]);

  // Executar operações de sincronização
  const executeSyncOperations = useCallback(async (operations: SyncOperation[]): Promise<Array<{success: boolean, error?: string}>> => {
    const results = [];
    
    for (const operation of operations) {
      try {
        // Simular execução da operação
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Simular alguns erros para demonstração
        if (Math.random() < 0.1) {
          throw new Error('Erro simulado na sincronização');
        }
        
        results.push({ success: true });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    return results;
  }, []);

  // Trigger manual de sincronização
  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    
    try {
      const localData = localEntities || [];
      const remoteData = remoteEntities || [];
      
      const conflicts = detectConflicts(localData, remoteData);
      
      await syncMutation.mutateAsync({
        local: localData,
        remote: remoteData,
        conflicts
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, localEntities, remoteEntities, detectConflicts, syncMutation]);

  // Adicionar mudança pendente
  const addPendingChange = useCallback((change: any) => {
    setPendingChanges(prev => [...prev, { ...change, timestamp: new Date() }]);
    
    if (enableOffline) {
      // Salvar no localStorage para sincronização offline
      localStorage.setItem(`pending-${entity}`, JSON.stringify([...pendingChanges, change]));
    }
  }, [entity, enableOffline, pendingChanges]);

  // Remover mudança pendente
  const removePendingChange = useCallback((index: number) => {
    setPendingChanges(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Limpar mudanças pendentes
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    if (enableOffline) {
      localStorage.removeItem(`pending-${entity}`);
    }
  }, [entity, enableOffline]);

  // Obter estatísticas de sincronização
  const getSyncStats = useCallback((): SyncStats => {
    const local = localEntities || [];
    const remote = remoteEntities || [];
    
    return {
      totalEntities: local.length,
      syncedEntities: local.filter(e => e.status === 'synced').length,
      pendingEntities: local.filter(e => e.status === 'pending').length,
      conflictingEntities: local.filter(e => e.status === 'conflicting').length,
      errorEntities: local.filter(e => e.status === 'error').length,
      offlineEntities: local.filter(e => e.status === 'offline').length,
      lastSyncTime,
      avgSyncTime: 1500, // Simulado
      successRate: 95.5, // Simulado
      networkStatus: isOnline ? 'online' : 'offline',
      pendingOperations: pendingChanges.length,
      failedOperations: local.filter(e => e.status === 'error').length
    };
  }, [localEntities, remoteEntities, lastSyncTime, isOnline, pendingChanges]);

  // Auto-sync baseado nas configurações
  useEffect(() => {
    if (syncSettings.autoSync && isOnline) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      syncIntervalRef.current = setInterval(() => {
        triggerSync();
      }, syncSettings.syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncSettings.autoSync, syncSettings.syncInterval, isOnline, triggerSync]);

  // Sincronização na inicialização
  useEffect(() => {
    if (syncSettings.syncOnAppStart && localEntities && isOnline) {
      const timer = setTimeout(() => {
        triggerSync();
      }, 1000); // Aguardar 1 segundo após inicialização

      return () => clearTimeout(timer);
    }
  }, [syncSettings.syncOnAppStart, localEntities, isOnline, triggerSync]);

  return {
    // Estado
    isOnline,
    isSyncing,
    localEntities,
    remoteEntities,
    pendingChanges,
    lastSyncTime,
    syncSettings,
    stats: getSyncStats(),
    isLoading: localLoading || (isOnline && remoteLoading),
    error: remoteError,

    // Ações
    triggerSync,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    updateSyncSettings: (newSettings: Partial<SyncSettings>) => {
      setSyncSettings(prev => ({ ...prev, ...newSettings }));
    },

    // Utilitários
    canSync: isOnline && !isSyncing,
    hasPendingChanges: pendingChanges.length > 0,
    getConflicts: () => {
      if (!localEntities || !remoteEntities) return [];
      return detectConflicts(localEntities, remoteEntities);
    },
    isEntitySynced: (entityId: string) => {
      const entity = localEntities?.find(e => e.id === entityId);
      return entity?.status === 'synced';
    }
  };
}

// Funções auxiliares
function generateMockLocalEntities(): SyncEntity[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `local-${i + 1}`,
    type: 'contract',
    data: { title: `Contrato ${i + 1}`, value: 1000 * (i + 1) },
    version: Math.floor(Math.random() * 5) + 1,
    lastSync: new Date(Date.now() - Math.random() * 3600000),
    status: ['synced', 'pending', 'conflicting'][Math.floor(Math.random() * 3)] as any,
    syncMetadata: {
      source: 'local',
      retryCount: 0
    }
  }));
}

function generateMockRemoteEntities(): SyncEntity[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `remote-${i + 1}`,
    type: 'contract',
    data: { title: `Contrato Remoto ${i + 1}`, value: 2000 * (i + 1) },
    version: Math.floor(Math.random() * 5) + 1,
    lastSync: new Date(Date.now() - Math.random() * 1800000),
    status: 'synced',
    syncMetadata: {
      source: 'remote',
      retryCount: 0
    }
  }));
}

// Hook especializado para múltiplas entidades
export function useMultiEntityBackgroundSync(
  entities: string[],
  globalSettings?: Partial<SyncSettings>
) {
  const [overallStatus, setOverallStatus] = useState<'idle' | 'syncing' | 'error' | 'partial'>('idle');
  const [globalStats, setGlobalStats] = useState<SyncStats | null>(null);

  const entitySyncs = entities.map(entity => 
    useBackgroundSync(entity, globalSettings)
  );

  const triggerGlobalSync = useCallback(async () => {
    setOverallStatus('syncing');
    
    try {
      const results = await Promise.allSettled(
        entitySyncs.map(sync => sync.triggerSync())
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      if (successCount === entities.length) {
        setOverallStatus('idle');
      } else if (successCount > 0) {
        setOverallStatus('partial');
      } else {
        setOverallStatus('error');
      }
    } catch (error) {
      setOverallStatus('error');
    }
  }, [entities.length, entitySyncs]);

  // Calcular estatísticas globais
  useEffect(() => {
    if (entitySyncs.length > 0) {
      const combinedStats = entitySyncs.reduce((acc, sync) => {
        const stats = sync.stats;
        return {
          totalEntities: acc.totalEntities + stats.totalEntities,
          syncedEntities: acc.syncedEntities + stats.syncedEntities,
          pendingEntities: acc.pendingEntities + stats.pendingEntities,
          conflictingEntities: acc.conflictingEntities + stats.conflictingEntities,
          errorEntities: acc.errorEntities + stats.errorEntities,
          offlineEntities: acc.offlineEntities + stats.offlineEntities,
          lastSyncTime: acc.lastSyncTime || stats.lastSyncTime,
          avgSyncTime: (acc.avgSyncTime + stats.avgSyncTime) / 2,
          successRate: (acc.successRate + stats.successRate) / 2,
          networkStatus: stats.networkStatus,
          pendingOperations: acc.pendingOperations + stats.pendingOperations,
          failedOperations: acc.failedOperations + stats.failedOperations
        };
      }, {
        totalEntities: 0,
        syncedEntities: 0,
        pendingEntities: 0,
        conflictingEntities: 0,
        errorEntities: 0,
        offlineEntities: 0,
        lastSyncTime: null as Date | null,
        avgSyncTime: 0,
        successRate: 0,
        networkStatus: 'online' as const,
        pendingOperations: 0,
        failedOperations: 0
      });

      setGlobalStats(combinedStats);
    }
  }, [entitySyncs]);

  return {
    entitySyncs,
    overallStatus,
    globalStats,
    triggerGlobalSync
  };
}