import React, { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock } from '@/utils/iconMapper';
import { VistoriaType } from '@/types/contract';

interface AgendamentoModalProps {
  open: boolean;
  contractTitle: string;
  dataVistoria: string;
  horaVistoria: string;
  tipoVistoria: VistoriaType;
  onDataVistoriaChange: (data: string) => void;
  onHoraVistoriaChange: (hora: string) => void;
  onTipoVistoriaChange: (tipo: VistoriaType) => void;
  onGenerate: () => void;
  onCancel: () => void;
}

const AgendamentoModal = memo(
  ({
    open,
    contractTitle,
    dataVistoria,
    horaVistoria,
    tipoVistoria,
    onDataVistoriaChange,
    onHoraVistoriaChange,
    onTipoVistoriaChange,
    onGenerate,
    onCancel,
  }: AgendamentoModalProps) => {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-3">
            <DialogTitle className="text-lg">
              Notificação de Agendamento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados para gerar a notificação de agendamento para o
              contrato: {contractTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="tipo-vistoria" className="text-xs">
                Tipo de Vistoria
              </Label>
              <Select
                value={tipoVistoria}
                onValueChange={(value: VistoriaType) =>
                  onTipoVistoriaChange(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="final">Vistoria Final</SelectItem>
                  <SelectItem value="revistoria">Revistoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="data-vistoria"
                className="flex items-center space-x-2 text-xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Data da Vistoria</span>
              </Label>
              <Input
                id="data-vistoria"
                type="date"
                value={dataVistoria}
                onChange={(e) => onDataVistoriaChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="hora-vistoria"
                className="flex items-center space-x-2 text-xs"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Hora da Vistoria</span>
              </Label>
              <Input
                id="hora-vistoria"
                type="time"
                value={horaVistoria}
                onChange={(e) => onHoraVistoriaChange(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="p-3">
            <Button variant="outline" onClick={onCancel} className="text-sm">
              Cancelar
            </Button>
            <Button onClick={onGenerate} className="text-sm">
              Gerar Notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

AgendamentoModal.displayName = 'AgendamentoModal';

export default AgendamentoModal;
