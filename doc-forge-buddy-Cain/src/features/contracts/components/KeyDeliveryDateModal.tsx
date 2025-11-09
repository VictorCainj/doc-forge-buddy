import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface KeyDeliveryDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => Promise<void>;
  contractId: string;
}

export const KeyDeliveryDateModal: React.FC<KeyDeliveryDateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contractId,
}) => {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (!deliveryDate) {
      toast.error('Por favor, informe a data de entrega');
      return;
    }

    // Parse da data no formato YYYY-MM-DD para evitar problemas de timezone
    const [year, month, day] = deliveryDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);

    // Criar data de hoje meia-noite local
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validar se a data não é futura
    if (selectedDate > today) {
      toast.error('A data de entrega não pode ser futura');
      return;
    }

    // Validar se a data não é muito antiga (ex: há mais de 10 anos)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(today.getFullYear() - 10);
    tenYearsAgo.setHours(0, 0, 0, 0);

    if (selectedDate < tenYearsAgo) {
      toast.error('A data de entrega não pode ser anterior a 10 anos');
      return;
    }

    setIsSaving(true);
    try {
      // Criar data meia-noite no timezone local para salvar
      const dateToSave = new Date(year, month - 1, day, 12, 0, 0);
      await onConfirm(dateToSave);
      toast.success('Data de entrega registrada com sucesso');
      setDeliveryDate('');
      onClose();
    } catch {
      toast.error('Erro ao registrar data de entrega');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setDeliveryDate('');
      onClose();
    }
  };

  // Definir data máxima como hoje
  const maxDate = new Date().toISOString().split('T')[0];

  // Definir data mínima como 10 anos atrás
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 10);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Data de Entrega de Chaves</DialogTitle>
          <DialogDescription>
            Informe a data em que as chaves foram entregues para o contrato #
            {contractId}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="delivery-date">Data de Entrega</Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={minDateString}
              max={maxDate}
              className="w-full"
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSaving || !deliveryDate}>
            {isSaving ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
