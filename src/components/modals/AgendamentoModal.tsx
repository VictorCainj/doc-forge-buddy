/**
 * Modal para agendamento de vistoria
 * Extraído do componente Contratos para melhor organização
 */

import React from 'react';
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
import { Contract, VistoriaType } from '@/types/contract';

export interface AgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  dataVistoria: string;
  horaVistoria: string;
  tipoVistoria: VistoriaType;
  onDataVistoriaChange: (data: string) => void;
  onHoraVistoriaChange: (hora: string) => void;
  onTipoVistoriaChange: (tipo: VistoriaType) => void;
  onGenerate: () => void;
}

export const AgendamentoModal: React.FC<AgendamentoModalProps> = ({
  isOpen,
  onClose,
  contract,
  dataVistoria,
  horaVistoria,
  tipoVistoria,
  onDataVistoriaChange,
  onHoraVistoriaChange,
  onTipoVistoriaChange,
  onGenerate,
}) => {
  const handleGenerate = () => {
    onGenerate();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Notificação de Agendamento</DialogTitle>
          <DialogDescription>
            Preencha a data e hora da vistoria de saída para gerar a notificação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipoVistoria" className="text-right">
              Tipo de Vistoria
            </Label>
            <Select 
              value={tipoVistoria} 
              onValueChange={(value) => onTipoVistoriaChange(value as VistoriaType)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo de vistoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="final">Vistoria Final</SelectItem>
                <SelectItem value="revistoria">Revistoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataVistoria" className="text-right">
              Data
            </Label>
            <Input
              id="dataVistoria"
              type="date"
              value={dataVistoria}
              onChange={(e) => onDataVistoriaChange(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="horaVistoria" className="text-right">
              Hora
            </Label>
            <Input
              id="horaVistoria"
              type="time"
              value={horaVistoria}
              onChange={(e) => onHoraVistoriaChange(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={!dataVistoria || !horaVistoria}
          >
            Gerar Notificação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
