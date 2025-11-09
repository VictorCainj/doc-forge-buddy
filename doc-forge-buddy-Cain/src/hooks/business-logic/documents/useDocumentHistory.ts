import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para histórico de documentos
export interface DocumentHistoryEntry {
  id: string;
  documentId: string;
  entityId: string;
  entityType: 'contract' | 'vistoria' | 'user' | 'company';
  action: DocumentAction;
  status: 'success' | 'failure' | 'pending';
  details: DocumentActionDetails;
  metadata: DocumentMetadata;
  version: number;
  parentVersion?: number;
  diff?: DocumentDiff;
  createdBy: string;
  createdAt: Date;
}

export type DocumentAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'generated'
  | 'downloaded'
  | 'shared'
  | 'signed'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'restored'
  | 'version_reverted'
  | 'template_changed'
  | 'format_converted'
  | 'access_granted'
  | 'access_revoked';

export interface DocumentActionDetails {
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  changes?: DocumentFieldChange[];
}

export interface DocumentFieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
  significance: 'low' | 'medium' | 'high' | 'critical';
}

export interface DocumentMetadata {
  templateId?: string;
  templateVersion?: string;
  format?: 'pdf' | 'docx' | 'html';
  fileSize?: number;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  tags?: string[];
  categories?: string[];
  customProperties?: Record<string, any>;
}

export interface DocumentDiff {
  added: DocumentFieldChange[];
  removed: DocumentFieldChange[];
  modified: DocumentFieldChange[];
  summary: {
    totalChanges: number;
    criticalChanges: number;
    highImpactChanges: number;
  };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  label?: string;
  isActive: boolean;
  isArchived: boolean;
  isLatest: boolean;
  size: number;
  format: string;
  checksum: string;
  createdBy: string;
  createdAt: Date;
  changes: DocumentFieldChange[];
  comment?: string;
}

export interface HistoryFilters {
  entityId?: string;
  entityType?: DocumentHistoryEntry['entityType'];
  actions?: DocumentAction[];
  status?: DocumentHistoryEntry['status'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  searchTerm?: string;
  versions?: boolean;
}

export interface AuditTrail {
  entries: DocumentHistoryEntry[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
  summary: {
    totalActions: Record<DocumentAction, number>;
    activeUsers: string[];
    popularActions: DocumentAction[];
    recentActivity: Date;
    criticalChanges: number;
  };
}

export interface ComplianceReport {
  period: {
    start: Date;
    end: Date;
  };
  totalDocuments: number;
  totalActions: number;
  complianceScore: number;
  violations: ComplianceViolation[];
  recommendations: string[];
  statistics: {
    actionsByType: Record<DocumentAction, number>;
    actionsByUser: Record<string, number>;
    actionsByEntity: Record<string, number>;
    failureRate: number;
    averageResponseTime: number;
  };
}

export interface ComplianceViolation {
  id: string;
  type: 'unauthorized_access' | 'data_breach' | 'policy_violation' | 'audit_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedDocuments: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

export function useDocumentHistory(entityId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados locais
  const [filters, setFilters] = useState<HistoryFilters>({
    entityId,
    dateRange: undefined,
    versions: true
  });
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'timeline' | 'table' | 'diff'>('timeline');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Buscar histórico de documentos
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['document-history', entityId, filters],
    queryFn: async (): Promise<AuditTrail> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockHistoryData(entityId);
    },
    enabled: !!entityId,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  // Buscar versões do documento
  const {
    data: versions,
    isLoading: versionsLoading
  } = useQuery({
    queryKey: ['document-versions', entityId],
    queryFn: async (): Promise<DocumentVersion[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockVersions(entityId);
    },
    enabled: !!entityId && filters.versions
  });

  // Mutação para reverter para versão anterior
  const revertVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, revertedVersion: versionId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['document-history', entityId] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', entityId] });
      
      toast({
        title: 'Versão revertida',
        description: 'O documento foi revertido para a versão selecionada',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na reversão',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  });

  // Mutação para exportar histórico
  const exportHistoryMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json' | 'pdf') => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 800));
      return { url: `blob:history-export-${Date.now()}`, format };
    },
    onSuccess: (result) => {
      toast({
        title: 'Histórico exportado',
        description: `Arquivo ${result.format.toUpperCase()} foi gerado`,
      });
    }
  });

