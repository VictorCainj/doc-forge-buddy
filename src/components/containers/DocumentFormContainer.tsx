/**
 * Container para DocumentForm - Lógica de Negócio e Persistência
 * Separa lógica de apresentação seguindo padrão Container/Presentational
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentFormPresentation } from '../presentation/DocumentFormPresentation';
import { useFormWithPreview } from '@/hooks/useFormWithPreview';
import { useDocumentPersistence } from '@/hooks/useDocumentPersistence';
import { useStandardToast } from '@/utils/toastHelpers';
import { FormField } from '@/types/form';

export interface DocumentFormContainerProps {
  title: string;
  description: string;
  template: string;
  fields?: FormField[];
  initialData?: Record<string, string>;
  contractData?: Record<string, string>;
  isEditing?: boolean;
  termId?: string;
  hideSaveButton?: boolean;
  onGenerate?: (data: Record<string, string>) => void;
  onFormDataChange?: (data: Record<string, string>) => void;
}

export const DocumentFormContainer: React.FC<DocumentFormContainerProps> = ({
  title,
  description,
  template,
  fields = [],
  initialData = {},
  contractData = {},
  isEditing = false,
  termId,
  hideSaveButton = false,
  onGenerate,
  onFormDataChange,
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useStandardToast();

  // ✅ Hook para lógica de formulário
  const formLogic = useFormWithPreview({
    initialData,
    contractData,
    template,
    fields,
    onFormDataChange,
    autoPreview: true,
  });

  // ✅ Hook para lógica de persistência
  const persistenceLogic = useDocumentPersistence({
    isEditing,
    termId,
    documentType: 'termo-inquilino',
  });

  // ✅ Lógica de negócio - Salvar documento
  const handleSave = async () => {
    if (!formLogic.validateForm()) {
      showError('validation', { 
        description: 'Preencha todos os campos obrigatórios' 
      });
      return;
    }

    try {
      const documentData = {
        title: `${title} - ${formLogic.formData.nomeLocatario || 'Sem nome'}`,
        content: formLogic.previewContent,
        formData: formLogic.formData,
      };

      if (isEditing && termId) {
        await persistenceLogic.updateDocument(termId, documentData);
        showSuccess('updated', { 
          description: 'Documento atualizado com sucesso' 
        });
      } else {
        await persistenceLogic.saveDocument(documentData);
        showSuccess('saved', { 
          description: 'Documento salvo com sucesso' 
        });
      }
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      showError('save');
    }
  };

  // ✅ Lógica de negócio - Gerar documento
  const handleGenerate = async () => {
    if (!formLogic.validateForm()) {
      showError('validation', { 
        description: 'Preencha todos os campos obrigatórios' 
      });
      return;
    }

    try {
      if (onGenerate) {
        await onGenerate(formLogic.formData);
      } else {
        // Navegação padrão
        navigate('/gerar-documento', {
          state: {
            title,
            template: formLogic.previewContent,
            formData: formLogic.formData,
            documentType: title,
          },
        });
      }
      
      showSuccess('generated', { 
        description: 'Documento gerado com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      showError('generate');
    }
  };

  // ✅ Lógica de negócio - Imprimir
  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  margin: 20px;
                  font-size: ${formLogic.fontSize}px;
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              ${formLogic.previewContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      showError('print');
    }
  };

  // ✅ Estados derivados para apresentação
  const presentationProps = {
    // Dados do formulário
    title,
    description,
    fields,
    formData: formLogic.formData,
    errors: formLogic.errors,
    isValid: formLogic.isValid,
    isDirty: formLogic.isDirty,

    // Estados do preview
    showPreview: formLogic.showPreview,
    previewContent: formLogic.previewContent,
    fontSize: formLogic.fontSize,

    // Estados de loading
    isGenerating: formLogic.isGenerating,
    isSaving: persistenceLogic.saving,

    // Configurações
    hideSaveButton,
    isEditing,

    // Callbacks
    onFieldChange: formLogic.updateField,
    onFieldBlur: formLogic.setFieldTouched,
    onTogglePreview: formLogic.togglePreview,
    onFontSizeChange: formLogic.updateFontSize,
    onSave: handleSave,
    onGenerate: handleGenerate,
    onPrint: handlePrint,
    onReset: formLogic.resetForm,

    // Utilitários
    getFieldError: formLogic.getFieldError,
    isFieldTouched: formLogic.isFieldTouched,
  };

  return <DocumentFormPresentation {...presentationProps} />;
};
