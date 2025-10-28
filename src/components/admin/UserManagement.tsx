import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Edit, Power, Search } from '@/utils/iconMapper';
import { useUsersList, useToggleUserStatus } from '@/hooks/useUserManagement';
import { UserProfile, UserFilters } from '@/types/admin';
import { UserFormDialog } from './UserFormDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const UserManagement = () => {
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const { data: users, isLoading } = useUsersList(filters);
  const toggleStatus = useToggleUserStatus();

  const handleCreateUser = () => {
    setSelectedUser(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleToggleStatus = (user: UserProfile) => {
    toggleStatus.mutate({
      id: user.id,
      is_active: !user.is_active,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Filtros */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">
              Gestão de Usuários
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Gerencie usuários e suas permissões no sistema
            </p>
          </div>
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
          >
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por email ou nome..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <Select
            value={filters.role || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                role: value === 'all' ? undefined : (value as 'admin' | 'user'),
              })
            }
          >
            <SelectTrigger className="w-[180px] border-neutral-300">
              <SelectValue placeholder="Filtrar por cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="user">Usuários</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={
              filters.is_active === undefined
                ? 'all'
                : filters.is_active
                  ? 'active'
                  : 'inactive'
            }
            onValueChange={(value) =>
              setFilters({
                ...filters,
                is_active:
                  value === 'all' ? undefined : value === 'active' ? true : false,
              })
            }
          >
            <SelectTrigger className="w-[180px] border-neutral-300">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-neutral-500">Carregando usuários...</p>
                </TableCell>
              </TableRow>
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {user.full_name || 'Sem nome'}
                      </p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                    >
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.is_active ? 'default' : 'destructive'}
                      className={
                        user.is_active
                          ? 'bg-success-100 text-success-800 hover:bg-success-100'
                          : ''
                      }
                    >
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-neutral-600">
                      {format(new Date(user.created_at), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200"
                        title="Editar usuário"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={toggleStatus.isPending}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 ${
                          user.is_active
                            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300'
                            : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:border-green-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-neutral-500">Nenhum usuário encontrado</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Criar/Editar */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        mode={dialogMode}
      />
    </div>
  );
};
