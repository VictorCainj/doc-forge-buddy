import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useEditarMotivo } from '@/hooks/useEditarMotivo';
import { ContratoDesocupacao } from '@/types/dashboardDesocupacao';
import { useEvictionReasons } from '@/hooks/useEvictionReasons';
import { Edit, Save, X, Search } from '@/utils/iconMapper';

interface ModalEditarMotivoProps {
  contrato: ContratoDesocupacao;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ModalEditarMotivo: React.FC<ModalEditarMotivoProps> = ({
  contrato,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [motivo, setMotivo] = useState(contrato.motivoDesocupacao || '');
  const [searchTerm, setSearchTerm] = useState('');

  const { editarMotivo, isLoading } = useEditarMotivo();
  const { reasons, isLoading: isLoadingReasons } = useEvictionReasons();

  // Filtrar motivos baseado no termo de busca
  const filteredReasons = useMemo(() => {
    if (!searchTerm.trim()) return reasons;

    return reasons.filter((reason) =>
      reason.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reasons, searchTerm]);

  const handleSave = async () => {
    try {
      await editarMotivo(contrato.id, motivo);
      toast.success('Motivo da desocupação atualizado com sucesso!');
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Erro ao atualizar motivo da desocupação.');
    }
  };

  const handleClose = () => {
    setMotivo(contrato.motivoDesocupacao || '');
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Motivo da Desocupação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Contrato */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h4 className="font-medium text-neutral-900 mb-2">
              Informações do Contrato
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Nº Contrato:</span>
                <Badge variant="outline" className="ml-2">
                  {contrato.numeroContrato}
                </Badge>
              </div>
              <div>
                <span className="text-neutral-600">Locador:</span>
                <span className="ml-2 font-medium">{contrato.nomeLocador}</span>
              </div>
              <div>
                <span className="text-neutral-600">Locatário:</span>
                <span className="ml-2 font-medium">
                  {contrato.nomeLocatario}
                </span>
              </div>
              <div>
                <span className="text-neutral-600">Data Início:</span>
                <span className="ml-2 font-medium">
                  {contrato.dataInicioRescisao}
                </span>
              </div>
            </div>
          </div>

          {/* Editor de Motivo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="motivo" className="text-base font-medium">
                Motivo da Desocupação
              </Label>
            </div>

            {/* Barra de Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar motivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchTerm && filteredReasons.length === 0 && (
              <div className="text-sm text-neutral-500 text-center py-2">
                Nenhum motivo encontrado com &quot;{searchTerm}&quot;
              </div>
            )}

            <Select
              value={motivo}
              onValueChange={setMotivo}
              disabled={isLoadingReasons}
            >
              <SelectTrigger id="motivo" className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingReasons
                      ? 'Carregando motivos...'
                      : 'Selecione o motivo da desocupação'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredReasons.length > 0 ? (
                  filteredReasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.description}>
                      {reason.description}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-neutral-500 text-center">
                    Nenhum motivo disponível
                  </div>
                )}
              </SelectContent>
            </Select>

            {/* Contador de resultados */}
            {searchTerm && filteredReasons.length > 0 && (
              <div className="text-xs text-neutral-500">
                {filteredReasons.length} motivo(s) encontrado(s)
              </div>
            )}
          </div>


          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              disabled={isLoading || !motivo}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
