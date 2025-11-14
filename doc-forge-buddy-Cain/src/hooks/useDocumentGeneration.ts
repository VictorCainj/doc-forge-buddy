/**
 * Hook para processamento de templates e geração de documentos
 * Extrai toda a lógica complexa de processamento do componente Contratos
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contract, ContractFormData } from '@/types/contract';
import { DateHelpers } from '@/utils/core/dateHelpers';
import { TemplateProcessor } from '@/utils/templateProcessor';
import { splitNames, formatNamesList, formatNamesListWithHTML } from '@/utils/nameHelpers';

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
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
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
  const getProprietarioQualificacao = useCallback(
    (formData: ContractFormData) => {
      return formData.qualificacaoCompletaLocadores || '[TEXTOLIVRE]';
    },
    []
  );

  // Função para detectar múltiplos locatários
  // ATENÇÃO: Esta função não deve mais ser usada para detecção baseada em vírgulas ou "e"
  // A detecção deve ser feita pelos campos individuais (primeiroLocatario, segundoLocatario, etc.)
  // ou pelo gênero selecionado manualmente (masculinos/femininos)
  const isMultipleLocatarios = useCallback((nomeLocatario: string) => {
    // Mantido apenas para compatibilidade com código legado
    // Retorna false pois não devemos mais detectar por vírgulas ou "e"
    return false;
  }, []);

  // Função para detectar múltiplos proprietários
  // ATENÇÃO: Esta função não deve mais ser usada para detecção baseada em vírgulas ou "e"
  // A detecção deve ser feita pelo gênero selecionado manualmente (masculinos/femininos)
  const isMultipleProprietarios = useCallback((nomeProprietario: string) => {
    // Mantido apenas para compatibilidade com código legado
    // Retorna false pois não devemos mais detectar por vírgulas ou "e"
    return false;
  }, []);

  // Função para aplicar conjunções verbais
  const applyConjunctions = useCallback(
    (formData: ContractFormData): ContractFormData => {
      const enhancedData = { ...formData };

      // Obter qualificação completa dos locatários (texto livre)
      enhancedData.qualificacaoCompletaLocatarios =
        getLocatarioQualificacao(formData);

      // Obter qualificação completa dos proprietários (texto livre)
      enhancedData.qualificacaoCompletaProprietario =
        getProprietarioQualificacao(formData);

      // Aplicar conjunções para locatários baseado na quantidade adicionada
      const isMultipleLocatariosCheck = !!(
        formData.primeiroLocatario &&
        (formData.segundoLocatario ||
          formData.terceiroLocatario ||
          formData.quartoLocatario)
      );

      if (isMultipleLocatariosCheck) {
        enhancedData.locatarioTerm = 'LOCATÁRIOS';
        enhancedData.locatarioTermComercial = 'locatários';
        enhancedData.locatarioDocumentacao = 'dos locatários';
        enhancedData.locatarioResponsabilidade = 'dos locatários';
      } else if (formData.primeiroLocatario) {
        // Usar o gênero do locatário para definir o termo correto
        const generoLocatario = formData.generoLocatario;
        if (generoLocatario === 'feminino') {
          enhancedData.locatarioTerm = 'LOCATÁRIA';
          enhancedData.locatarioTermComercial = 'locatária';
          enhancedData.locatarioDocumentacao = 'da locatária';
          enhancedData.locatarioResponsabilidade = 'da locatária';
          enhancedData.locatarioPrezado = 'Prezada';
        } else {
          enhancedData.locatarioTerm = 'LOCATÁRIO';
          enhancedData.locatarioTermComercial = 'locatário';
          enhancedData.locatarioDocumentacao = 'do locatário';
          enhancedData.locatarioResponsabilidade = 'do locatário';
          enhancedData.locatarioPrezado = 'Prezado';
        }
      } else {
        enhancedData.locatarioTerm = 'LOCATÁRIO';
        enhancedData.locatarioTermComercial = 'locatário';
        enhancedData.locatarioDocumentacao = 'do locatário';
        enhancedData.locatarioResponsabilidade = 'do locatário';
        enhancedData.locatarioPrezado = 'Prezado';
      }

      // Usar os dados dos locatários adicionados manualmente
      enhancedData.primeiroLocatario = formData.primeiroLocatario || '';
      enhancedData.segundoLocatario = formData.segundoLocatario || '';
      enhancedData.terceiroLocatario = formData.terceiroLocatario || '';
      enhancedData.quartoLocatario = formData.quartoLocatario || '';

      // Aplicar conjunções para proprietários baseado no gênero selecionado
      // Não usar mais detecção baseada em vírgulas ou "e" no nome
      const generoProprietario = formData.generoProprietario;
      const isMultipleProprietariosCheck =
        generoProprietario === 'masculinos' || generoProprietario === 'femininos';
      if (isMultipleProprietariosCheck) {
        enhancedData.proprietarioTerm = 'os proprietários';
        enhancedData.locadorTermComercial = 'locadores';
        enhancedData.proprietarioPrezado = 'Prezado';
      } else if (formData.nomeProprietario) {
        // Usar o gênero do proprietário para definir o termo correto
        const generoProprietario = formData.generoProprietario;
        if (generoProprietario === 'feminino') {
          enhancedData.proprietarioTerm = 'a proprietária';
          enhancedData.locadorTermComercial = 'locadora';
          enhancedData.proprietarioPrezado = 'Prezada';
        } else {
          enhancedData.proprietarioTerm = 'o proprietário';
          enhancedData.locadorTermComercial = 'locador';
          enhancedData.proprietarioPrezado = 'Prezado';
        }
      } else {
        enhancedData.proprietarioTerm = 'o proprietário';
        enhancedData.locadorTermComercial = 'locador';
        enhancedData.proprietarioPrezado = 'Prezado';
      }

      // Gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
      const mesesComprovantes = generateMesesComprovantes();
      enhancedData.mesesComprovantes = mesesComprovantes;

      // Extrair primeiro nome do locatário e capitalizar apenas a primeira letra
      const nomeLocatarioCompleto =
        formData.nomeLocatario ||
        formData.primeiroLocatario ||
        '[PRIMEIRO NOME]';
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
      enhancedData.primeiroNomeProprietario =
        primeiroNomeProprietarioCapitalizado;

      // Processar nomes para saudação WhatsApp - Proprietários
      // Formatação convencional para exibição: vírgulas e "e" quando há múltiplos nomes
      const nomeProprietarioCompletoSaudacao =
        formData.nomesResumidosLocadores || formData.nomeProprietario || '';
      if (nomeProprietarioCompletoSaudacao) {
        const nomesProprietariosSaudacao = splitNames(
          nomeProprietarioCompletoSaudacao
        );
        const primeirosNomes = nomesProprietariosSaudacao.map((nome) => {
          const primeiroNome = nome.split(' ')[0];
          return (
            primeiroNome.charAt(0).toUpperCase() +
            primeiroNome.slice(1).toLowerCase()
          );
        });

        // Formatação convencional: 1 nome sem separador, 2 nomes com "e", 3+ nomes com vírgulas e "e"
        const tratamentoProprietario = primeirosNomes.length > 0
          ? formatNamesList(primeirosNomes)
          : '[PRIMEIRO NOME]';
        enhancedData.proprietarioPrezadoWhatsapp = tratamentoProprietario;
      } else {
        enhancedData.proprietarioPrezadoWhatsapp = '[PRIMEIRO NOME]';
      }

      // Processar nomes para saudação WhatsApp - Locatários
      // Formatação convencional para exibição: vírgulas e "e" quando há múltiplos nomes
      const nomeLocatarioCompletoSaudacao =
        formData.nomeLocatario || formData.primeiroLocatario || '';
      if (nomeLocatarioCompletoSaudacao) {
        // Coletar todos os locatários dos campos individuais (mantendo individualidade no cadastro)
        const locatariosIndividuais: string[] = [];
        if (formData.primeiroLocatario) locatariosIndividuais.push(formData.primeiroLocatario);
        if (formData.segundoLocatario) locatariosIndividuais.push(formData.segundoLocatario);
        if (formData.terceiroLocatario) locatariosIndividuais.push(formData.terceiroLocatario);
        if (formData.quartoLocatario) locatariosIndividuais.push(formData.quartoLocatario);
        
        const nomesLocatariosSaudacao = locatariosIndividuais.length > 0
          ? locatariosIndividuais
          : splitNames(nomeLocatarioCompletoSaudacao);
        
        const primeirosNomes = nomesLocatariosSaudacao.map((nome) => {
          const primeiroNome = nome.split(' ')[0];
          return (
            primeiroNome.charAt(0).toUpperCase() +
            primeiroNome.slice(1).toLowerCase()
          );
        });

        // Formatação convencional: 1 nome sem separador, 2 nomes com "e", 3+ nomes com vírgulas e "e"
        const tratamentoLocatario = primeirosNomes.length > 0
          ? formatNamesList(primeirosNomes)
          : '[PRIMEIRO NOME]';
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
        formData.dataRealizacaoVistoria ||
        DateHelpers.getCurrentDateBrazilian();
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
      // Compatibilidade: verificar tanto tipoGarantia quanto temFiador
      const temFiador = formData.tipoGarantia === 'Fiador' || formData.temFiador === 'sim';
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

        // Criar lista formatada de fiadores - formatação convencional para exibição
        if (fiadores.length > 0) {
          const nomesFiadoresFormatados = formatNamesListWithHTML(fiadores);
          enhancedData.nomeFiadoresFormatado = nomesFiadoresFormatados;
        }
      }

      // Processar nomes formatados para proprietários - formatação convencional para exibição
      const nomesProprietarioArray = splitNames(
        formData.nomesResumidosLocadores || formData.nomeProprietario || ''
      );

      if (nomesProprietarioArray.length > 0) {
        const nomeProprietarioFormatado = formatNamesListWithHTML(nomesProprietarioArray);
        enhancedData.nomeProprietarioFormatado = nomeProprietarioFormatado;
      }

      return enhancedData;
    },
    [
      generateMesesComprovantes,
      getLocatarioQualificacao,
      getProprietarioQualificacao,
    ]
  );

  const generateDocumentWithAssinante = useCallback(
    (
      contract: Contract,
      template: string,
      documentType: string,
      assinante: string
    ) => {
      const formData = contract.form_data;

      // Aplicar conjunções verbais antes de processar o template
      const enhancedData = applyConjunctions(formData);
      enhancedData.assinanteSelecionado = assinante;

      const processedTemplate = TemplateProcessor.processTemplate(
        template,
        enhancedData
      );

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
    },
    [applyConjunctions, navigate]
  );

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
