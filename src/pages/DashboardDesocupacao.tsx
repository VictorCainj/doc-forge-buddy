import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { MotivoDesocupacaoChart } from '@/components/dashboard/MotivoDesocupacaoChart';
import { ContratoDesocupacaoCard } from '@/components/dashboard/ContratoDesocupacaoCard';
import {
  BarChart3,
  Calendar,
  Users,
  AlertCircle,
  Filter,
  RotateCcw,
  Loader2,
  TrendingUp,
} from '@/utils/iconMapper';
import { generateHTMLReport } from '@/utils/generateHTMLReport';

/**
 * Dashboard de Desocupação
 * Exibe todas as desocupações do período selecionado com estatísticas e motivos
 */
const DashboardDesocupacao = () => {
  const queryClient = useQueryClient();

  // Estado dos filtros
  const [filters, setFilters] = useState<DashboardFilters>({
    periodo: 'mes-atual',
  });

  // Estado para período personalizado
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Estado para mês específico
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  // Estado para geração de relatório
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar dados usando o hook
  const { data, isLoading, error, refetch } = useDashboardDesocupacao(filters);

  // Aplicar filtros
  const handleApplyFilters = () => {
    const newFilters: DashboardFilters = {
      periodo: filters.periodo,
    };

    if (filters.periodo === 'periodo-personalizado') {
      if (!dataInicio || !dataFim) {
        return; // Não aplicar se datas não estão preenchidas
      }
      newFilters.dataInicio = dataInicio;
      newFilters.dataFim = dataFim;
    } else if (filters.periodo === 'mes-especifico') {
      newFilters.ano = ano;
      newFilters.mes = mes;
    }

    setFilters(newFilters);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({ periodo: 'mes-atual' });
    setDataInicio('');
    setDataFim('');
    setAno(new Date().getFullYear());
    setMes(new Date().getMonth() + 1);
  };

  // Gerar Relatório HTML
  const handleGenerateReport = async () => {
    if (!data) return;

    setIsGenerating(true);

    try {
      // Gerar HTML
      const htmlContent = generateHTMLReport({
        contratos: data.contratos,
        motivosStats: data.motivosStats,
        stats: data.stats,
        periodo: stats?.periodo || 'Período não definido',
      });

      // Abrir em nova aba
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      } else {
        console.error(
          'Não foi possível abrir nova aba. Verifique o bloqueador de pop-ups.'
        );
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Estatísticas calculadas
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

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-black mb-2">
                  Dashboard Desocupação
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Visualize todos os contratos e analise os motivos de
                  desocupação
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Atualizar
                </Button>

                {data && data.contratos.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Relatório
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-8 py-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Período */}
                <div className="space-y-2">
                  <Label htmlFor="periodo">Período</Label>
                  <Select
                    value={filters.periodo}
                    onValueChange={(
                      value: 'mes-atual' | 'periodo-personalizado'
                    ) => setFilters({ ...filters, periodo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                {/* Ano (apenas se mês específico) */}
                {filters.periodo === 'mes-especifico' && (
                  <div className="space-y-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Input
                      type="number"
                      id="ano"
                      value={ano}
                      onChange={(e) => setAno(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                    />
                  </div>
                )}

                {/* Mês (apenas se mês específico) */}
                {filters.periodo === 'mes-especifico' && (
                  <div className="space-y-2">
                    <Label htmlFor="mes">Mês</Label>
                    <Select
                      value={mes.toString()}
                      onValueChange={(value) => setMes(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Data Início (apenas se período personalizado) */}
                {filters.periodo === 'periodo-personalizado' && (
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                )}

                {/* Data Fim (apenas se período personalizado) */}
                {filters.periodo === 'periodo-personalizado' && (
                  <div className="space-y-2">
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                )}

                {/* Botões */}
                <div className="flex items-end space-x-2">
                  <Button onClick={handleApplyFilters} className="flex-1">
                    Aplicar Filtros
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-neutral-600">Carregando dados...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <p>Erro ao carregar dados: {error.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conteúdo Principal */}
          {data && stats && (
            <>
              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">
                          Total Desocupações
                        </p>
                        <p className="text-2xl font-bold text-neutral-900">
                          {stats.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">
                          Motivo Mais Comum
                        </p>
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {stats.motivoMaisComum}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Período</p>
                        <p className="text-sm font-medium text-neutral-900">
                          {stats.periodo}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de Motivos */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Estatísticas</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.topMotivos.length > 0 ? (
                        <MotivoDesocupacaoChart
                          motivosStats={stats.topMotivos}
                        />
                      ) : (
                        <div className="text-center py-8 text-neutral-500">
                          Nenhum motivo encontrado
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Contratos */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Contratos em Desocupação</span>
                        <Badge variant="secondary">
                          {data.contratos.length} contratos
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data.contratos.length > 0 ? (
                        <div className="space-y-4">
                          {data.contratos.map((contrato) => (
                            <ContratoDesocupacaoCard
                              key={contrato.id}
                              contrato={contrato}
                              onMotivoUpdated={() => {
                                // Invalidar cache para recarregar dados atualizados
                                queryClient.invalidateQueries({
                                  queryKey: ['dashboard-desocupacao'],
                                });
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                          <p className="text-neutral-600">
                            Nenhum contrato encontrado para o período
                            selecionado
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardDesocupacao;
