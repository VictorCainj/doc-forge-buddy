import { useState, useCallback } from 'react';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  quantidadeChaves?: string;
  nomesResumidosLocadores?: string;
  qualificacaoCompletaLocadores?: string;
  celularLocatario?: string;
  emailLocatario?: string;
  generoLocatario?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  [key: string]: string | undefined;
}

export function useTermoLocadorData(contractData: ContractData) {
  // Estado para gerenciar auto-preenchimento
  const [autoFillData, setAutoFillData] = useState<Record<string, string>>(() => {
    const quantidadeChaves = contractData.quantidadeChaves || '';
    const defaultQualificacao =
      contractData.qualificacaoCompletaLocadores || contractData.nomeProprietario;

    return {
      tipoTermo: 'locador',
      usarQuantidadeChavesContrato:
        quantidadeChaves && quantidadeChaves.trim() !== '' ? 'sim' : 'nao',
      tipoQuantidadeChaves: quantidadeChaves,
      qualificacaoCompleta: defaultQualificacao || '',
      nomeQuemRetira:
        contractData.nomesResumidosLocadores || contractData.nomeProprietario || '',
    };
  });

  // Função para detectar múltiplos proprietários
  const isMultipleProprietarios = useCallback((nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return nomeProprietario.includes(' e ');
  }, []);

  // Obter dados do contrato formatados
  const getFormattedContractData = useCallback(() => {
    const nomeProprietario =
      contractData.nomesResumidosLocadores || contractData.nomeProprietario;
    const isMultiple = isMultipleProprietarios(nomeProprietario);

    return {
      numeroContrato: contractData.numeroContrato,
      enderecoImovel: contractData.enderecoImovel,
      dataFirmamentoContrato: contractData.dataFirmamentoContrato,
      nomeProprietario,
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
