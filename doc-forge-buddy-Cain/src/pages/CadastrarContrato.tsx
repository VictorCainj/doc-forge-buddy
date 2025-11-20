import React, { useState, useEffect } from 'react';
import { ContractWizardModal } from '@/features/contracts/components';
import { FormStep } from '@/hooks/use-form-wizard';
import {
  Users,
  FileText,
  UserCheck,
  Shield,
  Calendar,
  FileCheck,
} from '@/utils/iconMapper';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { NotificationAutoCreator } from '@/features/notifications/utils/notificationAutoCreator';
import { useEvictionReasons } from '@/hooks/useEvictionReasons';
import { splitNames } from '@/utils/nameHelpers';
import type { ContractFormData } from '@/types/shared/contract';
import type { EvictionReason } from '@/types';

const CadastrarContrato = () => {
  // Buscar motivos de desocupação ativos
  const { reasons, isLoading: isLoadingReasons } = useEvictionReasons();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<ContractFormData>>({});

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
      const mappedData: Partial<ContractFormData> = {
        ...(state.contractData as Partial<ContractFormData>),
        // Garantir que nomeProprietario seja usado (pode vir como nomesResumidosLocadores)
        nomeProprietario:
          state.contractData.nomeProprietario ||
          state.contractData.nomesResumidosLocadores ||
          '',
      };

      const versaoAtual = Number(
        (state.contractData as Partial<ContractFormData>)?.versao ?? 1
      );

      mappedData.versao = Number.isFinite(versaoAtual) ? versaoAtual : 1;

      setFormData(mappedData);
    }
  }, [location.state]);

  // Converter motivos para formato de options
  const motivoOptions = reasons.map((reason: EvictionReason) => ({
    value: reason.description,
    label: reason.description,
  }));

  const steps: FormStep[] = [
    {
      id: 'contrato',
      title: 'Dados do Contrato',
      description: 'Informações essenciais do contrato',
      icon: FileText,
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
      id: 'garantia',
      title: 'Garantia',
      description: 'Selecione o tipo de garantia do contrato',
      icon: Shield,
      fields: [
        {
          name: 'tipoGarantia',
          label: 'Tipo de Garantia',
          type: 'select',
          required: true,
          options: [
            { value: 'Caução', label: 'Caução' },
            { value: 'Fiador', label: 'Fiador' },
            { value: 'Seguro Fiança', label: 'Seguro Fiança' },
            {
              value: 'Título de Capitalização',
              label: 'Título de Capitalização',
            },
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
        },
        {
          name: 'motivoDesocupacao',
          label: 'Motivo da Desocupação',
          type: 'select',
          required: false,
          placeholder: isLoadingReasons
            ? 'Carregando motivos...'
            : 'Selecione o motivo',
          options: motivoOptions,
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

  // Estado do modal
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleSubmit = async (data: Record<string, any>): Promise<void> => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const previousFormData = isEditMode
        ? (formData as Partial<ContractFormData>)
        : null;
      const previousVersion = Number(previousFormData?.versao ?? 0);
      const nextVersion = isEditMode
        ? Number.isFinite(previousVersion) && previousVersion > 0
          ? previousVersion + 1
          : 1
        : 1;

      const enhancedData: ContractFormData = {
        ...(data as unknown as ContractFormData),
        prazoDias: '30',
        dataComunicacao: data.dataInicioRescisao,
        nomesResumidosLocadores:
          data.nomeProprietario || data.nomesResumidosLocadores || '',
        versao: nextVersion,
      };

      const updatedAtIso = new Date().toISOString();
      const title = `Contrato ${data.numeroContrato || '[NÚMERO]'} - ${
        splitNames(data.nomeProprietario || '')[0]?.trim() || '[LOCADOR]'
      } - ${splitNames(data.nomeLocatario || '')[0]?.trim() || '[LOCATÁRIO]'}`;

      if (isEditMode && contractId) {
        const { error } = await supabase
          .from('saved_terms')
          .update({
            title,
            content: JSON.stringify(enhancedData),
            form_data: enhancedData,
            updated_at: updatedAtIso,
          })
          .eq('id', contractId);

        if (error) throw error;

        toast.success('Contrato atualizado com sucesso!');
      } else {
        const { data: created, error } = await supabase
          .from('saved_terms')
          .insert({
            title,
            content: JSON.stringify(enhancedData),
            form_data: enhancedData,
            document_type: 'contrato',
            user_id: user.id,
          })
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        if (created?.id) {
          await NotificationAutoCreator.onContractCreated(
            created.id,
            data.numeroContrato || 'N/A'
          );
        }

        toast.success('Contrato cadastrado com sucesso!');
      }

      setFormData(enhancedData);
      setIsModalOpen(false);
      setTimeout(() => navigate('/contratos'), 300);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Erro completo ao cadastrar contrato:', error);
      const err = error as any;
      const errorMessage =
        err?.message ||
        err?.error?.message ||
        'Erro desconhecido ao cadastrar contrato';
      toast.error(
        isEditMode
          ? `Erro ao atualizar contrato: ${errorMessage}`
          : `Erro ao cadastrar contrato: ${errorMessage}`
      );
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

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Modal Wizard Google Material Design 3 */}
      <ContractWizardModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        steps={steps}
        initialData={formData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText={
          isEditMode ? 'Atualizar Contrato' : 'Cadastrar Contrato'
        }
        title={isEditMode ? 'Editar Contrato' : 'Novo Contrato'}
      />
    </div>
  );
};

export default CadastrarContrato;
