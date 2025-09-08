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
}

const TermoLocatario: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractData = location.state?.contractData as ContractData;

  if (!contractData?.numeroContrato) {
    navigate('/contratos');
    return null;
  }

  // Função para detectar múltiplos locatários
  const isMultipleLocatarios = (nomeLocatario: string) => {
    if (!nomeLocatario) return false;
    return nomeLocatario.includes(',') || 
           nomeLocatario.includes(' e ') || 
           nomeLocatario.includes(' E ');
  };

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
      id: "documentos",
      title: "Documentos Apresentados",
      description: "Comprovantes de contas de consumo",
      icon: FileCheck,
      fields: [
        { 
          name: "cpfl", 
          label: "CPFL", 
          type: "select", 
          required: true, 
          placeholder: "Selecione uma opção",
          options: [
            { value: "SIM", label: "SIM" },
            { value: "NÃO", label: "NÃO" }
          ]
        },
        { 
          name: "tipoAgua", 
          label: "ÁGUA", 
          type: "select", 
          required: true, 
          placeholder: "Selecione o tipo",
          options: [
            { value: "DAEV", label: "DAEV" },
            { value: "SANASA", label: "SANASA" }
          ]
        },
        { 
          name: "statusAgua", 
          label: "Status da Água", 
          type: "select", 
          required: true, 
          placeholder: "Selecione uma opção",
          options: [
            { value: "SIM", label: "SIM" },
            { value: "NÃO", label: "NÃO" },
            { value: "No condomínio", label: "No condomínio" }
          ]
        }
      ]
    },
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
          label: isMultipleLocatarios(contractData.nomeLocatario) 
            ? "Selecionar Locatário Específico" 
            : "Incluir Nome Completo do Locatário",
          type: "select",
          required: false,
          placeholder: "Selecione uma opção",
          options: isMultipleLocatarios(contractData.nomeLocatario) 
            ? [
                { value: "todos", label: "Todos os locatários" },
                ...contractData.nomeLocatario.split(/,| e | E /).map(nome => nome.trim()).filter(nome => nome && nome.length > 2).map(nome => ({
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
          name: "dataVistoria",
          label: "Data da Vistoria",
          type: "text",
          required: true,
          placeholder: "DD/MM/AAAA",
          mask: "date"
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
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getTemplate = (fontSize: number) => {
    const titleSize = Math.max(fontSize + 2, 12);
    const signatureSize = Math.max(fontSize - 2, 10);
    
    return `
<div style="text-align: center; margin-bottom: 20px; font-size: ${titleSize}px; font-weight: bold;">
TERMO DE RECEBIMENTO DE CHAVES {{numeroContrato}}
</div>

<div style="text-align: right; margin-bottom: 20px; font-size: ${fontSize}px;">
Valinhos, ${getCurrentDate()}.
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: ${fontSize}px;">
{{textoEntregaChaves}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeProprietario}}<br>
<strong>{{dadosLocatarioTitulo}}:</strong> {{nomeLocatario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS:</strong><br>
<strong>CPFL:</strong> {{cpfl}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{{tipoAgua}}:</strong> {{statusAgua}}<br>
<br>
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade {{locatarioResponsabilidade}}. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{tipoQuantidadeChaves}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Vistoria realizada em</strong> {{dataVistoria}}.
</div>

<div style="margin: 20px 0; font-size: ${fontSize}px;">
( &nbsp; ) Imóvel entregue de acordo com a vistoria inicial<br>
( &nbsp; ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade {{locatarioResponsabilidade}}. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
</div>

<div style="margin: 20px 0; font-size: ${fontSize}px;">
{{observacao}}
</div>

<div style="margin-top: 50px; text-align: center;">
<div style="margin-bottom: 40px;">
__________________________________________<br>
<span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
</div>

<div>
__________________________________________<br>
<span style="font-size: ${signatureSize}px; text-transform: uppercase;">VICTOR CAIN JORGE</span>
</div>
</div>
`;
  };

  const handleGenerate = (data: Record<string, string>) => {
    // Detectar se há múltiplos locatários baseado nos nomes resumidos
    const isMultipleLocatarios = contractData.nomeLocatario && (
      contractData.nomeLocatario.includes(',') || 
      contractData.nomeLocatario.includes(' e ') ||
      contractData.nomeLocatario.includes(' E ')
    );

    // Detectar se há múltiplos proprietários
    const isMultipleProprietarios = contractData.nomeProprietario && (
      contractData.nomeProprietario.includes(',') || 
      contractData.nomeProprietario.includes(' e ') ||
      contractData.nomeProprietario.includes(' E ')
    );

    // Definir termos baseados na quantidade
    const locadorTerm = isMultipleProprietarios ? "LOCADORES" : "LOCADOR";
    const dadosLocatarioTitulo = isMultipleLocatarios ? "DADOS DOS LOCATÁRIOS" : "DADOS DO LOCATÁRIO";
    const locatarioResponsabilidade = isMultipleLocatarios ? "dos locatários" : "do locatário";

    // Processar nome de quem retira baseado na opção selecionada
    let nomeQuemRetira = data.nomeQuemRetira;
    if (data.incluirNomeCompleto === "sim") {
      nomeQuemRetira = contractData.nomeLocatario;
    } else if (data.incluirNomeCompleto === "todos") {
      nomeQuemRetira = contractData.nomeLocatario;
    } else if (data.incluirNomeCompleto && data.incluirNomeCompleto !== "nao") {
      // Se selecionou um locatário específico
      nomeQuemRetira = data.incluirNomeCompleto;
    }

    // Processar observação (só mostra se preenchida)
    const observacao = data.observacao && data.observacao.trim() !== "" 
      ? `<strong>OBS:</strong> ${data.observacao}` 
      : "<!-- SEM OBSERVACAO -->";

    // Texto de entrega de chaves para termo do locatário
    const textoEntregaChaves = `Pelo presente, recebemos as chaves do imóvel sito à ${contractData.enderecoImovel}, ora locado ${nomeQuemRetira}, devidamente qualificado no contrato de locação residencial firmado em ${contractData.dataFirmamentoContrato}.`;

    const enhancedData = {
      ...data,
      ...contractData,
      
      // Dados específicos do termo do locatário
      locadorTerm,
      dadosLocatarioTitulo,
      locatarioResponsabilidade,
      nomeQuemRetira,
      
      // Processar observação
      observacao,
      
      // Texto de entrega de chaves baseado em quem está retirando
      textoEntregaChaves,
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
                    Termo de Recebimento de Chaves - Locatário
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contrato #{contractData.numeroContrato}
                  </p>
                </div>
              </div>

              <DocumentFormWizard
                title="Termo de Recebimento de Chaves - Locatário"
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

export default TermoLocatario;
