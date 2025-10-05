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
      <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-xl border-2 border-blue-200">
        <DialogHeader className="pb-4 border-b border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Dados de Contato do Locatário
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-gray-600">
            Complete as informações de contato para gerar o documento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-6">
          <div className="space-y-2">
            <Label htmlFor="celular" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <span>Celular do Locatário *</span>
            </Label>
            <Input
              id="celular"
              placeholder="(00) 00000-0000"
              value={celular}
              onChange={(e) => onCelularChange(e.target.value)}
              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <span>E-mail do Locatário *</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="locatario@email.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-blue-100">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 h-11 text-base font-medium border-2 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button 
            onClick={onSave}
            className="flex-1 h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            Salvar e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ContactModal.displayName = 'ContactModal';

export default ContactModal;
