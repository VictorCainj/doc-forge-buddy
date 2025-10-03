/**
 * Container para QuickActions - Lógica de Negócio
 * Separa lógica de apresentação seguindo padrão Container/Presentational
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickActionsPresentation } from '../presentation/QuickActionsPresentation';
import { useContractData } from '@/hooks/useContractData';
import { useDocumentGeneration } from '@/hooks/useDocumentGeneration';
import { useStandardToast } from '@/utils/toastHelpers';
import {
  DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_TEMPLATE,
  NOTIFICACAO_AGENDAMENTO_TEMPLATE,
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_COMERCIAL_TEMPLATE,
  DEVOLUTIVA_CADERNINHO_TEMPLATE,
  DISTRATO_CONTRATO_LOCACAO_TEMPLATE,
  DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
  TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE,
  NPS_WHATSAPP_TEMPLATE,
  NPS_EMAIL_TEMPLATE,
} from '@/templates/documentos';

export interface QuickActionsContainerProps {
  contractId: string;
  contractNumber?: string;
  onGenerateDocument?: (contractId: string, template: string, title: string) => void;
}

export const QuickActionsContainer: React.FC<QuickActionsContainerProps> = ({
  contractId,
  contractNumber,
  onGenerateDocument,
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useStandardToast();
  const { fetchContractById, loading } = useContractData();
  const { applyConjunctions } = useDocumentGeneration();

  // ✅ Lógica de negócio centralizada
  const handleContractNavigation = async (path: string) => {
    try {
      const contractData = await fetchContractById(contractId);
      if (contractData) {
        navigate(path, { state: { contractData } });
      } else {
        showError('fetch', { description: 'Contrato não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
      showError('fetch');
    }
  };

  // ✅ Lógica de geração de documentos
  const handleDocumentGeneration = async (template: string, title: string) => {
    try {
      if (onGenerateDocument) {
        onGenerateDocument(contractId, template, title);
      } else {
        const contractData = await fetchContractById(contractId);
        if (contractData) {
          const enhancedData = applyConjunctions(contractData.form_data);
          navigate('/gerar-documento', {
            state: {
              title,
              template,
              formData: enhancedData,
              documentType: title,
            },
          });
        }
      }
      showSuccess('generated', { description: `${title} gerado com sucesso` });
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      showError('generate');
    }
  };

  // ✅ Configuração das ações (lógica de negócio)
  const actionsConfig = [
    {
      id: 'termo-locador',
      label: 'Recebimento de Chaves (Locador)',
      category: 'Termos',
      onClick: () => handleContractNavigation('/termo-locador'),
    },
    {
      id: 'termo-locatario',
      label: 'Recebimento de Chaves (Locatário)',
      category: 'Termos',
      onClick: () => handleContractNavigation('/termo-locatario'),
    },
    {
      id: 'devolutiva-proprietario',
      label: 'Devolutiva Proprietário',
      category: 'Devolutivas',
      onClick: () => handleDocumentGeneration(
        DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
        'Devolutiva via E-mail - Locador'
      ),
    },
    {
      id: 'devolutiva-locatario',
      label: 'Devolutiva Locatário',
      category: 'Devolutivas',
      onClick: () => handleDocumentGeneration(
        DEVOLUTIVA_LOCATARIO_TEMPLATE,
        'Confirmação de Notificação de Desocupação e Procedimentos Finais - Contrato 13734'
      ),
    },
    {
      id: 'notificacao-agendamento',
      label: 'Notificação de Agendamento',
      category: 'Notificações',
      onClick: () => handleDocumentGeneration(
        NOTIFICACAO_AGENDAMENTO_TEMPLATE,
        'Notificação de Agendamento'
      ),
    },
    {
      id: 'whatsapp-proprietario',
      label: 'WhatsApp Proprietário',
      category: 'WhatsApp',
      onClick: () => handleDocumentGeneration(
        DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
        'Devolutiva WhatsApp - Locador'
      ),
    },
    {
      id: 'whatsapp-locatario',
      label: 'WhatsApp Locatário',
      category: 'WhatsApp',
      onClick: () => handleDocumentGeneration(
        DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
        'Devolutiva WhatsApp - Locatário'
      ),
    },
    {
      id: 'comercial',
      label: 'WhatsApp Comercial',
      category: 'WhatsApp',
      onClick: () => handleDocumentGeneration(
        DEVOLUTIVA_COMERCIAL_TEMPLATE,
        'WhatsApp - Comercial'
      ),
    },
    {
      id: 'caderninho',
      label: 'Devolutiva Caderninho',
      category: 'Devolutivas',
      onClick: () => handleDocumentGeneration(
        DEVOLUTIVA_CADERNINHO_TEMPLATE,
        'Devolutiva Caderninho'
      ),
    },
    {
      id: 'distrato',
      label: 'Distrato de Contrato',
      category: 'Contratos',
      onClick: () => handleDocumentGeneration(
        DISTRATO_CONTRATO_LOCACAO_TEMPLATE,
        'Distrato de Contrato de Locação'
      ),
    },
    {
      id: 'cobranca-consumo',
      label: 'Cobrança de Consumo',
      category: 'Devolutivas',
      onClick: () => handleDocumentGeneration(
        DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
        'Devolutiva Cobrança de Consumo'
      ),
    },
    {
      id: 'recusa-assinatura',
      label: 'Termo de Recusa',
      category: 'Termos',
      onClick: () => handleDocumentGeneration(
        TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE,
        'Termo de Recusa de Assinatura - E-mail'
      ),
    },
    {
      id: 'nps-whatsapp',
      label: 'NPS WhatsApp',
      category: 'NPS',
      onClick: () => handleDocumentGeneration(
        NPS_WHATSAPP_TEMPLATE,
        'NPS WhatsApp'
      ),
    },
    {
      id: 'nps-email',
      label: 'NPS Email',
      category: 'NPS',
      onClick: () => handleDocumentGeneration(
        NPS_EMAIL_TEMPLATE,
        'NPS Email'
      ),
    },
  ];

  // ✅ Passar apenas dados e callbacks para apresentação
  return (
    <QuickActionsPresentation
      contractNumber={contractNumber}
      actions={actionsConfig}
      loading={loading}
    />
  );
};
