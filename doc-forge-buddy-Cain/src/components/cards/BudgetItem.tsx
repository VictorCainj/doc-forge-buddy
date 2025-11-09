import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BudgetItem, BudgetItemType } from '@/types/orcamento';
import {
  Trash2,
  Edit,
  DollarSign,
  Calculator,
  Package,
  Wrench,
} from '@/utils/iconMapper';

interface BudgetItemProps {
  item: BudgetItem;
  index: number;
  onUpdate: (id: string, item: Partial<BudgetItem>) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  isEditing: boolean;
}

export const BudgetItemComponent: React.FC<BudgetItemProps> = ({
  item,
  index,
  onUpdate,
  onRemove,
  onEdit,
  isEditing,
}) => {
  const [editData, setEditData] = useState<BudgetItem>(item);

  const handleSaveEdit = () => {
    onUpdate(item.id, editData);
    onEdit(''); // Sai do modo de edição após salvar
  };

  const handleCancelEdit = () => {
    setEditData(item);
    onEdit(''); // Sai do modo de edição
  };

  const subtotal = (editData.valor || 0) * (editData.quantidade || 0);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        {!isEditing ? (
          // MODO DE VISUALIZAÇÃO
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    {item.ambiente}
                    {item.subtitulo && (
                      <span className="text-muted-foreground ml-2">
                        - {item.subtitulo}
                      </span>
                    )}
                  </h4>
                  <Badge
                    variant={
                      item.tipo === 'material'
                        ? 'default'
                        : item.tipo === 'mao_de_obra'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-xs"
                  >
                    {item.tipo === 'material' ? (
                      <>
                        <Package className="h-3 w-3 mr-1" />
                        Material
                      </>
                    ) : item.tipo === 'mao_de_obra' ? (
                      <>
                        <Wrench className="h-3 w-3 mr-1" />
                        Mão de Obra
                      </>
                    ) : (
                      <>
                        <Package className="h-3 w-3 mr-1" />
                        <Wrench className="h-3 w-3 ml-1 mr-1" />
                        Ambos
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.descricao}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item.id)}
                className="h-7 w-7 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          // MODO DE EDIÇÃO
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Ambiente</Label>
                <Input
                  value={editData.ambiente}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      ambiente: e.target.value,
                    }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Subtítulo</Label>
                <Input
                  value={editData.subtitulo}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      subtitulo: e.target.value,
                    }))
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Descrição</Label>
              <Textarea
                value={editData.descricao}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                rows={2}
                className="text-sm"
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Tipo</Label>
                <Select
                  value={editData.tipo}
                  onValueChange={(value: BudgetItemType) =>
                    setEditData((prev) => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span>Material</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="mao_de_obra">
                      <div className="flex items-center space-x-2">
                        <Wrench className="h-4 w-4" />
                        <span>Mão de Obra</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ambos">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <Wrench className="h-4 w-4 ml-1" />
                        <span className="ml-1">Ambos</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Valor Unit.</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.valor}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        valor: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="pl-7 h-8 text-sm"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Quantidade</Label>
                <div className="relative">
                  <Calculator className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.quantidade}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        quantidade: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="pl-7 h-8 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Subtotal</Label>
                <div className="flex items-center space-x-1 h-8 px-2 bg-muted/50 rounded border text-sm font-medium">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span>
                    {subtotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
                className="h-8"
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} size="sm" className="h-8">
                Salvar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
