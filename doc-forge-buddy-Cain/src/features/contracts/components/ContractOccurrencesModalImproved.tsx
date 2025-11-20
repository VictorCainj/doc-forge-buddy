import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  NotebookPenIcon,
  SparklesIcon,
  EditIcon,
  TrashIcon,
  Loader2,
  ChevronRight,
  MoreVertical,
  FileTextIcon,
  SearchIcon,
  FilterIcon,
  ChevronsUpDownIcon,
  CalendarIcon,
  UserIcon,
  ClipboardListIcon,
  BarChart3Icon,
  XIcon,
  DownloadIcon,
  RefreshCwIcon,
  CopyIcon,
} from '@/utils/iconMapper';
import { useContractOccurrences } from '@/features/contracts/hooks/useContractOccurrences';
import { ContractOccurrence } from '@/types/shared/contract';
import { log } from '@/utils/logger';
import { cn } from '@/lib/utils';
import { useStandardToast } from '@/utils/toastHelpers';
import { useOccurrenceTypes } from '@/hooks/useOccurrenceTypes';

interface ContractOccurrencesModalProps {
  contractId: string;
  contractNumber?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ContractOccurrencesButtonProps {
  contractId: string;
  contractNumber?: string;
}

// Tipos de ocorrência para categorização
export type OccurrenceType =
  | 'aditivo'
  | 'suspensao'
  | 'rescisao'
  | 'multa'
  | 'alteracao_valor'
  | 'vistoria'
  | 'notificacao'
  | 'outro';

export type OccurrenceStatus = 'ativo' | 'concluido' | 'pendente' | 'cancelado';

export type ViewMode = 'timeline' | 'table' | 'compact';

export type SortField = 'date' | 'type' | 'status';
export type SortOrder = 'asc' | 'desc';

interface OccurrenceFilters {
  search: string;
  type: OccurrenceType | 'all';
  status: OccurrenceStatus | 'all';
  dateFrom: string;
  dateTo: string;
  responsible: string;
}

interface EnhancedOccurrence extends ContractOccurrence {
  type?: OccurrenceType;
  status?: OccurrenceStatus;
  responsible?: string;
  financialImpact?: number;
  typeId?: string; // ID do tipo do banco de dados
}

const formatOccurrenceDate = (isoDate: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(isoDate));
  } catch (error) {
    return isoDate;
  }
};

const formatOccurrenceDateShort = (isoDate: string) => {
  try {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (isYesterday) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  } catch (error) {
    return isoDate;
  }
};

const getOccurrenceTypeLabel = (type: OccurrenceType): string => {
  const labels: Record<OccurrenceType, string> = {
    aditivo: 'Aditivo',
    suspensao: 'Suspensão',
    rescisao: 'Rescisão',
    multa: 'Multa',
    alteracao_valor: 'Alteração de Valor',
    vistoria: 'Vistoria',
    notificacao: 'Notificação',
    outro: 'Outro',
  };
  return labels[type] || 'Outro';
};

const getOccurrenceTypeColor = (type: OccurrenceType): string => {
  const colors: Record<OccurrenceType, string> = {
    aditivo: 'bg-blue-100 text-blue-700 border-blue-200',
    suspensao: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    rescisao: 'bg-red-100 text-red-700 border-red-200',
    multa: 'bg-orange-100 text-orange-700 border-orange-200',
    alteracao_valor: 'bg-green-100 text-green-700 border-green-200',
    vistoria: 'bg-purple-100 text-purple-700 border-purple-200',
    notificacao: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    outro: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  };
  return colors[type] || colors.outro;
};

const getStatusLabel = (status: OccurrenceStatus): string => {
  const labels: Record<OccurrenceStatus, string> = {
    ativo: 'Ativo',
    concluido: 'Concluído',
    pendente: 'Pendente',
    cancelado: 'Cancelado',
  };
  return labels[status] || 'Pendente';
};

const getStatusColor = (status: OccurrenceStatus): string => {
  const colors: Record<OccurrenceStatus, string> = {
    ativo: 'bg-green-100 text-green-700 border-green-200',
    concluido: 'bg-blue-100 text-blue-700 border-blue-200',
    pendente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    cancelado: 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] || colors.pendente;
};

