import React, { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Mail } from 'lucide-react';

interface ContactModalProps {
  open: boolean;
  celular: string;
  email: string;
  onCelularChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ContactModal = memo(({
  open,
  celular,
  email,
  onCelularChange,
  onEmailChange,
  onSave,
  onCancel,
}: ContactModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dados de Contato do Locatário</DialogTitle>
          <DialogDescription>
            Os dados de contato do locatário não foram preenchidos no contrato.
            Por favor, preencha-os abaixo para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="celular" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Celular do Locatário *</span>
            </Label>
            <Input
              id="celular"
              placeholder="(00) 00000-0000"
              value={celular}
              onChange={(e) => onCelularChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>E-mail do Locatário *</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="locatario@email.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            Salvar e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ContactModal.displayName = 'ContactModal';

export default ContactModal;
