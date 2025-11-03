import { useState, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Copy,
  Check,
  X,
  Filter,
  Users,
} from '@/utils/iconMapper';
import {
  usePrestadores,
  CreatePrestadorData,
  Prestador,
} from '@/hooks/usePrestadores';
import { memo } from 'react';
import { log } from '@/utils/logger';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Componente de formulário para criar/editar prestadores
 * Memoizado para evitar re-renders desnecessários
 */
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
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Nome - Campo obrigatório */}
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-sm font-medium text-neutral-700">
          Nome do Prestador <span className="text-error-600">*</span>
        </Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Digite o nome completo"
          required
          className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg h-11"
        />
      </div>

      {/* CNPJ e Telefone - Grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg h-11"
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
            className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg h-11"
          />
        </div>
      </div>

      {/* E-mail */}
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
          className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg h-11"
        />
      </div>

      {/* Endereço */}
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
          className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg h-11"
        />
      </div>

      {/* Especialidade */}
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
          placeholder="Ex: Pintura, Elétrica, Hidráulica, Alvenaria"
          className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg h-11"
        />
      </div>

      {/* Observações */}
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
          placeholder="Informações adicionais sobre o prestador"
          rows={3}
          className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg resize-none"
        />
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-2 rounded-lg border-neutral-300 hover:bg-neutral-50 transition-all"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50"
        >
          {saving ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar Prestador'}
        </Button>
      </div>
    </form>
  )
);

PrestadorForm.displayName = 'PrestadorForm';

/**
 * Componente principal da página de Prestadores
 * Gerencia a listagem, busca, filtros e CRUD de prestadores
 */
