import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';
import { VistoriaAnalisesPanel } from '@/components/admin/VistoriaAnalisesPanel';
import { CleanupDuplicatesPanel } from '@/components/admin/CleanupDuplicatesPanel';
import { EvictionReasonsManagement } from '@/components/admin/EvictionReasonsManagement';
import {
  Users,
  FileText,
  FolderOpen,
  Shield,
  Search,
  Trash2,
  ClipboardList,
} from '@/utils/iconMapper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SystemStats } from '@/types/admin';

const Admin = () => {
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

  const statsCards = [
    {
      title: 'Total de Usuários',
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
      description: 'Contratos salvos',
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Prestadores',
      value: stats?.totalPrestadores || 0,
      icon: Users,
      description: 'Cadastrados',
      color: 'text-primary-700',
      bgColor: 'bg-primary-100',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Cabeçalho Moderno */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
                Painel de Administração
              </h1>
              <p className="text-neutral-600 mt-1.5 text-sm sm:text-base">
                Gerencie usuários, permissões e análises de vistoria
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas Modernos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="group relative bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-lg hover:border-neutral-300 transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    {isLoading ? (
                      <div className="w-12 h-4 bg-neutral-200 rounded animate-pulse" />
                    ) : (
                      <div className="text-3xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                        {stat.value}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                    {stat.title}
                  </h3>
                  {!isLoading && (
                    <p className="text-xs text-neutral-500">
                      {stat.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs de Funcionalidades Modernizadas */}
        <Tabs defaultValue="users" className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-2 shadow-sm">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-transparent h-auto">
              <TabsTrigger
                value="users"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger
                value="motivos"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Motivos</span>
              </TabsTrigger>
              <TabsTrigger
                value="vistorias"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Vistorias</span>
              </TabsTrigger>
              <TabsTrigger
                value="cleanup"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Limpeza</span>
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Auditoria</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="users"
            className="space-y-4 animate-in fade-in-50 duration-300"
          >
            <UserManagement />
          </TabsContent>

          <TabsContent
            value="motivos"
            className="space-y-4 animate-in fade-in-50 duration-300"
          >
            <EvictionReasonsManagement />
          </TabsContent>

          <TabsContent
            value="vistorias"
            className="space-y-4 animate-in fade-in-50 duration-300"
          >
            <VistoriaAnalisesPanel />
          </TabsContent>

          <TabsContent
            value="cleanup"
            className="space-y-4 animate-in fade-in-50 duration-300"
          >
            <CleanupDuplicatesPanel />
          </TabsContent>

          <TabsContent
            value="audit"
            className="space-y-4 animate-in fade-in-50 duration-300"
          >
            <AuditLogsViewer />
          </TabsContent>
        </Tabs>
      </div>

      {/* Estilos personalizados para animações */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Admin;
