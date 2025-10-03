/**
 * Componente de Apresentação para QuickActions
 * Apenas UI - sem lógica de negócio
 */

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
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Interface limpa - apenas props de apresentação
export interface QuickAction {
  id: string;
  label: string;
  category: string;
  onClick: () => void;
}

export interface QuickActionsPresentationProps {
  contractNumber?: string;
  actions: QuickAction[];
  loading?: boolean;
}

// ✅ Mapeamento de ícones (apresentação)
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Termos': FileText,
  'Devolutivas': NotebookPen,
  'Notificações': AlertTriangle,
  'WhatsApp': Phone,
  'Contratos': Briefcase,
  'NPS': Star,
};

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'termo-locador': Home,
  'termo-locatario': User,
  'devolutiva-proprietario': Building,
  'devolutiva-locatario': User2,
  'notificacao-agendamento': Calendar,
  'whatsapp-proprietario': Phone,
  'whatsapp-locatario': Phone,
  'comercial': Briefcase,
  'caderninho': NotebookPen,
  'distrato': AlertTriangle,
  'cobranca-consumo': FileText,
  'recusa-assinatura': FileText,
  'nps-whatsapp': Star,
  'nps-email': Star,
};

export const QuickActionsPresentation: React.FC<QuickActionsPresentationProps> = ({
  contractNumber,
  actions,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Apenas lógica de UI (não de negócio)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Agrupar ações por categoria (lógica de apresentação)
  const groupedActions = actions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  const handleActionClick = (action: QuickAction) => {
    setIsOpen(false);
    setSelectedCategory(null);
    action.onClick();
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ✅ Botão de trigger - apenas apresentação */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          loading && "cursor-wait"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        <span>Ações Rápidas</span>
        <ChevronRight 
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-90"
          )} 
        />
      </button>

      {/* ✅ Dropdown - apenas apresentação */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-2">
            {/* Header */}
            <div className="px-3 py-2 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">
                Ações Rápidas
              </h3>
              {contractNumber && (
                <p className="text-xs text-muted-foreground">
                  Contrato: {contractNumber}
                </p>
              )}
            </div>

            {/* ✅ Categorias e ações - apenas apresentação */}
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(groupedActions).map(([category, categoryActions]) => {
                const CategoryIcon = categoryIcons[category] || FileText;
                const isExpanded = selectedCategory === category;

                return (
                  <div key={category} className="mb-2">
                    {/* Categoria */}
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                        "hover:bg-muted",
                        isExpanded && "bg-muted"
                      )}
                    >
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{category}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {categoryActions.length}
                      </span>
                      <ChevronRight 
                        className={cn(
                          "h-3 w-3 transition-transform",
                          isExpanded && "rotate-90"
                        )} 
                      />
                    </button>

                    {/* Ações da categoria */}
                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {categoryActions.map((action) => {
                          const ActionIcon = actionIcons[action.id] || FileText;
                          
                          return (
                            <button
                              key={action.id}
                              onClick={() => handleActionClick(action)}
                              disabled={loading}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                                "hover:bg-accent hover:text-accent-foreground",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                              )}
                            >
                              <ActionIcon className="h-3 w-3 text-muted-foreground" />
                              <span>{action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">
                {actions.length} ações disponíveis
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
