import { useEffect } from 'react';
import { isMultipleLocatarios } from '../utils/templateProcessor';

interface UseDocumentFormStateProps {
  formData: Record<string, string>;
  contractData?: Record<string, string>;
  updateField: (field: string, value: string) => void;
}

/**
 * Hook para gerenciar estado e auto-preenchimento do formulário de documentos
 */
export const useDocumentFormState = ({
  formData,
  contractData = {},
  updateField,
}: UseDocumentFormStateProps) => {
  // Efeito para preencher automaticamente o campo de gênero quando há múltiplos locatários
  useEffect(() => {
    const nomeLocatario = formData.nomeLocatario || '';
    if (isMultipleLocatarios(nomeLocatario) && !formData.generoLocatario) {
      updateField('generoLocatario', 'neutro');
    }
  }, [formData.nomeLocatario, formData.generoLocatario, updateField]);

  // Efeito para preencher automaticamente o campo de gênero quando há múltiplos proprietários
  useEffect(() => {
    const nomeProprietario = formData.nomeProprietario || '';
    if (
      isMultipleLocatarios(nomeProprietario) &&
      !formData.generoProprietario
    ) {
      updateField('generoProprietario', 'neutro');
    }
  }, [formData.nomeProprietario, formData.generoProprietario, updateField]);

  // Auto-preencher campos quando for termo do locador
  useEffect(() => {
    if (formData.tipoTermo === 'locador' && contractData?.nomeProprietario) {
      if (!formData.tipoQuemRetira) {
        updateField('tipoQuemRetira', 'proprietario');
      }
      if (!formData.nomeQuemRetira) {
        updateField('nomeQuemRetira', contractData.nomeProprietario);
      }
    }
  }, [
    formData.tipoTermo,
    formData.tipoQuemRetira,
    formData.nomeQuemRetira,
    contractData?.nomeProprietario,
    updateField,
  ]);

  // Auto-preencher nome quando selecionar "incluir nome completo"
  useEffect(() => {
    const baseName =
      formData.tipoTermo === 'locador'
        ? contractData?.nomesResumidosLocadores || contractData?.nomeProprietario
        : contractData?.nomeLocatario;

    const fallbackName =
      formData.tipoTermo === 'locador'
        ? contractData?.nomeProprietario
        : contractData?.nomeLocatario;

    if (!formData.incluirNomeCompleto) {
      if (!formData.nomeQuemRetira && (baseName || fallbackName)) {
        updateField('nomeQuemRetira', baseName || fallbackName || '');
      }
      return;
    }

    if (formData.incluirNomeCompleto === 'custom') {
      if (
        formData.nomeQuemRetira === baseName ||
        formData.nomeQuemRetira === fallbackName ||
        formData.nomeQuemRetira === 'custom'
      ) {
        updateField('nomeQuemRetira', '');
      }
      return;
    }

    if (
      (formData.incluirNomeCompleto === 'sim' ||
        formData.incluirNomeCompleto === 'todos') &&
      (baseName || fallbackName) &&
      formData.nomeQuemRetira !== (baseName || fallbackName)
    ) {
      updateField('nomeQuemRetira', baseName || fallbackName || '');
      return;
    }

    if (
      formData.incluirNomeCompleto === 'nao' &&
      !formData.nomeQuemRetira &&
      (baseName || fallbackName)
    ) {
      updateField('nomeQuemRetira', baseName || fallbackName || '');
      return;
    }

    if (
      formData.incluirNomeCompleto !== 'nao' &&
      formData.incluirNomeCompleto !== 'sim' &&
      formData.incluirNomeCompleto !== 'todos' &&
      formData.incluirNomeCompleto !== 'custom' &&
      formData.nomeQuemRetira !== formData.incluirNomeCompleto
    ) {
      updateField('nomeQuemRetira', formData.incluirNomeCompleto);
    }
  }, [
    formData.incluirNomeCompleto,
    formData.nomeQuemRetira,
    formData.tipoTermo,
    contractData?.nomeProprietario,
    contractData?.nomesResumidosLocadores,
    contractData?.nomeLocatario,
    updateField,
  ]);
};