// Extrai tipo e status do conteúdo da ocorrência (heurística simples)
const extractOccurrenceMetadata = (
  occurrence: ContractOccurrence
): { type: OccurrenceType; status: OccurrenceStatus } => {
  const content = occurrence.content.toLowerCase();
  let type: OccurrenceType = 'outro';
  let status: OccurrenceStatus = 'pendente';

  // Detectar tipo
  if (content.includes('aditivo') || content.includes('alteração')) {
    type = 'aditivo';
  } else if (content.includes('suspensão') || content.includes('suspenso')) {
    type = 'suspensao';
  } else if (content.includes('rescisão') || content.includes('rescindido')) {
    type = 'rescisao';
  } else if (content.includes('multa')) {
    type = 'multa';
  } else if (content.includes('valor') || content.includes('reajuste')) {
    type = 'alteracao_valor';
  } else if (content.includes('vistoria')) {
    type = 'vistoria';
  } else if (content.includes('notificação') || content.includes('notificacao')) {
    type = 'notificacao';
  }

  // Detectar status
  if (content.includes('concluído') || content.includes('concluido') || content.includes('finalizado')) {
    status = 'concluido';
  } else if (content.includes('ativo') || content.includes('vigente')) {
    status = 'ativo';
  } else if (content.includes('cancelado') || content.includes('cancelada')) {
    status = 'cancelado';
  }

  return { type, status };
};

const isOccurrenceAiImproved = (occurrence: ContractOccurrence): boolean => {
  if (occurrence.ai_corrected) {
    return true;
  }
  const metadata = occurrence.metadata as { aiImproved?: boolean } | null;
  return Boolean(metadata?.aiImproved);
};

