import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EntityType } from '@/types/admin';
import { useBulkEdit, useBulkUpdate } from '@/hooks/useBulkEdit';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Users, FolderOpen, File } from 'lucide-react';
import { toast } from 'sonner';

const entityConfig = {
  contracts: {
    label: 'Contratos',
    icon: FileText,
    fields: [{ name: 'prazo_dias', label: 'Prazo (dias)', type: 'text' }],
  },
  prestadores: {
    label: 'Prestadores',
    icon: Users,
    fields: [
      { name: 'especialidade', label: 'Especialidade', type: 'text' },
      { name: 'telefone', label: 'Telefone', type: 'text' },
    ],
  },
  vistoria_analises: {
    label: 'Vistorias',
    icon: FolderOpen,
    fields: [{ name: 'title', label: 'Título', type: 'text' }],
  },
  saved_terms: {
    label: 'Documentos Salvos',
    icon: File,
    fields: [
      { name: 'title', label: 'Título', type: 'text' },
      { name: 'document_type', label: 'Tipo de Documento', type: 'text' },
    ],
  },
};

export const BulkEditPanel = () => {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('contracts');
  const [updateFields, setUpdateFields] = useState<Record<string, string>>({});

  const {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
  } = useBulkEdit();

  const bulkUpdate = useBulkUpdate();

  // Buscar dados da entidade selecionada
  const { data: items, isLoading } = useQuery({
    queryKey: ['bulk-edit', selectedEntity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(selectedEntity)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const handleSelectAll = () => {
    if (items) {
      const allIds = items.map((item: any) => item.id);
      if (selectedCount === allIds.length) {
        clearSelection();
      } else {
        selectAll(allIds);
      }
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setUpdateFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleApplyChanges = () => {
    if (selectedCount === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    const fieldsToUpdate = Object.entries(updateFields)
      .filter(([_, value]) => value.trim() !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    if (Object.keys(fieldsToUpdate).length === 0) {
      toast.error('Preencha pelo menos um campo para atualizar');
      return;
    }

    bulkUpdate.mutate(
      {
        table: selectedEntity,
        ids: selectedIds,
        data: fieldsToUpdate,
      },
      {
        onSuccess: () => {
          clearSelection();
          setUpdateFields({});
        },
      }
    );
  };

  const config = entityConfig[selectedEntity];
  const Icon = config.icon;
  const allSelected = items && selectedCount === items.length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">
          Edição em Massa
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Selecione itens e aplique alterações em lote
        </p>
      </div>

      {/* Seleção de Entidade */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione a Entidade</CardTitle>
          <CardDescription>
            Escolha qual tipo de dado você deseja editar em massa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedEntity}
            onValueChange={(value: EntityType) => {
              setSelectedEntity(value);
              clearSelection();
              setUpdateFields({});
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(entityConfig).map(([key, config]) => {
                const EntityIcon = config.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <EntityIcon className="h-4 w-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Seleção de Itens */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Selecionar Itens</CardTitle>
              <CardDescription>
                {selectedCount}{' '}
                {selectedCount === 1
                  ? 'item selecionado'
                  : 'itens selecionados'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-neutral-500">Carregando...</p>
          ) : items && items.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <Checkbox
                    checked={isSelected(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                  />
                  <Icon className="h-4 w-4 text-neutral-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {item.title ||
                        item.nome ||
                        item.email ||
                        item.numero_contrato ||
                        'Sem título'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.email || item.endereco_imovel || ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-neutral-500">
              Nenhum item encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Campos de Atualização */}
      <Card>
        <CardHeader>
          <CardTitle>Campos para Atualizar</CardTitle>
          <CardDescription>
            Preencha os campos que deseja atualizar em todos os itens
            selecionados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.fields.map((field) => (
            <div key={field.name} className="grid gap-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type={field.type}
                value={updateFields[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={`Novo valor para ${field.label.toLowerCase()}`}
              />
            </div>
          ))}

          {bulkUpdate.isPending && (
            <div className="space-y-2">
              <Label>Progresso</Label>
              <Progress value={50} />
              <p className="text-xs text-neutral-500">
                Aplicando alterações...
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleApplyChanges}
              disabled={selectedCount === 0 || bulkUpdate.isPending}
              className="flex-1"
            >
              {bulkUpdate.isPending
                ? 'Aplicando...'
                : `Aplicar Alterações (${selectedCount})`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                clearSelection();
                setUpdateFields({});
              }}
              disabled={bulkUpdate.isPending}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
