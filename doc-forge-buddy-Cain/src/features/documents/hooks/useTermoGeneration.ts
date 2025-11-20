import { useCallback } from 'react';
import { splitNames, formatNamesList } from '@/utils/nameHelpers';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { anonymizeContractData } from '@/utils/privacyUtils';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  quantidadeChaves?: string;
  tipoGarantia?: string;
  temFiador?: string;
  nomeFiador?: string;
  nomesResumidosLocadores?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  generoLocatario?: string;
  generoProprietario?: string;
  qualificacaoCompletaLocatarios?: string;
  [key: string]: string | undefined;
}

export function useTermoGeneration(contractData: ContractData) {
  const { isPrivacyModeActive } = usePrivacyMode();
  
  const getCurrentDate = useCallback(() => {
    const today = new Date();
    const day = today.getDate();
    const months = [
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
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    return `${day} de ${month} de ${year}`;
  }, []);

  const getTemplate = useCallback(
    (fontSize: number) => {
      const titleSize = Math.max(fontSize + 2, 12);
      const signatureSize = Math.max(fontSize - 2, 10);

      return `
<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
  <div style="flex: 0 0 auto;">
    <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
  </div>
  <div style="flex: 1; text-align: right; font-size: ${fontSize}px; margin-left: 20px;">
    Valinhos, ${getCurrentDate()}.
  </div>
</div>

<div style="text-align: center; margin-bottom: 20px; font-size: ${titleSize}px; font-weight: bold;">
TERMO DE RECEBIMENTO DE CHAVES {{numeroContrato}}
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: ${fontSize}px;">
{{textoEntregaChaves}}
</div>


<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeProprietario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>DADOS DOS LOCATÁRIOS:</strong> {{nomeLocatario}}<br>
<strong>Celular:</strong> {{celularLocatario}} &nbsp;&nbsp;&nbsp;&nbsp; <strong>E-mail:</strong> {{emailLocatario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS:</strong><br>
<strong>CPFL:</strong> {{cpfl}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{{tipoAgua}}:</strong> {{statusAgua}}<br>
<br>
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade {{locatarioResponsabilidade}}.
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{tipoQuantidadeChaves}}
</div>

{{#if dataVistoria}}
<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{tipoVistoriaTexto}} realizada em</strong> {{dataVistoria}}.
</div>
{{/if}}

<div style="margin: 20px 0; font-size: ${fontSize}px;">
{{statusVistoriaCheckboxes}}
</div>

<div style="margin: 20px 0; font-size: ${fontSize}px;">
{{observacao}}
</div>

  <div style="margin-top: 50px; text-align: center;">
    <div style="margin-bottom: 40px;">
      __________________________________________<br>
      <span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
      {{#if documentoQuemRetira}}
      <br><span style="font-size: ${signatureSize - 1}px;">{{documentoQuemRetira}}</span>
      {{/if}}
    </div>

    <div>
      __________________________________________<br>
      <span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{assinanteSelecionado}}</span>
    </div>
  </div>
</div>
`;
    },
    [getCurrentDate]
  );

  const handleGenerate = useCallback(
    (data: Record<string, string>) => {
      // Detectar se há múltiplos locatários baseado na quantidade adicionada
      const isMultipleLocatarios =
        contractData.primeiroLocatario &&
        (contractData.segundoLocatario ||
          contractData.terceiroLocatario ||
          contractData.quartoLocatario);

      // Detectar se há múltiplos proprietários baseado no gênero selecionado
      // Não usar mais detecção baseada em vírgulas ou "e" no nome
      const generoProprietario = contractData.generoProprietario;
      const isMultipleProprietarios =
        generoProprietario === 'masculinos' || generoProprietario === 'femininos';

      // Definir termos baseados na quantidade e gênero
      let locadorTerm;
      if (isMultipleProprietarios) {
        locadorTerm = 'LOCADORES';
      } else {
        // Usar o gênero do locador cadastrado no contrato
        const generoProprietario = contractData.generoProprietario;
        if (generoProprietario === 'feminino') {
          locadorTerm = 'LOCADORA';
        } else if (generoProprietario === 'masculino') {
          locadorTerm = 'LOCADOR';
        } else {
          locadorTerm = 'LOCADOR'; // fallback para neutro ou indefinido
        }
      }

      // Definir título baseado na quantidade e gênero
      let dadosLocatarioTitulo;
      if (isMultipleLocatarios) {
        dadosLocatarioTitulo = 'DADOS DOS LOCATÁRIOS';
      } else {
        // Usar o gênero do locatário cadastrado no contrato
        const generoLocatario = contractData.generoLocatario;
        if (generoLocatario === 'feminino') {
          dadosLocatarioTitulo = 'DADOS DA LOCATÁRIA';
        } else if (generoLocatario === 'masculino') {
          dadosLocatarioTitulo = 'DADOS DO LOCATÁRIO';
        } else {
          dadosLocatarioTitulo = 'DADOS DO LOCATÁRIO'; // fallback para neutro ou indefinido
        }
      }

      const locatarioResponsabilidade = isMultipleLocatarios
        ? 'dos locatários'
        : 'do locatário';

      // Processar nome de quem retira baseado na opção selecionada
      let nomeQuemRetira = data.nomeQuemRetira;

      if (data.incluirNomeCompleto === 'todos') {
        nomeQuemRetira = contractData.nomeLocatario;
      } else if (
        data.incluirNomeCompleto &&
        data.incluirNomeCompleto !== '' &&
        data.incluirNomeCompleto !== 'custom'
      ) {
        // Se selecionou um locatário específico
        nomeQuemRetira = data.incluirNomeCompleto;
      }
      // Se incluirNomeCompleto === 'custom', usar o valor de nomeQuemRetira que foi preenchido pelo usuário

      // Processar quantidade de chaves baseado na opção selecionada
      let tipoQuantidadeChaves = data.tipoQuantidadeChaves;
      if (data.usarQuantidadeChavesContrato === 'sim') {
        // Se selecionou usar do contrato, usar sempre a quantidade do contrato
        tipoQuantidadeChaves =
          contractData.quantidadeChaves || data.tipoQuantidadeChaves;
      } else {
        // Se não selecionou, usar o que foi digitado manualmente
        tipoQuantidadeChaves = data.tipoQuantidadeChaves;
      }

      // Processar tipo de vistoria
      const tipoVistoria = data.tipoVistoria || 'vistoria';
      const tipoVistoriaTexto =
        tipoVistoria === 'revistoria'
          ? 'Revistoria'
          : tipoVistoria === 'nao_realizada'
            ? 'Vistoria não realizada'
            : 'Vistoria';

      // Processar status da vistoria baseado no tipo selecionado
      let statusVistoria;
      if (tipoVistoria === 'nao_realizada') {
        statusVistoria = 'nao_realizada';
      } else {
        statusVistoria =
          tipoVistoria === 'revistoria'
            ? data.statusRevistoria || 'aprovada'
            : data.statusVistoria || 'aprovada';
      }

      let statusVistoriaCheckboxes;
      if (tipoVistoria === 'nao_realizada') {
        statusVistoriaCheckboxes = '( ✓ ) Vistoria não realizada';
        if (data.motivoNaoRealizacao && data.motivoNaoRealizacao.trim() !== '') {
          statusVistoriaCheckboxes += `<br><strong>Motivo:</strong> ${data.motivoNaoRealizacao}`;
        }
      } else {
        statusVistoriaCheckboxes =
          statusVistoria === 'aprovada'
            ? '( ✓ ) Imóvel entregue de acordo com a vistoria inicial<br>( &nbsp; ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade dos locatários. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.'
            : '( &nbsp; ) Imóvel entregue de acordo com a vistoria inicial<br>( ✓ ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade dos locatários. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.';
      }

      // Processar data baseada no tipo selecionado
      const dataVistoria =
        tipoVistoria === 'revistoria'
          ? data.dataRevistoria
          : tipoVistoria === 'nao_realizada'
            ? ''
            : data.dataVistoria;

      // Processar observação (só mostra se preenchida)
      const observacao =
        data.observacao && data.observacao.trim() !== ''
          ? `OBS: ${data.observacao}`
          : '';

      // Processar fiadores - puxar automaticamente do contrato
      // Compatibilidade: verificar tanto tipoGarantia quanto temFiador
      const temFiadores =
        contractData.tipoGarantia === 'Fiador' ||
        contractData.temFiador === 'sim';
      const fiadores: string[] = [];

      if (temFiadores && contractData.nomeFiador) {
        // Dividir os nomes dos fiadores (separados por vírgulas e " e ")
        const nomesFiadores = splitNames(contractData.nomeFiador);
        fiadores.push(...nomesFiadores);
      }

      // Aplicar formatação de nomes - formatação convencional para exibição
      // Coletar nomes de proprietários e aplicar formatação convencional
      const nomesProprietarioArray = splitNames(
        contractData.nomesResumidosLocadores || contractData.nomeProprietario || ''
      );
      const nomeProprietarioFormatado = nomesProprietarioArray.length > 0
        ? formatNamesList(nomesProprietarioArray)
        : contractData.nomeProprietario || '';

      // Coletar todos os locatários dos campos individuais (mantendo individualidade no cadastro)
      const locatariosIndividuais: string[] = [];
      if (contractData.primeiroLocatario) locatariosIndividuais.push(contractData.primeiroLocatario);
      if (contractData.segundoLocatario) locatariosIndividuais.push(contractData.segundoLocatario);
      if (contractData.terceiroLocatario) locatariosIndividuais.push(contractData.terceiroLocatario);
      if (contractData.quartoLocatario) locatariosIndividuais.push(contractData.quartoLocatario);
      
      // Se não houver campos individuais, usar nomeLocatario como fallback
      const nomesLocatarioArray = locatariosIndividuais.length > 0
        ? locatariosIndividuais
        : splitNames(contractData.nomeLocatario || '');
      
      // Formatação convencional: 1 nome sem separador, 2 nomes com "e", 3+ nomes com vírgulas e "e"
      const nomeLocatarioFormatado = nomesLocatarioArray.length > 0
        ? formatNamesList(nomesLocatarioArray)
        : contractData.nomeLocatario || '';

      // Texto de entrega de chaves para termo do locatário
      const tipoContrato = data.tipoContrato || 'residencial';

      // Gerar citação correta dos locatários baseada no gênero
      let citacaoLocatarios;
      const generoLocatario = contractData.generoLocatario;

      if (isMultipleLocatarios) {
        // Para múltiplos locatários, usar o gênero específico
        if (generoLocatario === 'femininos') {
          citacaoLocatarios = 'Notificadas Locatárias';
        } else if (generoLocatario === 'masculinos') {
          citacaoLocatarios = 'Notificados Locatários';
        } else {
          // Se não especificado, usar masculino como padrão
          citacaoLocatarios = 'Notificados Locatários';
        }
      } else {
        // Para locatário único, usar o gênero específico
        if (generoLocatario === 'feminino') {
          citacaoLocatarios = 'Notificada Locatária';
        } else if (generoLocatario === 'masculino') {
          citacaoLocatarios = 'Notificado Locatário';
        } else {
          // Se não especificado, usar masculino como padrão
          citacaoLocatarios = 'Notificado Locatário';
        }
      }

      // Usar a qualificação completa que já foi preenchida no cadastro do contrato
      const qualificacaoCompleta =
        contractData.qualificacaoCompletaLocatarios || nomeQuemRetira;
      const textoEntregaChaves = `Pelo presente, recebemos as chaves do imóvel sito à ${contractData.enderecoImovel}, ora locado ${qualificacaoCompleta}, devidamente qualificado no contrato de locação ${tipoContrato} firmado em ${contractData.dataFirmamentoContrato}.`;

      const enhancedData = {
        ...data,
        ...contractData,

        // Dados específicos do termo do locatário
        locadorTerm,
        dadosLocatarioTitulo,
        locatarioResponsabilidade,
        nomeQuemRetira,
        nomeProprietario: nomeProprietarioFormatado, // Nome sem negrito
        nomeLocatario: nomeLocatarioFormatado, // Nome sem negrito
        tipoQuantidadeChaves, // Quantidade de chaves processada

        // Processar observação
        observacao,

        // Status da vistoria com checkboxes
        statusVistoriaCheckboxes,

        // Texto de entrega de chaves baseado em quem está retirando
        textoEntregaChaves,

        // Citação correta dos locatários baseada no gênero
        citacaoLocatarios,

        // Tipo de vistoria processado
        tipoVistoriaTexto,

        // Data da vistoria processada (baseada no tipo selecionado)
        dataVistoria,

        // Dados dos fiadores (convertidos para string)
        temFiadores: temFiadores ? 'true' : 'false',
        fiadores: JSON.stringify(fiadores),
      };

      // Aplicar anonimização se necessário
      const finalData = isPrivacyModeActive
        ? anonymizeContractData(enhancedData)
        : enhancedData;

      return finalData;
    },
    [contractData, isPrivacyModeActive]
  );

  return {
    getTemplate,
    handleGenerate,
  };
}
