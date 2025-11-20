import { useState } from 'react';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';
import { VistoriaAnalisesPanel } from '@/components/admin/VistoriaAnalisesPanel';
import { CleanupDuplicatesPanel } from '@/components/admin/CleanupDuplicatesPanel';
import { EvictionReasonsManagement } from '@/components/admin/EvictionReasonsManagement';
import { OccurrenceTypesManagement } from '@/components/admin/OccurrenceTypesManagement';
import { PrivacySettings } from '@/components/admin/PrivacySettings';
import { ContractsManagement } from '@/components/admin/ContractsManagement';
import {
  Users,
  FileText,
  FolderOpen,
  Shield,
  Search,
  Trash2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from '@/utils/iconMapper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SystemStats } from '@/types/admin';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Tipo para definição de opções administrativas
 */
interface AdminOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ReactNode;
  color: {
    icon: string;
    bg: string;
    border: string;
  };
}

const Admin = () => {
  // Estado para controlar qual opção está expandida
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  // Buscar estatísticas do sistema
  const { data: stats, isLoading } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async (): Promise<SystemStats> => {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalPrestadores },
        { count: totalVistorias },
        { count: totalDocuments },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('prestadores')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('vistoria_analises')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('saved_terms')
          .select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPrestadores: totalPrestadores || 0,
        totalVistorias: totalVistorias || 0,
        totalDocuments: totalDocuments || 0,
      };
    },
  });

  // Cards de estatísticas compactos
  const statsCards = [
    {
      title: 'Usuários',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: `${stats?.activeUsers || 0} ativos`,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Contratos',
      value: stats?.totalDocuments || 0,
      icon: FileText,
      description: 'Documentos salvos',
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Prestadores',
      value: stats?.totalPrestadores || 0,
      icon: Users,
      description: 'Cadastrados',
      color: 'text-info-600',
      bgColor: 'bg-info-50',
    },
    {
      title: 'Vistorias',
      value: stats?.totalVistorias || 0,
      icon: FolderOpen,
      description: 'Análises realizadas',
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
  ];

  // Opções administrativas com suas configurações
  const adminOptions: AdminOption[] = [
    {
      id: 'users',
      title: 'Gerenciamento de Usuários',
      description: 'Visualize, edite e gerencie permissões de usuários do sistema',
      icon: Users,
      component: <UserManagement />,
      color: {
        icon: 'text-primary-600',
        bg: 'bg-primary-50',
        border: 'border-primary-200',
      },
    },
    {
      id: 'motivos',
      title: 'Motivos de Despejo',
      description: 'Configure e gerencie os motivos de despejo disponíveis',
      icon: ClipboardList,
      component: <EvictionReasonsManagement />,
      color: {
        icon: 'text-success-600',
        bg: 'bg-success-50',
        border: 'border-success-200',
      },
    },
    {
      id: 'tipos-ocorrencia',
      title: 'Tipos de Ocorrência',
      description: 'Configure e gerencie os tipos de ocorrência disponíveis para contratos',
      icon: FileText,
      component: <OccurrenceTypesManagement />,
      color: {
        icon: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      },
    },
    {
      id: 'privacidade',
      title: 'Privacidade e Anonimização',
      description: 'Configure a anonimização de dados pessoais para gravações e demonstrações',
      icon: Shield,
      component: <PrivacySettings />,
      color: {
        icon: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
      },
    },
    {
      id: 'vistorias',
      title: 'Análises de Vistoria',
      description: 'Revise e gerencie análises de vistoria realizadas',
      icon: Search,
      component: <VistoriaAnalisesPanel />,
      color: {
        icon: 'text-info-600',
        bg: 'bg-info-50',
        border: 'border-info-200',
      },
    },
    {
      id: 'contracts',
      title: 'Gestão de Contratos',
      description: 'Administre contratos e documentos salvos no sistema',
      icon: FileText,
      component: <ContractsManagement />,
      color: {
        icon: 'text-warning-600',
        bg: 'bg-warning-50',
        border: 'border-warning-200',
      },
    },
    {
      id: 'cleanup',
      title: 'Limpeza de Dados',
      description: 'Remova duplicatas e mantenha a integridade dos dados',
      icon: Trash2,
      component: <CleanupDuplicatesPanel />,
      color: {
        icon: 'text-error-600',
        bg: 'bg-error-50',
        border: 'border-error-200',
      },
    },
    {
      id: 'audit',
      title: 'Logs de Auditoria',
      description: 'Visualize histórico de ações e atividades do sistema',
      icon: Shield,
      component: <AuditLogsViewer />,
      color: {
        icon: 'text-neutral-700',
        bg: 'bg-neutral-50',
        border: 'border-neutral-200',
      },
    },
  ];

  /**
   * Alterna a expansão de uma opção administrativa
   */
  const toggleOption = (optionId: string) => {
    setExpandedOption(expandedOption === optionId ? null : optionId);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Cabeçalho Minimalista */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                Administração
              </h1>
              <p className="text-sm text-neutral-600 mt-0.5">
                Gerencie recursos e configurações do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas Compactos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="elevation-1 border-neutral-200 hover:elevation-2 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                      <Icon className={cn('h-4 w-4', stat.color)} />
                    </div>
                    {isLoading ? (
                      <div className="w-8 h-5 bg-neutral-200 rounded animate-pulse" />
                    ) : (
                      <span className="text-xl font-semibold text-neutral-900">
                        {stat.value}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-medium text-neutral-700 mb-0.5">
                    {stat.title}
                  </h3>
                  {!isLoading && (
                    <p className="text-xs text-neutral-500">{stat.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Opções Administrativas em Cards Expansíveis */}
        <div className="space-y-3">
          {adminOptions.map((option) => {
            const Icon = option.icon;
            const isExpanded = expandedOption === option.id;

            return (
              <Card
                key={option.id}
                className={cn(
                  'elevation-1 border transition-all duration-200',
                  isExpanded
                    ? `${option.color.border} elevation-2`
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                {/* Cabeçalho do Card - Sempre Visível */}
                <button
                  onClick={() => toggleOption(option.id)}
                  className="w-full text-left"
                  aria-expanded={isExpanded}
                  aria-controls={`option-${option.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Ícone */}
                        <div
                          className={cn(
                            'flex-shrink-0 p-2.5 rounded-lg',
                            option.color.bg
                          )}
                        >
                          <Icon className={cn('h-5 w-5', option.color.icon)} />
                        </div>

                        {/* Título e Descrição */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-neutral-900 mb-0.5">
                            {option.title}
                          </h3>
                          <p className="text-sm text-neutral-600 line-clamp-1">
                            {option.description}
                          </p>
                        </div>
                      </div>

                      {/* Ícone de Expansão */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-neutral-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </button>

                {/* Conteúdo Expansível */}
                {isExpanded && (
                  <div
                    id={`option-${option.id}`}
                    className="border-t border-neutral-200 transition-all duration-200"
                  >
                    <div className="p-4 pt-4">{option.component}</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Admin;
