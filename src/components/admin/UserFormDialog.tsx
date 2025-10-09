import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  UserProfile,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/types/admin';
import { useCreateUser, useUpdateUser } from '@/hooks/useUserManagement';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfile | null;
  mode: 'create' | 'edit';
}

export const UserFormDialog = ({
  open,
  onOpenChange,
  user,
  mode,
}: UserFormDialogProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as 'admin' | 'user',
    is_active: true,
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name || '',
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        is_active: true,
      });
    }
  }, [mode, user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'create') {
      const payload: CreateUserPayload = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined,
        role: formData.role,
      };

      createUser.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    } else if (mode === 'edit' && user) {
      const payload: UpdateUserPayload = {
        id: user.id,
        email: formData.email !== user.email ? formData.email : undefined,
        full_name:
          formData.full_name !== user.full_name
            ? formData.full_name
            : undefined,
        role: formData.role !== user.role ? formData.role : undefined,
        is_active:
          formData.is_active !== user.is_active
            ? formData.is_active
            : undefined,
      };

      updateUser.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Criar Novo Usuário' : 'Editar Usuário'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Preencha os dados para criar um novo usuário no sistema.'
                : 'Atualize as informações do usuário.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={mode === 'edit'}
                placeholder="usuario@exemplo.com"
              />
            </div>

            {mode === 'create' && (
              <div className="grid gap-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Nome completo do usuário"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Cargo</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'user') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'edit' && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Usuário Ativo</Label>
                  <p className="text-sm text-neutral-500">
                    Desative para impedir o acesso ao sistema
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Salvando...'
                : mode === 'create'
                  ? 'Criar Usuário'
                  : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
