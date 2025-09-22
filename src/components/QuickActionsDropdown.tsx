import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  User,
  Home,
  User2,
  Building,
  Calendar,
  Phone,
  NotebookPen,
  FileText,
  Briefcase,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_TEMPLATE,
  NOTIFICACAO_AGENDAMENTO_TEMPLATE,
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_COMERCIAL_TEMPLATE,
  DEVOLUTIVA_CADERNINHO_TEMPLATE,
  DISTRATO_CONTRATO_LOCACAO_TEMPLATE,
  DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
  TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE,
  TERMO_RECUSA_ASSINATURA_PDF_TEMPLATE,
  NPS_WHATSAPP_TEMPLATE,
  NPS_EMAIL_TEMPLATE,
} from '@/templates/documentos';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface QuickActionsDropdownProps {
  contractId: string;
  contractNumber?: string;
  onGenerateDocument: (
    contractId: string,
    template: string,
    title: string
  ) => void;
}

const QuickActionsDropdown: React.FC<QuickActionsDropdownProps> = ({
  contractId,
  contractNumber,
  onGenerateDocument,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleActionClick = async (action: QuickAction) => {
    if (action.disabled) return;

    setLoadingActions((prev) => new Set(prev).add(action.id));
    try {
      await action.onClick();
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(action.id);
        return newSet;
      });
    }
  };

  // Função para buscar dados do contrato
  const fetchContractData = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Contrato não encontrado');

      return {
        ...((data.form_data as Record<string, string>) || {}),
        id: data.id,
        title: data.title,
      };
    } catch {
      toast.error('Erro ao carregar dados do contrato');
      return null;
    }
  };

  const termActions: QuickAction[] = [
    {
      id: 'termo-locador',
      label: 'Recebimento de Chaves (Locador)',
      icon: Home,
      onClick: async () => {
        const contractData = await fetchContractData(contractId);
        if (contractData) {
          navigate('/termo-locador', { state: { contractData } });
        }
        setIsOpen(false);
      },
    },
    {
      id: 'termo-locatario',
      label: 'Recebimento de Chaves (Locatário)',
      icon: User,
      onClick: async () => {
        const contractData = await fetchContractData(contractId);
        if (contractData) {
          navigate('/termo-locatario', { state: { contractData } });
        }
        setIsOpen(false);
      },
    },
  ];

  const communicationActions: QuickAction[] = [
    {
      id: 'devolutiva-email-locador',
      label: 'Devolutiva E-mail (Locador)',
      icon: User,
      onClick: () => {
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
          'Devolutiva via E-mail - Locador'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'devolutiva-email-locatario',
      label: 'Devolutiva E-mail (Locatário)',
      icon: User2,
      onClick: () => {
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_LOCATARIO_TEMPLATE,
          'Devolutiva via E-mail - Locatário'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'notificacao-agendamento',
      label: 'Notificação de Agendamento',
      icon: Calendar,
      onClick: () => {
        onGenerateDocument(
          contractId,
          NOTIFICACAO_AGENDAMENTO_TEMPLATE,
          'Notificação de Agendamento'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'whatsapp-proprietaria',
      label: 'Proprietária',
      icon: User2,
      onClick: () => {
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
          'WhatsApp - Proprietária'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'whatsapp-comercial',
      label: 'Comercial',
      icon: Building,
      onClick: () => {
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_COMERCIAL_TEMPLATE,
          'WhatsApp - Comercial'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'whatsapp-locataria',
      label: 'Locatária',
      icon: Phone,
      onClick: () => {
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
          'WhatsApp - Locatária'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'cobranca-consumo',
      label: 'Cobrança de Consumo',
      icon: Briefcase,
      onClick: () => {
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
          'Cobrança de Consumo'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'nps-whatsapp',
      label: 'NPS WhatsApp',
      icon: Star,
      onClick: () => {
        onGenerateDocument(contractId, NPS_WHATSAPP_TEMPLATE, 'NPS WhatsApp');
        setIsOpen(false);
      },
    },
    {
      id: 'nps-email',
      label: 'NPS E-mail',
      icon: Star,
      onClick: () => {
        onGenerateDocument(contractId, NPS_EMAIL_TEMPLATE, 'NPS E-mail');
        setIsOpen(false);
      },
    },
  ];

  const documentActions: QuickAction[] = [
    {
      id: 'caderninho',
      label: 'Caderninho',
      icon: NotebookPen,
      onClick: () => {
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_CADERNINHO_TEMPLATE,
          'Caderninho'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'distrato',
      label: 'Distrato',
      icon: FileText,
      onClick: () => {
        onGenerateDocument(
          contractId,
          DISTRATO_CONTRATO_LOCACAO_TEMPLATE,
          'Distrato'
        );
        setIsOpen(false);
      },
    },
  ];

  const recusaActions: QuickAction[] = [
    {
      id: 'termo-recusa-email',
      label: 'Termo de Recusa - E-mail',
      icon: AlertTriangle,
      onClick: () => {
        onGenerateDocument(
          contractId,
          TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE,
          'Termo de Recusa de Assinatura - E-mail'
        );
        setIsOpen(false);
      },
    },
    {
      id: 'termo-recusa-pdf',
      label: 'Termo de Recusa - PDF',
      icon: AlertTriangle,
      onClick: () => {
        onGenerateDocument(
          contractId,
          TERMO_RECUSA_ASSINATURA_PDF_TEMPLATE,
          'Termo de Recusa de Assinatura - PDF'
        );
        setIsOpen(false);
      },
    },
  ];

  // Atualizar ações com estado de loading
  const updateActionsWithLoading = (actions: QuickAction[]) =>
    actions.map((action) => ({
      ...action,
      loading: loadingActions.has(action.id),
    }));

  const termActionsWithLoading = updateActionsWithLoading(termActions);
  const communicationActionsWithLoading =
    updateActionsWithLoading(communicationActions);
  const documentActionsWithLoading = updateActionsWithLoading(documentActions);
  const recusaActionsWithLoading = updateActionsWithLoading(recusaActions);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Botão trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground border border-border rounded-lg transition-colors hover:text-foreground/80 hover:bg-accent',
          isOpen && 'bg-accent'
        )}
      >
        <span>AÇÕES RÁPIDAS</span>
        <ChevronRight
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-90'
          )}
        />
      </button>

      {/* Modal centralizado com blur */}
      {isOpen && (
        <>
          {/* Backdrop com blur */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal em tela cheia */}
          <div className="fixed inset-4 z-[9999] glass-card border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header do modal */}
            <div className="relative p-4 border-b border-border bg-background">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">
                  Ações Rápidas
                </h3>
                {contractNumber && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Contrato:{' '}
                    <span className="font-medium text-primary">
                      {contractNumber}
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-accent"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Conteúdo do menu organizado */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Coluna 1: TERMOS */}
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-semibold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent uppercase tracking-wide">
                        TERMOS
                      </h3>
                      <div className="w-12 h-0.5 bg-primary mx-auto mt-1 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      {termActionsWithLoading.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          disabled={action.disabled}
                          className="w-full flex items-center gap-2 hover:bg-accent/50 p-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 border border-border/30 hover:border-primary/20"
                        >
                          {action.loading ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                          ) : (
                            <action.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-xs text-foreground font-medium">
                            {action.id === 'termo-locador'
                              ? 'Chaves (Locador)'
                              : action.id === 'termo-locatario'
                                ? 'Chaves (Locatário)'
                                : action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Coluna 2: WHATSAPP */}
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-semibold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent uppercase tracking-wide">
                        DEVOLUTIVAS
                      </h3>
                      <div className="w-12 h-0.5 bg-primary mx-auto mt-1 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      {communicationActionsWithLoading.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          disabled={action.disabled}
                          className="w-full flex items-center gap-2 hover:bg-accent/50 p-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 border border-border/30 hover:border-primary/20"
                        >
                          {action.loading ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                          ) : (
                            <action.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-xs text-foreground font-medium">
                            {action.id === 'devolutiva-email-locador'
                              ? 'E-mail (Locador)'
                              : action.id === 'devolutiva-email-locatario'
                                ? 'E-mail (Locatário)'
                                : action.id === 'notificacao-agendamento'
                                  ? 'Agendamento'
                                  : action.id === 'whatsapp-proprietaria'
                                    ? 'Proprietária'
                                    : action.id === 'whatsapp-comercial'
                                      ? 'Comercial'
                                      : action.id === 'whatsapp-locataria'
                                        ? 'Locatária'
                                        : action.id === 'cobranca-consumo'
                                          ? 'Cobrança'
                                          : action.id === 'nps-whatsapp'
                                            ? 'NPS WhatsApp'
                                            : action.id === 'nps-email'
                                              ? 'NPS E-mail'
                                              : action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Coluna 3: DOCUMENTOS E OUTROS */}
                  <div className="space-y-4">
                    {/* DOCUMENTOS */}
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <h3 className="text-sm font-semibold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent uppercase tracking-wide">
                          DOCUMENTOS
                        </h3>
                        <div className="w-12 h-0.5 bg-primary mx-auto mt-1 rounded-full"></div>
                      </div>
                      <div className="space-y-2">
                        {documentActionsWithLoading.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            disabled={action.disabled}
                            className="w-full flex items-center gap-2 hover:bg-accent/50 p-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 border border-border/30 hover:border-primary/20"
                          >
                            {action.loading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                            ) : (
                              <action.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-xs text-foreground font-medium">
                              {action.id === 'caderninho'
                                ? 'Caderninho'
                                : action.id === 'distrato'
                                  ? 'Distrato'
                                  : action.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TERMO DE RECUSA */}
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <h3 className="text-sm font-semibold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent uppercase tracking-wide">
                          RECUSA
                        </h3>
                        <div className="w-12 h-0.5 bg-primary mx-auto mt-1 rounded-full"></div>
                      </div>
                      <div className="space-y-2">
                        {recusaActionsWithLoading.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            disabled={action.disabled}
                            className="w-full flex items-center gap-2 hover:bg-accent/50 p-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 border border-border/30 hover:border-primary/20"
                          >
                            {action.loading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                            ) : (
                              <action.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-xs text-foreground font-medium">
                              {action.id === 'termo-recusa-email'
                                ? 'Recusa E-mail'
                                : action.id === 'termo-recusa-pdf'
                                  ? 'Recusa PDF'
                                  : action.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickActionsDropdown;
