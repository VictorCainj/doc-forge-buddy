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
} from 'lucide-react';
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
  onNavigateToTerm: (contractId: string, termType: string) => void;
  generatingDocument?: string;
  className?: string;
}

const QuickActionsDropdown: React.FC<QuickActionsDropdownProps> = ({
  contractId,
  contractNumber,
  onGenerateDocument,
  onNavigateToTerm,
  generatingDocument,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Definir todas as ações rápidas
  const quickActions: QuickAction[] = [
    // TERMOS / DEVOLUTIVAS
    {
      id: 'locador',
      label: 'Locador',
      icon: User,
      onClick: () => onGenerateDocument(contractId, '', 'Termo do Locador'),
      disabled: generatingDocument === `${contractId}-Termo do Locador`,
      loading: generatingDocument === `${contractId}-Termo do Locador`,
    },
    {
      id: 'proprietario',
      label: 'Devolutiva Proprietária',
      icon: Home,
      onClick: () =>
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
          'Devolutiva Proprietário'
        ),
      disabled: generatingDocument === `${contractId}-Devolutiva Proprietário`,
      loading: generatingDocument === `${contractId}-Devolutiva Proprietário`,
    },
    {
      id: 'locatario',
      label: 'Locatária',
      icon: User2,
      onClick: () => onGenerateDocument(contractId, '', 'Termo do Locatário'),
      disabled: generatingDocument === `${contractId}-Termo do Locatário`,
      loading: generatingDocument === `${contractId}-Termo do Locatário`,
    },
    {
      id: 'locatario-prop',
      label: 'Devolutiva Locatária',
      icon: Building,
      onClick: () =>
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_LOCATARIO_TEMPLATE,
          'Devolutiva Locatário'
        ),
      disabled: generatingDocument === `${contractId}-Devolutiva Locatário`,
      loading: generatingDocument === `${contractId}-Devolutiva Locatário`,
    },
    // COMUNICAÇÃO / WHATSAPP
    {
      id: 'agenda',
      label: 'Notificação de Agendamento',
      icon: Calendar,
      onClick: () =>
        onGenerateDocument(
          contractId,
          NOTIFICACAO_AGENDAMENTO_TEMPLATE,
          'Notificação de Agendamento'
        ),
      disabled:
        generatingDocument === `${contractId}-Notificação de Agendamento`,
      loading:
        generatingDocument === `${contractId}-Notificação de Agendamento`,
    },
    {
      id: 'prop-whatsapp',
      label: 'Proprietária',
      icon: Phone,
      onClick: () =>
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
          'Devolutiva Locador WhatsApp'
        ),
      disabled:
        generatingDocument === `${contractId}-Devolutiva Locador WhatsApp`,
      loading:
        generatingDocument === `${contractId}-Devolutiva Locador WhatsApp`,
    },
    {
      id: 'comercial',
      label: 'Comercial',
      icon: Briefcase,
      onClick: () =>
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_COMERCIAL_TEMPLATE,
          'Devolutiva Comercial'
        ),
      disabled: generatingDocument === `${contractId}-Devolutiva Comercial`,
      loading: generatingDocument === `${contractId}-Devolutiva Comercial`,
    },
    {
      id: 'loc-whatsapp',
      label: 'Locatária',
      icon: Phone,
      onClick: () =>
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
          'Devolutiva Locatário WhatsApp'
        ),
      disabled:
        generatingDocument === `${contractId}-Devolutiva Locatário WhatsApp`,
      loading:
        generatingDocument === `${contractId}-Devolutiva Locatário WhatsApp`,
    },
    // DOCUMENTOS
    {
      id: 'caderninho',
      label: 'Caderninho',
      icon: NotebookPen,
      onClick: () =>
        onGenerateDocument(
          contractId,
          DEVOLUTIVA_CADERNINHO_TEMPLATE,
          'Devolutiva Caderninho'
        ),
      disabled: generatingDocument === `${contractId}-Devolutiva Caderninho`,
      loading: generatingDocument === `${contractId}-Devolutiva Caderninho`,
    },
    {
      id: 'distrato',
      label: 'Distrato',
      icon: FileText,
      onClick: () =>
        onGenerateDocument(
          contractId,
          DISTRATO_CONTRATO_LOCACAO_TEMPLATE,
          'Distrato de Contrato de Locação'
        ),
      disabled:
        generatingDocument === `${contractId}-Distrato de Contrato de Locação`,
      loading:
        generatingDocument === `${contractId}-Distrato de Contrato de Locação`,
    },
  ];

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const handleActionClick = (action: QuickAction) => {
    if (!action.disabled) {
      action.onClick();
      setIsOpen(false);
    }
  };

  // Agrupar ações por categoria
  const termActions = quickActions.slice(0, 4);
  const communicationActions = quickActions.slice(4, 8);
  const documentActions = quickActions.slice(8, 10);

  return (
    <div
      ref={dropdownRef}
      className={cn('relative overflow-visible', className)}
    >
      {/* Botão da seta */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors cursor-pointer border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 relative z-50"
      >
        <span>AÇÕES RÁPIDAS</span>
        <ChevronRight
          className={cn(
            'h-3 w-3 text-gray-400 transition-transform duration-200',
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

          {/* Menu centralizado */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white border border-gray-200 rounded-lg shadow-2xl min-w-[320px] max-w-[400px] max-h-[80vh] overflow-hidden">
            {/* Header do modal */}
            <div className="relative p-4 border-b border-gray-200 bg-gray-50">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ações Rápidas
                </h3>
                {contractNumber && (
                  <p className="text-sm text-gray-600 mt-1">
                    Contrato:{' '}
                    <span className="font-medium text-blue-600">
                      {contractNumber}
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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

            {/* Conteúdo do menu */}
            <div className="py-4 max-h-[calc(80vh-80px)] overflow-auto">
              {/* TERMOS / DEVOLUTIVAS */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 uppercase mb-4 text-center px-4">
                  TERMOS / DEVOLUTIVAS
                </p>
                <div className="grid grid-cols-2 gap-3 px-4">
                  {termActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action)}
                      disabled={action.disabled}
                      className="flex flex-col items-center justify-center gap-2 hover:bg-gray-50 p-3 rounded-lg transition-colors disabled:opacity-50 border border-gray-100 hover:border-gray-200"
                    >
                      {action.loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      ) : (
                        <action.icon className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="text-xs text-gray-700 text-center leading-tight">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* COMUNICAÇÃO / WHATSAPP */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 uppercase mb-4 text-center px-4">
                  COMUNICAÇÃO / WHATSAPP
                </p>
                <div className="grid grid-cols-2 gap-3 px-4">
                  {communicationActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action)}
                      disabled={action.disabled}
                      className="flex flex-col items-center justify-center gap-2 hover:bg-gray-50 p-3 rounded-lg transition-colors disabled:opacity-50 border border-gray-100 hover:border-gray-200"
                    >
                      {action.loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      ) : (
                        <action.icon className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="text-xs text-gray-700 text-center leading-tight">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DOCUMENTOS */}
              <div>
                <p className="text-sm font-medium text-gray-700 uppercase mb-4 text-center px-4">
                  DOCUMENTOS
                </p>
                <div className="grid grid-cols-2 gap-3 px-4">
                  {documentActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action)}
                      disabled={action.disabled}
                      className="flex flex-col items-center justify-center gap-2 hover:bg-gray-50 p-3 rounded-lg transition-colors disabled:opacity-50 border border-gray-100 hover:border-gray-200"
                    >
                      {action.loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      ) : (
                        <action.icon className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="text-xs text-gray-700 text-center leading-tight">
                        {action.label}
                      </span>
                    </button>
                  ))}
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
