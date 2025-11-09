/**
 * Sistema de toast padronizado para evitar duplicação
 * Centraliza todas as mensagens e tipos de toast
 */

import { useToast } from '@/components/ui/use-toast';

export interface ToastMessage {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export const toastMessages = {
  success: {
    saved: {
      title: 'Salvo com sucesso!',
      description: 'Os dados foram salvos com sucesso.',
    },
    updated: {
      title: 'Atualizado com sucesso!',
      description: 'Os dados foram atualizados com sucesso.',
    },
    deleted: {
      title: 'Removido com sucesso!',
      description: 'O item foi removido com sucesso.',
    },
    created: {
      title: 'Criado com sucesso!',
      description: 'O item foi criado com sucesso.',
    },
    uploaded: {
      title: 'Upload concluído!',
      description: 'O arquivo foi enviado com sucesso.',
    },
    copied: {
      title: 'Copiado!',
      description: 'Conteúdo copiado para a área de transferência.',
    },
    printed: {
      title: 'Impressão iniciada!',
      description: 'O documento está sendo preparado para impressão.',
    },
    migrated: {
      title: 'Migração concluída!',
      description: 'Os dados foram migrados com sucesso.',
    },
  },
  error: {
    generic: {
      title: 'Erro',
      description: 'Não foi possível realizar a operação. Tente novamente.',
      variant: 'destructive' as const,
    },
    network: {
      title: 'Erro de conexão',
      description: 'Verifique sua conexão com a internet e tente novamente.',
      variant: 'destructive' as const,
    },
    validation: {
      title: 'Dados inválidos',
      description: 'Verifique os campos obrigatórios e tente novamente.',
      variant: 'destructive' as const,
    },
    notFound: {
      title: 'Item não encontrado',
      description: 'O item solicitado não foi encontrado.',
      variant: 'destructive' as const,
    },
    unauthorized: {
      title: 'Acesso negado',
      description: 'Você não tem permissão para realizar esta operação.',
      variant: 'destructive' as const,
    },
    upload: {
      title: 'Erro no upload',
      description: 'Não foi possível enviar o arquivo. Tente novamente.',
      variant: 'destructive' as const,
    },
    print: {
      title: 'Erro na impressão',
      description: 'Não foi possível imprimir o documento. Tente novamente.',
      variant: 'destructive' as const,
    },
    save: {
      title: 'Erro ao salvar',
      description: 'Não foi possível salvar os dados. Tente novamente.',
      variant: 'destructive' as const,
    },
    load: {
      title: 'Erro ao carregar',
      description: 'Não foi possível carregar os dados. Tente novamente.',
      variant: 'destructive' as const,
    },
    delete: {
      title: 'Erro ao remover',
      description: 'Não foi possível remover o item. Tente novamente.',
      variant: 'destructive' as const,
    },
  },
  info: {
    loading: {
      title: 'Carregando...',
      description: 'Por favor, aguarde enquanto processamos sua solicitação.',
    },
    processing: {
      title: 'Processando...',
      description: 'Sua solicitação está sendo processada.',
    },
    noData: {
      title: 'Nenhum dado encontrado',
      description: 'Não foram encontrados dados para exibir.',
    },
    development: {
      title: 'Funcionalidade em desenvolvimento',
      description: 'Esta funcionalidade será implementada em breve.',
    },
    maintenance: {
      title: 'Manutenção',
      description: 'Sistema em manutenção. Tente novamente mais tarde.',
    },
  },
  warning: {
    unsavedChanges: {
      title: 'Alterações não salvas',
      description: 'Você tem alterações não salvas. Deseja continuar?',
    },
    deleteConfirm: {
      title: 'Confirmar exclusão',
      description: 'Esta ação não pode ser desfeita. Deseja continuar?',
    },
    formIncomplete: {
      title: 'Formulário incompleto',
      description: 'Por favor, preencha todos os campos obrigatórios.',
    },
    fileSize: {
      title: 'Arquivo muito grande',
      description: 'O arquivo excede o tamanho máximo permitido.',
    },
  },
} as const;

/**
 * Hook para toast padronizado
 */
export const useStandardToast = () => {
  const { toast } = useToast();

  const showSuccess = (type: keyof typeof toastMessages.success, customMessage?: Partial<ToastMessage>) => {
    const message = { ...toastMessages.success[type], ...customMessage };
    toast(message);
  };

  const showError = (type: keyof typeof toastMessages.error, customMessage?: Partial<ToastMessage>) => {
    const message = { ...toastMessages.error[type], ...customMessage };
    toast(message);
  };

  const showInfo = (type: keyof typeof toastMessages.info, customMessage?: Partial<ToastMessage>) => {
    const message = { ...toastMessages.info[type], ...customMessage };
    toast(message);
  };

  const showWarning = (type: keyof typeof toastMessages.warning, customMessage?: Partial<ToastMessage>) => {
    const message = { ...toastMessages.warning[type], ...customMessage };
    toast(message);
  };

  const showCustom = (message: ToastMessage) => {
    toast(message);
  };

  // Métodos específicos para operações comuns
  const showSaveSuccess = (itemName?: string) => {
    showSuccess('saved', {
      description: itemName 
        ? `${itemName} foi salvo com sucesso.`
        : undefined
    });
  };

  const showUpdateSuccess = (itemName?: string) => {
    showSuccess('updated', {
      description: itemName 
        ? `${itemName} foi atualizado com sucesso.`
        : undefined
    });
  };

  const showDeleteSuccess = (itemName?: string) => {
    showSuccess('deleted', {
      description: itemName 
        ? `${itemName} foi removido com sucesso.`
        : undefined
    });
  };

  const showLoadError = (itemName?: string) => {
    showError('load', {
      description: itemName 
        ? `Não foi possível carregar ${itemName}.`
        : undefined
    });
  };

  const showSaveError = (itemName?: string) => {
    showError('save', {
      description: itemName 
        ? `Não foi possível salvar ${itemName}.`
        : undefined
    });
  };

  const showValidationError = (fieldName?: string) => {
    showError('validation', {
      description: fieldName 
        ? `O campo ${fieldName} é obrigatório.`
        : undefined
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showCustom,
    // Métodos específicos
    showSaveSuccess,
    showUpdateSuccess,
    showDeleteSuccess,
    showLoadError,
    showSaveError,
    showValidationError,
  };
};

/**
 * Utilitários para toast sem hook (para uso em classes ou funções utilitárias)
 */
export const ToastHelpers = {
  /**
   * Cria uma mensagem de toast personalizada
   */
  createMessage: (title: string, description: string, variant?: 'default' | 'destructive'): ToastMessage => ({
    title,
    description,
    variant,
  }),

  /**
   * Cria mensagem de sucesso
   */
  createSuccessMessage: (title: string, description: string): ToastMessage => ({
    title,
    description,
  }),

  /**
   * Cria mensagem de erro
   */
  createErrorMessage: (title: string, description: string): ToastMessage => ({
    title,
    description,
    variant: 'destructive',
  }),

  /**
   * Obtém mensagem padrão por tipo
   */
  getMessage: (category: keyof typeof toastMessages, type: string): ToastMessage | null => {
    const messages = toastMessages[category] as Record<string, ToastMessage>;
    return messages[type] || null;
  },
};
