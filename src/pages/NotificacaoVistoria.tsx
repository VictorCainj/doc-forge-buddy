import DocumentForm from "@/components/DocumentForm";

const NotificacaoVistoria = () => {
  const fields = [
    { name: "nomeInquilino", label: "Nome do Inquilino", type: "text" as const, required: true, placeholder: "Nome completo do inquilino" },
    { name: "nomeProprietario", label: "Nome do Proprietário", type: "text" as const, required: true, placeholder: "Nome completo do proprietário" },
    { name: "endereco", label: "Endereço do Imóvel", type: "textarea" as const, required: true, placeholder: "Endereço completo do imóvel" },
    { name: "dataVistoria", label: "Data da Vistoria", type: "text" as const, required: true, placeholder: "Ex: 20/01/2024" },
    { name: "horarioVistoria", label: "Horário da Vistoria", type: "text" as const, required: true, placeholder: "Ex: 14:00" },
    { name: "finalidade", label: "Finalidade da Vistoria", type: "text" as const, required: true, placeholder: "Ex: Vistoria de entrada, saída, rotina" },
    { name: "observacoes", label: "Observações", type: "textarea" as const, placeholder: "Informações adicionais (opcional)" }
  ];

  const template = `
**NOTIFICAÇÃO DE AGENDAMENTO DE VISTORIA**

**PARA:** {{nomeInquilino}}
**ENDEREÇO DO IMÓVEL:** {{endereco}}

Por meio desta notificação, informamos que foi agendada uma vistoria no imóvel acima mencionado, conforme as informações abaixo:

**DADOS DA VISTORIA:**

**Data:** {{dataVistoria}}
**Horário:** {{horarioVistoria}}
**Finalidade:** {{finalidade}}

**INFORMAÇÕES IMPORTANTES:**

1. A presença do inquilino ou de seu representante legal é **obrigatória** durante a realização da vistoria.

2. Caso não seja possível comparecer na data e horário agendados, entre em contato conosco com antecedência mínima de 24 horas para reagendamento.

3. A vistoria tem por objetivo verificar as condições gerais do imóvel e registrar eventuais danos ou necessidades de manutenção.

4. Solicitamos que o imóvel esteja em condições adequadas para a realização da vistoria, com acesso livre a todas as dependências.

**Observações:** {{observacoes}}

**CONTATO PARA REAGENDAMENTO:**
Em caso de impossibilidade de comparecimento, entre em contato através dos canais de comunicação disponibilizados no contrato de locação.

Atenciosamente,

____________________
{{nomeProprietario}}
Proprietário/Administrador

Data da Notificação: ________________
  `;

  const handleGenerate = (data: Record<string, string>) => {
    console.log("Documento gerado:", data);
  };

  return (
    <DocumentForm
      title="Notificação de Agendamento de Vistoria"
      description="Notificação oficial para agendamento de vistoria no imóvel"
      fields={fields}
      template={template}
      onGenerate={handleGenerate}
    />
  );
};

export default NotificacaoVistoria;