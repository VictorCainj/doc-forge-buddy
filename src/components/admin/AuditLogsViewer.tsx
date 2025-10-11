import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAuditLogs,
  useExportAuditLogs,
  convertLogsToCSV,
  downloadCSV,
} from '@/hooks/useAuditLog';
import { AuditLog, AuditLogFilters } from '@/types/audit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Download,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
} from '@/utils/iconMapper';

const actionColors: Record<string, string> = {
  CREATE: 'bg-success-100 text-success-700',
  UPDATE: 'bg-info-50 text-info-700',
  DELETE: 'bg-error-100 text-error-700',
  LOGIN: 'bg-primary-100 text-primary-700',
  LOGOUT: 'bg-neutral-100 text-neutral-700',
  LOGIN_FAILED: 'bg-warning-100 text-warning-900',
  PASSWORD_RESET: 'bg-warning-100 text-warning-700',
  BULK_UPDATE: 'bg-info-50 text-info-700',
  BULK_DELETE: 'bg-error-100 text-error-700',
  EXPORT: 'bg-primary-100 text-primary-700',
  IMPORT: 'bg-success-100 text-success-700',
  PERMISSION_CHANGE: 'bg-warning-50 text-warning-700',
  ROLE_CHANGE: 'bg-success-50 text-success-700',
  STATUS_CHANGE: 'bg-success-100 text-success-700',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Criar',
  UPDATE: 'Atualizar',
  DELETE: 'Deletar',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Falhado',
  PASSWORD_RESET: 'Redefinir Senha',
  BULK_UPDATE: 'Edição em Massa',
  BULK_DELETE: 'Exclusão em Massa',
  EXPORT: 'Exportar',
  IMPORT: 'Importar',
  PERMISSION_CHANGE: 'Mudança de Permissão',
  ROLE_CHANGE: 'Mudança de Cargo',
  STATUS_CHANGE: 'Mudança de Status',
};

export const AuditLogsViewer = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: logs, isLoading } = useAuditLogs(filters);
  const exportLogs = useExportAuditLogs();

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

  const handlePrevious = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)),
    }));
  };

  const handleNext = () => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50),
    }));
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Logs de Auditoria
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Histórico completo de ações no sistema
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exportLogs.isPending}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          {exportLogs.isPending ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

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
            {/* Filtro por Ação */}
            <div className="space-y-2">
              <Label>Ação</Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'action',
                    value === 'all' ? undefined : value
                  )
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

            {/* Filtro por Tipo de Entidade */}
            <div className="space-y-2">
              <Label>Tipo de Entidade</Label>
              <Select
                value={filters.entity_type || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'entity_type',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  <SelectItem value="profiles">Perfis</SelectItem>
                  <SelectItem value="contracts">Contratos</SelectItem>
                  <SelectItem value="prestadores">Prestadores</SelectItem>
                  <SelectItem value="vistoria_analises">Vistorias</SelectItem>
                  <SelectItem value="saved_terms">Documentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Data Inicial */}
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                onChange={(e) =>
                  handleFilterChange(
                    'start_date',
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>

            {/* Filtro por Data Final */}
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                onChange={(e) =>
                  handleFilterChange(
                    'end_date',
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
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
                  <TableHead>Entidade</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-neutral-500">Carregando logs...</p>
                    </TableCell>
                  </TableRow>
                ) : logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(
                          new Date(log.created_at),
                          'dd/MM/yyyy HH:mm:ss',
                          {
                            locale: ptBR,
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">
                            {log.user_name || 'Sistema'}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {log.user_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || ''}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-neutral-700">
                          {log.entity_type}
                        </p>
                        {log.entity_id && (
                          <p className="text-xs text-neutral-400 font-mono">
                            {log.entity_id.substring(0, 8)}...
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-neutral-600 font-mono">
                          {log.ip_address || '-'}
                        </p>
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
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-neutral-500">Nenhum log encontrado</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {logs && logs.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-neutral-600">
                Mostrando {(filters.offset || 0) + 1} -{' '}
                {(filters.offset || 0) + logs.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!filters.offset || filters.offset === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
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

      {/* Dialog de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
            <DialogDescription>
              Informações completas sobre a ação realizada
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-neutral-500">Data/Hora</Label>
                  <p className="text-sm font-medium">
                    {format(
                      new Date(selectedLog.created_at),
                      "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Usuário</Label>
                  <p className="text-sm font-medium">
                    {selectedLog.user_name || 'Sistema'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {selectedLog.user_email}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Ação</Label>
                  <Badge className={actionColors[selectedLog.action] || ''}>
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Entidade</Label>
                  <p className="text-sm font-medium">
                    {selectedLog.entity_type}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">
                    Endereço IP
                  </Label>
                  <p className="text-sm font-mono">
                    {selectedLog.ip_address || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">
                    ID da Entidade
                  </Label>
                  <p className="text-sm font-mono text-xs break-all">
                    {selectedLog.entity_id || '-'}
                  </p>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div>
                  <Label className="text-xs text-neutral-500">Navegador</Label>
                  <p className="text-xs text-neutral-600 font-mono break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

              {/* Dados Antigos */}
              {selectedLog.old_data && (
                <div>
                  <Label className="text-xs text-neutral-500 mb-2 block">
                    Dados Anteriores
                  </Label>
                  <pre className="bg-neutral-50 p-3 rounded-lg text-xs overflow-x-auto border">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Dados Novos */}
              {selectedLog.new_data && (
                <div>
                  <Label className="text-xs text-neutral-500 mb-2 block">
                    Dados Novos
                  </Label>
                  <pre className="bg-neutral-50 p-3 rounded-lg text-xs overflow-x-auto border">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadados */}
              {selectedLog.metadata &&
                Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <Label className="text-xs text-neutral-500 mb-2 block">
                      Metadados
                    </Label>
                    <pre className="bg-neutral-50 p-3 rounded-lg text-xs overflow-x-auto border">
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
};
