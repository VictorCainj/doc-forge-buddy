import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DashboardData,
  ContratoDesocupacao,
  DashboardStats,
  MotivoStats,
  DashboardFilters,
} from '@/types/dashboardDesocupacao';

/**
 * Hook para buscar dados do Dashboard de Desocupação
 * - Cache de 5 minutos (padrão do projeto)
 * - Filtros por período
 * - Estatísticas calculadas
 */
export function useDashboardDesocupacao(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard-desocupacao', filters],
    queryFn: async (): Promise<DashboardData> => {
      // Buscar todos os contratos (filtro será por data de notificação)
      const { data: todosContratos, error: errorTodos } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .order('created_at', { ascending: false });

      if (errorTodos) {
        throw new Error(
          `Erro ao buscar todos os contratos: ${errorTodos.message}`
        );
      }

      console.log(
        'Total de contratos encontrados:',
        todosContratos?.length || 0
      );

      // Mostrar todos os contratos (independente do motivo de desocupação)
      const contratosComMotivo = todosContratos || [];

      console.log('=== DEBUG DASHBOARD ===');
      console.log('Total de contratos encontrados:', contratosComMotivo.length);

      // Verificar quantos contratos têm dataInicioRescisao preenchida
      const contratosComData = contratosComMotivo.filter(
        (c) => c.form_data?.dataInicioRescisao
      );
      console.log('Contratos COM dataInicioRescisao:', contratosComData.length);
      console.log(
        'Contratos SEM dataInicioRescisao:',
        contratosComMotivo.length - contratosComData.length
      );

      // Mostrar algumas datas de exemplo
      console.log('Exemplos de datas encontradas:');
      contratosComData.slice(0, 5).forEach((c) => {
        console.log(`  Contrato ${c.id}: ${c.form_data?.dataInicioRescisao}`);
      });

      // Aplicar filtro de período baseado na data de comunicação
      let contratosFiltrados = contratosComMotivo;

      // Se não for "Mês Atual" (padrão), aplicar filtro por data de comunicação
      if (filters.periodo !== 'mes-atual') {
        const { startDate, endDate } = getPeriodDates(filters);
        const inicio = new Date(startDate);
        const fim = new Date(endDate);

        console.log('Aplicando filtro por data de início da rescisão:', {
          periodo: filters.periodo,
          startDate,
          endDate,
        });

        contratosFiltrados = contratosComMotivo.filter((contrato) => {
          const dataInicioRescisao = contrato.form_data?.dataInicioRescisao;
          if (!dataInicioRescisao) {
            // Log resumido para não poluir o console
            return false;
          }

          // Validar se a data é válida e converter formato brasileiro (DD/MM/YYYY) para Date
          let dataInicioRescisaoObj: Date;

          // Se a data está no formato brasileiro DD/MM/YYYY
          if (dataInicioRescisao.includes('/')) {
            const [dia, mes, ano] = dataInicioRescisao.split('/');
            dataInicioRescisaoObj = new Date(
              parseInt(ano),
              parseInt(mes) - 1,
              parseInt(dia)
            );
          } else {
            // Se já está no formato ISO ou outro formato
            dataInicioRescisaoObj = new Date(dataInicioRescisao);
          }

          if (isNaN(dataInicioRescisaoObj.getTime())) {
            console.log(
              'Data de início da rescisão inválida:',
              contrato.id,
              dataInicioRescisao
            );
            return false;
          }

          // Verificar se a data de início da rescisão está dentro do período
          const estaNoPeriodo =
            dataInicioRescisaoObj >= inicio && dataInicioRescisaoObj <= fim;

          // Log apenas para contratos incluídos para reduzir spam no console
          if (estaNoPeriodo) {
            console.log(
              'Contrato incluído:',
              contrato.id,
              'Data início rescisão:',
              dataInicioRescisao
            );
          }

          return estaNoPeriodo;
        });
      } else {
        console.log('Mostrando todos os contratos (sem filtro de período)');
      }

      console.log(
        'Contratos após filtro de período:',
        contratosFiltrados.length
      );
      console.log('=== FIM DEBUG ===');

      const contratosData = contratosFiltrados;
      const error = null;

      if (error) {
        throw new Error(
          `Erro ao buscar dados de desocupação: ${error.message}`
        );
      }

      // Buscar informações de entrega de chaves para todos os contratos
      const contratosComBillsPromises = contratosData.map(async (item) => {
        try {
          const { data: billsData } = await supabase
            .from('contract_bills')
            .select('bill_type, delivered, delivered_at')
            .eq('contract_id', item.id)
            .eq('bill_type', 'entrega_chaves')
            .maybeSingle();

          return { item, billsData };
        } catch (error) {
          console.error('Erro ao buscar bills para contrato:', item.id, error);
          return { item, billsData: null };
        }
      });

      const contratosComBills = await Promise.all(contratosComBillsPromises);

      // Transformar dados para o formato esperado
      const contratos: ContratoDesocupacao[] = contratosComBills.map(
        ({ item, billsData }) => {
          const dataInicioRescisao = item.form_data?.dataInicioRescisao || '';

          // Validar se a data de início da rescisão é válida
          let dataInicioRescisaoValida = dataInicioRescisao;
          if (dataInicioRescisao) {
            let dataTeste: Date;

            // Se a data está no formato brasileiro DD/MM/YYYY
            if (dataInicioRescisao.includes('/')) {
              const [dia, mes, ano] = dataInicioRescisao.split('/');
              dataTeste = new Date(
                parseInt(ano),
                parseInt(mes) - 1,
                parseInt(dia)
              );
            } else {
              dataTeste = new Date(dataInicioRescisao);
            }

            if (isNaN(dataTeste.getTime())) {
              console.log(
                'Data de início da rescisão inválida encontrada:',
                item.id,
                dataInicioRescisao
              );
              dataInicioRescisaoValida = ''; // Usar string vazia para datas inválidas
            }
          }

          // Processar informações de entrega de chaves
          let entregaChaves;
          if (billsData) {
            const entregue = billsData.delivered || false;
            const dataEntrega = billsData.delivered_at
              ? new Date(billsData.delivered_at).toLocaleDateString('pt-BR')
              : undefined;

            // Calcular dias pendentes se as chaves não foram entregues
            let diasPendentes: number | undefined;
            if (!entregue && dataInicioRescisaoValida) {
              try {
                let dataInicio: Date;
                if (dataInicioRescisaoValida.includes('/')) {
                  const [dia, mes, ano] = dataInicioRescisaoValida.split('/');
                  dataInicio = new Date(
                    parseInt(ano),
                    parseInt(mes) - 1,
                    parseInt(dia)
                  );
                } else {
                  dataInicio = new Date(dataInicioRescisaoValida);
                }

                if (!isNaN(dataInicio.getTime())) {
                  const hoje = new Date();
                  const diffTime = hoje.getTime() - dataInicio.getTime();
                  diasPendentes = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                }
              } catch (error) {
                console.error('Erro ao calcular dias pendentes:', error);
              }
            }

            entregaChaves = {
              entregue,
              dataEntrega,
              diasPendentes,
            };
          }

          return {
            id: item.id,
            numeroContrato: item.form_data?.numeroContrato || '',
            enderecoImovel: item.form_data?.enderecoImovel || '',
            nomeLocador: item.form_data?.nomeProprietario || '',
            nomeLocatario: item.form_data?.nomeLocatario || '',
            motivoDesocupacao: item.form_data?.motivoDesocupacao || '',
            dataInicioRescisao: dataInicioRescisaoValida, // Data de início da rescisão
            dataTerminoRescisao: item.form_data?.dataTerminoRescisao || '',
            dataNotificacao: item.created_at, // Data de criação do registro
            entregaChaves,
          };
        }
      );

      // Calcular estatísticas
      const stats = calculateStats(contratos, filters);
      const motivosStats = calculateMotivosStats(contratos);

      return {
        contratos,
        stats,
        motivosStats,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Calcula as datas do período baseado nos filtros
 */
function getPeriodDates(filters: DashboardFilters): {
  startDate: string;
  endDate: string;
} {
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

  if (filters.periodo === 'mes-especifico' && filters.ano && filters.mes) {
    const startOfMonth = new Date(filters.ano, filters.mes - 1, 1);
    const endOfMonth = new Date(filters.ano, filters.mes, 0);

    console.log('Calculando mês específico:', {
      ano: filters.ano,
      mes: filters.mes,
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
    });

    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
    };
  }

  // Mês atual (padrão)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: endOfMonth.toISOString().split('T')[0],
  };
}

/**
 * Calcula estatísticas gerais do dashboard
 */
function calculateStats(
  contratos: ContratoDesocupacao[],
  filters: DashboardFilters
): DashboardStats {
  const totalDesocupacoes = contratos.length;

  // Encontrar motivo mais comum
  const motivoCounts = contratos.reduce(
    (acc, contrato) => {
      const motivo = contrato.motivoDesocupacao || 'Não informado';
      acc[motivo] = (acc[motivo] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const motivoMaisComum =
    Object.entries(motivoCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    'Nenhum';

  // Formatar período atual
  const { startDate, endDate } = getPeriodDates(filters);

  // Validar se as datas são válidas antes de formatar
  let startDateFormatted = startDate;
  let endDateFormatted = endDate;

  try {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (!isNaN(startDateObj.getTime())) {
      startDateFormatted = startDateObj.toLocaleDateString('pt-BR');
    }

    if (!isNaN(endDateObj.getTime())) {
      endDateFormatted = endDateObj.toLocaleDateString('pt-BR');
    }
  } catch (error) {
    console.log('Erro ao formatar datas do período:', error);
  }

  let periodoAtual: string;
  if (filters.periodo === 'mes-atual') {
    periodoAtual = new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  } else if (
    filters.periodo === 'mes-especifico' &&
    filters.ano &&
    filters.mes
  ) {
    const data = new Date(filters.ano, filters.mes - 1);
    periodoAtual = data.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  } else {
    periodoAtual = `${startDateFormatted} - ${endDateFormatted}`;
  }

  return {
    totalDesocupacoes,
    motivoMaisComum,
    periodoAtual,
  };
}

/**
 * Calcula estatísticas dos motivos de desocupação
 */
function calculateMotivosStats(
  contratos: ContratoDesocupacao[]
): MotivoStats[] {
  const motivoCounts = contratos.reduce(
    (acc, contrato) => {
      const motivo = contrato.motivoDesocupacao || 'Não informado';
      acc[motivo] = (acc[motivo] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = contratos.length;

  return Object.entries(motivoCounts)
    .map(([motivo, count]) => ({
      motivo,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
