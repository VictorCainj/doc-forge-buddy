import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from '@/utils/iconMapper';
import { VistoriaWizardData } from '../../hooks/useVistoriaWizard';

interface Step2AmbientesProps {
  data: VistoriaWizardData;
  updateData: (data: Partial<VistoriaWizardData>) => void;
  errors: Record<string, string>;
}

export const Step2Ambientes: React.FC<Step2AmbientesProps> = ({ data, updateData, errors }) => {
  const ambientes = data.ambientes || [];

  const adicionarAmbiente = () => {
    updateData({
      ambientes: [...ambientes, { nome: '', fotos: [] }]
    });
  };

  const removerAmbiente = (index: number) => {
    updateData({
      ambientes: ambientes.filter((_, i) => i !== index)
    });
  };

  const atualizarAmbiente = (index: number, nome: string) => {
    const novosAmbientes = [...ambientes];
    novosAmbientes[index] = { ...novosAmbientes[index], nome };
    updateData({ ambientes: novosAmbientes });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Ambientes da Vistoria</h2>
        <p className="text-sm text-muted-foreground">
          Adicione os ambientes que serão vistoriados
        </p>
      </div>

      {errors.ambientes && (
        <p className="text-sm text-destructive">{errors.ambientes}</p>
      )}

      <div className="space-y-3">
        {ambientes.map((ambiente, index) => (
          <Card key={index} className="p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor={`ambiente-${index}`}>Nome do Ambiente</Label>
                <Input
                  id={`ambiente-${index}`}
                  value={ambiente.nome}
                  onChange={(e) => atualizarAmbiente(index, e.target.value)}
                  placeholder="Ex: Sala, Quarto, Cozinha..."
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removerAmbiente(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={adicionarAmbiente}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Ambiente
      </Button>
    </div>
  );
};
