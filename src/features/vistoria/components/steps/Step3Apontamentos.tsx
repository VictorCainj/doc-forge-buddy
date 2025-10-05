import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { VistoriaWizardData } from '../../hooks/useVistoriaWizard';

interface Step3ApontamentosProps {
  data: VistoriaWizardData;
  updateData: (data: Partial<VistoriaWizardData>) => void;
  errors: Record<string, string>;
}

export const Step3Apontamentos: React.FC<Step3ApontamentosProps> = ({ data, updateData, errors }) => {
  const apontamentos = data.apontamentos || [];
  const ambientes = data.ambientes || [];

  const adicionarApontamento = () => {
    updateData({
      apontamentos: [...apontamentos, {
        ambiente: '',
        subtitulo: '',
        descricao: '',
        tipo: 'material' as const,
      }]
    });
  };

  const removerApontamento = (index: number) => {
    updateData({
      apontamentos: apontamentos.filter((_, i) => i !== index)
    });
  };

  const atualizarApontamento = (index: number, campo: string, valor: any) => {
    const novosApontamentos = [...apontamentos];
    novosApontamentos[index] = { ...novosApontamentos[index], [campo]: valor };
    updateData({ apontamentos: novosApontamentos });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Apontamentos</h2>
        <p className="text-sm text-muted-foreground">
          Registre os itens a reparar ou observar
        </p>
      </div>

      {errors.apontamentos && (
        <p className="text-sm text-destructive">{errors.apontamentos}</p>
      )}

      <div className="space-y-4">
        {apontamentos.map((apt, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Apontamento {index + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerApontamento(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ambiente</Label>
                  <Select
                    value={apt.ambiente}
                    onValueChange={(value) => atualizarApontamento(index, 'ambiente', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ambientes.map((amb, i) => (
                        <SelectItem key={i} value={amb.nome}>
                          {amb.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={apt.tipo}
                    onValueChange={(value) => atualizarApontamento(index, 'tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="servico">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={apt.subtitulo}
                  onChange={(e) => atualizarApontamento(index, 'subtitulo', e.target.value)}
                  placeholder="Ex: Pintura descascada"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={apt.descricao}
                  onChange={(e) => atualizarApontamento(index, 'descricao', e.target.value)}
                  placeholder="Descreva o apontamento..."
                  rows={3}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={adicionarApontamento}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Apontamento
      </Button>
    </div>
  );
};
