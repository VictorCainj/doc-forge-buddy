import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wand2 } from '@/utils/iconMapper';
import { useAnaliseVistoriaContext } from '../context/AnaliseVistoriaContext';
import { useToast } from '@/components/ui/use-toast';

export const ClassificationWarningBanner = () => {
  const { apontamentosSemClassificacao, apontamentos, setApontamentos } = useAnaliseVistoriaContext();
  const { toast } = useToast();

  const handleMigrarClassificacoes = () => {
    let apontamentosCorrigidos = 0;

    const apontamentosAtualizados = apontamentos.map((apontamento) => {
      // Se já tem classificação, não altera
      if (apontamento.classificacao) {
        return apontamento;
      }

      // TODOS os apontamentos sem classificação → Responsabilidade do Locatário
      apontamentosCorrigidos++;
      return {
        ...apontamento,
        classificacao: 'responsabilidade' as const,
      };
    });

    setApontamentos(apontamentosAtualizados);

    if (apontamentosCorrigidos > 0) {
      toast({
        title: 'Classificações atribuídas! ✅',
        description: `${apontamentosCorrigidos} apontamento(s) ${apontamentosCorrigidos === 1 ? 'foi atribuído' : 'foram atribuídos'} como responsabilidade do locatário.`,
      });
    } else {
      toast({
        title: 'Nenhuma correção necessária',
        description:
          'Todos os apontamentos já estão classificados corretamente.',
      });
    }
  };

  if (apontamentosSemClassificacao === 0) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-amber-50 to-warning-50 border-amber-300 shadow-md">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">
                Apontamentos Sem Classificação Detectados
              </h4>
              <p className="text-xs text-amber-700">
                <strong>{apontamentosSemClassificacao}</strong>{' '}
                apontamento(s) não possuem classificação e{' '}
                <strong>não aparecerão no resumo visual</strong> do
                documento. Clique no botão ao lado para atribuir todos
                como responsabilidade do locatário.
              </p>
            </div>
          </div>
          <Button
            onClick={handleMigrarClassificacoes}
            variant="secondary"
            size="sm"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Corrigir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
