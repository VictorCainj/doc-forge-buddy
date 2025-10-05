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
import { Calendar, Clock } from 'lucide-react';
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

const AgendamentoModal = memo(({
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notificação de Agendamento</DialogTitle>
          <DialogDescription>
            Preencha os dados para gerar a notificação de agendamento para o contrato: {contractTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tipo-vistoria">Tipo de Vistoria</Label>
            <Select
              value={tipoVistoria}
              onValueChange={(value: VistoriaType) => onTipoVistoriaChange(value)}
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

          <div className="space-y-2">
            <Label htmlFor="data-vistoria" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Data da Vistoria</span>
            </Label>
            <Input
              id="data-vistoria"
              type="date"
              value={dataVistoria}
              onChange={(e) => onDataVistoriaChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora-vistoria" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
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

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onGenerate}>
            Gerar Notificação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AgendamentoModal.displayName = 'AgendamentoModal';

export default AgendamentoModal;
