/**
 * Hook para processamento de templates e geração de documentos
 * Extrai toda a lógica complexa de processamento do componente Contratos
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contract, ContractFormData } from '@/types/contract';
import { DateHelpers } from '@/utils/dateHelpers';
import { TemplateProcessor } from '@/utils/templateProcessor';

export interface UseDocumentGenerationReturn {
  applyConjunctions: (formData: ContractFormData) => ContractFormData;
  generateDocumentWithAssinante: (
    contract: Contract,
    template: string,
    documentType: string,
    assinante: string
  ) => void;
  generateMesesComprovantes: () => string;
  getLocatarioQualificacao: (formData: ContractFormData) => string;
  getProprietarioQualificacao: (formData: ContractFormData) => string;
  isMultipleLocatarios: (nomeLocatario: string) => boolean;
  isMultipleProprietarios: (nomeProprietario: string) => boolean;
}

export const useDocumentGeneration = (): UseDocumentGenerationReturn => {
  const navigate = useNavigate();

  // Função para gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
  const generateMesesComprovantes = useCallback(() => {
    const hoje = new Date();
    const meses: string[] = [];
    const nomesMeses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ];

    // Pegar os 3 últimos meses
    for (let i = 2; i >= 0; i--) {
      const mes = new Date(hoje);
      mes.setMonth(hoje.getMonth() - i);
      meses.push(nomesMeses[mes.getMonth()]);
    }

    return `${meses.join(', ')} de ${hoje.getFullYear()}`;
  }, []);

  // Função para obter qualificação completa dos locatários (texto livre)
  const getLocatarioQualificacao = useCallback((formData: ContractFormData) => {
    return formData.qualificacaoCompletaLocatarios || '[TEXTOLIVRE]';
  }, []);

  // Função para obter qualificação completa dos proprietários (texto livre)
  const getProprietarioQualificacao = useCallback((formData: ContractFormData) => {
    return formData.qualificacaoCompletaLocadores || '[TEXTOLIVRE]';
  }, []);

  // Função para detectar múltiplos locatários
  const isMultipleLocatarios = useCallback((nomeLocatario: string) => {
    if (!nomeLocatario) return false;
    return (
      nomeLocatario.includes(',') ||
      nomeLocatario.includes(' e ') ||
      nomeLocatario.includes(' E ')
    );
  }, []);

  // Função para detectar múltiplos proprietários
  const isMultipleProprietarios = useCallback((nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return (
      nomeProprietario.includes(',') ||
      nomeProprietario.includes(' e ') ||
      nomeProprietario.includes(' E ')
    );
  }, []);

  // Função para aplicar conjunções verbais
  const applyConjunctions = useCallback((formData: ContractFormData): ContractFormData => {
    const enhancedData = { ...formData };

    // Obter qualificação completa dos locatários (texto livre)
    enhancedData.qualificacaoCompletaLocatarios = getLocatarioQualificacao(formData);

    // Obter qualificação completa dos proprietários (texto livre)
    enhancedData.qualificacaoCompletaProprietario = getProprietarioQualificacao(formData);

    // Aplicar conjunções para locatários baseado na quantidade adicionada
    const isMultipleLocatariosCheck = !!(
      formData.primeiroLocatario &&
      (formData.segundoLocatario ||
        formData.terceiroLocatario ||
        formData.quartoLocatario)
    );

    if (isMultipleLocatariosCheck) {
      enhancedData.locatarioTerm = 'LOCATÁRIOS';
      enhancedData.locatarioTermComercial = 'LOCATÁRIOS';
      enhancedData.locatarioDocumentacao = 'dos locatários';
      enhancedData.locatarioResponsabilidade = 'dos locatários';
    } else if (formData.primeiroLocatario) {
      // Usar o gênero do locatário para definir o termo correto
      const generoLocatario = formData.generoLocatario;
      if (generoLocatario === 'feminino') {
        enhancedData.locatarioTerm = 'LOCATÁRIA';
        enhancedData.locatarioTermComercial = 'LOCATÁRIA';
        enhancedData.locatarioDocumentacao = 'da locatária';
        enhancedData.locatarioResponsabilidade = 'da locatária';
        enhancedData.locatarioPrezado = 'Prezada';
      } else {
        enhancedData.locatarioTerm = 'LOCATÁRIO';
        enhancedData.locatarioTermComercial = 'LOCATÁRIO';
        enhancedData.locatarioDocumentacao = 'do locatário';
        enhancedData.locatarioResponsabilidade = 'do locatário';
        enhancedData.locatarioPrezado = 'Prezado';
      }
    } else {
      enhancedData.locatarioTerm = 'LOCATÁRIO';
      enhancedData.locatarioTermComercial = 'LOCATÁRIO';
      enhancedData.locatarioDocumentacao = 'do locatário';
      enhancedData.locatarioResponsabilidade = 'do locatário';
      enhancedData.locatarioPrezado = 'Prezado';
    }

    // Usar os dados dos locatários adicionados manualmente
    enhancedData.primeiroLocatario = formData.primeiroLocatario || '';
    enhancedData.segundoLocatario = formData.segundoLocatario || '';
    enhancedData.terceiroLocatario = formData.terceiroLocatario || '';
    enhancedData.quartoLocatario = formData.quartoLocatario || '';

    // Aplicar conjunções para proprietários baseado na quantidade adicionada
    const isMultipleProprietariosCheck =
      formData.nomeProprietario && formData.nomeProprietario.includes(' e ');
    if (isMultipleProprietariosCheck) {
      enhancedData.proprietarioTerm = 'os proprietários';
      enhancedData.locadorTermComercial = 'LOCADORES';
      enhancedData.proprietarioPrezado = 'Prezado';
    } else if (formData.nomeProprietario) {
      // Usar o gênero do proprietário para definir o termo correto
      const generoProprietario = formData.generoProprietario;
      if (generoProprietario === 'feminino') {
        enhancedData.proprietarioTerm = 'a proprietária';
        enhancedData.locadorTermComercial = 'LOCADORA';
        enhancedData.proprietarioPrezado = 'Prezada';
      } else {
        enhancedData.proprietarioTerm = 'o proprietário';
        enhancedData.locadorTermComercial = 'LOCADOR';
        enhancedData.proprietarioPrezado = 'Prezado';
      }
    } else {
      enhancedData.proprietarioTerm = 'o proprietário';
      enhancedData.locadorTermComercial = 'LOCADOR';
      enhancedData.proprietarioPrezado = 'Prezado';
    }

    // Gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
    const mesesComprovantes = generateMesesComprovantes();
    enhancedData.mesesComprovantes = mesesComprovantes;

    // Extrair primeiro nome do locatário e capitalizar apenas a primeira letra
    const nomeLocatarioCompleto =
      formData.nomeLocatario || formData.primeiroLocatario || '[PRIMEIRO NOME]';
    const primeiroNome =
      nomeLocatarioCompleto.split(' ')[0] || '[PRIMEIRO NOME]';
    const primeiroNomeCapitalizado =
      primeiroNome.charAt(0).toUpperCase() +
      primeiroNome.slice(1).toLowerCase();
    enhancedData.primeiroNomeLocatario = primeiroNomeCapitalizado;

    // Extrair primeiro nome do proprietário e capitalizar apenas a primeira letra
    const nomeProprietarioCompleto =
      formData.nomeProprietario ||
      formData.nomesResumidosLocadores ||
      '[PRIMEIRO NOME]';
    const primeiroNomeProprietario =
      nomeProprietarioCompleto.split(' ')[0] || '[PRIMEIRO NOME]';
    const primeiroNomeProprietarioCapitalizado =
      primeiroNomeProprietario.charAt(0).toUpperCase() +
      primeiroNomeProprietario.slice(1).toLowerCase();
    enhancedData.primeiroNomeProprietario = primeiroNomeProprietarioCapitalizado;

    // Processar nomes para saudação WhatsApp - Proprietários
    const nomeProprietarioCompletoSaudacao =
      formData.nomesResumidosLocadores || formData.nomeProprietario || '';
    if (nomeProprietarioCompletoSaudacao) {
      const nomesProprietariosSaudacao = nomeProprietarioCompletoSaudacao
        .split(/ e | E /)
        .map((nome) => nome.trim());
      const primeirosNomes = nomesProprietariosSaudacao.map((nome) => {
        const primeiroNome = nome.split(' ')[0];
        return (
          primeiroNome.charAt(0).toUpperCase() +
          primeiroNome.slice(1).toLowerCase()
        );
      });

      let tratamentoProprietario = '';
      if (primeirosNomes.length > 1) {
        tratamentoProprietario =
          primeirosNomes.slice(0, -1).join(', ') +
          ' e ' +
          primeirosNomes[primeirosNomes.length - 1];
      } else {
        tratamentoProprietario = primeirosNomes[0] || '[PRIMEIRO NOME]';
      }
      enhancedData.proprietarioPrezadoWhatsapp = tratamentoProprietario;
    } else {
      enhancedData.proprietarioPrezadoWhatsapp = '[PRIMEIRO NOME]';
    }

    // Processar nomes para saudação WhatsApp - Locatários
    const nomeLocatarioCompletoSaudacao =
      formData.nomeLocatario || formData.primeiroLocatario || '';
    if (nomeLocatarioCompletoSaudacao) {
      const nomesLocatariosSaudacao = nomeLocatarioCompletoSaudacao
        .split(/ e | E /)
        .map((nome) => nome.trim());
      const primeirosNomes = nomesLocatariosSaudacao.map((nome) => {
        const primeiroNome = nome.split(' ')[0];
        return (
          primeiroNome.charAt(0).toUpperCase() +
          primeiroNome.slice(1).toLowerCase()
        );
      });

      let tratamentoLocatario = '';
      if (primeirosNomes.length > 1) {
        tratamentoLocatario =
          primeirosNomes.slice(0, -1).join(', ') +
          ' e ' +
          primeirosNomes[primeirosNomes.length - 1];
      } else {
        tratamentoLocatario = primeirosNomes[0] || '[PRIMEIRO NOME]';
      }
      enhancedData.locatarioPrezadoWhatsapp = tratamentoLocatario;
    } else {
      enhancedData.locatarioPrezadoWhatsapp = '[PRIMEIRO NOME]';
    }

    // Gerar saudação para processo de rescisão (bom dia/boa tarde)
    const agora = new Date();
    const hora = agora.getHours();
    const saudacaoComercial = hora < 12 ? 'bom dia' : 'boa tarde';
    enhancedData.saudacaoComercial = saudacaoComercial;

    // Adicionar variáveis de data padrão
    enhancedData.dataAtual = DateHelpers.getCurrentDateBrazilian();
    enhancedData.dataComunicacao =
      formData.dataComunicacao || DateHelpers.getCurrentDateBrazilian();
    enhancedData.dataInicioRescisao =
      formData.dataInicioRescisao || DateHelpers.getCurrentDateBrazilian();
    enhancedData.dataTerminoRescisao =
      formData.dataTerminoRescisao || DateHelpers.getCurrentDateBrazilian();
    enhancedData.prazoDias = formData.prazoDias || '30';

    // Adicionar variáveis específicas para Termo de Recusa de Assinatura - E-mail
    enhancedData.dataRealizacaoVistoria =
      formData.dataRealizacaoVistoria || DateHelpers.getCurrentDateBrazilian();
    enhancedData.assinanteSelecionado =
      formData.assinanteSelecionado || '[NOME DO ASSINANTE]';

    // Adicionar variáveis de endereço e contrato
    enhancedData.enderecoImovel =
      formData.endereco || formData.enderecoImovel || '[ENDEREÇO]';
    enhancedData.numeroContrato =
      formData.numeroContrato || '[NÚMERO DO CONTRATO]';
    enhancedData.nomeProprietario =
      formData.nomesResumidosLocadores ||
      formData.nomeProprietario ||
      '[NOME DO PROPRIETÁRIO]';
    enhancedData.nomeLocatario =
      formData.nomeLocatario ||
      formData.primeiroLocatario ||
      '[NOME DO LOCATÁRIO]';

    // Processar fiadores se existirem
    const temFiador = formData.temFiador === 'sim';
    if (temFiador) {
      const fiadores = [
        formData.primeiroFiador,
        formData.segundoFiador,
        formData.terceiroFiador,
        formData.quartoFiador,
      ].filter(Boolean);

      // Adicionar fiadores individuais
      enhancedData.fiador1 = fiadores[0] || '';
      enhancedData.fiador2 = fiadores[1] || '';
      enhancedData.fiador3 = fiadores[2] || '';
      enhancedData.fiador4 = fiadores[3] || '';

      // Criar lista formatada de fiadores
      if (fiadores.length > 0) {
        const nomesFiadoresFormatados =
          fiadores.length > 1
            ? fiadores
                .slice(0, -1)
                .map((nome) => `<strong>${nome}</strong>`)
                .join(', ') +
              ' e ' +
              `<strong>${fiadores[fiadores.length - 1]}</strong>`
            : `<strong>${fiadores[0]}</strong>`;
        enhancedData.nomeFiadoresFormatado = nomesFiadoresFormatados;
      }
    }

    // Processar nomes formatados para proprietários
    const nomesProprietarioArray = (
      formData.nomesResumidosLocadores || formData.nomeProprietario || ''
    )
      .split(/,|\se\s|\sE\s/)
      .map((nome) => nome.trim())
      .filter(Boolean);

    if (nomesProprietarioArray.length > 0) {
      const nomeProprietarioFormatado =
        nomesProprietarioArray.length > 1
          ? nomesProprietarioArray
              .slice(0, -1)
              .map((nome) => `<strong>${nome}</strong>`)
              .join(', ') +
            ' e ' +
            `<strong>${nomesProprietarioArray[nomesProprietarioArray.length - 1]}</strong>`
          : `<strong>${nomesProprietarioArray[0]}</strong>`;
      enhancedData.nomeProprietarioFormatado = nomeProprietarioFormatado;
    }

    return enhancedData;
  }, [generateMesesComprovantes, getLocatarioQualificacao, getProprietarioQualificacao]);

  const generateDocumentWithAssinante = useCallback((
    contract: Contract,
    template: string,
    documentType: string,
    assinante: string
  ) => {
    const formData = contract.form_data;

    // Aplicar conjunções verbais antes de processar o template
    const enhancedData = applyConjunctions(formData);
    enhancedData.assinanteSelecionado = assinante;

    const processedTemplate = TemplateProcessor.processTemplate(template, enhancedData);

    // Usar o título que já foi definido (já vem com formatação correta)
    const documentTitle = documentType;

    setTimeout(() => {
      navigate('/gerar-documento', {
        state: {
          title: documentTitle,
          template: processedTemplate,
          formData: enhancedData,
          documentType: documentType,
        },
      });
    }, 800);
  }, [applyConjunctions, navigate]);

  return {
    applyConjunctions,
    generateDocumentWithAssinante,
    generateMesesComprovantes,
    getLocatarioQualificacao,
    getProprietarioQualificacao,
    isMultipleLocatarios,
    isMultipleProprietarios,
  };
};
