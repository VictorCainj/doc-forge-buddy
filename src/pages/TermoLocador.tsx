import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentFormWizard from '../components/DocumentFormWizard';
import { FileCheck, Search } from 'lucide-react';
import { FormStep } from '../hooks/use-form-wizard';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  [key: string]: string;
}

const TermoLocador: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractData = location.state?.contractData as ContractData;

  if (!contractData?.numeroContrato) {
    navigate('/contratos');
    return null;
  }

  // Função para detectar múltiplos proprietários
  const isMultipleProprietarios = (nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return nomeProprietario.includes(',') || 
           nomeProprietario.includes(' e ') || 
           nomeProprietario.includes(' E ');
  };

  // Estado para gerenciar auto-preenchimento
  const [autoFillData, setAutoFillData] = React.useState<Record<string, string>>({});

  const steps: FormStep[] = [
    {
      id: "vistoria",
      title: "Vistoria e Entrega",
      description: "Detalhes da vistoria e entrega das chaves",
      icon: Search,
      fields: [
        {
          name: "nomeQuemRetira",
          label: "Nome de Quem Retira a Chave",
          type: "text",
          required: true,
          placeholder: "Digite o nome completo"
        },
        {
          name: "incluirNomeCompleto",
          label: isMultipleProprietarios(contractData.nomeProprietario) 
            ? "Selecionar Locador Específico" 
            : "Incluir Nome Completo do Locador",
          type: "select",
          required: false,
          placeholder: "Selecione uma opção",
          options: isMultipleProprietarios(contractData.nomeProprietario) 
            ? [
                { value: "todos", label: "Todos os locadores" },
                ...contractData.nomeProprietario.split(/,| e | E /).map(nome => nome.trim()).filter(nome => nome && nome.length > 2).map(nome => ({
                  value: nome,
                  label: nome
                }))
              ]
            : [
                { value: "sim", label: "Sim - Incluir nome completo" },
                { value: "nao", label: "Não - Usar apenas o nome digitado" }
              ]
        },
        { 
          name: "tipoQuantidadeChaves", 
          label: "Tipo e Quantidade de Chaves", 
          type: "textarea", 
          required: true, 
          placeholder: "Ex: 04 chaves simples, 02 chaves tetra"
        },
        {
          name: "observacao",
          label: "Observação (Opcional)",
          type: "textarea",
          required: false,
          placeholder: "Digite observações adicionais se necessário"
        }
      ]
    }
  ];

  const getCurrentDate = () => {
    const today = new Date();
    const day = today.getDate();
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    return `${day} de ${month} de ${year}`;
  };

  const getTemplate = (fontSize: number) => {
    const titleSize = Math.max(fontSize + 2, 12);
    const signatureSize = Math.max(fontSize - 2, 10);
    
    return `
<div style="text-align: center; margin-bottom: 20px; font-size: ${titleSize}px; font-weight: bold;">
TERMO DE RECEBIMENTO – {{numeroContrato}}
</div>

<div style="text-align: right; margin-bottom: 20px; font-size: ${fontSize}px;">
Valinhos, ${getCurrentDate()}.
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: ${fontSize}px;">
Pelo presente, entrego as chaves do imóvel sito à {{enderecoImovel}}.
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeProprietario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
{{tipoQuantidadeChaves}}
</div>

<div style="margin: 20px 0; font-size: ${fontSize}px;">
{{observacao}}
</div>

  <div style="margin-top: 50px; text-align: center;">
    <div style="margin-bottom: 40px;">
      __________________________________________<br>
      <span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
      {{#if documentoQuemRetira}}
      <br><span style="font-size: ${signatureSize - 1}px;">{{documentoQuemRetira}}</span>
      {{/if}}
    </div>

<div>
__________________________________________<br>
<span style="font-size: ${signatureSize}px; text-transform: uppercase;">VICTOR CAIN JORGE</span>
</div>
</div>
`;
  };

  const handleGenerate = (data: Record<string, string>) => {
    // Detectar se há múltiplos proprietários
    const isMultipleProprietarios = contractData.nomeProprietario && (
      contractData.nomeProprietario.includes(',') || 
      contractData.nomeProprietario.includes(' e ') ||
      contractData.nomeProprietario.includes(' E ')
    );

    // Definir termo do locador baseado na quantidade
    const locadorTerm = isMultipleProprietarios ? "LOCADORES" : "LOCADOR";

    // Processar nome de quem retira baseado na opção selecionada
    let nomeQuemRetira = data.nomeQuemRetira;
    if (data.incluirNomeCompleto === "sim") {
      nomeQuemRetira = contractData.nomeProprietario;
    } else if (data.incluirNomeCompleto === "todos") {
      nomeQuemRetira = contractData.nomeProprietario;
    } else if (data.incluirNomeCompleto && data.incluirNomeCompleto !== "nao") {
      // Se selecionou um proprietário específico
      nomeQuemRetira = data.incluirNomeCompleto;
    }

    // Processar observação (só mostra se preenchida)
    const observacao = data.observacao && data.observacao.trim() !== "" 
      ? `<strong>OBS:</strong> ${data.observacao}` 
      : "<!-- SEM OBSERVACAO -->";

    const enhancedData = {
      ...data,
      ...contractData,
      
      // Dados específicos do termo do locador
      locadorTerm,
      nomeQuemRetira,
      
      // Processar observação
      observacao,
    };
    
    return enhancedData;
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-card rounded-lg border-b">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Termo de Recebimento de Chaves - Locador
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contrato #{contractData.numeroContrato}
                  </p>
                </div>
              </div>

              <DocumentFormWizard
                title="Termo de Recebimento de Chaves - Locador"
                description="Preencha os dados para gerar o termo"
                steps={steps}
                template=""
                onGenerate={handleGenerate}
                getTemplate={getTemplate}
                contractData={contractData}
                initialData={autoFillData}
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
