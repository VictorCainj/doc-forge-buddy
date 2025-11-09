import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TermoLocadorHeader,
  TermoLocatarioSidebar,
  TermoLocadorForm,
} from '@/features/documents/components';
import { useTermoLocadorData, useTermoLocadorGeneration } from '@/features/documents/hooks';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  quantidadeChaves?: string;
  [key: string]: string | undefined;
}

const TermoLocador: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractData = location.state?.contractData as ContractData;

  if (!contractData?.numeroContrato) {
    navigate('/contratos');
    return null;
  }

  // Hooks customizados
  const {
    autoFillData,
    setAutoFillData,
    getFormattedContractData,
  } = useTermoLocadorData(contractData);

  const {
    handleGenerate,
    getTemplate,
  } = useTermoLocadorGeneration(contractData);

  const formattedContractData = getFormattedContractData();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <TermoLocadorHeader contractData={formattedContractData} />

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
              <TermoLocadorForm
                contractData={contractData}
                initialData={autoFillData}
                onGenerate={handleGenerate}
                getTemplate={getTemplate}
                onFormDataChange={setAutoFillData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermoLocador;
