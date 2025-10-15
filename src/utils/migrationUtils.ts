import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Utilitário para aplicar migrações de banco de dados
 */
export class MigrationUtils {
  /**
   * Migra todos os contratos existentes para incluir a conta "Notificação de Rescisão"
   * Esta função é idempotente e pode ser executada múltiplas vezes
   * 
   * NOTA: Antes de executar esta função, execute o script SQL para corrigir a constraint
   */
  static async addNotificacaoRescisaoToExistingContracts(): Promise<void> {
    try {
      console.log('🔄 Iniciando migração: Adicionando Notificação de Rescisão aos contratos existentes...');
      console.log('⚠️ IMPORTANTE: Certifique-se de que a constraint foi corrigida executando o script SQL');

      // 1. Buscar todos os contratos que não possuem a conta "notificacao_rescisao"
      const { data: contractsWithoutNotification, error: selectError } = await supabase
        .from('saved_terms')
        .select('id')
        .eq('document_type', 'contrato')
        .not('id', 'in', 
          supabase
            .from('contract_bills')
            .select('contract_id')
            .eq('bill_type', 'notificacao_rescisao')
        );

      if (selectError) {
        throw new Error(`Erro ao buscar contratos: ${selectError.message}`);
      }

      if (!contractsWithoutNotification || contractsWithoutNotification.length === 0) {
        console.log('✅ Todos os contratos já possuem a conta "Notificação de Rescisão"');
        return;
      }

      // 2. Criar contas "notificacao_rescisao" para contratos faltantes
      const newBills = contractsWithoutNotification.map(contract => ({
        contract_id: contract.id,
        bill_type: 'notificacao_rescisao' as const,
        delivered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('contract_bills')
        .insert(newBills);

      if (insertError) {
        throw new Error(`Erro ao inserir contas: ${insertError.message}`);
      }

      console.log(`✅ Migração concluída: ${newBills.length} contas "Notificação de Rescisão" adicionadas`);
      toast.success(`Migração concluída: ${newBills.length} contas adicionadas`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro na migração:', errorMessage);
      toast.error(`Erro na migração: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Verifica se a migração é necessária
   */
  static async checkMigrationNeeded(): Promise<boolean> {
    try {
      // Contar contratos totais
      const { count: totalContracts, error: contractsError } = await supabase
        .from('saved_terms')
        .select('*', { count: 'exact', head: true })
        .eq('document_type', 'contrato');

      if (contractsError) {
        console.error('Erro ao contar contratos:', contractsError);
        return false;
      }

      // Contar contratos com notificacao_rescisao
      const { count: contractsWithNotification, error: billsError } = await supabase
        .from('contract_bills')
        .select('contract_id', { count: 'exact', head: true })
        .eq('bill_type', 'notificacao_rescisao');

      if (billsError) {
        console.error('Erro ao contar contas:', billsError);
        return false;
      }

      const migrationNeeded = (contractsWithNotification || 0) < (totalContracts || 0);
      
      if (migrationNeeded) {
        console.log(`🔄 Migração necessária: ${totalContracts} contratos, ${contractsWithNotification} com notificação`);
      } else {
        console.log('✅ Migração não necessária: todos os contratos já possuem a conta');
      }

      return migrationNeeded;
    } catch (error) {
      console.error('Erro ao verificar migração:', error);
      return false;
    }
  }

  /**
   * Executa a migração automaticamente se necessária
   */
  static async runMigrationIfNeeded(): Promise<void> {
    const needsMigration = await this.checkMigrationNeeded();
    if (needsMigration) {
      await this.addNotificacaoRescisaoToExistingContracts();
    }
  }
}