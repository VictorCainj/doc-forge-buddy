import React from 'react';
import DocumentFormWizard from "@/components/DocumentFormWizard";
import { FormStep } from "@/hooks/use-form-wizard";
import { Home, Users, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CadastrarContrato = () => {
  const navigate = useNavigate();

  const steps: FormStep[] = [
    {
      id: "contrato",
      title: "Dados do Contrato",
      description: "Informações essenciais do contrato",
      icon: FileText,
      fields: [
        {
          name: "numeroContrato",
          label: "Número do Contrato",
          type: "text",
          required: true,
          placeholder: "Ex: 13734"
        },
        {
          name: "nomeLocatario",
          label: "Nome do Locatário",
          type: "text",
          required: true,
          placeholder: "Ex: Beatriz ou INSERVICE LIMPEZA E INFRA-ESTRUTURA LTDA"
        },
        {
          name: "generoLocatario",
          label: "Gênero do Locatário",
          type: "select",
          required: true,
          options: [
            { value: "masculino", label: "Masculino" },
            { value: "feminino", label: "Feminino" },
            { value: "neutro", label: "Neutro (múltiplos locatários)" }
          ]
        },
        {
          name: "enderecoImovel",
          label: "Endereço do Imóvel",
          type: "text",
          required: true,
          placeholder: "Endereço completo do imóvel"
        },
        {
          name: "dataFirmamentoContrato",
          label: "Data de Firmamento do Contrato",
          type: "text",
          required: true,
          placeholder: "Ex: 15/10/2024 ou 15 de outubro de 2024"
        }
      ]
    },
    {
      id: "proprietario",
      title: "Dados do Proprietário",
      description: "Informações do proprietário para devolutiva",
      icon: Users,
      fields: [
        {
          name: "nomeProprietario",
          label: "Nome do Proprietário",
          type: "text",
          required: true,
          placeholder: "Ex: Sr João"
        },
        {
          name: "emailProprietario",
          label: "E-mail do Proprietário",
          type: "email",
          required: true,
          placeholder: "email@exemplo.com"
        },
        {
          name: "generoProprietario",
          label: "Gênero do Proprietário",
          type: "select",
          required: true,
          options: [
            { value: "masculino", label: "Masculino" },
            { value: "feminino", label: "Feminino" },
            { value: "neutro", label: "Neutro (múltiplos proprietários)" }
          ]
        }
      ]
    },
    {
      id: "desocupacao",
      title: "Dados de Desocupação",
      description: "Informações para processo de desocupação",
      icon: Calendar,
      fields: [
        {
          name: "dataInicioDesocupacao",
          label: "Data de Início da Desocupação",
          type: "text",
          required: true,
          placeholder: "DD/MM/AAAA - Ex: 23/06/2025"
        },
        {
          name: "dataTerminoDesocupacao",
          label: "Data de Término da Desocupação",
          type: "text",
          required: true,
          placeholder: "DD/MM/AAAA - Ex: 22/07/2025"
        }
      ]
    }
  ];

  const handleGenerate = async (data: Record<string, string>) => {
    try {
      // Adicionar campos automáticos
      const enhancedData = {
        ...data,
        prazoDias: "30", // Sempre 30 dias
        dataComunicacao: data.dataInicioDesocupacao // Data de comunicação = data de início
      };

      // Salvar o contrato no banco de dados usando a tabela saved_terms
      const contractData = {
        title: `Contrato ${enhancedData.numeroContrato} - ${enhancedData.nomeLocatario}`,
        content: JSON.stringify(enhancedData), // Armazenar dados como JSON
        form_data: enhancedData,
        document_type: 'contrato'
      };

      const { error } = await supabase
        .from('saved_terms')
        .insert(contractData);

      if (error) throw error;
      
      toast.success("Contrato cadastrado com sucesso!");
      navigate('/contratos');
    } catch (error) {
      toast.error("Erro ao cadastrar contrato");
    }
  };

  // Template vazio para o cadastro (não gera documento)
  const getTemplate = () => "";

  return (
    <DocumentFormWizard
      title="Cadastrar Novo Contrato"
      description="Preencha as informações essenciais para gerar os documentos de notificação de desocupação e devolutiva do proprietário"
      steps={steps}
      template=""
      onGenerate={handleGenerate}
    />
  );
};

export default CadastrarContrato;