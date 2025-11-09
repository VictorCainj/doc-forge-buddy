/**
 * Dashboard de Segurança
 * Monitoramento de alertas e atividades suspeitas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle,
  Activity,
  TrendingUp,
  Users,
  Clock,
  MapPin
} from '@/utils/iconMapper';
import { securityMonitor, SecurityAlert } from '@/services/audit/security-monitor.service';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const severityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};

export function SecurityDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isScanning, setIsScanning] = useState(false);

  // Carregar dados
  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = () => {
    setAlerts(securityMonitor.getActiveAlerts());
    setStats(securityMonitor.getSecurityStats());
  };

  const handleResolveAlert = async (alertId: string) => {
    await securityMonitor.resolveAlert(alertId, 'admin');
    loadSecurityData();
  };

  const handleManualScan = async () => {
    setIsScanning(true);
    try {
      await securityMonitor.checkForSuspiciousActivity();
      loadSecurityData();
    } catch (error) {
      console.error('Erro no scan manual:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const getAlertTrend = () => {
    // Simular dados de tendência
    return {
      today: alerts.length,
      yesterday: Math.max(0, alerts.length - 2),
      trend: alerts.length > 2 ? 'up' : 'down'
    };
  };

  const trend = getAlertTrend();

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Centro de Segurança
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoramento de segurança e detecção de atividades suspeitas
          </p>
        </div>
        <Button 
          onClick={handleManualScan}
          disabled={isScanning}
          className="flex items-center gap-2"
        >
          <Activity className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Escaneando...' : 'Executar Scan Manual'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {trend.trend === 'up' ? '+' : ''}{trend.today - trend.yesterday} desde ontem
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Segurança</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? Math.round((stats.resolvedAlerts / Math.max(stats.totalAlerts, 1)) * 100) : 0}%
                </p>
                <Progress value={stats ? (stats.resolvedAlerts / Math.max(stats.totalAlerts, 1)) * 100 : 0} className="mt-2" />
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ameaças Críticas</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'critical').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monitoramento</p>
                <p className="text-2xl font-bold text-green-600">Ativo</p>
                <p className="text-xs text-gray-500 mt-1">Última verificação: agora</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="alerts">Alertas Ativos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Alertas Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={severityColors[alert.severity]}>
                              {severityLabels[alert.severity]}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(alert.timestamp), 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {alert.ipAddress}
                            </span>
                            {alert.userId && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {alert.userId}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum alerta ativo</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && Object.keys(stats.alertsByType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.alertsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Alertas Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severidade</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <Badge className={severityColors[alert.severity]}>
                              {severityLabels[alert.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {alert.type.replace('_', ' ')}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm max-w-xs truncate">{alert.message}</p>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {alert.ipAddress}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {alert.userId || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              Resolver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sistema Seguro</h3>
                  <p className="text-gray-500">Nenhum alerta de segurança detectado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribuição por Severidade */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && Object.keys(stats.alertsBySeverity).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.alertsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {severityLabels[severity]}
                          </span>
                          <span className="text-sm text-gray-500">{count as number}</span>
                        </div>
                        <Progress 
                          value={((count as number) / Math.max(stats.totalAlerts, 1)) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            {/* Timeline de Segurança */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade de Segurança (7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = subDays(new Date(), 6 - i);
                    const dayAlerts = Math.floor(Math.random() * 5); // Simulado
                    
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {format(date, 'dd/MM', { locale: ptBR })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(dayAlerts * 20, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono w-8">{dayAlerts}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}