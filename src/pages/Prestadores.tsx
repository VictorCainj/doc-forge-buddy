import { useState } from 'react';
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
import {
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Search,
} from '@/utils/iconMapper';
import {
  usePrestadores,
  CreatePrestadorData,
  Prestador,
} from '@/hooks/usePrestadores';
import { memo } from 'react';

// Componente de formulário memoizado para evitar re-renders
interface PrestadorFormProps {
  formData: CreatePrestadorData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePrestadorData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  isEdit?: boolean;
}

const PrestadorForm = memo(
  ({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    saving,
    isEdit = false,
  }: PrestadorFormProps) => (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
          Nome *
        </Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Nome do prestador"
          required
          className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700">
            CNPJ
          </Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
            className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="telefone"
            className="text-sm font-medium text-gray-700"
          >
            Telefone
          </Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) =>
              setFormData({ ...formData, telefone: e.target.value })
            }
            placeholder="(00) 00000-0000"
            className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@exemplo.com"
          className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco" className="text-sm font-medium text-gray-700">
          Endereço
        </Label>
        <Input
          id="endereco"
          value={formData.endereco}
          onChange={(e) =>
            setFormData({ ...formData, endereco: e.target.value })
          }
          placeholder="Rua, número, bairro, cidade"
          className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="especialidade"
          className="text-sm font-medium text-gray-700"
        >
          Especialidade
        </Label>
        <Input
          id="especialidade"
          value={formData.especialidade}
          onChange={(e) =>
            setFormData({ ...formData, especialidade: e.target.value })
          }
          placeholder="Ex: Pintura, Elétrica, Hidráulica"
          className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="observacoes"
          className="text-sm font-medium text-gray-700"
        >
          Observações
        </Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) =>
            setFormData({ ...formData, observacoes: e.target.value })
          }
          placeholder="Informações adicionais"
          rows={3}
          className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="text-sm px-6 py-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="text-sm px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 rounded-lg"
        >
          {saving ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  )
);

PrestadorForm.displayName = 'PrestadorForm';

const Prestadores = () => {
  const {
    prestadores,
    loading,
    saving,
    createPrestador,
    updatePrestador,
    deletePrestador,
  } = usePrestadores();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState<Prestador | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreatePrestadorData>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    especialidade: '',
    observacoes: '',
  });

  // Filtrar prestadores baseado na busca
  const filteredPrestadores = prestadores.filter(
    (prestador) =>
      prestador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestador.especialidade
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prestador.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
          <p className="text-sm text-gray-500">Carregando prestadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Minimalista */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-normal text-gray-900">
                Prestadores
              </h1>
              <p className="text-gray-500 mt-1">
                Gerencie seus prestadores de serviço
              </p>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Prestador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader className="pb-4 border-b border-gray-200">
                  <DialogTitle className="text-xl font-medium text-gray-900">
                    Criar Novo Prestador
                  </DialogTitle>
                  <DialogDescription className="text-gray-500">
                    Preencha os dados do prestador de serviço
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6">
                  <PrestadorForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreateSubmit}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    saving={saving}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Barra de Pesquisa */}
          {prestadores.length > 0 && (
            <div className="mt-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar prestadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-gray-400 focus:ring-0 rounded-lg bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {prestadores.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum prestador cadastrado
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Comece criando seu primeiro prestador de serviço para organizar
              seus fornecedores
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Prestador
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrestadores.map((prestador) => (
              <div
                key={prestador.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {prestador.nome}
                    </h3>
                    {prestador.especialidade && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {prestador.especialidade}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(prestador)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPrestador(prestador);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {prestador.cnpj && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{prestador.cnpj}</span>
                    </div>
                  )}
                  {prestador.telefone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{prestador.telefone}</span>
                    </div>
                  )}
                  {prestador.email && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{prestador.email}</span>
                    </div>
                  )}
                  {prestador.endereco && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600 line-clamp-2">
                        {prestador.endereco}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-medium text-gray-900">
              Editar Prestador
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Atualize os dados do prestador de serviço
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <PrestadorForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
              saving={saving}
              isEdit
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-medium text-gray-900">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Tem certeza que deseja excluir o prestador "
              {selectedPrestador?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700 rounded-lg"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Prestadores;
