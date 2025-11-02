import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/premium-button';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDashboardDesocupacao } from '@/hooks/useDashboardDesocupacao';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardFilters } from '@/types/dashboardDesocupacao';
import { ContratoDesocupacaoCard } from '@/components/dashboard/ContratoDesocupacaoCard';
import {
  AlertCircle,
  Filter,
  RotateCcw,
  Loader2,
  Download,
  Building2,
} from '@/utils/iconMapper';
import { generateHTMLReport } from '@/utils/generateHTMLReport';
import { exportDashboardToExcel } from '@/utils/exportDashboardToExcel';
import { ExcelIcon } from '@/components/icons/ExcelIcon';
import { toast } from 'sonner';
import { log } from '@/utils/logger';

const DashboardDesocupacao = () => {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<DashboardFilters>({
    periodo: 'mes-atual',
  });

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error, refetch } = useDashboardDesocupacao(filters);

  const handleApplyFilters = () => {
    const newFilters: DashboardFilters = {
      periodo: filters.periodo,
    };

    if (filters.periodo === 'periodo-personalizado') {
      if (!dataInicio || !dataFim) {
        return;
      }
      newFilters.dataInicio = dataInicio;
      newFilters.dataFim = dataFim;
    } else if (filters.periodo === 'mes-especifico') {
      newFilters.ano = ano;
      newFilters.mes = mes;
    }

    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({ periodo: 'mes-atual' });
    setDataInicio('');
    setDataFim('');
    setAno(new Date().getFullYear());
    setMes(new Date().getMonth() + 1);
  };

  const handleExportToExcel = async () => {
    if (!data || data.contratos.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    setIsExporting(true);

    try {
      await exportDashboardToExcel(data, filters);
      toast.success('Dashboard exportado para Excel com sucesso!');
    } catch (error) {
      log.error('Erro ao exportar para Excel:', error);
      toast.error('Erro ao exportar dashboard para Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!data) return;

    setIsGenerating(true);

    try {
      // Calcular datas do período
      const getPeriodDates = (filters: DashboardFilters) => {
        if (
          filters.periodo === 'periodo-personalizado' &&
          filters.dataInicio &&
          filters.dataFim
        ) {
          return {
            startDate: filters.dataInicio,
            endDate: filters.dataFim,
          };
        }

        if (
          filters.periodo === 'mes-especifico' &&
          filters.ano &&
          filters.mes
        ) {
          // Dia 01 do mês às 00:00:00
          const startOfMonth = new Date(
            filters.ano,
            filters.mes - 1,
            1,
            0,
            0,
            0,
            0
          );
          // Último dia do mês às 23:59:59.999
          const endOfMonth = new Date(
            filters.ano,
            filters.mes,
            0,
            23,
            59,
            59,
            999
          );
          return {
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0],
          };
        }

        const now = new Date();
        // Dia 01 do mês atual às 00:00:00
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
          0,
          0,
          0,
          0
        );
        // Último dia do mês atual às 23:59:59.999
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0],
        };
      };

      const { startDate, endDate } = getPeriodDates(filters);

      // Função auxiliar para parsear datas
      const parseDate = (dateString: string): Date => {
        if (!dateString) return new Date(0); // Retorna uma data muito antiga se não tiver data

        if (dateString.includes('/')) {
          const [dia, mes, ano] = dateString.split('/');
          return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }

        return new Date(dateString);
      };

      // Ordenar contratos por data de início (maior para menor)
      const contratosOrdenados = [...data.contratos].sort((a, b) => {
        const dataA = parseDate(a.dataInicioRescisao);
        const dataB = parseDate(b.dataInicioRescisao);
        return dataB.getTime() - dataA.getTime(); // Maior data primeiro
      });

      const htmlContent = generateHTMLReport({
        contratos: contratosOrdenados,
        motivosStats: data.motivosStats,
        stats: data.stats,
        periodo: stats?.periodo || 'Período não definido',
        dataInicio: startDate,
        dataFim: endDate,
      });

      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      } else {
        log.error(
          'Não foi possível abrir nova aba. Verifique o bloqueador de pop-ups.'
        );
      }
    } catch (error) {
      log.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = useMemo(() => {
    if (!data) return null;

    return {
      total: data.stats.totalDesocupacoes,
      motivoMaisComum: data.stats.motivoMaisComum,
      periodo: data.stats.periodoAtual,
      topMotivos: data.motivosStats.slice(0, 5),
    };
  }, [data]);

  return (
    <>
      {isGenerating && <LoadingOverlay message="Gerando relatório..." />}

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
        <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Header Moderno */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight mb-2">
                  Dashboard de Desocupação
                </h1>
                <p className="text-neutral-600 text-sm sm:text-base">
                  Visualize contratos e analise os motivos de desocupação
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  variant="outline"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Atualizar
                </Button>

                {data && data.contratos.length > 0 && (
                  <>
                    <PremiumButton
                      onClick={handleExportToExcel}
                      disabled={isExporting || isGenerating}
                      icon={<ExcelIcon />}
                      variant="success"
                    >
                      Exportar Excel
                    </PremiumButton>
                    <PremiumButton
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                      icon={<Download />}
                      variant="info"
                    >
                      Relatório
                    </PremiumButton>
                  </>
                )}
              </div>
            </div>

            {/* Filtros Modernos */}
            <Card className="border-neutral-200 shadow-sm">
              <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-neutral-700" />
                  <span className="text-neutral-900">Filtros</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="periodo"
                      className="text-sm font-medium text-neutral-700"
                    >
                      Período
                    </Label>
                    <Select
                      value={filters.periodo}
                      onValueChange={(value: any) =>
                        setFilters({ ...filters, periodo: value })
                      }
                    >
                      <SelectTrigger
                        className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20"
                        aria-label="Período"
                      >
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mes-atual">Mês Atual</SelectItem>
                        <SelectItem value="mes-especifico">
                          Mês Específico
                        </SelectItem>
                        <SelectItem value="periodo-personalizado">
                          Período Personalizado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.periodo === 'mes-especifico' && (
                    <>
                      <div className="space-y-2">
                        <Label
                          htmlFor="ano"
                          className="text-sm font-medium text-neutral-700"
                        >
                          Ano
                        </Label>
                        <Input
                          type="number"
                          id="ano"
                          value={ano}
                          onChange={(e) => setAno(parseInt(e.target.value))}
                          min="2020"
                          max="2030"
                          className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="mes"
                          className="text-sm font-medium text-neutral-700"
                        >
                          Mês
                        </Label>
                        <Select
                          value={mes.toString()}
                          onValueChange={(value) => setMes(parseInt(value))}
                        >
                          <SelectTrigger
                            id="mes"
                            className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20"
                            aria-label="Selecione o mês"
                          >
                            <SelectValue placeholder="Selecione o mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              'Janeiro',
                              'Fevereiro',
                              'Março',
                              'Abril',
                              'Maio',
                              'Junho',
                              'Julho',
                              'Agosto',
                              'Setembro',
                              'Outubro',
                              'Novembro',
                              'Dezembro',
                            ].map((mes, index) => (
                              <SelectItem
                                key={index}
                                value={(index + 1).toString()}
                              >
                                {mes}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {filters.periodo === 'periodo-personalizado' && (
                    <>
                      <div className="space-y-2">
                        <Label
                          htmlFor="dataInicio"
                          className="text-sm font-medium text-neutral-700"
                        >
                          Data Início
                        </Label>
                        <Input
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="dataFim"
                          className="text-sm font-medium text-neutral-700"
                        >
                          Data Fim
                        </Label>
                        <Input
                          type="date"
                          value={dataFim}
                          onChange={(e) => setDataFim(e.target.value)}
                          className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-end gap-2">
                    <Button
                      onClick={handleApplyFilters}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                    >
                      Aplicar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="border-neutral-300 hover:bg-neutral-50"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-neutral-600 text-sm">Carregando dados...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50 animate-in fade-in-50 duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <p>Erro ao carregar dados: {error.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conteúdo Principal */}
          {data && (
            <div className="space-y-6">
              {/* Lista de Contratos */}
              <Card className="border-neutral-200 shadow-sm">
                <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-neutral-900">
                      Contratos em Desocupação
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-blue-300 bg-blue-50 text-blue-700"
                    >
                      {data.contratos.length} contratos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {data.contratos.length > 0 ? (
                    <div className="space-y-4">
                      {data.contratos.map((contrato) => (
                        <ContratoDesocupacaoCard
                          key={contrato.id}
                          contrato={contrato}
                          onMotivoUpdated={() => {
                            queryClient.invalidateQueries({
                              queryKey: ['dashboard-desocupacao'],
                            });
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Building2 className="h-8 w-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-600">
                        Nenhum contrato encontrado para o período selecionado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardDesocupacao;
