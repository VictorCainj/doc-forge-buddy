import { useState, useCallback } from 'react';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  quantidadeChaves?: string;
  [key: string]: string | undefined;
}

export function useTermoLocadorData(contractData: ContractData) {
  // Estado para gerenciar auto-preenchimento
  const [autoFillData, setAutoFillData] = useState<Record<string, string>>({});

  // Função para detectar múltiplos proprietários
  const isMultipleProprietarios = useCallback((nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return nomeProprietario.includes(' e ');
  }, []);

  // Obter dados do contrato formatados
  const getFormattedContractData = useCallback(() => {
    const isMultiple = isMultipleProprietarios(contractData.nomeProprietario);
    
    return {
      numeroContrato: contractData.numeroContrato,
      enderecoImovel: contractData.enderecoImovel,
      dataFirmamentoContrato: contractData.dataFirmamentoContrato,
      nomeProprietario: contractData.nomeProprietario,
      nomeLocatario: contractData.nomeLocatario,
      quantidadeChaves: contractData.quantidadeChaves || 'Não informado',
      isMultipleProprietarios: isMultiple,
    };
  }, [contractData, isMultipleProprietarios]);

  return {
    autoFillData,
    setAutoFillData,
    isMultipleProprietarios,
    getFormattedContractData,
  };
}
