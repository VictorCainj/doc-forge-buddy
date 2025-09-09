import DocumentFormWizard from "@/components/DocumentFormWizard";
import { Home, User, Users, FileCheck, Search } from "lucide-react";
import { FormStep } from "@/hooks/use-form-wizard";

const TermoInquilino = () => {
  const steps: FormStep[] = [
    {
      id: "imovel",
      title: "Dados do Imóvel",
      description: "Informações básicas sobre o imóvel e contrato",
      icon: Home,
      fields: [
        { 
          name: "numeroContrato", 
          label: "Número do Contrato", 
          type: "text", 
          required: true, 
          placeholder: "Ex: 14021, CON-2024-001, etc." 
        },
        { 
          name: "endereco", 
          label: "Endereço Completo do Imóvel", 
          type: "textarea", 
          required: true, 
          placeholder: "Rua, número, complemento, bairro, condomínio, cidade/estado, CEP" 
        },
        { 
          name: "dataContrato", 
          label: "Data de Firmamento do Contrato", 
          type: "text", 
          required: true, 
          placeholder: "Ex: 15/10/2024 ou 15 de outubro de 2024",
          validation: (value) => {
            if (value && value.length < 5) {
              return "Digite uma data válida";
            }
            return null;
          }
        }
      ]
    },
    {
      id: "locador",
      title: "Dados do Locador(es)",
      description: "Informações do(s) proprietário(s) do imóvel",
      icon: User,
      fields: [
        { 
          name: "nomeLocador", 
          label: "Nome do(s) Locador(es)", 
          type: "text", 
          required: true, 
          placeholder: "Ex: João Silva, Maria Santos (separe múltiplos nomes por vírgula)",
          validation: (value) => {
            if (value) {
              const nomes = value.split(',').map(nome => nome.trim());
              for (const nome of nomes) {
                if (nome.split(' ').length < 2) {
                  return "Digite o nome completo para cada pessoa";
                }
              }
            }
            return null;
          }
        }
      ]
    },
    {
      id: "locatario",
      title: "Qualificação dos Locatários",
      description: "Qualificação completa dos inquilinos conforme contrato",
      icon: Users,
      fields: [
        { 
          name: "qualificacaoLocatarios", 
          label: "Qualificação Completa dos Locatários", 
          type: "textarea", 
          required: true, 
          placeholder: "Ex: DIOGO VIEIRA ORLANDO, brasileiro, divorciado, engenheiro ambiental, portador do RG. nº MG-14.837.051 SSP/MG, e inscrito no CPF sob o nº 096.402.496-96, nascido em 14/12/1988, com filiação de LUIS ANTONIO ORLANDO e MARIA TEREZA VIEIRA ORLANDO, residente e domiciliado na cidade de Campinas/SP, e BARBARA SIMINATTI DOS SANTOS..."
        },
        { 
          name: "nomesResumidos", 
          label: "Nomes dos Locatários (para seção de dados)", 
          type: "text", 
          required: true, 
          placeholder: "Ex: DIOGO VIEIRA ORLANDO e BARBARA SIMINATTI DOS SANTOS"
        },
        { 
          name: "celularLocatario", 
          label: "Celular de Contato", 
          type: "tel", 
          required: true, 
          placeholder: "XX XXXXXXXXX",
          validation: (value) => {
            const cleaned = value.replace(/\D/g, '');
            if (value && cleaned.length !== 11) {
              return "Digite um celular válido com DDD";
            }
            return null;
          }
        },
        { 
          name: "emailLocatario", 
          label: "E-mail de Contato", 
          type: "email", 
          required: true, 
          placeholder: "email@exemplo.com"
        }
      ]
    },
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
          name: "nomeQuemRetira", 
          label: "Nome de Quem Retira a Chave", 
          type: "text", 
          required: true, 
          placeholder: "Nome completo de quem está retirando"
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
        }
      ]
    }
  ];

  // Funções para detectar plural e gênero
  const isPlural = (text: string) => {
    if (!text) return false;
    // Verifica se há vírgula (múltiplos nomes) ou conectores
    return text.includes(',') || text.includes(' e ') || text.includes(' E ');
  };

  const isFeminine = (text: string) => {
    if (!text) return false;
    
    // Se há múltiplas pessoas, verifica se a maioria é feminina
    if (isPlural(text)) {
      const nomes = text.split(',').map(nome => nome.trim());
      const femininos = nomes.filter(nome => isSingleFeminine(nome));
      return femininos.length > nomes.length / 2;
    }
    
    return isSingleFeminine(text);
  };

  const isSingleFeminine = (nome: string) => {
    const femaleNames = ['ana', 'maria', 'carla', 'sandra', 'patricia', 'fernanda', 'juliana', 'carolina', 'gabriela', 'mariana', 'barbara', 'vanir', 'claudia', 'lucia', 'andrea', 'paula', 'rita', 'rosa', 'vera', 'luana'];
    const maleNames = ['joão', 'jose', 'antonio', 'carlos', 'francisco', 'paulo', 'luis', 'marcos', 'rafael', 'pedro', 'daniel', 'ricardo', 'fernando', 'roberto', 'sergio', 'diego', 'diogo', 'victor'];
    
    const firstNameLower = nome.split(' ')[0].toLowerCase();
    
    // Se está na lista de nomes masculinos, é masculino
    if (maleNames.includes(firstNameLower)) {
      return false;
    }
    
    // Se está na lista de nomes femininos, é feminino
    if (femaleNames.includes(firstNameLower)) {
      return true;
    }
    
    // Como fallback, verifica se termina com 'a'
    return nome.toLowerCase().endsWith('a');
  };

  const getLocadorTerm = (nomeLocador: string) => {
    if (!nomeLocador) return 'LOCADOR';
    if (isPlural(nomeLocador)) {
      return 'LOCADORES';
    }
    return isFeminine(nomeLocador) ? 'LOCADORA' : 'LOCADOR';
  };

  const getLocatarioTerm = (nomeLocatario: string) => {
    if (!nomeLocatario) return 'LOCATÁRIO';
    if (isPlural(nomeLocatario)) {
      return 'LOCATÁRIOS';
    }
    return isFeminine(nomeLocatario) ? 'LOCATÁRIA' : 'LOCATÁRIO';
  };

  const getLocatarioFieldTitle = (nomeLocatario: string) => {
    if (!nomeLocatario) return 'Dados do Locatário';
    if (isPlural(nomeLocatario)) {
      return 'Dados dos Locatários';
    }
    return isFeminine(nomeLocatario) ? 'Dados da Locatária' : 'Dados do Locatário';
  };

  const getLocatarioPronoun = (nomeLocatario: string) => {
    if (!nomeLocatario) return 'ao';
    if (isPlural(nomeLocatario)) {
      return 'aos';
    }
    return isFeminine(nomeLocatario) ? 'à' : 'ao';
  };

  // Gera data atual automaticamente
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
    const titleSize = Math.max(fontSize + 2, 12); // Título um pouco maior
    const signatureSize = Math.max(fontSize - 2, 10); // Assinatura um pouco menor
    
    return `
<div style="text-align: center; margin-bottom: 20px; font-size: ${titleSize}px; font-weight: bold;">
TERMO DE RECEBIMENTO DE CHAVES {{numeroContrato}}
</div>

<div style="text-align: right; margin-bottom: 20px; font-size: ${fontSize}px;">
Valinhos, ${getCurrentDate()}.
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: ${fontSize}px;">
Pelo presente, recebemos as chaves do imóvel sito à <strong>{{endereco}}</strong>, ora locado <strong>{{qualificacaoLocatarios}}</strong>, devidamente qualificado no contrato de locação <strong>{{tipoContrato}}</strong> firmado em {{dataFirmamentoContrato}}.
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeLocador}}<br>
<strong>{{dadosLocatarioTitulo}}:</strong> {{nomesResumidos}}<br>
<strong>Celular:</strong> {{celularLocatario}} &nbsp;&nbsp;<strong>E-mail:</strong> {{emailLocatario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS (CPFL):</strong><br>
<strong>CPFL:</strong> {{cpfl}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{{tipoSegundaDocumento}}:</strong> {{segundoDocumento}}<br>
<br>
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade do Locatário.
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
( &nbsp; ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade do locatário. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
</div>

<div style="margin-top: 50px; text-align: center;">
<div style="margin-bottom: 40px;">
__________________________________________<br>
<span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
</div>

<div>
__________________________________________<br>
<span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{nomeGestor}}</span>
</div>
</div>
`;
  };

  const handleGenerate = (data: Record<string, string>) => {
    const isMultipleLocadores = isPlural(data.nomeLocador);
    
    // Detectar se há múltiplos locatários baseado nos nomes resumidos
    const isMultipleLocatarios = data.nomesResumidos && (
      data.nomesResumidos.includes(' e ') || 
      data.nomesResumidos.includes(',') ||
      data.nomesResumidos.split(' ').length > 2
    );
    
    // Adiciona termos inteligentes baseados nos nomes inseridos
    const enhancedData = {
      ...data,
      // Nome fixo do gestor
      nomeGestor: "VICTOR CAIN JORGE",
      
      // Termos inteligentes para locadores
      locadorTerm: getLocadorTerm(data.nomeLocador),
      
      // Título dinâmico para seção de dados do locatário
      dadosLocatarioTitulo: isMultipleLocatarios ? "DADOS DOS LOCATÁRIOS" : "DADOS DO LOCATÁRIO",
      
      // Formatar celular sem máscara para ficar igual ao exemplo real
      celularLocatario: data.celularLocatario?.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '$1 $2$3') || data.celularLocatario
    };
    
    console.log("Documento gerado:", enhancedData);
    return enhancedData;
  };

  return (
    <DocumentFormWizard
      title="Termo de Recebimento de Chaves - Inquilino"
      description="Documento para formalizar o recebimento de chaves pelo inquilino"
      steps={steps}
      template={getTemplate(14)}
      getTemplate={getTemplate}
      onGenerate={handleGenerate}
    />
  );
};

export default TermoInquilino;