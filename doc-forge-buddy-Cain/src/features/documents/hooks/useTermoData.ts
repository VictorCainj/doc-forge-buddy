import { useState, useCallback, useEffect } from 'react';
import { useContractBillsSync } from '@/hooks/useContractBillsSync';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  incluirQuantidadeChaves?: string;
  quantidadeChaves?: string;
  tipoGarantia?: string;
  temFiador?: string;
  nomeFiador?: string;
  nomesResumidosLocadores?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  generoLocatario?: string;
  generoProprietario?: string;
  qualificacaoCompletaLocatarios?: string;
  [key: string]: string | undefined;
}

export function useTermoData(contractData: ContractData) {
  // Estado para gerenciar auto-preenchimento
  const [autoFillData, setAutoFillData] = useState<Record<string, string>>({});

  // Sincronizar contas de consumo do banco de dados
  const { billStatus, isLoading: loadingBills } = useContractBillsSync({
    contractId: contractData.numeroContrato,
  });

  // Sincronizar billStatus com autoFillData
  useEffect(() => {
    if (!loadingBills) {
      setAutoFillData((prev) => ({
        ...prev,
        tipoTermo: 'locatario', // Definir tipo de termo para exibir campos corretos
        cpfl: billStatus.energia ? 'SIM' : 'NÃO',
        statusAgua: billStatus.agua ? 'SIM' : 'NÃO',
      }));
    }
  }, [billStatus, loadingBills]);

  // Callback para sincronizar mudanças de volta ao banco
  const handleFormDataChange = useCallback(
    async (data: Record<string, string>) => {
      setAutoFillData(data);

      // Buscar o ID real do contrato primeiro
      try {
        const { data: contractDataFromDB, error: contractError } =
          await supabase
            .from('saved_terms')
            .select('id')
            .eq('document_type', 'contrato')
            .ilike('form_data->>numeroContrato', contractData.numeroContrato)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro quando não há resultados

        if (contractError) {
          log.error(
            'Erro ao buscar contrato para sincronização:',
            contractError
          );
          return;
        }

        if (!contractDataFromDB?.id) {
          log.warn(
            'Contrato não encontrado para sincronização:',
            contractData.numeroContrato
          );
          return;
        }

        const realContractId = contractDataFromDB.id;

        // Sincronizar CPFL (Energia)
        if (data.cpfl && data.cpfl !== autoFillData.cpfl) {
          const delivered = data.cpfl === 'SIM';
          try {
            await supabase
              .from('contract_bills')
              .update({
                delivered,
                delivered_at: delivered ? new Date().toISOString() : null,
              })
              .eq('contract_id', realContractId)
              .eq('bill_type', 'energia');
          } catch (error) {
            log.error('Erro ao sincronizar CPFL:', error);
          }
        }

        // Sincronizar Água
        if (data.statusAgua && data.statusAgua !== autoFillData.statusAgua) {
          const delivered = data.statusAgua === 'SIM';
          try {
            await supabase
              .from('contract_bills')
              .update({
                delivered,
                delivered_at: delivered ? new Date().toISOString() : null,
              })
              .eq('contract_id', realContractId)
              .eq('bill_type', 'agua');
          } catch (error) {
            log.error('Erro ao sincronizar Água:', error);
          }
        }
      } catch (error) {
        log.error('Erro geral na sincronização:', error);
      }
    },
    [autoFillData, contractData.numeroContrato]
  );

  // Obter dados do contrato formatados
  const getFormattedContractData = useCallback(() => {
    const nomeProprietario =
      contractData.nomesResumidosLocadores || contractData.nomeProprietario;
    const isMultipleProprietarios =
      nomeProprietario && nomeProprietario.includes(' e ');

    const nomeLocatarioFormatado = contractData.nomeLocatario || '';

    return {
      numeroContrato: contractData.numeroContrato,
      enderecoImovel: contractData.enderecoImovel,
      dataFirmamentoContrato: contractData.dataFirmamentoContrato,
      nomeProprietario,
      nomeLocatario: nomeLocatarioFormatado,
      quantidadeChaves: contractData.quantidadeChaves || 'Não informado',
      isMultipleProprietarios,
    };
  }, [contractData]);

  return {
    autoFillData,
    billStatus,
    loadingBills,
    handleFormDataChange,
    getFormattedContractData,
  };
}
