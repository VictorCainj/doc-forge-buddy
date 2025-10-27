import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useEditarMotivo } from '@/hooks/useEditarMotivo';
import { useGerarMotivoIA } from '@/hooks/useGerarMotivoIA';
import { ContratoDesocupacao } from '@/types/dashboardDesocupacao';
import { Edit, Sparkles, Save, X } from '@/utils/iconMapper';

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
  const [isGenerating, setIsGenerating] = useState(false);

  const { editarMotivo, isLoading } = useEditarMotivo();
  const { gerarMotivoIA } = useGerarMotivoIA();

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

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const motivoGerado = await gerarMotivoIA({
        contrato,
        motivosExistentes: [], // TODO: Buscar motivos existentes para análise
      });

      if (motivoGerado) {
        setMotivo(motivoGerado);
        toast.success('Motivo da desocupação resumido com IA!');
      }
    } catch {
      toast.error('Erro ao resumir motivo com IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setMotivo(contrato.motivoDesocupacao || '');
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'Resumindo...' : 'Resumir com IA'}
              </Button>
            </div>

            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Digite o motivo da desocupação ou use a IA para resumir o motivo existente..."
              className="min-h-[120px] resize-none"
              maxLength={500}
            />

            <div className="flex justify-between items-center text-sm text-neutral-500">
              <span>Máximo 500 caracteres</span>
              <span>{motivo.length}/500</span>
            </div>
          </div>

          {/* Dicas para IA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Como funciona a IA
            </h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • A IA analisa o motivo existente e o resume de forma concisa
              </li>
              <li>• Mantém o contexto original sem inventar informações</li>
              <li>
                • Aplica palavras-chave padronizadas para facilitar agrupamento
              </li>
              <li>• Preserva informações importantes do motivo original</li>
            </ul>
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
              disabled={isLoading || !motivo.trim()}
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