  // Calcular diff entre versões
  const calculateDiff = useCallback((fromVersion: number, toVersion: number): DocumentDiff | null => {
    if (!versions) return null;

    const fromVer = versions.find(v => v.version === fromVersion);
    const toVer = versions.find(v => v.version === toVersion);

    if (!fromVer || !toVer) return null;

    const added: DocumentFieldChange[] = [];
    const removed: DocumentFieldChange[] = [];
    const modified: DocumentFieldChange[] = [];

    // Implementar lógica de diff
    fromVer.changes.forEach(change => {
      const correspondingChange = toVer.changes.find(c => c.field === change.field);
      
      if (!correspondingChange) {
        removed.push(change);
      } else if (JSON.stringify(change.oldValue) !== JSON.stringify(correspondingChange.newValue)) {
        modified.push({
          ...correspondingChange,
          oldValue: change.oldValue,
          newValue: correspondingChange.newValue,
          type: 'modified',
          significance: determineSignificance(change.oldValue, correspondingChange.newValue)
        });
      }
    });

    toVer.changes.forEach(change => {
      if (!fromVer.changes.find(c => c.field === change.field)) {
        added.push(change);
      }
    });

    return {
      added,
      removed,
      modified,
      summary: {
        totalChanges: added.length + removed.length + modified.length,
        criticalChanges: [...added, ...removed, ...modified].filter(c => c.significance === 'critical').length,
        highImpactChanges: [...added, ...removed, ...modified].filter(c => c.significance === 'high').length
      }
    };
  }, [versions]);

