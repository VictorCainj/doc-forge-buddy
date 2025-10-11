import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Users,
  TrendingUp,
  Calendar,
  ArrowRight,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  // Métricas principais
  const metrics = [
    {
      title: 'Contratos Ativos',
      value: '24',
      change: '+3',
      trend: 'up',
      icon: FileText,
    },
    {
      title: 'Vencimentos Próximos',
      value: '5',
      change: 'Este mês',
      trend: 'warning',
      icon: Calendar,
    },
    {
      title: 'Análises Pendentes',
      value: '8',
      change: '-2',
      trend: 'down',
      icon: Clock,
    },
    {
      title: 'Taxa de Ocupação',
      value: '92%',
      change: '+5%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  // Atividades recentes
  const recentActivities = [
    {
      id: 1,
      type: 'contract',
      title: 'Novo contrato assinado',
      description: 'Contrato #1234 - Rua das Flores, 123',
      time: '2 horas atrás',
      status: 'success',
    },
    {
      id: 2,
      type: 'analysis',
      title: 'Análise de vistoria concluída',
      description: 'Apartamento 501 - Ed. Solar',
      time: '5 horas atrás',
      status: 'info',
    },
    {
      id: 3,
      type: 'alert',
      title: 'Contrato próximo ao vencimento',
      description: 'Contrato #5678 vence em 15 dias',
      time: '1 dia atrás',
      status: 'warning',
    },
  ];

  // Ações rápidas
  const quickActions = [
    {
      title: 'Novo Contrato',
      description: 'Cadastrar novo contrato de locação',
      icon: FileText,
      path: '/contratos/novo',
      color: 'primary',
    },
    {
      title: 'Nova Análise',
      description: 'Criar análise de vistoria',
      icon: CheckCircle,
      path: '/analise-vistoria',
      color: 'default',
    },
    {
      title: 'Ver Contratos',
      description: 'Gerenciar contratos existentes',
      icon: Users,
      path: '/contratos',
      color: 'default',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                Dashboard
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Bem-vindo de volta! Aqui está um resumo das suas atividades.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/contratos/novo')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.title}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-neutral-600" />
                    </div>
                    {metric.trend === 'up' && (
                      <Badge variant="success" className="text-xs">
                        {metric.change}
                      </Badge>
                    )}
                    {metric.trend === 'down' && (
                      <Badge variant="default" className="text-xs">
                        {metric.change}
                      </Badge>
                    )}
                    {metric.trend === 'warning' && (
                      <Badge variant="warning" className="text-xs">
                        {metric.change}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-neutral-900">
                      {metric.value}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">
                      {metric.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Atividades Recentes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === 'success'
                            ? 'bg-success-500'
                            : activity.status === 'warning'
                              ? 'bg-warning-500'
                              : 'bg-primary-500'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-neutral-400 mt-2">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate('/atividades')}
                  >
                    Ver todas as atividades
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.title}
                        onClick={() => navigate(action.path)}
                        className="w-full text-left p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-all group"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-neutral-200 transition-colors">
                            <Icon className="h-5 w-5 text-neutral-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900">
                              {action.title}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {action.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Status do Sistema */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">
                      Sincronização
                    </span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                      <span className="text-sm text-neutral-900">Ativo</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Backup</span>
                    <span className="text-sm text-neutral-500">Há 2 horas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Versão</span>
                    <span className="text-sm text-neutral-500">2.0.1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
