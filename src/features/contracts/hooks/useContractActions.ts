import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Contract } from '@/types/contract';

/**
 * Hook com ações especializadas para contratos
 * - Deletar
 * - Duplicar
 * - Export/Import
 * - Operações em lote
 */
export function useContractActions() {
  /**
   * Deletar contrato
   */
  const deleteContract = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Contrato deletado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
      toast.error('Erro ao deletar contrato');
      return false;
    }
  }, []);
  
  /**
   * Duplicar contrato (usando saved_terms)
   */
  const duplicateContract = useCallback(async (contract: Contract): Promise<Contract | null> => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .insert({
          title: `${contract.title} (Cópia)`,
          form_data: {
            ...contract.form_data,
            numeroContrato: `${contract.form_data.numeroContrato}-COPIA`,
          },
          content: contract.content,
          document_type: contract.document_type,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success('Contrato duplicado com sucesso');
      return data as unknown as Contract;
    } catch (error) {
      console.error('Erro ao duplicar contrato:', error);
      toast.error('Erro ao duplicar contrato');
      return null;
    }
  }, []);
  
  /**
   * Exportar contratos para CSV
   */
  const exportContracts = useCallback(async (contracts: Contract[]) => {
    try {
      // Criar CSV
      const headers = ['Número', 'Locatário', 'Endereço', 'Data', 'Status'];
      const rows = contracts.map(c => [
        c.form_data?.numeroContrato || 'N/A',
        c.form_data?.nomeLocatario || 'N/A',
        c.form_data?.enderecoImovel || 'N/A',
        c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'N/A',
        (c as any).status || 'Ativo',
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `contratos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${contracts.length} contratos exportados`);
    } catch (error) {
      console.error('Erro ao exportar contratos:', error);
      toast.error('Erro ao exportar contratos');
    }
  }, []);
  
  /**
   * Deletar múltiplos contratos
   */
  const bulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .in('id', ids);
        
      if (error) throw error;
      
      toast.success(`${ids.length} contratos deletados com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar contratos:', error);
      toast.error('Erro ao deletar contratos em lote');
      return false;
    }
  }, []);
  
  /**
   * Atualizar status de múltiplos contratos (funcionalidade removida - tabela contracts não tem campo status)
   */
  const bulkUpdateStatus = useCallback(async (
    ids: string[], 
    status: string
  ): Promise<boolean> => {
    toast.error('Funcionalidade de status não disponível');
    return false;
  }, []);
  
  return {
    deleteContract,
    duplicateContract,
    exportContracts,
    bulkDelete,
    bulkUpdateStatus,
  };
}