  // Formatar entry para exibição
  const formatEntry = useCallback((entry: DocumentHistoryEntry) => {
    const timeAgo = formatDistanceToNow(entry.createdAt, { addSuffix: true, locale: ptBR });
    
    return {
      ...entry,
      formattedTime: timeAgo,
      formattedDate: format(entry.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      actionLabel: getActionLabel(entry.action),
      statusColor: getStatusColor(entry.status),
      actionColor: getActionColor(entry.action)
    };
  }, []);

  // Filtrar entries baseado nos filtros
  const filteredEntries = useMemo(() => {
    if (!historyData?.entries) return [];

    return historyData.entries.filter(entry => {
      // Filtro por tipo de entidade
      if (filters.entityType && entry.entityType !== filters.entityType) {
        return false;
      }

      // Filtro por ações
      if (filters.actions?.length && !filters.actions.includes(entry.action)) {
        return false;
      }

      // Filtro por status
      if (filters.status?.length && !filters.status.includes(entry.status)) {
        return false;
      }

      // Filtro por data
      if (filters.dateRange) {
        if (isBefore(entry.createdAt, filters.dateRange.start) || 
            isAfter(entry.createdAt, filters.dateRange.end)) {
          return false;
        }
      }

      // Filtro por usuário
      if (filters.userId && entry.createdBy !== filters.userId) {
        return false;
      }

      // Filtro por termo de busca
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchableText = [
          entry.action,
          entry.details.reason || '',
          entry.metadata.templateId || '',
          ...(entry.changes?.map(c => c.field) || [])
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [historyData?.entries, filters]);

  // Estatísticas do histórico
  const statistics = useMemo(() => {
    if (!historyData) return null;

    const { summary } = historyData;
    const recentEntries = filteredEntries.slice(0, 10);
    const actionDistribution = Object.entries(summary.totalActions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalActions: summary.totalActions,
      popularActions: actionDistribution.map(([action]) => action as DocumentAction),
      recentActivity: recentEntries,
      activeUsers: summary.activeUsers,
      criticalChanges: summary.criticalChanges,
      averageActionsPerDay: Math.round(Object.values(summary.totalActions).reduce((a, b) => a + b, 0) / 30)
    };
  }, [historyData, filteredEntries]);

  // Funções de ação
  const updateFilters = useCallback((newFilters: Partial<HistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const toggleEntrySelection = useCallback((entryId: string) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  }, []);

  const selectAllEntries = useCallback(() => {
    setSelectedEntries(filteredEntries.map(e => e.id));
  }, [filteredEntries]);

  const clearSelection = useCallback(() => {
    setSelectedEntries([]);
  }, []);

  const revertToVersion = useCallback(async (versionId: string) => {
    await revertVersionMutation.mutateAsync(versionId);
  }, [revertVersionMutation]);

  const exportHistory = useCallback(async (format: 'csv' | 'json' | 'pdf') => {
    await exportHistoryMutation.mutateAsync(format);
  }, [exportHistoryMutation]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    // Estado
    historyData: historyData ? {
      ...historyData,
      entries: filteredEntries.map(formatEntry)
    } : null,
    versions,
    filters,
    selectedEntries,
    viewMode,
    expandedEntry,
    isLoading: historyLoading || versionsLoading,
    error: historyError,
    statistics,

    // Ações
    updateFilters,
    toggleEntrySelection,
    selectAllEntries,
    clearSelection,
    revertToVersion,
    exportHistory,
    setViewMode,
    setExpandedEntry: (entryId: string | null) => setExpandedEntry(entryId),
    loadMore,

    // Utilitários
    calculateDiff,
    canLoadMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    hasSelection: selectedEntries.length > 0,
    selectedCount: selectedEntries.length,
    
    // Acesso aos dados
    getEntryById: (id: string) => filteredEntries.find(e => e.id === id),
    getVersionById: (id: string) => versions?.find(v => v.id === id),
    getLatestVersion: () => versions?.find(v => v.isLatest),
    
    // Exportar funções auxiliares
    getActionColor: (action: DocumentAction) => getActionColor(action),
    getStatusColor: (status: DocumentHistoryEntry['status']) => getStatusColor(status),
    formatAction: (action: DocumentAction) => getActionLabel(action)
  };
}

// Funções auxiliares
function generateMockHistoryData(entityId: string): AuditTrail {
  const actions: DocumentAction[] = ['created', 'updated', 'generated', 'downloaded', 'shared', 'approved'];
  const statuses: DocumentHistoryEntry['status'][] = ['success', 'failure', 'pending'];
  
  const entries: DocumentHistoryEntry[] = Array.from({ length: 50 }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    return {
      id: `history-${i + 1}`,
      documentId: `doc-${entityId}`,
      entityId,
      entityType: 'contract',
      action,
      status,
      details: {
        reason: action === 'updated' ? 'Correção de dados' : undefined,
        changes: [
          {
            field: 'title',
            oldValue: `Documento ${i}`,
            newValue: `Documento ${i + 1}`,
            type: 'modified',
            significance: 'medium'
          }
        ]
      },
      metadata: {
        templateId: 'template-1',
        format: 'pdf',
        fileSize: Math.floor(Math.random() * 1000000) + 100000
      },
      version: i + 1,
      createdBy: `user-${Math.floor(Math.random() * 5) + 1}`,
      createdAt
    };
  });

  return {
    entries: entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    totalCount: entries.length,
    hasMore: false,
    summary: {
      totalActions: actions.reduce((acc, action) => {
        acc[action] = entries.filter(e => e.action === action).length;
        return acc;
      }, {} as Record<DocumentAction, number>),
      activeUsers: ['user-1', 'user-2', 'user-3'],
      popularActions: actions,
      recentActivity: entries[0]?.createdAt || new Date(),
      criticalChanges: 2
    }
  };
}

function generateMockVersions(entityId: string): DocumentVersion[] {
  return Array.from({ length: 8 }, (_, i) => {
    const version = i + 1;
    const createdAt = new Date(Date.now() - (8 - version) * 24 * 60 * 60 * 1000);
    
    return {
      id: `version-${version}`,
      documentId: `doc-${entityId}`,
      version,
      label: version === 1 ? 'Versão inicial' : `Versão ${version}`,
      isActive: version === 8,
      isArchived: version < 6,
      isLatest: version === 8,
      size: Math.floor(Math.random() * 500000) + 100000,
      format: 'pdf',
      checksum: `checksum-${version}`,
      createdBy: `user-${Math.floor(Math.random() * 3) + 1}`,
      createdAt,
      changes: [
        {
          field: 'content',
          oldValue: `Versão ${version - 1}`,
          newValue: `Versão ${version}`,
          type: 'modified',
          significance: version === 8 ? 'critical' : 'medium'
        }
      ],
      comment: version === 8 ? 'Versão final aprovada' : undefined
    };
  });
}

function getActionLabel(action: DocumentAction): string {
  const labels = {
    created: 'Criado',
    updated: 'Atualizado',
    deleted: 'Excluído',
    generated: 'Gerado',
    downloaded: 'Baixado',
    shared: 'Compartilhado',
    signed: 'Assinado',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    archived: 'Arquivado',
    restored: 'Restaurado',
    version_reverted: 'Versão revertida',
    template_changed: 'Template alterado',
    format_converted: 'Formato convertido',
    access_granted: 'Acesso concedido',
    access_revoked: 'Acesso revogado'
  };
  return labels[action] || action;
}

function getActionColor(action: DocumentAction): string {
  const colors = {
    created: '#10b981',
    updated: '#3b82f6',
    deleted: '#ef4444',
    generated: '#8b5cf6',
    downloaded: '#6b7280',
    shared: '#f59e0b',
    signed: '#10b981',
    approved: '#10b981',
    rejected: '#ef4444',
    archived: '#6b7280',
    restored: '#3b82f6',
    version_reverted: '#f97316',
    template_changed: '#ec4899',
    format_converted: '#06b6d4',
    access_granted: '#10b981',
    access_revoked: '#ef4444'
  };
  return colors[action] || '#6b7280';
}

function getStatusColor(status: DocumentHistoryEntry['status']): string {
  const colors = {
    success: '#10b981',
    failure: '#ef4444',
    pending: '#f59e0b'
  };
  return colors[status] || '#6b7280';
}

function determineSignificance(oldValue: any, newValue: any): DocumentFieldChange['significance'] {
  // Lógica para determinar significância da mudança
  if (typeof oldValue === 'boolean' || typeof newValue === 'boolean') {
    return 'high';
  }
  if (typeof oldValue === 'number' && Math.abs(Number(oldValue) - Number(newValue)) > 100) {
    return 'high';
  }
  return 'medium';
}