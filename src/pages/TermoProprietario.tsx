import DocumentForm from "@/components/DocumentForm";

const TermoProprietario = () => {
  const fields = [
    { name: "nomeProprietario", label: "Nome do Proprietário", type: "text" as const, required: true, placeholder: "Nome completo do proprietário" },
    { name: "nomeInquilino", label: "Nome do Inquilino", type: "text" as const, required: true, placeholder: "Nome completo do inquilino" },
    { name: "endereco", label: "Endereço do Imóvel", type: "textarea" as const, required: true, placeholder: "Endereço completo do imóvel" },
    { name: "quantidadeChaves", label: "Quantidade de Chaves", type: "number" as const, required: true, placeholder: "Ex: 3" },
    { name: "dataRecebimento", label: "Data de Recebimento", type: "text" as const, required: true, placeholder: "Ex: 15/01/2024" },
    { name: "observacoes", label: "Observações", type: "textarea" as const, placeholder: "Observações adicionais (opcional)" }
  ];

  const template = `
**TERMO DE RECEBIMENTO DE CHAVES - PROPRIETÁRIO**

Eu, **{{nomeProprietario}}**, proprietário do imóvel localizado no endereço **{{endereco}}**, declaro que recebi do inquilino **{{nomeInquilino}}** um total de **{{quantidadeChaves}}** chave(s) do referido imóvel.

**Data do Recebimento:** {{dataRecebimento}}

**Endereço do Imóvel:** {{endereco}}

**Quantidade de Chaves Recebidas:** {{quantidadeChaves}} unidade(s)

**Estado das Chaves:** Em perfeito estado de conservação e funcionamento.

**Observações:** {{observacoes}}

O proprietário declara que as chaves foram entregues em perfeito estado pelo inquilino, ficando este isento de qualquer responsabilidade relacionada aos custos de substituição ou reparo das fechaduras.

Este documento serve como comprovante do recebimento das chaves e da finalização das obrigações contratuais relacionadas à entrega do imóvel.

____________________                           ____________________
{{nomeProprietario}}                           {{nomeInquilino}}
(Proprietário)                                 (Inquilino)

Data: {{dataRecebimento}}
  `;

  const handleGenerate = (data: Record<string, string>) => {
    console.log("Documento gerado:", data);
  };

  return (
    <DocumentForm
      title="Termo de Entrega de Chaves - Proprietário"
      description="Documento para formalizar o recebimento de chaves pelo proprietário"
      fields={fields}
      template={template}
      onGenerate={handleGenerate}
    />
  );
};

export default TermoProprietario;