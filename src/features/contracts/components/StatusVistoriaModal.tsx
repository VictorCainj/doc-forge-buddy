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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusVistoriaModalProps {
  open: boolean;
  contractTitle: string;
  statusVistoria: 'APROVADA' | 'REPROVADA';
  assinanteSelecionado: string;
  onStatusVistoriaChange: (status: 'APROVADA' | 'REPROVADA') => void;
  onAssinanteChange: (assinante: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
}

const StatusVistoriaModal = memo(({
  open,
  contractTitle,
  statusVistoria,
  assinanteSelecionado,
  onStatusVistoriaChange,
  onAssinanteChange,
  onGenerate,
  onCancel,
}: StatusVistoriaModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Status da Vistoria</DialogTitle>
          <DialogDescription>
            Informe o resultado da vistoria para o contrato: {contractTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status-vistoria">Status da Vistoria</Label>
            <Select
              value={statusVistoria}
              onValueChange={(value: 'APROVADA' | 'REPROVADA') => onStatusVistoriaChange(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APROVADA">
                  Aprovada
                </SelectItem>
                <SelectItem value="REPROVADA">
                  Reprovada
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assinante">Assinante</Label>
            <Select
              value={assinanteSelecionado}
              onValueChange={onAssinanteChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o assinante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Victor Cain Jorge">Victor Cain Jorge</SelectItem>
                <SelectItem value="Fabiana Salotti Martins">Fabiana Salotti Martins</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onGenerate} disabled={!assinanteSelecionado}>
            Gerar Mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

StatusVistoriaModal.displayName = 'StatusVistoriaModal';

export default StatusVistoriaModal;
