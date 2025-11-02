import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/premium-button';
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
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Search,
  Building2,
  Users,
  FileText,
  Copy,
  Check,
} from '@/utils/iconMapper';
import {
  usePrestadores,
  CreatePrestadorData,
  Prestador,
} from '@/hooks/usePrestadores';
import { memo } from 'react';
import { log } from '@/utils/logger';

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
        <Label htmlFor="nome" className="text-sm font-medium text-neutral-700">
          Nome *
        </Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Nome do prestador"
          required
          className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="cnpj"
            className="text-sm font-medium text-neutral-700"
          >
            CNPJ
          </Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
            className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="telefone"
            className="text-sm font-medium text-neutral-700"
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
            className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@exemplo.com"
          className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="endereco"
          className="text-sm font-medium text-neutral-700"
        >
          Endereço
        </Label>
        <Input
          id="endereco"
          value={formData.endereco}
          onChange={(e) =>
            setFormData({ ...formData, endereco: e.target.value })
          }
          placeholder="Rua, número, bairro, cidade"
          className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="especialidade"
          className="text-sm font-medium text-neutral-700"
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
          className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="observacoes"
          className="text-sm font-medium text-neutral-700"
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
          className="border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [copiedPrestadorId, setCopiedPrestadorId] = useState<string | null>(
    null
  );
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

  // Função para copiar informações do prestador
  const handleCopyPrestadorInfo = async (prestador: Prestador) => {
    // Construir mensagem com informações do prestador
    const info = [
      `Prestador de Serviço: ${prestador.nome}`,
      prestador.especialidade ? `Serviços: ${prestador.especialidade}` : null,
      prestador.telefone ? `Telefone: ${prestador.telefone}` : null,
      prestador.email ? `E-mail: ${prestador.email}` : null,
      prestador.cnpj ? `CNPJ: ${prestador.cnpj}` : null,
      prestador.endereco ? `Endereço: ${prestador.endereco}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(info);
      setCopiedPrestadorId(prestador.id);
      setTimeout(() => setCopiedPrestadorId(null), 2000);
    } catch (err) {
      log.error('Erro ao copiar informação:', err);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-neutral-600 font-medium">
            Carregando prestadores...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Moderno */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
                  Prestadores
                </h1>
                <p className="text-neutral-600 mt-1.5 text-sm sm:text-base">
                  Gerencie seus prestadores de serviço de forma eficiente
                </p>
              </div>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <PremiumButton icon={<Plus />} variant="success">
                  Novo Prestador
                </PremiumButton>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-neutral-200 shadow-xl">
                <DialogHeader className="pb-4 border-b border-neutral-200">
                  <DialogTitle className="text-xl font-semibold text-neutral-900">
                    Criar Novo Prestador
                  </DialogTitle>
                  <DialogDescription className="text-neutral-600">
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

          {/* Barra de Pesquisa Modernizada */}
          {prestadores.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Buscar prestadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 h-12 border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white shadow-sm"
              />
            </div>
          )}
        </div>

        {prestadores.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl mb-6 shadow-sm">
              <Users className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
              Nenhum prestador cadastrado
            </h3>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              Comece criando seu primeiro prestador de serviço para organizar
              seus fornecedores
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              Criar Prestador
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrestadores.map((prestador, index) => (
              <div
                key={prestador.id}
                className="group relative bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300 overflow-hidden animate-in fade-in-50"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors truncate">
                        {prestador.nome}
                      </h3>
                    </div>
                    <div className="flex gap-1 ml-3">
                      <button
                        onClick={() => handleCopyPrestadorInfo(prestador)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                        title="Copiar informações"
                      >
                        {copiedPrestadorId === prestador.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(prestador)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrestador(prestador);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {prestador.especialidade && (
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          {prestador.especialidade}
                        </span>
                      </div>
                    )}
                    {prestador.cnpj && (
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="flex-shrink-0 w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span className="truncate">{prestador.cnpj}</span>
                      </div>
                    )}
                    {prestador.telefone && (
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="flex-shrink-0 w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center">
                          <Phone className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span>{prestador.telefone}</span>
                      </div>
                    )}
                    {prestador.email && (
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="flex-shrink-0 w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center">
                          <Mail className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span className="truncate">{prestador.email}</span>
                      </div>
                    )}
                    {prestador.endereco && (
                      <div className="flex items-start gap-3 text-sm">
                        <div className="flex-shrink-0 w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center mt-0.5">
                          <MapPin className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span className="text-neutral-600 line-clamp-2">
                          {prestador.endereco}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-neutral-200 shadow-xl">
          <DialogHeader className="pb-4 border-b border-neutral-200">
            <DialogTitle className="text-xl font-semibold text-neutral-900">
              Editar Prestador
            </DialogTitle>
            <DialogDescription className="text-neutral-600">
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
        <AlertDialogContent className="bg-white border-neutral-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-neutral-900">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-600">
              Tem certeza que deseja excluir o prestador "
              {selectedPrestador?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Estilos personalizados para animações */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Prestadores;
