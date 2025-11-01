import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEditarMotivo = () => {
  const [isLoading, setIsLoading] = useState(false);

  const editarMotivo = async (contratoId: string, novoMotivo: string) => {
    setIsLoading(true);

    try {
      // Buscar o contrato atual da tabela saved_terms
      const { data: contrato, error: fetchError } = await supabase
        .from('saved_terms')
        .select('form_data')
        .eq('id', contratoId)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar contrato: ${fetchError.message}`);
      }

      // Atualizar o motivo no form_data
      const formDataAtualizado = {
        ...contrato.form_data,
        motivoDesocupacao: novoMotivo.trim(),
      };

      // Salvar no Supabase
      const { error: updateError } = await supabase
        .from('saved_terms')
        .update({
          form_data: formDataAtualizado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contratoId);

      if (updateError) {
        throw new Error(`Erro ao atualizar contrato: ${updateError.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao editar motivo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    editarMotivo,
    isLoading,
  };
};
