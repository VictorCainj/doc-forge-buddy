import { formatDateBrazilian } from '@/utils/dateFormatter';
import { DateHelpers } from '@/utils/dateHelpers';
import { gerarDocumentosSolicitados, ConfiguracaoDocumentos } from '@/utils/documentosSolicitados';

/**
 * Aplica conjunções verbais e formatações aos dados do contrato
 * Extrai lógica complexa de processamento de dados do componente principal
 */
export function applyContractConjunctions(formData: Record<string, string>): Record<string, string> {
  const enhancedData = { ...formData };

  // Obter qualificação completa dos locatários
  enhancedData.qualificacaoCompletaLocatarios =
    formData.qualificacaoCompletaLocatarios || '[TEXTOLIVRE]';

  // Obter qualificação completa dos proprietários
  enhancedData.qualificacaoCompletaProprietario =
    formData.qualificacaoCompletaLocadores || '[TEXTOLIVRE]';

  // Aplicar conjunções para locatários
  const isMultipleLocatarios = !!(
    formData.primeiroLocatario &&
    (formData.segundoLocatario ||
      formData.terceiroLocatario ||
      formData.quartoLocatario)
  );
  enhancedData.isMultipleLocatarios = isMultipleLocatarios.toString();

  if (isMultipleLocatarios) {
    enhancedData.locatarioTerm = 'LOCATÁRIOS';
    enhancedData.locatarioTermComercial = 'LOCATÁRIOS';
    enhancedData.locatarioTermNoArtigo = 'os locatários';
    enhancedData.locatarioComunicou = 'informaram';
    enhancedData.locatarioIra = 'irão';
    enhancedData.locatarioTermo = 'do locatário';
    enhancedData.locatarioPrezado = 'Prezado';
    enhancedData.locatarioDocumentacao = 'dos locatários';
    enhancedData.locatarioResponsabilidade = 'dos locatários';
  } else if (formData.primeiroLocatario) {
    const generoLocatario = formData.generoLocatario;
    if (generoLocatario === 'feminino') {
      enhancedData.locatarioTerm = 'LOCATÁRIA';
      enhancedData.locatarioTermComercial = 'LOCATÁRIA';
      enhancedData.locatarioTermNoArtigo = 'a locatária';
      enhancedData.locatarioDocumentacao = 'da locatária';
      enhancedData.locatarioResponsabilidade = 'da locatária';
    } else if (generoLocatario === 'masculino') {
      enhancedData.locatarioTerm = 'LOCATÁRIO';
      enhancedData.locatarioTermComercial = 'LOCATÁRIO';
      enhancedData.locatarioTermNoArtigo = 'o locatário';
      enhancedData.locatarioDocumentacao = 'do locatário';
      enhancedData.locatarioResponsabilidade = 'do locatário';
    } else {
      enhancedData.locatarioTerm = 'LOCATÁRIO';
      enhancedData.locatarioTermComercial = 'LOCATÁRIO';
      enhancedData.locatarioTermNoArtigo = 'o locatário';
      enhancedData.locatarioDocumentacao = 'do locatário';
      enhancedData.locatarioResponsabilidade = 'do locatário';
    }
    enhancedData.locatarioComunicou = 'informou';
    enhancedData.locatarioIra = 'irá';
    enhancedData.locatarioTermo = 'do locatário';
    enhancedData.locatarioPrezado = 'Prezado';
  }

  // Usar os dados dos locatários adicionados manualmente
  enhancedData.primeiroLocatario = formData.primeiroLocatario || '';
  enhancedData.segundoLocatario = formData.segundoLocatario || '';
  enhancedData.terceiroLocatario = formData.terceiroLocatario || '';
  enhancedData.quartoLocatario = formData.quartoLocatario || '';

  // Aplicar conjunções para proprietários
  const isMultipleProprietarios =
    formData.nomeProprietario && formData.nomeProprietario.includes(' e ');
  
  if (isMultipleProprietarios) {
    enhancedData.proprietarioTerm = 'os proprietários';
    enhancedData.locadorTerm = 'LOCADORES';
    enhancedData.locadorTermComercial = 'LOCADORES';
    enhancedData.proprietarioPrezado = 'Prezado';
  } else if (formData.nomeProprietario) {
    const generoProprietario = formData.generoProprietario;
    if (generoProprietario === 'feminino') {
      enhancedData.proprietarioTerm = 'a proprietária';
      enhancedData.locadorTerm = 'LOCADORA';
      enhancedData.locadorTermComercial = 'LOCADORA';
    } else if (generoProprietario === 'masculino') {
      enhancedData.proprietarioTerm = 'o proprietário';
      enhancedData.locadorTerm = 'LOCADOR';
      enhancedData.locadorTermComercial = 'LOCADOR';
    } else {
      enhancedData.proprietarioTerm = 'o proprietário';
      enhancedData.locadorTerm = 'LOCADOR';
      enhancedData.locadorTermComercial = 'LOCADOR';
    }
    enhancedData.proprietarioPrezado = 'Prezado';
  }

  // Gerar meses dos comprovantes (sempre os 3 últimos meses)
  const hoje = new Date();
  const meses: string[] = [];
  const nomesMeses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];

  for (let i = 2; i >= 0; i--) {
    const mes = new Date(hoje);
    mes.setMonth(hoje.getMonth() - i);
    meses.push(nomesMeses[mes.getMonth()]);
  }
  enhancedData.mesesComprovantes = `${meses.join(', ')} de ${hoje.getFullYear()}`;

  // Extrair primeiro nome do locatário
  const nomeLocatarioCompleto =
    formData.nomeLocatario || formData.primeiroLocatario || '[PRIMEIRO NOME]';
  const primeiroNome =
    nomeLocatarioCompleto?.split(' ')[0] || '[PRIMEIRO NOME]';
  enhancedData.primeiroNomeLocatario =
    primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();

  // Extrair primeiro nome do proprietário
  const nomeProprietarioCompleto =
    formData.nomeProprietario || formData.nomesResumidosLocadores || '[PRIMEIRO NOME]';
  const primeiroNomeProprietario =
    nomeProprietarioCompleto?.split(' ')[0] || '[PRIMEIRO NOME]';
  enhancedData.primeiroNomeProprietario =
    primeiroNomeProprietario.charAt(0).toUpperCase() +
    primeiroNomeProprietario.slice(1).toLowerCase();

  // Gerar saudação para devolutiva do proprietário
  const generoProprietario = formData.generoProprietario;
  const nomeProprietarioSaudacao =
    formData.nomeProprietario || formData.nomesResumidosLocadores || '';
  const isMultipleProprietariosSaudacao =
    nomeProprietarioSaudacao.includes(' e ') || nomeProprietarioSaudacao.includes(' E ');

  let tratamentoProprietario;
  if (isMultipleProprietariosSaudacao) {
    tratamentoProprietario = generoProprietario === 'feminino' ? 'Prezadas' : 'Prezados';
  } else {
    tratamentoProprietario = generoProprietario === 'feminino' ? 'Prezada' : 'Prezado';
  }

  if (isMultipleProprietariosSaudacao) {
    const nomesProprietarios = nomeProprietarioSaudacao
      .split(/ e | E /)
      .map((nome) => nome.trim());
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
  const generoLocatario = formData.generoLocatario;
  const nomeLocatarioSaudacao =
    formData.nomeLocatario || formData.primeiroLocatario || '';
  const isMultipleLocatariosSaudacao =
    nomeLocatarioSaudacao.includes(' e ') || nomeLocatarioSaudacao.includes(' E ');

  let tratamentoLocatario;
  if (isMultipleLocatariosSaudacao) {
    tratamentoLocatario = generoLocatario === 'feminino' ? 'Prezadas' : 'Prezados';
  } else {
    tratamentoLocatario = generoLocatario === 'feminino' ? 'Prezada' : 'Prezado';
  }

  if (isMultipleLocatariosSaudacao) {
    const nomesLocatarios = nomeLocatarioSaudacao
      .split(/ e | E /)
      .map((nome) => nome.trim());
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
  const nomeLocatario = formData.nomeLocatario || formData.primeiroLocatario || '[NOME DO LOCATÁRIO]';
  const nomesLocatarioArray = nomeLocatario.split(/ e | E /).map((nome) => nome.trim());
  enhancedData.nomeLocatarioFormatado =
    nomesLocatarioArray.length > 1
      ? nomesLocatarioArray.slice(0, -1).join(', ') +
        ' e ' +
        nomesLocatarioArray[nomesLocatarioArray.length - 1]
      : nomesLocatarioArray[0];

  const nomeProprietario = formData.nomeProprietario || formData.nomesResumidosLocadores || '[NOME DO PROPRIETÁRIO]';
  const nomesProprietarioArray = nomeProprietario.split(/ e | E /).map((nome) => nome.trim());
  enhancedData.nomeProprietarioFormatado =
    nomesProprietarioArray.length > 1
      ? nomesProprietarioArray
          .slice(0, -1)
          .map((nome) => `<strong>${nome}</strong>`)
          .join(', ') +
        ' e ' +
        `<strong>${nomesProprietarioArray[nomesProprietarioArray.length - 1]}</strong>`
      : `<strong>${nomesProprietarioArray[0]}</strong>`;

  // Adicionar variáveis de data padrão
  enhancedData.dataAtual = DateHelpers.getCurrentDateBrazilian();
  enhancedData.dataComunicacao = formData.dataComunicacao || DateHelpers.getCurrentDateBrazilian();
  enhancedData.dataInicioRescisao = formData.dataInicioRescisao || DateHelpers.getCurrentDateBrazilian();
  enhancedData.dataTerminoRescisao = formData.dataTerminoRescisao || DateHelpers.getCurrentDateBrazilian();
  enhancedData.prazoDias = formData.prazoDias || '30';

  // Variáveis para Termo de Recusa de Assinatura
  enhancedData.dataRealizacaoVistoria = formData.dataRealizacaoVistoria || DateHelpers.getCurrentDateBrazilian();
  enhancedData.assinanteSelecionado = formData.assinanteSelecionado || '[NOME DO ASSINANTE]';

  // Variáveis de endereço e contrato
  enhancedData.enderecoImovel = formData.endereco || formData.enderecoImovel || '[ENDEREÇO]';
  enhancedData.numeroContrato = formData.numeroContrato || '[NÚMERO DO CONTRATO]';
  enhancedData.nomeProprietario = formData.nomesResumidosLocadores || formData.nomeProprietario || '[NOME DO PROPRIETÁRIO]';
  enhancedData.nomeLocatario = formData.nomeLocatario || '[NOME DO LOCATÁRIO]';

  // Campos de gênero
  enhancedData.generoProprietario = formData.generoProprietario;
  enhancedData.generoLocatario = formData.generoLocatario;

  // Tratamento para pronomes de gênero
  if (generoProprietario === 'feminino') {
    enhancedData.tratamentoProprietarioGenero = 'a senhora';
  } else {
    enhancedData.tratamentoProprietarioGenero = 'o senhor';
  }

  if (generoLocatario === 'feminino') {
    enhancedData.tratamentoLocatarioGenero = 'sua';
    enhancedData.tratamentoLocatarioGeneroPlural = 'suas';
  } else {
    enhancedData.tratamentoLocatarioGenero = 'seu';
    enhancedData.tratamentoLocatarioGeneroPlural = 'seus';
  }

  if (generoProprietario === 'feminino') {
    enhancedData.tratamentoLocadorGenero = 'à locadora';
  } else {
    enhancedData.tratamentoLocadorGenero = 'ao locador';
  }

  if (generoLocatario === 'feminino') {
    enhancedData.tratamentoLocatarioNotificacao = 'V.Sa';
  } else {
    enhancedData.tratamentoLocatarioNotificacao = 'V.S';
  }

  // Nomes resumidos
  enhancedData.nomesResumidosLocadores = formData.nomesResumidosLocadores;

  // Variáveis específicas dos termos
  enhancedData.dataFirmamentoContrato = formData.dataFirmamentoContrato || formatDateBrazilian(new Date());
  enhancedData.dataVistoria = formData.dataVistoria || formatDateBrazilian(new Date());
  enhancedData.cpflDaev = formData.cpflDaev || '[CPFL/DAEV]';
  enhancedData.quantidadeChaves = formData.quantidadeChaves || '[QUANTIDADE DE CHAVES]';

  // Campos de energia e água
  enhancedData.cpfl = formData.cpfl || 'SIM';
  enhancedData.statusAgua = formData.statusAgua || 'SIM';
  enhancedData.tipoAgua = formData.tipoAgua || 'DAEV';

  // Variáveis do distrato
  enhancedData.dataLiquidacao = formData.dataLiquidacao || formatDateBrazilian(new Date());

  // Gerar lista de documentos solicitados
  const configDocumentos: ConfiguracaoDocumentos = {
    solicitarCondominio: formData.solicitarCondominio || 'nao',
    solicitarAgua: formData.statusAgua === 'SIM' ? 'sim' : 'nao',
    solicitarEnergia: formData.cpfl === 'SIM' ? 'sim' : 'nao',
    solicitarGas: formData.solicitarGas || 'nao',
    solicitarCND: formData.solicitarCND || 'nao',
  };

  enhancedData.documentosSolicitados = gerarDocumentosSolicitados(configDocumentos);

  // Manter campos individuais
  enhancedData.solicitarCondominio = formData.solicitarCondominio || 'nao';
  enhancedData.solicitarAgua = formData.statusAgua === 'SIM' ? 'sim' : 'nao';
  enhancedData.solicitarEnergia = formData.cpfl === 'SIM' ? 'sim' : 'nao';
  enhancedData.solicitarGas = formData.solicitarGas || 'nao';
  enhancedData.solicitarCND = formData.solicitarCND || 'nao';

  // Definir título para notificação de agendamento baseado no gênero e quantidade de locatários
  if (isMultipleLocatarios) {
    enhancedData.notificadoLocatarioTitulo = 'Notificados Locatários';
  } else if (formData.primeiroLocatario) {
    const genero = formData.generoLocatario;
    if (genero === 'feminino') {
      enhancedData.notificadoLocatarioTitulo = 'Notificada Locatária';
    } else {
      enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
    }
  } else {
    enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
  }

  return enhancedData;
}
