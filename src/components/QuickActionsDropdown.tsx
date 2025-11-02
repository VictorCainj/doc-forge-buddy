// @ts-nocheck
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  User,
  Home,
  User2,
  Building,
  Calendar,
  Phone,
  NotebookPen,
  Briefcase,
  AlertTriangle,
  SearchCheck,
  Mail,
  MessageSquare,
  Sparkles,
} from '@/utils/iconMapper';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_TEMPLATE,
  NOTIFICACAO_AGENDAMENTO_TEMPLATE,
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_COMERCIAL_TEMPLATE,
  DEVOLUTIVA_CADERNINHO_TEMPLATE,
  DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
  TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE,
  TERMO_RECUSA_ASSINATURA_PDF_TEMPLATE,
  STATUS_VISTORIA_WHATSAPP_TEMPLATE,
} from '@/templates/documentos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ActionSection from './quick-actions/ActionSection';
import { QuickAction, ActionSection as ActionSectionType } from './quick-actions/types';

interface QuickActionsDropdownProps {
  contractId: string;
  contractNumber?: string;
  onGenerateDocument: (
    contractId: string,
    template: string,
    title: string
  ) => void;
}

const QuickActionsDropdown = memo<QuickActionsDropdownProps>(
  ({ contractId, contractNumber, onGenerateDocument }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loadingActions, setLoadingActions] = useState<Set<string>>(
      new Set()
    );
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hasAnalise, setHasAnalise] = useState(false);
    const [checkingAnalise, setCheckingAnalise] = useState(false);

    // Verificar se existe análise para este contrato
    useEffect(() => {
      const checkAnalise = async () => {
        if (!user || !contractId) return;

        setCheckingAnalise(true);
        try {
          const { data, error } = await supabase
            .from('vistoria_analises')
            .select('id')
            .eq('contract_id', contractId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            setHasAnalise(true);
          } else {
            setHasAnalise(false);
          }
        } catch {
          setHasAnalise(false);
        } finally {
          setCheckingAnalise(false);
        }
      };

      if (isOpen) {
        checkAnalise();
      }
    }, [contractId, user, isOpen]);

    // Permitir scroll da página quando o modal estiver aberto
    useEffect(() => {
      if (isOpen) {
        // Remove o bloqueio de scroll padrão do Radix Dialog
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }, [isOpen]);

    // Função helper para fechar modal
    const handleCloseModal = useCallback(() => {
      setIsOpen(false);
    }, []);

    // Função para buscar dados do contrato
    const fetchContractData = useCallback(
      async (contractId: string) => {
        try {
          const { data, error } = await supabase
            .from('saved_terms')
            .select('*')
            .eq('id', contractId)
            .single();

          if (error) throw error;
          if (!data) throw new Error('Contrato não encontrado');

          const formData = (data.form_data as Record<string, string>) || {};
          const contractData = {
            ...formData,
            title: data.title,
          };

          if (!contractData.numeroContrato) {
            contractData.numeroContrato = '[NÚMERO NÃO DEFINIDO]';
          }

          return contractData;
        } catch {
          toast.error('Erro ao carregar dados do contrato');
          return null;
        }
      },
      []
    );

    // Criar todas as ações
    const allActions = useMemo<QuickAction[]>(() => {
      const actions: QuickAction[] = [
        // Processos - Chaves
        {
          id: 'termo-locador',
          label: 'Recebimento de Chaves (Locador)',
          shortLabel: 'Chaves (Locador)',
          icon: Home,
          color: 'green',
          onClick: async () => {
            const contractData = await fetchContractData(contractId);
            if (contractData) {
              navigate('/termo-locador', { state: { contractData } });
            }
            handleCloseModal();
          },
        },
        {
          id: 'termo-locatario',
          label: 'Recebimento de Chaves (Locatário)',
          shortLabel: 'Chaves (Locatário)',
          icon: User,
          color: 'green',
          onClick: async () => {
            const contractData = await fetchContractData(contractId);
            if (contractData) {
              navigate('/termo-locatario', { state: { contractData } });
            }
            handleCloseModal();
          },
        },
        // Processos - Análise
        {
          id: 'analise-vistoria',
          label: hasAnalise ? 'Carregar Análise' : 'Criar Análise',
          shortLabel: hasAnalise ? 'Carregar Análise' : 'Criar Análise',
          icon: SearchCheck,
          color: 'green',
          loading: checkingAnalise,
          onClick: async () => {
            const { data: contract } = await supabase
              .from('saved_terms')
              .select('*')
              .eq('id', contractId)
              .single();

            if (contract) {
              const formData =
                contract.form_data as Record<string, string>;
              navigate(`/analise-vistoria/${contract.id}`, {
                state: {
                  contractId: contract.id,
                  contractData: {
                    locatario:
                      formData?.nomeLocatario ||
                      formData?.primeiroLocatario ||
                      '',
                    endereco:
                      formData?.enderecoImovel ||
                      formData?.endereco ||
                      '',
                  },
                },
              });
            }
            handleCloseModal();
          },
        },
        // Comunicação - E-mail
        {
          id: 'devolutiva-email-locador',
          label: 'Devolutiva E-mail (Locador)',
          shortLabel: 'E-mail (Locador)',
          icon: Mail,
          color: 'blue',
          onClick: () => {
            onGenerateDocument(
              contractId,
              DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
              'Notificação de Desocupação e Agendamento de Vistoria'
            );
            handleCloseModal();
          },
        },
        {
          id: 'devolutiva-email-locatario',
          label: 'Devolutiva E-mail (Locatário)',
          shortLabel: 'E-mail (Locatário)',
          icon: Mail,
          color: 'blue',
          onClick: () => {
            onGenerateDocument(
              contractId,
              DEVOLUTIVA_LOCATARIO_TEMPLATE,
              'Devolutiva Locatário'
            );
            handleCloseModal();
          },
        },
        {
          id: 'notificacao-agendamento',
          label: 'Notificação de Agendamento',
          shortLabel: 'Agendamento',
          icon: Calendar,
          color: 'blue',
          onClick: () => {
            onGenerateDocument(
              contractId,
              NOTIFICACAO_AGENDAMENTO_TEMPLATE,
              'Notificação de Agendamento'
            );
            handleCloseModal();
          },
        },
        // Comunicação - WhatsApp
        {
          id: 'whatsapp-proprietaria',
          label: 'WhatsApp - Proprietária',
          shortLabel: 'Proprietária',
          icon: MessageSquare,
          color: 'blue',
          onClick: () => {
            onGenerateDocument(
              contractId,
              DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
              'WhatsApp - Proprietária'
            );
            handleCloseModal();
          },
        },
        {
          id: 'whatsapp-comercial',
          label: 'WhatsApp - Comercial',
          shortLabel: 'Comercial',
          icon: Building,
          color: 'blue',
          onClick: () => {
            onGenerateDocument(
              contractId,
              DEVOLUTIVA_COMERCIAL_TEMPLATE,
              'Notificação de Desocupação - Comercial'
            );
            handleCloseModal();
          },
        },
        {
          id: 'whatsapp-locataria',
          label: 'WhatsApp - Locatária',
          shortLabel: 'Locatária',
          icon: Phone,
          color: 'blue',
          onClick: () => {
            onGenerateDocument(
              contractId,
              DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
              'WhatsApp - Locatária'
            );
            handleCloseModal();
          },
        },
        {
          id: 'status-vistoria',
          label: 'Status Vistoria',
          shortLabel: 'Status Vistoria',
          icon: Phone,
          color: 'blue',
          onClick: () => {
            onGenerateDocument(
              contractId,
              STATUS_VISTORIA_WHATSAPP_TEMPLATE,
              'Status Vistoria'
            );
            handleCloseModal();
          },
        },
        {
          id: 'cobranca-consumo',
          label: 'Cobrança de Consumo',
          shortLabel: 'Cobrança',
          icon: Briefcase,
          color: 'blue',
          onClick: () => {
            onGenerateDocument(
              contractId,
              DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
              'Cobrança de Consumo'
            );
            handleCloseModal();
          },
        },
        // Documentos - Contratos
        {
          id: 'caderninho',
          label: 'Caderninho',
          icon: NotebookPen,
          color: 'purple',
          onClick: () => {
            onGenerateDocument(
              contractId,
              DEVOLUTIVA_CADERNINHO_TEMPLATE,
              'Caderninho'
            );
            handleCloseModal();
          },
        },
        // Documentos - Assinatura
        {
          id: 'termo-recusa-email',
          label: 'Termo de Recusa - E-mail',
          shortLabel: 'Recusa E-mail',
          icon: AlertTriangle,
          color: 'purple',
          onClick: () => {
            onGenerateDocument(
              contractId,
              TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE,
              'Termo de Recusa de Assinatura - E-mail'
            );
            handleCloseModal();
          },
        },
        {
          id: 'termo-recusa-pdf',
          label: 'Termo de Recusa - PDF',
          shortLabel: 'Recusa PDF',
          icon: AlertTriangle,
          color: 'purple',
          onClick: () => {
            onGenerateDocument(
              contractId,
              TERMO_RECUSA_ASSINATURA_PDF_TEMPLATE,
              'Termo de Recusa de Assinatura - PDF'
            );
            handleCloseModal();
          },
        },
      ];

      // Aplicar loading states
      return actions.map((action) => ({
        ...action,
        loading: loadingActions.has(action.id),
      }));
    }, [
      contractId,
      navigate,
      onGenerateDocument,
      fetchContractData,
      handleCloseModal,
      loadingActions,
      hasAnalise,
      checkingAnalise,
    ]);

    // Organizar ações em seções
    const sections = useMemo<ActionSectionType[]>(() => {
      const getAction = (id: string) =>
        allActions.find((a) => a.id === id) as QuickAction;

      return [
        {
          id: 'comunicacao',
          title: 'Comunicação',
          icon: Mail,
          color: 'blue',
          actions: [
            getAction('devolutiva-email-locador'),
            getAction('devolutiva-email-locatario'),
            getAction('notificacao-agendamento'),
            getAction('whatsapp-proprietaria'),
            getAction('whatsapp-comercial'),
            getAction('whatsapp-locataria'),
            getAction('status-vistoria'),
            getAction('cobranca-consumo'),
          ].filter(Boolean),
        },
        {
          id: 'documentos',
          title: 'Documentos',
          icon: NotebookPen,
          color: 'purple',
          actions: [
            getAction('caderninho'),
            getAction('termo-recusa-email'),
            getAction('termo-recusa-pdf'),
          ].filter(Boolean),
        },
        {
          id: 'processos',
          title: 'Processos',
          icon: Home,
          color: 'green',
          actions: [
            getAction('termo-locador'),
            getAction('termo-locatario'),
            getAction('analise-vistoria'),
          ].filter(Boolean),
        },
      ];
    }, [allActions]);

    // Handler para cliques em ações
    const handleActionClick = useCallback(
      async (actionId: string) => {
        const action = allActions.find((a) => a.id === actionId);
        if (!action || action.disabled || action.loading) return;

        setLoadingActions((prev) => new Set(prev).add(actionId));
        try {
          await action.onClick();
        } finally {
          setLoadingActions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(actionId);
            return newSet;
          });
        }
      },
      [allActions]
    );

    return (
      <div className="relative">
        {/* Botão trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-700 text-sm font-semibold overflow-hidden',
            'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_100%] animate-gradient',
            'text-white shadow-lg shadow-purple-500/50',
            'hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105',
            'before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-white/20',
            'before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-3000',
            'backdrop-blur-sm border border-white/20',
            isOpen && 'ring-2 ring-white/50 ring-offset-2 ring-offset-purple-600'
          )}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="relative">
              <span className="absolute inset-0 blur-md opacity-60 bg-white/60 animate-slow-pulse"></span>
              <span className="relative drop-shadow-sm animate-gradient-text-button">Ações Rápidas</span>
            </span>
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-700 relative z-10 drop-shadow-sm text-white',
                isOpen && 'rotate-90'
              )}
              style={{ color: '#FFFFFF', stroke: '#FFFFFF' }}
            />
          </span>
        </button>

        {/* Modal usando Dialog do shadcn/ui */}
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <DialogContent
            className="max-w-6xl w-[90vw] max-h-[85vh] p-0 overflow-hidden flex flex-col"
            aria-label="Ações rápidas do contrato"
          >
            {/* Banner */}
            <div className="px-6 py-8 border-b border-neutral-200 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 relative overflow-hidden">
              {/* Gradiente animado de fundo */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_100%] animate-gradient opacity-40"></div>
              
              <div className="flex flex-col items-center justify-center text-center relative z-10">
                <div className="mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_100%] animate-gradient border border-white/50 shadow-lg shadow-purple-500/60 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" strokeWidth={2.5} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                  </div>
                </div>
                {contractNumber && (
                  <p className="text-lg font-medium text-white font-mono mb-2">
                    {contractNumber}
                  </p>
                )}
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  <span className="relative inline-block">
                    <span className="absolute inset-0 blur-md opacity-60 bg-white/60 animate-slow-pulse"></span>
                    <span className="relative animate-gradient-text-button">Ações Rápidas</span>
                  </span>
                </DialogTitle>
              </div>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 p-6 overflow-y-auto bg-neutral-50 min-h-0 max-h-[calc(85vh-200px)]">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sections.map((section) => (
                    <ActionSection
                      key={section.id}
                      section={section}
                      onActionClick={handleActionClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

QuickActionsDropdown.displayName = 'QuickActionsDropdown';

export default QuickActionsDropdown;
