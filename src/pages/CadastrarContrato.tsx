import React, { useState } from 'react';
import DocumentFormWizard from "@/components/DocumentFormWizard";
import { FormStep } from "@/hooks/use-form-wizard";
import { Home, Users, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const CadastrarContrato = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});


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
        },
        {
          name: "qualificacaoCompletaLocatarios",
          label: "Qualificação Completa dos Locatários",
          type: "textarea",
          required: false,
          placeholder: "Ex: DIOGO VIEIRA ORLANDO, brasileiro, divorciado, engenheiro ambiental, portador do RG. nº MG-14.837.051 SSP/MG, e inscrito no CPF sob o nº 096.402.496-96, nascido em 14/12/1988, com filiação de LUIS ANTONIO ORLANDO e MARIA TEREZA VIEIRA ORLANDO, residente e domiciliado na cidade de Campinas/SP, e BARBARA SIMINATTI DOS SANTOS, brasileira, solteira, servidora pública, portadora do RG. nº 36.153.912-5 SSP/SP, e inscrita no CPF sob o nº 395.076.738-06, nascida em 02/07/1990, com filiação de VALDIR CORREIA DOS SANTOS e VANIR SIMINATTI DOS SANTOS, residente e domiciliada na cidade de Campinas/SP"
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
      icon: FileText,
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
          placeholder: "DD/MM/AAAA - Ex: 22/07/2025",
          tooltip: "Preencha manualmente ou use o botão 'Calcular Automaticamente' (início + 29 dias)"
        }
      ]
    }
  ];

  // Função para lidar com mudanças no formulário
  const handleFormChange = (data: Record<string, string>) => {
    setFormData(data);
  };

  const handleGenerate = async (data: Record<string, string>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Adicionar campos automáticos
      const enhancedData = {
        ...data,
        prazoDias: "30", // Sempre 30 dias
        dataComunicacao: data.dataInicioDesocupacao // Data de comunicação = data de início
      };

      // Salvar o contrato no banco de dados usando a tabela saved_terms
      const contractData = {
        title: `Contrato ${data.numeroContrato || '[NÚMERO]'} - ${data.nomeLocatario || '[LOCATÁRIO]'}`,
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
      
      return enhancedData;
    } catch (error) {
      toast.error("Erro ao cadastrar contrato");
      console.error("Erro ao cadastrar contrato:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Template vazio para o cadastro (não gera documento)
  const getTemplate = () => "";

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Cadastrar Novo Contrato</h1>
            <p className="text-muted-foreground">
              Preencha as informações essenciais para gerar os documentos de notificação de desocupação e devolutiva do proprietário
            </p>
          </div>
          
          
          <DocumentFormWizard
            title=""
            description=""
            steps={steps}
            template=""
            onGenerate={handleGenerate}
            onFormDataChange={handleFormChange}
            isSubmitting={isSubmitting}
            submitButtonText={isSubmitting ? "Cadastrando..." : "Cadastrar Contrato"}
            externalFormData={formData}
          />
        </div>
      </div>
    </div>
  );
};

export default CadastrarContrato;