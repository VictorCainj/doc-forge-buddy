import React from 'react';
import DocumentFormWizard from "@/components/DocumentFormWizard";
import { FormStep } from "@/hooks/use-form-wizard";
import { Home, Users, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CadastrarContrato = () => {
  const navigate = useNavigate();

  const steps: FormStep[] = [
    {
      id: "imovel",
      title: "Dados do Imóvel",
      description: "Informações básicas do imóvel",
      icon: Home,
      fields: [
        {
          name: "numeroContrato",
          label: "Número do Contrato",
          type: "text",
          required: true,
          placeholder: "Ex: 2024/001"
        },
        {
          name: "endereco",
          label: "Endereço Completo",
          type: "text",
          required: true,
          placeholder: "Rua, número, bairro, cidade"
        },
        {
          name: "cep",
          label: "CEP",
          type: "text",
          required: true,
          mask: "#####-###",
          placeholder: "00000-000"
        },
        {
          name: "tipoImovel",
          label: "Tipo do Imóvel",
          type: "select",
          required: true,
          options: [
            { value: "casa", label: "Casa" },
            { value: "apartamento", label: "Apartamento" },
            { value: "comercial", label: "Comercial" },
            { value: "terreno", label: "Terreno" }
          ]
        }
      ]
    },
    {
      id: "proprietario",
      title: "Dados do Proprietário",
      description: "Informações do proprietário do imóvel",
      icon: Users,
      fields: [
        {
          name: "nomeProprietario",
          label: "Nome do Proprietário",
          type: "text",
          required: true,
          placeholder: "Nome completo"
        },
        {
          name: "cpfProprietario",
          label: "CPF",
          type: "text",
          required: true,
          mask: "###.###.###-##",
          placeholder: "000.000.000-00"
        },
        {
          name: "telefoneProprietario",
          label: "Telefone",
          type: "text",
          required: true,
          mask: "(##) #####-####",
          placeholder: "(00) 00000-0000"
        },
        {
          name: "emailProprietario",
          label: "E-mail",
          type: "email",
          required: true,
          placeholder: "email@exemplo.com"
        }
      ]
    },
    {
      id: "inquilino",
      title: "Dados do Inquilino",
      description: "Informações do inquilino atual",
      icon: Users,
      fields: [
        {
          name: "nomeInquilino",
          label: "Nome do Inquilino",
          type: "text",
          required: true,
          placeholder: "Nome completo"
        },
        {
          name: "cpfInquilino",
          label: "CPF",
          type: "text",
          required: true,
          mask: "###.###.###-##",
          placeholder: "000.000.000-00"
        },
        {
          name: "telefoneInquilino",
          label: "Telefone",
          type: "text",
          required: true,
          mask: "(##) #####-####",
          placeholder: "(00) 00000-0000"
        },
        {
          name: "emailInquilino",
          label: "E-mail",
          type: "email",
          required: true,
          placeholder: "email@exemplo.com"
        }
      ]
    },
    {
      id: "contrato",
      title: "Dados do Contrato",
      description: "Informações contratuais",
      icon: FileText,
      fields: [
        {
          name: "dataInicio",
          label: "Data de Início",
          type: "text",
          required: true,
          placeholder: "DD/MM/AAAA"
        },
        {
          name: "dataVencimento",
          label: "Data de Vencimento",
          type: "text",
          required: true,
          placeholder: "DD/MM/AAAA"
        },
        {
          name: "valorAluguel",
          label: "Valor do Aluguel",
          type: "text",
          required: true,
          placeholder: "R$ 0,00"
        },
        {
          name: "observacoes",
          label: "Observações",
          type: "textarea",
          required: false,
          placeholder: "Informações adicionais sobre o contrato"
        }
      ]
    }
  ];

  const handleGenerate = (data: Record<string, string>) => {
    try {
      // Aqui você salvaria o contrato no banco de dados
      console.log('Dados do contrato:', data);
      
      toast.success("Contrato cadastrado com sucesso!");
      navigate('/contratos');
    } catch (error) {
      toast.error("Erro ao cadastrar contrato");
      console.error('Erro:', error);
    }
  };

  // Template vazio para o cadastro (não gera documento)
  const getTemplate = () => "";

  return (
    <DocumentFormWizard
      title="Cadastrar Novo Contrato"
      description="Preencha as informações do contrato para ter acesso a todos os processos de desocupação"
      steps={steps}
      template=""
      onGenerate={handleGenerate}
    />
  );
};

export default CadastrarContrato;