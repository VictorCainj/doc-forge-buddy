import DocumentForm from "@/components/DocumentForm";

const TermoInquilino = () => {
  const fieldGroups = [
    {
      title: "Dados do Imóvel",
      fields: [
        { name: "endereco", label: "Endereço do Imóvel", type: "textarea" as const, required: true, placeholder: "Endereço completo do imóvel" },
        { name: "dataContrato", label: "Data de Firmamento do Contrato", type: "text" as const, required: true, placeholder: "Ex: 15 de janeiro de 2024" }
      ]
    },
    {
      title: "Dados do Locador",
      fields: [
        { name: "nomeLocador", label: "Nome do Locador", type: "text" as const, required: true, placeholder: "Nome completo do locador" }
      ]
    },
    {
      title: "Dados do Locatário",
      getDynamicTitle: (formData) => getLocatarioFieldTitle(formData.nomeLocatario),
      fields: [
        { name: "nomeLocatario", label: "Nome do Locatário", type: "text" as const, required: true, placeholder: "Nome completo do locatário" },
        { name: "celularLocatario", label: "Celular do Locatário", type: "text" as const, required: true, placeholder: "Ex: (19) 99999-9999" },
        { name: "emailLocatario", label: "E-mail do Locatário", type: "text" as const, required: true, placeholder: "email@exemplo.com" }
      ]
    },
    {
      title: "Documentos Apresentados",
      fields: [
        { name: "cpfl", label: "CPFL Apresentada", type: "text" as const, required: true, placeholder: "SIM ou NÃO" },
        { name: "daev", label: "DAEV Apresentada", type: "text" as const, required: true, placeholder: "SIM ou NÃO" }
      ]
    },
    {
      title: "Vistoria e Entrega",
      fields: [
        { name: "tipoQuantidadeChaves", label: "Tipo e Quantidade de Chaves", type: "textarea" as const, required: true, placeholder: "Ex: 04 chaves simples" },
        { name: "dataVistoria", label: "Data da Vistoria", type: "text" as const, required: true, placeholder: "Ex: 28/08/2025" },
        { name: "nomeQuemRetira", label: "Nome de Quem Retira a Chave", type: "text" as const, required: true, placeholder: "Nome completo" },
        { name: "nomeGestor", label: "Nome do Gestor", type: "text" as const, required: true, placeholder: "Ex: Victor Cain Jorge" }
      ]
    }
  ];

  // Funções para detectar plural e gênero
  const isPlural = (text: string) => {
    return text.includes(',') || text.includes(' e ') || text.includes(' E ');
  };

  const isFeminine = (text: string) => {
    const femaleNames = ['ana', 'maria', 'carla', 'sandra', 'patricia', 'fernanda', 'juliana', 'carolina', 'gabriela', 'mariana'];
    const firstNameLower = text.split(' ')[0].toLowerCase();
    return text.toLowerCase().endsWith('a') || femaleNames.includes(firstNameLower);
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

  const template = `
<div style="text-align: right; margin-bottom: 15px; font-size: 14px;">Valinhos, ${getCurrentDate()}.</div>

<div style="text-align: justify; line-height: 1.4; margin-bottom: 12px; font-size: 14px;">
Pelo presente, recebemos as chaves do imóvel sito à {{endereco}}, ora locado {{locatarioPronoun}} {{nomeLocatario}}, devidamente qualificados no contrato de locação residencial firmado em {{dataContrato}}.
</div>

<div style="margin: 12px 0; font-size: 13px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeLocador}}<br>
<strong>{{locatarioFieldTitle}}:</strong> {{nomeLocatario}}<br>
<strong>Celular:</strong> {{celularLocatario}} <strong>E-mail:</strong> {{emailLocatario}}
</div>

<div style="margin: 12px 0; font-size: 13px;">
<strong>COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS (CPFL):</strong><br>
<strong>CPFL:</strong> {{cpfl}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>DAEV:</strong> {{daev}}<br>
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade do Locatário.
</div>

<div style="margin: 12px 0; font-size: 13px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{tipoQuantidadeChaves}}
</div>

<div style="margin: 12px 0; font-size: 13px;">
<strong>Vistoria realizada em</strong> {{dataVistoria}}
</div>

<div style="margin: 15px 0; font-size: 13px;">
(  ) Imóvel entregue de acordo com a vistoria inicial<br>
(  ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade do locatário. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
</div>

<div style="margin-top: 40px; text-align: center;">
<div style="margin-bottom: 30px;">
__________________________________________<br>
<span style="font-size: 12px;">{{nomeQuemRetira}}</span>
</div>

<div>
________________________________________<br>
<span style="font-size: 12px;">{{nomeGestor}}</span>
</div>
</div>
  `;

  const handleGenerate = (data: Record<string, string>) => {
    // Adiciona termos inteligentes baseados nos nomes inseridos
    const enhancedData = {
      ...data,
      locadorTerm: getLocadorTerm(data.nomeLocador),
      locatarioTerm: getLocatarioTerm(data.nomeLocatario),
      locatarioFieldTitle: getLocatarioFieldTitle(data.nomeLocatario),
      locatarioPronoun: getLocatarioPronoun(data.nomeLocatario)
    };
    console.log("Documento gerado:", enhancedData);
    return enhancedData;
  };

  return (
    <DocumentForm
      title="Termo de Recebimento de Chaves - Inquilino"
      description="Documento para formalizar o recebimento de chaves pelo inquilino"
      fieldGroups={fieldGroups}
      template={template}
      onGenerate={handleGenerate}
    />
  );
};

export default TermoInquilino;