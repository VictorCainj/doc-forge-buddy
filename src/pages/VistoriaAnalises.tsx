import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Archive,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useVistoriaAnalises } from '@/hooks/useVistoriaAnalises';
import { VistoriaAnaliseWithImages } from '@/types/vistoria';
import { formatDateBrazilian } from '@/utils/dateFormatter';
import VistoriaMigrationBanner from '@/components/VistoriaMigrationBanner';
import { ActionButton } from '@/components/ui/action-button';

const VistoriaAnalises = () => {
  const { toast: _toast } = useToast();
  const navigate = useNavigate();
  const { analises, loading, deleteAnalise, fetchAnalises } =
    useVistoriaAnalises();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    analise: VistoriaAnaliseWithImages | null;
  }>({ open: false, analise: null });

  // Debounce do termo de busca para evitar filtros excessivos
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrar análises baseado nos critérios
  const filteredAnalises = analises.filter((analise) => {
    const matchesSearch =
      debouncedSearchTerm === '' ||
      analise.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      analise.dados_vistoria.locatario
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      analise.dados_vistoria.endereco
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'with_images' && analise.images.length > 0) ||
      (statusFilter === 'without_images' && analise.images.length === 0);

    return matchesSearch && matchesStatus;
  });

  // Carregar análises quando o componente montar
  useEffect(() => {
    fetchAnalises();
  }, [fetchAnalises]);

  // Função para deletar análise
  const handleDeleteAnalise = async () => {
    if (!deleteDialog.analise) return;

    const success = await deleteAnalise(deleteDialog.analise.id || '');

    if (success) {
      setDeleteDialog({ open: false, analise: null });
    }
  };

  // Função para abrir análise para edição
  const handleEditAnalise = (analise: VistoriaAnaliseWithImages) => {
    // Navegar para a página de análise com dados pré-carregados
    navigate('/analise-vistoria', {
      state: {
        editMode: true,
        analiseData: analise,
      },
    });
  };


  // Função para contar apontamentos
  const getApontamentosCount = (analise: VistoriaAnaliseWithImages) => {
    return Array.isArray(analise.apontamentos)
      ? analise.apontamentos.length
      : 0;
  };

  // Função para contar imagens
  const getImagesCount = (analise: VistoriaAnaliseWithImages) => {
    return analise.images.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando análises...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/15 rounded-lg -rotate-12"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 border border-white/10 rounded-lg rotate-45"></div>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Archive className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Análises de Vistoria
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Gerencie suas análises de vistoria salvas</span>
              </p>
            </div>
          </div>
          <ActionButton
            icon={Plus}
            label="Nova Análise"
            variant="primary"
            size="md"
            onClick={() => navigate('/analise-vistoria')}
          />
        </div>

        {/* Banner de Migração */}
        <VistoriaMigrationBanner />

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total de Análises</span>
              </div>
              <p className="text-2xl font-bold mt-2">{analises.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Com Imagens</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {analises.filter((a) => a.images.length > 0).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Sem Imagens</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {analises.filter((a) => a.images.length === 0).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Este Mês</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {
                  analises.filter((a) => {
                    const createdAt = new Date(a.created_at);
                    const now = new Date();
                    return (
                      createdAt.getMonth() === now.getMonth() &&
                      createdAt.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, locatário ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="with_images">Com imagens</SelectItem>
                    <SelectItem value="without_images">Sem imagens</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Análises */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Análises de Vistoria ({filteredAnalises.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAnalises.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Nenhuma análise encontrada'
                    : 'Nenhuma análise de vistoria'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Crie sua primeira análise de vistoria para começar.'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <ActionButton
                    icon={Plus}
                    label="Nova Análise"
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/analise-vistoria')}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnalises.map((analise) => (
                  <div
                    key={analise.id}
                    className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg text-foreground">
                            {analise.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {getApontamentosCount(analise)} apontamento
                            {getApontamentosCount(analise) !== 1 ? 's' : ''}
                          </Badge>
                          {getImagesCount(analise) > 0 && (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-600"
                            >
                              {getImagesCount(analise)} imagem
                              {getImagesCount(analise) !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{analise.dados_vistoria.locatario}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                              {analise.dados_vistoria.endereco}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDateBrazilian(analise.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>
                            Vistoria em: {analise.dados_vistoria.dataVistoria}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <ActionButton
                          icon={Edit}
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() => handleEditAnalise(analise)}
                          title="Editar análise"
                        />
                        <ActionButton
                          icon={Trash2}
                          variant="danger"
                          size="sm"
                          iconOnly
                          onClick={() => setDeleteDialog({ open: true, analise })}
                          title="Deletar análise"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, analise: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir a análise "
                {deleteDialog.analise?.title}"? Esta ação não pode ser desfeita
                e todos os dados e imagens serão removidos permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, analise: null })}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteAnalise}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VistoriaAnalises;
