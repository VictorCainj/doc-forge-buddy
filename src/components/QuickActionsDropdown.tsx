// @ts-nocheck
import React, { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
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

const QuickActionsDropdown = memo<QuickActionsDropdownProps>(
  ({ contractId, contractNumber, onGenerateDocument }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loadingActions, setLoadingActions] = useState<Set<string>>(
      new Set()
    );
    const dropdownRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hasAnalise, setHasAnalise] = useState(false);
    const [checkingAnalise, setCheckingAnalise] = useState(false);
    
    // Estados para arrastar o modal
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showHighlight, setShowHighlight] = useState(false);

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

    // Controlar overflow do body quando modal está aberto e redirecionar visualmente
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        // Resetar posição quando abrir
        setPosition({ x: 0, y: 0 });
        setShowHighlight(true);
        
        // Scroll suave para o topo para garantir que o modal seja visível
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
        
        // Remover destaque após 2 segundos
        const highlightTimer = setTimeout(() => {
          setShowHighlight(false);
        }, 2000);
        
        // Pequeno delay para garantir que o scroll aconteça após o modal aparecer
        setTimeout(() => {
          // Focar no modal para acessibilidade
          if (modalRef.current) {
            modalRef.current.focus();
          }
        }, 100);

        return () => {
          clearTimeout(highlightTimer);
        };
      } else {
        document.body.style.overflow = '';
        setShowHighlight(false);
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    // Handlers para arrastar o modal
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      // Não iniciar arraste se clicar em elementos interativos
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.tagName === 'A' ||
        target.closest('a')
      ) {
        return;
      }

      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        // Se está centralizado, usar coordenadas absolutas da viewport
        if (position.x === 0 && position.y === 0) {
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          // Converter posição centralizada para posição absoluta
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          setPosition({
            x: centerX - rect.width / 2,
            y: centerY - rect.height / 2,
          });
        } else {
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
        setIsDragging(true);
      }
    };

    useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (!modalRef.current) return;

        const modalRect = modalRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calcular nova posição
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        // Limitar movimento dentro da viewport
        const maxX = viewportWidth - modalRect.width;
        const maxY = viewportHeight - modalRect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragOffset]);

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

        const formData = (data.form_data as Record<string, string>) || {};

        // Garantir que numeroContrato seja uma string válida, não UUID
        const contractData = {
          ...formData,
          // Não incluir o id da tabela saved_terms como numeroContrato
          // O numeroContrato deve vir do form_data
          title: data.title,
        };

        // Se não há numeroContrato no form_data, usar um placeholder
        if (!contractData.numeroContrato) {
          contractData.numeroContrato = '[NÚMERO NÃO DEFINIDO]';
        }

        return contractData;
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
            'Notificação de Desocupação e Agendamento de Vistoria'
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
            'Devolutiva Locatário'
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
            'Notificação de Desocupação - Comercial'
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
        id: 'status-vistoria',
        label: 'Status Vistoria',
        icon: Phone,
        onClick: () => {
          onGenerateDocument(
            contractId,
            STATUS_VISTORIA_WHATSAPP_TEMPLATE,
            'Status Vistoria'
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
    const documentActionsWithLoading =
      updateActionsWithLoading(documentActions);
    const recusaActionsWithLoading = updateActionsWithLoading(recusaActions);

    return (
      <div ref={dropdownRef} className="relative">
        {/* Botão trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border text-sm font-medium',
            isOpen
              ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm'
          )}
        >
          <span>Ações Rápidas</span>
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-90'
            )}
          />
        </button>

        {/* Modal centralizado - Renderizado via Portal */}
        {isOpen &&
          createPortal(
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/40 z-[9998]"
                onClick={() => setIsOpen(false)}
              />

              {/* Modal - Centralizado e arrastável */}
              <div 
                ref={modalRef}
                tabIndex={-1}
                className={`fixed z-[9999] w-[90vw] max-w-6xl max-h-[90vh] min-h-[400px] sm:min-h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
                  isDragging ? 'cursor-grabbing' : ''
                } ${!isDragging && position.x === 0 && position.y === 0 ? 'animate-in fade-in-0 zoom-in-95' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxHeight: 'calc(100vh - 4rem)',
                  left: position.x === 0 && position.y === 0 ? '50%' : `${position.x}px`,
                  top: position.x === 0 && position.y === 0 ? '50%' : `${position.y}px`,
                  transform: position.x === 0 && position.y === 0 ? 'translate(-50%, -50%)' : 'none',
                  outline: 'none',
                  boxShadow: showHighlight && position.x === 0 && position.y === 0 
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.3)' 
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  transition: 'box-shadow 0.3s ease-out, transform 0.2s ease-out',
                }}
              >
              {/* Header do modal - Fixo e arrastável */}
              <div 
                className={`relative px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white flex-shrink-0 ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                } select-none`}
                onMouseDown={handleMouseDown}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                    Ações Rápidas
                  </h3>
                  {contractNumber && (
                    <p className="text-sm text-neutral-600 mt-1.5">
                      Contrato:{' '}
                      <span className="font-medium text-neutral-900">
                        {contractNumber}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-200 z-10"
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

              {/* Conteúdo do menu organizado - Com scrollbar customizada */}
              <div className="flex-1 p-6 overflow-y-auto bg-neutral-50 custom-scrollbar min-h-0">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Coluna 1: TERMOS */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="px-1 pb-2">
                          <h4 className="text-xs font-semibold text-black uppercase tracking-wider">
                            Chaves
                          </h4>
                        </div>
                        {termActionsWithLoading.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            disabled={action.disabled}
                            className="w-full flex items-center gap-3 bg-white hover:bg-neutral-50 p-3 rounded-lg transition-all duration-200 disabled:opacity-50 border border-neutral-200 hover:border-blue-300"
                          >
                            {action.loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <div
                                className="p-1 rounded bg-black"
                                style={{
                                  imageRendering: 'crisp-edges',
                                  backfaceVisibility: 'hidden',
                                }}
                              >
                                <action.icon
                                  className="h-3 w-3 text-white flex-shrink-0"
                                  color="#FFFFFF"
                                  strokeWidth={2.5}
                                  style={{
                                    color: '#FFFFFF',
                                    stroke: '#FFFFFF',
                                    fill: 'none',
                                    shapeRendering: 'geometricPrecision',
                                  }}
                                />
                              </div>
                            )}
                            <span className="text-sm text-gray-600 font-medium text-left">
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
                      <div className="space-y-4">
                        {/* E-mail */}
                        <div>
                          <div className="px-1 pb-2">
                            <h4 className="text-xs font-semibold text-black uppercase tracking-wider">
                              E-mail
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {communicationActionsWithLoading
                              .filter(
                                (action) =>
                                  action.id.includes('email') ||
                                  action.id === 'notificacao-agendamento'
                              )
                              .map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => handleActionClick(action)}
                                  disabled={action.disabled}
                                  className="w-full flex items-center gap-3 bg-white hover:bg-neutral-50 p-3 rounded-lg transition-all duration-200 disabled:opacity-50 border border-neutral-200 hover:border-blue-300"
                                >
                                  {action.loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                  ) : (
                                    <div
                                      className="p-1 rounded bg-black"
                                      style={{
                                        imageRendering: 'crisp-edges',
                                        backfaceVisibility: 'hidden',
                                      }}
                                    >
                                      <action.icon
                                        className="h-3 w-3 text-white flex-shrink-0"
                                        color="#FFFFFF"
                                        strokeWidth={2.5}
                                        style={{
                                          color: '#FFFFFF',
                                          stroke: '#FFFFFF',
                                          fill: 'none',
                                          shapeRendering: 'geometricPrecision',
                                        }}
                                      />
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-600 font-medium text-left">
                                    {action.id === 'devolutiva-email-locador'
                                      ? 'E-mail (Locador)'
                                      : action.id ===
                                          'devolutiva-email-locatario'
                                        ? 'E-mail (Locatário)'
                                        : action.id ===
                                            'notificacao-agendamento'
                                          ? 'Agendamento'
                                          : action.label}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* WhatsApp */}
                        <div>
                          <div className="px-1 pb-2">
                            <h4 className="text-xs font-semibold text-black uppercase tracking-wider">
                              WhatsApp
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {communicationActionsWithLoading
                              .filter(
                                (action) =>
                                  action.id.includes('whatsapp') ||
                                  action.id === 'status-vistoria'
                              )
                              .map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => handleActionClick(action)}
                                  disabled={action.disabled}
                                  className="w-full flex items-center gap-3 bg-white hover:bg-neutral-50 p-3 rounded-lg transition-all duration-200 disabled:opacity-50 border border-neutral-200 hover:border-blue-300"
                                >
                                  {action.loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                  ) : (
                                    <div
                                      className="p-1 rounded bg-black"
                                      style={{
                                        imageRendering: 'crisp-edges',
                                        backfaceVisibility: 'hidden',
                                      }}
                                    >
                                      <action.icon
                                        className="h-3 w-3 text-white flex-shrink-0"
                                        color="#FFFFFF"
                                        strokeWidth={2.5}
                                        style={{
                                          color: '#FFFFFF',
                                          stroke: '#FFFFFF',
                                          fill: 'none',
                                          shapeRendering: 'geometricPrecision',
                                        }}
                                      />
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-600 font-medium text-left">
                                    {action.id === 'whatsapp-proprietaria'
                                      ? 'Proprietária'
                                      : action.id === 'whatsapp-comercial'
                                        ? 'Comercial'
                                        : action.id === 'whatsapp-locataria'
                                          ? 'Locatária'
                                          : action.id === 'status-vistoria'
                                            ? 'Status Vistoria'
                                            : action.label}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Outros */}
                        <div>
                          <div className="px-1 pb-2">
                            <h4 className="text-xs font-semibold text-black uppercase tracking-wider">
                              Outros
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {communicationActionsWithLoading
                              .filter(
                                (action) =>
                                  !action.id.includes('email') &&
                                  !action.id.includes('whatsapp') &&
                                  action.id !== 'notificacao-agendamento' &&
                                  action.id !== 'status-vistoria'
                              )
                              .map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => handleActionClick(action)}
                                  disabled={action.disabled}
                                  className="w-full flex items-center gap-3 bg-white hover:bg-neutral-50 p-3 rounded-lg transition-all duration-200 disabled:opacity-50 border border-neutral-200 hover:border-blue-300"
                                  aria-label={action.label || action.id}
                                >
                                  {action.loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />
                                  ) : (
                                    <div
                                      className="p-1 rounded bg-black"
                                      style={{
                                        imageRendering: 'crisp-edges',
                                        backfaceVisibility: 'hidden',
                                      }}
                                      aria-hidden="true"
                                    >
                                      <action.icon
                                        className="h-3 w-3 text-white flex-shrink-0"
                                        color="#FFFFFF"
                                        strokeWidth={2.5}
                                        style={{
                                          color: '#FFFFFF',
                                          stroke: '#FFFFFF',
                                          fill: 'none',
                                          shapeRendering: 'geometricPrecision',
                                        }}
                                      />
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-600 font-medium text-left">
                                    {action.id === 'cobranca-consumo'
                                      ? 'Cobrança'
                                      : action.label}
                                  </span>
                                </button>
                              ))}

                            {/* Botão de Análise de Vistoria */}
                            <button
                              onClick={async () => {
                                const { data: contract } = await supabase
                                  .from('saved_terms')
                                  .select('*')
                                  .eq('id', contractId)
                                  .single();

                                if (contract) {
                                  const formData = contract.form_data as Record<
                                    string,
                                    string
                                  >;
                                  navigate('/analise-vistoria', {
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
                                setIsOpen(false);
                              }}
                              disabled={checkingAnalise}
                              className="w-full flex items-center gap-3 bg-white hover:bg-neutral-50 p-3 rounded-lg transition-all duration-200 disabled:opacity-50 border border-neutral-200 hover:border-blue-300"
                              aria-label={checkingAnalise
                                ? 'Verificando análise de vistoria'
                                : hasAnalise
                                  ? 'Carregar análise de vistoria'
                                  : 'Criar análise de vistoria'}
                            >
                              {checkingAnalise ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />
                              ) : (
                                <div
                                  className="p-1 rounded bg-black"
                                  style={{
                                    imageRendering: 'crisp-edges',
                                    backfaceVisibility: 'hidden',
                                  }}
                                  aria-hidden="true"
                                >
                                  <SearchCheck
                                    className="h-3 w-3 text-white flex-shrink-0"
                                    color="#FFFFFF"
                                    strokeWidth={2.5}
                                    style={{
                                      color: '#FFFFFF',
                                      stroke: '#FFFFFF',
                                      fill: 'none',
                                      shapeRendering: 'geometricPrecision',
                                    }}
                                  />
                                </div>
                              )}
                              <span className="text-sm text-gray-600 font-medium text-left">
                                {checkingAnalise
                                  ? 'Verificando...'
                                  : hasAnalise
                                    ? 'Carregar Análise'
                                    : 'Criar Análise'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna 3: DOCUMENTOS E OUTROS */}
                    <div className="space-y-3">
                      {/* DOCUMENTOS */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="px-1 pb-2">
                            <h4 className="text-xs font-semibold text-black uppercase tracking-wider">
                              Contratos
                            </h4>
                          </div>
                          {documentActionsWithLoading.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleActionClick(action)}
                              disabled={action.disabled}
                              className="w-full flex items-center gap-3 bg-white hover:bg-neutral-50 p-3 rounded-lg transition-all duration-200 disabled:opacity-50 border border-neutral-200 hover:border-blue-300"
                            >
                              {action.loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              ) : (
                                <div
                                  className="p-1 rounded bg-black"
                                  style={{
                                    imageRendering: 'crisp-edges',
                                    backfaceVisibility: 'hidden',
                                  }}
                                >
                                  <action.icon
                                    className="h-3 w-3 text-white flex-shrink-0"
                                    color="#FFFFFF"
                                    strokeWidth={2.5}
                                    style={{
                                      color: '#FFFFFF',
                                      stroke: '#FFFFFF',
                                      fill: 'none',
                                      shapeRendering: 'geometricPrecision',
                                    }}
                                  />
                                </div>
                              )}
                              <span className="text-sm text-gray-600 font-medium text-left">
                                {action.id === 'caderninho'
                                  ? 'Caderninho'
                                  : action.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* TERMO DE RECUSA */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="px-1 pb-2">
                            <h4 className="text-xs font-semibold text-black uppercase tracking-wider">
                              Assinatura
                            </h4>
                          </div>
                          {recusaActionsWithLoading.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleActionClick(action)}
                              disabled={action.disabled}
                              className="w-full flex items-center gap-3 bg-white hover:bg-neutral-50 p-3 rounded-lg transition-all duration-200 disabled:opacity-50 border border-neutral-200 hover:border-blue-300"
                            >
                              {action.loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              ) : (
                                <div
                                  className="p-1 rounded bg-black"
                                  style={{
                                    imageRendering: 'crisp-edges',
                                    backfaceVisibility: 'hidden',
                                  }}
                                >
                                  <action.icon
                                    className="h-3 w-3 text-white flex-shrink-0"
                                    color="#FFFFFF"
                                    strokeWidth={2.5}
                                    style={{
                                      color: '#FFFFFF',
                                      stroke: '#FFFFFF',
                                      fill: 'none',
                                      shapeRendering: 'geometricPrecision',
                                    }}
                                  />
                                </div>
                              )}
                              <span className="text-sm text-gray-600 font-medium text-left">
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
            </>,
            document.body
          )}
      </div>
    );
  }
);

QuickActionsDropdown.displayName = 'QuickActionsDropdown';

export default QuickActionsDropdown;
