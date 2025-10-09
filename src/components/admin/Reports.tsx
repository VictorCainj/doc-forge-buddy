import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ReportGenerator } from '@/features/reports/ReportGenerator';
import {
  ReportType,
  ReportPeriod,
  ReportFormat,
  ReportConfig,
  ReportData,
} from '@/features/reports/ReportTypes';
import {
  FileText,
  Download,
  BarChart3,
  Users,
  FileBarChart,
  Shield,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLogAuditEvent } from '@/hooks/useAuditLog';

const reportTypes: Array<{ value: ReportType; label: string; icon: any }> = [
  { value: 'users', label: 'Usuários', icon: Users },
  { value: 'contracts', label: 'Contratos', icon: FileText },
  { value: 'prestadores', label: 'Prestadores', icon: Users },
  { value: 'audit', label: 'Auditoria', icon: Shield },
];

const reportPeriods: Array<{ value: ReportPeriod; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Última Semana' },
  { value: 'month', label: 'Este Mês' },
  { value: 'quarter', label: 'Último Trimestre' },
  { value: 'year', label: 'Último Ano' },
  { value: 'custom', label: 'Período Personalizado' },
];

export const Reports = () => {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'users',
    title: 'Relatório de Usuários',
    period: 'month',
    format: 'csv',
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const logAudit = useLogAuditEvent();

  const handleConfigChange = (key: keyof ReportConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const data = await ReportGenerator.generate(config);
      setReportData(data);

      // Registrar geração no log de auditoria
      await logAudit.mutateAsync({
        action: 'EXPORT',
        entity_type: 'reports',
        metadata: {
          report_type: config.type,
          period: config.period,
          format: config.format,
        },
      });

      toast.success('Relatório gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(error.message || 'Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    if (config.format === 'csv') {
      exportToCSV(reportData);
    } else {
      toast.info('Exportação para PDF e Excel em desenvolvimento');
    }
  };

  const exportToCSV = (data: ReportData) => {
    // Converter dados do relatório para CSV
    const headers = Object.keys(data.summary);
    const values = Object.values(data.summary);

    let csvContent = `${data.title}\n`;
    csvContent += `Período: ${data.period}\n`;
    csvContent += `Gerado em: ${format(data.generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\n`;
    csvContent += `${headers.join(',')}\n`;
    csvContent += `${values.join(',')}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `relatorio-${config.type}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`
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
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">
          Relatórios Administrativos
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Gere relatórios detalhados sobre o sistema
        </p>
      </div>

      {/* Configuração do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Configurar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tipo de Relatório */}
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select
                value={config.type}
                onValueChange={(value: ReportType) =>
                  handleConfigChange('type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select
                value={config.period}
                onValueChange={(value: ReportPeriod) =>
                  handleConfigChange('period', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formato */}
            <div className="space-y-2">
              <Label>Formato de Exportação</Label>
              <Select
                value={config.format}
                onValueChange={(value: ReportFormat) =>
                  handleConfigChange('format', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF (em breve)</SelectItem>
                  <SelectItem value="excel">Excel (em breve)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Período Personalizado */}
          {config.period === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  onChange={(e) =>
                    handleConfigChange('startDate', new Date(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  onChange={(e) =>
                    handleConfigChange('endDate', new Date(e.target.value))
                  }
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visualização do Relatório */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{reportData.title}</CardTitle>
                <p className="text-sm text-neutral-500 mt-1">
                  {reportData.subtitle}
                </p>
              </div>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações do Relatório */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-xs text-neutral-500">Período</p>
                <p className="text-sm font-medium">{reportData.period}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Gerado em</p>
                <p className="text-sm font-medium">
                  {format(reportData.generatedAt, "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>

            {/* Resumo */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Resumo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(reportData.summary).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-4 bg-white border border-neutral-200 rounded-lg"
                  >
                    <p className="text-xs text-neutral-500 mb-1">{key}</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráficos */}
            {reportData.charts && reportData.charts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Visualizações
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reportData.charts.map((chart, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white border border-neutral-200 rounded-lg"
                    >
                      <h4 className="text-sm font-medium text-neutral-700 mb-3">
                        {chart.title}
                      </h4>
                      <div className="h-48 flex items-center justify-center bg-neutral-50 rounded">
                        <p className="text-sm text-neutral-500">
                          Gráfico {chart.type} - {chart.labels.length} pontos de
                          dados
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalhes dos Dados */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Dados Detalhados
              </h3>
              <pre className="bg-neutral-50 p-4 rounded-lg text-xs overflow-x-auto border max-h-96 overflow-y-auto">
                {JSON.stringify(reportData.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
