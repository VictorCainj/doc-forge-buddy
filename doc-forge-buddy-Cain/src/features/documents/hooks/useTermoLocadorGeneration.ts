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
  generoLocatario?: string;
  nomesResumidosLocadores?: string;
  qualificacaoCompletaLocatarios?: string;
  qualificacaoCompletaLocadores?: string;
  celularLocatario?: string;
  emailLocatario?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  generoProprietario?: string;
  [key: string]: string | undefined;
}

export function useTermoLocadorGeneration(contractData: ContractData) {
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
TERMO DE RECEBIMENTO – {{numeroContrato}}
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: ${fontSize}px;">
{{textoEntregaChaves}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeProprietario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{tipoQuantidadeChaves}}
</div>

<div style="margin: 20px 0; font-size: ${fontSize}px;">
{{observacao}}
</div>

  <div style="margin-top: 50px; text-align: center;">
    <div style="margin-bottom: 40px;">
      __________________________________________<br>
      <span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
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
      const nomeProprietarioBase =
        contractData.nomesResumidosLocadores || contractData.nomeProprietario;

      // Detectar se há múltiplos proprietários baseado no gênero selecionado
      // Não usar mais detecção baseada em vírgulas ou "e" no nome
      const generoProprietario = contractData.generoProprietario;
      const isMultipleProprietarios =
        generoProprietario === 'masculinos' || generoProprietario === 'femininos';

      // Detectar múltiplos locatários
      const isMultipleLocatarios =
        contractData.primeiroLocatario &&
        (contractData.segundoLocatario ||
          contractData.terceiroLocatario ||
          contractData.quartoLocatario);

      // Definir termos baseados na quantidade e gênero do locador
      let locadorTerm: string;
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

      // Definir título dos dados do locatário conforme quantidade e gênero
      let dadosLocatarioTitulo: string;
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

      // Processar quantidade de chaves
      let tipoQuantidadeChaves = data.tipoQuantidadeChaves;
      if (data.usarQuantidadeChavesContrato === 'sim') {
        tipoQuantidadeChaves =
          contractData.quantidadeChaves || data.tipoQuantidadeChaves;
      }

      // Processar observação
      const observacao =
        data.observacao && data.observacao.trim() !== ''
          ? `OBS: ${data.observacao}`
          : '';

      // Texto de entrega de chaves para termo do locador
      const tipoContrato = data.tipoContrato || 'residencial';
      const qualificacaoCompleta =
        data.qualificacaoCompleta ||
        contractData.qualificacaoCompletaLocadores ||
        nomeProprietarioBase;
      const textoEntregaChaves = `${
        isMultipleProprietarios ? 'Pelo presente, entregamos as chaves do' : 'Pelo presente, entrego as chaves do'
      } imóvel sito à ${contractData.enderecoImovel}.`;

      const celularLocatario =
        contractData.celularLocatario || data.celularLocatario || '';
      const emailLocatario = contractData.emailLocatario || data.emailLocatario || '';

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
      
      // Formatar nome do proprietário também com formatação convencional
      const nomesProprietarioArray = splitNames(nomeProprietarioBase || '');
      const nomeProprietarioFormatado = nomesProprietarioArray.length > 0
        ? formatNamesList(nomesProprietarioArray)
        : nomeProprietarioBase || '';

      let nomeQuemRetira = data.nomeQuemRetira || nomeProprietarioBase || '';
      if (data.incluirNomeCompleto === 'todos') {
        nomeQuemRetira = nomeProprietarioBase;
      } else if (
        data.incluirNomeCompleto &&
        data.incluirNomeCompleto.trim() !== '' &&
        data.incluirNomeCompleto !== 'custom'
      ) {
        nomeQuemRetira = data.incluirNomeCompleto;
      }

      if (!nomeQuemRetira) {
        nomeQuemRetira = nomeProprietarioBase || contractData.nomeProprietario;
      }

      const enhancedData = {
        ...data,
        ...contractData,

        // Dados específicos do termo do locador
        locadorTerm,
        dadosLocatarioTitulo,
        nomeProprietario: nomeProprietarioFormatado,
        nomeLocatario: nomeLocatarioFormatado,
        nomeQuemRetira,
        tipoQuantidadeChaves,
        celularLocatario,
        emailLocatario,
        qualificacaoCompleta: qualificacaoCompleta || '',

        // Processar observação
        observacao,

        // Texto de entrega de chaves
        textoEntregaChaves,
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
