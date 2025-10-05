import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useContractsQuery } from '@/hooks/useContractsQuery';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  TrendingUp,
  Calendar,
  Users,
  MessageSquare,
  SearchCheck,
} from 'lucide-react';
import { formatDateBrazilian } from '@/utils/dateFormatter';

const Dashboard = () => {
  const navigate = useNavigate();
  const { contracts, isLoading } = useContractsQuery();
  
  // Calcular estatísticas
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return {
      total: contracts.length,
      active: contracts.filter(c => {
        const contractData = c as any;
        return contractData.status === 'active' || !contractData.status;
      }).length,
      pending: contracts.filter(c => {
        const contractData = c as any;
        return contractData.status === 'pending';
      }).length,
      expiring: contracts.filter(c => {
        const endDate = (c as any).form_data?.data_fim || c.form_data?.dataFirmamentoContrato;
        if (!endDate) return false;
        const date = new Date(endDate);
        return date > now && date <= thirtyDaysFromNow;
      }).length,
    };
  }, [contracts]);
  
  // Contratos recentes
  const recentContracts = useMemo(() => {
    return contracts.slice(0, 5);
  }, [contracts]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Visão geral da gestão de contratos</p>
        </div>
        <Button
          onClick={() => navigate('/cadastrar-contrato')}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Contratos</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total > 0 ? '+' : ''}
                  {stats.total} no sistema
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contratos Ativos</p>
                <p className="text-3xl font-bold text-slate-900">{stats.active}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
                <p className="text-xs text-orange-600 mt-1">
                  Requerem atenção
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vencendo em 30 dias</p>
                <p className="text-3xl font-bold text-slate-900">{stats.expiring}</p>
                <p className="text-xs text-red-600 mt-1">
                  {stats.expiring > 0 ? 'Ação necessária' : 'Tudo em dia'}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Contracts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Contratos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum contrato cadastrado ainda</p>
                <Button
                  onClick={() => navigate('/cadastrar-contrato')}
                  variant="outline"
                  className="mt-4"
                >
                  Criar Primeiro Contrato
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/editar-contrato/${contract.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {contract.form_data?.locatario || 'Sem nome'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {contract.form_data?.endereco_imovel || 'Sem endereço'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {contract.form_data?.numero_contrato || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBrazilian(contract.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => navigate('/contratos')}
              variant="outline"
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Todos os Contratos
            </Button>
            
            <Button
              onClick={() => navigate('/cadastrar-contrato')}
              variant="outline"
              className="w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Novo Contrato
            </Button>
            
            <Button
              onClick={() => navigate('/analise-vistoria')}
              variant="outline"
              className="w-full justify-start"
            >
              <SearchCheck className="h-4 w-4 mr-2" />
              Nova Análise de Vistoria
            </Button>
            
            <Button
              onClick={() => navigate('/vistoria-analises')}
              variant="outline"
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Análises Salvas
            </Button>
            
            <Button
              onClick={() => navigate('/prestadores')}
              variant="outline"
              className="w-full justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Prestadores
            </Button>
            
            <Button
              onClick={() => navigate('/chat')}
              variant="outline"
              className="w-full justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Assistente IA
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Dica do Dia</h3>
              <p className="text-sm text-slate-700">
                Use o <strong>Chat IA</strong> para gerar documentos rapidamente e obter assistência
                na análise de contratos. Economize tempo e aumente sua produtividade!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
