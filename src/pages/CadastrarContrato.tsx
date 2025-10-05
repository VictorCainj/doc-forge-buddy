import React, { useState, useEffect, useCallback } from 'react';
import DocumentFormWizard from '@/components/DocumentFormWizard';
import { FormStep } from '@/hooks/use-form-wizard';
import {
  Users,
  Building2,
  UserCheck,
  Shield,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

const CadastrarContrato = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  // Estados para modo de edição
  const [isEditMode, setIsEditMode] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

  // Detectar modo de edição e carregar dados uma única vez
  useEffect(() => {
    const state = location.state as {
      editMode?: boolean;
      contractId?: string;
      contractData?: Record<string, string>;
    };

    if (state?.editMode && state?.contractId && state?.contractData) {
      setIsEditMode(true);
      setContractId(state.contractId);
      
      // Mapear campos para garantir compatibilidade
      const mappedData = {
        ...state.contractData,
        // Garantir que nomeProprietario seja usado (pode vir como nomesResumidosLocadores)
        nomeProprietario: state.contractData.nomeProprietario || state.contractData.nomesResumidosLocadores || '',
      };
      
      setFormData(mappedData);
    }
  }, [location.state]);

  const steps: FormStep[] = [
    {
      id: 'contrato',
      title: 'Dados do Contrato',
      description: 'Informações essenciais do contrato',
      icon: Building2,
      fields: [
        {
          name: 'numeroContrato',
          label: 'Número do Contrato',
          type: 'text',
          required: true,
          placeholder: 'Ex: 13734',
        },
        {
          name: 'enderecoImovel',
          label: 'Endereço do Imóvel',
          type: 'text',
          required: true,
          placeholder: 'Endereço completo do imóvel',
        },
        {
          name: 'dataFirmamentoContrato',
          label: 'Data de Firmamento do Contrato',
          type: 'text',
          required: true,
          placeholder: 'Ex: 15/10/2024 ou 15 de outubro de 2024',
        },
        {
          name: 'incluirQuantidadeChaves',
          label: 'Incluir quantidade de chaves no contrato?',
          type: 'select',
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Incluir quantidade de chaves' },
            { value: 'nao', label: 'Não - Não incluir quantidade de chaves' },
          ],
        },
        {
          name: 'quantidadeChaves',
          label: 'Quantidade e tipo de chaves',
          type: 'textarea',
          required: false,
          placeholder: 'Ex: 04 chaves simples, 02 chaves tetra',
        },
      ],
    },
    {
      id: 'locador',
      title: 'Qualificação dos Locadores',
      description: 'Adicione os locadores do contrato',
      icon: UserCheck,
      fields: [
        {
          name: 'generoProprietario',
          label: 'Gênero dos Locadores',
          type: 'select',
          required: true,
          options: [
            { value: 'masculino', label: 'Masculino' },
            { value: 'feminino', label: 'Feminino' },
            { value: 'masculinos', label: 'Masculinos (plural)' },
            { value: 'femininos', label: 'Femininos (plural)' },
          ],
        },
        {
          name: 'nomeProprietario',
          label: 'Nome dos Locadores',
          type: 'textarea',
          required: true,
          placeholder: 'Nome completo dos locadores',
        },
        {
          name: 'qualificacaoCompletaLocadores',
          label: 'Qualificação Completa dos Locadores',
          type: 'textarea',
          required: true,
          placeholder: 'Qualificação completa dos locadores conforme contrato',
        },
      ],
    },
    {
      id: 'locatario',
      title: 'Qualificação dos Locatários',
      description: 'Adicione os locatários do contrato',
      icon: Users,
      fields: [
        {
          name: 'nomeLocatario',
          label: 'Nome dos Locatários',
          type: 'textarea',
          required: true,
          placeholder: 'Nome completo dos locatários',
        },
        {
          name: 'generoLocatario',
          label: 'Gênero dos Locatários',
          type: 'select',
          required: true,
          options: [
            { value: 'masculino', label: 'Masculino' },
            { value: 'feminino', label: 'Feminino' },
            { value: 'masculinos', label: 'Masculinos (plural)' },
            { value: 'femininos', label: 'Femininos (plural)' },
          ],
        },
        {
          name: 'qualificacaoCompletaLocatarios',
          label: 'Qualificação Completa dos Locatários',
          type: 'textarea',
          required: false,
          placeholder:
            'Ex: DIOGO VIEIRA ORLANDO, brasileiro, divorciado, engenheiro ambiental, portador do RG. nº MG-14.837.051 SSP/MG, e inscrito no CPF sob o nº 096.402.496-96, nascido em 14/12/1988, com filiação de LUIS ANTONIO ORLANDO e MARIA TEREZA VIEIRA ORLANDO, residente e domiciliado na cidade de Campinas/SP, e BARBARA SIMINATTI DOS SANTOS, brasileira, solteira, servidora pública, portadora do RG. nº 36.153.912-5 SSP/SP, e inscrita no CPF sob o nº 395.076.738-06, nascida em 02/07/1990, com filiação de VALDIR CORREIA DOS SANTOS e VANIR SIMINATTI DOS SANTOS, residente e domiciliada na cidade de Campinas/SP',
        },
        {
          name: 'emailLocatario',
          label: 'E-mail do Locatário',
          type: 'text',
          required: true,
          placeholder: 'Ex: locatario@email.com',
        },
        {
          name: 'celularLocatario',
          label: 'Celular do Locatário',
          type: 'text',
          required: true,
          placeholder: 'Ex: (19) 99999-9999',
        },
      ],
    },
    {
      id: 'fiador',
      title: 'Fiadores',
      description: 'Adicione os fiadores do contrato (opcional)',
      icon: Shield,
      fields: [
        {
          name: 'temFiador',
          label: 'Contrato possui fiador?',
          type: 'select',
          required: true,
          options: [
            { value: 'nao', label: 'Não - Sem fiador' },
            { value: 'sim', label: 'Sim - Com fiador' },
          ],
        },
      ],
    },
    {
      id: 'rescisao',
      title: 'Dados de Rescisão',
      description: 'Informações para processo de rescisão',
      icon: Calendar,
      fields: [
        {
          name: 'dataInicioRescisao',
          label: 'Data de Início da Rescisão',
          type: 'text',
          required: true,
          placeholder: 'DD/MM/AAAA - Ex: 23/06/2025',
        },
        {
          name: 'dataTerminoRescisao',
          label: 'Data de Término da Rescisão',
          type: 'text',
          required: true,
          placeholder: 'DD/MM/AAAA - Ex: 22/07/2025',
          tooltip:
            "Preencha manualmente ou use o botão 'Calcular Automaticamente' (início + 29 dias)",
        },
      ],
    },
    {
      id: 'documentos',
      title: 'Documentos Solicitados',
      description:
        'Configure quais documentos devem ser solicitados na devolutiva locatário (energia elétrica sempre é solicitada)',
      icon: FileCheck,
      fields: [
        {
          name: 'solicitarCondominio',
          label: 'Solicitar Comprovante de Condomínio',
          type: 'select',
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Locatário paga condomínio' },
            { value: 'nao', label: 'Não - Condomínio no boleto do locador' },
          ],
        },
        {
          name: 'solicitarAgua',
          label: 'Solicitar Comprovante de Água',
          type: 'select',
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Locatário paga água' },
            { value: 'nao', label: 'Não - Água inclusa no condomínio' },
          ],
        },
        {
          name: 'solicitarGas',
          label: 'Solicitar Comprovante de Gás',
          type: 'select',
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Locatário usa gás' },
            { value: 'nao', label: 'Não - Gás não utilizado' },
          ],
        },
        {
          name: 'solicitarCND',
          label: 'Solicitar Certidão Negativa de Débitos (CND)',
          type: 'select',
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Solicitar CND' },
            { value: 'nao', label: 'Não - CND não necessária' },
          ],
        },
      ],
    },
  ];

  // Função para lidar com mudanças no formulário (memoizada para evitar re-renders)
  const handleFormChange = useCallback((data: Record<string, string>) => {
    setFormData(data);
  }, []);

  const handleGenerate = async (data: Record<string, string>): Promise<Record<string, string>> => {
    if (isSubmitting) return data;

    setIsSubmitting(true);

    try {
      // Adicionar campos automáticos e garantir compatibilidade
      const enhancedData = {
        ...data,
        prazoDias: '30', // Sempre 30 dias
        dataComunicacao: data.dataInicioRescisao, // Data de comunicação = data de início
        // Garantir compatibilidade com ambos os nomes de campo
        nomesResumidosLocadores: data.nomeProprietario || data.nomesResumidosLocadores || '',
      };

      if (isEditMode && contractId) {
        // Modo de edição - atualizar contrato existente
        const { error } = await supabase
          .from('saved_terms')
          .update({
            title: `Contrato ${data.numeroContrato || '[NÚMERO]'} - ${data.nomeProprietario?.split(/ e | E /)[0]?.trim() || '[LOCADOR]'} - ${data.nomeLocatario?.split(/ e | E /)[0]?.trim() || '[LOCATÁRIO]'}`,
            content: JSON.stringify(enhancedData),
            form_data: enhancedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', contractId);

        if (error) throw error;

        toast.success('Contrato atualizado com sucesso!');
      } else {
        // Modo de criação - inserir novo contrato
        const contractData = {
          title: `Contrato ${data.numeroContrato || '[NÚMERO]'} - ${data.nomeProprietario?.split(/ e | E /)[0]?.trim() || '[LOCADOR]'} - ${data.nomeLocatario?.split(/ e | E /)[0]?.trim() || '[LOCATÁRIO]'}`,
          content: JSON.stringify(enhancedData),
          form_data: enhancedData,
          document_type: 'contrato',
        };

        const { error } = await supabase.from('saved_terms').insert(contractData);
        if (error) throw error;

        toast.success('Contrato cadastrado com sucesso!');
      }

      navigate('/contratos');
      return enhancedData;
    } catch (error) {
      toast.error(isEditMode ? 'Erro ao atualizar contrato' : 'Erro ao cadastrar contrato');
      console.error('Erro ao salvar contrato:', error);
      return data; // Return original data on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Template vazio para o cadastro (não gera documento)
  const _getTemplate = () => '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/15 rounded-lg -rotate-12"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 border border-white/10 rounded-lg rotate-45"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 border border-white/25 rounded-lg -rotate-45"></div>
      </div>

      {/* Main Content */}
      <div className="p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Form Wizard */}
          <Card className="glass-card">
            <CardContent className="p-0">
              <DocumentFormWizard
                title=""
                description=""
                steps={steps}
                template=""
                onGenerate={handleGenerate}
                onFormDataChange={handleFormChange}
                isSubmitting={isSubmitting}
                submitButtonText={
                  isSubmitting 
                    ? (isEditMode ? 'Atualizando...' : 'Cadastrando...') 
                    : (isEditMode ? 'Atualizar Contrato' : 'Cadastrar Contrato')
                }
                externalFormData={formData}
                hideSaveButton={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CadastrarContrato;
