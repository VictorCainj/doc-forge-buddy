/**
 * Componente de Apresentação para Dashboard Simples
 * Apenas UI - sem lógica de negócio
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  TrendingUp, 
  Calendar, 
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ✅ Interface limpa - apenas props de apresentação
export interface DashboardPresentationProps {
  // Dados processados
  totalContracts: number;
  contractsThisMonth: number;
  contractsOver30Days: number;
  chartData: Array<{ name: string; value: number; date: string }>;
  recentContracts: Array<{
    id: string;
    number: string;
    tenant: string;
    address: string;
    date: string;
  }>;
  
  // Estados
  loading: boolean;
  
  // Configurações
  preferences: {
    theme: string;
    contractsPerPage: number;
    autoRefresh: boolean;
  };
  
  // Callbacks
  onRefresh: () => void;
  onExport: () => void;
  onPreferenceChange: (key: string, value: any) => void;
}

export const DashboardPresentation: React.FC<DashboardPresentationProps> = ({
  totalContracts,
  contractsThisMonth,
  contractsOver30Days,
  recentContracts,
  loading,
  onRefresh,
  onExport,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ✅ Header - apenas apresentação */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Visão geral dos seus contratos e atividades
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Atualizar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button asChild>
              <Link to="/contratos">
                <FileText className="h-4 w-4 mr-2" />
                Ver Contratos
              </Link>
            </Button>
          </div>
        </div>

        {/* ✅ Métricas - apenas apresentação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Contratos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  totalContracts
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Contratos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Este Mês
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  contractsThisMonth
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Novos contratos
              </p>
              {contractsThisMonth > 0 && (
                <Badge variant="secondary" className="mt-1">
                  +{Math.round((contractsThisMonth / totalContracts) * 100)}%
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mais de 30 dias
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  contractsOver30Days
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Contratos antigos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ✅ Contratos Recentes - apenas apresentação */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contratos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : recentContracts.length > 0 ? (
              <div className="space-y-3">
                {recentContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {contract.number}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">
                          {contract.tenant}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contract.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(contract.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum contrato encontrado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ✅ Ações Rápidas - apenas apresentação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button asChild variant="outline" className="h-20">
            <Link to="/cadastrar-contrato" className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Novo Contrato</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20">
            <Link to="/analise-vistoria" className="flex flex-col items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Análise Vistoria</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20">
            <Link to="/chat" className="flex flex-col items-center gap-2">
              <Settings className="h-6 w-6" />
              <span>Chat IA</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20">
            <Link to="/vistoria-analises" className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Relatórios</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
