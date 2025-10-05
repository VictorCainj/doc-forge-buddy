import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VistoriaWizardData } from '../../hooks/useVistoriaWizard';

interface Step4OrcamentoProps {
  data: VistoriaWizardData;
  updateData: (data: Partial<VistoriaWizardData>) => void;
  errors: Record<string, string>;
}

export const Step4Orcamento: React.FC<Step4OrcamentoProps> = ({ data, updateData, errors }) => {
  const orcamento = data.orcamento || { valorTotal: 0, itens: [] };

  const atualizarValorTotal = (valor: string) => {
    const valorNumerico = parseFloat(valor) || 0;
    updateData({
      orcamento: { ...orcamento, valorTotal: valorNumerico }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Orçamento</h2>
        <p className="text-sm text-muted-foreground">
          Defina os valores estimados para os reparos
        </p>
      </div>

      {errors.orcamento && (
        <p className="text-sm text-destructive">{errors.orcamento}</p>
      )}

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="prestador">Prestador (Opcional)</Label>
            <Input
              id="prestador"
              value={orcamento.prestadorId || ''}
              onChange={(e) => updateData({
                orcamento: { ...orcamento, prestadorId: e.target.value }
              })}
              placeholder="Nome do prestador"
            />
          </div>

          <div>
            <Label htmlFor="valorTotal">Valor Total Estimado</Label>
            <Input
              id="valorTotal"
              type="number"
              step="0.01"
              value={orcamento.valorTotal}
              onChange={(e) => atualizarValorTotal(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Os itens do orçamento serão baseados nos apontamentos registrados
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
