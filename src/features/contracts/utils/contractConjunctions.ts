import { formatDateBrazilian } from '@/utils/dateFormatter';
import { DateHelpers } from '@/utils/dateHelpers';
import {
  gerarDocumentosSolicitados,
  ConfiguracaoDocumentos,
} from '@/utils/documentosSolicitados';
import { splitNames } from '@/utils/nameHelpers';
import { ContractFormData } from '@/types/contract';

/**
 * Converte ContractFormData para Record<string, string> de forma segura
 */
function convertFormDataToRecord(
  formData: ContractFormData
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(formData)) {
    result[key] = value ?? '';
  }
  return result;
}

/**
 * Aplica conjunções verbais e formatações aos dados do contrato
 * Extrai lógica complexa de processamento de dados do componente principal
 */
export function applyContractConjunctions(
  formData: ContractFormData
): Record<string, string> {
  const safeFormData = convertFormDataToRecord(formData);
  const enhancedData = { ...safeFormData };

  // Obter qualificação completa dos locatários
  enhancedData.qualificacaoCompletaLocatarios =
    safeFormData.qualificacaoCompletaLocatarios || '[TEXTOLIVRE]';

  // Obter qualificação completa dos proprietários
  enhancedData.qualificacaoCompletaProprietario =
    safeFormData.qualificacaoCompletaLocadores || '[TEXTOLIVRE]';

  // Aplicar conjunções para locatários
  // PRIORIDADE: Gênero selecionado manualmente > Detecção automática
  const generoLocatario = safeFormData.generoLocatario;

  // Detecção automática (usado apenas como fallback)
  const hasMultipleLocatarioFields = !!(
    safeFormData.primeiroLocatario &&
    (safeFormData.segundoLocatario ||
      safeFormData.terceiroLocatario ||
      safeFormData.quartoLocatario)
  );

  const nomeLocatarioCheck =
    safeFormData.nomeLocatario || safeFormData.primeiroLocatario || '';
  const hasMultipleNamesInField =
    nomeLocatarioCheck.includes(',') ||
    nomeLocatarioCheck.includes(' e ') ||
    nomeLocatarioCheck.includes(' E ');

  const autoDetectedMultiple =
    hasMultipleLocatarioFields || hasMultipleNamesInField;

  // Determinar se é plural baseado no gênero selecionado OU detecção automática
  const isMultipleLocatarios =
    generoLocatario === 'masculinos' ||
    generoLocatario === 'femininos' ||
    (!generoLocatario && autoDetectedMultiple);

  enhancedData.isMultipleLocatarios = isMultipleLocatarios.toString();

  // Aplicar conjugações baseadas no gênero MANUAL
  if (generoLocatario === 'femininos') {
    // Plural feminino
    enhancedData.locatarioTerm = 'LOCATÁRIAS';
    enhancedData.locatarioTermComercial = 'locatárias';
    enhancedData.locatarioTermNoArtigo = 'as locatárias';
    enhancedData.locatarioComunicou = 'informaram';
    enhancedData.locatarioIra = 'irão';
    enhancedData.locatarioTermo = 'das locatárias';
    enhancedData.locatarioPrezado = 'Prezadas';
    enhancedData.locatarioDocumentacao = 'das locatárias';
    enhancedData.locatarioResponsabilidade = 'das locatárias';
    enhancedData.locatarioTermoPelo = 'pelas locatárias';
  } else if (generoLocatario === 'masculinos') {
    // Plural masculino
    enhancedData.locatarioTerm = 'LOCATÁRIOS';
    enhancedData.locatarioTermComercial = 'locatários';
    enhancedData.locatarioTermNoArtigo = 'os locatários';
    enhancedData.locatarioComunicou = 'informaram';
    enhancedData.locatarioIra = 'irão';
    enhancedData.locatarioTermo = 'dos locatários';
    enhancedData.locatarioPrezado = 'Prezados';
    enhancedData.locatarioDocumentacao = 'dos locatários';
    enhancedData.locatarioResponsabilidade = 'dos locatários';
    enhancedData.locatarioTermoPelo = 'pelos locatários';
  } else if (generoLocatario === 'feminino') {
    // Singular feminino
    enhancedData.locatarioTerm = 'LOCATÁRIA';
    enhancedData.locatarioTermComercial = 'locatária';
    enhancedData.locatarioTermNoArtigo = 'a locatária';
    enhancedData.locatarioDocumentacao = 'da locatária';
    enhancedData.locatarioResponsabilidade = 'da locatária';
    enhancedData.locatarioComunicou = 'informou';
    enhancedData.locatarioIra = 'irá';
    enhancedData.locatarioTermo = 'da locatária';
    enhancedData.locatarioPrezado = 'Prezada';
    enhancedData.locatarioTermoPelo = 'pela locatária';
  } else if (generoLocatario === 'masculino') {
    // Singular masculino
    enhancedData.locatarioTerm = 'LOCATÁRIO';
    enhancedData.locatarioTermComercial = 'locatário';
    enhancedData.locatarioTermNoArtigo = 'o locatário';
    enhancedData.locatarioDocumentacao = 'do locatário';
    enhancedData.locatarioResponsabilidade = 'do locatário';
    enhancedData.locatarioComunicou = 'informou';
    enhancedData.locatarioIra = 'irá';
    enhancedData.locatarioTermo = 'do locatário';
    enhancedData.locatarioPrezado = 'Prezado';
    enhancedData.locatarioTermoPelo = 'pelo locatário';
  } else if (autoDetectedMultiple) {
    // Fallback: detecção automática indica plural (padrão masculino)
    enhancedData.locatarioTerm = 'LOCATÁRIOS';
    enhancedData.locatarioTermComercial = 'locatários';
    enhancedData.locatarioTermNoArtigo = 'os locatários';
    enhancedData.locatarioComunicou = 'informaram';
    enhancedData.locatarioIra = 'irão';
    enhancedData.locatarioTermo = 'dos locatários';
    enhancedData.locatarioPrezado = 'Prezados';
    enhancedData.locatarioDocumentacao = 'dos locatários';
    enhancedData.locatarioResponsabilidade = 'dos locatários';
    enhancedData.locatarioTermoPelo = 'pelos locatários';
  } else {
    // Fallback: singular masculino (padrão)
    enhancedData.locatarioTerm = 'LOCATÁRIO';
    enhancedData.locatarioTermComercial = 'locatário';
    enhancedData.locatarioTermNoArtigo = 'o locatário';
    enhancedData.locatarioDocumentacao = 'do locatário';
    enhancedData.locatarioResponsabilidade = 'do locatário';
    enhancedData.locatarioComunicou = 'informou';
    enhancedData.locatarioIra = 'irá';
    enhancedData.locatarioTermo = 'do locatário';
    enhancedData.locatarioPrezado = 'Prezado';
    enhancedData.locatarioTermoPelo = 'pelo locatário';
  }

  // Usar os dados dos locatários adicionados manualmente
  enhancedData.primeiroLocatario = safeFormData.primeiroLocatario || '';
  enhancedData.segundoLocatario = safeFormData.segundoLocatario || '';
  enhancedData.terceiroLocatario = safeFormData.terceiroLocatario || '';
  enhancedData.quartoLocatario = safeFormData.quartoLocatario || '';

  // Aplicar conjunções para proprietários
  // PRIORIDADE: Gênero selecionado manualmente > Detecção automática
  const generoProprietario = safeFormData.generoProprietario;

  // Detecção automática (usado apenas como fallback)
  const nomeProprietarioCheck = safeFormData.nomeProprietario || '';
  const autoDetectedMultipleProprietarios =
    nomeProprietarioCheck.includes(' e ') ||
    nomeProprietarioCheck.includes(' E ');

  const _isMultipleProprietarios =
    generoProprietario === 'masculinos' ||
    generoProprietario === 'femininos' ||
    (!generoProprietario && autoDetectedMultipleProprietarios);

  // Aplicar conjugações baseadas no gênero MANUAL
  if (generoProprietario === 'femininos') {
    // Plural feminino
    enhancedData.proprietarioTerm = 'as proprietárias';
    enhancedData.locadorTerm = 'LOCADORAS';
    enhancedData.locadorTermComercial = 'locadoras';
    enhancedData.proprietarioPrezado = 'Prezadas';
  } else if (generoProprietario === 'masculinos') {
    // Plural masculino
    enhancedData.proprietarioTerm = 'os proprietários';
    enhancedData.locadorTerm = 'LOCADORES';
    enhancedData.locadorTermComercial = 'locadores';
    enhancedData.proprietarioPrezado = 'Prezados';
  } else if (generoProprietario === 'feminino') {
    // Singular feminino
    enhancedData.proprietarioTerm = 'a proprietária';
    enhancedData.locadorTerm = 'LOCADORA';
    enhancedData.locadorTermComercial = 'locadora';
    enhancedData.proprietarioPrezado = 'Prezada';
  } else if (generoProprietario === 'masculino') {
    // Singular masculino
    enhancedData.proprietarioTerm = 'o proprietário';
    enhancedData.locadorTerm = 'LOCADOR';
    enhancedData.locadorTermComercial = 'locador';
    enhancedData.proprietarioPrezado = 'Prezado';
  } else if (autoDetectedMultipleProprietarios) {
    // Fallback: detecção automática indica plural (padrão masculino)
    enhancedData.proprietarioTerm = 'os proprietários';
    enhancedData.locadorTerm = 'LOCADORES';
    enhancedData.locadorTermComercial = 'locadores';
    enhancedData.proprietarioPrezado = 'Prezados';
  } else {
    // Fallback: singular masculino (padrão)
    enhancedData.proprietarioTerm = 'o proprietário';
    enhancedData.locadorTerm = 'LOCADOR';
    enhancedData.locadorTermComercial = 'locador';
    enhancedData.proprietarioPrezado = 'Prezado';
  }

  // Gerar meses dos comprovantes (sempre os 3 últimos meses)
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

  for (let i = 2; i >= 0; i--) {
    const mes = new Date(hoje);
    mes.setMonth(hoje.getMonth() - i);
    meses.push(nomesMeses[mes.getMonth()]);
  }
  enhancedData.mesesComprovantes = `${meses.join(', ')} de ${hoje.getFullYear()}`;

  // Extrair primeiro nome do locatário
  const nomeLocatarioCompleto =
    safeFormData.nomeLocatario ||
    safeFormData.primeiroLocatario ||
    '[PRIMEIRO NOME]';
  const primeiroNome =
    nomeLocatarioCompleto?.split(' ')[0] || '[PRIMEIRO NOME]';
  enhancedData.primeiroNomeLocatario =
    primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();

  // Extrair primeiro nome do proprietário
  const nomeProprietarioCompleto =
    safeFormData.nomeProprietario ||
    safeFormData.nomesResumidosLocadores ||
    '[PRIMEIRO NOME]';
  const primeiroNomeProprietario =
    nomeProprietarioCompleto?.split(' ')[0] || '[PRIMEIRO NOME]';
  enhancedData.primeiroNomeProprietario =
    primeiroNomeProprietario.charAt(0).toUpperCase() +
    primeiroNomeProprietario.slice(1).toLowerCase();

  // Gerar saudação para devolutiva do proprietário
  const nomeProprietarioSaudacao =
    safeFormData.nomeProprietario || safeFormData.nomesResumidosLocadores || '';
  const hasMultipleProprietarioNames =
    nomeProprietarioSaudacao.includes(' e ') ||
    nomeProprietarioSaudacao.includes(' E ');

  // Determinar tratamento baseado no gênero selecionado manualmente
  let tratamentoProprietario;
  if (generoProprietario === 'femininos') {
    tratamentoProprietario = 'Prezadas';
  } else if (generoProprietario === 'masculinos') {
    tratamentoProprietario = 'Prezados';
  } else if (generoProprietario === 'feminino') {
    tratamentoProprietario = 'Prezada';
  } else if (generoProprietario === 'masculino') {
    tratamentoProprietario = 'Prezado';
  } else if (hasMultipleProprietarioNames) {
    // Fallback: detecção automática (padrão masculino plural)
    tratamentoProprietario = 'Prezados';
  } else {
    // Fallback: singular masculino
    tratamentoProprietario = 'Prezado';
  }

  if (hasMultipleProprietarioNames) {
    const nomesProprietarios = splitNames(nomeProprietarioSaudacao);
    const primeirosNomes = nomesProprietarios.map((nome) => {
      const primeiro = nome.split(' ')[0];
      return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
    });
    const nomesFormatados =
      primeirosNomes.length > 1
        ? primeirosNomes
            .slice(0, -1)
            .map((nome) => `<strong>${nome}</strong>`)
            .join(', ') +
          ' e ' +
          `<strong>${primeirosNomes[primeirosNomes.length - 1]}</strong>`
        : `<strong>${primeirosNomes[0]}</strong>`;
    enhancedData.saudacaoProprietario = `${tratamentoProprietario} ${nomesFormatados}`;
  } else {
    enhancedData.saudacaoProprietario = `${tratamentoProprietario} <strong>${enhancedData.primeiroNomeProprietario}</strong>`;
  }

  // Gerar saudação para devolutiva do locatário
  const nomeLocatarioSaudacao =
    safeFormData.nomeLocatario || safeFormData.primeiroLocatario || '';
  const hasMultipleLocatarioNames =
    nomeLocatarioSaudacao.includes(' e ') ||
    nomeLocatarioSaudacao.includes(' E ');

  // Determinar tratamento baseado no gênero selecionado manualmente
  let tratamentoLocatario;
  if (generoLocatario === 'femininos') {
    tratamentoLocatario = 'Prezadas';
  } else if (generoLocatario === 'masculinos') {
    tratamentoLocatario = 'Prezados';
  } else if (generoLocatario === 'feminino') {
    tratamentoLocatario = 'Prezada';
  } else if (generoLocatario === 'masculino') {
    tratamentoLocatario = 'Prezado';
  } else if (hasMultipleLocatarioNames) {
    // Fallback: detecção automática (padrão masculino plural)
    tratamentoLocatario = 'Prezados';
  } else {
    // Fallback: singular masculino
    tratamentoLocatario = 'Prezado';
  }

  if (hasMultipleLocatarioNames) {
    const nomesLocatarios = splitNames(nomeLocatarioSaudacao);
    const primeirosNomes = nomesLocatarios.map((nome) => {
      const primeiro = nome.split(' ')[0];
      return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
    });
    const nomesFormatados =
      primeirosNomes.length > 1
        ? primeirosNomes
            .slice(0, -1)
            .map((nome) => `<strong>${nome}</strong>`)
            .join(', ') +
          ' e ' +
          `<strong>${primeirosNomes[primeirosNomes.length - 1]}</strong>`
        : `<strong>${primeirosNomes[0]}</strong>`;
    enhancedData.saudacaoLocatario = `${tratamentoLocatario} ${nomesFormatados}`;
  } else {
    enhancedData.saudacaoLocatario = `${tratamentoLocatario} <strong>${enhancedData.primeiroNomeLocatario}</strong>`;
  }

  // Saudações para WhatsApp
  enhancedData.proprietarioPrezadoWhatsapp = tratamentoProprietario;
  enhancedData.locatarioPrezadoWhatsapp = tratamentoLocatario;

  // Saudação comercial (bom dia/boa tarde)
  const agora = new Date();
  const hora = agora.getHours();
  enhancedData.saudacaoComercial = hora < 12 ? 'bom dia' : 'boa tarde';

  // Formatar nomes com negrito
  const nomeLocatario =
    safeFormData.nomeLocatario ||
    safeFormData.primeiroLocatario ||
    '[NOME DO LOCATÁRIO]';
  const nomesLocatarioArray = splitNames(nomeLocatario);
  enhancedData.nomeLocatarioFormatado =
    nomesLocatarioArray.length > 1
      ? nomesLocatarioArray.slice(0, -1).join(', ') +
        ' e ' +
        nomesLocatarioArray[nomesLocatarioArray.length - 1]
      : nomesLocatarioArray[0];

  const nomeProprietario =
    safeFormData.nomeProprietario ||
    safeFormData.nomesResumidosLocadores ||
    '[NOME DO PROPRIETÁRIO]';
  const nomesProprietarioArray = splitNames(nomeProprietario);
  enhancedData.nomeProprietarioFormatado =
    nomesProprietarioArray.length > 1
      ? nomesProprietarioArray
          .slice(0, -1)
          .map((nome) => `<strong>${nome}</strong>`)
          .join(', ') +
        ' e ' +
        `<strong>${nomesProprietarioArray[nomesProprietarioArray.length - 1]}</strong>`
      : `<strong>${nomesProprietarioArray[0]}</strong>`;

  // Gerar lista de todos os primeiros nomes (locadores + locatários) para e-mail de convite
  const todosPrimeirosNomes: string[] = [];

  // Adicionar primeiros nomes dos locadores
  nomesProprietarioArray.forEach((nomeCompleto) => {
    const primeiroNome = nomeCompleto.split(' ')[0];
    const primeiroNomeCapitalizado =
      primeiroNome.charAt(0).toUpperCase() +
      primeiroNome.slice(1).toLowerCase();
    todosPrimeirosNomes.push(primeiroNomeCapitalizado);
  });

  // Adicionar primeiros nomes dos locatários
  nomesLocatarioArray.forEach((nomeCompleto) => {
    const primeiroNome = nomeCompleto.split(' ')[0];
    const primeiroNomeCapitalizado =
      primeiroNome.charAt(0).toUpperCase() +
      primeiroNome.slice(1).toLowerCase();
    todosPrimeirosNomes.push(primeiroNomeCapitalizado);
  });

  // Formatando a lista com vírgulas e "e" antes do último
  if (todosPrimeirosNomes.length > 0) {
    if (todosPrimeirosNomes.length === 1) {
      enhancedData.todosNomesConviteVistoria = todosPrimeirosNomes[0];
    } else {
      enhancedData.todosNomesConviteVistoria =
        todosPrimeirosNomes.slice(0, -1).join(', ') +
        ' e ' +
        todosPrimeirosNomes[todosPrimeirosNomes.length - 1] +
        '.';
    }
  } else {
    enhancedData.todosNomesConviteVistoria = '';
  }

  // Adicionar variáveis de data padrão
  enhancedData.dataAtual = DateHelpers.getCurrentDateBrazilian();
  enhancedData.dataComunicacao =
    safeFormData.dataComunicacao || DateHelpers.getCurrentDateBrazilian();
  enhancedData.dataInicioRescisao =
    safeFormData.dataInicioRescisao || DateHelpers.getCurrentDateBrazilian();
  enhancedData.dataTerminoRescisao =
    safeFormData.dataTerminoRescisao || DateHelpers.getCurrentDateBrazilian();
  enhancedData.prazoDias = safeFormData.prazoDias || '30';

  // Variáveis para Termo de Recusa de Assinatura
  enhancedData.dataRealizacaoVistoria =
    safeFormData.dataRealizacaoVistoria ||
    DateHelpers.getCurrentDateBrazilian();
  enhancedData.assinanteSelecionado =
    safeFormData.assinanteSelecionado || '[NOME DO ASSINANTE]';

  // Sempre definir David Issa como responsável técnico padrão
  enhancedData.nomeVistoriador = safeFormData.nomeVistoriador || 'David Issa';

  // Variáveis de endereço e contrato
  enhancedData.enderecoImovel =
    safeFormData.endereco || safeFormData.enderecoImovel || '[ENDEREÇO]';
  enhancedData.numeroContrato =
    safeFormData.numeroContrato || '[NÚMERO DO CONTRATO]';
  enhancedData.nomeProprietario =
    safeFormData.nomesResumidosLocadores ||
    safeFormData.nomeProprietario ||
    '[NOME DO PROPRIETÁRIO]';
  enhancedData.nomeLocatario =
    safeFormData.nomeLocatario || '[NOME DO LOCATÁRIO]';

  // Campos de gênero
  enhancedData.generoProprietario = safeFormData.generoProprietario;
  enhancedData.generoLocatario = safeFormData.generoLocatario;

  // Tratamento para pronomes de gênero
  // Proprietário
  if (generoProprietario === 'femininos') {
    enhancedData.tratamentoProprietarioGenero = 'as senhoras';
  } else if (generoProprietario === 'masculinos') {
    enhancedData.tratamentoProprietarioGenero = 'os senhores';
  } else if (generoProprietario === 'feminino') {
    enhancedData.tratamentoProprietarioGenero = 'a senhora';
  } else {
    // Padrão: masculino singular
    enhancedData.tratamentoProprietarioGenero = 'o senhor';
  }

  // Locatário - pronomes possessivos
  if (generoLocatario === 'femininos') {
    enhancedData.tratamentoLocatarioGenero = 'suas';
    enhancedData.tratamentoLocatarioGeneroPlural = 'suas';
  } else if (generoLocatario === 'masculinos') {
    enhancedData.tratamentoLocatarioGenero = 'seus';
    enhancedData.tratamentoLocatarioGeneroPlural = 'seus';
  } else if (generoLocatario === 'feminino') {
    enhancedData.tratamentoLocatarioGenero = 'sua';
    enhancedData.tratamentoLocatarioGeneroPlural = 'suas';
  } else {
    // Padrão: masculino singular
    enhancedData.tratamentoLocatarioGenero = 'seu';
    enhancedData.tratamentoLocatarioGeneroPlural = 'seus';
  }

  // Locador - tratamento com preposição
  if (generoProprietario === 'femininos') {
    enhancedData.tratamentoLocadorGenero = 'às locadoras';
  } else if (generoProprietario === 'masculinos') {
    enhancedData.tratamentoLocadorGenero = 'aos locadores';
  } else if (generoProprietario === 'feminino') {
    enhancedData.tratamentoLocadorGenero = 'à locadora';
  } else {
    // Padrão: masculino singular
    enhancedData.tratamentoLocadorGenero = 'ao locador';
  }

  // Notificação V.S / V.Sa
  if (generoLocatario === 'femininos') {
    enhancedData.tratamentoLocatarioNotificacao = 'V.Sas';
  } else if (generoLocatario === 'masculinos') {
    enhancedData.tratamentoLocatarioNotificacao = 'V.Ss';
  } else if (generoLocatario === 'feminino') {
    enhancedData.tratamentoLocatarioNotificacao = 'V.Sa';
  } else {
    // Padrão: masculino singular
    enhancedData.tratamentoLocatarioNotificacao = 'V.S';
  }

  // Nomes resumidos
  enhancedData.nomesResumidosLocadores = safeFormData.nomesResumidosLocadores;

  // Variáveis específicas dos termos
  enhancedData.dataFirmamentoContrato =
    safeFormData.dataFirmamentoContrato || formatDateBrazilian(new Date());
  enhancedData.dataVistoria =
    safeFormData.dataVistoria || formatDateBrazilian(new Date());
  enhancedData.cpflDaev = safeFormData.cpflDaev || '[CPFL/DAEV]';
  enhancedData.quantidadeChaves =
    safeFormData.quantidadeChaves || '[QUANTIDADE DE CHAVES]';

  // Campos de energia e água
  // Energia sempre é solicitada (conforme regra de negócio)
  enhancedData.cpfl = 'SIM';

  // Água: usar campo solicitarAgua do cadastro
  enhancedData.statusAgua =
    safeFormData.solicitarAgua === 'sim' ? 'SIM' : 'NAO';
  enhancedData.tipoAgua = safeFormData.tipoAgua || 'DAEV'; // mantém default apenas se não informado

  // Variáveis do distrato
  enhancedData.dataLiquidacao =
    safeFormData.dataLiquidacao || formatDateBrazilian(new Date());

  // Gerar lista de documentos solicitados
  const configDocumentos: ConfiguracaoDocumentos = {
    solicitarCondominio: safeFormData.solicitarCondominio || 'nao',
    // Usar somente solicitarAgua do cadastro (não mais statusAgua)
    solicitarAgua: safeFormData.solicitarAgua === 'sim' ? 'sim' : 'nao',
    // Energia elétrica sempre é solicitada (conforme comentário no formulário)
    solicitarEnergia: 'sim',
    solicitarGas: safeFormData.solicitarGas || 'nao',
    solicitarCND: safeFormData.solicitarCND || 'nao',
  };

  enhancedData.documentosSolicitados =
    gerarDocumentosSolicitados(configDocumentos);

  // Manter campos individuais
  enhancedData.solicitarCondominio = safeFormData.solicitarCondominio || 'nao';
  enhancedData.solicitarAgua =
    safeFormData.solicitarAgua === 'sim' ? 'sim' : 'nao';
  enhancedData.solicitarEnergia = 'sim'; // Energia elétrica sempre é solicitada
  enhancedData.solicitarGas = safeFormData.solicitarGas || 'nao';
  enhancedData.solicitarCND = safeFormData.solicitarCND || 'nao';

  // Definir título para notificação de agendamento baseado no gênero e quantidade de locatários
  if (generoLocatario === 'femininos') {
    enhancedData.notificadoLocatarioTitulo = 'Notificadas Locatárias';
  } else if (generoLocatario === 'masculinos') {
    enhancedData.notificadoLocatarioTitulo = 'Notificados Locatários';
  } else if (generoLocatario === 'feminino') {
    enhancedData.notificadoLocatarioTitulo = 'Notificada Locatária';
  } else if (generoLocatario === 'masculino') {
    enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
  } else if (isMultipleLocatarios) {
    // Fallback: detecção automática (padrão masculino plural)
    enhancedData.notificadoLocatarioTitulo = 'Notificados Locatários';
  } else {
    // Fallback: singular masculino
    enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
  }

  return enhancedData;
}
