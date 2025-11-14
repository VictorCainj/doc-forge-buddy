import { useCallback } from 'react';
import { getContractLocatarioNames } from '@/utils/nameHelpers';

interface ContractData {
  numeroContrato: string;
  nomeLocatario: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  [key: string]: string | undefined;
}

export function useTermoValidation(contractData: ContractData) {
  // Validar campos obrigatórios
  const validateRequiredFields = useCallback((data: Record<string, string>) => {
    const requiredFields = [
      'nomeQuemRetira',
      'tipoVistoria',
      'cpfl',
      'tipoAgua',
      'statusAgua',
      'tipoContrato',
      'assinanteSelecionado',
    ];

    const missingFields: string[] = [];
    const errors: Record<string, string> = {};

    requiredFields.forEach((field) => {
      if (!data[field] || data[field].trim() === '') {
        missingFields.push(field);
        errors[field] = 'Este campo é obrigatório';
      }
    });

    // Validações condicionais
    if (data.tipoVistoria === 'vistoria' && !data.dataVistoria) {
      missingFields.push('dataVistoria');
      errors.dataVistoria = 'Data da vistoria é obrigatória';
    }

    if (data.tipoVistoria === 'revistoria' && !data.dataRevistoria) {
      missingFields.push('dataRevistoria');
      errors.dataRevistoria = 'Data da revistoria é obrigatória';
    }

    if (data.tipoVistoria === 'nao_realizada' && !data.motivoNaoRealizacao) {
      missingFields.push('motivoNaoRealizacao');
      errors.motivoNaoRealizacao = 'Motivo da não realização é obrigatório';
    }

    if (data.tipoVistoria === 'vistoria' && !data.statusVistoria) {
      missingFields.push('statusVistoria');
      errors.statusVistoria = 'Status da vistoria é obrigatório';
    }

    if (data.tipoVistoria === 'revistoria' && !data.statusRevistoria) {
      missingFields.push('statusRevistoria');
      errors.statusRevistoria = 'Status da revistoria é obrigatório';
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      errors,
    };
  }, []);

  // Validar opções de nomes de quem retira
  const validateNomeQuemRetiraOptions = useCallback(() => {
    const nomes = getContractLocatarioNames(contractData);

    return [
      { value: 'todos', label: 'Todos os locatários' },
      ...nomes.map((nome) => ({
        value: nome,
        label: nome,
      })),
    ];
  }, [
    contractData.nomeLocatario,
    contractData.primeiroLocatario,
    contractData.segundoLocatario,
    contractData.terceiroLocatario,
    contractData.quartoLocatario,
  ]);

  // Validar se o nome selecionado para quem retira é válido
  const validateNomeQuemRetira = useCallback(
    (nomeSelecionado: string) => {
      if (!nomeSelecionado) return false;

      if (nomeSelecionado === 'todos') return true;

      const opcoesValidas = validateNomeQuemRetiraOptions();
      return opcoesValidas.some((opcao) => opcao.value === nomeSelecionado);
    },
    [validateNomeQuemRetiraOptions]
  );

  // Validar campos de chaves
  const validateChavesFields = useCallback(
    (data: Record<string, string>) => {
      const errors: Record<string, string> = {};

      if (data.usarQuantidadeChavesContrato === 'nao') {
        if (!data.tipoQuantidadeChaves || data.tipoQuantidadeChaves.trim() === '') {
          errors.tipoQuantidadeChaves = 'Descrição das chaves é obrigatória quando não usar a quantidade do contrato';
        }
      }

      return errors;
    },
    []
  );

  // Validar datas
  const validateDates = useCallback((data: Record<string, string>) => {
    const errors: Record<string, string> = {};
    const today = new Date();

    // Validar se a data da vistoria não é futura (se preenchida)
    if (data.dataVistoria) {
      const dataVistoria = parseDate(data.dataVistoria);
      if (dataVistoria && dataVistoria > today) {
        errors.dataVistoria = 'Data da vistoria não pode ser futura';
      }
    }

    // Validar se a data da revistoria não é futura (se preenchida)
    if (data.dataRevistoria) {
      const dataRevistoria = parseDate(data.dataRevistoria);
      if (dataRevistoria && dataRevistoria > today) {
        errors.dataRevistoria = 'Data da revistoria não pode ser futura';
      }
    }

    return errors;
  }, []);

  // Função auxiliar para parse de datas em formato brasileiro
  const parseDate = (dateString: string): Date | null => {
    try {
      // Tenta parsear formato "DD de MMMM de YYYY" ou similar
      const months = {
        'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
        'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
        'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
      };

      const match = dateString.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
      if (match) {
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const year = parseInt(match[3]);
        const month = months[monthName as keyof typeof months];
        
        if (month !== undefined) {
          return new Date(year, month, day);
        }
      }

      // Tenta parsear formato ISO
      return new Date(dateString);
    } catch {
      return null;
    }
  };

  return {
    validateRequiredFields,
    validateNomeQuemRetiraOptions,
    validateNomeQuemRetira,
    validateChavesFields,
    validateDates,
    parseDate,
  };
}
