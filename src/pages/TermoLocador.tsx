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

  // Debug: verificar dados do contrato
  console.log("Dados do contrato no TermoLocador:", contractData);
  console.log("Quantidade de chaves:", contractData.quantidadeChaves);

  // Função para detectar múltiplos proprietários baseado na quantidade adicionada
  const isMultipleProprietarios = (nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return nomeProprietario.includes(' e ');
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
          label: "Quem está retirando as chaves",
          type: "select",
          required: false,
          placeholder: "Selecione uma opção",
          options: [
            { value: "todos", label: "Todos os locadores" },
            ...(contractData.nomesResumidosLocadores || contractData.nomeProprietario ? (contractData.nomesResumidosLocadores || contractData.nomeProprietario).split(/,| e | E /).map(nome => nome.trim()).filter(nome => nome && nome.length > 2).map(nome => ({
              value: nome,
              label: nome
            })) : [])
          ]
        },
        {
          name: "usarQuantidadeChavesContrato",
          label: "Selecionar chaves entregues no início da locação",
          type: "select",
          required: false,
          placeholder: "Selecione uma opção",
          options: [
            { value: "nao", label: "Não - Digitar manualmente" },
            { 
              value: "sim", 
              label: contractData.quantidadeChaves && contractData.quantidadeChaves !== "" 
                ? `Sim - Todas as chaves: ${contractData.quantidadeChaves}`
                : "Sim - Usar quantidade do contrato"
            }
          ]
        },
        { 
          name: "tipoQuantidadeChaves", 
          label: "Tipo e Quantidade de Chaves (se não selecionou usar do contrato)", 
          type: "textarea", 
          required: false, 
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
Pelo presente, entrego as chaves do imóvel sito à <strong>{{enderecoImovel}}</strong>.
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
    const nomeProprietario = contractData.nomesResumidosLocadores || contractData.nomeProprietario;
    const isMultipleProprietarios = nomeProprietario && (
      nomeProprietario.includes(',') || 
      nomeProprietario.includes(' e ') ||
      nomeProprietario.includes(' E ')
    );

    // Definir termo do locador baseado na quantidade e gênero
    let locadorTerm;
    if (isMultipleProprietarios) {
      locadorTerm = "LOCADORES";
    } else {
      // Usar o gênero do locador cadastrado no contrato
      const generoProprietario = contractData.generoProprietario;
      if (generoProprietario === "feminino") {
        locadorTerm = "LOCADORA";
      } else if (generoProprietario === "masculino") {
        locadorTerm = "LOCADOR";
      } else {
        locadorTerm = "LOCADOR"; // fallback para neutro ou indefinido
      }
    }


    // Processar nome de quem retira baseado na opção selecionada
    let nomeQuemRetira = data.nomeQuemRetira;
    if (data.incluirNomeCompleto === "todos") {
      nomeQuemRetira = nomeProprietario;
    } else if (data.incluirNomeCompleto && data.incluirNomeCompleto !== "") {
      // Se selecionou um proprietário específico
      nomeQuemRetira = data.incluirNomeCompleto;
    }

    // Processar quantidade de chaves baseado na opção selecionada
    let tipoQuantidadeChaves = data.tipoQuantidadeChaves;
    if (data.usarQuantidadeChavesContrato === "sim") {
      // Se selecionou usar do contrato, usar sempre a quantidade do contrato
      tipoQuantidadeChaves = contractData.quantidadeChaves || data.tipoQuantidadeChaves;
      console.log("Usando quantidade de chaves do contrato:", contractData.quantidadeChaves);
    } else {
      // Se não selecionou, usar o que foi digitado manualmente
      tipoQuantidadeChaves = data.tipoQuantidadeChaves;
      console.log("Usando quantidade de chaves digitada manualmente:", data.tipoQuantidadeChaves);
    }

    // Processar observação (só mostra se preenchida)
    const observacao = data.observacao && data.observacao.trim() !== "" 
      ? `<strong>OBS:</strong> ${data.observacao}` 
      : "<!-- SEM OBSERVACAO -->";

    // Aplicar formatação de nomes - sem negrito para o proprietário
    const nomeProprietarioFormatado = contractData.nomesResumidosLocadores || contractData.nomeProprietario; // Sem negrito


    const enhancedData = {
      ...contractData,
      ...data,
      
      // Dados específicos do termo do locador - devem vir por último para sobrescrever
      locadorTerm,
      nomeQuemRetira,
      nomeProprietario: nomeProprietarioFormatado, // Nome formatado
      tipoQuantidadeChaves, // Quantidade de chaves processada
      
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
