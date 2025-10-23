import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from '@/components/admin/UserManagement';
import { BulkEditPanel } from '@/components/admin/BulkEditPanel';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';
import { Reports } from '@/components/admin/Reports';
import { DataIntegrityChecker } from '@/components/admin/DataIntegrityChecker';
import { VistoriaAnalisesPanel } from '@/components/admin/VistoriaAnalisesPanel';
import { CleanupDuplicatesPanel } from '@/components/admin/CleanupDuplicatesPanel';
import {
  Users,
  FileText,
  FolderOpen,
  File,
  Shield,
  BarChart3,
  Database,
  Search,
  Trash2,
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
        { count: totalContracts },
        { count: totalPrestadores },
        { count: totalVistorias },
        { count: totalDocuments },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('contracts').select('*', { count: 'exact', head: true }),
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
        totalContracts: totalContracts || 0,
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
      value: stats?.totalContracts || 0,
      icon: FileText,
      description: 'Total de contratos',
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
    {
      title: 'Documentos',
      value: stats?.totalDocuments || 0,
      icon: File,
      description: 'Documentos salvos',
      color: 'text-info-600',
      bgColor: 'bg-info-50',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">
            Painel de Administração
          </h1>
          <p className="text-neutral-500 mt-2">
            Gerencie usuários, permissões e realize edições em massa
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-8 bg-neutral-200 rounded animate-pulse" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-neutral-900">
                        {stat.value}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {stat.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs de Funcionalidades */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <FileText className="h-4 w-4 mr-2" />
              Edição em Massa
            </TabsTrigger>
            <TabsTrigger value="vistorias">
              <Search className="h-4 w-4 mr-2" />
              Vistorias
            </TabsTrigger>
            <TabsTrigger value="cleanup">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpeza
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Shield className="h-4 w-4 mr-2" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="integrity">
              <Database className="h-4 w-4 mr-2" />
              Integridade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <BulkEditPanel />
          </TabsContent>

          <TabsContent value="vistorias" className="space-y-4">
            <VistoriaAnalisesPanel />
          </TabsContent>

          <TabsContent value="cleanup" className="space-y-4">
            <CleanupDuplicatesPanel />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditLogsViewer />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Reports />
          </TabsContent>

          <TabsContent value="integrity" className="space-y-4">
            <DataIntegrityChecker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
