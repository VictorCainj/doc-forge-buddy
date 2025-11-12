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
  FileText,
  Settings,
  Plus,
  X,
  MoreVertical,
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
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { log } from '@/utils/logger';
import { toSupabaseJson } from '@/types/shared/vistoria';
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
  onScheduleAgendamento?: (contractId: string) => void;
}

const QuickActionsDropdown = memo<QuickActionsDropdownProps>(
  ({
    contractId,
    contractNumber,
    onGenerateDocument,
    onScheduleAgendamento,
  }) => {
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

    // Função helper simplificada para fechar modal
    const handleCloseModal = useCallback(() => setIsOpen(false), []);

    const handleAgendamento = useCallback(() => {
      if (onScheduleAgendamento) {
        onScheduleAgendamento(contractId);
      } else {
        onGenerateDocument(
          contractId,
          NOTIFICACAO_AGENDAMENTO_TEMPLATE,
          'Notificação de Agendamento'
        );
      }
      handleCloseModal();
    }, [contractId, handleCloseModal, onGenerateDocument, onScheduleAgendamento]);

    // Função otimizada para buscar dados do contrato
    const fetchContractData = useCallback(async (contractId: string) => {
      try {
        const { data, error } = await supabase
          .from('saved_terms')
          .select('*')
          .eq('id', contractId)
          .single();

        if (error || !data) throw new Error('Contrato não encontrado');

        const formData = (data.form_data as Record<string, string>) || {};
        return {
          contractId: data.id,
          title: data.title,
          numeroContrato: formData.numeroContrato || '[NÚMERO NÃO DEFINIDO]',
          formData,
        };
      } catch (error) {
        log.error('Erro ao carregar dados do contrato:', error);
        toast.error('Erro ao carregar dados do contrato');
        return null;
      }
    }, []);

    const openAnaliseVistoria = useCallback(async () => {
      if (!user) {
        toast.error('Faça login para acessar a análise de vistoria.');
        return;
      }

      const contractData = await fetchContractData(contractId);
      if (!contractData) return;

      try {
        // Verificar se já existe análise
        const { data: existingAnalise } = await supabase
          .from('vistoria_analises')
          .select('id')
          .eq('contract_id', contractId)
          .eq('user_id', user.id)
          .maybeSingle();

        let analiseId = existingAnalise?.id;

        if (!analiseId) {
          // Criar nova análise com dados básicos
          const locatario =
            contractData.formData?.nomeLocatario ||
            contractData.formData?.primeiroLocatario ||
            '';
          const endereco =
            contractData.formData?.enderecoImovel ||
            contractData.formData?.endereco ||
            '';

          const { data: createdAnalise, error: createError } = await supabase
            .from('vistoria_analises')
            .insert({
              title:
                contractData.title ||
                `Análise de Vistoria - ${contractData.numeroContrato}`,
              contract_id: contractId,
              user_id: user.id,
              dados_vistoria: toSupabaseJson({
                locatario,
                endereco,
                dataVistoria: formatDateBrazilian(new Date()),
              }),
              apontamentos: toSupabaseJson([]),
            })
            .select('id')
            .single();

          if (createError) {
            throw createError;
          }

          analiseId = createdAnalise.id;
          toast.success('Análise de vistoria criada com sucesso.');
        }

        setHasAnalise(true);

        navigate(`/analise-vistoria/${contractId}`, {
          state: {
            contractId,
            analiseId,
            contractData: {
              locatario:
                contractData.formData?.nomeLocatario ||
                contractData.formData?.primeiroLocatario ||
                '',
              endereco:
                contractData.formData?.enderecoImovel ||
                contractData.formData?.endereco ||
                '',
              numeroContrato: contractData.numeroContrato,
            },
          },
        });
        handleCloseModal();
      } catch (error) {
        log.error('Erro ao abrir análise de vistoria:', error);
        toast.error('Não foi possível abrir a análise de vistoria.');
      }
    }, [contractId, fetchContractData, handleCloseModal, navigate, user, toast]);

    // Ações organizadas de forma otimizada
    const allActions = useMemo<QuickAction[]>(() => {
      const createAction = (id: string, label: string, shortLabel: string, icon: any, color: string, onClick: () => void): QuickAction => ({
        id, label, shortLabel, icon, color,
        onClick,
        loading: loadingActions.has(id),
        disabled: color === 'green' && id === 'analise-vistoria' && checkingAnalise
      });

      return [
        // Processos
        createAction('termo-locador', 'Recebimento de Chaves (Locador)', 'Chaves (Locador)', Home, 'green', async () => {
          const contractData = await fetchContractData(contractId);
          if (contractData) navigate('/termo-locador', { state: { contractData } });
          handleCloseModal();
        }),
        createAction('termo-locatario', 'Recebimento de Chaves (Locatário)', 'Chaves (Locatário)', User, 'green', async () => {
          const contractData = await fetchContractData(contractId);
          if (contractData) navigate('/termo-locatario', { state: { contractData } });
          handleCloseModal();
        }),
        createAction(
          'analise-vistoria',
          hasAnalise ? 'Carregar Análise' : 'Criar Análise',
          hasAnalise ? 'Carregar Análise' : 'Criar Análise',
          SearchCheck,
          'green',
          openAnaliseVistoria
        ),
        createAction('configuracoes-avancadas', 'Configurações Avançadas', 'Configurações', Settings, 'green', () => {
          toast.info('Configurações avançadas em desenvolvimento');
          handleCloseModal();
        }),

        // Comunicação - E-mail
        createAction('devolutiva-email-locador', 'Devolutiva E-mail (Locador)', 'E-mail (Locador)', Mail, 'blue', () => {
          onGenerateDocument(contractId, DEVOLUTIVA_PROPRIETARIO_TEMPLATE, 'Notificação de Desocupação e Agendamento de Vistoria');
          handleCloseModal();
        }),
        createAction('devolutiva-email-locatario', 'Devolutiva E-mail (Locatário)', 'E-mail (Locatário)', Mail, 'blue', () => {
          onGenerateDocument(contractId, DEVOLUTIVA_LOCATARIO_TEMPLATE, 'Devolutiva Locatário');
          handleCloseModal();
        }),
        createAction(
          'notificacao-agendamento',
          'Notificação de Agendamento',
          'Agendamento',
          Calendar,
          'blue',
          handleAgendamento
        ),

        // Comunicação - WhatsApp
        createAction('whatsapp-proprietaria', 'WhatsApp - Proprietária', 'Proprietária', MessageSquare, 'blue', () => {
          onGenerateDocument(contractId, DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE, 'WhatsApp - Proprietária');
          handleCloseModal();
        }),
        createAction('whatsapp-comercial', 'WhatsApp - Comercial', 'Comercial', Building, 'blue', () => {
          onGenerateDocument(contractId, DEVOLUTIVA_COMERCIAL_TEMPLATE, 'Notificação de Desocupação - Comercial');
          handleCloseModal();
        }),
        createAction('whatsapp-locataria', 'WhatsApp - Locatária', 'Locatária', Phone, 'blue', () => {
          onGenerateDocument(contractId, DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE, 'WhatsApp - Locatária');
          handleCloseModal();
        }),
        createAction('status-vistoria', 'Status Vistoria', 'Status Vistoria', Phone, 'blue', () => {
          onGenerateDocument(contractId, STATUS_VISTORIA_WHATSAPP_TEMPLATE, 'Status Vistoria');
          handleCloseModal();
        }),
        createAction('cobranca-consumo', 'Cobrança de Consumo', 'Cobrança', Briefcase, 'blue', () => {
          onGenerateDocument(contractId, DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE, 'Cobrança de Consumo');
          handleCloseModal();
        }),

        // Documentos
        createAction('caderninho', 'Caderninho', 'Caderninho', NotebookPen, 'purple', () => {
          onGenerateDocument(contractId, DEVOLUTIVA_CADERNINHO_TEMPLATE, 'Caderninho');
          handleCloseModal();
        }),
        createAction('termo-recusa-email', 'Termo de Recusa - E-mail', 'Recusa E-mail', AlertTriangle, 'purple', () => {
          onGenerateDocument(contractId, TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE, 'Termo de Recusa de Assinatura - E-mail');
          handleCloseModal();
        }),
        createAction('termo-recusa-pdf', 'Termo de Recusa - PDF', 'Recusa PDF', AlertTriangle, 'purple', () => {
          onGenerateDocument(contractId, TERMO_RECUSA_ASSINATURA_PDF_TEMPLATE, 'Termo de Recusa de Assinatura - PDF');
          handleCloseModal();
        }),
      ];
    }, [contractId, navigate, onGenerateDocument, fetchContractData, handleCloseModal, loadingActions, hasAnalise, checkingAnalise, openAnaliseVistoria, handleAgendamento]);

    // Seções organizadas de forma otimizada
    const sections = useMemo<ActionSectionType[]>(() => {
      const getAction = (id: string) => allActions.find((a) => a.id === id);

      return [
        {
          id: 'comunicacao',
          title: 'Comunicação',
          icon: Mail,
          color: 'blue',
          actions: [
            'devolutiva-email-locador',
            'devolutiva-email-locatario', 
            'notificacao-agendamento',
            'whatsapp-proprietaria',
            'whatsapp-comercial',
            'whatsapp-locataria',
            'status-vistoria',
            'cobranca-consumo',
          ].map(getAction).filter(Boolean),
        },
        {
          id: 'documentos',
          title: 'Documentos',
          icon: NotebookPen,
          color: 'purple',
          actions: ['caderninho', 'termo-recusa-email', 'termo-recusa-pdf']
            .map(getAction).filter(Boolean),
        },
        {
          id: 'processos',
          title: 'Processos',
          icon: Home,
          color: 'green',
          actions: ['termo-locador', 'termo-locatario', 'analise-vistoria', 'configuracoes-avancadas']
            .map(getAction).filter(Boolean),
        },
      ];
    }, [allActions]);

    // Handler otimizado para cliques em ações
    const handleActionClick = useCallback(async (actionId: string) => {
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
    }, [allActions]);

    return (
      <div className="relative">
        {/* Botão trigger - Otimizado para performance */}
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'group inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl',
            'bg-slate-50 hover:bg-blue-50',
            'border border-slate-200 hover:border-blue-200',
            'text-slate-700 hover:text-blue-700 text-sm font-medium',
            'shadow-sm hover:shadow-md',
            'transition-transform duration-200 ease-out',
            'hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-blue-200',
            isOpen && 'ring-2 ring-blue-400/30'
          )}
          aria-label="Abrir ações rápidas"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors duration-200">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />
            </div>
            <span className="font-medium">Ações</span>
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

        {/* Modal otimizado para performance */}
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <DialogContent
            className={cn(
              "max-w-5xl w-[92vw] max-h-[85vh] p-0 overflow-hidden flex flex-col",
              "bg-white border-0 shadow-2xl rounded-3xl",
              "transition-all duration-200"
            )}
            aria-label="Ações rápidas do contrato"
          >
            {/* Header otimizado */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-4 justify-center">
                <div className="flex items-center gap-4">
                  {/* Ícone Principal */}
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  
                  {/* Título e Subtítulo */}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-800">
                      Ações Rápidas
                    </h2>
                    {contractNumber && (
                      <p className="text-sm text-slate-500 font-medium">
                        Contrato <span className="font-mono text-blue-600">{contractNumber}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo Principal otimizado */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 min-h-0">
              <div className="max-w-5xl mx-auto">
                {/* Seções organizadas em grid responsivo */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
