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

const ContactModal = memo(
  ({
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
        <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-xl border-2 border-primary-200">
          <DialogHeader className="pb-3 border-b border-primary-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Dados de Contato do Locatário
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-neutral-600">
              Complete as informações de contato para gerar o documento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="celular"
                className="flex items-center gap-2 text-sm font-semibold text-neutral-700"
              >
                <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Phone className="h-3.5 w-3.5 text-primary-600" />
                </div>
                <span>Celular do Locatário *</span>
              </Label>
              <Input
                id="celular"
                placeholder="(00) 00000-0000"
                value={celular}
                onChange={(e) => onCelularChange(e.target.value)}
                className="h-10 text-sm border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-semibold text-neutral-700"
              >
                <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Mail className="h-3.5 w-3.5 text-primary-600" />
                </div>
                <span>E-mail do Locatário *</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="locatario@email.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="h-10 text-sm border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-primary-100">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-9 text-sm font-medium border hover:bg-neutral-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              className="flex-1 h-9 text-sm font-medium bg-gradient-primary shadow-lg"
            >
              Salvar e Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

ContactModal.displayName = 'ContactModal';

export default ContactModal;
