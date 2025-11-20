import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOccurrenceTypesAdmin } from '@/hooks/useOccurrenceTypesAdmin';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
} from '@/utils/iconMapper';

interface OccurrenceType {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
}

export const OccurrenceTypesManagement = () => {
  const { types, isLoading, createType, updateType, deleteType } =
    useOccurrenceTypesAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OccurrenceType | null>(null);

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar tipos por termo de busca
  const filteredTypes = types.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createType(newName, newDescription.trim() || undefined);
      setNewName('');
      setNewDescription('');
      setIsCreateDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedType || !newName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateType(
        selectedType.id,
        newName,
        newDescription.trim() || null,
        newIsActive
      );
      setIsEditDialogOpen(false);
      setSelectedType(null);
      setNewName('');
      setNewDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteType(selectedType.id);
      setIsDeleteDialogOpen(false);
      setSelectedType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (type: OccurrenceType) => {
    setSelectedType(type);
    setNewName(type.name);
    setNewDescription(type.description || '');
    setNewIsActive(type.is_active);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (type: OccurrenceType) => {
    setSelectedType(type);
    setIsDeleteDialogOpen(true);
  };

  const activeCount = types.filter((t) => t.is_active).length;
  const inactiveCount = types.filter((t) => !t.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total de Tipos</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    types.length
                  )}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Ativos</p>
                <p className="text-2xl font-bold text-success-700">
                  {activeCount}
                </p>
              </div>
              <div className="h-12 w-12 bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Inativos</p>
                <p className="text-2xl font-bold text-neutral-600">
                  {inactiveCount}
                </p>
              </div>
              <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-neutral-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações e Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                Gerenciar Tipos de Ocorrência
              </CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                Crie, edite e gerencie os tipos de ocorrência disponíveis para
                contratos
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar tipos de ocorrência..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Tipos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">
                {searchTerm
                  ? 'Nenhum tipo encontrado com esse termo'
                  : 'Nenhum tipo cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {type.name}
                      </p>
                      {type.description && (
                        <p className="text-sm text-neutral-600 truncate mt-1">
                          {type.description}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 mt-1">
                        ID: {type.id.slice(0, 8)}...
                      </p>
                    </div>
                    <Badge
                      variant={type.is_active ? 'default' : 'secondary'}
                      className="ml-auto"
                    >
                      {type.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(type)}
                      className="hover:bg-error-50 hover:border-error-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Tipo de Ocorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nome do Tipo <span className="text-error-600">*</span>
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Negociação - Aditivo"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Descrição (opcional)
              </label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descreva quando este tipo deve ser usado..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewName('');
                setNewDescription('');
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !newName.trim()}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Ocorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nome do Tipo <span className="text-error-600">*</span>
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Negociação - Aditivo"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Descrição (opcional)
              </label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descreva quando este tipo deve ser usado..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={newIsActive}
                onChange={(e) => setNewIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-primary-600 rounded border-neutral-300"
              />
              <label htmlFor="isActive" className="text-sm">
                Tipo ativo
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedType(null);
                setNewName('');
                setNewDescription('');
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting || !newName.trim()}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Deletar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o tipo &quot;{selectedType?.name}
              &quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-error-600 hover:bg-error-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

