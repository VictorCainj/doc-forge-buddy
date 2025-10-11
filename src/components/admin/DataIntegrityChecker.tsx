import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  runFullIntegrityCheck,
  exportIntegrityReportCSV,
  IntegrityReport,
  IntegrityIssue,
} from '@/utils/dataIntegrityChecker';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Download,
  Play,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const severityColors: Record<string, string> = {
  low: 'bg-info-50 text-info-700',
  medium: 'bg-warning-100 text-warning-700',
  high: 'bg-warning-100 text-warning-900',
  critical: 'bg-error-100 text-error-700',
};

const severityLabels: Record<string, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico',
};

const typeLabels: Record<string, string> = {
  orphan: 'Órfão',
  missing_reference: 'Referência Ausente',
  duplicate: 'Duplicado',
  invalid_data: 'Dado Inválido',
  constraint_violation: 'Violação de Restrição',
};

export const DataIntegrityChecker = () => {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleRunCheck = async () => {
    try {
      setIsChecking(true);
      const result = await runFullIntegrityCheck();
      setReport(result);

      if (result.totalIssues === 0) {
        toast.success('Nenhum problema encontrado!');
      } else {
        toast.warning(`${result.totalIssues} problemas encontrados`);
      }
    } catch (error: any) {
      console.error('Erro ao verificar integridade:', error);
      toast.error('Erro ao executar verificação');
    } finally {
      setIsChecking(false);
    }
  };

  const handleExport = () => {
    if (!report) return;

    const csv = exportIntegrityReportCSV(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `integridade-${format(report.timestamp, 'yyyy-MM-dd-HHmmss')}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Verificação de Integridade de Dados
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Identifique e corrija inconsistências no banco de dados
          </p>
        </div>
        <Button onClick={handleRunCheck} disabled={isChecking}>
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Executar Verificação
            </>
          )}
        </Button>
      </div>

      {/* Resumo */}
      {report && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {report.totalIssues === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-success-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-warning-600" />
                )}
                Resumo da Verificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Geral */}
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-600">{report.summary}</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    Verificado em{' '}
                    {format(report.timestamp, "dd/MM/yyyy 'às' HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </p>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-neutral-200 rounded-lg">
                    <p className="text-xs text-neutral-500 mb-1">
                      Total de Problemas
                    </p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {report.totalIssues}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-error-200 rounded-lg">
                    <p className="text-xs text-neutral-500 mb-1">Críticos</p>
                    <p className="text-2xl font-bold text-error-600">
                      {report.issuesBySeverity.critical}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-warning-200 rounded-lg">
                    <p className="text-xs text-neutral-500 mb-1">Altos</p>
                    <p className="text-2xl font-bold text-warning-900">
                      {report.issuesBySeverity.high}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-warning-200 rounded-lg">
                    <p className="text-xs text-neutral-500 mb-1">Médios</p>
                    <p className="text-2xl font-bold text-warning-600">
                      {report.issuesBySeverity.medium}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                {report.totalIssues > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={handleExport} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Relatório
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Problemas */}
          {report.totalIssues > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Problemas Encontrados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severidade</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Correção Sugerida</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.issues.map((issue, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge className={severityColors[issue.severity]}>
                              {severityLabels[issue.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-neutral-700">
                              {typeLabels[issue.type]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {issue.entity}
                              </p>
                              {issue.entityId && (
                                <p className="text-xs text-neutral-500 font-mono">
                                  {issue.entityId.substring(0, 8)}...
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-neutral-700 max-w-md">
                              {issue.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-neutral-600 max-w-md">
                              {issue.suggestedFix || '-'}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Estado Inicial */}
      {!report && !isChecking && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <Shield className="h-16 w-16 mx-auto text-neutral-400" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Pronto para Verificar
                </h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
                  Execute uma verificação completa para identificar problemas de
                  integridade nos dados do sistema
                </p>
                <p className="text-xs text-neutral-400 mt-3 max-w-lg mx-auto">
                  <strong>Nota:</strong> Algumas verificações são limitadas no
                  frontend por questões de segurança. Para verificação completa
                  de usuários do Auth, use funções RPC no backend.
                </p>
              </div>
              <Button onClick={handleRunCheck} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Iniciar Verificação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
