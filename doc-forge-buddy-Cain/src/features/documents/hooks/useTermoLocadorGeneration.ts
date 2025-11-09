import { useCallback } from 'react';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  quantidadeChaves?: string;
  generoLocatario?: string;
  [key: string]: string | undefined;
}

export function useTermoLocadorGeneration(contractData: ContractData) {
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
TERMO DE ENTREGA DE CHAVES {{numeroContrato}}
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: ${fontSize}px;">
{{textoEntregaChaves}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeProprietario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>DADOS DO LOCATÁRIO:</strong> {{nomeLocatario}}<br>
<strong>Celular:</strong> {{celularLocatario}} &nbsp;&nbsp;&nbsp;&nbsp; <strong>E-mail:</strong> {{emailLocatario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{tipoQuantidadeChaves}}
</div>

<div style="margin: 20px 0; font-size: ${fontSize}px;">
{{observacao}}
</div>

  <div style="margin-top: 50px; text-align: center;">
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
      // Detectar se há múltiplos proprietários
      const isMultipleProprietarios = contractData.nomeProprietario.includes(' e ');

      // Definir termos baseados na quantidade
      let locadorTerm;
      if (isMultipleProprietarios) {
        locadorTerm = 'LOCADORES';
      } else {
        // Usar gênero neutro para locador
        locadorTerm = 'LOCADOR';
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
      const qualificacaoCompleta = data.qualificacaoCompleta || contractData.nomeProprietario;
      const textoEntregaChaves = `Pelo presente, entregamos as chaves do imóvel sito à ${contractData.enderecoImovel}, ora locado ${qualificacaoCompleta}, devidamente qualificado no contrato de locação ${tipoContrato} firmado em ${contractData.dataFirmamentoContrato}.`;

      const enhancedData = {
        ...data,
        ...contractData,

        // Dados específicos do termo do locador
        locadorTerm,
        nomeProprietario: contractData.nomeProprietario,
        nomeLocatario: contractData.nomeLocatario,
        tipoQuantidadeChaves,

        // Processar observação
        observacao,

        // Texto de entrega de chaves
        textoEntregaChaves,
      };

      return enhancedData;
    },
    [contractData]
  );

  return {
    getTemplate,
    handleGenerate,
  };
}
