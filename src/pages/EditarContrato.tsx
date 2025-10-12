import React, { useState, useEffect } from 'react';
import { ContractWizardModal } from '@/features/contracts/components';
import { FormStep } from '@/hooks/use-form-wizard';
import {
  Users,
  Building2,
  UserCheck,
  Shield,
  Calendar,
  FileCheck,
} from '@/utils/iconMapper';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ContractFormData } from '@/types/contract';
import { splitNames } from '@/utils/nameHelpers';

const EditarContrato = () => {
  const navigate = useNavigate();
  const params = useParams();
  const contractId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // console.log('EditarContrato mounted with params:', params);
  // console.log('ContractId extracted:', contractId);

  // Carregar dados do contrato do banco de dados
  useEffect(() => {
    const loadContractData = async () => {
      // console.log('ContractId from params:', contractId);

      if (!contractId) {
        toast.error('ID do contrato não encontrado');
        navigate('/contratos');
        return;
      }

      try {
        const { data: contractData, error } = await supabase
          .from('saved_terms')
          .select('*')
          .eq('id', contractId)
          .single();

        if (error) {
          toast.error('Erro ao carregar dados do contrato');
          navigate('/contratos');
          return;
        }

        // console.log('Contract data loaded:', contractData);

        // Mapear campos para garantir compatibilidade
        const mappedData: Record<string, string> = {
          ...(contractData.form_data as ContractFormData),
          // Garantir que nomeProprietario seja usado (pode vir como nomesResumidosLocadores)
          nomeProprietario:
            (contractData.form_data as ContractFormData)?.nomeProprietario ||
            (contractData.form_data as ContractFormData)
              ?.nomesResumidosLocadores ||
            '',
        };

        // console.log('Mapped data:', mappedData);
        // console.log('nomeProprietario:', mappedData.nomeProprietario);
        // console.log('nomeLocatario:', mappedData.nomeLocatario);

        setFormData(mappedData);
        setIsModalOpen(true);
      } catch {
        // console.error('Erro ao carregar contrato:', error);
        toast.error('Erro ao carregar dados do contrato');
        navigate('/contratos');
      } finally {
        setLoading(false);
      }
    };

    loadContractData();
  }, [contractId, navigate]);

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

  const handleSubmit = async (data: Record<string, string>): Promise<void> => {
    if (isSubmitting || !contractId) return;

    setIsSubmitting(true);

    try {
      // Adicionar campos automáticos e garantir compatibilidade
      const enhancedData: Record<string, string> = {
        ...data,
        prazoDias: '30', // Sempre 30 dias
        dataComunicacao: data.dataInicioRescisao, // Data de comunicação = data de início
        // Garantir compatibilidade com ambos os nomes de campo
        nomesResumidosLocadores:
          data.nomeProprietario || data.nomesResumidosLocadores || '',
      };

      // Atualizar contrato existente
      const { error } = await supabase
        .from('saved_terms')
        .update({
          title: `Contrato ${data.numeroContrato || '[NÚMERO]'} - ${splitNames(data.nomeProprietario || '')[0]?.trim() || '[LOCADOR]'} - ${splitNames(data.nomeLocatario || '')[0]?.trim() || '[LOCATÁRIO]'}`,
          content: JSON.stringify(enhancedData),
          form_data: enhancedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (error) throw error;

      toast.success('Contrato atualizado com sucesso!');
      setIsModalOpen(false);
      setTimeout(() => navigate('/contratos'), 300);
    } catch {
      toast.error('Erro ao atualizar contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manipula o fechamento do modal
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setTimeout(() => navigate('/contratos'), 300);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-700">Carregando dados do contrato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Modal Wizard Google Material Design 3 */}
      <ContractWizardModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        steps={steps}
        initialData={formData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Atualizar Contrato"
        title="Editar Contrato"
      />
    </div>
  );
};

export default EditarContrato;
