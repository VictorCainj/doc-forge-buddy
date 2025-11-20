import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  celularLocatario?: string;
  emailLocatario?: string;
  generoProprietario?: string;
  generoLocatario?: string;
  nomesResumidosLocadores?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  quantidadeChaves?: string;
  [key: string]: string | undefined;
}

interface ContactData {
  celularLocatario: string;
  emailLocatario: string;
}

export function useTermoLocatario(contractData: ContractData) {
  const { toast } = useToast();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactData, setContactData] = useState<ContactData>({
    celularLocatario: contractData?.celularLocatario || '',
    emailLocatario: contractData?.emailLocatario || '',
  });
  const [pendingFormData, setPendingFormData] = useState<Record<string, string> | null>(null);

  // Validar campos de contato
  const validateContactFields = useCallback((_data: Record<string, string>) => {
    const celular = contractData.celularLocatario || contactData.celularLocatario;
    const email = contractData.emailLocatario || contactData.emailLocatario;

    return {
      isValid: !!(celular && celular.trim() && email && email.trim()),
      missingFields: {
        celular: !celular || !celular.trim(),
        email: !email || !email.trim(),
      },
    };
  }, [contractData.celularLocatario, contractData.emailLocatario, contactData]);

  // Atualizar dados de contato no contrato
  const updateContractContactData = useCallback(async (newContactData: ContactData) => {
    try {
      const { data: contractRecord, error: fetchError } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .contains('form_data', { numeroContrato: contractData.numeroContrato })
        .single();

      if (fetchError) throw fetchError;
      if (!contractRecord) throw new Error('Contrato não encontrado');

      const formData = (contractRecord.form_data as Record<string, string>) || {};
      const updatedFormData = {
        ...formData,
        celularLocatario: newContactData.celularLocatario,
        emailLocatario: newContactData.emailLocatario,
      };

      const { error: updateError } = await supabase
        .from('saved_terms')
        .update({
          form_data: updatedFormData,
          content: JSON.stringify(updatedFormData),
        })
        .eq('id', contractRecord.id);

      if (updateError) throw updateError;

      Object.assign(contractData, newContactData);

      toast({
        title: 'Dados atualizados',
        description: 'Os dados de contato foram atualizados no contrato.',
      });

      return true;
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os dados de contato.',
        variant: 'destructive',
      });
      return false;
    }
  }, [contractData, toast]);

  // Salvar dados de contato e continuar
  const handleSaveContactData = useCallback(async (onSuccess?: () => void) => {
    if (!contactData.celularLocatario.trim() || !contactData.emailLocatario.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos de contato.',
        variant: 'destructive',
      });
      return;
    }

    const success = await updateContractContactData(contactData);
    if (success) {
      setShowContactModal(false);
      if (onSuccess) {
        onSuccess();
      }
      setPendingFormData(null);
    }
  }, [contactData, updateContractContactData, toast]);

  // Processar dados do formulário
  const processFormData = useCallback((data: Record<string, string>) => {
    // Detectar múltiplos locatários
    const isMultipleLocatarios =
      contractData.primeiroLocatario &&
      (contractData.segundoLocatario ||
        contractData.terceiroLocatario ||
        contractData.quartoLocatario);

    // Detectar múltiplos proprietários baseado no gênero selecionado
    // Não usar mais detecção baseada em vírgulas ou "e" no nome
    const generoProprietario = contractData.generoProprietario;
    const isMultipleProprietarios =
      generoProprietario === 'masculinos' || generoProprietario === 'femininos';

    // Definir termos baseados na quantidade e gênero
    let locadorTerm;
    if (isMultipleProprietarios) {
      locadorTerm = 'LOCADORES';
    } else {
      const generoProprietario = contractData.generoProprietario;
      if (generoProprietario === 'feminino') {
        locadorTerm = 'LOCADORA';
      } else if (generoProprietario === 'masculino') {
        locadorTerm = 'LOCADOR';
      } else {
        locadorTerm = 'LOCADOR';
      }
    }

    // Definir título baseado na quantidade e gênero
    let dadosLocatarioTitulo;
    if (isMultipleLocatarios) {
      dadosLocatarioTitulo = 'DADOS DOS LOCATÁRIOS';
    } else {
      const generoLocatario = contractData.generoLocatario;
      if (generoLocatario === 'feminino') {
        dadosLocatarioTitulo = 'DADOS DA LOCATÁRIA';
      } else if (generoLocatario === 'masculino') {
        dadosLocatarioTitulo = 'DADOS DO LOCATÁRIO';
      } else {
        dadosLocatarioTitulo = 'DADOS DO LOCATÁRIO';
      }
    }

    const locatarioResponsabilidade = isMultipleLocatarios ? 'dos locatários' : 'do locatário';

    // Processar nome de quem retira
    let nomeQuemRetira = data.nomeQuemRetira;
    if (data.incluirNomeCompleto === 'todos') {
      nomeQuemRetira = contractData.nomeLocatario;
    } else if (
      data.incluirNomeCompleto &&
      data.incluirNomeCompleto !== '' &&
      data.incluirNomeCompleto !== 'custom'
    ) {
      nomeQuemRetira = data.incluirNomeCompleto;
    }
    // Se incluirNomeCompleto === 'custom', usar o valor de nomeQuemRetira que foi preenchido pelo usuário

    // Processar quantidade de chaves
    let tipoQuantidadeChaves = data.tipoQuantidadeChaves;
    if (data.usarQuantidadeChavesContrato === 'sim') {
      tipoQuantidadeChaves = contractData.quantidadeChaves || data.tipoQuantidadeChaves;
    }

    return {
      locadorTerm,
      dadosLocatarioTitulo,
      locatarioResponsabilidade,
      nomeQuemRetira,
      tipoQuantidadeChaves,
      isMultipleLocatarios,
      isMultipleProprietarios,
    };
  }, [contractData]);

  return {
    showContactModal,
    setShowContactModal,
    contactData,
    setContactData,
    pendingFormData,
    setPendingFormData,
    validateContactFields,
    updateContractContactData,
    handleSaveContactData,
    processFormData,
  };
}
