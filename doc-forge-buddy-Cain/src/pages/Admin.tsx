import { useState, useMemo, lazy, Suspense } from 'react';
import { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SystemStats } from '@/types/business/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

// Lazy load dos painéis administrativos para melhor performance inicial (Code Splitting)
// Usa-se .then() para mapear named exports para o default export esperado pelo React.lazy
const UserManagement = lazy(() =>
  import('@/components/admin/UserManagement').then(module => ({
    default: module.UserManagement,
  }))
);
const AuditLogsViewer = lazy(() =>
  import('@/components/admin/AuditLogsViewer').then(module => ({
    default: module.AuditLogsViewer,
  }))
);
const VistoriaAnalisesPanel = lazy(() =>
  import('@/components/admin/VistoriaAnalisesPanel').then(module => ({
    default: module.VistoriaAnalisesPanel,
  }))
);
const CleanupDuplicatesPanel = lazy(() =>
  import('@/components/admin/CleanupDuplicatesPanel').then(module => ({
    default: module.CleanupDuplicatesPanel,
  }))
);
const EvictionReasonsManagement = lazy(() =>
  import('@/components/admin/EvictionReasonsManagement').then(module => ({
    default: module.EvictionReasonsManagement,
  }))
);
const ContractsManagement = lazy(() =>
  import('@/components/admin/ContractsManagement').then(module => ({
    default: module.ContractsManagement,
  }))
);

/**
 * Tipo para definição de opções administrativas
 */
interface AdminOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  component: React.ReactNode;
  color: {
    icon: string;
    bg: string;
    border: string;
  };
}

/**
 * Componente de Loading Skeleton para os painéis
 */
const PanelLoader = () => (
  <div className='p-6 space-y-4 animate-pulse w-full'>
    <div className='flex gap-4'>
      <Skeleton className='h-10 w-1/3 rounded-md' />
      <Skeleton className='h-10 w-24 rounded-md' />
    </div>
    <Skeleton className='h-48 w-full rounded-md' />
  </div>
);

const Admin = () => {
  // Estado para controlar qual opção está expandida
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  // Buscar estatísticas do sistema com cache otimizado via React Query
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
    staleTime: 5 * 60 * 1000, // Cache stats for 5 minutes
  });

  // Memoização dos cards de estatísticas para evitar re-cálculos
  const statsCards = useMemo(
    () => [
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
    ],
    [stats]
  );

  // Configuração das opções administrativas (Memoized)
  const adminOptions: AdminOption[] = useMemo(
    () => [
      {
        id: 'users',
        title: 'Gerenciamento de Usuários',
        description:
          'Visualize, edite e gerencie permissões de usuários do sistema',
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
    ],
    []
  );

  /**
   * Alterna a expansão de uma opção administrativa
   */
  const toggleOption = (optionId: string) => {
    setExpandedOption(expandedOption === optionId ? null : optionId);
  };

  return (
    <div className='min-h-screen bg-neutral-50'>
      <div className='max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8'>
        {/* Cabeçalho Minimalista */}
        <div className='mb-8 animate-in fade-in slide-in-from-top-4 duration-500'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center shadow-sm'>
              <Shield className='h-5 w-5 text-neutral-700' />
            </div>
            <div>
              <h1 className='text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight'>
                Administração
              </h1>
              <p className='text-sm text-neutral-600 mt-0.5'>
                Gerencie recursos e configurações do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas Compactos */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-8'>
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={cn(
                  'elevation-1 border-neutral-200 hover:elevation-2 transition-all duration-200 animate-in zoom-in-95',
                  // Stagger animation delay base index
                  `delay-[${index * 100}ms]`
                )}
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        stat.bgColor
                      )}
                    >
                      <Icon className={cn('h-4 w-4', stat.color)} />
                    </div>
                    {isLoading ? (
                      <Skeleton className='w-8 h-5 rounded' />
                    ) : (
                      <span className='text-xl font-semibold text-neutral-900'>
                        {stat.value}
                      </span>
                    )}
                  </div>
                  <h3 className='text-xs font-medium text-neutral-700 mb-0.5'>
                    {stat.title}
                  </h3>
                  {!isLoading && (
                    <p className='text-xs text-neutral-500'>
                      {stat.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Opções Administrativas em Cards Expansíveis */}
        <div className='space-y-3'>
          {adminOptions.map(option => {
            const Icon = option.icon;
            const isExpanded = expandedOption === option.id;

            return (
              <Card
                key={option.id}
                className={cn(
                  'elevation-1 border transition-all duration-300 ease-in-out overflow-hidden',
                  isExpanded
                    ? `${option.color.border} elevation-3 ring-1 ring-opacity-50`
                    : 'border-neutral-200 hover:border-neutral-300 hover:elevation-2'
                )}
              >
                {/* Cabeçalho do Card - Sempre Visível */}
                <button
                  onClick={() => toggleOption(option.id)}
                  className='w-full text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-t-lg'
                  aria-expanded={isExpanded}
                  aria-controls={`option-${option.id}`}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        {/* Ícone */}
                        <div
                          className={cn(
                            'flex-shrink-0 p-2.5 rounded-lg transition-colors duration-200',
                            option.color.bg
                          )}
                        >
                          <Icon className={cn('h-5 w-5', option.color.icon)} />
                        </div>

                        {/* Título e Descrição */}
                        <div className='flex-1 min-w-0'>
                          <h3
                            className={cn(
                              'text-base font-semibold mb-0.5 transition-colors',
                              isExpanded
                                ? 'text-primary-900'
                                : 'text-neutral-900'
                            )}
                          >
                            {option.title}
                          </h3>
                          <p className='text-sm text-neutral-600 line-clamp-1 sm:line-clamp-none'>
                            {option.description}
                          </p>
                        </div>
                      </div>

                      {/* Ícone de Expansão */}
                      <div className='flex-shrink-0 text-neutral-400 transition-transform duration-300'>
                        {isExpanded ? (
                          <ChevronUp className='h-5 w-5' />
                        ) : (
                          <ChevronDown className='h-5 w-5' />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </button>

                {/* Conteúdo Expansível com Suspense para Lazy Loading */}
                {isExpanded && (
                  <div
                    id={`option-${option.id}`}
                    className='border-t border-neutral-200 bg-white animate-in slide-in-from-top-2 duration-300'
                  >
                    <Suspense fallback={<PanelLoader />}>
                      <div className='p-1 sm:p-4'>{option.component}</div>
                    </Suspense>
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
