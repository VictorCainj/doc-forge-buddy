import DocumentForm from "@/components/DocumentForm";

const TermoInquilino = () => {
  const fields = [
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
    { name: "tipoQuantidadeChaves", label: "Tipo e Quantidade de Chaves", type: "textarea" as const, required: true, placeholder: "Ex: 04 chaves simples" },
    { name: "dataVistoria", label: "Data da Vistoria", type: "text" as const, required: true, placeholder: "Ex: 28/08/2025" },
    { name: "nomeQuemRetira", label: "Nome de Quem Retira a Chave", type: "text" as const, required: true, placeholder: "Nome completo" }
  ];

  const template = `
<div style="text-align: right; margin-bottom: 20px;">{{cidade}}, {{dataRecebimento}}.</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px;">
Pelo presente, recebemos as chaves do imóvel sito à {{endereco}}, ora locado {{nomeLocatario}}, devidamente qualificados no contrato de locação residencial firmado em {{dataContrato}}.
</div>

<div style="margin: 20px 0;">
<strong>LOCADOR DO IMÓVEL:</strong> {{nomeLocador}}<br>
<strong>DADOS DOS LOCATÁRIOS:</strong> {{nomeLocatario}}<br>
<strong>Celular:</strong> {{celularLocatario}} <strong>E-mail:</strong> {{emailLocatario}}
</div>

<div style="margin: 20px 0;">
<strong>COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS (CPFL):</strong><br>
<strong>CPFL:</strong> {{cpfl}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>DAEV:</strong> {{daev}}<br>
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade do Locatário.
</div>

<div style="margin: 20px 0;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{tipoQuantidadeChaves}}
</div>

<div style="margin: 20px 0;">
<strong>Vistoria realizada em</strong> {{dataVistoria}}
</div>

<div style="margin: 30px 0;">
(  ) Imóvel entregue de acordo com a vistoria inicial<br>
(  ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade do locatário. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
</div>

<div style="margin-top: 80px;">
<div style="text-align: right; margin-bottom: 10px;">
__________________________________________<br>
{{nomeQuemRetira}}
</div>

<div style="margin-top: 40px;">
________________________________________<br>
VICTOR CAIN JORGE
</div>
</div>
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