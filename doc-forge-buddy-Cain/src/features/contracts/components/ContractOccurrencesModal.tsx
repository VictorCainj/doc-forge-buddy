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
import {
  NotebookPenIcon,
  SparklesIcon,
  EditIcon,
  TrashIcon,
  Loader2,
  ChevronRight,
  MoreVertical,
  FileTextIcon,
} from '@/utils/iconMapper';
import { useContractOccurrences } from '@/features/contracts/hooks/useContractOccurrences';
import { ContractOccurrence } from '@/types/shared/contract';
import { log } from '@/utils/logger';
import { cn } from '@/lib/utils';
import { useStandardToast } from '@/utils/toastHelpers';
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

const getOccurrencePreview = (content: string, maxLength: number = 120): string => {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength).trim() + '...';
};

const isOccurrenceAiImproved = (occurrence: ContractOccurrence): boolean => {
  if (occurrence.ai_corrected) {
    return true;
  }

  const metadata = occurrence.metadata as { aiImproved?: boolean } | null;
  return Boolean(metadata?.aiImproved);
};
export const ContractOccurrencesModal: React.FC<ContractOccurrencesModalProps> = ({
  contractId,
  contractNumber,
  open,
  onOpenChange,
}) => {
  const [newOccurrence, setNewOccurrence] = useState('');
  const [hasImprovedText, setHasImprovedText] = useState(false);

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
    setEditingOccurrenceId(null);
    setEditingMetadata(null);
    setDeletingOccurrenceId(null);
  }, [open, refetch]);
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
    setEditingMetadata((occurrence.metadata as Record<string, unknown> | null) ?? null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingOccurrenceId(null);
    setEditingMetadata(null);
    setNewOccurrence('');
    setHasImprovedText(false);
  }, []);

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
    if (!occurrences.length) {
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

    const rows = occurrences
      .map((occurrence, index) => {
        const formattedDate = formatOccurrenceDate(occurrence.created_at);
        const content = escapeHtml(occurrence.content).replace(/\n/g, '<br />');

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formattedDate)}</td>
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
    const safeIdentifier = sanitizedIdentifier.length > 0 ? sanitizedIdentifier : 'contrato';
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
    <p class="meta">Total de ocorrências: ${occurrences.length}</p>
  </header>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Data</th>
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
  }, [contractId, contractNumber, occurrences, showError, showSuccess]);

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

        if (editingOccurrenceId) {
          await updateOccurrence({
            id: editingOccurrenceId,
            content: trimmed,
            aiCorrected: hasImprovedText,
            metadata: metadataPayload,
          });
        } else {
          await createOccurrence({
            content: trimmed,
            aiCorrected: hasImprovedText,
            metadata: metadataPayload,
          });
        }

        setNewOccurrence('');
        setHasImprovedText(false);
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
    ]
  );
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
      {/* Header Moderno e Espaçoso */}
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
              Registre informações importantes e acompanhe o histórico completo deste contrato de forma organizada.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-3">
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
              disabled={occurrences.length === 0}
              size="lg"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FileTextIcon className="h-4 w-4" />
              Exportar HTML
            </Button>
          </div>
        </div>
      </DialogHeader>

      {/* Conteúdo Principal com Grid Moderno */}
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
          {/* Coluna Esquerda: Formulário de Registro */}
        <div className="flex flex-col">
            <Card className="flex flex-col shadow-lg border-neutral-200/80 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-5 border-b border-neutral-100">
                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2.5">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-blue-600" />
                  {isEditing ? 'Editar Ocorrência' : 'Registrar Nova Ocorrência'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col pt-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label
                      htmlFor="contract-occurrence"
                      className="text-sm font-semibold text-neutral-700 uppercase tracking-wide"
                    >
                      Descrição da Ocorrência
                    </label>
                    <Textarea
                      id="contract-occurrence"
                      placeholder="Descreva detalhadamente a ocorrência registrada neste contrato. Inclua contexto, responsáveis e decisões tomadas..."
                      value={newOccurrence}
                      onChange={(event) => {
                        setNewOccurrence(event.target.value);
                        setHasImprovedText(false);
                      }}
                      rows={10}
                      className="resize-y min-h-[240px] text-base leading-relaxed border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>

                  {/* Ações do Formulário */}
                  <div className="flex flex-col gap-4 pt-4 border-t border-neutral-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImproveText}
                        disabled={isImproveDisabled || (isEditing && isUpdating)}
                        size="lg"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Melhorar Texto
                      </Button>
                      {hasImprovedText && (
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-600 px-3 py-1.5 text-xs font-semibold rounded-full"
                        >
                          ✓ Texto aprimorado com IA
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      {isEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          size="lg"
                          className="px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        >
                          Cancelar
                        </Button>
                      )}
                      <LoadingButton
                        type="submit"
                        loading={isEditing ? isUpdating : isCreating}
                        loadingText={submitButtonLoadingText}
                        disabled={isSubmitDisabled}
                        size="lg"
                        className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 border-0"
                      >
                        {submitButtonLabel}
                      </LoadingButton>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Histórico Cronológico */}
          <div className="flex flex-col">
            <Card className="flex flex-col shadow-lg border-neutral-200/80 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-5 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2.5">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-neutral-400 to-neutral-500" />
                    Histórico de Ocorrências
                  </CardTitle>
                  {hasOccurrences && (
                    <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1 text-xs font-bold rounded-full">
                      {occurrences.length} {occurrences.length === 1 ? 'registro' : 'registros'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col pt-6 overflow-hidden">
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
                ) : hasOccurrences ? (
                  <div className="flex-1 overflow-y-auto pr-4">
                    <div className="relative space-y-6 pb-6 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-blue-200 before:via-neutral-200 before:to-transparent">
                      {occurrences.map((occurrence, index) => {
                        const aiImproved = isOccurrenceAiImproved(occurrence);
                        const isCurrentEditing = editingOccurrenceId === occurrence.id;
                        const isCurrentDeleting = deletingOccurrenceId === occurrence.id;
                        const preview = getOccurrencePreview(occurrence.content);
                        const isExpanded = isCurrentEditing;
                        const isLast = index === occurrences.length - 1;

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
                                isCurrentEditing && 'border-blue-400 bg-blue-50/50 shadow-lg ring-2 ring-blue-200/50',
                                !isCurrentEditing && 'border-neutral-200/70'
                              )}
                            >
                            <header className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                    {formatOccurrenceDateShort(occurrence.created_at)}
                                  </span>
                                  {aiImproved && (
                                    <Badge className="bg-blue-100 text-blue-700 border-0 px-2 py-0.5 text-xs font-semibold rounded-full">
                                      ✨ IA
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm font-medium text-neutral-900 leading-relaxed">
                                  {isExpanded ? (
                                    <p className="whitespace-pre-line">{occurrence.content}</p>
                                  ) : (
                                    <p className="line-clamp-3">{preview}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleStartEdit(occurrence)}
                                  disabled={isCurrentDeleting || isDeleting}
                                  className={cn(
                                    'h-8 w-8 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200',
                                    isCurrentEditing && 'text-blue-600 bg-blue-100'
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
                                  onClick={() => handleDeleteOccurrence(occurrence)}
                                  disabled={isCurrentDeleting || isDeleting}
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
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="p-4 rounded-2xl bg-neutral-100">
                      <NotebookPenIcon className="h-10 w-10 text-neutral-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-neutral-700">
                        Nenhuma ocorrência registrada
                      </p>
                      <p className="text-sm text-neutral-500 max-w-sm">
                        Adicione a primeira ocorrência para começar a construir o histórico deste contrato.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Minimalista */}
      <div className="flex items-center justify-end gap-3 border-t border-neutral-200/60 bg-white/80 backdrop-blur-sm px-8 py-4">
        <Button
          variant="outline"
          onClick={() => handleOpenChange(false)}
          size="lg"
          className="px-6 py-2.5 text-sm font-semibold"
        >
          Fechar
        </Button>
      </div>
    </DialogContent>
  );
};
export const ContractOccurrencesButton: React.FC<ContractOccurrencesButtonProps> = ({
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
      <ContractOccurrencesModal
        contractId={contractId}
        contractNumber={contractNumber}
        open={isOpen}
        onOpenChange={handleOpenChange}
      />
    </Dialog>
  );
};
