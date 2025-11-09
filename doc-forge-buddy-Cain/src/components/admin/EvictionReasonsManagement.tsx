import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useEvictionReasonsAdmin } from '@/hooks/useEvictionReasonsAdmin';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
} from '@/utils/iconMapper';

interface EvictionReason {
  id: string;
  description: string;
  is_active: boolean;
}

export const EvictionReasonsManagement = () => {
  const { reasons, isLoading, createReason, updateReason, deleteReason } =
    useEvictionReasonsAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<{
    id: string;
    description: string;
    is_active: boolean;
  } | null>(null);

  const [newDescription, setNewDescription] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar motivos por termo de busca
  const filteredReasons = reasons.filter((reason) =>
    reason.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newDescription.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createReason(newDescription);
      setNewDescription('');
      setIsCreateDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedReason || !newDescription.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateReason(selectedReason.id, newDescription, newIsActive);
      setIsEditDialogOpen(false);
      setSelectedReason(null);
      setNewDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReason) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteReason(selectedReason.id);
      setIsDeleteDialogOpen(false);
      setSelectedReason(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (reason: EvictionReason) => {
    setSelectedReason(reason);
    setNewDescription(reason.description);
    setNewIsActive(reason.is_active);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (reason: EvictionReason) => {
    setSelectedReason(reason);
    setIsDeleteDialogOpen(true);
  };

  const activeCount = reasons.filter((r) => r.is_active).length;
  const inactiveCount = reasons.filter((r) => !r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total de Motivos</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    reasons.length
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
              <CardTitle className="text-xl">Gerenciar Motivos de Desocupação</CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                Crie, edite e gerencie os motivos pré-cadastrados para desocupação
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Motivo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar motivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Motivos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredReasons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">
                {searchTerm
                  ? 'Nenhum motivo encontrado com esse termo'
                  : 'Nenhum motivo cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReasons.map((reason) => (
                <div
                  key={reason.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {reason.description}
                      </p>
                      <p className="text-xs text-neutral-500">
                        ID: {reason.id.slice(0, 8)}...
                      </p>
                    </div>
                    <Badge
                      variant={reason.is_active ? 'default' : 'secondary'}
                      className="ml-auto"
                    >
                      {reason.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(reason)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(reason)}
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
            <DialogTitle>Criar Novo Motivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Descrição do Motivo
              </label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ex: Término natural do contrato"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewDescription('');
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !newDescription.trim()}>
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
            <DialogTitle>Editar Motivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Descrição do Motivo
              </label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ex: Término natural do contrato"
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
                Motivo ativo
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedReason(null);
                setNewDescription('');
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting || !newDescription.trim()}>
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
              Tem certeza que deseja deletar o motivo &quot;
              {selectedReason?.description}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
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
