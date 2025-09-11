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
          label: "Selecionar Locatário Específico",
          type: "select",
          required: false,
          placeholder: "Selecione uma opção",
          options: [
            { value: "todos", label: "Todos os locatários" },
            ...(contractData.nomeLocatario ? contractData.nomeLocatario.split(/,| e | E /).map(nome => nome.trim()).filter(nome => nome && nome.length > 2).map(nome => ({
              value: nome,
              label: nome
            })) : [])
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
          name: "tipoContrato",
          label: "Tipo de Contrato",
          type: "select",
          required: false,
          placeholder: "Selecione o tipo",
          options: [
            { value: "residencial", label: "Residencial" },
            { value: "comercial", label: "Comercial" }
          ]
        },
        {
          name: "statusVistoria",
          label: "Status da Vistoria",
          type: "select",
          required: true,
          placeholder: "Selecione o status",
          options: [
            { value: "aprovada", label: "Aprovada" },
            { value: "reprovada", label: "Reprovada" }
          ]
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
<strong>{{dadosLocatarioTitulo}}:</strong> {{nomeQuemRetira}}
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
{{statusVistoriaCheckboxes}}
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
    // Detectar se há múltiplos locatários baseado na quantidade adicionada
    const isMultipleLocatarios = contractData.primeiroLocatario && (contractData.segundoLocatario || contractData.terceiroLocatario || contractData.quartoLocatario);

    // Detectar se há múltiplos proprietários baseado na quantidade adicionada
    const nomeProprietario = contractData.nomesResumidosLocadores || contractData.nomeProprietario;
    const isMultipleProprietarios = nomeProprietario && nomeProprietario.includes(' e ');

    // Definir termos baseados na quantidade e gênero
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
    // Definir título baseado na quantidade e gênero
    let dadosLocatarioTitulo;
    if (isMultipleLocatarios) {
      dadosLocatarioTitulo = "DADOS DOS LOCATÁRIOS";
    } else {
      // Usar o gênero do locatário cadastrado no contrato
      const generoLocatario = contractData.generoLocatario;
      if (generoLocatario === "feminino") {
        dadosLocatarioTitulo = "DADOS DA LOCATÁRIA";
      } else if (generoLocatario === "masculino") {
        dadosLocatarioTitulo = "DADOS DO LOCATÁRIO";
      } else {
        dadosLocatarioTitulo = "DADOS DO LOCATÁRIO"; // fallback para neutro ou indefinido
      }
    }
    const locatarioResponsabilidade = isMultipleLocatarios ? "dos locatários" : "do locatário";

    // Processar nome de quem retira baseado na opção selecionada
    let nomeQuemRetira = data.nomeQuemRetira;
    
    if (data.incluirNomeCompleto === "todos") {
      nomeQuemRetira = contractData.nomeLocatario;
    } else if (data.incluirNomeCompleto && data.incluirNomeCompleto !== "") {
      // Se selecionou um locatário específico
      nomeQuemRetira = data.incluirNomeCompleto;
    }

    // Processar status da vistoria
    const statusVistoria = data.statusVistoria || "aprovada";
    const statusVistoriaCheckboxes = statusVistoria === "aprovada" 
      ? "( ✓ ) Imóvel entregue de acordo com a vistoria inicial<br>( &nbsp; ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade dos locatários. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão."
      : "( &nbsp; ) Imóvel entregue de acordo com a vistoria inicial<br>( ✓ ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade dos locatários. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.";

    // Processar observação (só mostra se preenchida)
    const observacao = data.observacao && data.observacao.trim() !== "" 
      ? `<strong>OBS:</strong> ${data.observacao}` 
      : "<!-- SEM OBSERVACAO -->";

    // Aplicar formatação de nomes - apenas locatário com negrito
    const nomeProprietarioFormatado = contractData.nomesResumidosLocadores || contractData.nomeProprietario; // Sem negrito

    const nomeLocatarioFormatado = contractData.nomeLocatario
      ? (() => {
          const nomesArray = contractData.nomeLocatario.split(/ e | E /).map(nome => nome.trim());
          return nomesArray.length > 1 
            ? nomesArray.slice(0, -1).map(nome => `<strong>${nome}</strong>`).join(', ') + 
              ' e ' + `<strong>${nomesArray[nomesArray.length - 1]}</strong>`
            : `<strong>${nomesArray[0]}</strong>`;
        })()
      : '';

    // Texto de entrega de chaves para termo do locatário
    const tipoContrato = data.tipoContrato || "residencial";
    // Usar a qualificação completa que já foi preenchida no cadastro do contrato
    const qualificacaoCompleta = contractData.qualificacaoCompletaLocatarios || nomeQuemRetira;
    const textoEntregaChaves = `Pelo presente, recebemos as chaves do imóvel sito à <strong>${contractData.enderecoImovel}</strong>, ora locado <strong>${qualificacaoCompleta}</strong>, devidamente qualificado no contrato de locação <strong>${tipoContrato}</strong> firmado em <strong>${contractData.dataFirmamentoContrato}</strong>.`;

    const enhancedData = {
      ...data,
      ...contractData,
      
      // Dados específicos do termo do locatário
      locadorTerm,
      dadosLocatarioTitulo,
      locatarioResponsabilidade,
      nomeQuemRetira,
      nomeProprietario: nomeProprietarioFormatado, // Nome formatado com negrito
      nomeLocatario: nomeLocatarioFormatado, // Nome formatado com negrito
      
      // Processar observação
      observacao,
      
      // Status da vistoria com checkboxes
      statusVistoriaCheckboxes,
      
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
