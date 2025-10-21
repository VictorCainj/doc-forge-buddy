import { MotivoStats } from '@/types/dashboardDesocupacao';

interface MotivoDesocupacaoChartProps {
  motivosStats: MotivoStats[];
  maxItems?: number;
}

/**
 * Componente de gráfico de barras para visualizar motivos de desocupação
 * Implementado com HTML/CSS puro seguindo padrões do projeto
 */
export function MotivoDesocupacaoChart({
  motivosStats,
  maxItems = 5,
}: MotivoDesocupacaoChartProps) {
  // Limitar aos primeiros N itens
  const topMotivos = motivosStats.slice(0, maxItems);
  const maxCount = Math.max(...topMotivos.map((m) => m.count), 1);

  if (topMotivos.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-neutral-500 text-sm">Nenhum motivo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-700">
          Top {topMotivos.length} Motivos de Desocupação
        </p>
        <span className="text-xs text-neutral-500">
          {topMotivos.reduce((sum, m) => sum + m.count, 0)} total
        </span>
      </div>

      <div className="space-y-2">
        {topMotivos.map((motivo, index) => (
          <div key={motivo.motivo} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-600 truncate flex-1 mr-2">
                {motivo.motivo}
              </span>
              <span className="text-neutral-500 font-medium whitespace-nowrap">
                {motivo.count} ({motivo.percentage}%)
              </span>
            </div>

            {/* Barra de progresso */}
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${(motivo.count / maxCount) * 100}%`,
                  backgroundColor: getBarColor(index),
                }}
                role="progressbar"
                aria-valuenow={motivo.count}
                aria-valuemax={maxCount}
                aria-label={`${motivo.motivo}: ${motivo.count} ocorrências`}
              />
            </div>
          </div>
        ))}
      </div>

      {motivosStats.length > maxItems && (
        <div className="text-xs text-neutral-500 text-center pt-2">
          +{motivosStats.length - maxItems} outros motivos
        </div>
      )}
    </div>
  );
}

/**
 * Gera cores para as barras do gráfico
 */
function getBarColor(index: number): string {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
  ];

  return colors[index % colors.length];
}
