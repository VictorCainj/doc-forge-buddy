// @ts-nocheck
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
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<UserProfile | null>(null);

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
    setUserToToggle(user);
    setConfirmModalOpen(true);
  };

  const confirmToggleStatus = () => {
    if (userToToggle) {
      toggleStatus.mutate({
        id: userToToggle.id,
        is_active: !userToToggle.is_active,
      });
      setConfirmModalOpen(false);
      setUserToToggle(null);
    }
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
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
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
                  value === 'all'
                    ? undefined
                    : value === 'active'
                      ? true
                      : false,
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
                        title={
                          user.is_active
                            ? 'Desativar usuário'
                            : 'Ativar usuário'
                        }
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

      {/* Modal de Confirmação de Desativação */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg overflow-hidden max-w-md w-full mx-4 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]">
            <div className="pt-5 px-4 pb-4">
              {/* Ícone */}
              <div className="flex justify-center mb-3">
                <div
                  className={`flex justify-center items-center w-12 h-12 rounded-full ${
                    userToToggle?.is_active ? 'bg-red-100' : 'bg-green-100'
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`w-6 h-6 ${
                      userToToggle?.is_active
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {userToToggle?.is_active ? (
                      <path
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    ) : (
                      <path
                        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="text-center">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {userToToggle?.is_active
                    ? 'Desativar usuário'
                    : 'Ativar usuário'}
                </h3>
                <p className="text-sm text-gray-600 leading-5">
                  {userToToggle?.is_active
                    ? 'Tem certeza que deseja desativar este usuário? O usuário perderá acesso ao sistema, mas os dados serão mantidos.'
                    : 'Tem certeza que deseja ativar este usuário? O usuário voltará a ter acesso ao sistema.'}
                </p>
              </div>

              {/* Ações */}
              <div className="mt-3 mx-1 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={confirmToggleStatus}
                  disabled={toggleStatus.isPending}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-md font-medium text-white transition-all duration-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] ${
                    userToToggle?.is_active
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {toggleStatus.isPending
                    ? 'Processando...'
                    : userToToggle?.is_active
                      ? 'Desativar'
                      : 'Ativar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModalOpen(false);
                    setUserToToggle(null);
                  }}
                  disabled={toggleStatus.isPending}
                  className="mt-3 w-full flex items-center justify-center px-4 py-2 rounded-md font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
