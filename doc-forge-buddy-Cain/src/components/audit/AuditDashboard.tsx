/**
 * Dashboard completo de audit logging
 * Interface para visualização e gerenciamento de logs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Shield,
  BarChart3,
  Users,
  Activity,
  Clock,
  MapPin,
  Monitor
} from '@/utils/iconMapper';
import { useAuditLogs, useExportAuditLogs, convertLogsToCSV, downloadCSV } from '@/hooks/useAuditLog';
import { securityMonitor, SecurityAlert } from '@/services/audit/security-monitor.service';
import { AuditLog, AuditLogFilters } from '@/types/audit';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800', 
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  EXPORT: 'bg-yellow-100 text-yellow-800',
  PRINT: 'bg-indigo-100 text-indigo-800',
  READ: 'bg-cyan-100 text-cyan-800'
};

const actionLabels: Record<string, string> = {
  CREATE: 'Criar',
  UPDATE: 'Atualizar', 
  DELETE: 'Deletar',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  EXPORT: 'Exportar',
  PRINT: 'Imprimir',
  READ: 'Ler'
};

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export function AuditDashboard() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    start_date: subDays(new Date(), 7), // Últimos 7 dias
    end_date: new Date(),
    limit: 50,
    offset: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: logs, isLoading, refetch } = useAuditLogs(filters);
  const exportLogs = useExportAuditLogs();

  // Stats
  const stats = useMemo(() => {
    if (!logs) return null;
    
    const totalLogs = logs.length;
    const uniqueUsers = new Set(logs.map(log => log.user_id).filter(Boolean)).size;
    const successRate = logs.filter(log => log.metadata?.success !== false).length / totalLogs * 100;
    const topActions = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs,
      uniqueUsers,
      successRate: Math.round(successRate),
      topActions: Object.entries(topActions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    };
  }, [logs]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  // Load security alerts
  useEffect(() => {
    setSecurityAlerts(securityMonitor.getActiveAlerts());
  }, [activeTab]);

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleExport = async () => {
    const data = await exportLogs.mutateAsync(filters);
    if (data) {
      const csv = convertLogsToCSV(data);
      const filename = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      downloadCSV(csv, filename);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const resolveAlert = async (alertId: string) => {
    await securityMonitor.resolveAlert(alertId, 'admin');
    setSecurityAlerts(securityMonitor.getActiveAlerts());
  };

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard de Auditoria
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoramento completo de ações e segurança do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={handleExport} disabled={exportLogs.isPending}>
            <Download className="h-4 w-4 mr-2" />
            {exportLogs.isPending ? 'Exportando...' : 'Exportar'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Logs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuários Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
              <Progress value={stats.successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{securityAlerts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select
                    value={filters.action || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('action', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      {Object.entries(actionLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={filters.start_date ? format(filters.start_date, 'yyyy-MM-dd') : ''}
                    onChange={(e) =>
                      handleFilterChange('start_date', e.target.value ? new Date(e.target.value) : undefined)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={filters.end_date ? format(filters.end_date, 'yyyy-MM-dd') : ''}
                    onChange={(e) =>
                      handleFilterChange('end_date', e.target.value ? new Date(e.target.value) : undefined)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Limite</Label>
                  <Select
                    value={String(filters.limit || 50)}
                    onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Logs */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <Activity className="h-6 w-6 animate-spin mr-2" />
                            Carregando logs...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : logs && logs.length > 0 ? (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{log.user_name || 'Sistema'}</p>
                              <p className="text-xs text-gray-500">{log.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={actionColors[log.action] || 'bg-gray-100'}>
                              {actionLabels[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{log.entity_type}</p>
                            {log.entity_id && (
                              <p className="text-xs text-gray-400 font-mono">
                                {log.entity_id.substring(0, 8)}...
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <p className="text-xs font-mono">{log.ip_address || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.metadata?.success !== false ? 'default' : 'destructive'}>
                              {log.metadata?.success !== false ? 'Sucesso' : 'Falha'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-gray-500">Nenhum log encontrado</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {logs && logs.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-600">
                    Mostrando {(filters.offset || 0) + 1} - {(filters.offset || 0) + logs.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 50)))}
                      disabled={!filters.offset || filters.offset === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 50))}
                      disabled={!logs || logs.length < (filters.limit || 50)}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Alertas Ativos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Alertas de Segurança Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {securityAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {securityAlerts.map((alert) => (
                      <Alert key={alert.id} className="border-l-4 border-l-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{alert.message}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={severityColors[alert.severity]}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                Resolver
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            <p>IP: {alert.ipAddress}</p>
                            <p>Tipo: {alert.type}</p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum alerta ativo</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas de Segurança */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(securityMonitor.getSecurityStats().alertsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Mais Frequentes</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topActions ? (
                  <div className="space-y-3">
                    {stats.topActions.map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between">
                        <Badge className={actionColors[action]}>
                          {actionLabels[action] || action}
                        </Badge>
                        <span className="text-sm font-mono">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            {/* Timeline de Atividade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs && logs.length > 0 ? (
                  <div className="space-y-3">
                    {logs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <Monitor className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {log.user_name || 'Sistema'} - {actionLabels[log.action] || log.action}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                          </p>
                        </div>
                        <Badge className={actionColors[log.action]}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
            <DialogDescription>
              Informações completas sobre a ação realizada
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Data/Hora</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedLog.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Usuário</Label>
                  <p className="text-sm font-medium">{selectedLog.user_name || 'Sistema'}</p>
                  <p className="text-xs text-gray-500">{selectedLog.user_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Ação</Label>
                  <Badge className={actionColors[selectedLog.action]}>
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge variant={selectedLog.metadata?.success !== false ? 'default' : 'destructive'}>
                    {selectedLog.metadata?.success !== false ? 'Sucesso' : 'Falha'}
                  </Badge>
                </div>
              </div>

              {/* Dados Técnicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Endereço IP</Label>
                  <p className="text-sm font-mono">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Navegador</Label>
                  <p className="text-xs text-gray-600 break-all">{selectedLog.user_agent || 'N/A'}</p>
                </div>
              </div>

              {/* Dados Antigos */}
              {selectedLog.old_data && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Dados Anteriores</Label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Dados Novos */}
              {selectedLog.new_data && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Dados Novos</Label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadados */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Metadados</Label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}