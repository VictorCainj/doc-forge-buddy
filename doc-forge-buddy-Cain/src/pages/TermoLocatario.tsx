import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TermoLocatarioHeader,
  TermoLocatarioSidebar,
  TermoLocatarioForm,
} from '@/features/documents/components';
import { useTermoData, useTermoGeneration } from '@/features/documents/hooks';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  incluirQuantidadeChaves?: string;
  quantidadeChaves?: string;
  celularLocatario?: string;
  emailLocatario?: string;
  generoProprietario?: string;
  generoLocatario?: string;
  nomesResumidosLocadores?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  tipoGarantia?: string;
  temFiador?: string;
  nomeFiador?: string;
  qualificacaoCompletaLocatarios?: string;
  [key: string]: string | undefined;
}

type ContractLocationState = {
  contractData?: ContractData | { formData?: ContractData } | null;
};

const TermoLocatario: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ContractLocationState | undefined;

  const contractData = useMemo<ContractData | undefined>(() => {
    const stateData = locationState?.contractData as
      | ContractData
      | { formData?: ContractData }
      | undefined;

    if (!stateData) {
      return undefined;
    }

    if (
      typeof stateData === 'object' &&
      stateData !== null &&
      'formData' in stateData &&
      stateData.formData
    ) {
      const { formData, ...rest } = stateData as {
        formData: ContractData;
        [key: string]: unknown;
      };

      return {
        ...formData,
        ...Object.fromEntries(
          Object.entries(rest).filter(
            ([, value]) => value === undefined || typeof value === 'string'
          )
        ),
      } as ContractData;
    }

    return stateData as ContractData;
  }, [locationState]);

  if (!contractData?.numeroContrato) {
    navigate('/contratos');
    return null;
  }

  const {
    autoFillData,
    handleFormDataChange,
    getFormattedContractData,
  } = useTermoData(contractData);

  const { handleGenerate, getTemplate } = useTermoGeneration(contractData);

  const formattedContractData = getFormattedContractData();

  // Função para lidar com a geração do documento
  const handleGenerateDocument = (data: Record<string, string>) =>
    handleGenerate({
      ...data,
      celularLocatario: contractData.celularLocatario ?? '',
      emailLocatario: contractData.emailLocatario ?? '',
    });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <TermoLocatarioHeader contractData={formattedContractData} />

      {/* Main Content */}
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar com Informações do Contrato */}
            <div className="lg:col-span-1">
              <TermoLocatarioSidebar contractData={formattedContractData} />
            </div>

            {/* Formulário Principal */}
            <div className="lg:col-span-2">
              <TermoLocatarioForm
                contractData={contractData}
                initialData={autoFillData}
                onGenerate={handleGenerateDocument}
                getTemplate={getTemplate}
                onFormDataChange={handleFormDataChange}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TermoLocatario;
