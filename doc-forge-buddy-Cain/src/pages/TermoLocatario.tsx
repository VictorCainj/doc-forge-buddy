import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TermoLocatarioHeader,
  TermoLocatarioSidebar,
  TermoLocatarioForm,
  TermoLocatarioContactModal,
} from '@/features/documents/components';
import { useTermoLocatario, useTermoData, useTermoValidation, useTermoGeneration } from '@/features/documents/hooks';

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

const TermoLocatario: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractData = location.state?.contractData as ContractData;

  if (!contractData?.numeroContrato) {
    navigate('/contratos');
    return null;
  }

  // Hooks customizados
  const {
    showContactModal,
    setShowContactModal,
    contactData,
    setContactData,
    pendingFormData,
    setPendingFormData,
    validateContactFields,
    handleSaveContactData,
  } = useTermoLocatario(contractData);

  const {
    autoFillData,
    handleFormDataChange,
    getFormattedContractData,
  } = useTermoData(contractData);

  const { handleGenerate, getTemplate } = useTermoGeneration(contractData);

  const formattedContractData = getFormattedContractData();

  // Função para lidar com a geração do documento
  const handleGenerateDocument = (data: Record<string, string>) => {
    // Validar campos de contato antes de gerar o documento
    const contactValidation = validateContactFields(data);

    if (!contactValidation.isValid) {
      // Mostrar modal para preenchimento dos campos de contato
      setPendingFormData(data);
      setShowContactModal(true);
      throw new Error('VALIDATION_REQUIRED'); // Interromper o fluxo
    }

    return handleGenerate(data);
  };

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

      {/* Modal de Validação de Contato */}
      <TermoLocatarioContactModal
        open={showContactModal}
        contactData={contactData}
        pendingFormData={pendingFormData}
        onCelularChange={(value) =>
          setContactData((prev) => ({ ...prev, celularLocatario: value }))
        }
        onEmailChange={(value) =>
          setContactData((prev) => ({ ...prev, emailLocatario: value }))
        }
        onSave={handleSaveContactData}
        onCancel={() => {
          setShowContactModal(false);
          setPendingFormData(null);
        }}
      />
    </div>
  );
};

export default TermoLocatario;
