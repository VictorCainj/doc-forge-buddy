import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from '@/utils/iconMapper';

export const NoContractAlert = () => {
  return (
    <Card className="mb-6 border-neutral-100 bg-gradient-to-br from-neutral-50 to-white shadow-sm">
      <CardContent className="py-6 px-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              Nenhum contrato carregado
            </h3>
            <p className="text-sm text-neutral-600">
              Selecione um contrato na página de Contratos para criar uma análise.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