const Prestadores = () => {
  const {
    prestadores,
    loading,
    saving,
    createPrestador,
    updatePrestador,
    deletePrestador,
  } = usePrestadores();

  // Estados para controle de diálogos
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState<Prestador | null>(
    null
  );

  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [especialidadeFilter, setEspecialidadeFilter] = useState<string>('all');
  const [copiedPrestadorId, setCopiedPrestadorId] = useState<string | null>(
    null
  );

  // Estado do formulário
  const [formData, setFormData] = useState<CreatePrestadorData>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    especialidade: '',
    observacoes: '',
  });

  /**
   * Extrai todas as especialidades únicas dos prestadores cadastrados
   * para usar no filtro
   */
  const especialidadesDisponiveis = useMemo(() => {
    const especialidades = prestadores
      .map((p) => p.especialidade)
      .filter((e): e is string => Boolean(e))
      .filter((e, index, self) => self.indexOf(e) === index)
      .sort();
    return especialidades;
  }, [prestadores]);

  /**
   * Filtra prestadores baseado na busca por texto e especialidade
   * Busca em nome, email e especialidade
   */
  const filteredPrestadores = useMemo(() => {
    let filtered = prestadores;

    // Filtro por especialidade
    if (especialidadeFilter !== 'all') {
      filtered = filtered.filter(
        (p) => p.especialidade === especialidadeFilter
      );
    }

    // Filtro por busca textual
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nome.toLowerCase().includes(term) ||
          p.especialidade?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.telefone?.includes(term)
      );
    }

    return filtered;
  }, [prestadores, searchTerm, especialidadeFilter]);

  /**
   * Copia informações do prestador para a área de transferência
   */
  const handleCopyPrestadorInfo = async (prestador: Prestador) => {
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

  /**
   * Limpa todos os filtros aplicados
   */
  const handleClearFilters = () => {
    setSearchTerm('');
    setEspecialidadeFilter('all');
  };

  /**
   * Verifica se há filtros ativos
   */
  const hasActiveFilters = searchTerm.trim() || especialidadeFilter !== 'all';

  /**
   * Handler para criação de novo prestador
   */
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

  /**
   * Handler para edição de prestador existente
   */
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

  /**
   * Abre o diálogo de edição com os dados do prestador selecionado
   */
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

  /**
   * Confirma e executa a exclusão do prestador
   */
  const handleDeleteConfirm = async () => {
    if (!selectedPrestador) return;

    const success = await deletePrestador(selectedPrestador.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedPrestador(null);
    }
  };

  // Estado de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-neutral-600 font-medium">
            Carregando prestadores...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Cabeçalho da Página */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            {/* Título e Descrição */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  Prestadores de Serviço
                </h1>
                <p className="text-sm text-neutral-600 mt-0.5">
                  Gerencie seus prestadores de forma eficiente
                </p>
              </div>
            </div>

            {/* Botão de Adicionar */}
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md transition-all">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo Prestador</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4 border-b border-neutral-200">
                  <DialogTitle className="text-xl font-semibold text-neutral-900">
                    Adicionar Novo Prestador
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

          {/* Barra de Pesquisa e Filtros */}
          {prestadores.length > 0 && (
            <Card className="border-neutral-200 elevation-1">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Campo de Busca */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <Input
                      type="text"
                      placeholder="Buscar por nome, especialidade, email ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 h-11 border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg bg-white"
                    />
                  </div>

                  {/* Filtro por Especialidade */}
                  <Select
                    value={especialidadeFilter}
                    onValueChange={setEspecialidadeFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[200px] h-11 border-neutral-300 focus:border-primary-500">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-neutral-500" />
                        <SelectValue placeholder="Todas especialidades" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas especialidades</SelectItem>
                      {especialidadesDisponiveis.map((esp) => (
                        <SelectItem key={esp} value={esp}>
                          {esp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Botão Limpar Filtros */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="h-11 px-4 border-neutral-300 hover:bg-neutral-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Limpar</span>
                    </Button>
                  )}
                </div>

                {/* Estatísticas de Resultados */}
                {hasActiveFilters && (
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <p className="text-sm text-neutral-600">
                      Mostrando{' '}
                      <span className="font-semibold text-neutral-900">
                        {filteredPrestadores.length}
                      </span>{' '}
                      de{' '}
                      <span className="font-semibold text-neutral-900">
                        {prestadores.length}
                      </span>{' '}
                      prestador{prestadores.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Conteúdo Principal */}
        {prestadores.length === 0 ? (
          // Estado Vazio
          <Card className="border-neutral-200 elevation-1">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Nenhum prestador cadastrado
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Comece criando seu primeiro prestador de serviço para organizar
                seus fornecedores e facilitar a gestão
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="h-5 w-5" />
                Criar Primeiro Prestador
              </Button>
            </CardContent>
          </Card>
        ) : filteredPrestadores.length === 0 ? (
          // Nenhum resultado encontrado
          <Card className="border-neutral-200 elevation-1">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                <Search className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-neutral-600 mb-6">
                Tente ajustar os filtros ou termos de busca
              </p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg border-neutral-300 hover:bg-neutral-50"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Grid de Cards de Prestadores
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrestadores.map((prestador) => (
              <Card
                key={prestador.id}
                className="group border-neutral-200 hover:border-primary-300 hover:elevation-2 transition-all duration-200"
              >
                <CardContent className="p-5">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors truncate">
                        {prestador.nome}
                      </h3>
                      {prestador.especialidade && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary-50 rounded-md mt-1">
                          <Briefcase className="h-3.5 w-3.5 text-primary-600" />
                          <span className="text-xs font-medium text-primary-700">
                            {prestador.especialidade}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Menu de Ações */}
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleCopyPrestadorInfo(prestador)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-success-600 hover:bg-success-50 transition-all"
                        title="Copiar informações"
                        aria-label="Copiar informações"
                      >
                        {copiedPrestadorId === prestador.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(prestador)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        title="Editar prestador"
                        aria-label="Editar prestador"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrestador(prestador);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-all"
                        title="Excluir prestador"
                        aria-label="Excluir prestador"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Informações do Prestador */}
                  <div className="space-y-2.5">
                    {prestador.cnpj && (
                      <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                        <div className="flex-shrink-0 w-7 h-7 bg-neutral-50 rounded-md flex items-center justify-center">
                          <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                        </div>
                        <span className="truncate">{prestador.cnpj}</span>
                      </div>
                    )}
                    {prestador.telefone && (
                      <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                        <div className="flex-shrink-0 w-7 h-7 bg-neutral-50 rounded-md flex items-center justify-center">
                          <Phone className="h-3.5 w-3.5 text-neutral-400" />
                        </div>
                        <a
                          href={`tel:${prestador.telefone}`}
                          className="hover:text-primary-600 transition-colors"
                        >
                          {prestador.telefone}
                        </a>
                      </div>
                    )}
                    {prestador.email && (
                      <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                        <div className="flex-shrink-0 w-7 h-7 bg-neutral-50 rounded-md flex items-center justify-center">
                          <Mail className="h-3.5 w-3.5 text-neutral-400" />
                        </div>
                        <a
                          href={`mailto:${prestador.email}`}
                          className="truncate hover:text-primary-600 transition-colors"
                        >
                          {prestador.email}
                        </a>
                      </div>
                    )}
                    {prestador.endereco && (
                      <div className="flex items-start gap-2.5 text-sm text-neutral-600">
                        <div className="flex-shrink-0 w-7 h-7 bg-neutral-50 rounded-md flex items-center justify-center mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        </div>
                        <span className="line-clamp-2">{prestador.endereco}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <AlertDialogCancel className="px-4 py-2 rounded-lg border-neutral-300 hover:bg-neutral-50 transition-all">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-lg bg-error-600 hover:bg-error-700 text-white shadow-sm hover:shadow-md transition-all"
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
