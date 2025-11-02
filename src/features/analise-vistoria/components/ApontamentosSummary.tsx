import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from '@/utils/iconMapper';
import { ApontamentoVistoria } from '@/types/vistoria';
import { useMemo } from 'react';

interface ApontamentosSummaryProps {
  apontamentos: ApontamentoVistoria[];
}

export const ApontamentosSummary = ({ apontamentos }: ApontamentosSummaryProps) => {
  const { responsabilidadesLocatario, passiveisRevisao } = useMemo(() => {
    const responsabilidades: Array<ApontamentoVistoria & { index: number }> = [];
    const revisoes: Array<ApontamentoVistoria & { index: number }> = [];

    apontamentos.forEach((apontamento, index) => {
      if (apontamento.classificacao === 'responsabilidade') {
        responsabilidades.push({ ...apontamento, index: index + 1 });
      } else if (apontamento.classificacao === 'revisao') {
        revisoes.push({ ...apontamento, index: index + 1 });
      }
    });

    return {
      responsabilidadesLocatario: responsabilidades,
      passiveisRevisao: revisoes,
    };
  }, [apontamentos]);

  // Não exibir se não houver apontamentos classificados
  if (responsabilidadesLocatario.length === 0 && passiveisRevisao.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white border-neutral-100 shadow-sm">
      <CardHeader className="pb-4 border-b border-neutral-100">
        <CardTitle className="flex items-center space-x-3 text-lg font-medium text-neutral-900">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>
          <span>Resumo de Apontamentos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div
          className={`grid gap-4 ${
            responsabilidadesLocatario.length > 0 && passiveisRevisao.length > 0
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {/* Seção Responsabilidades do Locatário */}
          {responsabilidadesLocatario.length > 0 && (
            <div className="bg-neutral-50 border border-neutral-300 border-l-4 border-l-neutral-600 rounded-lg p-5 shadow-sm">
              <div className="mb-4 pb-3 border-b border-neutral-200">
                <Badge className="bg-neutral-600 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  Responsabilidades do Locatário
                </Badge>
              </div>
              <div className="bg-white rounded border border-neutral-200 p-4">
                <ul className="m-0 pl-5 text-neutral-700 text-sm leading-relaxed space-y-1.5">
                  {responsabilidadesLocatario.map((ap) => (
                    <li key={ap.id} className="text-neutral-800">
                      <strong className="text-neutral-900">
                        {ap.index}. {ap.ambiente}
                      </strong>
                      {ap.subtitulo && ` - ${ap.subtitulo}`}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center mt-3">
                <Badge className="bg-neutral-600 text-white px-3 py-1 text-xs font-semibold">
                  {responsabilidadesLocatario.length}{' '}
                  {responsabilidadesLocatario.length === 1 ? 'item' : 'itens'}
                </Badge>
              </div>
            </div>
          )}

          {/* Seção Passíveis de Revisão */}
          {passiveisRevisao.length > 0 && (
            <div className="bg-amber-50 border border-amber-400 border-l-4 border-l-amber-700 rounded-lg p-5 shadow-sm">
              <div className="mb-4 pb-3 border-b border-amber-200">
                <Badge className="bg-amber-700 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  Passíveis de Revisão
                </Badge>
              </div>
              <div className="bg-white rounded border border-amber-200 p-4">
                <ul className="m-0 pl-5 text-amber-800 text-sm leading-relaxed space-y-1.5">
                  {passiveisRevisao.map((ap) => (
                    <li key={ap.id} className="text-amber-900">
                      <strong className="text-amber-950">
                        {ap.index}. {ap.ambiente}
                      </strong>
                      {ap.subtitulo && ` - ${ap.subtitulo}`}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center mt-3">
                <Badge className="bg-amber-700 text-white px-3 py-1 text-xs font-semibold">
                  {passiveisRevisao.length}{' '}
                  {passiveisRevisao.length === 1 ? 'item' : 'itens'}
                </Badge>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-4 italic text-center">
          Este resumo é exibido apenas internamente e não aparece nos documentos gerados.
        </p>
      </CardContent>
    </Card>
  );
};

