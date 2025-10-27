import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentFormWizard from '../components/DocumentFormWizard';
import {
  Search,
  ArrowLeft,
  FileText,
  User,
  User2,
  MapPin,
  Key,
} from '@/utils/iconMapper';
import { FormStep } from '../hooks/use-form-wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { splitNames } from '@/utils/nameHelpers';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  [key: string]: string;
}

const TermoLocador: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractData = location.state?.contractData as ContractData;

  // Estado para gerenciar auto-preenchimento
  const [autoFillData, setAutoFillData] = React.useState<
    Record<string, string>
  >({});

  if (!contractData?.numeroContrato) {
    navigate('/contratos');
    return null;
  }

  // Debug: verificar dados do contrato
  // console.log('Dados do contrato no TermoLocador:', contractData);
  // console.log('Quantidade de chaves:', contractData.quantidadeChaves);

  // Função para detectar múltiplos proprietários baseado na quantidade adicionada
  const _isMultipleProprietarios = (nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return nomeProprietario.includes(' e ');
  };

  const steps: FormStep[] = [
    {
      id: 'vistoria',
      title: 'Vistoria e Entrega',
      description: 'Detalhes da vistoria e entrega das chaves',
      icon: Search,
      fields: [
        {
          name: 'nomeQuemRetira',
          label: 'Nome de Quem Retira a Chave',
          type: 'text',
          required: true,
          placeholder: 'Digite o nome completo',
        },
        {
          name: 'incluirNomeCompleto',
          label: 'Quem está retirando as chaves',
          type: 'select',
          required: false,
          placeholder: 'Selecione uma opção',
          options: [
            { value: 'todos', label: 'Todos os locadores' },
            ...(contractData.nomesResumidosLocadores ||
            contractData.nomeProprietario
              ? splitNames(
                  contractData.nomesResumidosLocadores ||
                    contractData.nomeProprietario
                )
                  .filter((nome) => nome && nome.length > 2)
                  .map((nome) => ({
                    value: nome,
                    label: nome,
                  }))
              : []),
          ],
        },
        {
          name: 'usarQuantidadeChavesContrato',
          label: 'Selecionar chaves entregues no início da locação',
          type: 'select',
          required: false,
          placeholder: 'Selecione uma opção',
          options: [
            { value: 'nao', label: 'Não - Digitar manualmente' },
            {
              value: 'sim',
              label:
                contractData.quantidadeChaves &&
                contractData.quantidadeChaves !== ''
                  ? `Sim - Todas as chaves: ${contractData.quantidadeChaves}`
                  : 'Sim - Usar quantidade do contrato',
            },
          ],
        },
        {
          name: 'tipoQuantidadeChaves',
          label:
            'Tipo e Quantidade de Chaves (se não selecionou usar do contrato)',
          type: 'textarea',
          required: false,
          placeholder: 'Ex: 04 chaves simples, 02 chaves tetra',
          conditional: {
            field: 'usarQuantidadeChavesContrato',
            value: 'nao',
          },
        },
        {
          name: 'assinanteSelecionado',
          label: 'Assinante do Termo',
          type: 'select',
          required: true,
          placeholder: 'Selecione quem irá assinar o termo',
          options: [
            { value: 'VICTOR CAIN JORGE', label: 'Victor Cain Jorge' },
            {
              value: 'FABIANA SALOTTI MARTINS',
              label: 'Fabiana Salotti Martins',
            },
          ],
        },
        {
          name: 'observacao',
          label: 'Observação (Opcional)',
          type: 'textarea',
          required: false,
          placeholder: 'Digite observações adicionais se necessário',
        },
      ],
    },
  ];

  const getCurrentDate = () => {
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
  };

  const getTemplate = (fontSize: number) => {
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
<strong>{{dadosLocatarioTitulo}}:</strong> {{nomeLocatario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
{{tipoQuantidadeChaves}}
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
`;
  };

  const handleGenerate = (data: Record<string, string>) => {
    // Detectar se há múltiplos proprietários
    const nomeProprietario =
      contractData.nomesResumidosLocadores || contractData.nomeProprietario;
    const isMultipleProprietarios =
      nomeProprietario &&
      (nomeProprietario.includes(',') ||
        nomeProprietario.includes(' e ') ||
        nomeProprietario.includes(' E '));

    // Detectar se há múltiplos locatários baseado no nome dos locatários
    const nomeLocatario = contractData.nomeLocatario || '';
    const isMultipleLocatarios =
      nomeLocatario &&
      (nomeLocatario.includes(',') ||
        nomeLocatario.includes(' e ') ||
        nomeLocatario.includes(' E '));

    // Definir termo do locador baseado na quantidade e gênero
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

    // Definir título baseado na quantidade e gênero dos locatários
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

    // Processar nome de quem retira baseado na opção selecionada
    let nomeQuemRetira = data.nomeQuemRetira;
    if (data.incluirNomeCompleto === 'todos') {
      nomeQuemRetira = nomeProprietario;
    } else if (data.incluirNomeCompleto && data.incluirNomeCompleto !== '') {
      // Se selecionou um proprietário específico
      nomeQuemRetira = data.incluirNomeCompleto;
    }

    // Processar quantidade de chaves baseado na opção selecionada
    let tipoQuantidadeChaves = data.tipoQuantidadeChaves;
    if (data.usarQuantidadeChavesContrato === 'sim') {
      // Se selecionou usar do contrato, usar sempre a quantidade do contrato
      tipoQuantidadeChaves =
        contractData.quantidadeChaves || data.tipoQuantidadeChaves;
      // console.log(
      //   'Usando quantidade de chaves do contrato:',
      //   contractData.quantidadeChaves
      // );
    } else {
      // Se não selecionou, usar o que foi digitado manualmente
      tipoQuantidadeChaves = data.tipoQuantidadeChaves;
      // console.log(
      //   'Usando quantidade de chaves digitada manualmente:',
      //   data.tipoQuantidadeChaves
      // );
    }

    // Processar observação (só mostra se preenchida)
    const observacao =
      data.observacao && data.observacao.trim() !== ''
        ? `OBS: ${data.observacao}`
        : '';

    // Texto de entrega de chaves para termo do locador (simplificado)
    const textoEntregaChaves = `Pelo presente, entrego as chaves do imóvel sito à ${contractData.enderecoImovel}.`;

    // Aplicar formatação de nomes - sem negrito para o proprietário
    const nomeProprietarioFormatado =
      contractData.nomesResumidosLocadores || contractData.nomeProprietario; // Sem negrito

    const enhancedData = {
      ...contractData,
      ...data,

      // Dados específicos do termo do locador - devem vir por último para sobrescrever
      locadorTerm,
      dadosLocatarioTitulo,
      nomeQuemRetira,
      nomeProprietario: nomeProprietarioFormatado, // Nome formatado
      tipoQuantidadeChaves, // Quantidade de chaves processada

      // Processar observação
      observacao,

      // Texto de entrega de chaves com qualificações dos locatários
      textoEntregaChaves,
    };

    return enhancedData;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Minimalista */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/contratos')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="h-6 w-px bg-neutral-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight mb-1">
                    Termo de Recebimento de Chaves
                  </h1>
                  <p className="text-base text-neutral-600">
                    Preencha os dados para gerar o termo do locador
                  </p>
                </div>
              </div>
            </div>

            {/* Informações do Contrato */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-neutral-100 to-white border border-neutral-200 shadow-sm">
                <FileText className="h-5 w-5 text-neutral-700" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-900">
                  Contrato {contractData.numeroContrato}
                </p>
                <p className="text-xs text-neutral-600">
                  {contractData.enderecoImovel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar com Informações do Contrato */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Informações do Contrato */}
                <Card className="bg-white border-neutral-300 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="p-2 rounded-lg bg-black"
                        style={{
                          imageRendering: 'crisp-edges',
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        <FileText
                          className="h-4 w-4 text-white"
                          color="#FFFFFF"
                          strokeWidth={2.5}
                          style={{
                            color: '#FFFFFF',
                            stroke: '#FFFFFF',
                            fill: 'none',
                            shapeRendering: 'geometricPrecision',
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-black">
                          Contrato{' '}
                          <span className="font-mono text-xl text-primary-600">
                            {contractData.numeroContrato}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">
                          {contractData.dataFirmamentoContrato}
                        </p>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-neutral-300 mb-4"></div>

                    {/* PARTES ENVOLVIDAS */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
                        Partes Envolvidas
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div
                            className="p-1.5 rounded-md bg-black"
                            style={{
                              imageRendering: 'crisp-edges',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <User
                              className="h-3 w-3 text-white"
                              color="#FFFFFF"
                              strokeWidth={2.5}
                              style={{
                                color: '#FFFFFF',
                                stroke: '#FFFFFF',
                                fill: 'none',
                                shapeRendering: 'geometricPrecision',
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-black uppercase tracking-wide">
                              Proprietário
                            </p>
                            <p className="text-sm font-semibold text-gray-600 truncate leading-tight">
                              {contractData.nomeProprietario}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div
                            className="p-1.5 rounded-md bg-black"
                            style={{
                              imageRendering: 'crisp-edges',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <User2
                              className="h-3 w-3 text-white"
                              color="#FFFFFF"
                              strokeWidth={2.5}
                              style={{
                                color: '#FFFFFF',
                                stroke: '#FFFFFF',
                                fill: 'none',
                                shapeRendering: 'geometricPrecision',
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-black uppercase tracking-wide">
                              Locatário
                            </p>
                            <p className="text-sm font-semibold text-gray-600 truncate leading-tight">
                              {contractData.nomeLocatario}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LOCALIZAÇÃO */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
                        Localização
                      </h4>
                      <div className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
                        <div
                          className="p-1 rounded bg-black"
                          style={{
                            imageRendering: 'crisp-edges',
                            backfaceVisibility: 'hidden',
                          }}
                        >
                          <MapPin
                            className="h-3 w-3 text-white"
                            color="#FFFFFF"
                            strokeWidth={2.5}
                            style={{
                              color: '#FFFFFF',
                              stroke: '#FFFFFF',
                              fill: 'none',
                              shapeRendering: 'geometricPrecision',
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-black uppercase tracking-wide">
                            Endereço
                          </p>
                          <p className="text-sm font-medium text-gray-600 line-clamp-2 leading-relaxed">
                            {contractData.enderecoImovel}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CHAVES */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
                        Chaves
                      </h4>
                      <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                        <div
                          className="p-1 rounded bg-black"
                          style={{
                            imageRendering: 'crisp-edges',
                            backfaceVisibility: 'hidden',
                          }}
                        >
                          <Key
                            className="h-3 w-3 text-white"
                            color="#FFFFFF"
                            strokeWidth={2.5}
                            style={{
                              color: '#FFFFFF',
                              stroke: '#FFFFFF',
                              fill: 'none',
                              shapeRendering: 'geometricPrecision',
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-black uppercase tracking-wide">
                            Quantidade
                          </p>
                          <p className="text-sm font-semibold text-gray-600">
                            {contractData.quantidadeChaves || 'Não informado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Formulário Principal */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-neutral-300 shadow-md">
                <CardContent className="p-0">
                  <DocumentFormWizard
                    title=""
                    description=""
                    steps={steps}
                    template=""
                    onGenerate={handleGenerate}
                    getTemplate={getTemplate}
                    contractData={contractData}
                    initialData={autoFillData}
                    onFormDataChange={setAutoFillData}
                    hideSaveButton={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermoLocador;
