import DocumentForm from "@/components/DocumentForm";

const TermoInquilino = () => {
  const fields = [
    { name: "numeroTermo", label: "Número do Termo", type: "text" as const, required: true, placeholder: "Ex: 14021" },
    { name: "cidade", label: "Cidade", type: "text" as const, required: true, placeholder: "Ex: Valinhos" },
    { name: "dataRecebimento", label: "Data de Recebimento", type: "text" as const, required: true, placeholder: "Ex: 28 de agosto de 2025" },
    { name: "endereco", label: "Endereço do Imóvel", type: "textarea" as const, required: true, placeholder: "Endereço completo do imóvel" },
    { name: "nomeLocatario", label: "Nome do Locatário", type: "text" as const, required: true, placeholder: "Nome completo do locatário" },
    { name: "dataContrato", label: "Data de Firmamento do Contrato", type: "text" as const, required: true, placeholder: "Ex: 15 de janeiro de 2024" },
    { name: "nomeLocador", label: "Nome do Locador", type: "text" as const, required: true, placeholder: "Nome completo do locador" },
    { name: "celularLocatario", label: "Celular do Locatário", type: "text" as const, required: true, placeholder: "Ex: (19) 99999-9999" },
    { name: "emailLocatario", label: "E-mail do Locatário", type: "text" as const, required: true, placeholder: "email@exemplo.com" },
    { name: "cpfl", label: "CPFL Apresentada", type: "text" as const, required: true, placeholder: "SIM ou NÃO" },
    { name: "daev", label: "DAEV Apresentada", type: "text" as const, required: true, placeholder: "SIM ou NÃO" },
    { name: "tipoQuantidadeChaves", label: "Tipo e Quantidade de Chaves", type: "textarea" as const, required: true, placeholder: "Ex: 3 chaves da porta principal, 2 chaves do portão" },
    { name: "dataVistoria", label: "Data da Vistoria", type: "text" as const, required: true, placeholder: "Ex: 28/08/2025" },
    { name: "condicaoImovel", label: "Condição do Imóvel", type: "text" as const, required: true, placeholder: "De acordo com vistoria inicial ou Não conforme" },
    { name: "nomeQuemRetira", label: "Nome de Quem Retira a Chave", type: "text" as const, required: true, placeholder: "Nome completo" }
  ];

  const template = `
**TERMO DE RECEBIMENTO DE CHAVES – {{numeroTermo}}**

{{cidade}}, {{dataRecebimento}}.

Pelo presente, recebemos as chaves do imóvel sito à **{{endereco}}**, ora locado **{{nomeLocatario}}**, devidamente qualificados no contrato de locação residencial firmado em **{{dataContrato}}**.

**LOCADOR DO IMÓVEL:** {{nomeLocador}}
**DADOS DOS LOCATÁRIOS:** {{nomeLocatario}}
**Celular:** {{celularLocatario}} **E-mail:** {{emailLocatario}}

**COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS (CPFL):**
**CPFL:** {{cpfl}}                     **DAEV:** {{daev}}
**OBS:** Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade do Locatário.

**Entregue na Madia Imóveis a relação de chaves:**
Foi entregue **{{tipoQuantidadeChaves}}**

**Vistoria realizada em** {{dataVistoria}}

**Condição do imóvel:** {{condicaoImovel}}

(  ) Imóvel entregue de acordo com a vistoria inicial
(  ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade do locatário. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.


                                          __________________________________________
                                                       {{nomeQuemRetira}}

________________________________________
  VICTOR CAIN JORGE
  `;

  const handleGenerate = (data: Record<string, string>) => {
    console.log("Documento gerado:", data);
  };

  return (
    <DocumentForm
      title="Termo de Recebimento de Chaves - Inquilino"
      description="Documento para formalizar o recebimento de chaves pelo inquilino"
      fields={fields}
      template={template}
      onGenerate={handleGenerate}
    />
  );
};

export default TermoInquilino;