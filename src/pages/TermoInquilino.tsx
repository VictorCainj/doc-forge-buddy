import DocumentForm from "@/components/DocumentForm";

const TermoInquilino = () => {
  const fields = [
    { name: "nomeInquilino", label: "Nome do Inquilino", type: "text" as const, required: true, placeholder: "Nome completo do inquilino" },
    { name: "nomeProprietario", label: "Nome do Proprietário", type: "text" as const, required: true, placeholder: "Nome completo do proprietário" },
    { name: "endereco", label: "Endereço do Imóvel", type: "textarea" as const, required: true, placeholder: "Endereço completo do imóvel" },
    { name: "quantidadeChaves", label: "Quantidade de Chaves", type: "number" as const, required: true, placeholder: "Ex: 3" },
    { name: "dataEntrega", label: "Data de Entrega", type: "text" as const, required: true, placeholder: "Ex: 15/01/2024" },
    { name: "observacoes", label: "Observações", type: "textarea" as const, placeholder: "Observações adicionais (opcional)" }
  ];

  const template = `
**TERMO DE ENTREGA DE CHAVES - INQUILINO**

Eu, **{{nomeProprietario}}**, proprietário do imóvel localizado no endereço **{{endereco}}**, declaro que entreguei ao inquilino **{{nomeInquilino}}** um total de **{{quantidadeChaves}}** chave(s) do referido imóvel.

**Data da Entrega:** {{dataEntrega}}

**Endereço do Imóvel:** {{endereco}}

**Quantidade de Chaves Entregues:** {{quantidadeChaves}} unidade(s)

**Observações:** {{observacoes}}

O inquilino se compromete a devolver todas as chaves em perfeito estado no término do contrato de locação, sob pena de arcar com os custos de substituição das fechaduras.

Este documento serve como comprovante da entrega das chaves e faz parte integrante do contrato de locação.

____________________                           ____________________
{{nomeProprietario}}                           {{nomeInquilino}}
(Proprietário)                                 (Inquilino)

Data: {{dataEntrega}}
  `;

  const handleGenerate = (data: Record<string, string>) => {
    console.log("Documento gerado:", data);
  };

  return (
    <DocumentForm
      title="Termo de Entrega de Chaves - Inquilino"
      description="Documento para formalizar a entrega de chaves ao inquilino"
      fields={fields}
      template={template}
      onGenerate={handleGenerate}
    />
  );
};

export default TermoInquilino;