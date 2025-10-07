import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Edit, Trash2, User, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { usePrestadores, CreatePrestadorData, Prestador } from '@/hooks/usePrestadores';
import { Badge } from '@/components/ui/badge';
import { memo } from 'react';
import { ActionButton } from '@/components/ui/action-button';

// Componente de formulário memoizado para evitar re-renders
interface PrestadorFormProps {
  formData: CreatePrestadorData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePrestadorData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  isEdit?: boolean;
}

const PrestadorForm = memo(({ formData, setFormData, onSubmit, onCancel, saving, isEdit = false }: PrestadorFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="nome">Nome *</Label>
      <Input
        id="nome"
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        placeholder="Nome do prestador"
        required
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          value={formData.cnpj}
          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          placeholder="00.000.000/0000-00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          value={formData.telefone}
          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          placeholder="(00) 00000-0000"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="email">E-mail</Label>
      <Input
        id="email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="email@exemplo.com"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="endereco">Endereço</Label>
      <Input
        id="endereco"
        value={formData.endereco}
        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
        placeholder="Rua, número, bairro, cidade"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="especialidade">Especialidade</Label>
      <Input
        id="especialidade"
        value={formData.especialidade}
        onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
        placeholder="Ex: Pintura, Elétrica, Hidráulica"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="observacoes">Observações</Label>
      <Textarea
        id="observacoes"
        value={formData.observacoes}
        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
        placeholder="Informações adicionais"
        rows={3}
      />
    </div>

    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancelar
      </Button>
      <Button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
      </Button>
    </div>
  </form>
));

PrestadorForm.displayName = 'PrestadorForm';

const Prestadores = () => {
  const { prestadores, loading, saving, createPrestador, updatePrestador, deletePrestador } = usePrestadores();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState<Prestador | null>(null);
  const [formData, setFormData] = useState<CreatePrestadorData>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    especialidade: '',
    observacoes: '',
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createPrestador(formData);
    if (result) {
      setIsCreateDialogOpen(false);
      setFormData({
        nome: '',
        cnpj: '',
        telefone: '',
        email: '',
        endereco: '',
        especialidade: '',
        observacoes: '',
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrestador) return;
    
    const success = await updatePrestador(selectedPrestador.id, formData);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedPrestador(null);
      setFormData({
        nome: '',
        cnpj: '',
        telefone: '',
        email: '',
        endereco: '',
        especialidade: '',
        observacoes: '',
      });
    }
  };

  const handleEdit = (prestador: Prestador) => {
    setSelectedPrestador(prestador);
    setFormData({
      nome: prestador.nome,
      cnpj: prestador.cnpj || '',
      telefone: prestador.telefone || '',
      email: prestador.email || '',
      endereco: prestador.endereco || '',
      especialidade: prestador.especialidade || '',
      observacoes: prestador.observacoes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPrestador) return;
    
    const success = await deletePrestador(selectedPrestador.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedPrestador(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">

      <div className="container mx-auto p-6 space-y-6 relative z-10">
        {/* Header Minimalista */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Prestadores</h1>
              <p className="text-sm text-neutral-500 mt-1">Gerencie seus prestadores de serviço</p>
            </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <ActionButton
              icon={Plus}
              label="Novo Prestador"
              variant="primary"
              size="md"
            />
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Criar Novo Prestador</DialogTitle>
              <DialogDescription>
                Preencha os dados do prestador de serviço
              </DialogDescription>
            </DialogHeader>
            <PrestadorForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateDialogOpen(false)}
              saving={saving}
            />
          </DialogContent>
        </Dialog>
          </div>
        </div>

        {prestadores.length === 0 ? (
          <Card className="bg-white border-neutral-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-neutral-100 rounded-lg mb-4">
                <User className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900">Nenhum prestador cadastrado</h3>
              <p className="text-neutral-600 text-center mb-4">
                Comece criando seu primeiro prestador de serviço
              </p>
            <ActionButton
              icon={Plus}
              label="Criar Prestador"
              variant="primary"
              size="md"
              onClick={() => setIsCreateDialogOpen(true)}
            />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prestadores.map((prestador) => (
              <Card key={prestador.id} className="bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-neutral-900">{prestador.nome}</CardTitle>
                      {prestador.especialidade && (
                        <Badge className="mt-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {prestador.especialidade}
                        </Badge>
                      )}
                  </div>
                  <div className="flex gap-1">
                    <ActionButton
                      icon={Edit}
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={() => handleEdit(prestador)}
                      title="Editar prestador"
                    />
                    <ActionButton
                      icon={Trash2}
                      variant="danger"
                      size="sm"
                      iconOnly
                      onClick={() => {
                        setSelectedPrestador(prestador);
                        setIsDeleteDialogOpen(true);
                      }}
                      title="Deletar prestador"
                    />
                  </div>
                </div>
              </CardHeader>
                <CardContent className="space-y-2">
                  {prestador.cnpj && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Briefcase className="h-4 w-4 text-neutral-500" />
                      <span>{prestador.cnpj}</span>
                    </div>
                  )}
                  {prestador.telefone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Phone className="h-4 w-4 text-neutral-500" />
                      <span>{prestador.telefone}</span>
                    </div>
                  )}
                  {prestador.email && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Mail className="h-4 w-4 text-neutral-500" />
                      <span className="truncate">{prestador.email}</span>
                    </div>
                  )}
                  {prestador.endereco && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-neutral-500" />
                      <span className="text-neutral-600 line-clamp-2">{prestador.endereco}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Prestador</DialogTitle>
            <DialogDescription>
              Atualize os dados do prestador de serviço
            </DialogDescription>
          </DialogHeader>
          <PrestadorForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditDialogOpen(false)}
            saving={saving}
            isEdit
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o prestador "{selectedPrestador?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-neutral-900 text-white hover:bg-neutral-800">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Prestadores;