export const ContractOccurrencesModalImproved: React.FC<ContractOccurrencesModalProps> = ({
  contractId,
  contractNumber,
  open,
  onOpenChange,
}) => {
  const [newOccurrence, setNewOccurrence] = useState('');
  const [hasImprovedText, setHasImprovedText] = useState(false);
  const [occurrenceTypeId, setOccurrenceTypeId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  
  // Buscar tipos de ocorrência do banco de dados
  const { types: occurrenceTypes, isLoading: isLoadingTypes } = useOccurrenceTypes();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<OccurrenceFilters>({
    search: '',
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    responsible: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    occurrences,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isImproving,
    createOccurrence,
    updateOccurrence,
    deleteOccurrence,
    improveOccurrenceText,
    refetch,
  } = useContractOccurrences(contractId);
  const { showError, showSuccess } = useStandardToast();

  const [editingOccurrenceId, setEditingOccurrenceId] = useState<string | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<Record<string, unknown> | null>(null);
  const [deletingOccurrenceId, setDeletingOccurrenceId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      void refetch();
      return;
    }

    setNewOccurrence('');
    setHasImprovedText(false);
    setOccurrenceTypeId('');
    setEditingOccurrenceId(null);
    setEditingMetadata(null);
    setDeletingOccurrenceId(null);
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      responsible: '',
    });
    setShowFilters(false);
  }, [open, refetch]);

  // Processar ocorrências com metadados
  const enhancedOccurrences = useMemo<EnhancedOccurrence[]>(() => {
    return occurrences.map((occ) => {
      const metadata = (occ.metadata as Record<string, unknown> | null) ?? null;
      const typeId = metadata?.type_id as string | undefined;
      
      // Tentar obter tipo do banco de dados primeiro
      let type: OccurrenceType | undefined;
      if (typeId) {
        const dbType = occurrenceTypes.find((t) => t.id === typeId);
        if (dbType) {
          // Criar um tipo compatível com o sistema antigo para manter compatibilidade
          type = 'outro' as OccurrenceType; // Usaremos o nome do banco diretamente
        }
      }
      
      // Se não encontrou no banco, extrair do conteúdo
      if (!type) {
        const extracted = extractOccurrenceMetadata(occ);
        type = extracted.type;
      }
      
      const { status } = extractOccurrenceMetadata(occ);
      return {
        ...occ,
        type,
        status,
        typeId, // Adicionar typeId para uso na visualização
      };
    });
  }, [occurrences, occurrenceTypes]);

  // Filtrar e ordenar ocorrências
  const filteredAndSortedOccurrences = useMemo(() => {
    let filtered = [...enhancedOccurrences];

    // Aplicar filtro de busca
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (occ) =>
          occ.content.toLowerCase().includes(searchLower) ||
          getOccurrenceTypeLabel(occ.type || 'outro').toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro de tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter((occ) => occ.type === filters.type);
    }

    // Aplicar filtro de status
    if (filters.status !== 'all') {
      filtered = filtered.filter((occ) => occ.status === filters.status);
    }

    // Aplicar filtro de data
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((occ) => new Date(occ.created_at) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((occ) => new Date(occ.created_at) <= toDate);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'type':
          comparison =
            (a.type || 'outro').localeCompare(b.type || 'outro');
          break;
        case 'status':
          comparison =
            (a.status || 'pendente').localeCompare(b.status || 'pendente');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [enhancedOccurrences, filters, sortField, sortOrder]);

  const handleOpenChange = useCallback(
    (state: boolean) => {
      onOpenChange(state);
    },
    [onOpenChange]
  );

  const handleImproveText = useCallback(async () => {
    try {
      const improved = await improveOccurrenceText(newOccurrence);
      setNewOccurrence(improved);
      setHasImprovedText(true);
    } catch (error) {
      log.error('Falha ao melhorar texto da ocorrência', error);
    }
  }, [improveOccurrenceText, newOccurrence]);

  const handleStartEdit = useCallback((occurrence: ContractOccurrence) => {
    setEditingOccurrenceId(occurrence.id);
    setNewOccurrence(occurrence.content);
    setHasImprovedText(isOccurrenceAiImproved(occurrence));
    const metadata = (occurrence.metadata as Record<string, unknown> | null) ?? null;
    setEditingMetadata(metadata);
    // Priorizar tipo dos metadados (ID do tipo)
    const metadataTypeId = metadata?.type_id as string | undefined;
    if (metadataTypeId) {
      setOccurrenceTypeId(metadataTypeId);
    } else {
      setOccurrenceTypeId('');
    }
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingOccurrenceId(null);
    setEditingMetadata(null);
    setNewOccurrence('');
    setHasImprovedText(false);
    setOccurrenceTypeId('');
  }, []);

  const handleCopyOccurrence = useCallback(
    async (occurrence: ContractOccurrence) => {
      try {
        // Verificar se há tipo nos metadados
        const metadata = (occurrence.metadata as Record<string, unknown> | null) ?? null;
        const typeId = metadata?.type_id as string | undefined;
        
        let typeLabel = '';
        if (typeId) {
          const type = occurrenceTypes.find((t) => t.id === typeId);
          if (type) {
            typeLabel = type.name;
          }
        }
        
        // Se não encontrou tipo por ID, tentar extrair do conteúdo
        if (!typeLabel) {
          const extracted = extractOccurrenceMetadata(occurrence);
          if (extracted.type && extracted.type !== 'outro') {
            typeLabel = getOccurrenceTypeLabel(extracted.type);
          }
        }
        
        const date = formatOccurrenceDate(occurrence.created_at);
        
        const textToCopy = [
          typeLabel && `Tipo: ${typeLabel}`,
          `Data: ${date}`,
          '',
          occurrence.content,
        ]
          .filter(Boolean)
          .join('\n');

        await navigator.clipboard.writeText(textToCopy);
        showSuccess('printed', {
          title: 'Ocorrência copiada',
          description: 'A ocorrência foi copiada para a área de transferência.',
        });
      } catch (error) {
        log.error('Erro ao copiar ocorrência', error);
        showError('load', {
          title: 'Erro ao copiar',
          description: 'Não foi possível copiar a ocorrência. Tente novamente.',
        });
      }
    },
    [showSuccess, showError, occurrenceTypes]
  );

  const handleDeleteOccurrence = useCallback(
    async (occurrence: ContractOccurrence) => {
      const confirmed = window.confirm(
        'Tem certeza de que deseja remover esta ocorrência? Esta ação não pode ser desfeita.'
      );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingOccurrenceId(occurrence.id);
        await deleteOccurrence(occurrence.id);

        if (editingOccurrenceId === occurrence.id) {
          handleCancelEdit();
        }
      } catch (error) {
        log.error('Falha ao remover ocorrência', error);
      } finally {
        setDeletingOccurrenceId(null);
      }
    },
    [deleteOccurrence, editingOccurrenceId, handleCancelEdit]
  );

  const handleExportHtml = useCallback(() => {
    if (!filteredAndSortedOccurrences.length) {
      showError('load', {
        title: 'Nenhuma ocorrência encontrada',
        description: 'Adicione ao menos uma ocorrência antes de exportar o relatório.',
      });
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const rows = filteredAndSortedOccurrences
      .map((occurrence, index) => {
        const formattedDate = formatOccurrenceDate(occurrence.created_at);
        const content = escapeHtml(occurrence.content).replace(/\n/g, '<br />');
        const type = getOccurrenceTypeLabel(occurrence.type || 'outro');
        const status = getStatusLabel(occurrence.status || 'pendente');

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formattedDate)}</td>
            <td>${escapeHtml(type)}</td>
            <td>${escapeHtml(status)}</td>
            <td>${content}</td>
          </tr>
        `;
      })
      .join('\n');

    const generatedAt = new Date().toLocaleString('pt-BR');
    const identifier = (contractNumber || contractId || 'relatorio').toString();
    const sanitizedIdentifier = identifier
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .toLowerCase();
    const safeIdentifier =
      sanitizedIdentifier.length > 0 ? sanitizedIdentifier : 'contrato';
    const title = contractNumber
      ? `Contrato ${contractNumber}`
      : contractId
      ? `Contrato ${contractId}`
      : 'Contrato';

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de Ocorrências - ${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 32px; color: #1f2937; background-color: #f8fafc; }
    header { margin-bottom: 24px; }
    h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
    .meta { font-size: 14px; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); border-radius: 12px; overflow: hidden; }
    thead { background: linear-gradient(135deg, #2563eb, #4f46e5); color: #fff; }
    th, td { padding: 16px; text-align: left; font-size: 14px; vertical-align: top; }
    tbody tr:nth-child(odd) { background-color: #ffffff; }
    tbody tr:nth-child(even) { background-color: #f8fafc; }
    tbody tr:hover { background-color: #dbeafe; }
    th { text-transform: uppercase; letter-spacing: 0.05em; font-size: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>Relatório de Ocorrências</h1>
    <p class="meta"><strong>${escapeHtml(title)}</strong></p>
    <p class="meta">Gerado em ${escapeHtml(generatedAt)}</p>
    <p class="meta">Total de ocorrências: ${filteredAndSortedOccurrences.length}</p>
  </header>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Data</th>
        <th>Tipo</th>
        <th>Status</th>
        <th>Descrição</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

    try {
      const blob = new Blob([htmlContent], {
        type: 'text/html;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-ocorrencias-${safeIdentifier}-${new Date()
        .toISOString()
        .slice(0, 10)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('printed', {
        title: 'Relatório exportado',
        description: 'O arquivo HTML foi gerado com sucesso.',
      });
    } catch (error) {
      log.error('Erro ao exportar ocorrências em HTML', error);
      showError('load', {
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o arquivo HTML. Tente novamente.',
      });
    }
  }, [
    contractId,
    contractNumber,
    filteredAndSortedOccurrences,
    showError,
    showSuccess,
  ]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmed = newOccurrence.trim();
      if (!trimmed) {
        return;
      }

      try {
        const metadataPayload = {
          ...(editingMetadata ?? {}),
          aiImproved: hasImprovedText,
        } as Record<string, unknown>;

        // Remover tipo se não foi especificado, ou adicionar/atualizar se foi
        const finalMetadata = {
          ...metadataPayload,
          ...(occurrenceTypeId ? { type_id: occurrenceTypeId } : {}),
        } as Record<string, unknown>;
        
        // Se não há tipo e havia um tipo anterior nos metadados, removê-lo
        if (!occurrenceTypeId && metadataPayload.type_id) {
          delete finalMetadata.type_id;
        }
        // Remover tipo antigo se existir
        if (metadataPayload.type) {
          delete finalMetadata.type;
        }

        if (editingOccurrenceId) {
          await updateOccurrence({
            id: editingOccurrenceId,
            content: trimmed,
            aiCorrected: hasImprovedText,
            metadata: finalMetadata,
          });
        } else {
          await createOccurrence({
            content: trimmed,
            aiCorrected: hasImprovedText,
            metadata: finalMetadata,
          });
        }

        setNewOccurrence('');
        setHasImprovedText(false);
        setOccurrenceTypeId('');
        setEditingOccurrenceId(null);
        setEditingMetadata(null);
      } catch (error) {
        log.error('Falha ao registrar ocorrência', error);
      }
    },
    [
      createOccurrence,
      updateOccurrence,
      editingMetadata,
      editingOccurrenceId,
      hasImprovedText,
      newOccurrence,
      occurrenceTypeId,
    ]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      responsible: '',
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.type !== 'all' ||
      filters.status !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filters.responsible !== ''
    );
  }, [filters]);

  const isEditing = Boolean(editingOccurrenceId);
  const hasOccurrences = useMemo(
    () => occurrences.length > 0,
    [occurrences.length]
  );

  const isImproveDisabled = useMemo(
    () => !newOccurrence.trim() || isImproving,
    [isImproving, newOccurrence]
  );

  const isSubmitDisabled = useMemo(
    () =>
      !newOccurrence.trim() || (isEditing ? isUpdating : isCreating),
    [isCreating, isEditing, isUpdating, newOccurrence]
  );

  const submitButtonLabel = isEditing
    ? 'Salvar ocorrência'
    : 'Registrar ocorrência';

  const submitButtonLoadingText = isEditing
    ? 'Salvando...'
    : 'Registrando...';

  return (
    <DialogContent
      className="flex max-w-7xl w-[98vw] max-h-[95vh] flex-col overflow-hidden border-none p-0 bg-gradient-to-br from-neutral-50 to-white shadow-2xl"
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      {/* Header Moderno */}
      <DialogHeader className="px-8 pt-8 pb-6 border-b border-neutral-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                <NotebookPenIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-neutral-900 tracking-tight">
                  Ocorrências do Contrato
                </DialogTitle>
                {contractNumber && (
                  <p className="text-sm font-medium text-neutral-500 mt-1">
                    Contrato #{contractNumber}
                  </p>
                )}
              </div>
            </div>
            <DialogDescription className="text-base text-neutral-600 leading-relaxed max-w-2xl">
              Registre negociações e informações importantes que o gerente deve considerar no curso do processo contratual.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {hasOccurrences && (
              <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">
                  Total
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {occurrences.length}
                </div>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleExportHtml}
              disabled={filteredAndSortedOccurrences.length === 0}
              size="lg"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <DownloadIcon className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </DialogHeader>

      {/* Barra de Filtros e Busca */}
      <div className="px-8 py-4 border-b border-neutral-200/60 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          {/* Busca e Controles Principais */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Buscar ocorrências..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-10 pr-4 h-10"
              />
            </div>

            {/* Botão de Filtros */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              size="lg"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 h-10',
                showFilters && 'bg-blue-50 border-blue-300 text-blue-700'
              )}
            >
              <FilterIcon className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {[
                    filters.type !== 'all' ? 1 : 0,
                    filters.status !== 'all' ? 1 : 0,
                    filters.dateFrom ? 1 : 0,
                    filters.dateTo ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <Select
                value={sortField}
                onValueChange={(value) => setSortField(value as SortField)}
              >
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="type">Tipo</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
                className="h-10 w-10"
                title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
              >
                <ChevronsUpDownIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Modo de Visualização */}
            <div className="flex items-center gap-1 border border-neutral-200 rounded-lg p-1 bg-white">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'h-8 w-8',
                  viewMode === 'timeline' &&
                    'bg-blue-100 text-blue-700 hover:bg-blue-200'
                )}
                title="Visualização em Timeline"
              >
                <ClipboardListIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('table')}
                className={cn(
                  'h-8 w-8',
                  viewMode === 'table' &&
                    'bg-blue-100 text-blue-700 hover:bg-blue-200'
                )}
                title="Visualização em Tabela"
              >
                <BarChart3Icon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('compact')}
                className={cn(
                  'h-8 w-8',
                  viewMode === 'compact' &&
                    'bg-blue-100 text-blue-700 hover:bg-blue-200'
                )}
                title="Visualização Compacta"
              >
                <BarChart3Icon className="h-4 w-4 rotate-45" />
              </Button>
            </div>
          </div>

          {/* Painel de Filtros Expandido */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              {/* Tipo */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Tipo
                </label>
                <Select
                  value={filters.type}
                  onValueChange={(value) =>
                    setFilters({ ...filters, type: value as OccurrenceType | 'all' })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="aditivo">Aditivo</SelectItem>
                    <SelectItem value="suspensao">Suspensão</SelectItem>
                    <SelectItem value="rescisao">Rescisão</SelectItem>
                    <SelectItem value="multa">Multa</SelectItem>
                    <SelectItem value="alteracao_valor">Alteração de Valor</SelectItem>
                    <SelectItem value="vistoria">Vistoria</SelectItem>
                    <SelectItem value="notificacao">Notificação</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Status
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      status: value as OccurrenceStatus | 'all',
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Inicial */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="h-9"
                />
              </div>

              {/* Data Final */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="h-9"
                />
              </div>

              {/* Botão Limpar Filtros */}
              {hasActiveFilters && (
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClearFilters}
                    size="sm"
                    className="text-xs"
                  >
                    <XIcon className="h-3 w-3 mr-1" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Indicador de Resultados */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span>
                Mostrando {filteredAndSortedOccurrences.length} de{' '}
                {occurrences.length} ocorrências
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr] items-start">
          {/* Coluna Esquerda: Formulário */}
          <div className="flex flex-col">
            <Card className="flex flex-col shadow-lg border-neutral-200/80 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-neutral-100">
                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-blue-600" />
                  {isEditing ? 'Editar Ocorrência' : 'Nova Ocorrência'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col pt-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="occurrence-type"
                      className="text-xs font-semibold text-neutral-700 uppercase tracking-wide"
                    >
                      Tipo de Ocorrência
                    </label>
                    <Select
                      value={occurrenceTypeId || 'manual'}
                      onValueChange={(value) =>
                        setOccurrenceTypeId(value === 'manual' ? '' : value)
                      }
                      disabled={isLoadingTypes}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={isLoadingTypes ? "Carregando tipos..." : "Opcional - Selecione o tipo ou descreva manualmente"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Não especificar (descrever manualmente)</SelectItem>
                        {occurrenceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="contract-occurrence"
                      className="text-xs font-semibold text-neutral-700 uppercase tracking-wide"
                    >
                      Informação para o Gerente
                    </label>
                    <Textarea
                      id="contract-occurrence"
                      placeholder="Descreva o tipo de ocorrência e registre negociações ou informações importantes que o gerente deve considerar no curso do processo contratual..."
                      value={newOccurrence}
                      onChange={(event) => {
                        setNewOccurrence(event.target.value);
                        setHasImprovedText(false);
                      }}
                      rows={4}
                      className="resize-y min-h-[80px] text-sm leading-relaxed border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-3 border-t border-neutral-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImproveText}
                        disabled={isImproveDisabled || (isEditing && isUpdating)}
                        size="sm"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <SparklesIcon className="h-3 w-3" />
                        Melhorar
                      </Button>
                      {hasImprovedText && (
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-600 px-2 py-0.5 text-xs font-medium rounded-full"
                        >
                          ✓ IA
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {isEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          size="sm"
                          className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                        >
                          Cancelar
                        </Button>
                      )}
                      <LoadingButton
                        type="submit"
                        loading={isEditing ? isUpdating : isCreating}
                        loadingText={submitButtonLoadingText}
                        disabled={isSubmitDisabled}
                        size="sm"
                        className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      >
                        {submitButtonLabel}
                      </LoadingButton>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Histórico */}
          <div className="flex flex-col">
            <Card className="flex flex-col shadow-lg border-neutral-200/80 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full bg-gradient-to-b from-neutral-400 to-neutral-500" />
                    Histórico
                  </CardTitle>
                  {hasOccurrences && (
                    <Badge className="bg-blue-100 text-blue-700 border-0 px-2 py-0.5 text-xs font-bold rounded-full">
                      {filteredAndSortedOccurrences.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col pt-4 overflow-hidden">
                {isLoading ? (
                  <div className="space-y-4">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className="animate-pulse space-y-3 rounded-xl border border-neutral-200 bg-white p-5"
                      >
                        <div className="h-4 w-32 rounded-lg bg-neutral-200" />
                        <div className="h-4 w-full rounded-lg bg-neutral-200" />
                        <div className="h-4 w-3/4 rounded-lg bg-neutral-200" />
                      </div>
                    ))}
                  </div>
                ) : filteredAndSortedOccurrences.length > 0 ? (
                  <div className="flex-1 overflow-y-auto pr-4">
                    {viewMode === 'timeline' && (
                      <div className="relative space-y-6 pb-6 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-blue-200 before:via-neutral-200 before:to-transparent">
                        {filteredAndSortedOccurrences.map((occurrence, index) => {
                          const aiImproved = isOccurrenceAiImproved(occurrence);
                          const isCurrentEditing =
                            editingOccurrenceId === occurrence.id;
                          const isCurrentDeleting =
                            deletingOccurrenceId === occurrence.id;
                          const isLast =
                            index === filteredAndSortedOccurrences.length - 1;
                          const type = occurrence.type || 'outro';
                          const status = occurrence.status || 'pendente';

                          return (
                            <article key={occurrence.id} className="relative">
                              <span
                                className={cn(
                                  'absolute left-[-6px] top-6 z-10 h-3 w-3 rounded-full border-2 border-white transition-colors duration-200',
                                  isCurrentEditing
                                    ? 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.25)]'
                                    : 'bg-neutral-300 shadow-[0_0_0_3px_rgba(148,163,184,0.15)]',
                                  !isLast &&
                                    'after:absolute after:left-1/2 after:top-3 after:h-[calc(100%-12px)] after:w-px after:-translate-x-1/2 after:bg-neutral-200'
                                )}
                              />
                              <div
                                className={cn(
                                  'group rounded-xl border bg-white p-5 pl-7 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300',
                                  isCurrentEditing &&
                                    'border-blue-400 bg-blue-50/50 shadow-lg ring-2 ring-blue-200/50',
                                  !isCurrentEditing && 'border-neutral-200/70'
                                )}
                              >
                                <header className="flex items-start justify-between gap-4 mb-3">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                        {formatOccurrenceDateShort(
                                          occurrence.created_at
                                        )}
                                      </span>
                                      <Badge
                                        className={cn(
                                          'px-2 py-0.5 text-xs font-semibold rounded-full border',
                                          getOccurrenceTypeColor(type)
                                        )}
                                      >
                                        {getOccurrenceTypeLabel(type)}
                                      </Badge>
                                      <Badge
                                        className={cn(
                                          'px-2 py-0.5 text-xs font-semibold rounded-full border',
                                          getStatusColor(status)
                                        )}
                                      >
                                        {getStatusLabel(status)}
                                      </Badge>
                                      {aiImproved && (
                                        <Badge className="bg-blue-100 text-blue-700 border-0 px-2 py-0.5 text-xs font-semibold rounded-full">
                                          ✨ IA
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm font-medium text-neutral-900 leading-relaxed">
                                      <p className="whitespace-pre-line">
                                        {occurrence.content}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleCopyOccurrence(occurrence)}
                                      className="h-8 w-8 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                      aria-label="Copiar ocorrência"
                                      title="Copiar ocorrência"
                                    >
                                      <CopyIcon className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleStartEdit(occurrence)}
                                      disabled={
                                        isCurrentDeleting || isDeleting
                                      }
                                      className={cn(
                                        'h-8 w-8 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200',
                                        isCurrentEditing &&
                                          'text-blue-600 bg-blue-100'
                                      )}
                                      aria-label="Editar ocorrência"
                                      title="Editar ocorrência"
                                    >
                                      <EditIcon className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() =>
                                        handleDeleteOccurrence(occurrence)
                                      }
                                      disabled={
                                        isCurrentDeleting || isDeleting
                                      }
                                      className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                      aria-label="Excluir ocorrência"
                                      title="Excluir ocorrência"
                                    >
                                      {isCurrentDeleting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <TrashIcon className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </div>
                                </header>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}

                    {viewMode === 'table' && (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-200">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                Data
                              </th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                Tipo
                              </th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                Descrição
                              </th>
                              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAndSortedOccurrences.map((occurrence) => {
                              const type = occurrence.type || 'outro';
                              const status = occurrence.status || 'pendente';
                              const aiImproved =
                                isOccurrenceAiImproved(occurrence);
                              const isCurrentEditing =
                                editingOccurrenceId === occurrence.id;
                              const isCurrentDeleting =
                                deletingOccurrenceId === occurrence.id;

                              return (
                                <tr
                                  key={occurrence.id}
                                  className={cn(
                                    'border-b border-neutral-100 hover:bg-neutral-50 transition-colors',
                                    isCurrentEditing && 'bg-blue-50'
                                  )}
                                >
                                  <td className="py-3 px-4 text-sm text-neutral-700">
                                    {formatOccurrenceDateShort(
                                      occurrence.created_at
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge
                                      className={cn(
                                        'px-2 py-0.5 text-xs font-semibold rounded-full border',
                                        getOccurrenceTypeColor(type)
                                      )}
                                    >
                                      {getOccurrenceTypeLabel(type)}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge
                                      className={cn(
                                        'px-2 py-0.5 text-xs font-semibold rounded-full border',
                                        getStatusColor(status)
                                      )}
                                    >
                                      {getStatusLabel(status)}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-neutral-900 line-clamp-2 max-w-md">
                                        {occurrence.content}
                                      </p>
                                      {aiImproved && (
                                        <Badge className="bg-blue-100 text-blue-700 border-0 px-1.5 py-0.5 text-xs font-semibold rounded-full">
                                          ✨
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => handleCopyOccurrence(occurrence)}
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        title="Copiar ocorrência"
                                        aria-label="Copiar ocorrência"
                                      >
                                        <CopyIcon className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() =>
                                          handleStartEdit(occurrence)
                                        }
                                        disabled={
                                          isCurrentDeleting || isDeleting
                                        }
                                        className="h-8 w-8"
                                        title="Editar ocorrência"
                                        aria-label="Editar ocorrência"
                                      >
                                        <EditIcon className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() =>
                                          handleDeleteOccurrence(occurrence)
                                        }
                                        disabled={
                                          isCurrentDeleting || isDeleting
                                        }
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title="Excluir ocorrência"
                                        aria-label="Excluir ocorrência"
                                      >
                                        {isCurrentDeleting ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <TrashIcon className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {viewMode === 'compact' && (
                      <div className="grid grid-cols-1 gap-1.5">
                        {filteredAndSortedOccurrences.map((occurrence) => {
                          const metadata = (occurrence.metadata as Record<string, unknown> | null) ?? null;
                          const typeId = metadata?.type_id as string | undefined;
                          const dbType = typeId ? occurrenceTypes.find((t) => t.id === typeId) : null;
                          const typeLabel = dbType ? dbType.name : (occurrence.type ? getOccurrenceTypeLabel(occurrence.type) : '');
                          const type = occurrence.type || 'outro';
                          const aiImproved =
                            isOccurrenceAiImproved(occurrence);
                          const isCurrentEditing =
                            editingOccurrenceId === occurrence.id;
                          const isCurrentDeleting =
                            deletingOccurrenceId === occurrence.id;

                          return (
                            <div
                              key={occurrence.id}
                              className={cn(
                                'group flex items-start justify-between gap-2 p-2 rounded border bg-white hover:bg-neutral-50 transition-all',
                                isCurrentEditing &&
                                  'border-blue-400 bg-blue-50/50',
                                !isCurrentEditing && 'border-neutral-200'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                  {typeLabel && (
                                    <Badge
                                      className={cn(
                                        'px-1.5 py-0 text-[10px] font-medium rounded border',
                                        getOccurrenceTypeColor(type)
                                      )}
                                    >
                                      {typeLabel}
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-neutral-400">
                                    {formatOccurrenceDateShort(
                                      occurrence.created_at
                                    )}
                                  </span>
                                  {aiImproved && (
                                    <span className="text-[10px] text-blue-600">✨</span>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-900 line-clamp-2 leading-snug">
                                  {occurrence.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleCopyOccurrence(occurrence)}
                                  className="h-5 w-5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Copiar ocorrência"
                                  aria-label="Copiar ocorrência"
                                >
                                  <CopyIcon className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleStartEdit(occurrence)}
                                  disabled={
                                    isCurrentDeleting || isDeleting
                                  }
                                  className="h-5 w-5"
                                  title="Editar ocorrência"
                                  aria-label="Editar ocorrência"
                                >
                                  <EditIcon className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    handleDeleteOccurrence(occurrence)
                                  }
                                  disabled={
                                    isCurrentDeleting || isDeleting
                                  }
                                  className="h-5 w-5 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Excluir ocorrência"
                                  aria-label="Excluir ocorrência"
                                >
                                  {isCurrentDeleting ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                  ) : (
                                    <TrashIcon className="h-2.5 w-2.5" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="p-4 rounded-2xl bg-neutral-100">
                      <NotebookPenIcon className="h-10 w-10 text-neutral-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-neutral-700">
                        {hasActiveFilters
                          ? 'Nenhuma ocorrência encontrada'
                          : 'Nenhuma ocorrência registrada'}
                      </p>
                      <p className="text-sm text-neutral-500 max-w-sm">
                        {hasActiveFilters
                          ? 'Tente ajustar os filtros para encontrar ocorrências.'
                          : 'Adicione a primeira ocorrência para começar a construir o histórico deste contrato.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-200/60 bg-white/80 backdrop-blur-sm px-8 py-3">
        <Button
          variant="outline"
          onClick={() => handleOpenChange(false)}
          size="sm"
          className="px-4 py-1.5 text-xs font-medium"
        >
          Fechar
        </Button>
      </div>
    </DialogContent>
  );
};

export const ContractOccurrencesButtonImproved: React.FC<ContractOccurrencesButtonProps> = ({
  contractId,
  contractNumber,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback((state: boolean) => {
    setIsOpen(state);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'group inline-flex items-center gap-2.5 px-4 py-2 rounded-xl',
            'bg-slate-50 hover:bg-blue-50',
            'border border-slate-200 hover:border-blue-200',
            'text-slate-700 hover:text-blue-700 text-sm font-medium',
            'shadow-sm hover:shadow-md',
            'transition-transform duration-200 ease-out',
            'hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-blue-200',
            isOpen && 'ring-2 ring-blue-400/30'
          )}
          aria-label="Abrir ocorrências do contrato"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors duration-200">
              <NotebookPenIcon className="h-3 w-3 text-blue-600" />
            </div>
            <span className="font-medium">Ocorrências</span>
          </div>
          <div className="flex items-center">
            <MoreVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" />
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200 text-slate-500 group-hover:text-blue-600',
                isOpen && 'rotate-90 text-blue-600'
              )}
            />
          </div>
        </button>
      </DialogTrigger>
      <ContractOccurrencesModalImproved
        contractId={contractId}
        contractNumber={contractNumber}
        open={isOpen}
        onOpenChange={handleOpenChange}
      />
    </Dialog>
  );
};

