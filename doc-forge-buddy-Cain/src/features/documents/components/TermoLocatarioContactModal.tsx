import React from 'react';
import { ContactModal } from '@/features/documents/components';

interface ContactData {
  celularLocatario: string;
  emailLocatario: string;
}

interface TermoLocatarioContactModalProps {
  open: boolean;
  contactData: ContactData;
  pendingFormData: Record<string, string> | null;
  onCelularChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: (callback: () => void) => void;
  onCancel: () => void;
}

export const TermoLocatarioContactModal: React.FC<TermoLocatarioContactModalProps> = ({
  open,
  contactData,
  pendingFormData,
  onCelularChange,
  onEmailChange,
  onSave,
  onCancel,
}) => {
  return (
    <ContactModal
      open={open}
      celular={contactData.celularLocatario}
      email={contactData.emailLocatario}
      onCelularChange={onCelularChange}
      onEmailChange={onEmailChange}
      onSave={() => {
        onSave(() => {
          if (pendingFormData) {
            // Força reexecução do wizard com os dados atualizados
            window.location.reload();
          }
        });
      }}
      onCancel={onCancel}
    />
  );
};
