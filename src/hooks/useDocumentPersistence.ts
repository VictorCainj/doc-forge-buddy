/**
 * Hook para lógica de persistência de documentos
 * Separa lógica de dados da apresentação
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDateBrazilian } from '@/utils/dateFormatter';

export interface DocumentData {
  title: string;
  content: string;
  formData: Record<string, string>;
}

export interface UseDocumentPersistenceOptions {
  isEditing?: boolean;
  termId?: string;
  documentType?: string;
}

export interface UseDocumentPersistenceReturn {
  saving: boolean;
  error: string | null;
  saveDocument: (data: DocumentData) => Promise<void>;
  updateDocument: (id: string, data: DocumentData) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDocumentPersistence = (
  options: UseDocumentPersistenceOptions = {}
): UseDocumentPersistenceReturn => {
  const { documentType = 'termo-inquilino' } = options;
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Salvar novo documento
  const saveDocument = useCallback(async (data: DocumentData) => {
    setSaving(true);
    setError(null);

    try {
      const documentTitle = `${data.title} - ${formatDateBrazilian(new Date())}`;
      
      const { error: supabaseError } = await supabase
        .from('saved_terms')
        .insert({
          title: documentTitle,
          content: data.content,
          form_data: data.formData,
          document_type: documentType,
        });

      if (supabaseError) throw supabaseError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [documentType]);

  // ✅ Atualizar documento existente
  const updateDocument = useCallback(async (id: string, data: DocumentData) => {
    setSaving(true);
    setError(null);

    try {
      const documentTitle = `${data.title} - ${formatDateBrazilian(new Date())}`;
      
      const { error: supabaseError } = await supabase
        .from('saved_terms')
        .update({
          title: documentTitle,
          content: data.content,
          form_data: data.formData,
        })
        .eq('id', id);

      if (supabaseError) throw supabaseError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // ✅ Deletar documento
  const deleteDocument = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('saved_terms')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // ✅ Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    saving,
    error,
    saveDocument,
    updateDocument,
    deleteDocument,
    clearError,
  };
};
