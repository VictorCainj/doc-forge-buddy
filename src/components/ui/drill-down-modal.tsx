import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Download,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrillDownData {
  id: string;
  title: string;
  value: number;
  metadata: Record<string, unknown>;
  items: Array<{
    id: string;
    name: string;
    value: number;
    status: string;
    date: string;
    location?: string;
    type?: string;
    metadata: Record<string, unknown>;
  }>;
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DrillDownData | null;
  onItemClick?: (item: DrillDownData['items'][0]) => void;
  onExport?: (data: DrillDownData) => void;
}

export const DrillDownModal = ({
  isOpen,
  onClose,
  data,
  onItemClick,
  onExport,
}: DrillDownModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value');

  if (!data) return null;

  const filteredItems = data.items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.value - a.value;
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expirando':
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800';
      case 'expirado':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'contrato':
        return FileText;
      case 'imóvel':
        return MapPin;
      case 'cliente':
        return User;
      default:
        return FileText;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {data.title} - Detalhes
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport(data)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.value.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-blue-600">Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      data.items.filter((item) => item.status === 'ativo')
                        .length
                    }
                  </div>
                  <div className="text-sm text-green-600">Ativos</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {
                      data.items.filter((item) => item.status === 'expirando')
                        .length
                    }
                  </div>
                  <div className="text-sm text-yellow-600">Expirando</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {
                      data.items.filter((item) => item.status === 'expirado')
                        .length
                    }
                  </div>
                  <div className="text-sm text-red-600">Expirados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, localização..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Todos os status</option>
                    <option value="ativo">Ativo</option>
                    <option value="expirando">Expirando</option>
                    <option value="expirado">Expirado</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="value">Ordenar por valor</option>
                    <option value="date">Ordenar por data</option>
                    <option value="name">Ordenar por nome</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de itens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Itens ({filteredItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const Icon = getItemIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onItemClick?.(item)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {item.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {item.location}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(item.date).toLocaleDateString('pt-BR')}
                            </div>
                            {(item.metadata.revenue as number) && (
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                R${' '}
                                {(
                                  item.metadata.revenue as number
                                ).toLocaleString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {item.value.toLocaleString('pt-BR')}
                          </div>
                          {(item.metadata.daysUntilExpiry as number) && (
                            <div className="text-sm text-gray-500">
                              {item.metadata.daysUntilExpiry as number} dias
                            </div>
                          )}
                        </div>
                        <Badge
                          className={cn(
                            'px-2 py-1',
                            getStatusColor(item.status)
                          )}
                        >
                          {item.status}
                        </Badge>
                        {(item.metadata.urgent as boolean) && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum item encontrado com os filtros aplicados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
